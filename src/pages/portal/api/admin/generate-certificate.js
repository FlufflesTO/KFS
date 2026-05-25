/**
 * Certificate PDF Generation API Endpoint
 * 
 * Generates SANS 10139 and SANS 14520 compliance certificates
 * as downloadable PDFs.
 */

import { getDatabase } from '../../../lib/server/bindings.js';
import { generateCertificate } from '../../../lib/server/certificatePdf.js';
import { requireUser } from '../../../lib/server/auth.js';

export const prerender = false;

export async function POST({ request }) {
  try {
    // Authenticate user
    const user = await requireUser(request);
    
    if (!user || !['admin', 'dispatcher', 'technician'].includes(user.role)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { certificateId, systemId, jobId } = body;

    if (!certificateId) {
      return new Response(JSON.stringify({ error: 'Certificate ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = getDatabase();

    // Fetch certificate and related data
    const certData = await db.prepare(`
      SELECT 
        c.id as certificate_id,
        c.certificate_type,
        c.issued_date,
        c.expiry_date,
        c.status,
        c.blocked_by_defect_id,
        s.id as system_id,
        s.system_type,
        s.coverage_area,
        s.manufacturer,
        st.id as site_id,
        st.owner_company_name,
        st.physical_address,
        st.site_contact_person,
        st.site_contact_phone,
        u.name as technician_name,
        u.email as technician_email,
        j.id as job_id
      FROM certificates c
      INNER JOIN systems s ON s.id = c.system_id
      INNER JOIN sites st ON st.id = s.site_id
      LEFT JOIN users u ON u.id = (
        SELECT technician_id FROM job_visits WHERE job_id = c.job_id LIMIT 1
      )
      LEFT JOIN jobs j ON j.id = c.job_id
      WHERE c.id = ?
    `).get(certificateId);

    if (!certData) {
      return new Response(JSON.stringify({ error: 'Certificate not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for blocking defects
    if (certData.blocked_by_defect_id) {
      const defect = await db.prepare(`
        SELECT severity, description FROM defects WHERE id = ?
      `).get(certData.blocked_by_defect_id);

      if (defect) {
        return new Response(JSON.stringify({
          error: 'Certificate blocked by defect',
          defect: {
            severity: defect.severity,
            description: defect.description
          }
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Fetch additional data for certificate
    const defects = await db.prepare(`
      SELECT COUNT(*) as count FROM defects 
      WHERE system_id = ? AND status != 'Resolved'
    `).get(certData.system_id);

    // Build certificate data object
    const certificateData = {
      certificateId: certData.certificate_id,
      certificateType: certData.certificate_type,
      issuedDate: certData.issued_date,
      expiryDate: certData.expiry_date,
      status: certData.status,
      ownerCompanyName: certData.owner_company_name,
      physicalAddress: certData.physical_address,
      siteContactPerson: certData.site_contact_person,
      siteContactPhone: certData.site_contact_phone,
      systemType: certData.system_type,
      coverageArea: certData.coverage_area,
      manufacturer: certData.manufacturer,
      technicianName: certData.technician_name,
      defectsFound: defects.count > 0,
      
      // Additional fields based on certificate type
      gasType: body.gasType || 'Clean Agent',
      designConcentration: body.designConcentration,
      cylinderPressure: body.cylinderPressure,
      lastHydroTest: body.lastHydroTest,
      pressureCheckPassed: body.pressureCheckPassed !== false,
      nozzleCondition: body.nozzleCondition || 'Good',
      customerName: body.customerName,
      
      // Combined certificate fields
      fireCoverage: body.fireCoverage || certData.coverage_area,
      gasCoverage: body.gasCoverage
    };

    // Generate PDF
    const result = await generateCertificate(certificateData);

    return new Response(result.pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Content-Length': result.pdfBytes.length.toString()
      }
    });
  } catch (error) {
    console.error('[CERTIFICATE PDF] Error generating certificate:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate certificate',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET endpoint to check certificate eligibility
export async function GET({ url, request }) {
  try {
    const user = await requireUser(request);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const certificateId = url.searchParams.get('id');
    
    if (!certificateId) {
      return new Response(JSON.stringify({ error: 'Certificate ID required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = getDatabase();
    
    const certInfo = await db.prepare(`
      SELECT 
        c.id,
        c.certificate_type,
        c.status,
        c.blocked_by_defect_id,
        c.issued_date,
        c.expiry_date,
        s.system_type,
        st.owner_company_name,
        CASE WHEN d.id IS NOT NULL THEN 1 ELSE 0 END as has_blocking_defect
      FROM certificates c
      INNER JOIN systems s ON s.id = c.system_id
      INNER JOIN sites st ON st.id = s.site_id
      LEFT JOIN defects d ON d.id = c.blocked_by_defect_id
      WHERE c.id = ?
    `).get(certificateId);

    if (!certInfo) {
      return new Response(JSON.stringify({ error: 'Certificate not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      eligible: certInfo.has_blocking_defect === 0 && certInfo.status === 'Valid',
      certificate: certInfo,
      blockedByDefect: !!certInfo.blocked_by_defect_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[CERTIFICATE CHECK] Error:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
