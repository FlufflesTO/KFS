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
  success: "border-kharon-green/40 bg-kharon-green/10 text-kharon-green",
  error:   "border-kharon-red/40 bg-kharon-red/10 text-kharon-red",
  warning: "border-kharon-amber/40 bg-kharon-amber/10 text-kharon-amber",
};

// Writes a result message into a result element with the appropriate Tailwind classes.
// Preserves any existing "*-result" identifier class so querySelector can re-find
// the element on subsequent submissions.
export function setResult(
  el: HTMLElement | null,
  text: string,
  variant: ResultVariant,
  extraClasses = ""
): void {
  if (!el) return;
  const idClass = [...el.classList].find((c) => c.endsWith("-result")) ?? "";
  el.textContent = text;
  el.className = [idClass, extraClasses, "rounded-md border px-4 py-3 text-sm font-semibold", VARIANT_CSS[variant]]
    .filter(Boolean)
    .join(" ");
  el.classList.remove("hidden");
}

// Non-blocking toast notification to replace native alert()
export function showToast(message: string, variant: ResultVariant = "error"): void {
  const containerId = "kharon-toast-container";
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.className = "fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `max-w-md w-full backdrop-blur-xl shadow-2xl rounded-xl border p-4 pointer-events-auto flex items-start justify-between gap-4 transition-all duration-300 transform translate-y-8 opacity-0 ${VARIANT_CSS[variant]}`;
  
  const text = document.createElement("p");
  text.className = "text-sm font-bold uppercase tracking-widest flex-1";
  text.textContent = message;
  
  const close = document.createElement("button");
  close.className = "flex-none text-current opacity-70 hover:opacity-100 transition-opacity";
  
  const closeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  closeIcon.setAttribute("class", "w-4 h-4");
  closeIcon.setAttribute("fill", "none");
  closeIcon.setAttribute("viewBox", "0 0 24 24");
  closeIcon.setAttribute("stroke", "currentColor");
  closeIcon.setAttribute("stroke-width", "3");
  
  const closePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  closePath.setAttribute("stroke-linecap", "round");
  closePath.setAttribute("stroke-linejoin", "round");
  closePath.setAttribute("d", "M6 18L18 6M6 6l12 12");
  
  closeIcon.appendChild(closePath);
  close.appendChild(closeIcon);
  
  const removeToast = () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  };
  
  close.addEventListener("click", removeToast);
  
  toast.appendChild(text);
  toast.appendChild(close);
  container.appendChild(toast);
  
  // Animate in
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });
  
  // Auto remove after 5s
  setTimeout(removeToast, 5000);
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

      if (action === "create") {
        setResult(
          result,
          (body.certificatesBlocked as number) > 0
            ? `Created. ${body.certificatesBlocked} certificate(s) automatically blocked. Refreshing...`
            : "Saved. Refreshing related lists...",
          "success"
        );
        setTimeout(() => window.location.reload(), 500);
      } else {
        setResult(result, successMsg, "success");
      }
    });
  }
}
