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

// 3. Simple class pruning for standard tailwind classes
// This is a conservative approach to avoid breaking dynamic styles
const rules = output.split('}');
let prunedOutput = '';

for (let i = 0; i < rules.length; i++) {
  const rule = rules[i];
  if (!rule) continue;
  
  const parts = rule.split('{');
  if (parts.length !== 2) {
    prunedOutput += rule + '}';
    continue;
  }
  
  const selector = parts[0].trim();
  const body = parts[1].trim();
  
  if (selector.startsWith('.') && !selector.includes(':') && !selector.includes('[') && !selector.includes(' ')) {
    const className = selector.substring(1);
    if (usedClasses.has(className)) {
      prunedOutput += selector + '{' + body + '}';
    }
  } else {
    prunedOutput += selector + '{' + body + '}';
  }
}

output = prunedOutput;

// 4. Prune empty @media queries
output = output.replace(/@media[^{]+\{\s*\}/g, '');

// 5. Final pass for keyframes - only keep used ones
const keyframeMatches = output.match(/@keyframes\s+([\w-]+)/g);
if (keyframeMatches) {
  const usedKeyframes = new Set<string>();
  const animationRegex = /animation(?:\-name)?:\s*([\w-]+)/g;
  let animMatch;
  while ((animMatch = animationRegex.exec(output)) !== null) {
    usedKeyframes.add(animMatch[1]);
  }
  
  // Also check standard Kharon animations
  ['fade-in', 'slide-up', 'titan-drift', 'linework-drift', 'reveal-up'].forEach(k => usedKeyframes.add(k));

  const keyframeBlocks = output.split(/(@keyframes\s+[\w-]+\s*\{)/);
  let keyframePrunedOutput = '';
  let j = 0;
  while (j < keyframeBlocks.length) {
    const block = keyframeBlocks[j];
    if (block.startsWith('@keyframes')) {
      const name = block.match(/@keyframes\s+([\w-]+)/)![1];
      const content = keyframeBlocks[j+1];
      // Find the end of this keyframe block
      let depth = 1;
      let k = 0;
      while (depth > 0 && k < content.length) {
        if (content[k] === '{') depth++;
        if (content[k] === '}') depth--;
        k++;
      }
      
      if (usedKeyframes.has(name)) {
        keyframePrunedOutput += block + content.substring(0, k);
      }
      j += 2;
      // Skip the rest of the content that was consumed
      // We need to be careful here as the split might have missed nested braces
    } else {
      keyframePrunedOutput += block;
      j++;
    }
  }
}

// Use esbuild for advanced CSS minification
output = esbuild.transformSync(output, { loader: 'css', minify: true }).code;

console.log('Purged CSS size after variable pruning & minification:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
