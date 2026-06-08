import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    alias: {
      'cloudflare:workers': resolve(__dirname, 'src/lib/server/test/mock-cloudflare-workers.ts')
    }
  }
});
