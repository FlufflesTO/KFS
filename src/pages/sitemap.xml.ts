import type { APIRoute } from "astro";
import { site as siteConfig } from "../data/site";

export const GET: APIRoute = async ({ site }) => {
  const base = site?.toString() || `${siteConfig.url}/`;

  // Dynamically find all public-facing pages
  // Exclude API routes, portal, and dynamic [bracket] routes
  const pages = import.meta.glob("./**/*.astro");
  const dynamicPages = Object.keys(pages)
    .map((path) => {
      // Clean up the file path to a URL path
      // e.g. ./index.astro -> /
      // e.g. ./about.astro -> /about/
      let urlPath = path
        .replace(/^\.\//, "")
        .replace(/\.astro$/, "")
        .replace(/\/index$/, "")
        .replace(/^index$/, "");
      
      if (!urlPath.startsWith("/")) urlPath = "/" + urlPath;
      if (!urlPath.endsWith("/")) urlPath += "/";
      
      return urlPath;
    })
    .filter((path) => {
      return (
        !path.startsWith("/api/") &&
        !path.startsWith("/portal/") &&
        !path.includes("/[") && // Filter dynamic routes
        !path.includes("/404") &&
        !path.includes("/500")
      );
    })
    .sort();

  // Deduplicate
  const uniquePages = [...new Set(dynamicPages)];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePages
  .map((page) => {
    const url = new URL(page, base).toString();

    return `  <url>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === "/" ? "1.0" : "0.8"}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
};
