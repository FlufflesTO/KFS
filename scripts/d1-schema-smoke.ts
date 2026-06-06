import { execSync } from "node:child_process";

const database = process.argv[2] || "DB";
const phase = process.argv.includes("--post") ? "post" : "pre";

const baselineQueries = [
  "SELECT id, email, role, is_active FROM users LIMIT 0;",
  "SELECT id, system_id, status, assigned_technician_id, deleted_at FROM jobs LIMIT 0;",
  "SELECT id, job_id, technician_id, visit_date, arrival_time, departure_time FROM job_visits LIMIT 0;",
  "SELECT id, site_id, payment_status FROM financial_records LIMIT 0;",
  "SELECT user_id, site_id FROM client_site_access LIMIT 0;",
  "SELECT id, event_type, outcome, created_at FROM audit_events LIMIT 0;"
];

const postMigrationQueries = [
  "SELECT id, idempotency_key, mutation_type, target_path, request_hash, status FROM offline_mutations LIMIT 0;"
];

function runQuery(sql: string): void {
  const escapedSql = sql.replaceAll('"', '\\"');
  execSync(`npx wrangler d1 execute ${database} --remote --config wrangler.portal.jsonc --command "${escapedSql}"`, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

for (const query of baselineQueries) runQuery(query);
if (phase === "post") {
  for (const query of postMigrationQueries) runQuery(query);
}

console.log(`D1 ${phase}-migration schema smoke passed.`);
