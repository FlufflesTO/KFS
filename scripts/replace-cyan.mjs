import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (/\.(astro|tsx|ts|js|jsx|css|md)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('kharon-cyan')) {
        content = content.replace(/kharon-cyan/g, 'kharon-purple');
        fs.writeFileSync(fullPath, content);
        console.log('Updated:', fullPath);
      }
    }
  }
}

replaceInDir('./src');
console.log('Done!');
