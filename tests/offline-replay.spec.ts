import { expect, test } from "@playwright/test";

test("offline portal mutation queues once and drains after reconnection", async ({ page, context }) => {
  let disconnectApi = true;
  await context.route("**/portal/api/job-visits", async (route) => {
    if (disconnectApi) {
      await route.abort("internetdisconnected");
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, visitId: "visit_replayed_once", message: "Arrival logged." })
    });
  });

  await page.goto("/portal/login");
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) throw new Error("Service workers unavailable.");
    await navigator.serviceWorker.register("/sw.js", { scope: "/portal/" });
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));

  const queued = await page.evaluate(async () => {
    const response = await fetch("/portal/api/job-visits", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "offline-test-token"
      },
      body: JSON.stringify({
        action: "logArrival",
        jobId: "job_offline_test",
        visitDate: "2026-05-30",
        arrivalTime: "09:00"
      })
    });
    return response.json();
  });

  expect(queued.queued).toBe(true);
  expect(queued.idempotencyKey).toMatch(/^queue:/);

  disconnectApi = false;
  const drainQueue = async () => page.evaluate(async () => {
    const controller = navigator.serviceWorker.controller;
    if (!controller) throw new Error("Service worker controller missing.");
    return new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("message", function onMessage(event) {
        if (event.data?.type === "QUEUE_DRAIN_COMPLETE") {
          navigator.serviceWorker.removeEventListener("message", onMessage);
          resolve(event.data);
        }
      });
      controller.postMessage({ type: "DRAIN_QUEUE" });
    });
  });

  let drained = await drainQueue();
  for (let attempt = 0; attempt < 3 && Number((drained as { remaining?: number }).remaining || 0) > 0; attempt++) {
    await page.waitForTimeout(750);
    drained = await drainQueue();
  }

  expect(drained).toMatchObject({ type: "QUEUE_DRAIN_COMPLETE" });
  expect(Number((drained as { failed?: number; errors?: string[] }).failed || 0), JSON.stringify(drained)).toBe(0);
  expect(Number((drained as { remaining?: number }).remaining || 0), JSON.stringify(drained)).toBe(0);
});
