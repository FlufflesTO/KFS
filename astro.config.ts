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
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        input: {
          // Main app entry
          index: "./src/pages/index.astro",
          // Service worker entry (built separately for Cloudflare Workers compatibility)
          sw: "./src/sw.ts"
        },
        output: {
          // Service worker output configuration
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "sw") {
              return "sw.js";
            }
            return "assets/[name]-[hash].js";
          },
          // Ensure service worker is in the root of public directory
          dir: "dist"
        }
      }
    },
    // Service worker specific configuration
    worker: {
      format: "es"
    }
  },
  // Build hooks for service worker registration
  // Note: Service worker is registered client-side via src/lib/client/sw-register.ts
});
