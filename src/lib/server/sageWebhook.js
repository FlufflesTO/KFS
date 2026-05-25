/**
 * Sage Accounting Webhook Handler
 * 
 * Handles incoming webhooks from Sage Business Cloud Accounting API
 * to automatically reconcile payment statuses with portal financial records.
 * 
 * Features:
 * - HMAC signature verification for webhook authenticity
 * - Payment status reconciliation
 * - Invoice status updates
 * - Audit logging for all webhook events
 * - Idempotency handling (duplicate webhook prevention)
 * 
 * South African Context: Handles ZAR currency, SA VAT rates
 */

import { getDatabase } from './bindings.js';
import { logAuditEvent } from './audit.js';

const WEBHOOK_SECRET = process.env.SAGE_WEBHOOK_SECRET;
const SAGE_BASE_URL = process.env.SAGE_API_URL || 'https://api.accounting.sage.com/v3.1';

// ============================================================================
// WEBHOOK VERIFICATION
// ============================================================================

/**
 * Verify Sage webhook HMAC signature
 * Sage sends X-Signature header with HMAC-SHA256 of payload
 */
export function verifyWebhookSignature(payload, signature) {
  if (!WEBHOOK_SECRET) {
    console.error('[SAGE] Webhook secret not configured');
    return false;
  }

  if (!signature) {
    console.error('[SAGE] No signature provided');
    return false;
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(WEBHOOK_SECRET);
  const messageData = encoder.encode(payload);

  // Verify signature
  const expectedSignature = await crypto.subtle.sign(
    'HMAC',
    await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    messageData
  );

  const expectedHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return expectedHex === signature.toLowerCase();
}

/**
 * Check for duplicate webhook events (idempotency)
 */
async function isDuplicateEvent(eventId) {
  const db = getDatabase();
  const result = await db.prepare(`
    SELECT id FROM audit_events 
    WHERE event_type = 'sage_webhook' 
    AND metadata_json LIKE ?
  `).get(`%"eventId":"${eventId}"%`);

  return !!result;
}

// ============================================================================
// WEBHOOK EVENT HANDLERS
// ============================================================================

/**
 * Handle invoice.payment_received event
 */
async function handlePaymentReceived(data, eventId) {
  const db = getDatabase();
  
  const {
    invoice_id,
    payment_id,
    amount,
    currency,
    payment_date,
    reference
  } = data;

  console.log('[SAGE] Payment received:', { invoice_id, amount, currency });

  // Find matching financial record by Sage invoice number
  const record = await db.prepare(`
    SELECT id, site_id, job_id, sage_amount_inc_vat, payment_status
    FROM financial_records
    WHERE sage_invoice_number = ? AND item_type = 'Invoice'
  `).get(invoice_id);

  if (!record) {
    console.warn('[SAGE] No matching invoice found:', invoice_id);
    return { success: false, reason: 'invoice_not_found' };
  }

  // Validate amount matches
  const amountCents = Math.round(amount * 100);
  const amountMatches = amountCents === record.sage_amount_inc_vat;

  if (!amountMatches) {
    console.warn('[SAGE] Payment amount mismatch:', {
      expected: record.sage_amount_inc_vat,
      received: amountCents
    });
  }

  // Update financial record
  const updateResult = await db.prepare(`
    UPDATE financial_records
    SET 
      payment_status = 'Settled',
      finance_task_status = 'Paid in Sage',
      sage_payment_reference = ?,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(reference || payment_id, record.id);

  if (updateResult.changes > 0) {
    // Log audit event
    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook',
      entity_type: 'financial_record',
      entity_id: record.id,
      outcome: 'success',
      metadata_json: JSON.stringify({
        eventId,
        eventType: 'invoice.payment_received',
        invoice_id,
        payment_id,
        amount,
        currency,
        amountMatched: amountMatches
      })
    });

    console.log('[SAGE] Payment reconciled for invoice:', invoice_id);
    return { success: true, recordId: record.id };
  }

  return { success: false, reason: 'update_failed' };
}

/**
 * Handle invoice.created event
 */
async function handleInvoiceCreated(data, eventId) {
  const db = getDatabase();
  
  const {
    invoice_id,
    customer_id,
    amount_ex_vat,
    vat_amount,
    amount_inc_vat,
    due_date,
    status
  } = data;

  console.log('[SAGE] Invoice created:', invoice_id);

  // Find matching quote/proforma in portal
  const record = await db.prepare(`
    SELECT id, site_id, sage_quote_number
    FROM financial_records
    WHERE sage_quote_number IS NOT NULL
    AND finance_task_status IN ('Quote Approved', 'Approved - Sage Invoice Required')
    ORDER BY created_at DESC
    LIMIT 1
  `).get();

  if (!record) {
    console.warn('[SAGE] No matching quote for invoice:', invoice_id);
    return { success: false, reason: 'quote_not_found' };
  }

  // Update financial record with invoice details
  const updateResult = await db.prepare(`
    UPDATE financial_records
    SET 
      item_type = 'Invoice',
      sage_invoice_number = ?,
      sage_customer_code = ?,
      sage_amount_ex_vat = ?,
      sage_vat_amount = ?,
      sage_amount_inc_vat = ?,
      sage_due_date = ?,
      sage_document_date = strftime('%Y-%m-%d', 'now'),
      payment_status = 'Unpaid',
      finance_task_status = 'Sage Invoice Created',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE id = ?
  `).run(
    invoice_id,
    customer_id,
    Math.round(amount_ex_vat * 100),
    Math.round(vat_amount * 100),
    Math.round(amount_inc_vat * 100),
    due_date,
    record.id
  );

  if (updateResult.changes > 0) {
    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook',
      entity_type: 'financial_record',
      entity_id: record.id,
      outcome: 'success',
      metadata_json: JSON.stringify({
        eventId,
        eventType: 'invoice.created',
        invoice_id,
        customer_id
      })
    });

    console.log('[SAGE] Invoice linked to record:', record.id);
    return { success: true, recordId: record.id };
  }

  return { success: false, reason: 'update_failed' };
}

/**
 * Handle invoice.updated event
 */
async function handleInvoiceUpdated(data, eventId) {
  const db = getDatabase();
  
  const {
    invoice_id,
    status,
    amount_inc_vat,
    due_date
  } = data;

  console.log('[SAGE] Invoice updated:', invoice_id, status);

  const updateResult = await db.prepare(`
    UPDATE financial_records
    SET 
      sage_amount_inc_vat = ?,
      sage_due_date = ?,
      payment_status = CASE 
        WHEN ? = 'void' THEN 'Cancelled'
        WHEN ? = 'authorised' THEN 'Unpaid'
        ELSE payment_status
      END,
      finance_task_status = CASE
        WHEN ? = 'void' THEN 'Cancelled'
        WHEN ? = 'authorised' THEN 'Sage Invoice Sent'
        ELSE finance_task_status
      END,
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE sage_invoice_number = ?
  `).run(
    amount_inc_vat ? Math.round(amount_inc_vat * 100) : null,
    due_date,
    status,
    status,
    status,
    status,
    invoice_id
  );

  if (updateResult.changes > 0) {
    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook',
      entity_type: 'financial_record',
      entity_id: updateResult.lastInsertRowid?.toString() || 'unknown',
      outcome: 'success',
      metadata_json: JSON.stringify({
        eventId,
        eventType: 'invoice.updated',
        invoice_id,
        status
      })
    });

    return { success: true };
  }

  return { success: false, reason: 'no_matching_record' };
}

/**
 * Handle quote.accepted event
 */
async function handleQuoteAccepted(data, eventId) {
  const db = getDatabase();
  
  const {
    quote_id,
    customer_id,
    accepted_date
  } = data;

  console.log('[SAGE] Quote accepted:', quote_id);

  const updateResult = await db.prepare(`
    UPDATE financial_records
    SET 
      finance_task_status = 'Quote Approved',
      payment_status = 'Pending Approval',
      updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    WHERE sage_quote_number = ?
  `).run(quote_id);

  if (updateResult.changes > 0) {
    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook',
      entity_type: 'financial_record',
      entity_id: updateResult.lastInsertRowid?.toString() || 'unknown',
      outcome: 'success',
      metadata_json: JSON.stringify({
        eventId,
        eventType: 'quote.accepted',
        quote_id,
        customer_id,
        accepted_date
      })
    });

    return { success: true };
  }

  return { success: false, reason: 'quote_not_found' };
}

// ============================================================================
// MAIN WEBHOOK PROCESSOR
// ============================================================================

/**
 * Process incoming Sage webhook
 * 
 * Expected payload structure:
 * {
 *   "event_id": "evt_xxx",
 *   "event_type": "invoice.payment_received",
 *   "occurred_at": "2024-01-15T10:30:00Z",
 *   "data": { ... }
 * }
 */
export async function processSageWebhook(payload, headers) {
  const signature = headers.get('x-signature') || headers.get('X-Signature');
  
  // Verify signature
  if (!verifyWebhookSignature(payload, signature)) {
    console.error('[SAGE] Invalid webhook signature');
    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook_blocked',
      entity_type: 'webhook',
      entity_id: 'unknown',
      outcome: 'blocked',
      metadata_json: JSON.stringify({ reason: 'invalid_signature' })
    });
    return {
      statusCode: 401,
      body: { error: 'Invalid signature' }
    };
  }

  let eventData;
  try {
    eventData = JSON.parse(payload);
  } catch (error) {
    console.error('[SAGE] Invalid JSON payload:', error);
    return {
      statusCode: 400,
      body: { error: 'Invalid JSON' }
    };
  }

  const { event_id, event_type, occurred_at, data } = eventData;

  // Check for duplicates
  if (await isDuplicateEvent(event_id)) {
    console.log('[SAGE] Duplicate event ignored:', event_id);
    return {
      statusCode: 200,
      body: { success: true, message: 'Duplicate event ignored' }
    };
  }

  console.log('[SAGE] Processing webhook:', event_type, event_id);

  // Route to appropriate handler
  let result;
  switch (event_type) {
    case 'invoice.payment_received':
      result = await handlePaymentReceived(data, event_id);
      break;
    case 'invoice.created':
      result = await handleInvoiceCreated(data, event_id);
      break;
    case 'invoice.updated':
      result = await handleInvoiceUpdated(data, event_id);
      break;
    case 'quote.accepted':
      result = await handleQuoteAccepted(data, event_id);
      break;
    default:
      console.log('[SAGE] Unhandled event type:', event_type);
      result = { success: true, message: 'Event type not handled' };
  }

  if (result.success) {
    return {
      statusCode: 200,
      body: { success: true, ...result }
    };
  } else {
    return {
      statusCode: result.reason === 'invoice_not_found' ? 404 : 200,
      body: { success: false, reason: result.reason }
    };
  }
}

// ============================================================================
// OUTBOUND SYNC UTILITIES
// ============================================================================

/**
 * Fetch pending invoices from Sage for reconciliation
 * Used for initial sync or recovery after downtime
 */
export async function syncInvoicesFromSage(sinceDate = null) {
  const db = getDatabase();
  const apiUrl = sinceDate 
    ? `${SAGE_BASE_URL}/invoices?modified_since=${sinceDate}`
    : `${SAGE_BASE_URL}/invoices`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.SAGE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sage API error: ${response.status}`);
    }

    const invoices = await response.json();

    for (const invoice of invoices) {
      await db.prepare(`
        INSERT OR REPLACE INTO financial_records (
          id, site_id, item_type, sage_invoice_number,
          sage_amount_ex_vat, sage_vat_amount, sage_amount_inc_vat,
          sage_due_date, payment_status, finance_task_status,
          updated_at
        ) VALUES (
          lower(hex(randomblob(16))),
          (SELECT id FROM sites LIMIT 1),
          'Invoice',
          ?,
          ?, ?, ?,
          ?,
          CASE WHEN invoice.status = 'paid' THEN 'Settled' ELSE 'Unpaid' END,
          'Sage Invoice Created',
          strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        )
      `).run(
        invoice.invoice_id,
        Math.round(invoice.net_amount * 100),
        Math.round(invoice.total_tax * 100),
        Math.round(invoice.gross_amount * 100),
        invoice.due_date
      );
    }

    console.log('[SAGE] Synced', invoices.length, 'invoices');
    return { success: true, count: invoices.length };
  } catch (error) {
    console.error('[SAGE] Sync failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch payments from Sage for reconciliation
 */
export async function syncPaymentsFromSage(sinceDate = null) {
  const db = getDatabase();
  const apiUrl = sinceDate 
    ? `${SAGE_BASE_URL}/payments?modified_since=${sinceDate}`
    : `${SAGE_BASE_URL}/payments`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.SAGE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Sage API error: ${response.status}`);
    }

    const payments = await response.json();

    for (const payment of payments) {
      const invoiceRecord = await db.prepare(`
        SELECT id FROM financial_records
        WHERE sage_invoice_number = ?
      `).get(payment.invoice_id);

      if (invoiceRecord) {
        await db.prepare(`
          UPDATE financial_records
          SET 
            payment_status = 'Settled',
            finance_task_status = 'Paid in Sage',
            sage_payment_reference = ?,
            updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = ?
        `).run(payment.reference, invoiceRecord.id);
      }
    }

    console.log('[SAGE] Synced', payments.length, 'payments');
    return { success: true, count: payments.length };
  } catch (error) {
    console.error('[SAGE] Payment sync failed:', error);
    return { success: false, error: error.message };
  }
}

export default {
  processSageWebhook,
  verifyWebhookSignature,
  syncInvoicesFromSage,
  syncPaymentsFromSage
};
