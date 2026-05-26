/**
 * Project Kharon - CSS Purge Post-Build Step
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

const srcFiles = walk(srcDir).filter(f => f.endsWith('.astro'));
const usedWords = new Set();

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match class="..." or class:list="..."
  const classMatches = content.match(/class(?::list)?\s*=\s*(?:["']([\s\S]*?)["']|\{[\s\S]*?\})/g) || [];
  
  for (const match of classMatches) {
    if (match.startsWith('class="') || match.startsWith("class='") || match.startsWith('class:list="') || match.startsWith("class:list='")) {
      // Static class string
      const words = match.match(/[a-zA-Z0-9_\-\/\[\]\:]+/g) || [];
      for (const w of words) {
        if (w !== 'class' && w !== 'list') {
          usedWords.add(w);
        }
      }
    } else {
      // Dynamic class expression
      const stringLiteralRegex = /(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;
      let strMatch;
      while ((strMatch = stringLiteralRegex.exec(match)) !== null) {
        const val = strMatch[1] || strMatch[2] || strMatch[3] || '';
        const words = val.match(/[a-zA-Z0-9_\-\/\[\]\:]+/g) || [];
        for (const w of words) {
          usedWords.add(w);
        }
      }
    }
  }
}

console.log('Total unique classes in Astro templates (precise):', usedWords.size);

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

function purgeCssBlock(cssContent) {
  let i = 0;
  let output = '';
  
  while (i < cssContent.length) {
    const char = cssContent[i];
    
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    
    if (char === '@') {
      let directive = '';
      while (i < cssContent.length && cssContent[i] !== '{' && cssContent[i] !== ';') {
        directive += cssContent[i];
        i++;
      }
      if (cssContent[i] === ';') {
        directive += ';';
        i++;
        const trimmedDir = directive.trim();
        if (trimmedDir.startsWith('@property')) {
          // Discard
        } else {
          output += directive;
        }
      } else if (cssContent[i] === '{') {
        i++;
        let body = '';
        let braceCount = 1;
        while (i < cssContent.length && braceCount > 0) {
          const bodyChar = cssContent[i];
          if (bodyChar === '{') braceCount++;
          else if (bodyChar === '}') braceCount--;
          if (braceCount > 0) body += bodyChar;
          i++;
        }
        
        const trimmedDir = directive.trim();
        if (trimmedDir.startsWith('@property')) {
          // Discard @property rule block completely
        } else if (trimmedDir.startsWith('@keyframes')) {
          // Keep for keyframe analysis in second pass
          output += trimmedDir + '{' + body + '}';
        } else if (trimmedDir.startsWith('@media') || trimmedDir.startsWith('@supports') || trimmedDir.startsWith('@layer')) {
          const purgedBody = purgeCssBlock(body);
          if (purgedBody.trim().length > 0) {
            output += trimmedDir + '{' + purgedBody + '}';
          }
        } else {
          output += trimmedDir + '{' + body + '}';
        }
      }
    } else {
      let selector = '';
      while (i < cssContent.length && cssContent[i] !== '{') {
        selector += cssContent[i];
        i++;
      }
      if (cssContent[i] === '{') {
        i++;
        let body = '';
        let braceCount = 1;
        while (i < cssContent.length && braceCount > 0) {
          const bodyChar = cssContent[i];
          if (bodyChar === '{') braceCount++;
          else if (bodyChar === '}') braceCount--;
          if (braceCount > 0) body += bodyChar;
          i++;
        }
        
        if (isSelectorUsed(selector.trim())) {
          output += selector.trim() + '{' + body + '}';
        }
      }
    }
  }
  
  return output;
}

css = css.replace(/\/\*[\s\S]*?\*\//g, '');
let output = purgeCssBlock(css);
console.log('Purged CSS size before variable pruning:', output.length, 'bytes');

const usedVarNames = new Set();
let refMatch;
const varRefRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
while ((refMatch = varRefRegex.exec(output)) !== null) {
  usedVarNames.add(refMatch[1]);
}
for (const file of walk(srcDir).filter(f => f.endsWith('.astro'))) {
  const content = fs.readFileSync(file, 'utf8');
  let astroMatch;
  const astroVarRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  while ((astroMatch = astroVarRegex.exec(content)) !== null) {
    usedVarNames.add(astroMatch[1]);
  }
}

const varRegex = /(--[a-zA-Z0-9_-]+)\s*:[^;]+;/g;
let match;
const vars = [];
while ((match = varRegex.exec(output)) !== null) {
  vars.push(match[1]);
}
const uniqueVars = Array.from(new Set(vars));
console.log('Total CSS variables found:', uniqueVars.length);

const unusedVars = [];
for (const v of uniqueVars) {
  if (!usedVarNames.has(v)) {
    unusedVars.push(v);
  }
}
console.log('Unused CSS variables to prune:', unusedVars.length);

for (const v of unusedVars) {
  const escaped = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const defRegex = new RegExp(escaped + '\\s*:[^;]+;', 'g');
  output = output.replace(defRegex, '');
}

// Keyframe pruning pass
const animationRegex = /animation(?:-name)?\s*:\s*([^;\}]+)/g;
const usedKeyframeNames = new Set();
let keyframeMatch;
while ((keyframeMatch = animationRegex.exec(output)) !== null) {
  const words = keyframeMatch[1].match(/[a-zA-Z0-9_-]+/g) || [];
  for (const w of words) {
    usedKeyframeNames.add(w);
  }
}

let keyframePrunedOutput = '';
let j = 0;
while (j < output.length) {
  if (output[j] === '@') {
    let directive = '';
    const start = j;
    while (j < output.length && output[j] !== '{' && output[j] !== ';') {
      directive += output[j];
      j++;
    }
    if (output[j] === ';') {
      j++;
      keyframePrunedOutput += output.slice(start, j);
    } else if (output[j] === '{') {
      j++;
      let braceCount = 1;
      let body = '';
      while (j < output.length && braceCount > 0) {
        const bodyChar = output[j];
        if (bodyChar === '{') braceCount++;
        else if (bodyChar === '}') braceCount--;
        if (braceCount > 0) body += bodyChar;
        j++;
      }
      const block = output.slice(start, j);
      if (directive.includes('keyframes')) {
        const matchName = directive.match(/@keyframes\s+([a-zA-Z0-9_-]+)/);
        if (matchName && usedKeyframeNames.has(matchName[1])) {
          keyframePrunedOutput += block;
        }
      } else {
        keyframePrunedOutput += block;
      }
    }
  } else {
    keyframePrunedOutput += output[j];
    j++;
  }
}
output = keyframePrunedOutput;

// Simple CSS minifier to strip whitespace
output = output
  .replace(/\s+/g, ' ')             // collapse multiple spaces
  .replace(/\s*([{};:,])\s*/g, '$1') // remove space around separators
  .replace(/;}/g, '}')              // remove trailing semicolons
  .replace(/([: ,\(])0(?:px|em|rem|%|vw|vh)/g, '$10') // remove zero units
  .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3') // Shorten hex colors
  .trim();

console.log('Purged CSS size after variable pruning & minification:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
