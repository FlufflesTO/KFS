# Kharon Fire and Security Solutions: Tech Stack

## Overview
This document outlines the core technology stack for the Kharon Fire and Security Solutions platform. The system is built on a modern, edge-optimized architecture to ensure high availability, low latency, and robust offline capabilities for field operations.

## Core Technologies

### Frontend & UI
- **Framework:** Astro (v6.3.3)
- **Styling:** Tailwind CSS (v4)
- **Component Architecture:** Astro Components (with React integrations as needed for complex UI)

### Backend & API
- **Compute:** Cloudflare Pages (Serverless Functions)
- **Language:** TypeScript (Strict mode enforced, zero `any` policy)

### Database & Storage
- **Primary Database:** Cloudflare D1 (Distributed SQLite)
- **ORM:** Drizzle ORM
- **Object Storage:** Cloudflare R2 (used for document management, compliance certificates, and job evidence files)

### Infrastructure & Operations
- **Deployment:** Cloudflare Pages (Automated CI/CD via GitHub Actions)
- **Offline Sync:** Service Workers (sw.ts) and IndexedDB Draft Storage
- **Package Manager:** npm (Node.js >= 22.12.0)
