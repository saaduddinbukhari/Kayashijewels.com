// Downloads every image the site currently references from Shopify's CDN
// (product photos, category/collection thumbnails, the logo, the hero
// background) into a local folder, and rewrites data/products.json +
// data/collections.json to point at those local files instead.
//
// Run this ONCE, while the Shopify store is still live, before cancelling
// the subscription — after this, the site no longer depends on Shopify's
// CDN staying online at all.
//
// Usage:  node scripts/download-images.mjs
//
// Requires Node 18+ (built-in fetch). No npm install needed.
// Safe to re-run: already-downloaded files are skipped, not re-fetched.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'assets-src'); // persistent, committed to git
const PRODUCTS_PATH = path.join(ROOT, 'data/products.json');
const COLLECTIONS_PATH = path.join(ROOT, 'data/collections.json');

function extFromUrl(url, contentType) {
  const clean = url.split('?')[0];
  const m = clean.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
  if (m) return m[1].toLowerCase() === 'jpeg' ? 'jpg' : m[1].toLowerCase();
  if (contentType && contentType.includes('png')) return 'png';
  if (contentType && contentType.includes('webp')) return 'webp';
  return 'jpg';
}

let downloaded = 0, skipped = 0, failed = 0;

async function download(url, subdir, baseName) {
  if (!url || !/^https?:\/\//.test(url)) return url; // already local or empty — leave as-is
  const dir = path.join(SRC_DIR, subdir);
  fs.mkdirSync(dir, { recursive: true });

  // Reuse a previous download for this exact URL if one already exists,
  // so re-running this script doesn't re-fetch everything every time.
  const existing = fs.readdirSync(dir).find(f => f.startsWith(baseName + '.'));
  if (existing) { skipped++; return `/assets/${subdir}/${existing}`; }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = extFromUrl(url, res.headers.get('content-type'));
    const filename = `${baseName}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buf);
    downloaded++;
    return `/assets/${subdir}/${filename}`;
  } catch (e) {
    console.warn(`  ⚠ failed: ${url} — ${e.message}`);
    failed++;
    return url; // leave the original URL in place rather than break the image entirely
  }
}

async function main() {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
  const meta = JSON.parse(fs.readFileSync(COLLECTIONS_PATH, 'utf8'));

  console.log('Downloading site images (logo, hero)...');
  meta.site.logo = await download(meta.site.logo, 'site', 'logo');
  meta.site.heroImage = await download(meta.site.heroImage, 'site', 'hero');

  console.log('Downloading category thumbnails...');
  for (const c of meta.categories) {
    c.image = await download(c.image, 'categories', c.handle);
  }

  console.log('Downloading collection thumbnails...');
  for (const c of meta.collections) {
    c.image = await download(c.image, 'collections', c.handle);
  }

  console.log(`Downloading product images (${products.length} products)...`);
  for (const p of products) {
    const newImages = [];
    for (let i = 0; i < p.images.length; i++) {
      newImages.push(await download(p.images[i], 'products', `${p.handle}-${i + 1}`));
    }
    p.images = newImages;
    p.image = newImages[0] || null;
  }

  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2));
  fs.writeFileSync(COLLECTIONS_PATH, JSON.stringify(meta, null, 2));

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} already had a local copy, ${failed} failed.`);
  if (failed) console.log('Failed ones were left pointing at their original Shopify URL — re-run this script to retry them.');
  console.log('\nNow run: node build/build.js');
}

main();
