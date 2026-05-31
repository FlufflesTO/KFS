/**
 * Project Kharon - CSS Purge Post-Build Step
 * Purpose: Post-build script that prunes unused Tailwind CSS classes from built files
 * Dependencies: Node fs, path modules
 * Structural Role: Build pipeline asset optimizer
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
let distDir = path.join(root, 'dist/_astro');

if (!fs.existsSync(distDir)) {
  distDir = path.join(root, 'dist/client/_astro');
}

if (!fs.existsSync(distDir)) {
  console.log('dist directory not found. Skipping CSS purge.');
  process.exit(0);
}

const files = fs.readdirSync(distDir);
const cssFile = files.find(f => f.startsWith('global.') && f.endsWith('.css'));
if (!cssFile) {
  console.log('CSS file not found. Skipping CSS purge.');
  process.exit(0);
}

const cssPath = path.join(distDir, cssFile);
let css = fs.readFileSync(cssPath, 'utf8');
console.log('Original CSS size:', css.length, 'bytes');

if (css.length < 5000) {
  console.log('CSS is already purged/empty. Skipping.');
  process.exit(0);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const allFiles = walk(srcDir).map(p => p.replace(/\\/g, '/'));
const components = allFiles.filter(f => f.includes('/src/components/') && f.endsWith('.astro'));

const componentUsage: Record<string, string[]> = {};

function extractClasses(content: string): string[] {
  const classes: string[] = [];
  const classMatches = content.match(/class(?:Name)?=["']([^"']+)["']/g);
  if (classMatches) {
    classMatches.forEach(m => {
      const parts = m.match(/["']([^"']+)["']/);
      if (parts && parts[1]) {
        parts[1].split(/\s+/).forEach(c => {
          if (c && !c.includes('{') && !c.includes('?')) {
            classes.push(c);
          }
        });
      }
    });
  }
  return [...new Set(classes)];
}

components.forEach(comp => {
  const content = fs.readFileSync(comp, 'utf8');
  componentUsage[comp] = extractClasses(content);
});

const usedClasses = new Set<string>();
Object.values(componentUsage).flat().forEach(c => usedClasses.add(c));

// Add some safety globals
['html', 'body', 'root', 'portal-shell', 'main', 'selection'].forEach(c => usedClasses.add(c));

let output = css;

// 1. Remove comments
output = output.replace(/\/\*[\s\S]*?\*\//g, '');

// 2. Variable pruning - only keep variables that are actually used
const varRegex = /--[\w-]+:\s*[^;]+;/g;
const varUsageRegex = /var\((--[\w-]+)\)/g;

const allVars = output.match(varRegex) || [];
const usedVars = new Set<string>();

let match;
while ((match = varUsageRegex.exec(output)) !== null) {
  usedVars.add(match[1]);
}

// Add brand vars to used set just in case
allVars.forEach(v => {
  if (v.includes('--color-kharon') || v.includes('--color-surface')) {
    usedVars.add(v.split(':')[0].trim());
  }
});

output = output.replace(varRegex, (m) => {
  const varName = m.split(':')[0].trim();
  return usedVars.has(varName) ? m : '';
});

// 3. Prune empty @media queries (safe regex, doesn't break nesting)
output = output.replace(/@media[^{]+\{\s*\}/g, '');

// Use esbuild for advanced CSS minification
output = esbuild.transformSync(output, { loader: 'css', minify: true }).code;

console.log('Purged CSS size after variable pruning & minification:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
