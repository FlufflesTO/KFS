import { sitemapPages, site as siteConfig } from "../data/site.js";

export async function GET({ site }) {
  const base = site?.toString() || `${siteConfig.url}/`;

const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages
  .map((page) => {
    const url = new URL(page, base).toString();

    return `  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
}
