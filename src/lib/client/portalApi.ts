// Consolidated client-side fetch layer for all portal form submissions.
// Import in typed <script> blocks (not is:inline). Provides the single unified
// API utility that replaces the 4 ad-hoc submission patterns across the portal.

declare global {
  interface Window {
    kharonPortalFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  }
}

export interface ApiResult {
  ok: boolean;
  message?: string;
  [key: string]: unknown;
}

// Core POST utility — wraps kharonPortalFetch with CSRF injection and JSON parsing.
export async function portalPost<T extends ApiResult>(
  url: string,
  payload: Record<string, unknown>
): Promise<{ response: Response; body: T }> {
  const response = await window.kharonPortalFetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response
    .json()
    .catch((): T => ({ ok: false, message: "Request failed." } as unknown as T))) as T;
  return { response, body };
}

// Serialises all named, non-disabled form fields into a plain object.
// Checkboxes are serialised as "1"/"0" to match server-side expectations.
export function extractFormPayload(form: HTMLFormElement): Record<string, string> {
  const data: Record<string, string> = {};
  for (const element of form.elements) {
    const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!el.name || el.disabled) continue;
    if ((el as HTMLInputElement).type === "checkbox") {
      data[el.name] = (el as HTMLInputElement).checked ? "1" : "0";
    } else {
      data[el.name] = el.value;
    }
  }
  return data;
}

type ResultVariant = "success" | "error" | "warning";

const VARIANT_CSS: Record<ResultVariant, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error:   "border-red-300 bg-red-50 text-red-900",
  warning: "border-amber-300 bg-amber-50 text-amber-900",
};

// Writes a result message into a result element with the appropriate Tailwind classes.
export function setResult(
  el: HTMLElement | null,
  text: string,
  variant: ResultVariant,
  extraClasses = ""
): void {
  if (!el) return;
  el.textContent = text;
  el.className =
    `${extraClasses} rounded-md border px-4 py-3 text-sm font-semibold ${VARIANT_CSS[variant]}`.trim();
}

// Binds submit handlers to all .admin-form elements. Reads data-endpoint and
// serialises the form with extractFormPayload. On create actions, reloads after 500ms.
export function bindAdminForms(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>(".admin-form")) {
    form.addEventListener("submit", async (event: Event) => {
      event.preventDefault();
      const result = form.querySelector<HTMLElement>(".admin-result");
      if (result) result.classList.add("hidden");

      const { response, body } = await portalPost<ApiResult>(
        form.dataset.endpoint ?? "",
        extractFormPayload(form)
      );

      if (!response.ok || !body.ok) {
        setResult(result, body.message ?? "Operation failed.", "error");
        return;
      }

      const action = form.querySelector<HTMLInputElement>('[name="action"]')?.value ?? "";
      let successMsg = `Saved ${body.id ?? ""}`.trim();
      if ((body.certificatesBlocked as number) > 0) {
        successMsg = `Saved. ${body.certificatesBlocked} certificate(s) automatically blocked due to this defect.`;
      } else if (body.certificatesRestored) {
        successMsg = "Saved. Blocked certificates for this system have been restored to Valid.";
      } else if (body.status === "Resolved" || body.status === "Closed") {
        successMsg = `Defect marked ${body.status}.`;
      }

      setResult(result, successMsg, "success");

      if (action === "create") {
        setResult(
          result,
          (body.certificatesBlocked as number) > 0
            ? `Created. ${body.certificatesBlocked} certificate(s) automatically blocked. Refreshing...`
            : "Saved. Refreshing related lists...",
          "success"
        );
        setTimeout(() => window.location.reload(), 500);
      }
    });
  }
}
