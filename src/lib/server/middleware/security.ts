/**
 * Security headers middleware
 * Adds security headers to protect against common web vulnerabilities
 */

export function addSecurityHeaders(headers: Headers): void {
  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Enable XSS protection
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Force HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Limit referrer information
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy
  headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://cdnjs.cloudflare.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://*.kharon.co.za https://*.tequit.co.za; " +
    "frame-src https://challenges.cloudflare.com; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );
}

/**
 * Security policy for specific routes
 */
export function getRouteSecurityPolicy(route: string): string {
  switch(route) {
    case '/portal':
    case '/portal/*':
      return "default-src 'self'; " +
             "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
             "style-src 'self' 'unsafe-inline'; " +
             "img-src 'self' data: blob: https:; " +
             "connect-src 'self' wss: https:; " +
             "media-src 'self' blob:; " +
             "object-src 'none';";
    case '/api/*':
      return "default-src 'self'; " +
             "script-src 'none'; " +
             "style-src 'none'; " +
             "img-src 'none'; " +
             "connect-src 'self';";
    default:
      return "default-src 'self'; " +
             "script-src 'self' 'unsafe-inline'; " +
             "style-src 'self' 'unsafe-inline'; " +
             "img-src 'self' data: https:;";
  }
}