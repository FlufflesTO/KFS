export const prerender = false;

export async function POST({ locals, request }) {
  const user = locals.user;
  if (!user || user.role !== "tech") {
    return new Response(JSON.stringify({ ok: false, message: "Unauthorized." }), { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, message: "Invalid JSON." }), { status: 400 });
  }

  const { action, jobId } = body;
  if (!action || !jobId) {
    return new Response(JSON.stringify({ ok: false, message: "Action and jobId are required." }), { status: 400 });
  }

  if (action === "logArrival") {
    const { visitDate, arrivalAt, gpsLat, gpsLng, customerName, customerTitle, notes } = body;
    if (!visitDate || !arrivalAt) {
      return new Response(JSON.stringify({ ok: false, message: "Visit date and arrival time are required." }), { status: 400 });
    }

    try {
      const db = (await import("../../../lib/server/bindings.js")).getDatabase();
      const jobCheck = await db.prepare(
        `SELECT id, assigned_technician_id FROM jobs WHERE id = ?1`
      ).bind(jobId).get();

      if (!jobCheck) {
        return new Response(JSON.stringify({ ok: false, message: "Job not found." }), { status: 404 });
      }
      if (jobCheck.assigned_technician_id !== user.id) {
        return new Response(JSON.stringify({ ok: false, message: "Not assigned to this job." }), { status: 403 });
      }

      const visitId = `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.prepare(
        `INSERT INTO job_visits (
          id, job_id, technician_id, visit_date, arrival_at,
          gps_latitude, gps_longitude, customer_name, customer_title, notes
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
      ).bind(
        visitId, jobId, user.id, visitDate, arrivalAt,
        gpsLat, gpsLng, customerName, customerTitle, notes
      ).run();

      return new Response(JSON.stringify({ ok: true, visitId, message: "Arrival logged." }), { status: 200 });
    } catch (error) {
      console.error("logArrival failed", error);
      return new Response(JSON.stringify({ ok: false, message: "Failed to log arrival." }), { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: false, message: `Unknown action: ${action}` }), { status: 400 });
}
