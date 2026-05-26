import { site } from "../data/site.js";

export function GET() {
  const isStagingDomain = new URL(site.url).hostname.endsWith("tequit.co.za");
  const body = isStagingDomain
    ? "User-agent: *\nDisallow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", site.url).toString()}\n`;

  return new Response(
    body,
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    }
  );
}
