/**
 * Project Sentinel - Sage Accounting API Client
 * Purpose: Strongly-typed client for interacting with Sage Business Cloud Accounting API v3.1
 * Dependencies: cloudflare:workers, Astro, sqlite (D1)
 * Structural Role: Service Layer
 */

import { getValidSageToken } from '../sage.js';
import type { D1Database } from '@cloudflare/workers-types';

export interface SageContact {
    id: string;
    displayed_as: string;
    reference?: string;
}

export interface SageDocument {
    id: string;
    displayed_as: string;
}

export class SageClient {
    private db: D1Database;
    private env: Record<string, unknown>;
    private baseUrl = 'https://api.accounting.sage.com/v3.1';

    constructor(db: D1Database, env: Record<string, unknown>) {
        this.db = db;
        this.env = env;
    }

    /**
     * Internal request method to handle Auth and JSON parsing
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await getValidSageToken(this.db, this.env);
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Accept', 'application/json');
        
        if (options.method && options.method !== 'GET') {
            headers.set('Content-Type', 'application/json');
        }

        const response = await fetch(url, { ...options, headers });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Sage API Error [${response.status}] at ${endpoint}: ${errorText}`);
        }
        
        return response.json() as Promise<T>;
    }

    /**
     * Search for a contact by exact or partial name
     */
    async searchContacts(name: string): Promise<SageContact | null> {
        try {
            const data = await this.request<{ $items: SageContact[] }>(`/contacts?search=${encodeURIComponent(name)}&items_per_page=1`);
            return data.$items.length > 0 ? data.$items[0] : null;
        } catch (error) {
            console.error("SageClient: Error searching contacts", error);
            throw error;
        }
    }

    /**
     * Create a new Customer Contact
     */
    async createContact(name: string): Promise<SageContact> {
        const payload = {
            contact: {
                name: name,
                contact_type_ids: ['CUSTOMER']
            }
        };
        const data = await this.request<SageContact>('/contacts', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return data;
    }

    /**
     * Retrieve the first available Sales Ledger Account to use as a fallback
     */
    private async getDefaultSalesLedgerId(): Promise<string> {
        // Usually 4000 in UK/ZA but we'll fetch one dynamically based on category
        const data = await this.request<{ $items: { id: string }[] }>('/ledger_accounts?visible_in=sales&items_per_page=1');
        if (data.$items.length === 0) {
            throw new Error("No valid sales ledger accounts found in Sage.");
        }
        return data.$items[0].id;
    }

    /**
     * Retrieve the Standard Tax Rate ID
     */
    private async getStandardTaxRateId(): Promise<string | undefined> {
        const data = await this.request<{ $items: { id: string }[] }>('/tax_rates?attributes=standard&items_per_page=1');
        return data.$items.length > 0 ? data.$items[0].id : undefined;
    }

    /**
     * Creates a Sales Invoice in DRAFT status
     */
    async createSalesInvoice(contactId: string, description: string, amountExVat: number, vatAmount: number): Promise<SageDocument> {
        const netAmount = (amountExVat / 100).toFixed(2);
        const taxAmount = (vatAmount / 100).toFixed(2);
        
        const ledgerId = await this.getDefaultSalesLedgerId();
        const taxRateId = await this.getStandardTaxRateId();

        const payload = {
            sales_invoice: {
                contact_id: contactId,
                date: new Date().toISOString().split('T')[0],
                status_id: 'DRAFT',
                invoice_lines: [
                    {
                        description: description,
                        ledger_account_id: ledgerId,
                        quantity: 1,
                        unit_price: netAmount,
                        tax_amount: taxAmount,
                        net_amount: netAmount,
                        // Ensure tax rate is provided if we found one
                        ...(taxRateId ? { tax_rate_id: taxRateId } : {})
                    }
                ]
            }
        };

        const data = await this.request<SageDocument>('/sales_invoices', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return data;
    }

    /**
     * Creates a Sales Quote in DRAFT status
     */
    async createSalesQuote(contactId: string, description: string, amountExVat: number, vatAmount: number): Promise<SageDocument> {
        const netAmount = (amountExVat / 100).toFixed(2);
        const taxAmount = (vatAmount / 100).toFixed(2);
        
        const ledgerId = await this.getDefaultSalesLedgerId();
        const taxRateId = await this.getStandardTaxRateId();

        const payload = {
            sales_quote: {
                contact_id: contactId,
                date: new Date().toISOString().split('T')[0],
                status_id: 'DRAFT',
                quote_lines: [
                    {
                        description: description,
                        ledger_account_id: ledgerId,
                        quantity: 1,
                        unit_price: netAmount,
                        tax_amount: taxAmount,
                        net_amount: netAmount,
                        ...(taxRateId ? { tax_rate_id: taxRateId } : {})
                    }
                ]
            }
        };

        const data = await this.request<SageDocument>('/sales_quotes', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return data;
    }
}
