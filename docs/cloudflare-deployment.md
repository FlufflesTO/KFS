# Kharon Cloudflare Deployment Configuration

## 🚀 Overview
This document describes the Cloudflare Pages deployment configuration for the Kharon Fire & Security Solutions website. The deployment is configured for high availability, security, and performance optimization.

## 🏗️ Architecture
- **Platform**: Cloudflare Pages (Server-Side Rendering)
- **Database**: Cloudflare D1 (SQL Database)
- **Storage**: Cloudflare R2 (Object Storage)
- **Environment**: Production (www.tequit.co.za, portal.tequit.co.za)

## 📋 Deployment Configuration

### Domain Setup
```json
{
  "routes": [
    {
      "pattern": "tequit.co.za/*",
      "zone_name": "tequit.co.za"
    },
    {
      "pattern": "www.tequit.co.za/*",
      "zone_name": "tequit.co.za"
    },
    {
      "pattern": "portal.tequit.co.za/*",
      "zone_name": "tequit.co.za"
    }
  ]
}
```

### Database Configuration
- **Binding**: `DB`
- **Database Name**: `kharon-portal`
- **Database ID**: `327db922-1c44-438d-8328-af7ba33e9ae0`
- **Migration Directory**: `migrations/`

### Storage Configuration
- **Binding**: `STORAGE`
- **Bucket Name**: `kharon-portal-storage`

### Environment Variables
- `SESSION_COOKIE_NAME`: `kharon_session_token`
- `STANDARD_SERVICE_FEE`: `1850.00`

## 🚀 Deployment Process

### Prerequisites
1. Cloudflare account with proper permissions
2. Wrangler CLI installed (`npm install -g wrangler`)
3. OAuth authentication configured
4. Account ID set in environment

### Deployment Commands
```bash
# Login and authenticate
npm run auth:cloudflare

# Check current status
npm run cloudflare:whoami

# View project list
npm run cloudflare:list

# Deploy to production
npm run deploy:cloudflare

# Deploy to preview
npm run deploy:cloudflare:preview
```

### Automated Build Process
The deployment process includes:
1. Environment variable configuration
2. Astro build process
3. CSS purging optimization
4. Asset optimization
5. Cloudflare Pages deployment

## 🔧 Build Configuration

### Astro Configuration
```typescript
export default defineConfig({
  site: siteUrl,
  output: "server",  // Server-Side Rendering
  adapter: cloudflare({
    configPath: "wrangler.jsonc",
    persistState: true
  }),
  vite: {
    build: {
      chunkSizeWarningLimit: 900,  // Increased for larger bundles
    },
  },
});
```

### Build Scripts
- `npm run build`: Main build with CSS purging
- `npm run build:staging`: Staging build with tequit.co.za URLs
- `npm run build:production:kharon`: Production build with kharon.co.za URLs

## 🔒 Security Configuration

### Authentication Flow
- OAuth-based authentication
- Session management with CSRF protection
- MFA implementation
- Rate limiting and IP-based security

### SSL/TLS
- Automatic SSL certificate management
- HSTS headers
- Secure cookies

## 📊 Performance Optimization

### Caching Strategy
- Edge caching for static assets
- Dynamic content caching with appropriate TTL
- CDN distribution

### Asset Optimization
- CSS purging (reduced from 110KB to ~90KB)
- Image optimization with WebP fallbacks
- JavaScript bundling and minification

## 🧪 Testing & Validation

### Pre-deployment Checks
- Build process validation
- Type checking
- Link validation
- Performance metrics
- Security scanning

### Post-deployment Monitoring
- Health checks
- Performance monitoring
- Error tracking
- User experience metrics

## 🔄 Rollback Procedures

In case of deployment issues:
1. Identify the problematic release
2. Use Cloudflare Pages rollback feature
3. Monitor for service restoration
4. Investigate and fix the issue
5. Redeploy with fix

## 📞 Support & Maintenance

### Contact Information
- Primary: admin@kharon.co.za
- Technical: admin@kharon.co.za

### Monitoring
- Automated health checks
- Performance monitoring
- Security scanning
- Uptime monitoring

## 📈 Performance Targets

- Build size: < 91KB (achieved: ~90KB)
- Load time: < 3 seconds
- TTFB: < 200ms
- Core Web Vitals: All green