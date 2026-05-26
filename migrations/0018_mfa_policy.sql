-- Migration: 0018_mfa_policy
-- Purpose: Enforce MFA for all technician, admin, and finance accounts per Phase 2 legal/security compliance

UPDATE users 
SET mfa_required = 1 
WHERE role IN ('admin', 'finance', 'tech');
