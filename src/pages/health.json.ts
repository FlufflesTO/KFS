export async function GET() {
  if (import.meta.env.PUBLIC_DEPLOY_TARGET === "website") {
    return new Response(JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "not_applicable",
        cache: "not_implemented",
        storage: "not_applicable"
      },
      version: import.meta.env?.npm_package_version || "development",
      uptime: "N/A (Cloudflare Pages website artifact)"
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache'
      }
    });
  }

  let dbStatus = 'disconnected';
  let dbError = '';
  
  try {
    const { getDatabase } = await import("../lib/server/bindings");
    const db = getDatabase();
    // Test database connection with a simple query
    await db.prepare('SELECT 1 as test').first();
    dbStatus = 'connected';
  } catch (error) {
    dbError = error instanceof Error ? error.message : String(error);
    dbStatus = 'error';
  }

  const version =
    typeof process !== "undefined" && import.meta.env?.npm_package_version
      ? import.meta.env.npm_package_version
      : "development";
  const uptime =
    typeof process !== "undefined" && typeof process.uptime === "function"
      ? process.uptime()
      : "N/A (Cloudflare Workers)";

  const healthStatus = {
    status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      ...(dbError && { database_error: dbError }),
      cache: 'not_implemented',
      storage: typeof process !== "undefined" && process.env?.STORAGE ? 'connected' : 'not_configured'
    },
    version,
    uptime
  };

  return new Response(JSON.stringify(healthStatus, null, 2), {
    status: healthStatus.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache'
    }
  });
}
