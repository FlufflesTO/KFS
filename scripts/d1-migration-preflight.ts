import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const database = process.argv[2] || "DB";
const migrationsDir = path.join(process.cwd(), "migrations");

function run(command: string): string {
  return execSync(command, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
}

const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((file) => /^\d{4}[A-Za-z0-9_-]*\.sql$/.test(file))
  .sort();

const seen = new Set<string>();
const duplicatePrefixes = new Set<string>();
for (const file of migrationFiles) {
  const prefix = file.slice(0, 4);
  if (seen.has(prefix)) {
    duplicatePrefixes.add(prefix);
  }
  seen.add(prefix);
}

if (migrationFiles.length === 0) {
  throw new Error("No migration files found.");
}

const ledger = run(`npx wrangler d1 migrations list ${database} --remote`);
console.log(ledger.trim());
if (duplicatePrefixes.size > 0) {
  console.warn(`Historical duplicate migration prefixes detected: ${Array.from(duplicatePrefixes).join(", ")}. Keep future migration prefixes unique.`);
}
console.log(`D1 migration preflight passed for ${migrationFiles.length} local migration files.`);
