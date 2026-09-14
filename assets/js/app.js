/* MTAZIOMS catalog. Vanilla JS, no dependencies. */
'use strict';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

const state = {
  lang: localStorage.getItem('mtz_lang') || 'en',
  products: [],
  settings: {},
  categories: [],
  filterCat: 'all',
  search: '',
  cart: JSON.parse(localStorage.getItem('mtz_cart') || '[]'), // [{id, size}]
  current: null,
  currentSize: null,
};

/* ---------- i18n strings ---------- */
const I18N = {
  en: {
    nav_collection: 'Collection', nav_visit: 'Visit Us', nav_contact: 'Contact',
    hero_eyebrow: 'Addis Ababa · Jemo 1 · Sun Moon Star Mall',
    hero_tag: 'Where Elegance Meets Luxury',
    hero_sub: 'Luxury abayas, diriya & mukhawir, hand-picked in Addis Ababa. Free delivery in the city.',
    hero_browse: 'Browse the Collection', hero_order: 'Order on WhatsApp',
    collection_title: 'The Collection',
    collection_sub: 'Tap any piece to view, choose your size, and send your order in one tap.',
    search_ph: 'Search colors, styles…',
    empty: 'Nothing matches that search. Try another color or style.',
    strip_delivery: 'Free delivery in Addis Ababa',
    strip_premium: 'Hand-picked premium fabrics',
    strip_order: 'Order in one tap, no account needed',
    visit_title: 'Visit the Boutique',
    visit_maps: 'Open in Google Maps',
    footer_tag: 'Where Elegance Meets Luxury',
    m_add: 'Add to Order', m_direct: 'Ask about this piece',
    m_note: 'Confirming stock takes one message. We reply fast.',
    cart_title: 'Your Order',
    form_title: 'Delivery details',
    cart_name_label: 'Your name',
    cart_note_label: 'Delivery area / notes',
    area_hint: 'Popular:',
    os_pieces: (n) => `${n} ${n === 1 ? 'piece' : 'pieces'}`,
    os_total: 'Known total',
    trust_reply: 'Replies in minutes',
    trust_delivery: 'Free delivery in Addis',
    cart_empty: 'Your order list is empty. Tap a piece you love and add it.',
    cart_name_ph: 'Your name',
    cart_note_ph: 'Delivery area / notes',
    cart_send_wa: 'Send Order on WhatsApp',
    cart_send_tg: 'Send on Telegram',
    price_fmt: (p) => `${p.toLocaleString()} birr`,
    inquired: 'Price on request',
    new_badge: 'New arrival',
    featured_badge: 'Featured',
    sizes_label: 'Size',
  },
  am: {
    nav_collection: 'ስብስብ', nav_visit: 'ይጎብኙን', nav_contact: 'አግኙን',
    hero_eyebrow: 'አዲስ አበባ · ጀሞ 1 · ሳን ሙን ስታር ሞል',
    hero_tag: 'ቀሰምን ገፅነትን አንድ ላይ',
    hero_sub: 'የፕሪሚየም አባያ፣ ድሪያ እና ሙካወር፣ በአዲስ አበባ ተመርጦ የቀረበ። ከተማ ውስጥ ነጻ ማድረስ።',
    hero_browse: 'ስብስቡን ይመልከቱ', hero_order: 'በዋትስአፕ ይዘዙ',
    collection_title: 'ስብስብ',
    collection_sub: 'የሚወዱትን በጫኑ፣ መጠንዎን ይምረጡ፣ ትዕዛዝዎን በአንድ ጫን ይላኩ።',
    search_ph: 'ቀለም፣ ዓይነት ይፈልጉ…',
    empty: 'ከፍለጋዎ ጋር የሚመሳሰል አልተገኘም። ሌላ ይሞክሩ።',
    strip_delivery: 'በአዲስ አበባ ነጻ ማድረስ',
    strip_premium: 'በእጅ የተመረጡ የተለዩ ጨርቆች',
    strip_order: 'በአንድ ጫን ይዘዙ፣ መመዝገብ አያስፈልግም',
    visit_title: 'ቢንግተናችንን ይጎብኙን',
    visit_maps: 'በGoogle Maps ክፈት',
    footer_tag: 'ቀሰምን ገፅነትን አንድ ላይ',
    m_add: 'ወደ ትዕዛዝ ጨምር', m_direct: 'ስለ እንደዚህ ጠይቅ',
    m_note: 'ያለበትን ለማረጋገጥ አንድ መልእክት ብቻ ይሰፍናል። በፍጥነት እንመልሳለን።',
    cart_title: 'ትዕዛዝዎ',
    form_title: 'የማድረስ ዝርዝር',
    cart_name_label: 'ስምዎ',
    cart_note_label: 'የማድረስ ቦታ / ማስታወሻ',
    area_hint: 'ተወዳጅ:',
    os_pieces: (n) => `${n} ቁርጥራጮች`,
    os_total: 'የሚታወቅ ጠቅላላ',
    trust_reply: 'በደቂቃዎች ውስጥ እንመልሳለን',
    trust_delivery: 'በአዲስ አበባ ነጻ ማድረስ',
    cart_empty: 'ትዕዛዝዎ ባዶ ነው። የሚወዱትን በጫኑ ይጨምሩ።',
    cart_name_ph: 'ስምዎ',
    cart_note_ph: 'የማድረስ ቦታ / ማስታወሻ',
    cart_send_wa: 'በዋትስአፕ ላክ',
    cart_send_tg: 'በቴሌግራም ላክ',
    price_fmt: (p) => `${p.toLocaleString()} ብር`,
    inquired: 'ዋጋውን ይጠይቁ',
    new_badge: 'አዲስ',
    featured_badge: 'ተመራጭ',
    sizes_label: 'መጠን',
  },
};
const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || I18N.en[k] || k;

/* ---------- helpers ---------- */
const L = (o, key) => o[`${key}_${state.lang}`] || o[`${key}_en`] || '';
const waLink = (text) => `https://wa.me/${state.settings.whatsapp}?text=${encodeURIComponent(text)}`;
const tgLink = (text) => `https://t.me/${state.settings.telegram}?text=${encodeURIComponent(text)}`;
const money = (p) => (p == null ? t('inquired') : t('price_fmt')(p));

function saveCart() {
  localStorage.setItem('mtz_cart', JSON.stringify(state.cart));
  const n = state.cart.length;
  $('#cartCount').hidden = n === 0;
  $('#cartCount').textContent = n;
}

/* ---------- i18n paint ---------- */
function applyLang() {
  document.documentElement.lang = state.lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  $('#langToggle').textContent = state.lang === 'en' ? 'አማርኛ' : 'English';
  $('#visitAddress').textContent = L(state.settings, 'address');
  $('#visitHours').textContent = L(state.settings, 'hours');
  renderGrid();
  renderCart();
}

/* ---------- grid ---------- */
function badge(p) {
  if (p.featured) return `<span class="card-badge">${t('featured_badge')}</span>`;
  return '';
}
function renderGrid() {
  const q = state.search.trim().toLowerCase();
  const list = state.products.filter((p) => {
    if (state.filterCat !== 'all' && p.category !== state.filterCat) return false;
    if (!q) return true;
    return [p.name_en, p.name_am, p.color_en, p.color_am, p.desc_en, p.category]
      .join(' ').toLowerCase().includes(q);
  });
  const grid = $('#grid');
  grid.innerHTML = list.map((p) => `
    <article class="card" data-id="${p.id}">
      <div class="card-media">
        <img src="${p.img}" alt="${p.name_en}" loading="lazy">
        ${badge(p)}
      </div>
      <div class="card-body">
        <h3 class="card-name">${L(p, 'name')}</h3>
        <p class="card-color">${L(p, 'color')}</p>
        <p class="card-price ${p.price == null ? 'inq' : ''}">${money(p.price)}</p>
      </div>
    </article>`).join('');
  $('#emptyMsg').hidden = list.length > 0;
  $$('.card', grid).forEach((el) =>
    el.addEventListener('click', () => openModal(el.dataset.id)));
  // entrance stagger (cap the delay so long lists don't crawl in)
  $$('.card', grid).forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i * 60, 420)}ms`;
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    el.addEventListener('transitionend', () => { el.style.transitionDelay = ''; }, { once: true });
  });
}

function renderCats() {
  const wrap = $('#catFilters');
  const cats = [{ id: 'all', en: 'All', am: 'ሁሉም' }, ...state.categories];
  wrap.innerHTML = cats.map((c) => `
    <button class="cat-btn ${c.id === state.filterCat ? 'active' : ''}" data-cat="${c.id}">${L(c, '') ? L(c, '') : (c.en)}</button>`).join('');
  $$('.cat-btn', wrap).forEach((b) => b.addEventListener('click', () => {
    state.filterCat = b.dataset.cat;
    renderCats();
    renderGrid();
  }));
}

/* ---------- modal ---------- */
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
function openModal(id) {
  const p = state.products.find((x) => x.id === id);
  if (!p) return;
  state.current = p;
  state.currentSize = null;
  $('#mImg').src = p.img;
  $('#mImg').alt = p.name_en;
  $('#mCat').textContent = (state.categories.find((c) => c.id === p.category) || {}).en || '';
  $('#mName').textContent = L(p, 'name');
  $('#mColor').textContent = L(p, 'color');
  $('#mDesc').textContent = L(p, 'desc');
  const priceEl = $('#mPrice');
  priceEl.textContent = money(p.price);
  priceEl.classList.toggle('inq', p.price == null);
  const sz = $('#mSizes');
  sz.innerHTML = SIZES.map((s, i) =>
    `<button class="size-btn ${i === 1 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('');
  state.currentSize = 'M';
  $$('.size-btn', sz).forEach((b) => b.addEventListener('click', () => {
    state.currentSize = b.dataset.size;
    $$('.size-btn', sz).forEach((x) => x.classList.toggle('active', x === b));
  }));
  $('#mDirect').href = waLink(`Hello MTAZIOMS! Is "${p.name_en}" (${L(p, 'color')}) available?`);
  $('#modal').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modal').hidden = true;
  document.body.style.overflow = '';
}

/* ---------- cart ---------- */
function renderCart() {
  const box = $('#cartItems');
  box.innerHTML = state.cart.map((item, idx) => {
    const p = state.products.find((x) => x.id === item.id);
    if (!p) return '';
    return `
      <div class="cart-item">
        <img src="${p.img}" alt="">
        <div>
          <p class="ci-name">${L(p, 'name')}</p>
          <p class="ci-meta">${t('sizes_label')}: ${item.size}${p.price != null ? ` · ${money(p.price)}` : ''}</p>
        </div>
        <button class="ci-rm" data-rm="${idx}" aria-label="Remove">✕</button>
      </div>`;
  }).join('');
  $('#cartEmpty').hidden = state.cart.length > 0;
  $$('[data-rm]', box).forEach((b) => b.addEventListener('click', () => {
    state.cart.splice(+b.dataset.rm, 1);
    saveCart();
    renderCart();
  }));
  // order summary: count + total of known prices only (never fabricate, Rule 29)
  const known = state.cart
    .map((item) => state.products.find((x) => x.id === item.id))
    .filter((p) => p && p.price != null);
  const total = known.reduce((sum, p) => sum + p.price, 0);
  $('#osCount').textContent = t('os_pieces')(state.cart.length);
  $('#osTotal').innerHTML = known.length
    ? `${total.toLocaleString()}<span class="os-known">${t('os_total')}</span>`
    : '';
  $('#orderSummary').hidden = state.cart.length === 0;
}
function orderText() {
  const name = $('#cartName').value.trim();
  const note = $('#cartNote').value.trim();
  const lines = state.cart.map((item, i) => {
    const p = state.products.find((x) => x.id === item.id);
    return `${i + 1}. ${p ? p.name_en : item.id}, Size ${item.size}${p && p.price != null ? `, ${money(p.price)}` : ''}`;
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
  $('#cart').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  $('#cart').hidden = true;
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
  $('#fWhatsApp').href = waLink('Hello MTAZIOMS!');
  $('#fTelegram').href = `https://t.me/${s.telegram}`;
  $('#fInstagram').href = `https://www.instagram.com/${s.instagram}`;
  $('#fTikTok').href = `https://www.tiktok.com/@${s.tiktok}`;
  $('#fPhone').href = `tel:${s.phone_primary}`;
  $('#mapsLink').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.maps_query)}`;
  $('#year').textContent = new Date().getFullYear();

  renderCats();
  applyLang();
  saveCart();

  $('#langToggle').addEventListener('click', () => {
    state.lang = state.lang === 'en' ? 'am' : 'en';
    localStorage.setItem('mtz_lang', state.lang);
    applyLang();
  });
  $('#searchBox').addEventListener('input', (e) => { state.search = e.target.value; renderGrid(); });
  $('#cartBtn').addEventListener('click', openCart);
  $$('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  $$('[data-closecart]').forEach((el) => el.addEventListener('click', closeCart));
  $('#mAdd').addEventListener('click', () => {
    if (!state.current) return;
    state.cart.push({ id: state.current.id, size: state.currentSize || 'M' });
    saveCart();
    closeModal();
    openCart();
  });
  $('#cartSendWA').addEventListener('click', () => {
    $('#cartSendWA').href = waLink(orderText());
  });
  $('#cartSendTG').addEventListener('click', () => {
    $('#cartSendTG').href = tgLink(orderText());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeCart(); }
  });

  // marquee: duplicate the item set once for a seamless -50% loop (clones keep data-i18n)
  const track = $('#stripTrack');
  if (track) [...track.children].forEach((child) => track.appendChild(child.cloneNode(true)));

  // popular delivery areas: one tap fills the note field
  const AREAS = ['Jemo 1', 'Bole', 'Megenagna', 'Ayat', 'Sarbet', 'Piassa'];
  const pills = $('#areaPills');
  pills.innerHTML = AREAS.map((a) => `<button class="area-pill" type="button">${a}</button>`).join('');
  $$('.area-pill', pills).forEach((btn) => btn.addEventListener('click', () => {
    $('#cartNote').value = btn.textContent + ', Addis Ababa';
    $('#cartNote').focus();
  }));

  // section reveal on scroll (static elements only; cards stagger in renderGrid)
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}
boot();
