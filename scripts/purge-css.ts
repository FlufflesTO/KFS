/**
 * Project Kharon - CSS Purge Post-Build Step
 * Purpose: Post-build script that prunes unused Tailwind CSS classes from built files
 * Dependencies: Node fs, path modules
 * Structural Role: Build pipeline asset optimizer
 * 
 * Implementation Note: This version uses a highly precise AST-like walker to identify 
 * used classes in Astro templates and recursively prune unused variables and 
 * keyframes from the final CSS bundle.
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
components.forEach(c => {
  const name = path.basename(c, '.astro');
  if (!componentUsage[name]) {
    componentUsage[name] = [];
  }
  componentUsage[name].push(c);
});

const usedComponentFiles = new Set<string>();
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const name of Object.keys(componentUsage)) {
    const filesWithName = componentUsage[name];
    if (filesWithName.includes(file)) continue;

    const importRegex = new RegExp(`import\\s+${name}\\s+from`, 'i');
    const tagRegex = new RegExp(`<${name}\\b`, 'i');
    
    if (importRegex.test(content) || tagRegex.test(content)) {
      filesWithName.forEach(f => usedComponentFiles.add(f));
    }
  }
}

const srcFiles = allFiles.filter(file => {
  if (file.includes('/src/components/') && file.endsWith('.astro')) {
    return usedComponentFiles.has(file);
  }
  return file.endsWith('.astro') || file.endsWith('.ts') || file.endsWith('.js');
});
const usedWords = new Set<string>();

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  // Match class="..." or class:list="..."
  const classMatches = content.match(/class(?::list)?\s*=\s*(?:["']([\s\S]*?)["']|\{[\s\S]*?\})/g) || [];

  for (const match of classMatches) {
    if (match.startsWith('class="') || match.startsWith("class='") || match.startsWith('class:list="') || match.startsWith("class:list='")) {
      // Static class string
      const words = match.match(/[a-zA-Z0-9_\-\/\[\]\:\.\%]+/g) || [];
      for (const w of words) {
        if (w !== 'class' && w !== 'list') {
          usedWords.add(w);
        }
      }
    } else {
      // Dynamic class expression
      const stringLiteralRegex = /(?:"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'|`([^`\\]*(?:\\.[^`\\]*)*)`)/g;
      let strMatch: RegExpExecArray | null;
      while ((strMatch = stringLiteralRegex.exec(match)) !== null) {
        const val = strMatch[1] || strMatch[2] || strMatch[3] || '';
        const words = val.match(/[a-zA-Z0-9_\-\/\[\]\:\.\%]+/g) || [];
        for (const w of words) {
          usedWords.add(w);
        }
      }
    }
  }
}

console.log('Total unique classes in Astro templates (precise):', usedWords.size);

function isSelectorUsed(sel: string): boolean {
  if (!sel.includes('.')) {
    return true;
  }

  const classRegex = /\.((?:[a-zA-Z0-9_\-\/\[\]]|\\:|\\\[|\\\]|\\\/|\\%|\\\.)+)/g;
  let match: RegExpExecArray | null;
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

function purgeCssBlock(cssContent: string): string {
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
        output += directive;
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
          output += trimmedDir + '{' + body + '}';
        } else if (trimmedDir.startsWith('@keyframes')) {
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
          if (bodyChar !== '}' && braceCount > 0) body += bodyChar;
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

const astroVarRefs = new Set<string>();
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let astroMatch: RegExpExecArray | null;
  const astroVarRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  while ((astroMatch = astroVarRegex.exec(content)) !== null) {
    astroVarRefs.add(astroMatch[1]);
  }
}

let variablesPruned = true;
let pass = 1;
while (variablesPruned) {
  variablesPruned = false;
  
  const usedVarNames = new Set<string>(astroVarRefs);
  let refMatch: RegExpExecArray | null;
  const varRefRegex = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  while ((refMatch = varRefRegex.exec(output)) !== null) {
    usedVarNames.add(refMatch[1]);
  }

  const varRegex = /(--[a-zA-Z0-9_-]+)\s*:[^;\}]+[;\}]/g;
  let match: RegExpExecArray | null;
  const vars: string[] = [];
  while ((match = varRegex.exec(output)) !== null) {
    vars.push(match[1]);
  }
  const uniqueVars = Array.from(new Set(vars));

  const unusedVars: string[] = [];
  for (const v of uniqueVars) {
    if (!usedVarNames.has(v)) {
      unusedVars.push(v);
    }
  }

  if (unusedVars.length > 0) {
    console.log(`Pass ${pass}: Pruning ${unusedVars.length} unused CSS variables`);
    for (const v of unusedVars) {
      const escaped = v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const defRegex = new RegExp(escaped + '\\s*:[^;\}]+([;\}])', 'g');
      output = output.replace(defRegex, (m, endChar) => {
        return endChar === '}' ? '}' : '';
      });
    }
    variablesPruned = true;
    pass++;
  }
}

const usedKeyframeNames = new Set<string>();

let cssWithoutKeyframes = output;
let kIdx = 0;
while (kIdx < cssWithoutKeyframes.length) {
  if (cssWithoutKeyframes.slice(kIdx).startsWith('@keyframes')) {
    let braceCount = 0;
    let endIdx = kIdx;
    while (endIdx < cssWithoutKeyframes.length) {
      if (cssWithoutKeyframes[endIdx] === '{') {
        braceCount = 1;
        endIdx++;
        break;
      }
      endIdx++;
    }
    while (endIdx < cssWithoutKeyframes.length && braceCount > 0) {
      if (cssWithoutKeyframes[endIdx] === '{') braceCount++;
      else if (cssWithoutKeyframes[endIdx] === '}') braceCount--;
      endIdx++;
    }
    cssWithoutKeyframes = cssWithoutKeyframes.slice(0, kIdx) + cssWithoutKeyframes.slice(endIdx);
  } else {
    kIdx++;
  }
}

const keyframeDefRegex = /@keyframes\s+([a-zA-Z0-9_-]+)/g;
let kfMatch: RegExpExecArray | null;
const definedKeyframes = new Set<string>();
while ((kfMatch = keyframeDefRegex.exec(output)) !== null) {
  definedKeyframes.add(kfMatch[1]);
}

const cssWords = new Set(cssWithoutKeyframes.match(/[a-zA-Z0-9_-]+/g) || []);
for (const kf of definedKeyframes) {
  if (cssWords.has(kf)) {
    usedKeyframeNames.add(kf);
  }
}
console.log('Preserving used keyframes:', Array.from(usedKeyframeNames));

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
      while (j < output.length && braceCount > 0) {
        const bodyChar = output[j];
        if (bodyChar === '{') braceCount++;
        else if (bodyChar === '}') braceCount--;
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
    keyframePrunedOutput += output[j]!;
    j++;
  }
}
output = keyframePrunedOutput;

output = output
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};:,])\s*/g, '$1')
  .replace(/;}/g, '}')
  .replace(/([: ,\(])0(?:px|em|rem|%|vw|vh)/g, '$10')
  .replace(/([: ,\(])0\.([0-9]+)/g, '$1.$2')
  .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3/g, '#$1$2$3')
  .trim();

output = output.replace(/@property [^{]+\{[^}]+\}/g, '');
output = esbuild.transformSync(output, { loader: 'css', minify: true }).code.trim();

console.log('Purged CSS size after variable pruning & minification:', output.length, 'bytes');
fs.writeFileSync(cssPath, output);
console.log('Purged CSS written.');
