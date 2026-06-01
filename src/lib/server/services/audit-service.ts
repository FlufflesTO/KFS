import type { D1Database } from "@cloudflare/workers-types";

export interface AuditEvent {
  id: string;
  actor_role: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  outcome: string;
  metadata_json: string | null;
  created_at: string;
  actor_name: string | null;
  actor_email: string | null;
}

export interface AuditFilters {
  category?: string;
  outcome?: string;
  from?: string;
  to?: string;
}

const CATEGORY_PATTERNS: Record<string, string> = {
  auth:     "auth.%",
  admin:    "admin.%",
  finance:  "finance.%",
  job:      "job%",
  security: "security.%",
  document: "document.%",
};

export class AuditService {
  constructor(private db: D1Database) {}

  async getEvents(filters: AuditFilters): Promise<AuditEvent[]> {
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters.category && CATEGORY_PATTERNS[filters.category]) {
      conditions.push("ae.event_type LIKE ?");
      params.push(CATEGORY_PATTERNS[filters.category]);
    }
    if (filters.outcome && ["success", "failure", "blocked"].includes(filters.outcome)) {
      conditions.push("ae.outcome = ?");
      params.push(filters.outcome);
    }
    if (filters.from) {
      conditions.push("date(ae.created_at) >= ?");
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push("date(ae.created_at) <= ?");
      params.push(filters.to);
    }

    const whereClause = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    const sql = `
      SELECT ae.id, ae.actor_role, ae.event_type, ae.entity_type, ae.entity_id,
             ae.outcome, ae.metadata_json, ae.created_at,
             u.name AS actor_name, u.email AS actor_email
      FROM audit_events ae
      LEFT JOIN users u ON u.id = ae.actor_user_id
      ${whereClause}
      ORDER BY ae.created_at DESC
      LIMIT 100`;

    const stmt = this.db.prepare(sql);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    
    return (result.results || []) as unknown as AuditEvent[];
  }
}
