import { getDatabase } from "../lib/server/bindings";

export async function GET() {
  let dbStatus = 'disconnected';
  let dbError = '';
  
  try {
    const db = getDatabase();
    // Test database connection with a simple query
    await db.prepare('SELECT 1 as test').first();
    dbStatus = 'connected';
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Unknown error';
    dbStatus = 'error';
  }

  const version =
    typeof process !== "undefined" && process.env?.npm_package_version
      ? process.env.npm_package_version
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
      cache: 'not_implemented', // Would connect to Redis/Memcached if implemented
      storage: 'not_implemented' // Would check R2 connection if implemented
    },
    version,
    uptime
  };

  return new Response(JSON.stringify(healthStatus, null, 2), {
    status: healthStatus.status === 'healthy' ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}
