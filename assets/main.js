// Linden Residences — shared header/footer, interactions and page logic.
(function () {
  const B = window.BRAND, IMG = window.IMG, PROPS = window.PROPERTIES;
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = n => '€ ' + n.toLocaleString('en-US');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Page addresses: the static site uses .html files; the WordPress theme passes window.SITE_URLS.
  const U = Object.assign({ home: 'index.html', properties: 'properties.html', property: 'property.html', project: 'project.html', location: 'location.html', contact: 'contact.html' }, window.SITE_URLS || {});
  const url = (k, q) => U[k] + (q ? (U[k].indexOf('?') > -1 ? '&' : '?') + q : '');
  window.siteUrl = url;
  // Photo source: a key from IMG (demo photos) or a full URL (WordPress media).
  const imgSrc = (k, w) => /^(https?:)?\/\//.test(k) || k.charAt(0) === '/' ? k : IMG[k](w);

  // ---------- icons ----------
  const P = {
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/>',
    menu: '<path d="M4 8h16M4 16h16"/>', close: '<path d="M18 6 6 18M6 6l12 12"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bed: '<path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/>', bath: '<path d="M4 12h16a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-2a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2"/>',
    area: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>', floor: '<path d="m12 2 10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>', sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    tree: '<path d="M12 22v-7M7 15a5 5 0 0 1-.2-9.9A6 6 0 0 1 17.2 5 5 5 0 0 1 17 15z"/>', parking: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    filter: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    train: '<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M8 21l2-4M16 21l-2-4"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    bag: '<path d="M6 7h12l1 14H5L6 7zM9 7a3 3 0 0 1 6 0"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chat: '<path d="M21 12a9 9 0 0 1-13.2 8L3 21l1.1-4.6A9 9 0 1 1 21 12z"/>', check: '<path d="M20 6 9 17l-5-5"/>', cube: '<path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>', calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  };
  const icon = (n, cls) => `<svg ${cls ? `class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
  window.icon = icon;
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#E7FD55"/><path d="M16 26V14M16 18l-5-5M16 15l5-5M16 21l4-3" stroke="#2E3A26" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';

  // ---------- favourites ----------
  const FKEY = 'linden-favs';
  const favs = new Set((() => { try { return JSON.parse(localStorage.getItem(FKEY)) || []; } catch (e) { return []; } })());
  const saveFavs = () => { try { localStorage.setItem(FKEY, JSON.stringify([...favs])); } catch (e) {} $$('.fav-count').forEach(el => { el.textContent = favs.size; el.hidden = !favs.size; }); };

  // ---------- header / footer ----------
  const NAV = [[url('home'), 'Home', 'home'], [url('properties'), 'Properties', 'properties'], [url('project'), 'The Project', 'project'], [url('location'), 'Location', 'location'], [url('contact'), 'Contact', 'contact']];
  const header = `
  <header class="site-header" id="top"><div class="wrap"><div class="site-header__bar">
    <button class="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu">${icon('menu')}<span class="menu-label">Menu</span></button>
    <a class="logo" href="${url('home')}" aria-label="${B.name} home">${LOGO}<span>${B.name}</span></a>
    <nav class="nav" aria-label="Main">${NAV.map(([h, l, k]) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="header-actions">
      <a class="icon-btn fav-link" href="${url('properties', 'fav=1')}" aria-label="Saved properties">${icon('heart')}<span class="fav-count" hidden>0</span></a>
      <a class="btn btn--primary btn--sm" href="${url('contact')}">Inquire ${icon('arrow')}</a>
    </div>
  </div></div></header>
  <div class="mobile-menu" id="mobile-menu" data-lenis-prevent role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true">
    <div class="mm__top"><a class="logo" href="${url('home')}">${LOGO}<span>${B.name}</span></a>
      <button class="mm__close menu-close" type="button" aria-label="Close menu">${icon('close')}<span>Close</span></button></div>
    <div class="mm__body">
      <nav class="mm__nav" aria-label="Pages">${NAV.map(([h, l, k], i) => `<a href="${h}" ${k === page ? 'aria-current="page"' : ''}><small>0${i + 1}</small><span>${l}</span>${icon('arrow')}</a>`).join('')}</nav>
      <aside class="mm__side">
        <div class="mm__img"><img data-img="facade:900" alt="" loading="lazy"></div>
        <div class="mm__info"><span class="eyebrow">Sales office</span><p>${B.address}</p><p><a href="tel:${B.phone.replace(/\s/g, '')}">${B.phone}</a><br><a href="mailto:${B.email}">${B.email}</a></p></div>
        <a class="btn btn--primary btn--block" href="${url('contact')}">Book a viewing ${icon('arrow')}</a>
      </aside>
    </div>
  </div>`;
  const footer = `
  <footer class="site-footer"><div class="wrap">
    <div class="footer-top">
      <div class="stack"><a class="logo" href="${url('home')}">${LOGO}<span>${B.name}</span></a>
        <p style="color:var(--sand-400);font-size:.875rem;max-width:32ch">A residential and business address in ${B.district}, built around light, greenery and long-term value.</p>
        <p style="font-size:.875rem">${B.address}<br>${B.phone}</p></div>
      <div class="footer-cols">
        <div><h4>Properties</h4><a href="${url('properties', 'type=Apartment')}">Apartments</a><a href="${url('properties', 'type=Penthouse')}">Penthouses</a><a href="${url('properties', 'type=Office')}">Offices</a><a href="${url('properties', 'type=Retail')}">Retail</a></div>
        <div><h4>Project</h4><a href="${url('project')}">Design</a><a href="${url('project')}#amenities">Amenities</a><a href="${url('project')}#progress">Progress</a><a href="${url('location')}">Location</a></div>
        <div><h4>Company</h4><a href="${url('contact')}">Contact</a><a href="${url('contact')}#faq">FAQ</a><a href="#">Privacy</a><a href="#">Terms</a></div>
      </div>
      <div><h3 class="h4" style="color:var(--cream-100)">Join our community</h3><p style="color:var(--sand-400);font-size:.875rem;margin-top:8px">Launch news, new releases and price updates.</p>
        <form class="newsletter" data-toast="Thanks — you're on the list."><label class="sr-only" for="nl">Email address</label><input id="nl" name="email" type="email" placeholder="Email address" required><button class="btn btn--primary btn--sm" type="submit">Join</button></form></div>
    </div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} ${B.name}. Demo website — images from Unsplash.</span><span>Instagram · LinkedIn · Facebook</span></div>
  </div></footer>
  <div class="toast" role="status" aria-live="polite"></div>`;
  document.body.insertAdjacentHTML('afterbegin', header);
  document.body.insertAdjacentHTML('beforeend', footer);
  saveFavs();


  // ---------- hero leaves (drawn in code) ----------
  const leavesBox = $('.hero__leaves');
  if (leavesBox) {
    const greens = ['#1F271A', '#2E3A26', '#46573C', '#60735C', '#7F9270', '#9AA894'];
    let sd = 11; const r = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const leaf = 'M0 0C-14-10-30-2-26 16C-22 30-6 38 0 48C6 38 22 30 26 16C30-2 14-10 0 0Z';
    let g = '';
    for (let i = 0; i < 260; i++) {
      const x = r() * 1520 - 40, depth = Math.pow(r(), 1.4), y = 610 - depth * 420 + r() * 30;
      const sc = 0.55 + (1 - depth) * 0.9 + r() * 0.35, rot = r() * 360, c = greens[Math.min(5, Math.floor(depth * 4.5 + r() * 1.5))];
      g += `<g class="lf" transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) rotate(${rot.toFixed(0)}) scale(${sc.toFixed(2)})"><path d="${leaf}" fill="${c}"/><path d="M0 4V46" stroke="rgba(253,251,239,.18)" stroke-width="1.2" fill="none"/></g>`;
    }
    leavesBox.innerHTML = `<svg viewBox="0 0 1440 600" preserveAspectRatio="xMidYMax slice"><rect x="-40" y="560" width="1520" height="60" fill="#FDFBEF"/>${g}<rect x="-40" y="585" width="1520" height="40" fill="#FDFBEF"/></svg>`;
  }

  // loader (home only): counts up while hero image loads, max ~1.4s
  const loader = $('.loader');
  const M = window.Motion;
  if (loader && M) M.loader(loader);
  else if (loader) {
    const pct = $('.loader__pct', loader), bar = $('.loader__bar span', loader);
    let n = 0; const t0 = performance.now();
    const tick = () => { const p = Math.min(100, Math.round((performance.now() - t0) / 12)); if (p !== n) { n = p; pct.textContent = n + '%'; bar.style.width = n + '%'; } if (n < 100) requestAnimationFrame(tick); else document.documentElement.classList.add('loaded'); };
    requestAnimationFrame(tick);
  } else document.documentElement.classList.add('loaded');


  // mobile menu
  const lock = on => { document.body.style.overflow = on ? 'hidden' : ''; if (window.lenis) on ? window.lenis.stop() : window.lenis.start(); };
  const mm = $('#mobile-menu'), mb = $('.menu-btn');
  const setMenu = open => {
    if (open === mm.classList.contains('is-open')) return;
    mm.classList.toggle('is-open', open); mm.setAttribute('aria-hidden', !open); mb.setAttribute('aria-expanded', open);
    lock(open);
    if (window.Motion) window.Motion.menu(mm, open);
    if (open) setTimeout(() => $('.menu-close').focus(), 50); else mb.focus();
  };
  mb.addEventListener('click', () => setMenu(true));
  $('.menu-close').addEventListener('click', () => setMenu(false));
  $$('.mm__nav a', mm).forEach(a => a.addEventListener('click', () => lock(false)));
  addEventListener('keydown', e => {
    if (!mm.classList.contains('is-open')) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') { // keep focus inside the open menu
      const f = $$('a, button', mm), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // header hide on scroll down
  let lastY = 0; const hdr = $('.site-header');
  addEventListener('scroll', () => { const y = scrollY; hdr.classList.toggle('is-hidden', y > lastY && y > 240 && !mm.classList.contains('is-open')); hdr.classList.toggle('is-scrolled', y > 40); lastY = y; }, { passive: true });

  // toast
  const toast = msg => { const t = $('.toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2600); };

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  const observe = root => { const els = $$('.reveal, .reveal-img, .plan', root || document); if (M) M.reveal(els); else els.forEach(el => io.observe(el)); };

  // simple forms (newsletter, contact, enquiry)
  document.addEventListener('submit', e => {
    const f = e.target; e.preventDefault();
    if (f.id === 'hero-search') return;
    let ok = true;
    $$('[required]', f).forEach(inp => {
      const bad = inp.type === 'checkbox' ? !inp.checked : !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
      inp.setAttribute('aria-invalid', bad); const err = f.querySelector(`[data-err="${inp.name}"]`); if (err) err.textContent = bad ? (inp.dataset.msg || 'Please fill this in') : '';
      if (bad && ok) { inp.focus(); ok = false; }
    });
    if (!ok) return;
    if (f.classList.contains('form')) {
      const done = () => { f.classList.add('is-sent'); f.querySelector('.form-success').focus(); };
      if (window.SITE_URLS && window.SITE_URLS.ajax) {
        const fd = new FormData(f); fd.append('action', 'linden_enquiry'); fd.append('nonce', window.SITE_URLS.nonce); fd.append('page', location.href);
        fetch(window.SITE_URLS.ajax, { method: 'POST', body: fd, credentials: 'same-origin' }).then(r => r.json()).then(r => r.success ? done() : toast('Sorry, please try again or call us.')).catch(() => toast('Sorry, please try again or call us.'));
      } else done();
    }
    else {
      if (window.SITE_URLS && window.SITE_URLS.ajax) { const fd = new FormData(f); fd.append('action', 'linden_enquiry'); fd.append('nonce', window.SITE_URLS.nonce); fd.append('kind', 'newsletter'); fetch(window.SITE_URLS.ajax, { method: 'POST', body: fd, credentials: 'same-origin' }); }
      toast(f.dataset.toast || 'Sent'); f.reset();
    }
  });

  // ---------- property card ----------
  const statusCls = s => 'badge--' + s.toLowerCase();
  const subtitle = p => p.type === 'Office' || p.type === 'Retail' ? `${p.type === 'Office' ? 'Business' : 'Retail'} · Wing ${p.wing}` : `Residences · Wing ${p.wing}`;
  const name = p => `${p.title} · ${p.id.toUpperCase()}`;
  const card = p => `
    <article class="card reveal ${p.status === 'Sold' ? 'is-sold' : ''}">
      <div class="card__media"><img src="${imgSrc(p.images[0], 900)}" alt="${esc(p.title)} interior" loading="lazy" width="900" height="590"></div>
      <div class="card__top"><span class="badge ${statusCls(p.status)}">${p.status}</span>
        <button class="icon-btn fav" type="button" data-id="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Save ${esc(name(p))}">${icon('heart')}</button></div>
      <div class="card__body">
        <span class="eyebrow">${subtitle(p)}</span>
        <h3 class="card__title"><a href="${url('property', 'id=' + encodeURIComponent(p.id))}">${esc(name(p))}</a></h3>
        <p class="card__loc">${icon('pin')} ${B.address}</p>
        <div class="facts">${p.beds ? `<span>${icon('bed')}${p.beds} bed${p.beds > 1 ? 's' : ''}</span>` : p.type === 'Apartment' ? `<span>${icon('bed')}Studio</span>` : ''}<span>${icon('bath')}${p.baths} bath${p.baths > 1 ? 's' : ''}</span><span>${icon('area')}${p.area} m²</span><span>${icon('floor')}${p.floor ? 'Floor ' + p.floor : 'Ground'}</span></div>
        <div class="card__price"><span class="price">${p.status === 'Sold' ? 'Sold' : eur(p.price)}</span><small>€${Math.round(p.price / p.area).toLocaleString('en-US')} / m²</small></div>
      </div>
    </article>`;
  window.renderCards = (el, list) => { el.innerHTML = list.map(card).join(''); observe(el); };
  document.addEventListener('click', e => {
    const b = e.target.closest('.fav'); if (!b) return;
    e.preventDefault(); const id = b.dataset.id;
    favs.has(id) ? favs.delete(id) : favs.add(id); saveFavs();
    $$(`.fav[data-id="${id}"]`).forEach(x => x.setAttribute('aria-pressed', favs.has(id)));
    toast(favs.has(id) ? 'Saved to your favourites' : 'Removed from favourites');
    if (page === 'properties' && window.__refilter) window.__refilter();
  });

  // tabs
  $$('[role="tablist"]').forEach(tl => {
    const tabs = $$('[role="tab"]', tl);
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => { tabs.forEach(x => { x.setAttribute('aria-selected', x === t); x.tabIndex = x === t ? 0 : -1; $('#' + x.getAttribute('aria-controls')).hidden = x !== t; }); });
      t.addEventListener('keydown', e => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.click(); n.focus(); } });
    });
  });

  // shared blocks
  window.placesHTML = (list) => list.map(([ic, n, c, t, m]) => `<div class="place"><span class="place__icon">${icon(ic)}</span><div><b>${n}</b><span class="muted">${c}</span></div><div class="place__time"><b>${t}</b><div class="muted">${m}</div></div></div>`).join('');
  window.planHTML = (price) => `<div class="plan">${window.PAYMENT.map(([pc, l]) => `<div class="plan__step"><b>${pc}%</b><div class="plan__bar"><span></span></div><span>${l}</span>${price ? `<span class="plan__amt">${eur(Math.round(price * pc / 100))}</span>` : ''}</div>`).join('')}</div>`;
  $$('[data-places]').forEach(el => { el.innerHTML = window.placesHTML(window.PLACES); });
  $$('[data-plan]').forEach(el => { el.innerHTML = window.planHTML(); });
  $$('[data-img]').forEach(img => { const [k, w] = img.dataset.img.split(':'); img.src = IMG[k](+w || 1600); });
  $$('[data-icon]').forEach(el => { el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)); });

  // ---------- page: home ----------
  if (page === 'home') {
    renderCards($('#featured'), PROPS.filter(p => p.status !== 'Sold' && p.type !== 'Office' && p.type !== 'Retail').slice(0, 3));
    $('#hero-search').addEventListener('submit', e => {
      e.preventDefault(); const q = new URLSearchParams();
      for (const [k, v] of new FormData(e.target)) if (v) q.set(k, v);
      location.href = url('properties', q.toString());
    }, true);
    $$('#types [data-from]').forEach(el => {
      const b = +el.dataset.beds, list = PROPS.filter(p => p.type !== 'Office' && p.type !== 'Retail' && (b === 4 ? p.beds >= 4 : p.beds === b));
      el.querySelector('.h4').textContent = list.length ? 'from ' + eur(Math.min(...list.map(p => p.price))) : 'Coming soon';
      el.querySelector('.muted').textContent = list.length ? `${Math.min(...list.map(p => p.area))}–${Math.max(...list.map(p => p.area))} m² · ${list.filter(p => p.status !== 'Sold').length} available` : '';
    });
  }

  // ---------- page: properties ----------
  if (page === 'properties') {
    const params = new URLSearchParams(location.search);
    const st = {
      type: params.get('type') || '', beds: params.get('beds') || '', min: +params.get('min') || 0, max: +params.get('max') || 0,
      size: +params.get('size') || 0, wing: params.get('wing') || '', parking: params.get('parking') === '1', park: params.get('park') === '1',
      hideSold: params.get('sold') !== '1', fav: params.get('fav') === '1', sort: params.get('sort') || 'recommended', view: params.get('view') || 'grid',
    };
    const grid = $('#results'), count = $('#count'), active = $('#active');
    const sync = () => {
      const q = new URLSearchParams();
      if (st.type) q.set('type', st.type); if (st.beds) q.set('beds', st.beds); if (st.min) q.set('min', st.min); if (st.max) q.set('max', st.max);
      if (st.size) q.set('size', st.size); if (st.wing) q.set('wing', st.wing); if (st.parking) q.set('parking', 1); if (st.park) q.set('park', 1);
      if (!st.hideSold) q.set('sold', 1); if (st.fav) q.set('fav', 1); if (st.sort !== 'recommended') q.set('sort', st.sort); if (st.view !== 'grid') q.set('view', st.view);
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    };
    const ui = () => {
      $$('[data-f="type"]').forEach(c => c.setAttribute('aria-pressed', c.dataset.v === st.type));
      $$('[data-f="beds"]').forEach(c => c.setAttribute('aria-pressed', c.dataset.v === st.beds));
      $('#f-min').value = st.min || ''; $('#f-max').value = st.max || ''; $('#f-size').value = st.size || ''; $('#f-wing').value = st.wing;
      $('#f-parking').checked = st.parking; $('#f-park').checked = st.park; $('#f-sold').checked = st.hideSold; $('#sort').value = st.sort;
      $$('.view-toggle button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === st.view));
    };
    const run = () => {
      let list = PROPS.filter(p =>
        (!st.type || p.type === st.type) && (!st.beds || (st.beds === '4' ? p.beds >= 4 : p.beds === +st.beds)) &&
        (!st.min || p.price >= st.min) && (!st.max || p.price <= st.max) && (!st.size || p.area >= st.size) && (!st.wing || p.wing === st.wing) &&
        (!st.parking || p.parking) && (!st.park || p.view === 'Park') && (!st.hideSold || p.status !== 'Sold') && (!st.fav || favs.has(p.id)));
      const s = { 'price-asc': (a, b) => a.price - b.price, 'price-desc': (a, b) => b.price - a.price, 'size': (a, b) => b.area - a.area, 'ppm': (a, b) => a.price / a.area - b.price / b.area, 'floor': (a, b) => b.floor - a.floor }[st.sort];
      if (s) list = list.slice().sort(s);
      count.textContent = `${list.length} ${list.length === 1 ? 'property' : 'properties'}`;
      $('#apply-count').textContent = list.length;
      grid.className = 'cards ' + (st.view === 'list' ? 'cards--list' : '');
      if (list.length) renderCards(grid, list);
      else grid.innerHTML = `<div class="empty"><h3 class="h4">${st.fav ? 'No saved properties yet' : 'No properties match these filters'}</h3><p class="muted" style="margin:8px 0 20px">${st.fav ? 'Tap the heart on any property to save it here.' : 'Try removing a filter to see more homes.'}</p><button class="btn btn--outline btn--sm" type="button" data-clear>Clear all filters</button></div>`;
      const tags = [];
      if (st.type) tags.push(['type', st.type]); if (st.beds) tags.push(['beds', st.beds === '0' ? 'Studio' : st.beds === '4' ? '4+ beds' : st.beds + ' bed']);
      if (st.min) tags.push(['min', 'From ' + eur(st.min)]); if (st.max) tags.push(['max', 'Up to ' + eur(st.max)]); if (st.size) tags.push(['size', st.size + '+ m²']);
      if (st.wing) tags.push(['wing', 'Wing ' + st.wing]); if (st.parking) tags.push(['parking', 'Parking']); if (st.park) tags.push(['park', 'Park view']); if (st.fav) tags.push(['fav', 'Saved']);
      active.innerHTML = tags.map(([k, l]) => `<button class="chip" aria-pressed="true" data-remove="${k}" type="button">${l} ${icon('close')}</button>`).join('') + (tags.length ? '<button class="text-link" type="button" data-clear>Clear all</button>' : '');
      sync();
    };
    window.__refilter = run;
    const reset = () => Object.assign(st, { type: '', beds: '', min: 0, max: 0, size: 0, wing: '', parking: false, park: false, fav: false });
    document.addEventListener('click', e => {
      const c = e.target.closest('[data-f]'); if (c) { st[c.dataset.f] = st[c.dataset.f] === c.dataset.v ? '' : c.dataset.v; ui(); run(); }
      const r = e.target.closest('[data-remove]'); if (r) { const k = r.dataset.remove; st[k] = typeof st[k] === 'boolean' ? false : typeof st[k] === 'number' ? 0 : ''; ui(); run(); }
      if (e.target.closest('[data-clear]')) { reset(); ui(); run(); }
      const v = e.target.closest('.view-toggle button'); if (v) { st.view = v.dataset.view; ui(); run(); }
    });
    $('#f-min').addEventListener('change', e => { st.min = +e.target.value; run(); });
    $('#f-max').addEventListener('change', e => { st.max = +e.target.value; run(); });
    $('#f-size').addEventListener('change', e => { st.size = +e.target.value; run(); });
    $('#f-wing').addEventListener('change', e => { st.wing = e.target.value; run(); });
    $('#f-parking').addEventListener('change', e => { st.parking = e.target.checked; run(); });
    $('#f-park').addEventListener('change', e => { st.park = e.target.checked; run(); });
    $('#f-sold').addEventListener('change', e => { st.hideSold = e.target.checked; run(); });
    $('#sort').addEventListener('change', e => { st.sort = e.target.value; run(); });
    // mobile filter sheet
    const sheet = $('.filters'), bd = $('.backdrop');
    const setSheet = o => { sheet.classList.toggle('is-open', o); bd.classList.toggle('is-open', o); lock(o); };
    $('.filters-toggle').addEventListener('click', () => setSheet(true));
    $$('[data-close-sheet]').forEach(b => b.addEventListener('click', () => setSheet(false)));
    bd.addEventListener('click', () => setSheet(false));
    if (st.fav) $('#list-title').textContent = 'Saved properties';
    ui(); run();
  }

  // ---------- page: property ----------
  if (page === 'property') {
    const p = PROPS.find(x => x.id === new URLSearchParams(location.search).get('id')) || PROPS[0];
    document.title = `${name(p)} | ${B.name}`;
    $('#crumb').textContent = name(p);
    $('#p-eyebrow').textContent = subtitle(p);
    $('#p-title').innerHTML = `${esc(p.title)} · <span class="nowrap">${p.id.toUpperCase()}</span>`;
    $('#p-status').className = 'badge ' + statusCls(p.status); $('#p-status').textContent = p.status;
    $('#p-price').textContent = p.status === 'Sold' ? 'Sold' : eur(p.price);
    $('#p-ppm').textContent = `€${Math.round(p.price / p.area).toLocaleString('en-US')} per m² · VAT included`;
    $('#bar-price').textContent = $('#p-price').textContent; $('#bar-name').textContent = name(p);
    const main = $('#g-main');
    const show = (k, btn) => { main.src = imgSrc(k, 1600); main.alt = `${p.title} — photo`; $$('.gallery__thumbs button').forEach(b => b.setAttribute('aria-current', b === btn)); };
    $('#g-thumbs').innerHTML = p.images.map((k, i) => `<button type="button" aria-label="Show photo ${i + 1}" aria-current="${i === 0}"><img src="${imgSrc(k, 400)}" alt="" loading="lazy"></button>`).join('');
    $$('#g-thumbs button').forEach((b, i) => b.addEventListener('click', () => show(p.images[i], b)));
    show(p.images[0], $('#g-thumbs button'));
    $('#g-badge').className = 'badge ' + statusCls(p.status); $('#g-badge').textContent = p.status;
    const kf = [['bed', p.beds || (p.type === 'Apartment' ? 'Studio' : '—'), 'Bedrooms'], ['bath', p.baths, 'Bathrooms'], ['area', p.area + ' m²', 'Net area'], ['tree', p.outdoor ? p.outdoor + ' m²' : '—', 'Terrace / balcony'], ['floor', p.floor ? `${p.floor} of 14` : 'Ground', 'Floor'], ['sun', p.orient, 'Orientation'], ['parking', p.parking ? 'Included' : 'Optional', 'Parking'], ['pin', 'Wing ' + p.wing, 'Building'], ['check', p.view + ' view', 'View']];
    $('#keyfacts').innerHTML = kf.map(([ic, v, l]) => `<div class="keyfact"><i>${icon(ic)}</i><div><b>${v}</b><small>${l}</small></div></div>`).join('');
    $('#p-plan').innerHTML = window.planHTML(p.price);
    $('#e-unit').value = name(p);
    // mortgage calculator
    const dep = $('#c-dep'), yrs = $('#c-yrs'), out = $('#c-out'), rate = 0.045;
    const calc = () => { const loan = p.price * (1 - dep.value / 100), n = yrs.value * 12, r = rate / 12; const m = loan * r / (1 - Math.pow(1 + r, -n)); out.textContent = eur(Math.round(m)) + ' / month'; $('#c-dep-v').textContent = dep.value + '%'; $('#c-yrs-v').textContent = yrs.value + ' years'; };
    dep.addEventListener('input', calc); yrs.addEventListener('input', calc); calc();
    const sim = PROPS.filter(x => x.id !== p.id && x.status !== 'Sold').sort((a, b) => (a.type === p.type ? 0 : 1) - (b.type === p.type ? 0 : 1) || Math.abs(a.price - p.price) - Math.abs(b.price - p.price)).slice(0, 3);
    renderCards($('#similar'), sim);
    $('#fav-main').dataset.id = p.id; $('#fav-main').setAttribute('aria-pressed', favs.has(p.id));
    document.body.classList.add('has-sticky-bar');
  }

  observe();
  if (M) M.start();
  document.dispatchEvent(new CustomEvent('site:ready'));
})();
