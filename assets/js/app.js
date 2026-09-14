/* MTAZIOMS gallery edition. Vanilla JS, no dependencies. Data contract: data/products.json (admin tool writes it). */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const state = {
  products: [],
  settings: {},
  categories: [],
  favOnly: false,
  cart: JSON.parse(localStorage.getItem('mtz_cart') || '[]'),
  favs: new Set(JSON.parse(localStorage.getItem('mtz_favs') || '[]')),
};

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const AREAS = ['Jemo 1', 'Bole', 'Megenagna', 'Ayat', 'Sarbet', 'Piassa'];

const waLink = (text) => `https://wa.me/${state.settings.whatsapp}?text=${encodeURIComponent(text)}`;
const tgLink = (text) => `https://t.me/${state.settings.telegram}?text=${encodeURIComponent(text)}`;
const money = (p) => (p == null ? 'Price on request' : `${p.toLocaleString()} birr`);
const catName = (id) => (state.categories.find((c) => c.id === id) || {}).en || id;
const isOut = (p) => p.stock === false || p.stock === 'sold-out';

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- counters ---------- */
function bump(el, n) {
  const shown = Number(el.textContent) || 0;
  el.hidden = n === 0;
  el.textContent = n;
  if (shown !== n) {
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'cubic-bezier(.23,1,.32,1)' });
  }
}
function paintCounts() {
  bump($('#cartCount'), state.cart.length);
  bump($('#favCount'), state.favs.size);
  bump($('#dockCartN'), state.cart.length);
  bump($('#dockFavN'), state.favs.size);
  const chip = $('#favChip');
  chip.hidden = state.favs.size === 0;
  chip.innerHTML = `${state.favOnly ? '&#9829;' : '&#9825;'} Saved (${state.favs.size})`;
  chip.classList.toggle('active', state.favOnly);
}

/* ---------- gallery ---------- */
function visibleProducts() {
  return state.favOnly ? state.products.filter((p) => state.favs.has(p.id)) : state.products;
}

function renderGallery() {
  const list = visibleProducts();
  const g = $('#gallery');
  g.innerHTML = list.map((p) => {
    const out = isOut(p);
    const faved = state.favs.has(p.id);
    const alt = state.products.indexOf(p);
    return `
    <article class="panel ${out ? 'out' : ''}" data-id="${p.id}" data-alt="${alt}">
      <div class="panel-media" data-open>
        <img src="${p.img}" alt="${p.name_en}" loading="lazy" draggable="false">
        ${p.featured ? '<span class="panel-badge">Featured</span>' : ''}
        ${out ? '<span class="soldout">Sold out</span>' : ''}
        <button class="fav-btn ${faved ? 'on' : ''}" data-fav="${p.id}" aria-pressed="${faved}" aria-label="${faved ? 'Remove from' : 'Save to'} saved pieces">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1  1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>
      <div class="panel-info">
        <p class="panel-cat">${catName(p.category)}</p>
        <h3 class="panel-name">${p.name_en}</h3>
        <p class="panel-color">${p.color_en || ''}</p>
        <p class="panel-desc">${p.desc_en || ''}</p>
        <p class="panel-price ${p.price == null || out ? 'inq' : ''}">${out ? 'Currently sold out' : money(p.price)}</p>
        ${out ? '<span class="panel-stock">Sold out</span>' : ''}
        <div class="panel-actions">
          <button class="btn btn-ink" data-open ${out ? 'disabled' : ''}>${out ? 'Sold out' : 'Choose size'}</button>
          <a class="btn btn-line" data-ask="${p.id}" target="_blank" rel="noopener">${out ? 'Ask when it is back' : 'Ask about this piece'}</a>
        </div>
      </div>
    </article>`;
  }).join('');

  $('#emptyMsg').hidden = list.length > 0;

  $$('.panel', g).forEach((el) => {
    const p = state.products[+el.dataset.alt];
    el.querySelector('[data-ask]').href = waLink(isOut(p)
      ? `Hello MTAZIOMS! When is "${p.name_en}" (${p.color_en}) back in stock?`
      : `Hello MTAZIOMS! Is "${p.name_en}" (${p.color_en}) available?`);
  });

  $$('[data-fav]', g).forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFav(el.dataset.fav);
  }));
  $$('[data-open]', g).forEach((el) => el.addEventListener('click', (e) => {
    openChooser(el.closest('.panel'));
  }));

  // reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.14 });
  $$('.panel', g).forEach((el) => io.observe(el));
}

function toggleFav(id) {
  if (state.favs.has(id)) {
    state.favs.delete(id);
    toast('Removed from saved pieces');
  } else {
    state.favs.add(id);
    toast('Saved. Find it under Saved anytime');
  }
  localStorage.setItem('mtz_favs', JSON.stringify([...state.favs]));
  paintCounts();
  if (state.favOnly) renderGallery();
  else $$('.panel').forEach((el) => {
    const on = state.favs.has(el.dataset.id);
    el.querySelector('.fav-btn').classList.toggle('on', on);
    el.querySelector('.fav-btn').setAttribute('aria-pressed', on);
  });
}

/* ---------- size chooser (inline in panel) ---------- */
let chooserPanel = null;
function closeChooser() {
  if (chooserPanel) {
    chooserPanel.querySelector('.sizes-row')?.remove();
    chooserPanel.querySelector('.panel-actions')?.classList.remove('hidden');
    chooserPanel = null;
  }
}
function openChooser(panel) {
  if (chooserPanel === panel) { closeChooser(); return; }
  closeChooser();
  chooserPanel = panel;
  const p = state.products[+panel.dataset.alt];
  const actions = panel.querySelector('.panel-actions');
  actions.classList.add('hidden');
  const row = document.createElement('div');
  row.className = 'sizes-row';
  row.innerHTML = `
    <p class="sizes-eyebrow">Pick a size</p>
    <div class="sizes-list">${SIZES.map((s) => `<button class="size-pick ${s === 'M' ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
    <div class="sizes-confirm"><button class="btn btn-ink confirm-btn">Add to reserve list</button><button class="sizes-cancel">Cancel</button></div>`;
  actions.after(row);
  row.querySelector('.confirm-btn').addEventListener('click', () => {
    const size = row.querySelector('.size-pick.active').dataset.size;
    addToCart(p.id, size);
    closeChooser();
  });
  row.querySelector('.sizes-cancel').addEventListener('click', closeChooser);
  $$('.size-pick', row).forEach((b) => b.addEventListener('click', () => {
    $$('.size-pick', row).forEach((x) => x.classList.toggle('active', x === b));
  }));
}

/* ---------- reserve list ---------- */
function saveCart() {
  localStorage.setItem('mtz_cart', JSON.stringify(state.cart));
  paintCounts();
}

function renderCart() {
  const box = $('#cartItems');
  const merged = [];
  state.cart.forEach((item) => {
    const hit = merged.find((m) => m.id === item.id && m.size === item.size);
    if (hit) hit.qty += 1;
    else merged.push({ ...item, qty: 1 });
  });
  box.innerHTML = merged.map((m, idx) => {
    const p = state.products.find((x) => x.id === m.id);
    if (!p) return '';
    return `
      <div class="cart-line">
        <img src="${p.img}" alt="">
        <div>
          <p class="cl-name">${p.name_en}</p>
          <p class="cl-meta">Size: ${m.size}${p.price != null ? ` · ${money(p.price)}` : ''}</p>
        </div>
        <div class="cl-right">
          <div class="qty">
            <button data-dec="${idx}" aria-label="One less">&#8722;</button>
            <span class="n">${m.qty}</span>
            <button data-inc="${idx}" aria-label="One more">+</button>
          </div>
          <button class="cl-rm" data-rm="${idx}" aria-label="Remove">&#10005;</button>
        </div>
      </div>`;
  }).join('');
  $('#cartEmpty').hidden = merged.length > 0;
  $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => {
    const m = merged[+b.dataset.rm];
    state.cart = state.cart.filter((it) => !(it.id === m.id && it.size === m.size));
    saveCart(); renderCart();
  }));
  $$('[data-inc]', box).forEach((b) => b.addEventListener('click', () => {
    const m = merged[+b.dataset.inc];
    state.cart.push({ id: m.id, size: m.size });
    saveCart(); renderCart();
  }));
  $$('[data-dec]', box).forEach((b) => b.addEventListener('click', () => {
    const m = merged[+b.dataset.dec];
    if (m.qty === 1) state.cart = state.cart.filter((it) => !(it.id === m.id && it.size === m.size));
    else {
      const rawIdx = state.cart.findIndex((it) => it.id === m.id && it.size === m.size);
      state.cart.splice(rawIdx, 1);
    }
    saveCart(); renderCart();
  }));

  const count = state.cart.length;
  const known = merged
    .map((m) => ({ m, p: state.products.find((x) => x.id === m.id) }))
    .filter((x) => x.p && x.p.price != null);
  const total = known.reduce((sum, x) => sum + x.p.price * x.m.qty, 0);
  $('#osCount').textContent = `${count} ${count === 1 ? 'piece' : 'pieces'}`;
  $('#osTotal').innerHTML = known.length
    ? `${total.toLocaleString()}<span class="os-known">Known total</span>`
    : '';
  $('#orderSummary').hidden = count === 0;
}

function addToCart(id, size) {
  state.cart.push({ id, size });
  saveCart();
  openCart();
  toast('Added to your reserve list');
}

function openCart() {
  renderCart();
  $('#cart').setAttribute('data-open', '');
  document.body.classList.add('sheet-open');
}
function closeCart() {
  $('#cart').removeAttribute('data-open');
  document.body.classList.remove('sheet-open');
}

function orderText() {
  const name = $('#cartName').value.trim();
  const note = $('#cartNote').value.trim();
  const merged = [];
  state.cart.forEach((item) => {
    const hit = merged.find((m) => m.id === item.id && m.size === item.size);
    if (hit) hit.qty += 1;
    else merged.push({ ...item, qty: 1 });
  });
  const lines = merged.map((m, i) => {
    const p = state.products.find((x) => x.id === m.id);
    const qty = m.qty > 1 ? ` x${m.qty}` : '';
    return `${i + 1}. ${p ? p.name_en : m.id}, Size ${m.size}${qty}${p && p.price != null ? `, ${money(p.price)}` : ''}`;
  });
  return [
    `Hello MTAZIOMS! I would like to order:`,
    '',
    ...lines,
    '',
    note ? `Delivery/notes: ${note}` : '',
    name ? `From: ${name}` : '',
  ].filter(Boolean).join('\n');
}

/* ---------- boot ---------- */
async function boot() {
  const data = await fetch('data/products.json').then((r) => r.json());
  state.products = data.products;
  state.settings = data.settings;
  state.categories = data.categories;

  const s = state.settings;
  $('#heroWhatsApp').href = waLink('Hello MTAZIOMS! I saw your website and I have a question.');
  $('#floatWA').href = waLink('Hello MTAZIOMS!');
  $('#fWhatsApp').href = waLink('Hello MTAZIOMS!');
  $('#fTelegram').href = `https://t.me/${s.telegram}`;
  $('#fInstagram').href = `https://www.instagram.com/${s.instagram}`;
  $('#fTikTok').href = `https://www.tiktok.com/@${s.tiktok}`;
  $('#fPhone').href = `tel:${s.phone_primary}`;
  $('#mapsLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.maps_query)}`;
  $('#visitAddress').textContent = s.address_en || '';
  $('#visitHours').textContent = s.hours_en || '';
  $('#year').textContent = new Date().getFullYear();

  paintCounts();
  renderGallery();

  $('#favBtn').addEventListener('click', () => {
    if (!state.favs.size) { toast('Tap the heart on any piece to save it here'); return; }
    state.favOnly = true;
    paintCounts();
    renderGallery();
    $('#collection').scrollIntoView({ behavior: 'smooth' });
  });
  $('#favChip').addEventListener('click', () => {
    state.favOnly = !state.favOnly;
    paintCounts();
    renderGallery();
  });
  $('#cartBtn').addEventListener('click', openCart);
  $('#dockCart').addEventListener('click', openCart);
  $('#dockFav').addEventListener('click', () => $('#favBtn').click());
  $$('[data-closecart]').forEach((el) => el.addEventListener('click', closeCart));
  $('#cartSendWA').addEventListener('click', () => { $('#cartSendWA').href = waLink(orderText()); });
  $('#cartSendTG').addEventListener('click', () => { $('#cartSendTG').href = tgLink(orderText()); });
  $('#cartCopy').addEventListener('click', async () => {
    if (!state.cart.length) { toast('Your reserve list is empty'); return; }
    try {
      await navigator.clipboard.writeText(orderText());
      toast('Order copied. Paste it in any chat');
    } catch {
      toast('Could not copy. Take a screenshot instead');
    }
  });
  $('#sizeGuideBtn').addEventListener('click', () => $('#sizeGuide').showModal());
  $('#sgClose').addEventListener('click', () => $('#sizeGuide').close());
  $('#sizeGuide').addEventListener('click', (e) => { if (e.target === $('#sizeGuide')) $('#sizeGuide').close(); });

  // area pills
  const pills = $('#areaPills');
  pills.innerHTML = AREAS.map((a) => `<button class="area-pill" type="button">${a}</button>`).join('');
  $$('.area-pill', pills).forEach((btn) => btn.addEventListener('click', () => {
    $('#cartNote').value = btn.textContent + ', Addis Ababa';
    $('#cartNote').focus();
  }));

  // floating WhatsApp after hero
  const float = $('#floatWA');
  const ioFloat = new IntersectionObserver((entries) => {
    entries.forEach((en) => float.classList.toggle('show', !en.isIntersecting));
  }, { threshold: 0.05 });
  ioFloat.observe($('#top'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeCart(); $('#sizeGuide').open && $('#sizeGuide').close(); closeChooser(); }
  });

  // cheap error net
  window.addEventListener('unhandledrejection', (e) => console.warn(e.reason));
}
boot().catch((e) => { window.__err = e.message; console.warn('boot failed:', e.message); });