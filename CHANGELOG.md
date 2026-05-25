# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2026-05-25

### [Added]
- Added `docs/roadmap/PRODUCTION_AUDIT.md` outlining the comprehensive production readiness status, manual role-based QA checklist, D1/R2 storage bindings status, and production DNS/credential cutover requirements.

### [Changed]
- Reframed the portal finance dashboard (`src/pages/portal/finance/dashboard.astro`) and associated APIs (`records.js`, `payments.js`) to act as a Sage manual control register, replacing legacy ledger terminology with Sage-aligned labels (e.g. `Record Paid in Sage` and manual Sage reference fields).
