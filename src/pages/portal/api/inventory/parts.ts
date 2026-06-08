/**
 * Project Sentinel - Inventory Parts API
 * Purpose: Allows technicians and administrators to retrieve and allocate parts inventory
 * Dependencies: getDatabase
 * Structural Role: REST API endpoint for inventory management
 */
import { getDatabase } from "../../../../lib/server/bindings";

export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get('jobId');
  const technicianId = url.searchParams.get('technicianId');
  
  try {
    const db = getDatabase();
    
    let query = `SELECT p.*, ip.quantity_available, ip.location FROM parts p`;
    const params: string[] = [];
    
    if (jobId) {
      // Get parts required for a specific job
      query += ` JOIN job_parts_required jpr ON p.id = jpr.part_id WHERE jpr.job_id = ?`;
      params.push(jobId);
    } else if (technicianId) {
      // Get parts available for a technician
      query += ` JOIN inventory_parts ip ON p.id = ip.part_id WHERE ip.technician_id = ?`;
      params.push(technicianId);
    } else {
      // Get all parts with inventory status
      query += ` LEFT JOIN inventory_parts ip ON p.id = ip.part_id`;
    }
    
    const parts = await db.prepare(query).bind(...params).all();
    
    return new Response(
      JSON.stringify({ success: true, parts: parts.results || [] }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parts inventory fetch failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch parts inventory" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get("Content-Type");
    if (!contentType?.includes("application/json")) {
      return new Response(
        JSON.stringify({ error: "Invalid content type" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const { action, partId, quantity, jobId, technicianId } = body;
    
    if (!action || !partId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const db = getDatabase();
    
    switch (action) {
      case 'allocate':
        if (!quantity || !jobId) {
          return new Response(
            JSON.stringify({ error: "Allocation requires quantity and jobId" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Check if enough parts are available
        const partInventory = (await db.prepare(
          `SELECT quantity_available FROM inventory_parts WHERE part_id = ? AND technician_id = ?`
        ).bind(partId, technicianId).first()) as { quantity_available: number } | null;
        
        if (!partInventory || partInventory.quantity_available < quantity) {
          return new Response(
            JSON.stringify({ error: "Insufficient parts available" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        
        // Allocate parts to job
        await db.prepare(
          `UPDATE inventory_parts 
           SET quantity_available = quantity_available - ?1,
               quantity_allocated = quantity_allocated + ?1
           WHERE part_id = ?2 AND technician_id = ?3`
        ).bind(quantity, partId, technicianId).run();
        
        // Record allocation
        await db.prepare(
          `INSERT INTO job_part_allocations (job_id, part_id, quantity, allocated_at, allocated_by_technician_id)
           VALUES (?1, ?2, ?3, datetime('now'), ?4)`
        ).bind(jobId, partId, quantity, technicianId).run();
        
        break;
        
      case 'deallocate':
        // Deallocate parts from job
        await db.prepare(
          `UPDATE inventory_parts 
           SET quantity_available = quantity_available + ?1,
               quantity_allocated = quantity_allocated - ?1
           WHERE part_id = ?2 AND technician_id = ?3`
        ).bind(quantity, partId, technicianId).run();
        
        // Remove allocation record
        await db.prepare(
          `DELETE FROM job_part_allocations 
           WHERE job_id = ?1 AND part_id = ?2 AND allocated_by_technician_id = ?3`
        ).bind(jobId, partId, technicianId).run();
        
        break;
        
      case 'add':
        // Add new parts to technician inventory
        await db.prepare(
          `INSERT INTO inventory_parts (part_id, technician_id, quantity_available, quantity_allocated, location)
           VALUES (?1, ?2, ?3, 0, ?4)
           ON CONFLICT(part_id, technician_id) 
           DO UPDATE SET quantity_available = quantity_available + ?3`
        ).bind(partId, technicianId, quantity, body.location || 'warehouse').run();
        
        break;
        
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
    
    return new Response(
      JSON.stringify({ success: true, action, partId }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parts inventory update failed:", error);
    return new Response(
      JSON.stringify({ error: "Parts inventory update failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
