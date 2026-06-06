/**
 * Site Configuration
 * Purpose: Centralized site configuration for components
 * Dependencies: None
 * Structural Role: Shared configuration export
 */

export const SITE_CONFIG = {
  title: "Kharon Fire & Security",
  description: "Specialist Fire and Security Solutions",
  url: import.meta.env.PUBLIC_SITE_URL || "https://www.kharon.co.za",
  portalUrl: import.meta.env.PUBLIC_PORTAL_URL || "https://portal.kharon.co.za",
  contactEmail: import.meta.env.PUBLIC_CONTACT_EMAIL || "admin@kharon.co.za",
  phone: "061 545 8830",
  address: "Unit 58, M5 Freeway Park, Cnr Uppercamp & Berkley Rd, Ndabeni, Maitland, 7405",
  registration: "2016/313076/07"
};
