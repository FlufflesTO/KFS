import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const siteUrl = process.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";
const buildTarget = process.env.BUILD_TARGET || "portal";

export default defineConfig({
  site: siteUrl,
  session: buildTarget === "website" ? {
    driver: {
      entrypoint: "unstorage/drivers/null"
    }
  } : undefined,
  devToolbar: {
    enabled: false
  },
  output: "server",
  adapter: cloudflare({
    persistState: true,
    configPath: buildTarget === "website" ? "wrangler.website.jsonc" : "wrangler.portal.jsonc",
  }),
  integrations: [sitemap({
    filter: (page) => {
      if (buildTarget !== "website") return true;
      const pathname = new URL(page).pathname;
      return !pathname.startsWith("/portal") && !pathname.startsWith("/api");
    }
  })],
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 900,
      // Service worker is built separately via pre-build script (npm run build:sw)
      // to prevent race conditions during asset bundling
    },
  },
});
