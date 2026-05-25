/**
 * Project Sentinel - CSS Purge Post-Build Step
 * Purpose: Post-build script that prunes unused Tailwind CSS classes from built files
 * Dependencies: Node fs, path modules
 * Structural Role: Build pipeline asset optimizer
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const distDir = path.join(root, 'dist/client/_astro');

if (!fs.existsSync(distDir)) {
  console.log('dist directory not found. Skipping CSS purge.');
  process.exit(0);
}

const cssFile = fs.readdirSync(distDir).find(f => f.startsWith('global.') && f.endsWith('.css'));
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

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const astroFiles = walk(srcDir).filter(f => f.endsWith('.astro'));
const usedWords = new Set();

for (const file of astroFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Extract words inside class/class:list attributes
  const classMatches = content.match(/class(?::list)?\s*=\s*(?:["']([\s\S]*?)["']|\{[\s\S]*?\})/g) || [];
  for (const match of classMatches) {
    const words = match.match(/[a-zA-Z0-9_\-\/\[\]\:]+/g) || [];
    for (const w of words) {
      if (w !== 'class' && w !== 'list' && w !== 'true' && w !== 'false') {
        usedWords.add(w);
      }
    }
  }
}

console.log('Total unique classes in Astro templates (precise):', usedWords.size);

let i = 0;
const containerStack = [];
let output = '';

while (i < css.length) {
  const char = css[i];
  if (char === '@') {
    let directive = '';
    while (i < css.length && css[i] !== '{' && css[i] !== ';') {
      directive += css[i];
      i++;
    }
    if (css[i] === ';') {
      directive += ';';
      i++;
      if (containerStack.length === 0) {
        output += directive;
      } else {
        containerStack[containerStack.length - 1].body += directive;
      }
    } else if (css[i] === '{') {
      i++;
      containerStack.push({
        header: directive.trim(),
        body: ''
      });
    }
  } else if (char === '}') {
    i++;
    if (containerStack.length > 0) {
      const container = containerStack.pop();
      if (container.body.trim().length > 0) {
        const block = container.header + '{' + container.body + '}';
        if (containerStack.length === 0) {
          output += block;
        } else {
          containerStack[containerStack.length - 1].body += block;
        }
      }
    }
  } else if (char === '{') {
    i++;
  } else if (/\s/.test(char)) {
    i++;
  } else {
    let selector = '';
    while (i < css.length && css[i] !== '{') {
      selector += css[i];
      i++;
    }
    if (css[i] === '{') {
      i++;
      let body = '';
      let braceCount = 1;
      while (i < css.length && braceCount > 0) {
        const bodyChar = css[i];
        if (bodyChar === '{') braceCount++;
        else if (bodyChar === '}') braceCount--;
        if (braceCount > 0) body += bodyChar;
        i++;
      }
      
      if (isSelectorUsed(selector.trim())) {
        const rule = selector.trim() + '{' + body + '}';
        if (containerStack.length === 0) {
          output += rule;
        } else {
          containerStack[containerStack.length - 1].body += rule;
        }
      }
    }
  }
}

function isSelectorUsed(sel) {
  if (!sel.includes('.')) {
    return true;
  }
  
  const classRegex = /\.((?:[a-zA-Z0-9_\-\/\[\]]|\\:|\\\[|\\\]|\\\/|\\%|\\\.)+)/g;
  let match;
  let matchesFound = 0;
  while ((match = classRegex.exec(sel)) !== null) {
    matchesFound++;
    const className = match[1].replace(/\\/g, '');
    if (!usedWords.has(className)) {
      return false;
    }
  }
  return matchesFound > 0;
}

console.log('Purged CSS size:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
