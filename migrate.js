import fs from 'fs';
import path from 'path';

function copyDirAndTransform(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (let entry of entries) {
    if (['.git', 'node_modules', '.next', 'api', 'layout.tsx', 'globals.css', 'page.tsx'].includes(entry.name)) continue;
    
    // Ignore database, tests, e2e, etc.
    if (['__tests__', 'prisma', 'test-results', 'scripts', 'e2e'].includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirAndTransform(srcPath, destPath);
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8');
      
      // Transform `@/` to `@/src/` assuming alias `@` is root
      content = content.replace(/@\//g, '@/src/');
      // Transform `next/image` to simple `img`
      content = content.replace(/import Image from ['"]next\/image['"];?/g, '');
      content = content.replace(/<Image([^>]+)\/?>/g, '<img$1 />');
      // Transform `next/link` 
      content = content.replace(/import Link from ['"]next\/link['"];?/g, '');
      content = content.replace(/<Link([^>]+)>/g, '<a$1>');
      content = content.replace(/<\/Link>/g, '</a>');
      // Transform `use client`
      content = content.replace(/['"]use client['"];?\n/g, '');

      fs.writeFileSync(destPath, content);
    }
  }
}

// Copy components, lib, hooks, data, styles, types
const dirsToCopy = ['lib/api'];
dirsToCopy.forEach(dir => {
  if (fs.existsSync(`/tmp/repo/src/${dir}`)) {
    copyDirAndTransform(`/tmp/repo/src/${dir}`, `./src/${dir}`);
  }
});

// Copy globals.css into index.css
if (fs.existsSync('/tmp/repo/src/app/globals.css')) {
  let styles = fs.readFileSync('/tmp/repo/src/app/globals.css', 'utf-8');
  styles = styles.replace(/@tailwind.*\n/g, ''); // remove old tailwind imports as Vite config has it
  fs.appendFileSync('./src/index.css', '\n' + styles);
}

// Copy page.tsx to App.tsx
if (fs.existsSync('/tmp/repo/src/app/page.tsx')) {
  let appCode = fs.readFileSync('/tmp/repo/src/app/page.tsx', 'utf-8');
  appCode = appCode.replace(/@\//g, '@/src/');
  appCode = appCode.replace(/['"]use client['"];?\n/g, '');
  fs.writeFileSync('./src/App.tsx', appCode);
}

// Check what packages we need
console.log("Migration complete!");
