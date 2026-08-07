// Converts the "Data_for_SQL" product spreadsheet into data/products.json.
// Re-run this any time the spreadsheet is updated (new image links, real
// MOQ values, new products, edited descriptions, etc).
//
// Usage:  node scripts/xlsx-to-products.mjs path/to/Data_for_SQL_.xlsx
//
// Requires the "xlsx" package — already installed under scripts/node_modules.
// If missing: cd scripts && npm install xlsx
//
// MOQ: the sheet doesn't have an MOQ column yet — every product defaults to
// 50 until you add an "MOQ" column with real values and re-run this script.

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'data/products.json');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/xlsx-to-products.mjs path/to/spreadsheet.xlsx');
  process.exit(1);
}

const CATEGORY_MAP = {
  'earrings': 'earrings',
  'hair accessories': 'hair-accessories',
  'bracelets': 'bracelets',
  'necklaces & malas': 'necklaces',
  'sets': 'sets'
};

function slug(v) {
  return String(v).trim().toLowerCase().replace(/[\s_-]+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function handleFromSku(sku) {
  return String(sku).trim().toLowerCase().replace(/-/g, '_');
}

function cleanText(v) {
  if (v === undefined || v === null) return '';
  return String(v).trim().replace(/^"+|"+$/g, '').trim();
}

function row(label, value) {
  return value === undefined || value === null || String(value).trim() === '' ? null : [label, cleanText(value)];
}

// ---- load any images we already have (from a previous products.json), so
// re-running this script doesn't wipe out images you've since filled in by
// hand or that were pulled from the live Shopify store. The spreadsheet
// always wins once it has real values for a SKU.
const DEFAULT_MOQ = 50;
let imageMap = {};
if (fs.existsSync(OUT)) {
  const prev = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  for (const p of prev) {
    const key = handleFromSku(p.handle);
    if (p.image) imageMap[key] = { image: p.image, images: p.images && p.images.length ? p.images : [p.image] };
  }
}

const wb = XLSX.readFile(file);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['Products Data'], { defval: '' });

const seen = new Set();
const products = [];
const missingImage = [];
const usingDefaultMoq = [];

for (const r of rows) {
  const sku = String(r['SKU']).trim();
  if (!sku || seen.has(sku)) continue; // drop duplicate SKU rows (sheet had a few exact repeats)
  seen.add(sku);

  const handle = handleFromSku(sku);
  const category = CATEGORY_MAP[String(r['Product Type']).trim().toLowerCase()] || 'necklaces';
  const collections = String(r['Collection'] || '')
    .split(',')
    .map(s => slug(s))
    .filter(Boolean);

  const sheetImages = [r['Product Image 1'], r['Product Image 2'], r['Product Image 3']]
    .map(cleanText).filter(Boolean);
  const carried = imageMap[handle];
  const images = sheetImages.length ? sheetImages : (carried ? carried.images : []);
  if (images.length === 0) missingImage.push(sku);

  const moqRaw = r['MOQ'];
  const moq = moqRaw !== undefined && String(moqRaw).trim() !== '' ? parseInt(moqRaw, 10) : DEFAULT_MOQ;
  if (moqRaw === undefined || String(moqRaw).trim() === '') usingDefaultMoq.push(sku);

  const materials = [
    row('Base Material', r['Base Material']),
    row('Plating', r['Plating']),
    row('Stone Type', r['Stone Type']),
    row('Colour / Finish', r['Colour Finish']),
    row('Highlights', r['Highlights']),
    row('Weight', r['Weight']),
    row('Weight Feel', r['Weight Feel'])
  ].filter(Boolean);

  const sizeFit = [
    row('Size', r['Size']),
    row('Adjustable', r['Adjustable']),
    row('Comfort Notes', r['Comfort Notes'])
  ].filter(Boolean);

  const customization = [
    row('Customizable', r['Customizable']),
    row('Options', r['Customization Options']),
    row('Completion Period', r['Completion Period']),
    row('Charges', r['Customisation Charges (₹)'])
  ].filter(Boolean);

  const details = {};
  if (materials.length) details['Material Details'] = materials;
  if (sizeFit.length) details['Size & Fit'] = sizeFit;
  if (customization.length) details['Customization'] = customization;

  products.push({
    handle,
    sku,
    name: cleanText(r['Product Title']),
    category,
    collections,
    moq,
    image: images[0] || null,   // null → build.js falls back to the collection's placeholder image
    images,
    description: cleanText(r['Product Description']),
    details
  });
}

fs.writeFileSync(OUT, JSON.stringify(products, null, 2));

console.log(`Wrote ${products.length} products (${seen.size} unique SKUs, ${rows.length - seen.size} duplicate rows skipped) to data/products.json`);
if (usingDefaultMoq.length) {
  console.log(`\n${usingDefaultMoq.length} products have no MOQ column value — defaulted to ${DEFAULT_MOQ}. Add an "MOQ" column to the sheet and re-run to override per product.`);
}
if (missingImage.length) {
  console.log(`\n⚠ ${missingImage.length} products have no image yet (falling back to their collection's placeholder photo):`);
  console.log(missingImage.join(', '));
}

// ---- sync collection descriptions from the "Categories and Collections" sheet
// into data/collections.json (name/image/handle stay as previously set there —
// only the description field gets overwritten when the sheet has one).
const collMetaPath = path.join(ROOT, 'data/collections.json');
if (wb.Sheets['Categories and Collections']) {
  const collRows = XLSX.utils.sheet_to_json(wb.Sheets['Categories and Collections'], { defval: '' });
  const descMap = {};
  for (const r of collRows) {
    const name = cleanText(r['Collections']);
    const desc = cleanText(r['Collection Description']);
    if (name && desc) descMap[slug(name)] = desc;
  }
  if (Object.keys(descMap).length && fs.existsSync(collMetaPath)) {
    const meta = JSON.parse(fs.readFileSync(collMetaPath, 'utf8'));
    let updated = 0;
    meta.collections.forEach(c => {
      if (descMap[c.handle]) { c.description = descMap[c.handle]; updated++; }
    });
    fs.writeFileSync(collMetaPath, JSON.stringify(meta, null, 2));
    console.log(`\nUpdated ${updated} collection descriptions in data/collections.json from the sheet.`);
  }
}

console.log('\nNow run: node build/build.js');
