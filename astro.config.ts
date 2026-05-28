import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

const siteUrl = process.env.PUBLIC_SITE_URL || "https://www.tequit.co.za";

export default defineConfig({
  site: siteUrl,
  output: "server",
  adapter: cloudflare({
    configPath: "wrangler.jsonc",
    persistState: true
  }),
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 900,
    },
  },
});
