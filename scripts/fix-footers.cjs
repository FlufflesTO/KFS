const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.astro') && !p.includes('layouts') && !p.includes('components')) {
      let content = fs.readFileSync(p, 'utf8');
      if (content.includes('<Footer />')) {
        content = content.replace(/<Footer \/>/g, '');
        content = content.replace(/import Footer from ["'].*Footer\.astro["'];?\n?/g, '');
        fs.writeFileSync(p, content);
        console.log('Removed Footer from ' + p);
      }
    }
  }
}

walk('src/pages');
