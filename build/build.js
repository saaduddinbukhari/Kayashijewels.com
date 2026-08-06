// Static site builder for Kayashi Jewels catalogue.
// Reads /data/products.json + /data/collections.json and writes plain
// HTML pages into /dist. No framework, no build step needed on Vercel.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const products = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/products.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/collections.json'), 'utf8'));
const { categories, collections, site } = meta;

function fmtMoq(n) {
  return `MOQ: ${n} pcs`;
}

function waLink(product) {
  const msg = `Hi! I'm interested in the ${product.name} (${fmtMoq(product.moq)}). Could you share more details?`;
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}

function enquireBtn(product, large) {
  return `<a class="enquire-btn${large ? ' large' : ''}" href="${waLink(product)}" target="_blank" rel="noopener">
    ${waIcon()} Enquire on WhatsApp
  </a>`;
}

function waIcon(size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.82L2 22l5.42-1.42a9.9 9.9 0 0 0 4.62 1.14h.01c5.46 0 9.9-4.45 9.9-9.91C21.96 6.45 17.5 2 12.04 2zm5.86 14.05c-.25.7-1.25 1.28-2.03 1.44-.55.11-1.26.2-3.66-.79-3.07-1.27-5.05-4.38-5.2-4.58-.15-.2-1.24-1.65-1.24-3.15 0-1.5.78-2.23 1.06-2.54.28-.3.6-.38.8-.38.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.23.07.15.12.33.02.53-.1.2-.15.33-.3.5-.15.18-.31.4-.44.53-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.48.13.66-.07.18-.2.76-.87.96-1.17.2-.3.41-.25.68-.15.28.1 1.75.83 2.05 1 .3.15.5.23.57.35.08.13.08.7-.17 1.4z"/></svg>`;
}

function productImg(p) {
  if (p.image) return p.image;
  const fallbackColl = p.collections && p.collections.length ? collectionOf(p.collections[0]) : null;
  if (fallbackColl) return fallbackColl.image;
  const fallbackCat = categoryOf(p.category);
  return fallbackCat ? fallbackCat.image : '';
}

function collectionOf(handle) {
  return collections.find(c => c.handle === handle);
}
function categoryOf(handle) {
  return categories.find(c => c.handle === handle);
}

function head(title, description) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} | ${site.name}</title>
<meta name="description" content="${description || site.about}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Jost:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${asset('style.css')}" />
</head>
<body>`;
}

// depth-aware asset/link helpers so pages work from any folder depth
let CURRENT_DEPTH = 0;
function rel(p) { return '../'.repeat(CURRENT_DEPTH) + p; }
function asset(p) { return rel('assets/' + p); }
function link(p) { return rel(p); }

function header() {
  return `
<div class="announce">Subscribe for new designs &amp; styling ideas — enjoy 5% off your first order</div>
<header class="site-header">
  <div class="header-row">
    <nav class="main-nav">
      <a href="${link('categories/all.html')}">Jewellery</a>
      <a href="${link('categories/index.html')}">Categories</a>
      <a href="${link('collections/index.html')}">Collections</a>
    </nav>
    <a class="logo" href="${link('index.html')}"><img src="${site.logo}" alt="${site.name}" /></a>
    <div class="header-actions">
      <button class="icon-btn" aria-label="Search" onclick="window.toggleSearch()">${searchIcon()}</button>
      <a class="icon-btn" href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener" aria-label="WhatsApp">${waIcon(20)}</a>
      <button class="hamburger" aria-label="Menu" onclick="window.toggleDrawer()">☰</button>
    </div>
  </div>
  <div class="subnav">
    ${categories.map(c => `<a href="${link('categories/' + c.handle + '.html')}">${c.name}</a>`).join('')}
    ${collections.map(c => `<a href="${link('collections/' + c.handle + '.html')}">${c.name}</a>`).join('')}
  </div>
</header>

<div class="drawer-overlay" id="drawerOverlay" onclick="window.toggleDrawer()"></div>
<nav class="mobile-drawer" id="mobileDrawer">
  <div class="drawer-head">
    <img src="${site.logo}" alt="${site.name}" />
    <button class="search-close" aria-label="Close menu" onclick="window.toggleDrawer()">✕</button>
  </div>
  <div class="drawer-body">
    <a href="${link('categories/all.html')}">Jewellery</a>
    <a href="${link('categories/index.html')}">Categories</a>
    <a href="${link('collections/index.html')}">Collections</a>
    <a href="${link('about.html')}">About Us</a>
    <div class="drawer-divider"></div>
    <span class="drawer-label">Shop by Category</span>
    ${categories.map(c => `<a href="${link('categories/' + c.handle + '.html')}">${c.name}</a>`).join('')}
    <div class="drawer-divider"></div>
    <span class="drawer-label">Collections</span>
    ${collections.map(c => `<a href="${link('collections/' + c.handle + '.html')}">${c.name}</a>`).join('')}
  </div>
  <a class="btn btn-primary drawer-cta" href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener">${waIcon(16)} Chat on WhatsApp</a>
</nav>

<div class="search-overlay" id="searchOverlay">
  <div class="search-panel">
    <div class="search-input-row">
      ${searchIcon(20)}
      <input id="searchInput" type="text" placeholder="Search products..." autocomplete="off" oninput="window.runSearch(this.value)" />
      <button class="search-close" aria-label="Close search" onclick="window.toggleSearch()">✕</button>
    </div>
    <div class="search-results" id="searchResults"></div>
  </div>
</div>`;
}

function searchIcon(size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`;
}

function ornament() {
  return `<div class="ornament"><span class="line"></span>
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B8862E" stroke-width="1.3"><path d="M12 2C9 7 9 11 12 12c3 1 3 5 0 10M12 2C15 7 15 11 12 12c-3 1-3 5 0 10" /></svg>
  <span class="line"></span></div>`;
}

function footer() {
  return `
<footer>
  <div class="container footer-grid">
    <div>
      <img src="${site.logo}" alt="${site.name}" style="height:40px;filter:brightness(0) invert(1);margin-bottom:16px;" />
      <p>${site.about}</p>
    </div>
    <div>
      <h5>Shop</h5>
      <ul>
        <li><a href="${link('categories/all.html')}">All Jewellery</a></li>
        ${categories.map(c => `<li><a href="${link('categories/' + c.handle + '.html')}">${c.name}</a></li>`).join('')}
      </ul>
    </div>
    <div>
      <h5>Collections</h5>
      <ul>${collections.map(c => `<li><a href="${link('collections/' + c.handle + '.html')}">${c.name}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h5>Get in touch</h5>
      <ul>
        <li><a href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener">WhatsApp us</a></li>
        <li><a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a></li>
        <li><a href="${link('about.html')}">About Us</a></li>
      </ul>
    </div>
  </div>
  <div class="container footer-bottom">
    <span>© 2026 ${site.name}</span>
    <span>All enquiries via WhatsApp</span>
  </div>
</footer>
<a class="float-wa" href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener">${waIcon(26)}</a>
${searchScript()}
</body></html>`;
}

function searchScript() {
  return `<script>
(function(){
  var index = null;
  var box = document.getElementById('searchOverlay');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  var drawer = document.getElementById('mobileDrawer');
  var drawerOverlay = document.getElementById('drawerOverlay');

  window.toggleSearch = function(){
    var opening = !box.classList.contains('open');
    if (opening && drawer.classList.contains('open')) window.toggleDrawer(); // don't allow both open at once
    box.classList.toggle('open');
    if (opening) {
      document.body.style.overflow = 'hidden';
      setTimeout(function(){ input.focus(); }, 50);
      if (!index) {
        fetch('/assets/search-index.json').then(function(r){ return r.json(); }).then(function(d){ index = d; });
      }
    } else {
      document.body.style.overflow = '';
      input.value = '';
      results.innerHTML = '';
    }
  };

  window.toggleDrawer = function(){
    var opening = !drawer.classList.contains('open');
    if (opening && box.classList.contains('open')) window.toggleSearch(); // don't allow both open at once
    drawer.classList.toggle('open');
    drawerOverlay.classList.toggle('open');
    document.body.style.overflow = opening ? 'hidden' : '';
  };

  window.runSearch = function(q){
    if (!index) { results.innerHTML = ''; return; }
    q = q.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }
    var matches = index.filter(function(p){
      return p.name.toLowerCase().indexOf(q) !== -1 ||
             p.category.toLowerCase().indexOf(q) !== -1 ||
             p.collections.join(' ').toLowerCase().indexOf(q) !== -1;
    }).slice(0, 8);
    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">No products found for "' + q.replace(/</g,'') + '".</div>';
      return;
    }
    results.innerHTML = matches.map(function(p){
      return '<a class="search-result" href="' + p.url + '">' +
        '<img src="' + p.image + '" alt="' + p.name + '" />' +
        '<div><h5>' + p.name + '</h5><span>' + p.category + '</span></div>' +
        '</a>';
    }).join('');
  };

  document.addEventListener('keydown', function(e){
    if (e.key !== 'Escape') return;
    if (box.classList.contains('open')) window.toggleSearch();
    if (drawer.classList.contains('open')) window.toggleDrawer();
  });
  box.addEventListener('click', function(e){
    if (e.target === box) window.toggleSearch();
  });
})();
</script>`;
}

function productCard(p) {
  const inStock = p.inStock !== false; // defaults to true
  return `
  <div class="product-card" data-moq="${p.moq}" data-instock="${inStock ? 1 : 0}" data-name="${p.name.replace(/"/g, '&quot;')}">
    <a href="${link('products/' + p.handle + '.html')}">
      <div class="frame">
        ${!inStock ? '<span class="tag-instock" style="background:var(--ink-soft);">Out of stock</span>' : ''}
        <img src="${productImg(p)}" alt="${p.name}" loading="lazy" />
      </div>
      <h4>${p.name}</h4>
    </a>
    <div class="moq-row">${fmtMoq(p.moq)}</div>
    ${enquireBtn(p)}
  </div>`;
}

function productGrid(list, id) {
  if (!list.length) return `<div class="empty">No products in this selection yet.</div>`;
  return `<div class="grid grid-4" ${id ? `id="${id}"` : ''}>${list.map(productCard).join('')}</div>`;
}

function filtersSidebar(maxMoq) {
  return `
  <aside class="filters-panel">
    <h3>Filters</h3>
    <details class="filter-group" open>
      <summary>Availability</summary>
      <div class="fg-body">
        <label><input type="checkbox" class="f-instock" value="1" checked /> In stock</label>
        <label><input type="checkbox" class="f-instock" value="0" checked /> Out of stock</label>
      </div>
    </details>
    <details class="filter-group" open>
      <summary>MOQ</summary>
      <div class="fg-body">
        <div class="price-inputs">
          <input type="number" id="moqMin" placeholder="Min" min="0" />
          <span>to</span>
          <input type="number" id="moqMax" placeholder="Max" min="0" />
        </div>
        <span style="font-size:12px;color:var(--ink-soft);">Highest MOQ is ${maxMoq} pcs</span>
        <button onclick="window.applyFilters()">Apply</button>
      </div>
    </details>
    <a class="clear-filters" href="javascript:window.clearFilters()">Clear all</a>
  </aside>`;
}

function listingScript() {
  return `<script>
(function(){
  function getGrid(){ return document.getElementById('productGrid'); }
  window.applyFilters = function(){
    var grid = getGrid(); if(!grid) return;
    var min = parseFloat(document.getElementById('moqMin').value) || 0;
    var max = parseFloat(document.getElementById('moqMax').value) || Infinity;
    var stockVals = Array.from(document.querySelectorAll('.f-instock:checked')).map(function(c){return c.value;});
    var cards = grid.querySelectorAll('.product-card');
    var visible = 0;
    cards.forEach(function(card){
      var moq = parseFloat(card.dataset.moq);
      var inStock = card.dataset.instock;
      var show = moq >= min && moq <= max && stockVals.indexOf(inStock) !== -1;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    var countEl = document.getElementById('itemCount');
    if (countEl) countEl.textContent = visible + ' item' + (visible === 1 ? '' : 's');
  };
  window.clearFilters = function(){
    document.getElementById('moqMin').value = '';
    document.getElementById('moqMax').value = '';
    document.querySelectorAll('.f-instock').forEach(function(c){ c.checked = true; });
    window.applyFilters();
  };
  window.applySort = function(value){
    var grid = getGrid(); if(!grid) return;
    var cards = Array.from(grid.querySelectorAll('.product-card'));
    var cmp = {
      'az': function(a,b){ return a.dataset.name.localeCompare(b.dataset.name); },
      'za': function(a,b){ return b.dataset.name.localeCompare(a.dataset.name); },
      'moq-asc': function(a,b){ return a.dataset.moq - b.dataset.moq; },
      'moq-desc': function(a,b){ return b.dataset.moq - a.dataset.moq; }
    }[value];
    if (cmp) { cards.sort(cmp); cards.forEach(function(c){ grid.appendChild(c); }); }
  };
})();
</script>`;
}

// ---------------- PAGES ----------------

function buildHome() {
  CURRENT_DEPTH = 0;
  const featured = products.slice(0, 8);
  const html = `${head(site.name, site.about)}
${header()}
<section class="hero">
  <div class="hero-inner">
    <h1>${site.tagline}</h1>
    <p class="tagline-sub">Discover jewellery that feels personal, beautiful and timeless.</p>
    <div class="cta-row">
      <a class="btn btn-primary" href="${link('categories/all.html')}">Shop All Jewellery</a>
      <a class="btn btn-outline" href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener">Chat on WhatsApp</a>
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-head"><div class="eyebrow">Browse</div><h2>Shop by Category</h2></div>
    ${ornament()}
    <div class="grid grid-5">
      ${categories.map(c => `
      <a class="tile" href="${link('categories/' + c.handle + '.html')}">
        <div class="frame"><img src="${c.image}" alt="${c.name}" /></div>
        <h4>${c.name}</h4>
      </a>`).join('')}
    </div>
  </div>
</section>

<section style="background:var(--ivory-deep);">
  <div class="container">
    <div class="section-head"><div class="eyebrow">Our Edits</div><h2>Shop by Collection</h2></div>
    ${ornament()}
    <div class="grid grid-4">
      ${collections.slice(0, 8).map(c => `
      <a class="coll-card" href="${link('collections/' + c.handle + '.html')}">
        <img src="${c.image}" alt="${c.name}" />
        <div class="overlay"><h3>${c.name}</h3></div>
      </a>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="container">
    <div class="section-head"><div class="eyebrow">Handpicked</div><h2>Featured Pieces</h2>
      <p class="section-sub">Like something? Tap Enquire and we'll pick up the conversation on WhatsApp.</p>
    </div>
    ${ornament()}
    ${productGrid(featured)}
  </div>
</section>
${footer()}`;
  fs.writeFileSync(path.join(DIST, 'index.html'), html);
}

function buildAbout() {
  CURRENT_DEPTH = 0;
  const html = `${head('About Us', site.about)}
${header()}
<section class="coll-hero">
  <div class="eyebrow">Our Story</div>
  <h1>About ${site.name}</h1>
  <p>${site.about}</p>
</section>
<section>
  <div class="container" style="max-width:760px;text-align:center;">
    <p style="color:var(--ink-soft);font-size:15px;">Every piece is made with care, blending traditional Kundan and Jadau craftsmanship with everyday wearability. Have a question about a piece, customisation, or an order? Message us directly on WhatsApp — we reply personally to every enquiry.</p>
    <a class="btn btn-primary" style="margin-top:20px;display:inline-flex;" href="https://wa.me/${site.whatsappNumber}" target="_blank" rel="noopener">Chat with us</a>
  </div>
</section>
${footer()}`;
  fs.writeFileSync(path.join(DIST, 'about.html'), html);
}

function buildCategoryPage(cat) {
  CURRENT_DEPTH = 1;
  const list = cat.handle === 'all' ? products : products.filter(p => p.category === cat.handle);
  const maxMoq = Math.max(...products.map(p => p.moq));
  const html = `${head(cat.name, cat.name + ' - ' + site.name)}
${header()}
<div class="container">
  <div class="coll-hero" style="padding-bottom:0;"><div class="eyebrow">Jewellery</div><h1>${cat.name}</h1></div>
  <div class="browse-layout" style="padding-top:36px;">
    ${filtersSidebar(maxMoq)}
    <div>
      <div class="listing-toolbar">
        <span class="item-count" id="itemCount">${list.length} item${list.length === 1 ? '' : 's'}</span>
        <select class="sort-select" onchange="window.applySort(this.value)">
          <option value="">Sort: Featured</option>
          <option value="az">Alphabetically, A-Z</option>
          <option value="za">Alphabetically, Z-A</option>
          <option value="moq-asc">MOQ, low to high</option>
          <option value="moq-desc">MOQ, high to low</option>
        </select>
      </div>
      ${productGrid(list, 'productGrid')}
    </div>
  </div>
</div>
${footer()}
${listingScript()}`;
  fs.mkdirSync(path.join(DIST, 'categories'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'categories', cat.handle + '.html'), html);
}

function buildCategoriesIndex() {
  CURRENT_DEPTH = 1;
  // Curated order as shown on the live /pages/categories page — distinct
  // from the header dropdown's order, which stays as defined in collections.json.
  const order = ['earrings', 'hair-accessories', 'sets', 'bracelets', 'necklaces'];
  const sorted = order.map(h => categoryOf(h)).filter(Boolean);
  const html = `${head('Categories', 'All categories - ' + site.name)}
${header()}
<section class="coll-hero" style="padding-bottom:36px;"><h1>All Categories</h1></section>
<section style="padding-top:0;"><div class="container grid grid-4">
${sorted.map(c => `
<a class="coll-tile" href="${link('categories/' + c.handle + '.html')}">
  <div class="frame"><img src="${c.image}" alt="${c.name}" /></div>
  <h3>${c.name}</h3>
</a>`).join('')}
</div></section>
${footer()}`;
  fs.mkdirSync(path.join(DIST, 'categories'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'categories', 'index.html'), html);
}

function buildCollectionsIndex() {
  CURRENT_DEPTH = 1;
  const sorted = [...collections].sort((a, b) => a.name.localeCompare(b.name));
  const html = `${head('Collections', 'All collections - ' + site.name)}
${header()}
<section class="coll-hero" style="padding-bottom:36px;"><h1>Collections</h1></section>
<section style="padding-top:0;"><div class="container grid grid-4">
${sorted.map(c => `
<a class="coll-tile" href="${link(c.handle + '.html')}">
  <div class="frame"><img src="${c.image}" alt="${c.name}" /></div>
  <h3>${c.name}</h3>
</a>`).join('')}
</div></section>
${footer()}`;
  fs.mkdirSync(path.join(DIST, 'collections'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'collections', 'index.html'), html);
}

function buildCollectionPage(c) {
  CURRENT_DEPTH = 1;
  const list = products.filter(p => p.collections && p.collections.includes(c.handle));
  const maxMoq = Math.max(...products.map(p => p.moq));
  const html = `${head(c.name, c.description)}
${header()}
<div class="container">
  <div class="coll-hero" style="padding-bottom:0;">
    <div class="eyebrow">Collection</div>
    <h1>${c.name}</h1>
    <p>${c.description}</p>
  </div>
  <div class="browse-layout" style="padding-top:36px;">
    ${filtersSidebar(maxMoq)}
    <div>
      <div class="listing-toolbar">
        <span class="item-count" id="itemCount">${list.length} item${list.length === 1 ? '' : 's'}</span>
        <select class="sort-select" onchange="window.applySort(this.value)">
          <option value="">Sort: Featured</option>
          <option value="az">Alphabetically, A-Z</option>
          <option value="za">Alphabetically, Z-A</option>
          <option value="moq-asc">MOQ, low to high</option>
          <option value="moq-desc">MOQ, high to low</option>
        </select>
      </div>
      ${productGrid(list, 'productGrid')}
    </div>
  </div>
</div>
${footer()}
${listingScript()}`;
  fs.mkdirSync(path.join(DIST, 'collections'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'collections', c.handle + '.html'), html);
}

function buildProductPage(p) {
  CURRENT_DEPTH = 1;
  const coll = p.collections && p.collections.length ? collectionOf(p.collections[0]) : null;
  const images = p.images && p.images.length ? p.images : [productImg(p)];
  const related = products.filter(o =>
    o.handle !== p.handle && o.collections && p.collections &&
    o.collections.some(h => p.collections.includes(h))
  ).slice(0, 4);

  const accordions = p.details ? Object.entries(p.details).map(([title, rows]) => `
    <details class="acc-item">
      <summary>${title}</summary>
      <div class="acc-body"><table>
        ${rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('')}
      </table></div>
    </details>`).join('') : '';

  const html = `${head(p.name, p.description)}
${header()}
<div class="container">
  <div class="crumbs">
    <a href="${link('index.html')}">Home</a> /
    <a href="${link('categories/' + p.category + '.html')}">${categoryOf(p.category) ? categoryOf(p.category).name : p.category}</a> /
    <span>${p.name}</span>
  </div>
  <div class="product-detail">
    <div>
      <div class="gallery-main"><img id="mainImg" src="${images[0]}" alt="${p.name}" /></div>
      ${images.length > 1 ? `<div class="gallery-thumbs">
        ${images.map((img, i) => `<div class="thumb${i === 0 ? ' active' : ''}" onclick="
          document.getElementById('mainImg').src='${img}';
          this.parentNode.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));
          this.classList.add('active');
        "><img src="${img}" alt="${p.name} view ${i + 1}" /></div>`).join('')}
      </div>` : ''}
    </div>
    <div class="product-info">
      <div class="eyebrow">${coll ? coll.name : ''}</div>
      <h1>${p.name}</h1>
      <div class="moq-row large">${fmtMoq(p.moq)}</div>
      ${enquireBtn(p, true)}
      <p class="desc">${p.description}</p>
      <div class="detail-accordion">${accordions}</div>
      <div class="meta-row">Have a question about sizing, materials, or customisation? Just ask on WhatsApp — we're happy to help.</div>
    </div>
  </div>

  ${related.length ? `
  <div class="related-rail">
    <div class="section-head" style="margin-bottom:24px;"><div class="eyebrow">More from ${coll ? coll.name : 'this edit'}</div><h2>You May Also Like</h2></div>
    ${productGrid(related)}
  </div>` : ''}
</div>
${footer()}`;
  fs.mkdirSync(path.join(DIST, 'products'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'products', p.handle + '.html'), html);
}

function buildSearchIndex() {
  const index = products.map(p => ({
    name: p.name,
    category: categoryOf(p.category) ? categoryOf(p.category).name : p.category,
    collections: (p.collections || []).map(h => collectionOf(h) ? collectionOf(h).name : h),
    image: productImg(p),
    url: '/products/' + p.handle + '.html'
  }));
  fs.writeFileSync(path.join(DIST, 'assets', 'search-index.json'), JSON.stringify(index));
}

// ---------------- RUN ----------------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(DIST, 'assets', 'style.css'));

buildHome();
buildAbout();
buildCategoryPage({ handle: 'all', name: 'All Jewellery' });
categories.forEach(buildCategoryPage);
buildCategoriesIndex();
buildCollectionsIndex();
collections.forEach(buildCollectionPage);
products.forEach(buildProductPage);
buildSearchIndex();

console.log(`Built ${products.length} products, ${categories.length} categories, ${collections.length} collections.`);
