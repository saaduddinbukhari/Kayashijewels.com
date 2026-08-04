# Kayashi Jewels — Catalogue Site

A no-checkout catalogue version of kayashijewels.com. No cart, no payment
gateway, no Shopify subscription — every product has an **"Enquire on
WhatsApp"** button that opens a chat pre-filled with the product name and
its MOQ (minimum order quantity).

Right now it's a static site generated from a spreadsheet — no server, no
database, deploys free on Render. A dynamic backend (Turso + a Render Web
Service) is the planned next phase, described at the bottom.

## What's in here

```
data/products.json            ← generated — don't hand-edit, re-run the script instead
data/collections.json         ← site name, WhatsApp number, category/collection metadata
scripts/xlsx-to-products.mjs  ← converts the product spreadsheet into data/products.json
build/build.js                 ← generates the whole site from the JSON into /dist
build/style.css                ← all styling
dist/                          ← the generated static site — this is what gets deployed
```

## Day-to-day: updating products

Everything about a product (name, description, materials, MOQ, images)
comes from the **spreadsheet**, not the JSON directly:

```bash
node scripts/xlsx-to-products.mjs path/to/Data_for_SQL_.xlsx
node build/build.js
```

First command rebuilds `data/products.json` from the sheet. It's
non-destructive — if the sheet doesn't have an image yet for some SKU, it
keeps whatever image was already there from the last run rather than
blanking it out. Second command regenerates `/dist`. Push to GitHub and
Vercel redeploys automatically.

**MOQ:** the sheet doesn't have an MOQ column yet, so every product
currently defaults to 50. Once you add an `MOQ` column with real
per-product values and re-run the script, those take over.

**Images:** 37 of 67 products don't have image links in the sheet yet —
those fall back to a generic photo for their collection so nothing looks
broken in the meantime. Add links to `Product Image 1/2/3` and re-run to
replace them one by one, no need to do all 37 at once.

## Preview locally

```bash
npx serve dist
```

## Deploy to Render (free) — do this now to start testing

Since you've already got a Render account set up for her, everything lives
there — the catalogue now, and the API + Turso later — instead of
splitting across two providers.

1. Push this folder to a GitHub repo.
2. On the Render dashboard → **New** → **Static Site** → connect that repo.
3. **Build Command:** leave blank (nothing to build — `dist` is already
   generated and committed). **Publish Directory:** `dist`.
4. Deploy — Render gives you a free `*.onrender.com` URL immediately,
   shareable for testing right away.
5. **Domain stays disconnected for now** — you mentioned connecting
   `kayashijewels.com` via GoDaddy later. When ready: Static Site →
   Settings → Custom Domains → add the domain → Render shows the DNS
   records to add in GoDaddy → once it propagates, cancel the Shopify
   subscription.

One thing worth deciding before you connect the domain: whether the
future Render **Web Service** (the API, once we build it) and this
**Static Site** should live under the same custom domain (e.g.
`kayashijewels.com` for the site, `api.kayashijewels.com` for the API) —
that's a DNS setup choice we can make together whenever you're ready for
that phase.

## The WhatsApp number

Set in `data/collections.json` → `"whatsappNumber"`, currently
`919873901022` (the number already used on the live Shopify site's chat
widget) — confirm this is the one to keep using.

## Next phase: Turso + Render backend

The static-JSON approach above is deliberately simple so the site can be
tested today. The planned next step is a small backend so products can be
managed without touching a spreadsheet or redeploying:

- **Turso** (SQLite): one `products` table mirroring today's JSON shape
  (sku, name, description, category, collections, moq, images, details as
  JSON columns) — a straightforward schema migration from
  `data/products.json` once you're ready.
- **Render Web Service**: a small API (e.g. Express/Fastify) sitting
  alongside the Static Site in the same Render account, with read
  endpoints (`GET /products`, `GET /products/:handle`,
  `GET /collections/:handle`) that the frontend calls instead of reading
  the static JSON. Same data shape, so the templates in `build/build.js`
  barely change — they'd just fetch from the API instead of the local
  file.
- **Decide on write access** ahead of that: do you want your client (or
  you) editing products through a simple admin form hitting the API, or
  keep the spreadsheet as source of truth and have the conversion script
  write to Turso instead of the JSON file?

Say the word when you want to start on this and I'll scaffold the Turso
schema + Render API first, then wire the site to read from it instead of
the static JSON — the page templates and styling we've built stay as-is.
