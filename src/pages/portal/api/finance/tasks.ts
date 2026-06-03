
import { getDatabase } from "../../../../lib/server/bindings";
import { requireAdminOrFinance } from "../../../../lib/server/access";
import { FinanceService } from "../../../../lib/server/services/finance-service";

export const prerender = false;

export async function GET({ locals }: import('astro').APIContext) {
  try {
    // Verify authentication and authorization
    const user = locals.user;
    const authError = requireAdminOrFinance(user);
    if (authError) {
      return authError;
    }

    const db = getDatabase();
    const financeService = new FinanceService(db);

    // Get finance summary
    const summary = await financeService.getFinanceSummary();

    // Get pending tasks
    const pendingTasks = await financeService.getPendingTasks();

    return new Response(
      JSON.stringify({ 
        success: true,
        summary,
        pendingTasks
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Finance tasks fetch failed:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch finance tasks" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function POST({ request, locals }: import('astro').APIContext) {
  try {
    const user = locals.user;
    const authError = requireAdminOrFinance(user);
    if (authError) return authError;

    const formData = await request.formData();
    // CSRF is enforced by csrfAndRateLimitMiddleware for mutating /portal/api/* requests.

    const db = getDatabase();
    const financeService = new FinanceService(db);

    const action = formData.get('action');
    const taskId = String(formData.get('taskId') ?? '').trim();
    if (!taskId || taskId === 'null' || taskId === 'undefined' || taskId.length > 64) {
      return new Response(JSON.stringify({ error: "A valid task ID is required." }), { status: 400 });
    }

    const updates: {
      status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
      notes?: string;
      sageDocumentRef?: string;
    } = {};

    if (action === 'update-status') {
      const statusVal = String(formData.get('status'));
      if (statusVal === 'Pending' || statusVal === 'In Progress' || statusVal === 'Completed' || statusVal === 'Cancelled') {
        updates.status = statusVal;
      } else {
        return new Response(JSON.stringify({ error: "Invalid status value" }), { status: 400 });
      }
      await financeService.updateFinanceTask(taskId, updates);
    } else if (action === 'add-note') {
      const note = String(formData.get('note') ?? '').trim();
      if (note.length > 2000) {
        return new Response(JSON.stringify({ error: "Note exceeds 2000 characters." }), { status: 400 });
      }
      updates.notes = note;
      await financeService.updateFinanceTask(taskId, updates);
    } else if (action === 'mark-complete') {
      updates.status = 'Completed';
      const sageRef = String(formData.get('sageRef') ?? '').trim();
      if (sageRef) {
        if (sageRef.length > 120) {
          return new Response(JSON.stringify({ error: "Sage reference exceeds 120 characters." }), { status: 400 });
        }
        updates.sageDocumentRef = sageRef;
      }
      await financeService.updateFinanceTask(taskId, updates);
    } else {
      return new Response(JSON.stringify({ error: "Unknown action." }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Finance task update failed:", error);
    return new Response(JSON.stringify({ error: "Finance task update failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export async function PATCH({ request, locals }: import('astro').APIContext) {
  try {
    const user = locals.user;
    const authError = requireAdminOrFinance(user);
    if (authError) return authError;

    let body: Record<string, any>;
    try {
      body = await request.json() as Record<string, any>;
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }
    const db = getDatabase();
    const financeService = new FinanceService(db);

    if (body.id && body.updates) {
      const id = String(body.id).trim();
      if (!id || id === 'null' || id === 'undefined' || id.length > 64) {
        return new Response(JSON.stringify({ error: "A valid task ID is required." }), { status: 400 });
      }

      const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
      const patch: { sageDocumentRef?: string; notes?: string; status?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled' } = {};

      if (body.updates.status !== undefined) {
        const st = String(body.updates.status).trim();
        if (!validStatuses.includes(st)) {
          return new Response(JSON.stringify({ error: "Invalid status value" }), { status: 400 });
        }
        patch.status = st as 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
      }
      if (body.updates.notes !== undefined) {
        const notes = String(body.updates.notes).trim();
        if (notes.length > 2000) {
          return new Response(JSON.stringify({ error: "Note exceeds 2000 characters." }), { status: 400 });
        }
        patch.notes = notes;
      }
      if (body.updates.sageDocumentRef !== undefined) {
        const ref = String(body.updates.sageDocumentRef).trim();
        if (ref.length > 120) {
          return new Response(JSON.stringify({ error: "Sage reference exceeds 120 characters." }), { status: 400 });
        }
        patch.sageDocumentRef = ref;
      }

      await financeService.updateFinanceTask(id, patch);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    console.error("Finance task patch failed:", error);
    return new Response(JSON.stringify({ error: "Finance task patch failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
