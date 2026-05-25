# Kharon Portal Structural Assets

This document outlines the structural, pipeline, and compliance assets required for the deployment infrastructure.

## 1. API Documentation

The OpenAPI 3.0 specification ([api-spec.yaml](./api-spec.yaml)) establishes the structural schema for the core portal API. It defines the global security scheme (CSRF and Session Auth) and fully details the critical authentication, client interaction, and Sage financial webhooks. The remaining administrative and technical routes are mapped structurally for down-stream population.

### Key Features:
- Global security schemes for session and CSRF tokens
- Public endpoints for contact and authentication
- Protected endpoints for all administrative and financial operations
- Structured for 28+ API endpoints with proper security contexts

## 2. CI/CD Pipeline

The GitHub Actions configuration ([.github/workflows/ci-cd.yml](../../.github/workflows/ci-cd.yml)) enforces strict TypeScript validation, ensures Tailwind CSS compilation efficiency via the purging script, and acts as a deployment gate for the Cloudflare Pages staging and production environments.

### Pipeline Stages:
- **Validation**: TypeScript strict validation and CSS purging
- **Build**: Application compilation with environment-specific variables
- **Deploy**: Conditional deployment to staging or production based on branch

## 3. Compliance Components

The South African compliance copywriting is implemented in the [CorporateCompliance.astro](../../src/components/compliance/CorporateCompliance.astro) component, providing the exact legal copy required to address South African corporate compliance metrics.

### Compliance Areas Covered:
- SAQCC Fire Certification requirements
- B-BBEE Status disclosure
- PAIA Manual accessibility

## 4. Algorithmic Logic

Two critical algorithms are implemented in the [src/lib/algorithms/](../../src/lib/algorithms/) directory:

### SLA Algorithm ([sla-algorithm.ts](../../src/lib/algorithms/sla-algorithm.ts)):
- Monitors time elapsed since critical defect or emergency ticket is logged
- Evaluates against predefined thresholds (e.g., 4-hour critical response window)
- Returns appropriate status flags and escalation requirements

### Capacity Balancing Algorithm ([capacity-balancing.ts](../../src/lib/algorithms/capacity-balancing.ts)):
- Calculates availability of field personnel for efficient dispatch routing
- Validates certifications and working-hour constraints
- Identifies optimal technician assignment based on load balancing

## Integration Points

These structural assets integrate with the existing codebase as follows:
- API documentation provides contract for all existing endpoints
- CI/CD pipeline validates and deploys the entire application
- Compliance components can be integrated into legal/landing pages
- Algorithms provide core business logic for dispatch optimization