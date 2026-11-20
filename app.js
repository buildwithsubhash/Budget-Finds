/* Budget Finds: public page logic. No innerHTML anywhere: DOM is built with textContent. */
(() => {
  'use strict';
  const CAT_ORDER = ['Clothing', 'Tech', 'Skincare', 'Home & Kitchen', 'Fitness']; // Clothing first
  const PLATFORMS = ['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Other'];
  const DRAFT_KEY = 'bf_draft';
  const state = { all: [], cat: 'All', plat: 'All', q: '' };
  const $ = (s) => document.querySelector(s);

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  // Only https links are ever used.
  function safeUrl(u) {
    try { const x = new URL(String(u || '')); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; }
  }
  const num = (v) => { const n = Number(v); return v !== '' && v != null && isFinite(n) && n > 0 ? n : null; };
  const money = (n) => '\u20B9' + Number(n).toLocaleString('en-IN');
  function hue(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
  function say(msg) { $('#status').textContent = msg; }

  /* ===== ANALYTICS HOOK: plug Google Analytics or Plausible in here =====
     Runs on every "Buy on ..." click. Examples (uncomment one):
     gtag('event', 'affiliate_click', { product_id: info.id, platform: info.platform });
     plausible('Affiliate Click', { props: { product: info.id, platform: info.platform } }); */
  function track(info) { /* add your analytics call here */ }

  function clean(p) {
    return {
      id: String(p.id || ''), title: String(p.title || '').trim(), description: String(p.description || ''),
      platform: PLATFORMS.includes(p.platform) ? p.platform : 'Other', category: String(p.category || 'Other'),
      url: safeUrl(p.url), image: safeUrl(p.image), price: num(p.price), mrp: num(p.mrp),
      badge: String(p.badge || ''), coupon: String(p.coupon || ''), featured: p.featured === true,
      createdAt: String(p.createdAt || '')
    };
  }

  function buildCard(p, compact) {
    const card = el('article', 'card' + (compact ? ' mini' : p.featured ? ' featured' : ''));
    const media = el('div', 'media');
    const placeholder = () => { const d = el('div', 'ph', p.title.charAt(0).toUpperCase()); d.setAttribute('aria-hidden', 'true'); return d; };
    if (p.image) {
      const img = el('img'); img.src = p.image; img.alt = p.title; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { img.remove(); media.appendChild(placeholder()); });
      media.appendChild(img);
    } else media.appendChild(placeholder());
    if (p.badge) media.appendChild(el('span', 'badge', p.badge));
    card.appendChild(media);

    const body = el('div', 'body');
    const tags = el('div', 'tags');
    const cat = el('span', 'tag cat', p.category); cat.style.setProperty('--h', hue(p.category));
    const plat = el('span', 'tag', p.platform); plat.dataset.platform = p.platform;
    tags.append(cat, plat);
    body.append(tags, el('h3', null, p.title));
    if (p.description) body.appendChild(el('p', 'why', p.description));

    if (p.price) {
      const row = el('div', 'price'); row.appendChild(el('strong', null, money(p.price)));
      if (p.mrp && p.mrp > p.price) {
        row.appendChild(el('s', null, money(p.mrp)));
        row.appendChild(el('span', 'off', Math.round((1 - p.price / p.mrp) * 100) + '% off'));
      }
      body.appendChild(row);
    }
    if (p.coupon) {
      const b = el('button', 'coupon', 'Code ' + p.coupon + '. Tap to copy'); b.type = 'button';
      b.addEventListener('click', () => copy(p.coupon).then(() => { b.textContent = 'Copied'; setTimeout(() => { b.textContent = 'Code ' + p.coupon + '. Tap to copy'; }, 1800); }));
      body.appendChild(b);
    }
    if (p.url) {
      const a = el('a', 'btn buy', 'Buy on ' + p.platform);
      a.href = p.url; a.target = '_blank'; a.rel = 'sponsored nofollow noopener noreferrer';
      a.dataset.productId = p.id; a.dataset.platform = p.platform;
      a.addEventListener('click', () => track({ id: p.id, platform: p.platform, title: p.title }));
      a.setAttribute('aria-label', 'Buy ' + p.title + ' on ' + p.platform + ' (opens in a new tab)');
      body.appendChild(a);
    }
    card.appendChild(body);
    return card;
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise((res) => {
      const t = el('textarea'); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) { /* ignore */ }
      t.remove(); res();
    });
  }

  function sorted(list) {
    const rank = (c) => { const i = CAT_ORDER.indexOf(c); return i < 0 ? 99 : i; };
    return list.slice().sort((a, b) => (b.featured - a.featured) || (rank(a.category) - rank(b.category)) || (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
  }

  function renderChips() {
    const cats = [...new Set(state.all.map((p) => p.category))].sort((a, b) => CAT_ORDER.indexOf(a) - CAT_ORDER.indexOf(b) || a.localeCompare(b));
    const box = $('#chips'); box.replaceChildren();
    ['All', ...cats].forEach((c) => {
      const b = el('button', 'chip', c); b.type = 'button'; b.setAttribute('aria-pressed', String(c === state.cat));
      b.addEventListener('click', () => { state.cat = c; renderChips(); renderGrid(); });
      box.appendChild(b);
    });
  }

  function renderGrid() {
    const q = state.q.toLowerCase();
    const list = sorted(state.all).filter((p) =>
      (state.cat === 'All' || p.category === state.cat) && (state.plat === 'All' || p.platform === state.plat) &&
      (!q || (p.title + ' ' + p.description + ' ' + p.category).toLowerCase().includes(q)));
    const grid = $('#grid'); grid.replaceChildren();
    list.forEach((p) => grid.appendChild(buildCard(p, false)));
    $('#count').textContent = list.length ? list.length + ' pick' + (list.length > 1 ? 's' : '') : 'No picks match. Try another search or category.';
  }

  async function load() {
    const preview = new URLSearchParams(location.search).get('preview') === '1';
    let data = null;
    if (preview) { try { data = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { data = null; } }
    if (Array.isArray(data)) $('#previewBanner').hidden = false; else data = null;
    if (!data) {
      try {
        const r = await fetch('products.json?v=' + Date.now(), { cache: 'no-store' }); // cache-busting
        if (!r.ok) throw new Error(r.status);
        data = await r.json();
      } catch (e) { $('#count').textContent = 'Could not load products. Please refresh the page.'; return; }
    }
    state.all = data.map(clean).filter((p) => p.title && p.url);
    PLATFORMS.forEach((n) => { const o = el('option', null, n); o.value = n; $('#plat').appendChild(o); });
    renderChips(); renderGrid();
    const stack = $('#heroStack');
    sorted(state.all).filter((p) => p.featured).slice(0, 3).forEach((p) => stack.appendChild(buildCard(p, true)));
    const newest = Math.max(0, ...state.all.map((p) => Date.parse(p.createdAt) || 0));
    if (newest) $('#updated').textContent = 'Last updated ' + new Date(newest).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  $('#q').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });
  $('#plat').addEventListener('change', (e) => { state.plat = e.target.value; renderGrid(); });
  window.addEventListener('scroll', () => { $('#browseBtn').hidden = window.scrollY < 420; }, { passive: true });
  $('#year').textContent = new Date().getFullYear();

  $('#shareBtn').addEventListener('click', async () => {
    const data = { title: document.title, text: 'Honest picks from Budget Finds', url: location.href.split('?')[0] };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await copy(data.url); say('Link copied'); alert('Link copied');
    } catch (e) { if (e.name !== 'AbortError') { copy(data.url); say('Link copied'); } }
  });

  // Optional photo: drop avatar.jpg next to index.html. Missing file is ignored.
  const av = new Image(); av.alt = 'Photo of the creator';
  av.onload = () => { const a = $('#avatar'); a.replaceChildren(av); a.removeAttribute('role'); a.removeAttribute('aria-label'); };
  av.src = 'avatar.jpg';

  // Theme toggle (light is the default; choice is remembered)
  const tbtn = $('#themeBtn'), root = document.documentElement;
  function paintTheme() {
    const d = root.dataset.theme === 'dark';
    tbtn.textContent = d ? 'Light' : 'Dark';
    tbtn.setAttribute('aria-label', d ? 'Switch to light theme' : 'Switch to dark theme');
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = d ? '#0e1014' : '#faf8f5';
  }
  tbtn.addEventListener('click', () => {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem('bf_theme', root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) { /* ignore */ }
    paintTheme();
  });
  paintTheme();

  // Mobile menu
  const menu = $('#menuBtn'), nav = $('#mainNav');
  menu.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(o)); });
  nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); } });

  load();
})();
