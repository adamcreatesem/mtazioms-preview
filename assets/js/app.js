/* MTAZIOMS app. Vanilla JS, no dependencies. Data contract: data/products.json (admin tool writes it). */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const state = {
  products: [],
  settings: {},
  categories: [],
  filterCat: 'all',
  search: '',
  favOnly: false,
  cart: JSON.parse(localStorage.getItem('mtz_cart') || '[]'), // [{id, size}]
  favs: new Set(JSON.parse(localStorage.getItem('mtz_favs') || '[]')),
  current: null,
  currentSize: null,
  gridAnimated: false,
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

/* ---------- favorites ---------- */
function saveFavs() {
  localStorage.setItem('mtz_favs', JSON.stringify([...state.favs]));
  const n = state.favs.size;
  const badge = $('#favCount');
  badge.hidden = n === 0;
  badge.textContent = n;
  $('#favChip').hidden = n === 0;
  $('#favChip').innerHTML = n === 0 ? '&#9825; Saved' : `${state.favOnly ? '&#9829;' : '&#9825;'} Saved (${n})`;
  $('#favChip').classList.toggle('active', state.favOnly);
}
function saveCart() {
  localStorage.setItem('mtz_cart', JSON.stringify(state.cart));
  const n = state.cart.length;
  const badge = $('#cartCount');
  badge.hidden = n === 0;
  if (badge.textContent !== String(n)) {
    badge.textContent = n;
    badge.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }],
      { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    );
  }
}

function toggleFav(id) {
  if (state.favs.has(id)) {
    state.favs.delete(id);
    toast('Removed from saved pieces');
  } else {
    state.favs.add(id);
    toast('Saved. Find it under Saved anytime');
  }
  saveFavs();
  renderRail();
}

/* ---------- lookbook rail ---------- */
function filtered() {
  const q = state.search.trim().toLowerCase();
  return state.products.filter((p) => {
    if (state.filterCat !== 'all' && p.category !== state.filterCat) return false;
    if (state.favOnly && !state.favs.has(p.id)) return false;
    if (!q) return true;
    return [p.name_en, p.color_en, p.desc_en, p.category].join(' ').toLowerCase().includes(q);
  });
}

function renderRail() {
  const list = filtered();
  const rail = $('#rail');
  rail.innerHTML = list.map((p) => {
    const out = isOut(p);
    const faved = state.favs.has(p.id);
    return `
    <article class="piece ${out ? 'out' : ''}" data-id="${p.id}">
      <div class="piece-media">
        <img src="${p.img}" alt="${p.name_en}" loading="lazy" draggable="false">
        ${p.featured ? '<span class="piece-badge">Featured</span>' : ''}
        ${out ? '<span class="soldout">Sold out</span>' : ''}
        <button class="fav-btn ${faved ? 'on' : ''}" data-fav="${p.id}" aria-label="${faved ? 'Remove from' : 'Save to'} saved pieces" aria-pressed="${faved}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>
        </button>
      </div>
      <div class="piece-info">
        <h3 class="piece-name">${p.name_en}</h3>
        <p class="piece-price ${p.price == null ? 'inq' : ''}">${money(p.price)}</p>
      </div>
    </article>`;
  }).join('');
  $('#emptyMsg').hidden = list.length > 0;
  $$('.piece', rail).forEach((el) => el.addEventListener('click', () => openQv(el.dataset.id)));
  $$('[data-fav]', rail).forEach((el) => el.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFav(el.dataset.fav);
  }));
  if (!state.gridAnimated) {
    state.gridAnimated = true;
    $$('.piece', rail).forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 70, 490)}ms`;
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
      el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
    });
  } else {
    $$('.piece', rail).forEach((el) => el.classList.add('in'));
  }
}

function renderCats() {
  const wrap = $('#catFilters');
  const cats = [{ id: 'all', en: 'All' }, ...state.categories];
  wrap.innerHTML = cats.map((c) => `
    <button class="cat-btn ${c.id === state.filterCat ? 'active' : ''}" data-cat="${c.id}">${c.en}</button>`).join('');
  $$('.cat-btn', wrap).forEach((b) => b.addEventListener('click', () => {
    state.filterCat = b.dataset.cat;
    renderCats();
    renderRail();
  }));
}

/* ---------- rail arrows ---------- */
function railStep() {
  const piece = $('.piece');
  return piece ? piece.getBoundingClientRect().width + 22 : 294;
}
function updateArrows() {
  const wrap = $('.rail-wrap');
  const max = wrap.scrollWidth - wrap.clientWidth;
  $('#railPrev').disabled = wrap.scrollLeft <= 4;
  $('#railNext').disabled = wrap.scrollLeft >= max - 4;
}

/* ---------- quick view flyout ---------- */
function fillQv(p) {
  state.current = p;
  state.currentSize = 'M';
  $('#qvImg').src = p.img;
  $('#qvImg').alt = p.name_en;
  $('#qvCat').textContent = catName(p.category);
  $('#qvName').textContent = p.name_en;
  $('#qvColor').textContent = p.color_en;
  $('#qvDesc').textContent = p.desc_en || '';
  const priceEl = $('#qvPrice');
  priceEl.textContent = isOut(p) ? 'Currently sold out' : money(p.price);
  priceEl.classList.toggle('inq', p.price == null || isOut(p));
  const out = isOut(p);
  $('#qvStockBadge').hidden = !out;
  const add = $('#qvAdd');
  add.disabled = out;
  add.textContent = out ? 'Sold out' : 'Add to Bag';
  $('#qvDirect').textContent = out ? 'Ask when it is back' : 'Ask about this piece';
  $('#qvDirect').href = waLink(out
    ? `Hello MTAZIOMS! When is "${p.name_en}" (${p.color_en}) back in stock?`
    : `Hello MTAZIOMS! Is "${p.name_en}" (${p.color_en}) available?`);
  const sz = $('#qvSizes');
  sz.innerHTML = SIZES.map((s) => `<button class="size-btn ${s === 'M' ? 'active' : ''}" data-size="${s}">${s}</button>`).join('');
  $$('.size-btn', sz).forEach((b) => b.addEventListener('click', () => {
    state.currentSize = b.dataset.size;
    $$('.size-btn', sz).forEach((x) => x.classList.toggle('active', x === b));
  }));
}

function openQv(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  fillQv(p);
  $('#qv').setAttribute('data-open', '');
  document.body.style.overflow = 'hidden';
}
function closeQv() {
  $('#qv').removeAttribute('data-open');
  document.body.style.overflow = '';
}
function qvStep(dir) {
  const list = filtered();
  if (!list.length) return;
  const idx = list.findIndex((x) => x.id === state.current.id);
  const next = list[(idx + dir + list.length) % list.length];
  fillQv(next);
}

/* ---------- bag ---------- */
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
      <div class="cart-item">
        <img src="${p.img}" alt="">
        <div>
          <p class="ci-name">${p.name_en}</p>
          <p class="ci-meta">Size: ${m.size}${p.price != null ? ` · ${money(p.price)}` : ''}</p>
        </div>
        <div class="ci-qty">
          <button class="qty-btn" data-dec="${idx}" aria-label="One less" ${m.qty === 1 ? 'data-dec-line="1"' : ''}>&#8722;</button>
          <span class="qty-num">${m.qty}</span>
          <button class="qty-btn" data-inc="${idx}" aria-label="One more">+</button>
        </div>
        <button class="ci-rm" data-rm="${idx}" aria-label="Remove">&#10005;</button>
      </div>`;
  }).join('');
  $('#cartEmpty').hidden = merged.length > 0;
  $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => {
    // remove the whole line (all sizes of that piece stay untouched)
    const m = merged[+b.dataset.rm];
    state.cart = state.cart.filter((it) => !(it.id === m.id && it.size === m.size));
    saveCart();
    renderCart();
  }));
  $$('[data-inc]', box).forEach((b) => b.addEventListener('click', () => {
    const m = merged[+b.dataset.inc];
    state.cart.push({ id: m.id, size: m.size });
    saveCart();
    renderCart();
  }));
  $$('[data-dec]', box).forEach((b) => b.addEventListener('click', () => {
    const m = merged[+b.dataset.dec];
    if (m.qty === 1) { // minus at 1 removes the line
      state.cart = state.cart.filter((it) => !(it.id === m.id && it.size === m.size));
    } else {
      const rawIdx = state.cart.findIndex((it) => it.id === m.id && it.size === m.size);
      state.cart.splice(rawIdx, 1);
    }
    saveCart();
    renderCart();
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

function openCart() {
  renderCart();
  $('#cart').setAttribute('data-open', '');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  $('#cart').removeAttribute('data-open');
  document.body.style.overflow = '';
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

  renderCats();
  renderRail();
  saveFavs();
  saveCart();
  updateArrows();

  $('#searchBox').addEventListener('input', (e) => { state.search = e.target.value; renderRail(); });
  $('#cartBtn').addEventListener('click', openCart);
  $('#favBtn').addEventListener('click', () => {
    if (!state.favs.size) { toast('Tap the heart on any piece to save it here'); return; }
    state.favOnly = true;
    saveFavs();
    renderRail();
    $('#lookbook').scrollIntoView({ behavior: 'smooth' });
  });
  $('#favChip').addEventListener('click', () => {
    state.favOnly = !state.favOnly;
    saveFavs();
    renderRail();
  });
  $$('[data-closeqv]').forEach((el) => el.addEventListener('click', closeQv));
  $$('[data-closecart]').forEach((el) => el.addEventListener('click', closeCart));
  $('#qvAdd').addEventListener('click', () => {
    if (!state.current || isOut(state.current)) return;
    const same = state.cart.find((it) => it.id === state.current.id && it.size === state.currentSize);
    if (same) {
      closeQv();
      openCart();
      toast('Already in your bag, same size');
      return;
    }
    state.cart.push({ id: state.current.id, size: state.currentSize || 'M' });
    saveCart();
    closeQv();
    openCart();
  });
  $('#qvPrev').addEventListener('click', () => qvStep(-1));
  $('#qvNext').addEventListener('click', () => qvStep(1));

  // rail arrows
  $('#railPrev').addEventListener('click', () => $('.rail-wrap').scrollBy({ left: -railStep() * 2, behavior: 'smooth' }));
  $('#railNext').addEventListener('click', () => $('.rail-wrap').scrollBy({ left: railStep() * 2, behavior: 'smooth' }));
  $('.rail-wrap').addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);

  $('#cartSendWA').addEventListener('click', () => {
    $('#cartSendWA').href = waLink(orderText());
  });
  $('#cartSendTG').addEventListener('click', () => {
    $('#cartSendTG').href = tgLink(orderText());
  });
  $('#cartCopy').addEventListener('click', async () => {
    if (!state.cart.length) { toast('Your bag is empty'); return; }
    try {
      await navigator.clipboard.writeText(orderText());
      toast('Order copied. Paste it in any chat');
    } catch {
      toast('Could not copy. Take a screenshot instead');
    }
  });

  // size guide
  $('#sizeGuideBtn').addEventListener('click', () => $('#sizeGuide').showModal());
  $('#sgClose').addEventListener('click', () => $('#sizeGuide').close());
  $('#sizeGuide').addEventListener('click', (e) => { if (e.target === $('#sizeGuide')) $('#sizeGuide').close(); });

  // floating WhatsApp appears after the hero
  const float = $('#floatWA');
  const ioFloat = new IntersectionObserver((entries) => {
    entries.forEach((en) => float.classList.toggle('show', !en.isIntersecting));
  }, { threshold: 0.08 });
  ioFloat.observe($('#top'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeQv(); closeCart(); }
    if ($('#qv').hasAttribute('data-open')) {
      if (e.key === 'ArrowLeft') qvStep(-1);
      if (e.key === 'ArrowRight') qvStep(1);
    }
  });

  // delivery area pills: one tap fills the note field
  const pills = $('#areaPills');
  pills.innerHTML = AREAS.map((a) => `<button class="area-pill" type="button">${a}</button>`).join('');
  $$('.area-pill', pills).forEach((btn) => btn.addEventListener('click', () => {
    $('#cartNote').value = btn.textContent + ', Addis Ababa';
    $('#cartNote').focus();
  }));

  // scroll reveal for static sections
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}
boot();
