# Contact Form API

<cite>
**Referenced Files in This Document**
- [contact.js](file://src/pages/api/contact.js)
- [contact.astro](file://src/pages/contact.astro)
- [admin.js](file://src/lib/server/admin.js)
- [rateLimit.js](file://src/lib/server/rateLimit.js)
- [bindings.js](file://src/lib/server/bindings.js)
- [request.js](file://src/lib/server/request.js)
- [0011_contact_submissions.sql](file://migrations/0011_contact_submissions.sql)
- [schema.sql](file://schema.sql)
- [ContextualInquiry.astro](file://src/components/sections/ContextualInquiry.astro)
- [site.js](file://src/data/site.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Endpoint Definition](#endpoint-definition)
3. [Request Schema](#request-schema)
4. [Response Schema](#response-schema)
5. [Validation Rules](#validation-rules)
6. [Spam Prevention](#spam-prevention)
7. [Rate Limiting](#rate-limiting)
8. [Database Storage](#database-storage)
9. [Integration Examples](#integration-examples)
10. [Security Considerations](#security-considerations)
11. [Troubleshooting](#troubleshooting)
12. [Conclusion](#conclusion)

## Introduction
This document provides comprehensive API documentation for the public contact form submission interface. The contact form endpoint accepts submissions from the public website, performs validation, applies rate limiting, and stores submissions in the database. The endpoint is designed to be robust against spam while maintaining a simple integration pattern for frontend implementations.

## Endpoint Definition
- **Method**: POST
- **URL**: `/api/contact`
- **Purpose**: Process contact form submissions from the public website
- **Response Format**: JSON

**Section sources**
- [contact.js:40-46](file://src/pages/api/contact.js#L40-L46)

## Request Schema
The contact form endpoint expects a JSON payload with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| website | string | No | Hidden field for bot detection (honeypot) |
| name | string | Yes | Full name of the submitter |
| email | string | Yes | Email address of the submitter |
| requestType | string | Yes | Type of contact request |
| message | string | Yes | Detailed message content |

### Allowed Request Types
The `requestType` field must match one of the predefined values:

- Emergency technical support
- Gas suppression evaluation
- Fire detection system review
- Compliance inspection
- Maintenance assessment
- Client records access
- Gas Suppression
- Fire Detection
- Compliance & Maintenance
- Critical Infrastructure
- Integrated Security
- Gas suppression assessment
- Fire detection review
- Compliance assessment
- Critical infrastructure protection discussion
- Emergency / SLA support
- Capability discussion
- Sector protection assessment
- Integrated infrastructure security review

**Section sources**
- [contact.js:8-31](file://src/pages/api/contact.js#L8-L31)
- [contact.astro:7-15](file://src/pages/contact.astro#L7-L15)

## Response Schema
The endpoint returns standardized JSON responses:

### Success Response
- **Status**: 200 OK
- **Body**: `{ "ok": true }`

### Validation Error Response
- **Status**: 422 Unprocessable Entity
- **Body**: `{ "ok": false, "message": "Error message describing validation failure" }`

### Rate Limit Error Response
- **Status**: 429 Too Many Requests
- **Headers**: `Retry-After: <seconds>`
- **Body**: `{ "ok": false, "message": "Too many submissions. Try again shortly." }`

### General Error Responses
- **Status**: 400 Bad Request (invalid JSON)
- **Status**: 500 Internal Server Error (database failure)
- **Status**: 503 Service Unavailable (database connection failure)

**Section sources**
- [contact.js:45-46](file://src/pages/api/contact.js#L45-L46)
- [contact.js:60-61](file://src/pages/api/contact.js#L60-L61)
- [contact.js:82-94](file://src/pages/api/contact.js#L82-L94)
- [contact.js:73-74](file://src/pages/api/contact.js#L73-L74)
- [contact.js:108-112](file://src/pages/api/contact.js#L108-L112)

## Validation Rules
The endpoint applies strict validation to all incoming data:

### Input Sanitization
- All text inputs are trimmed and validated for length
- Email addresses are normalized to lowercase
- Special characters are escaped during processing

### Length Constraints
- **Name**: 2-80 characters
- **Email**: Up to 120 characters (validated as email format)
- **Request Type**: 2-120 characters
- **Message**: 10-3000 characters

### Format Validation
- Email validation follows standard email format requirements
- Request type must be one of the allowed predefined values
- Website field (honeypot) should be empty for legitimate submissions

**Section sources**
- [admin.js:18-50](file://src/lib/server/admin.js#L18-L50)
- [contact.js:54-58](file://src/pages/api/contact.js#L54-L58)

## Spam Prevention
The contact form implements multiple layers of spam protection:

### Honeypot Field
- A hidden `website` field is included in the form
- Legitimate submissions typically leave this field empty
- If populated, the submission is accepted silently (no processing)

### IP-Based Rate Limiting
- Submissions are tracked per IP address using SHA-256 hashing
- Maximum 5 submissions per 15 minutes per IP
- Exceeding the limit triggers rate limiting response

### Request Fingerprinting
- IP addresses are hashed using SHA-256 for privacy
- Fingerprint includes IP hash and optional subject identifier
- Prevents direct correlation of submissions to individual users

**Section sources**
- [contact.js:48-50](file://src/pages/api/contact.js#L48-L50)
- [contact.js:76-94](file://src/pages/api/contact.js#L76-L94)
- [request.js:26-35](file://src/lib/server/request.js#L26-L35)

## Rate Limiting
The rate limiting mechanism provides configurable protection:

### Configuration
- **Scope**: `public.contact`
- **Max Attempts**: 5 submissions
- **Window**: 15 minutes (900 seconds)
- **Subject**: IP hash (SHA-256)

### Behavior
- Attempts are tracked per IP address
- Window resets every 15 minutes
- Retry-After header indicates remaining wait time
- Database maintains attempt counts and timestamps

### Database Structure
The rate limiting uses the `portal_rate_limits` table with:
- `rate_key`: Composite key combining scope, IP hash, and subject hash
- `attempts`: Current count within the active window
- `window_start`: Timestamp marking the beginning of the current window

**Section sources**
- [rateLimit.js:3-46](file://src/lib/server/rateLimit.js#L3-L46)
- [schema.sql:142-148](file://schema.sql#L142-L148)

## Database Storage
Contact submissions are stored in the `contact_submissions` table:

### Table Schema
- **id**: Unique identifier (cq-<timestamp>-<random>)
- **name**: Trimmed name (2-80 chars)
- **email**: Valid email address
- **request_type**: Valid request type (2-120 chars)
- **message**: Trimmed message (10-3000 chars)
- **ip_hash**: SHA-256 hash of client IP
- **submitted_at**: Automatic timestamp

### Storage Process
- Submission ID is generated using timestamp and random string
- All text is sanitized and validated before insertion
- IP address is hashed before storage for privacy
- Database constraints enforce data integrity

**Section sources**
- [0011_contact_submissions.sql:1-11](file://migrations/0011_contact_submissions.sql#L1-L11)
- [schema.sql:192-202](file://schema.sql#L192-L202)
- [contact.js:96-105](file://src/pages/api/contact.js#L96-L105)

## Integration Examples
The contact form is integrated into multiple frontend components:

### Basic HTML Form Integration
The public contact page includes a form with:
- Hidden website field for honeypot protection
- Required name, email, request type, and message fields
- JavaScript that submits to `/api/contact` endpoint

### Contextual Inquiry Integration
The contextual inquiry component demonstrates:
- Dynamic form construction with hidden fields
- Proper error handling for submission failures
- User feedback through result elements

### Frontend Implementation Pattern
```javascript
// Example submission pattern
const formData = new FormData(formElement);
const payload = {
  website: formData.get("website") || "",
  name: formData.get("name") || "",
  email: formData.get("email") || "",
  requestType: formData.get("requestType") || "",
  message: formData.get("message") || ""
};

fetch("/api/contact", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(payload)
});
```

**Section sources**
- [contact.astro:84-145](file://src/pages/contact.astro#L84-L145)
- [ContextualInquiry.astro:33-132](file://src/components/sections/ContextualInquiry.astro#L33-L132)

## Security Considerations
The contact form implementation incorporates several security measures:

### Input Sanitization
- All text inputs are trimmed and validated
- Email addresses are normalized and validated
- Special characters are escaped during processing
- Length constraints prevent buffer overflow attacks

### Privacy Protection
- IP addresses are hashed using SHA-256 before storage
- Database constraints ensure minimal data retention
- No personally identifiable information is stored beyond what's necessary

### Abuse Prevention
- Honeypot field catches automated submissions
- Rate limiting prevents brute force attacks
- Request fingerprinting protects user privacy
- Database constraints enforce data integrity

### Error Handling
- Graceful error handling for malformed requests
- Database connection failures return service unavailable
- Validation errors return clear, actionable messages
- Server errors are logged without exposing sensitive information

**Section sources**
- [admin.js:18-50](file://src/lib/server/admin.js#L18-L50)
- [contact.js:63-67](file://src/pages/api/contact.js#L63-L67)
- [bindings.js:18-26](file://src/lib/server/bindings.js#L18-L26)

## Troubleshooting
Common issues and their resolutions:

### Submission Rejected with Validation Error
- **Cause**: Input doesn't meet validation criteria
- **Solution**: Check field lengths and formats
- **Example**: Name must be 2-80 characters, email must be valid

### Rate Limit Exceeded
- **Cause**: Too many submissions within 15-minute window
- **Solution**: Wait for `Retry-After` seconds before resubmitting
- **Check**: Verify browser clock synchronization

### Database Connection Issues
- **Cause**: Temporary database unavailability
- **Solution**: Retry submission after brief delay
- **Alternative**: Email admin@kharon.co.za directly

### Honeypot Detection
- **Cause**: Hidden website field contains data
- **Solution**: Ensure form is not auto-filled by bots
- **Prevention**: Use proper form field attributes

**Section sources**
- [contact.js:59-61](file://src/pages/api/contact.js#L59-L61)
- [contact.js:82-94](file://src/pages/api/contact.js#L82-L94)
- [contact.js:72-74](file://src/pages/api/contact.js#L72-L74)
- [contact.js:48-50](file://src/pages/api/contact.js#L48-L50)

## Conclusion
The contact form API provides a robust, secure, and user-friendly interface for public inquiries. Its design balances usability with strong spam prevention and privacy protections. The endpoint's clear validation rules, comprehensive error handling, and rate limiting make it suitable for production deployment while maintaining simplicity for frontend integration.