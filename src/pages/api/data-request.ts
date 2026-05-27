import { json, badRequest, serverError } from "../../lib/server/http.ts";
import { getDatabase } from "../../lib/server/bindings.ts";
import { auditEvent } from "../../lib/server/audit.js";
import { z } from "zod";

const DataRequestSchema = z.object({
  email: z.string().email(),
  requestType: z.enum(["export", "delete"]),
  details: z.string().max(1000).optional()
});

export const prerender = false;

export async function POST({ request }: { request: Request }) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await request.json();
    } else {
      return badRequest("Invalid content type. Expected application/json.");
    }

    const parsed = DataRequestSchema.safeParse(data);
    if (!parsed.success) {
      return badRequest((parsed.error as any).errors[0]?.message || "Invalid payload.");
    }

    const db = getDatabase();

    // Stub implementation: Record the request for manual processing
    await auditEvent(db, request, {
      eventType: "popia.data_request",
      entityType: "user",
      entityId: parsed.data.email,
      outcome: "success",
      subject: parsed.data.email,
      metadata: { 
        requestType: parsed.data.requestType,
        details: parsed.data.details || null
      }
    });

    return json({
      ok: true,
      message: `Your ${parsed.data.requestType} request has been received and will be processed within 30 days as per POPIA guidelines.`
    });

  } catch (error) {
    console.error("POPIA data request failed", error);
    return serverError("Failed to process data request.");
  }
}
