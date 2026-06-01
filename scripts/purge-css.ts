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
// Mirror Tailwind's @source directive: only scan .astro files
const astroFiles = allFiles.filter(f => f.endsWith('.astro'));

function extractClasses(content: string): string[] {
  const classes: string[] = [];
  // class="..." and class='...' (static attributes)
  const attrRe = /class(?:Name)?=["']([^"']+)["']/g;
  let m;
  while ((m = attrRe.exec(content)) !== null) {
    m[1].split(/\s+/).forEach(c => {
      if (c && !/[{?$]/.test(c)) classes.push(c);
    });
  }
  // class={`...`} template literal expressions
  const tmplRe = /class(?:Name)?=\{`([^`{}]+)`\}/g;
  while ((m = tmplRe.exec(content)) !== null) {
    m[1].split(/\s+/).forEach(c => {
      if (c && !/[{?$]/.test(c)) classes.push(c);
    });
  }
  return [...new Set(classes)];
}

const usedClasses = new Set<string>();
astroFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  extractClasses(content).forEach(c => usedClasses.add(c));
});

// Always keep element/global selectors
['html', 'body', 'root', 'portal-shell', 'main', 'selection'].forEach(c => usedClasses.add(c));

/**
 * Brace-depth-aware CSS rule pruner (recursive).
 *
 * For each rule in `css`:
 *   - Simple single-class selector (.foo) → drop if class not in `used`
 *   - At-rule with a block (@layer, @media, @supports) → recurse into body
 *   - @keyframes → always keep intact (no recursion, content is not selectors)
 *   - Everything else → keep as-is
 */
function pruneClasses(css: string, used: Set<string>): string {
  let result = '';
  let i = 0;
  const len = css.length;

  while (i < len) {
    const prelStart = i;

    // Scan to next '{' or '}' (handles stray closing braces)
    let j = i;
    while (j < len && css[j] !== '{' && css[j] !== '}') j++;

    if (j >= len) {
      result += css.slice(i);
      break;
    }

    if (css[j] === '}') {
      result += css.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    const prelude = css.slice(prelStart, j).trim();

    // Collect the balanced { ... } body (inner content, not including braces)
    let depth = 1;
    let k = j + 1;
    while (k < len && depth > 0) {
      if (css[k] === '{') depth++;
      else if (css[k] === '}') depth--;
      k++;
    }

    // If brace was never closed, keep everything verbatim to avoid silent data loss
    if (depth > 0) {
      result += css.slice(i);
      break;
    }

    const innerBody = css.slice(j + 1, k - 1);

    const isSimpleClass = /^\.[a-zA-Z][\w-]*$/.test(prelude);
    const isKeyframes = /^@keyframes\b/.test(prelude);
    const isAtBlock = /^@/.test(prelude);

    if (isSimpleClass) {
      if (used.has(prelude.slice(1))) {
        result += prelude + '{' + innerBody + '}';
      }
    } else if (isKeyframes) {
      // Keep keyframes verbatim — their body contains percentage rules, not selectors
      result += prelude + '{' + innerBody + '}';
    } else if (isAtBlock) {
      // Recurse into @layer / @media / @supports bodies
      result += prelude + '{' + pruneClasses(innerBody, used) + '}';
    } else {
      result += prelude + '{' + innerBody + '}';
    }

    i = k;
  }

  return result;
}

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

// 3. Prune unused simple class rules (brace-depth-aware, recurses into @layer/@media)
output = pruneClasses(output, usedClasses);

// 4. Prune empty @media queries (safe regex, doesn't break nesting)
output = output.replace(/@media[^{]+\{\s*\}/g, '');

// Use esbuild for advanced CSS minification
output = esbuild.transformSync(output, { loader: 'css', minify: true }).code;

console.log('Purged CSS size after variable pruning & minification:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
