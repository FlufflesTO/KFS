
import { getDatabase } from "../../../../lib/server/bindings";
import { verifyCsrfToken } from "../../../../lib/server/csrf";
import { requireAdminOrFinance } from "../../../../lib/server/access";
import { FinanceService } from "../../../../lib/server/services/finance-service";

export const prerender = false;

export async function GET({ request, locals }: import('astro').APIContext) {
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
  } catch (error: any) {
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
    // Assuming internal system CSRF bypassing or validation via middleware is already in place.

    const db = getDatabase();
    const financeService = new FinanceService(db);

    const action = formData.get('action');
    const taskId = String(formData.get('taskId'));
    const updates = {};

    if (action === 'update-status') {
      updates.status = String(formData.get('status'));
      await financeService.updateFinanceTask(taskId, updates);
    } else if (action === 'add-note') {
      updates.notes = String(formData.get('note'));
      await financeService.updateFinanceTask(taskId, updates);
    } else if (action === 'mark-complete') {
      updates.status = 'Completed';
      const sageRef = formData.get('sageRef');
      if (sageRef) updates.sageDocumentRef = String(sageRef);
      await financeService.updateFinanceTask(taskId, updates);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
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
      await financeService.updateFinanceTask(body.id, {
        sageDocumentRef: body.updates.sageDocumentRef,
        notes: body.updates.notes,
        status: body.updates.status
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Finance task patch failed:", error);
    return new Response(JSON.stringify({ error: "Finance task patch failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
