import type { APIRoute } from "astro";
import { site } from "../data/site";

export const GET: APIRoute = () => {
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
};
