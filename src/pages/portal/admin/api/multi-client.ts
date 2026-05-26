import { getDatabase } from "../../../../lib/server/bindings";
import { requireAdmin } from "../../../../lib/server/admin";
import { json, badRequest, serverError, methodNotAllowed } from "../../../../lib/server/http";

export const prerender = false;

export async function GET({ request, locals }: { request: Request, locals: App.Locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();
  
  try {
    // Get all clients with their associated sites and systems
    const clients = await db.prepare(`
      SELECT 
        c.id,
        c.company_name,
        c.contact_person,
        c.contact_email,
        c.contact_phone,
        c.billing_address,
        COUNT(si.id) as site_count,
        COUNT(s.id) as system_count,
        COUNT(j.id) as job_count,
        COUNT(fr.id) as finance_record_count
      FROM clients c
      LEFT JOIN sites si ON si.owner_company_name = c.company_name
      LEFT JOIN systems s ON s.site_id = si.id
      LEFT JOIN jobs j ON j.system_id = s.id
      LEFT JOIN financial_records fr ON fr.site_id = si.id
      WHERE c.deleted_at IS NULL
      GROUP BY c.id, c.company_name
      ORDER BY c.company_name ASC
    `).all();

    return json({ 
      success: true, 
      clients: clients.results || [] 
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return serverError("Failed to fetch clients");
  }
}

export async function POST({ request, locals }: { request: Request, locals: App.Locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.companyName) {
      return badRequest("Company name is required");
    }
    
    // Create client
    const clientId = `cl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    await db.prepare(`
      INSERT INTO clients (id, company_name, contact_person, contact_email, contact_phone, billing_address)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    `).bind(
      clientId,
      body.companyName,
      body.contactPerson || null,
      body.contactEmail || null,
      body.contactPhone || null,
      body.billingAddress || null
    ).run();
    
    return json({ 
      success: true, 
      clientId,
      message: "Client created successfully"
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return serverError("Failed to create client");
  }
}

export async function PUT({ request, locals }: { request: Request, locals: App.Locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();
  
  try {
    const body = await request.json();
    const clientId = body.clientId || body.id;
    const updates = body;
    
    if (!clientId) {
      return badRequest("Client ID is required");
    }
    
    // Update client
    await db.prepare(`
      UPDATE clients
      SET company_name = ?1, contact_person = ?2, contact_email = ?3, 
          contact_phone = ?4, billing_address = ?5, updated_at = datetime('now')
      WHERE id = ?6
    `).bind(
      updates.companyName || null,
      updates.contactPerson || null,
      updates.contactEmail || null,
      updates.contactPhone || null,
      updates.billingAddress || null,
      clientId
    ).run();
    
    return json({ 
      success: true,
      message: "Client updated successfully"
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return serverError("Failed to update client");
  }
}

export async function DELETE({ request, locals }: { request: Request, locals: App.Locals }) {
  const adminError = requireAdmin(locals.user);
  if (adminError) return adminError;

  const db = getDatabase();
  
  try {
    const url = new URL(request.url);
    const clientId = url.searchParams.get('id');
    
    if (!clientId) {
      return badRequest("Client ID is required");
    }
    
    // Soft delete client (update deleted_at instead of removing)
    await db.prepare(`
      UPDATE clients
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?1
    `).bind(clientId).run();
    
    return json({ 
      success: true,
      message: "Client deactivated successfully"
    });
  } catch (error) {
    console.error("Error deactivating client:", error);
    return serverError("Failed to deactivate client");
  }
}

export function ALL(): Response {
  return methodNotAllowed(["GET", "POST", "PUT", "DELETE"]);
}
