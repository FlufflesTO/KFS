/**
 * Sage Webhook API Endpoint
 * 
 * Receives webhooks from Sage Business Cloud Accounting
 * and reconciles payment/invoice status with portal records.
 * 
 * Security: HMAC signature verification required
 */

import { processSageWebhook } from '../../lib/server/sageWebhook.js';
import { logAuditEvent } from '../../lib/server/audit.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const headers = request.headers;

    // Process webhook
    const result = await processSageWebhook(rawBody, headers);

    return new Response(JSON.stringify(result.body), {
      status: result.statusCode,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('[SAGE WEBHOOK] Error processing webhook:', error);

    await logAuditEvent({
      actor_user_id: null,
      actor_role: 'system',
      event_type: 'sage_webhook_error',
      entity_type: 'webhook',
      entity_id: 'unknown',
      outcome: 'failure',
      metadata_json: JSON.stringify({
        error: error.message,
        stack: error.stack?.slice(0, 500)
      })
    });

    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

// GET endpoint for testing webhook connectivity
export async function GET() {
  return new Response(JSON.stringify({
    status: 'ok',
    message: 'Sage webhook endpoint is active',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
