PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  email TEXT NOT NULL UNIQUE CHECK (email = lower(email) AND instr(email, '@') > 1),
  password_hash TEXT NOT NULL CHECK (length(password_hash) >= 40),
  role TEXT NOT NULL CHECK (role IN ('tech', 'admin', 'client', 'finance')),
  site_id TEXT REFERENCES sites(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
, force_password_change INTEGER NOT NULL DEFAULT 0 CHECK (force_password_change IN (0, 1)), password_changed_at TEXT, last_login_at TEXT);
INSERT INTO "users" ("id","name","email","password_hash","role","site_id","is_active","created_at","updated_at","force_password_change","password_changed_at","last_login_at") VALUES('usr_admin_001','Kharon Admin','admin@kharon.co.za','pbkdf2_sha256$100000$MTQyODlkYzctMmQxNS00NWMzLTk5YzctYjc1YjI2YTc1Y2Zk$JDAy5Uwvt-9iCY0_hxmSD3M2gZxc5i29EY7Q0W1ywfc','admin',NULL,1,'2026-05-20T16:18:50.889Z','2026-05-21T15:00:12.095Z',0,NULL,'2026-05-21T15:00:12.095Z');
INSERT INTO "users" ("id","name","email","password_hash","role","site_id","is_active","created_at","updated_at","force_password_change","password_changed_at","last_login_at") VALUES('usr_tech_001','Kharon Technician','tech@kharon.co.za','pbkdf2_sha256$100000$MTQyODlkYzctMmQxNS00NWMzLTk5YzctYjc1YjI2YTc1Y2Zk$JDAy5Uwvt-9iCY0_hxmSD3M2gZxc5i29EY7Q0W1ywfc','tech',NULL,1,'2026-05-20T16:18:50.889Z','2026-05-21T10:17:49.339Z',0,NULL,'2026-05-21T10:17:49.339Z');
INSERT INTO "users" ("id","name","email","password_hash","role","site_id","is_active","created_at","updated_at","force_password_change","password_changed_at","last_login_at") VALUES('usr_finance_001','Kharon Finance','finance@kharon.co.za','pbkdf2_sha256$100000$MTQyODlkYzctMmQxNS00NWMzLTk5YzctYjc1YjI2YTc1Y2Zk$JDAy5Uwvt-9iCY0_hxmSD3M2gZxc5i29EY7Q0W1ywfc','finance',NULL,1,'2026-05-20T16:18:50.889Z','2026-05-20T16:31:26.437Z',0,NULL,NULL);
INSERT INTO "users" ("id","name","email","password_hash","role","site_id","is_active","created_at","updated_at","force_password_change","password_changed_at","last_login_at") VALUES('usr_client_001','Client Portal User','client@example.com','pbkdf2_sha256$100000$MTQyODlkYzctMmQxNS00NWMzLTk5YzctYjc1YjI2YTc1Y2Zk$JDAy5Uwvt-9iCY0_hxmSD3M2gZxc5i29EY7Q0W1ywfc','client','site_tequit_staging',1,'2026-05-20T16:18:50.889Z','2026-05-21T11:03:45.516Z',0,NULL,'2026-05-21T11:03:45.516Z');
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  owner_company_name TEXT NOT NULL CHECK (length(trim(owner_company_name)) BETWEEN 2 AND 200),
  physical_address TEXT NOT NULL CHECK (length(trim(physical_address)) BETWEEN 5 AND 500),
  site_contact_person TEXT NOT NULL CHECK (length(trim(site_contact_person)) BETWEEN 2 AND 160),
  site_contact_email TEXT CHECK (site_contact_email IS NULL OR instr(site_contact_email, '@') > 1),
  site_contact_phone TEXT,
  billing_emails TEXT NOT NULL CHECK (length(trim(billing_emails)) BETWEEN 3 AND 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "sites" ("id","owner_company_name","physical_address","site_contact_person","site_contact_email","site_contact_phone","billing_emails","created_at","updated_at") VALUES('site_tequit_staging','Tequit Staging Client','Staging address to be replaced','Client Contact','client@example.com','','billing@example.com','2026-05-20T16:18:50.889Z','2026-05-20T16:31:26.437Z');
INSERT INTO "sites" ("id","owner_company_name","physical_address","site_contact_person","site_contact_email","site_contact_phone","billing_emails","created_at","updated_at") VALUES('7ac481b1-c294-47ca-b7d1-bd57943af224','Kharon Smoke Test 20260521112320','Staging verification address, Cape Town','Operations Smoke Test','admin@kharon.co.za','+27000000000','admin@kharon.co.za','2026-05-21T09:23:22.659Z','2026-05-21T09:23:22.659Z');
CREATE TABLE systems (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  system_type TEXT NOT NULL CHECK (system_type IN ('Gas Suppression', 'Fire Detection')),
  coverage_area TEXT NOT NULL CHECK (length(trim(coverage_area)) BETWEEN 2 AND 200),
  manufacturer TEXT,
  model_reference TEXT,
  last_service_date TEXT,
  last_checked_at TEXT,
  next_due_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "systems" ("id","site_id","system_type","coverage_area","manufacturer","model_reference","last_service_date","last_checked_at","next_due_date","created_at","updated_at") VALUES('6abd2efc-e69d-4a84-a3eb-74a78d141a6c','7ac481b1-c294-47ca-b7d1-bd57943af224','Gas Suppression','Server Room Smoke 20260521112320','Rotarex','Smoke verification record','2026-05-21','2026-05-21T10:10:53.703Z','2026-11-21','2026-05-21T09:23:23.183Z','2026-05-21T10:10:55.463Z');
INSERT INTO "systems" ("id","site_id","system_type","coverage_area","manufacturer","model_reference","last_service_date","last_checked_at","next_due_date","created_at","updated_at") VALUES('9aa3efbf-9959-4704-b4d4-8c84cce5c377','site_tequit_staging','Fire Detection','Staging Client Detection Loop','Bosch','Client request smoke system',NULL,NULL,'2026-11-21','2026-05-21T11:03:28.323Z','2026-05-21T11:03:28.323Z');
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  system_id TEXT NOT NULL REFERENCES systems(id) ON DELETE CASCADE,
  assigned_technician_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Invoiced')),
  job_type TEXT NOT NULL DEFAULT 'Maintenance',
  site_notes TEXT,
  tech_comments TEXT,
  documentation_path TEXT CHECK (documentation_path IS NULL OR documentation_path LIKE 'jobcards/%'),
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "jobs" ("id","system_id","assigned_technician_id","scheduled_date","status","job_type","site_notes","tech_comments","documentation_path","completed_at","created_at","updated_at") VALUES('3a305a59-009e-41b5-bf82-10485b13d281','6abd2efc-e69d-4a84-a3eb-74a78d141a6c','usr_tech_001','2026-05-21','Completed','Smoke Verification','Created by deployment smoke test.','Deployment smoke: service completed, signature pad evidence captured, no active fault observed.','jobcards/job-3a305a59-009e-41b5-bf82-10485b13d281-completed.pdf','2026-05-21T10:10:53.703Z','2026-05-21T09:23:23.711Z','2026-05-21T10:10:55.463Z');
INSERT INTO "jobs" ("id","system_id","assigned_technician_id","scheduled_date","status","job_type","site_notes","tech_comments","documentation_path","completed_at","created_at","updated_at") VALUES('34528dba-8ee9-4b43-ac93-820b0640aa30','6abd2efc-e69d-4a84-a3eb-74a78d141a6c','usr_tech_001','2026-05-22','Scheduled','Staging Review Dispatch','Fresh staging dispatch left open after signature-pad smoke verification.',NULL,NULL,NULL,'2026-05-21T10:11:25.706Z','2026-05-21T10:11:25.706Z');
INSERT INTO "jobs" ("id","system_id","assigned_technician_id","scheduled_date","status","job_type","site_notes","tech_comments","documentation_path","completed_at","created_at","updated_at") VALUES('9fb22314-d4f1-4a43-9c62-dededecacedf','9aa3efbf-9959-4704-b4d4-8c84cce5c377','usr_tech_001','2026-05-23','Scheduled','Client Maintenance Request','Converted from client maintenance request smoke.',NULL,NULL,NULL,'2026-05-21T11:03:29.919Z','2026-05-21T11:03:29.919Z');
CREATE TABLE financial_records (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('Quote', 'Invoice', 'Payment')),
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending Approval', 'Unpaid', 'Settled')),
  distribution_date TEXT NOT NULL,
  reference TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "financial_records" ("id","site_id","job_id","amount","item_type","payment_status","distribution_date","reference","created_at","updated_at") VALUES('89a45415-c9a6-4a1d-af5b-2ec74825c83b','7ac481b1-c294-47ca-b7d1-bd57943af224','3a305a59-009e-41b5-bf82-10485b13d281',1850,'Invoice','Unpaid','2026-05-21','Standard service invoice for job 3a305a59-009e-41b5-bf82-10485b13d281','2026-05-21T10:10:55.463Z','2026-05-21T10:10:55.463Z');
CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_role TEXT CHECK (actor_role IS NULL OR actor_role IN ('tech', 'admin', 'client', 'finance')),
  event_type TEXT NOT NULL CHECK (length(trim(event_type)) BETWEEN 3 AND 80),
  entity_type TEXT NOT NULL CHECK (length(trim(entity_type)) BETWEEN 2 AND 80),
  entity_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
  ip_hash TEXT,
  user_agent TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('f4dda860-64fc-4e16-a9ff-20e1fae7a457','usr_tech_001','tech','auth.login','user','usr_tech_001','failure','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0','{"reason":"bad_password"}','2026-05-21T09:06:00.520Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('7d883c89-65e1-422c-91af-3ad7de14f1bb','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T09:06:01.841Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('43ede3e1-a1ba-43f7-bcb5-6068df439607','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T09:06:20.453Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('ec7b8047-c6b5-4b9e-98a7-c7e58aef0d29','usr_tech_001','tech','auth.logout','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0',NULL,'2026-05-21T09:06:20.909Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('cbb48e66-9972-4337-b3f7-c87ede548da4','usr_tech_001','tech','auth.login','user','usr_tech_001','failure','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0','{"reason":"bad_password"}','2026-05-21T09:09:42.979Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('658bdf3d-99d5-4766-8b99-0e0fb8b97327','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T09:09:44.421Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('20341cbf-c023-40ca-9b03-43cbbe38166b','usr_tech_001','tech','auth.logout','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','curl/8.19.0',NULL,'2026-05-21T09:09:45.479Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('e78ca17a-a128-4433-820d-d701b5542629',NULL,NULL,'auth.login','user','missing','failure','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"reason":"unknown_user"}','2026-05-21T09:22:48.478Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('2a033e0b-c4cb-49e9-a2bf-6f3d649ad08a','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T09:23:01.201Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('9a5acaae-0ebd-40b3-b779-0f5da91b92d2','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T09:23:22.314Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('e3214751-58d9-4745-a32c-7fdd66c69385','usr_admin_001','admin','admin.site.create','site','7ac481b1-c294-47ca-b7d1-bd57943af224','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457',NULL,'2026-05-21T09:23:22.854Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('2272eecf-ac3f-4667-a0c8-f979222032c3','usr_admin_001','admin','admin.system.create','system','6abd2efc-e69d-4a84-a3eb-74a78d141a6c','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"siteId":"7ac481b1-c294-47ca-b7d1-bd57943af224","systemType":"Gas Suppression"}','2026-05-21T09:23:23.377Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('c3706764-eea2-4c55-acf5-0b847e2f41e0','usr_admin_001','admin','admin.job.create','job','3a305a59-009e-41b5-bf82-10485b13d281','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"systemId":"6abd2efc-e69d-4a84-a3eb-74a78d141a6c","assignedTechnicianId":"usr_tech_001","status":"Scheduled"}','2026-05-21T09:23:23.905Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('e9d5765e-3b4e-423b-85fc-3c7fba2fddbb','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T10:02:40.526Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('717ab00d-beb3-48fe-88c6-2e6dab58940a','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T10:10:52.179Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('673336fe-632d-4f28-b9d6-b77456a7f1eb','usr_tech_001','tech','job.status','job','3a305a59-009e-41b5-bf82-10485b13d281','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"status":"In Progress"}','2026-05-21T10:10:53.257Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('5eafd733-8295-4ad4-a392-637e093cd9d1','usr_tech_001','tech','jobcard.close','job','3a305a59-009e-41b5-bf82-10485b13d281','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"systemId":"6abd2efc-e69d-4a84-a3eb-74a78d141a6c","documentationPath":"jobcards/job-3a305a59-009e-41b5-bf82-10485b13d281-completed.pdf","nextDueDate":"2026-11-21","financialRecordId":"89a45415-c9a6-4a1d-af5b-2ec74825c83b","faultCategory":"Routine service","partsUsed":"None","followUpActions":"No follow-up required."}','2026-05-21T10:10:55.657Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('34965140-9e80-4662-a688-4f8834ac6ebd','usr_tech_001','tech','document.access','r2_object','jobcards/job-3a305a59-009e-41b5-bf82-10485b13d281-completed.pdf','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"siteId":"7ac481b1-c294-47ca-b7d1-bd57943af224"}','2026-05-21T10:10:56.485Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('7fdb3052-3cea-4dc6-905c-dbd47eaa25aa','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T10:11:25.340Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('e0286884-c62a-49d9-92ec-a6b9b0323539','usr_admin_001','admin','admin.job.create','job','34528dba-8ee9-4b43-ac93-820b0640aa30','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"systemId":"6abd2efc-e69d-4a84-a3eb-74a78d141a6c","assignedTechnicianId":"usr_tech_001","status":"Scheduled"}','2026-05-21T10:11:25.904Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('09791733-d970-4118-940c-1c987b87feda','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T10:13:25.779Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('2aaf1103-cd10-4d63-aba5-f3561247e4c1','usr_admin_001','admin','auth.logout','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36',NULL,'2026-05-21T10:17:35.165Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('67e272f0-cf18-4f6d-a19e-ffb5f5d003e6','usr_tech_001','tech','auth.login','user','usr_tech_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','{"redirectTo":"/portal/tech/dashboard"}','2026-05-21T10:17:49.537Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('1abfda2e-0e49-4124-8a79-2e47558cb762','usr_client_001','client','auth.login','user','usr_client_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/client/dashboard"}','2026-05-21T10:35:12.977Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('6ce2f8b4-c9ed-489f-8d36-403d6cc47bdb','usr_client_001','client','maintenance_request.create','maintenance_request','ad9ffaab-e97e-4a20-a084-a4f4d845fafa','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"siteId":"site_tequit_staging","systemId":null,"requestType":"Maintenance","priority":"Urgent"}','2026-05-21T10:35:14.217Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('2f97eb02-b089-4709-863d-638f41c8e93f','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T10:35:26.612Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('d2556f8a-4170-480b-84a5-17de487e67ad','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T11:03:27.979Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('db21cbcd-6ed4-4a31-9c88-2e055f087f6b','usr_admin_001','admin','admin.system.create','system','9aa3efbf-9959-4704-b4d4-8c84cce5c377','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"siteId":"site_tequit_staging","systemType":"Fire Detection"}','2026-05-21T11:03:28.518Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('4e9e6bf4-1bad-40a9-9000-b96040937426','usr_admin_001','admin','maintenance_request.status','maintenance_request','ad9ffaab-e97e-4a20-a084-a4f4d845fafa','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"status":"Reviewing"}','2026-05-21T11:03:29.215Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('2facf16f-3ed0-4ab9-9256-513d4dfcfa5d','usr_admin_001','admin','maintenance_request.schedule','maintenance_request','ad9ffaab-e97e-4a20-a084-a4f4d845fafa','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"jobId":"9fb22314-d4f1-4a43-9c62-dededecacedf","systemId":"9aa3efbf-9959-4704-b4d4-8c84cce5c377","assignedTechnicianId":"usr_tech_001","scheduledDate":"2026-05-23"}','2026-05-21T11:03:30.112Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('b8de8548-9f81-442f-8bfb-862be31ab00d','usr_client_001','client','auth.login','user','usr_client_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT; Windows NT 10.0; en-ZA) WindowsPowerShell/5.1.26100.8457','{"redirectTo":"/portal/client/dashboard"}','2026-05-21T11:03:45.715Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('195ad29e-240a-428e-97f6-a45efc34d768','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T15:00:10.027Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('4882236f-123b-4aea-aab0-4bc160b25628','usr_admin_001','admin','auth.login','user','usr_admin_001','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','{"redirectTo":"/portal/admin/dashboard"}','2026-05-21T15:00:12.307Z');
INSERT INTO "audit_events" ("id","actor_user_id","actor_role","event_type","entity_type","entity_id","outcome","ip_hash","user_agent","metadata_json","created_at") VALUES('5e3832f3-3d51-4ebf-9afc-c6a48f77c57d','usr_admin_001','admin','maintenance_request.status','maintenance_request','ad9ffaab-e97e-4a20-a084-a4f4d845fafa','success','Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36','{"status":"New"}','2026-05-21T15:00:22.211Z');
CREATE TABLE portal_rate_limits (
  rate_key TEXT PRIMARY KEY,
  scope TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT INTO "portal_rate_limits" ("rate_key","scope","window_start","attempts","updated_at") VALUES('portal.login:Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY:_6Y1g9-mcGuH0oS4aw1pOhYeSECq0sXPa10nw7liH30','portal.login',1779354900,1,'2026-05-21T09:22:47.902Z');
INSERT INTO "portal_rate_limits" ("rate_key","scope","window_start","attempts","updated_at") VALUES('portal.admin.maintenance_requests:Bo-qI-7Rasa4RRU7qruYEMsxafMXw37ONZesaX1PArY:z46mmbHtK5N5BnxNC0xf_ATNqQzIKa2qskabHLdVYfo','portal.admin.maintenance_requests',1779375600,1,'2026-05-21T15:00:21.434Z');
CREATE TABLE maintenance_requests (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  system_id TEXT REFERENCES systems(id) ON DELETE SET NULL,
  requester_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('Maintenance', 'Fault', 'Compliance Documentation', 'Quote Request', 'Emergency Follow-up')),
  priority TEXT NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'Critical')),
  status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Reviewing', 'Scheduled', 'Closed')),
  subject TEXT NOT NULL CHECK (length(trim(subject)) BETWEEN 3 AND 160),
  message TEXT NOT NULL CHECK (length(trim(message)) BETWEEN 10 AND 2000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
, linked_job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL);
INSERT INTO "maintenance_requests" ("id","site_id","system_id","requester_user_id","request_type","priority","status","subject","message","created_at","updated_at","linked_job_id") VALUES('ad9ffaab-e97e-4a20-a084-a4f4d845fafa','site_tequit_staging',NULL,'usr_client_001','Maintenance','Urgent','New','Staging maintenance request smoke','Please review this staging maintenance request generated by the deployment smoke test.','2026-05-21T10:35:14.021Z','2026-05-21T15:00:22.015Z','9fb22314-d4f1-4a43-9c62-dededecacedf');
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_sites_owner_company ON sites(owner_company_name);
CREATE INDEX idx_systems_site_due ON systems(site_id, next_due_date);
CREATE INDEX idx_jobs_technician_status ON jobs(assigned_technician_id, status, scheduled_date);
CREATE INDEX idx_jobs_system_status ON jobs(system_id, status);
CREATE INDEX idx_financial_site_status ON financial_records(site_id, payment_status, distribution_date);
CREATE INDEX idx_financial_job ON financial_records(job_id);
CREATE INDEX idx_audit_events_actor_created ON audit_events(actor_user_id, created_at);
CREATE INDEX idx_audit_events_type_created ON audit_events(event_type, created_at);
CREATE INDEX idx_rate_limits_scope_window ON portal_rate_limits(scope, window_start);
CREATE INDEX idx_maintenance_requests_site_status ON maintenance_requests(site_id, status, created_at);
CREATE INDEX idx_maintenance_requests_status_priority ON maintenance_requests(status, priority, created_at);
CREATE INDEX idx_maintenance_requests_system ON maintenance_requests(system_id);
CREATE INDEX idx_maintenance_requests_linked_job ON maintenance_requests(linked_job_id);
CREATE TRIGGER trg_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
CREATE TRIGGER trg_sites_updated_at
AFTER UPDATE ON sites
FOR EACH ROW
BEGIN
  UPDATE sites SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
CREATE TRIGGER trg_systems_updated_at
AFTER UPDATE ON systems
FOR EACH ROW
BEGIN
  UPDATE systems SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
CREATE TRIGGER trg_jobs_updated_at
AFTER UPDATE ON jobs
FOR EACH ROW
BEGIN
  UPDATE jobs SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
CREATE TRIGGER trg_financial_records_updated_at
AFTER UPDATE ON financial_records
FOR EACH ROW
BEGIN
  UPDATE financial_records SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
CREATE TRIGGER trg_maintenance_requests_updated_at
AFTER UPDATE ON maintenance_requests
FOR EACH ROW
BEGIN
  UPDATE maintenance_requests SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = OLD.id;
END;
