// Single source of truth for all portal form submissions.
// Re-exports the core primitives from portalApi and adds finance-specific binders.
export { portalPost, extractFormPayload, setResult, bindAdminForms } from "../client/portalApi.ts";
import { portalPost, setResult, showToast } from "../client/portalApi.ts";

// Binds all .sage-ref-form, .payment-form, .credit-note-btn, and
// .finance-quick-status elements using kharonPortalFetch + portalPost.
export function bindFinanceForms(): void {
  bindSageRefForms();
  bindPaymentForms();
  bindFinanceQuickStatusButtons();
  bindCreditNoteButtons();
}

function bindSageRefForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>(".sage-ref-form")) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const result = form.querySelector<HTMLElement>(".sage-ref-result");
      const btn = form.querySelector<HTMLButtonElement>("button[type='submit'], button:not([type='button'])");
      if (btn) btn.disabled = true;
      if (result) result.textContent = "Saving…";

      const recordId     = form.dataset.recordId ?? "";
      const sageInvoiceNumber = (form.querySelector<HTMLInputElement>("[name='sageInvoiceNumber']")?.value ?? "").trim();
      const sageQuoteNumber = (form.querySelector<HTMLInputElement>("[name='sageQuoteNumber']")?.value ?? "").trim();
      const custCode     = (form.querySelector<HTMLInputElement>("[name='sageCustomerCode']")?.value ?? "").trim();
      const exVat        = (form.querySelector<HTMLInputElement>("[name='sageAmountExVat']")?.value  ?? "").trim();
      const vat          = (form.querySelector<HTMLInputElement>("[name='sageVatAmount']")?.value    ?? "").trim();
      const incVat       = (form.querySelector<HTMLInputElement>("[name='sageAmountIncVat']")?.value ?? "").trim();
      const docDate      = (form.querySelector<HTMLInputElement>("[name='sageDocumentDate']")?.value ?? "").trim();
      const dueDate      = (form.querySelector<HTMLInputElement>("[name='sageDueDate']")?.value      ?? "").trim();
      const notes        = (form.querySelector<HTMLInputElement>("[name='financeNotes']")?.value     ?? "").trim();
      const taskStatus   = (() => {
        const el = form.querySelector("[name='financeTaskStatus']");
        return el && 'value' in el ? String(el.value).trim() : "";
      })();

      const payload: Record<string, unknown> = { recordId };
      if (sageInvoiceNumber) payload.sageInvoiceNumber = sageInvoiceNumber;
      if (sageQuoteNumber)   payload.sageQuoteNumber   = sageQuoteNumber;
      if (custCode)   payload.sageCustomerCode  = custCode;
      if (exVat)      payload.sageAmountExVat   = parseFloat(exVat);
      if (vat)        payload.sageVatAmount     = parseFloat(vat);
      if (incVat)     payload.sageAmountIncVat  = parseFloat(incVat);
      if (docDate)    payload.sageDocumentDate  = docDate;
      if (dueDate)    payload.sageDueDate       = dueDate;
      if (notes)      payload.financeNotes      = notes;
      if (taskStatus) payload.financeTaskStatus = taskStatus;

      const { response, body } = await portalPost("/portal/api/finance/sage-reference", payload);
      const ok = response.ok && body.ok;
      setResult(result, ok ? "Saved." : (body.message ?? "Save failed."), ok ? "success" : "error");
      if (ok) setTimeout(() => window.location.reload(), 700);
      if (btn) btn.disabled = false;
    });
  }
}

function bindPaymentForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>(".payment-form")) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const result = form.querySelector<HTMLElement>(".payment-result");
      const btn    = form.querySelector<HTMLButtonElement>("button[type='submit'], button:not([type='button'])");
      const ref    = (form.querySelector<HTMLInputElement>("[name='paymentReference']")?.value ?? "").trim();
      if (!window.confirm(`Record this payment in Sage?\n\nSage payment reference: ${ref || "(none entered)"}\n\nThis action cannot be undone.`)) return;
      if (btn) { btn.disabled = true; btn.textContent = "Recording…"; }
      if (result) result.textContent = "Recording in Sage…";

      const { response, body } = await portalPost("/portal/api/finance/payments", {
        recordId: form.dataset.recordId ?? "",
        paymentReference: ref,
      });
      const ok = response.ok && body.ok;
      const msg = ok ? `Recorded in Sage: ${String(body.paymentReference ?? "")}` : (body.message ?? "Payment capture failed.");
      setResult(result, msg, ok ? "success" : "error");
      if (ok) window.location.reload();
      else if (btn) { btn.disabled = false; btn.textContent = "Record Paid in Sage"; }
    });
  }
}

function bindFinanceQuickStatusButtons(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>(".finance-quick-status")) {
    btn.addEventListener("click", async () => {
      const recordId = btn.dataset.recordId ?? "";
      const status   = btn.dataset.status   ?? "";
      if (!recordId || !status) return;
      if (!window.confirm(`Mark this record as "${status}"? You can change it later.`)) return;
      btn.disabled = true;
      const { response, body } = await portalPost("/portal/api/finance/sage-reference", { recordId, financeTaskStatus: status });
      if (response.ok && body.ok) {
        window.location.reload();
      } else {
        showToast(body.message ?? "Status update failed.", "error");
        btn.disabled = false;
      }
    });
  }
}

function bindCreditNoteButtons(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>(".credit-note-btn")) {
    btn.addEventListener("click", async () => {
      const recordId = btn.dataset.recordId ?? "";
      const itemType = btn.dataset.itemType ?? "";
      if (!recordId) return;
      const reason = window.prompt(`Enter reason for credit note (${itemType} reversal):`);
      if (!reason?.trim()) return;
      btn.disabled = true;
      const { response, body } = await portalPost("/portal/api/finance/credit-note", { originalRecordId: recordId, reason: reason.trim() });
      if (response.ok && body.ok) {
        window.location.reload();
      } else {
        showToast(body.message ?? "Credit note creation failed.", "error");
        btn.disabled = false;
      }
    });
  }
}
