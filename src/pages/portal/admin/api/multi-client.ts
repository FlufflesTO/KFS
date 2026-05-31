// Removed unused import: import type { APIContext } from "astro";
import { getDatabase } from "../../../../lib/server/bindings.js";

export const prerender = false;

export async function GET({}: { request: Request, locals: App.Locals }) {
  try {
    const db = getDatabase();
    
    const clients = await db.prepare(`
      SELECT id, company_name, contact_person, email, phone, address, created_at, updated_at
      FROM clients
      ORDER BY company_name
    `).all();

    return new Response(
      JSON.stringify({
        ok: true,
        clients: clients.results
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Multi-client API error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        message: "Failed to retrieve clients"
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}

export function ALL(): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      message: "Method not allowed"
    }),
    {
      status: 405,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}
