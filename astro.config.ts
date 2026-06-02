import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";
import sitemap from "@astrojs/sitemap";

const siteUrl = process.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";

export default defineConfig({
  site: siteUrl,
  devToolbar: {
    enabled: false
  },
  output: "server",
  adapter: cloudflare({
    persistState: true,
    configPath: "wrangler.portal.jsonc",
  }),
  integrations: [sitemap()],
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
