import type { D1Database } from "@cloudflare/workers-types";

export interface CertificatePdfRecord {
  id: string;
  certificate_type: string;
  issued_date: string;
  expiry_date: string | null;
  status: string;
  system_type: string;
  coverage_area: string;
  owner_company_name: string;
  job_id: string | null;
  technician_name: string | null;
}

export class CertificateRepository {
  constructor(private db: D1Database) {}

  async findPdfRecordById(id: string): Promise<CertificatePdfRecord | null> {
    const record = await this.db
      .prepare(
        `SELECT
           certificates.id,
           certificates.certificate_type,
           certificates.issued_date,
           certificates.expiry_date,
           certificates.status,
           systems.system_type,
           systems.coverage_area,
           sites.owner_company_name,
           certificates.job_id,
           users.name AS technician_name
         FROM certificates
         INNER JOIN systems ON systems.id = certificates.system_id
         INNER JOIN sites ON sites.id = systems.site_id
         LEFT JOIN jobs ON jobs.id = certificates.job_id AND jobs.deleted_at IS NULL
         LEFT JOIN users ON users.id = jobs.assigned_technician_id AND users.deleted_at IS NULL
         WHERE certificates.id = ?1
           AND systems.deleted_at IS NULL
           AND sites.deleted_at IS NULL
         LIMIT 1`
      )
      .bind(id)
      .first<CertificatePdfRecord>();

    return record || null;
  }
}
