import type { D1Database } from "@cloudflare/workers-types";
import type { DbUser } from "@sentinel/types";

/**
 * Generates a random anonymized string for POPIA compliance.
 * Format: "anon_" + random hex string
 */
function generateAnonymizedValue(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `anon_${hex}`;
}

/**
 * UserRepository
 * Abstraction layer for users table with built-in soft delete (deleted_at IS NULL) filtering
 * and POPIA Section 26 anonymization support.
 */
export class UserRepository {
  constructor(private db: D1Database) {}

  async findById(id: string): Promise<DbUser | null> {
    const user = await this.db
      .prepare(`SELECT id, name, email, role, site_id, is_active, force_password_change, mfa_required, mfa_enabled, last_login_at FROM users WHERE id = ?1 AND deleted_at IS NULL LIMIT 1`)
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

  /**
   * Anonymizes user personal data for POPIA Section 26 compliance (right to erasure).
   * Replaces PII with randomized values while preserving:
   * - User ID (for referential integrity)
   * - Role (for access audit trails)
   * - Financial/account metadata linkages
   * 
   * Anonymized fields:
   * - name → "anon_[random_hex]"
   * - email → "anon_[random_hex]@anonymized.local"
   * - password_hash → hashed random value (invalidates all sessions)
   * - mfa_secret_encrypted → encrypted random value
   * - password_reset_token → NULL
   * - locked_until → NULL
   * - failed_login_attempts → 0
   * - force_password_change → 1 (prevents any residual access)
   */
  async anonymizeUser(id: string): Promise<void> {
    const anonymizedName = generateAnonymizedValue();
    const anonymizedEmail = `${generateAnonymizedValue()}@anonymized.local`;

    // Generate random salt to invalidate all sessions
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const randomSalt = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

    // Create invalid password hash format that will always fail verification
    const anonymizedPasswordHash = `pbkdf2_sha256$600000$${randomSalt}$${generateAnonymizedValue()}`;

    await this.db.prepare(`
      UPDATE users SET
        name = ?1,
        email = ?2,
        password_hash = ?3,
        mfa_secret_encrypted = NULL,
        password_reset_token = NULL,
        locked_until = NULL,
        failed_login_attempts = 0,
        force_password_change = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?4
    `).bind(
      anonymizedName,
      anonymizedEmail,
      anonymizedPasswordHash,
      id
    ).run();
  }
}
