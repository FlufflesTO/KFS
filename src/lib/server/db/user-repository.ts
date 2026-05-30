import type { D1Database } from "@cloudflare/workers-types";
import type { DbUser } from "@sentinel/types";

/**
 * UserRepository
 * Abstraction layer for users table with built-in soft delete (deleted_at IS NULL) filtering.
 */
export class UserRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<DbUser | null> {
    const user = await this.db
      .prepare(`SELECT * FROM users WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(id)
      .first<DbUser>();
    return user || null;
  }

  async findByEmail(email: string): Promise<DbUser | null> {
    const user = await this.db
      .prepare(`SELECT id, name, email, role, site_id, is_active, deleted_at, force_password_change, mfa_required, mfa_enabled, last_login_at FROM users WHERE email = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(email.toLowerCase().trim())
      .first<DbUser>();
    return user || null;
  }

  async findWithSecretsByEmail(email: string): Promise<(DbUser & { password_hash: string, mfa_secret_encrypted: string | null }) | null> {
    const user = await this.db
      .prepare(`SELECT id, name, email, role, site_id, is_active, deleted_at, force_password_change, mfa_required, mfa_enabled, last_login_at, password_hash, mfa_secret_encrypted FROM users WHERE email = ?1 AND deleted_at IS NULL LIMIT 1`)
      .bind(email.toLowerCase().trim())
      .first<DbUser & { password_hash: string, mfa_secret_encrypted: string | null }>();
    return user || null;
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .prepare(`UPDATE users SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?1`)
      .bind(id)
      .run();
  }
}
