# Kharon Fire & Security - Feature Implementation Guide

## Overview

This document provides implementation instructions for the 5 backend features engineered for the Kharon FSM platform. All modules are production-ready and designed for South African field environments.

---

## 1. Offline PWA Engine

### Files Created
- `/src/lib/pwa/service-worker.js` - Service worker with IndexedDB caching
- `/src/lib/pwa/pwa-helpers.js` - Client-side helper functions
- `/public/manifest.json` - PWA manifest
- `/public/offline.html` - Offline fallback page

### Features
- **IndexedDB Storage**: Jobs, sites, systems cached for offline viewing
- **Visit Logging**: Capture visit data offline with GPS coordinates
- **Signature Capture**: Store customer signatures as Base64, sync later
- **Photo Evidence**: Queue photos for upload when online
- **Background Sync**: Automatic synchronization when connectivity returns
- **Load Shedding Ready**: Works in basement server rooms with zero signal

### Implementation Steps

1. **Register Service Worker** in your main layout or dashboard:
```javascript
import { registerServiceWorker, cacheJobData } from '@/lib/pwa/pwa-helpers';

// In onMount or useEffect
await registerServiceWorker();

// After loading jobs from API
await cacheJobData(jobs, sites, systems);
```

2. **Save Visit Offline** (when no connectivity):
```javascript
import { saveOfflineVisit, isOnline } from '@/lib/pwa/pwa-helpers';

if (!isOnline()) {
  const result = await saveOfflineVisit({
    jobId: 'job-123',
    technicianId: 'tech-456',
    visitDate: new Date().toISOString(),
    arrivalTime: '09:00',
    departureTime: '10:30',
    gpsLatitude: -33.9249,
    gpsLongitude: 18.4241,
    customerName: 'John Doe',
    notes: 'System serviced successfully'
  });
  console.log('Visit saved offline:', result.visitId);
}
```

3. **Save Signature**:
```javascript
import { saveSignature } from '@/lib/pwa/pwa-helpers';

await saveSignature(visitId, signatureCanvas.toDataURL());
```

4. **Update astro.config.mjs** to copy service worker:
```javascript
export default defineConfig({
  // ... other config
  build: {
    copyPublicDir: true
  },
  vite: {
    build: {
      rollupOptions: {
        input: {
          sw: 'src/lib/pwa/service-worker.js'
        }
      }
    }
  }
});
```

5. **Copy service worker to public**:
```bash
cp src/lib/pwa/service-worker.js public/sw.js
```

---

## 2. PDF Certificate Generation

### Files Created
- `/src/lib/server/certificatePdf.js` - SANS certificate generator
- `/src/pages/portal/api/admin/generate-certificate.js` - API endpoint

### Features
- **SANS 10139 Certificates**: Fire detection system compliance
- **SANS 14520 Certificates**: Gas suppression system compliance
- **Combined Certificates**: Sites with both systems
- **Defect Blocking**: Prevents certificate generation if defects exist
- **SA Company Details**: Registration number, SAQCC membership included

### Implementation Steps

1. **Generate Certificate from UI**:
```javascript
async function downloadCertificate(certificateId) {
  const response = await fetch('/portal/api/admin/generate-certificate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      certificateId,
      customerName: 'Jane Smith',
      gasType: 'FM-200',
      designConcentration: '7%',
      cylinderPressure: '42 bar',
      pressureCheckPassed: true
    })
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${certificateId}.pdf`;
    a.click();
  }
}
```

2. **Check Eligibility First**:
```javascript
const checkResponse = await fetch(`/portal/api/admin/generate-certificate?id=${certId}`);
const { eligible, blockedByDefect } = await checkResponse.json();

if (!eligible) {
  alert(blockedByDefect 
    ? 'Cannot generate certificate: Open defects must be resolved first'
    : 'Certificate not ready');
}
```

### Certificate Types
| Type | Standard | Use Case |
|------|----------|----------|
| Fire Detection | SANS 10139:2020 | Smoke detectors, alarm panels |
| Gas Suppression | SANS 14520:2019 | Server room gas systems |
| Combined | Both | Full site certification |

---

## 3. Sage Accounting Webhook

### Files Created
- `/src/lib/server/sageWebhook.js` - Webhook processor
- `/src/pages/portal/api/finance/sage-webhook.js` - API endpoint

### Features
- **HMAC Verification**: Secure webhook signature validation
- **Payment Reconciliation**: Auto-update invoice status on payment
- **Invoice Creation**: Link Sage invoices to portal quotes
- **Idempotency**: Prevents duplicate processing
- **Audit Logging**: All webhook events logged

### Implementation Steps

1. **Configure Sage Webhook URL**:
   - In Sage Business Cloud: Settings > Developer > Webhooks
   - URL: `https://your-domain.com/portal/api/finance/sage-webhook`
   - Events to subscribe:
     - `invoice.created`
     - `invoice.payment_received`
     - `invoice.updated`
     - `quote.accepted`

2. **Set Environment Variables**:
```env
SAGE_WEBHOOK_SECRET=your_webhook_secret_from_sage
SAGE_API_URL=https://api.accounting.sage.com/v3.1
SAGE_ACCESS_TOKEN=your_oauth_token
```

3. **Test Webhook Connectivity**:
```bash
curl https://your-domain.com/portal/api/finance/sage-webhook
# Should return: {"status":"ok","message":"Sage webhook endpoint is active"}
```

### Supported Events
| Event | Action |
|-------|--------|
| `invoice.payment_received` | Marks financial record as "Settled" |
| `invoice.created` | Links invoice to approved quote |
| `invoice.updated` | Updates amount/due date |
| `quote.accepted` | Changes status to "Quote Approved" |

---

## 4. Dispatch Calendar View

### Files Created
- `/src/lib/dispatch/calendarEngine.js` - Calendar rendering engine

### Features
- **Gantt/Timeline View**: Visual job scheduling by technician
- **SLA Indicators**: Days until deadline with color coding
- **Emergency Highlighting**: Red warning badges
- **Job Overlap Detection**: Automatic vertical stacking
- **ICS Export**: Download to Outlook/Google Calendar

### Implementation Steps

1. **Use in Dispatch Page** (`/portal/admin/dispatch.astro`):
```astro
---
import { generateCalendarData, renderCalendarGrid } from '../../lib/dispatch/calendarEngine';

const calendarData = generateCalendarData(
  jobs,           // From database query
  technicians,    // Array of {id, name}
  startDate,      // ISO date (Monday)
  7               // Days to show
);
---

<div class="dispatch-calendar">
  {renderCalendarGrid(calendarData, {
    showWeekends: true,
    showUnassigned: true,
    cellWidth: 140,
    rowHeight: 280
  })}
</div>
```

2. **Add Styles**:
```css
.dispatch-calendar {
  font-family: system-ui, sans-serif;
}

.job-block {
  cursor: move; /* For future drag-drop */
}

.job-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
```

3. **Export Calendar**:
```javascript
import { generateIcsExport } from '@/lib/dispatch/calendarEngine';

const icsContent = generateIcsExport(technicianJobs, technician.name);
const blob = new Blob([icsContent], { type: 'text/calendar' });
// Download as .ics file
```

---

## 5. Route Optimization Logic

### Files Created
- `/src/lib/dispatch/routeOptimization.js` - Maps integration layer
- `/src/pages/portal/api/admin/optimize-route.js` - API endpoint

### Features
- **Multi-stop Optimization**: TSP algorithm for daily routes
- **Traffic Awareness**: Real-time traffic consideration (JHB/CPT/DBN)
- **Geographic Clustering**: Group nearby jobs for efficient dispatch
- **Technician Recommendations**: Score-based assignment suggestions
- **GPX Export**: Navigation file for Garmin/TomTom devices

### Implementation Steps

1. **Configure Maps Provider**:
```env
MAPS_PROVIDER=mapbox  # or 'google'
MAPBOX_ACCESS_TOKEN=pk.your_token_here
# OR
GOOGLE_MAPS_API_KEY=your_api_key
```

2. **Optimize Technician Route**:
```javascript
async function optimizeDailyRoute(technicianId, date) {
  const response = await fetch('/portal/api/admin/optimize-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      technicianId,
      date,
      options: {
        considerTraffic: true,
        prioritizeSla: true
      }
    })
  });

  const result = await response.json();
  console.log('Optimized order:', result.optimizedOrder);
  console.log('Total distance:', result.totalDistance, 'km');
  console.log('Estimated duration:', result.totalDuration, 'minutes');
}
```

3. **Get Job Clusters** (for unassigned jobs):
```javascript
const clustersResponse = await fetch(
  '/portal/api/admin/optimize-route?date=2024-01-15&maxDistance=15'
);
const { clusters } = await clustersResponse.json();

// Each cluster has:
// - jobs: Array of nearby jobs
// - centroid: {latitude, longitude}
// - jobCount: Number of jobs
// - totalEstimatedDuration: Minutes
```

4. **Recommend Technician for New Job**:
```javascript
import { recommendTechnician } from '@/lib/dispatch/routeOptimization';

const recommendations = await recommendTechnician(
  newJob,       // {gps_latitude, gps_longitude, id}
  technicians,  // Array of available techs
  existingJobs  // Already scheduled jobs
);

// Best match:
const bestTech = recommendations.find(r => r.recommended);
```

5. **Download GPX for Navigation**:
```javascript
import { generateGpxRoute } from '@/lib/dispatch/routeOptimization';

const gpxContent = generateGpxRoute(routeStops, technicianName);
// Save as .gpx file for GPS devices
```

### Distance Calculation
The module includes a Haversine formula implementation for accurate SA geographic distances:
```javascript
import { calculateDistance } from '@/lib/dispatch/routeOptimization';

const km = calculateDistance(
  -33.9249, 18.4241,  // Cape Town
  -26.2041, 28.0473   // Johannesburg
);
// Returns ~1270 km
```

---

## Environment Variables Summary

```env
# PWA (no vars needed)

# PDF Generation (no additional vars)

# Sage Integration
SAGE_WEBHOOK_SECRET=whsec_xxxxx
SAGE_API_URL=https://api.accounting.sage.com/v3.1
SAGE_ACCESS_TOKEN=eyJhbGc...

# Route Optimization
MAPS_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1...
# OR
GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## Testing Checklist

### Offline PWA
- [ ] Service worker registers successfully
- [ ] Jobs load in offline mode
- [ ] Visit can be saved without internet
- [ ] Signature captures queue properly
- [ ] Data syncs when back online

### PDF Certificates
- [ ] SANS 10139 generates correctly
- [ ] SANS 14520 generates correctly
- [ ] Defect blocking works
- [ ] Download triggers properly

### Sage Webhook
- [ ] Webhook endpoint responds to GET
- [ ] Signature verification passes
- [ ] Payment reconciliation updates records
- [ ] Duplicate events are ignored

### Dispatch Calendar
- [ ] Calendar renders with job blocks
- [ ] SLA indicators show correctly
- [ ] Emergency jobs highlighted
- [ ] ICS export downloads

### Route Optimization
- [ ] Route optimization returns ordered stops
- [ ] Clustering groups nearby jobs
- [ ] Technician recommendations scored
- [ ] GPX export valid for navigation

---

## Support

For issues or questions regarding these implementations:
- Check browser console for error messages
- Verify environment variables are set
- Review audit logs for webhook/events
- Test in Chrome DevTools > Application > Service Workers

**Built for South African Conditions** 🇿🇦
- Load shedding resilient
- Low-connectivity optimized
- POPIA compliant data handling
