import fs from 'fs';
import path from 'path';

function fixCode(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (let entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fixCode(p);
    } else if (p.endsWith('.tsx') || p.endsWith('.ts')) {
      let c = fs.readFileSync(p, 'utf-8');
      
      // Remove `jsx` and `global` from `<style>`
      c = c.replace(/<style jsx[^>]*>/g, '<style>');

      // Replace next/dynamic
      if (c.includes('next/dynamic')) {
        c = c.replace(/import dynamic from ['"]next\/dynamic['"];?/g, "import { lazy as dynamic } from 'react';\n// TODO: Fix signature if it was dynamic(() => import(...)) to just lazy(() => import(...))");
        c = c.replace(/dynamic\(\s*\(\)\s*=>\s*import\(([^)]+)\)\s*(?:,\s*\{[^}]*\}\s*)?\)/g, "dynamic(() => import($1))");
      }

      fs.writeFileSync(p, c);
    }
  }
}

fixCode('./src');
fs.rmSync('./src/lib/db', { recursive: true, force: true });
