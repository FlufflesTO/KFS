#!/usr/bin/env node

/**
 * Service Worker Build Script
 * Purpose: Isolated compilation phase for service worker to prevent race conditions
 * Dependencies: esbuild
 * 
 * This script runs as a standalone pre-build step to ensure the service worker
 * is compiled before the main Astro build begins, preventing asset bundling conflicts.
 */

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const publicDir = join(rootDir, 'public');

// Ensure public directory exists
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

async function buildServiceWorker() {
  const inputFile = join(srcDir, 'sw.ts');
  const outputFile = join(publicDir, 'sw.js');

  try {
    await esbuild.build({
      entryPoints: [inputFile],
      outfile: outputFile,
      format: 'iife',
      target: ['es2020'],
      minify: true,
      sourcemap: false,
      bundle: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    const output = await esbuild.build({
      entryPoints: [inputFile],
      outfile: outputFile,
      format: 'iife',
      target: ['es2020'],
      minify: true,
      sourcemap: false,
      bundle: true,
      metafile: true,
      define: {
        'process.env.NODE_ENV': '"production"'
      }
    });

    // Log build result
    const metafile = output.metafile;
    if (metafile) {
      const outputEntry = metafile.outputs[outputFile];
      if (outputEntry) {
        const sizeKB = (outputEntry.bytes / 1024).toFixed(2);
        console.log(`✓ Service worker built: sw.js (${sizeKB} KB)`);
      }
    } else {
      console.log('✓ Service worker built: sw.js');
    }

    return true;
  } catch (error) {
    console.error('✗ Service worker build failed:', error.message);
    process.exit(1);
  }
}

// Run build
buildServiceWorker();
