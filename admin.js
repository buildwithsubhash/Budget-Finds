/* Budget Finds admin. Drafts live in localStorage; "Publish" commits products.json via GitHub Contents API. */
(() => {
  'use strict';
  const DRAFT_KEY = 'bf_draft', TOKEN_KEY = 'bf_token', GH_KEY = 'bf_gh';
  const PLATFORMS = ['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Other'];
  const $ = (s) => document.querySelector(s);
  let products = [];

  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  const isHttps = (u) => { try { return new URL(u).protocol === 'https:'; } catch (e) { return false; } };

  /* ---------- Draft storage ---------- */
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(products)); $('#draftState').textContent = 'Draft saved ' + new Date().toLocaleTimeString(); }
    catch (e) { $('#draftState').textContent = 'Could not save draft (browser storage blocked)'; }
    render();
  }
  async function loadLive() {
    const r = await fetch('products.json?v=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('load');
    return r.json();
  }
  async function init() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(DRAFT_KEY)); } catch (e) { d = null; }
    if (Array.isArray(d)) { products = d; $('#draftState').textContent = 'Loaded saved draft'; }
    else { try { products = await loadLive(); $('#draftState').textContent = 'Loaded live list'; } catch (e) { products = []; $('#draftState').textContent = 'Could not load products.json'; } }
    render(); initGithub();
  }

  /* ---------- List ---------- */
  function render() {
    $('#n').textContent = products.length;
    const ul = $('#list'); ul.replaceChildren();
    products.forEach((p) => {
      const li = el('li'); const t = el('div', 't');
      t.append(el('strong', null, (p.featured ? '\u2605 ' : '') + p.title), el('small', null, p.platform + ', ' + p.category));
      const ed = el('button', 'btn small ghost', 'Edit'); ed.type = 'button'; ed.addEventListener('click', () => fill(p));
      const del = el('button', 'btn small danger', 'Delete'); del.type = 'button';
      del.addEventListener('click', () => { if (confirm('Delete "' + p.title + '"?')) { products = products.filter((x) => x.id !== p.id); saveDraft(); } });
      li.append(t, ed, del); ul.appendChild(li);
    });
  }

  /* ---------- Form ---------- */
  const F = ['id', 'created', 'title', 'desc', 'platform', 'category', 'url', 'image', 'price', 'mrp', 'badge', 'coupon'];
  const f = (k) => $('#f-' + k);
  function fill(p) {
    f('id').value = p.id; f('created').value = p.createdAt || ''; f('title').value = p.title; f('desc').value = p.description || '';
    f('platform').value = p.platform; f('category').value = p.category; f('url').value = p.url; f('image').value = p.image || '';
    f('price').value = p.price == null ? '' : p.price; f('mrp').value = p.mrp == null ? '' : p.mrp;
    f('badge').value = p.badge || ''; f('coupon').value = p.coupon || ''; f('featured').checked = !!p.featured;
    $('#formTitle').textContent = 'Edit product'; f('title').focus(); window.scrollTo({ top: 0 });
  }
  function clearForm() { F.forEach((k) => { if (k !== 'platform') f(k).value = ''; }); f('platform').value = 'Amazon'; f('featured').checked = false; $('#formTitle').textContent = 'Add product'; $('#formErr').textContent = ''; }
  const optNum = (v) => { v = v.trim(); if (!v) return null; const n = Number(v); return isFinite(n) && n >= 0 ? n : NaN; };

  $('#pform').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = f('title').value.trim(), url = f('url').value.trim(), image = f('image').value.trim();
    const price = optNum(f('price').value), mrp = optNum(f('mrp').value);
    let err = '';
    if (!title) err = 'Title is required.';
    else if (!isHttps(url)) err = 'The affiliate link must start with https://';
    else if (image && !isHttps(image)) err = 'The image URL must start with https:// (or leave it empty).';
    else if (Number.isNaN(price) || Number.isNaN(mrp)) err = 'Prices must be numbers, or empty.';
    else if (price != null && mrp != null && mrp < price) err = 'MRP should not be lower than the price.';
    $('#formErr').textContent = err; if (err) return;
    const p = {
      id: f('id').value || 'p-' + Date.now().toString(36), title, description: f('desc').value.trim(),
      platform: PLATFORMS.includes(f('platform').value) ? f('platform').value : 'Other', category: f('category').value.trim() || 'Other',
      url, image, price, mrp, badge: f('badge').value.trim(), coupon: f('coupon').value.trim(),
      featured: f('featured').checked, createdAt: f('created').value || new Date().toISOString()
    };
    const i = products.findIndex((x) => x.id === p.id);
    if (i >= 0) products[i] = p; else products.unshift(p);
    saveDraft(); clearForm();
  });
  $('#clearBtn').addEventListener('click', clearForm);

  /* ---------- Backup, import, reset ---------- */
  const toolMsg = (m) => { $('#toolMsg').textContent = m; };
  const asJson = () => JSON.stringify(products, null, 2) + '\n';
  $('#dlBtn').addEventListener('click', () => {
    const a = el('a'); a.href = URL.createObjectURL(new Blob([asJson()], { type: 'application/json' })); a.download = 'products.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data)) throw new Error('not an array');
      const ok = data.filter((p) => p && typeof p.title === 'string' && p.title.trim() && isHttps(p.url)).map((p, i) => ({
        id: String(p.id || 'p-imp' + i), title: p.title.trim(), description: String(p.description || ''),
        platform: PLATFORMS.includes(p.platform) ? p.platform : 'Other', category: String(p.category || 'Other'), url: p.url,
        image: isHttps(p.image) ? p.image : '', price: p.price == null || p.price === '' ? null : Number(p.price) || null,
        mrp: p.mrp == null || p.mrp === '' ? null : Number(p.mrp) || null, badge: String(p.badge || ''), coupon: String(p.coupon || ''),
        featured: p.featured === true, createdAt: String(p.createdAt || new Date().toISOString())
      }));
      products = ok; saveDraft(); toolMsg('Imported ' + ok.length + ' of ' + data.length + ' products (invalid ones skipped).');
    } catch (err) { toolMsg('That file is not a valid products.json.'); }
    e.target.value = '';
  });
  $('#resetBtn').addEventListener('click', async () => {
    if (!confirm('Discard your draft and reload the live list?')) return;
    try { localStorage.removeItem(DRAFT_KEY); products = await loadLive(); render(); toolMsg('Draft discarded.'); } catch (e) { toolMsg('Could not load the live list.'); }
  });

  /* ---------- GitHub publishing ---------- */
  function initGithub() {
    let saved = {}; try { saved = JSON.parse(localStorage.getItem(GH_KEY)) || {}; } catch (e) { /* ignore */ }
    const host = location.hostname;
    let user = saved.user || '', repo = saved.repo || '';
    if (host.endsWith('.github.io')) { // auto-detect from https://USER.github.io/REPO/admin.html
      user = user || host.split('.')[0];
      const first = location.pathname.split('/')[1];
      repo = repo || (first && !first.endsWith('.html') ? first : host);
    }
    $('#gh-user').value = user; $('#gh-repo').value = repo; $('#gh-branch').value = saved.branch || 'main';
    try { const t = localStorage.getItem(TOKEN_KEY); if (t) { $('#gh-token').value = t; $('#gh-remember').checked = true; } } catch (e) { /* ignore */ }
  }
  function b64(str) { let s = ''; new TextEncoder().encode(str).forEach((b) => { s += String.fromCharCode(b); }); return btoa(s); } // UTF-8 safe
  const ERR = {
    401: 'GitHub rejected the token (401). It may be wrong or expired. Create a new one.',
    403: 'Not allowed (403). Check the token has Contents: Read and write for this repo, or you hit a rate limit.',
    404: 'Not found (404). Check username, repo and branch, and that the token can access this repo.',
    409: 'Conflict (409). The file changed while publishing. Click Publish again.',
    422: 'GitHub could not process the request (422). Check that the branch name is correct.'
  };
  async function gh(url, opts, token) {
    return fetch(url, Object.assign({ headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' } }, opts));
  }
  $('#pubBtn').addEventListener('click', async () => {
    const msg = $('#pubMsg'), user = $('#gh-user').value.trim(), repo = $('#gh-repo').value.trim(), branch = $('#gh-branch').value.trim() || 'main', token = $('#gh-token').value.trim();
    if (!user || !repo || !token) { msg.textContent = 'Fill in username, repository and token.'; return; }
    msg.textContent = 'Publishing...';
    try {
      localStorage.setItem(GH_KEY, JSON.stringify({ user, repo, branch }));
      if ($('#gh-remember').checked) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* ignore */ }
    const api = 'https://api.github.com/repos/' + encodeURIComponent(user) + '/' + encodeURIComponent(repo) + '/contents/products.json';
    try {
      let sha; // 1. get the current file's sha (missing file is fine: we create it)
      const g = await gh(api + '?ref=' + encodeURIComponent(branch), {}, token);
      if (g.ok) sha = (await g.json()).sha; else if (g.status !== 404) throw { status: g.status };
      const body = { message: 'Update products via admin panel', content: b64(asJson()), branch };
      if (sha) body.sha = sha;
      const put = await gh(api, { method: 'PUT', body: JSON.stringify(body) }, token); // 2. commit
      if (!put.ok) throw { status: put.status };
      msg.textContent = 'Published. The live site updates in about a minute.';
    } catch (e) { msg.textContent = ERR[e && e.status] || 'Could not reach GitHub. Check your internet connection and try again.'; }
  });

  init();
})();
