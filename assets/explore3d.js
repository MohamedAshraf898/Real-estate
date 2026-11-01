// 3D Experience page: orbit the building, switch to residences or business space, filter units,
// hover to preview and click for the unit card. View angles on the mini-map, time of day on the dock.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { WINGS, makeUnits, buildWorld, rooms, unitFrame } from './world3d.js';

const root = document.querySelector('.x');
if (root) init().catch(err => { console.warn('3D disabled:', err); root.classList.add('is-fallback'); });

async function init() {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const canvas = $('.x__stage canvas'), stage = $('.x__stage'), tip = $('.x__tip');
  if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) throw new Error('WebGL not available');
  const small = () => innerWidth < 900;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  const link = (k, q) => (window.siteUrl ? window.siteUrl(k, q) : `${k}.html${q ? '?' + q : ''}`);
  const eur = n => '€ ' + n.toLocaleString('en-US');
  const m2 = n => `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} m²`;

  // ---------- scene ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.5 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const units = makeUnits(window.PROPERTIES || []);
  const world = buildWorld(units, { renderer, mobile: small(), fogNear: 230, fogFar: 560 });
  const { scene, M, meshes } = world;
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1600);
  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 36, maxDistance: 220, minPolarAngle: 0.3, maxPolarAngle: 1.38, rotateSpeed: 0.55, zoomSpeed: 0.8 });
  const HOME = { az: 0.62, polar: 1.1, dist: 132, target: new THREE.Vector3(0, 8, 2) };
  controls.target.copy(HOME.target);
  camera.position.setFromSphericalCoords(230, 0.9, 1.25).add(controls.target);
  controls.update();

  // camera moves: tween azimuth / polar / distance / target, the shortest way round
  const tmp = new THREE.Vector3(), sph = new THREE.Spherical();
  let flying = null;
  function flyTo({ az, polar, dist, target }, dur = 1.4) {
    sph.setFromVector3(tmp.copy(camera.position).sub(controls.target));
    const o = { az: sph.theta, polar: sph.phi, dist: sph.radius, tx: controls.target.x, ty: controls.target.y, tz: controls.target.z };
    let toAz = az ?? o.az;
    while (toAz - o.az > Math.PI) toAz -= Math.PI * 2;
    while (toAz - o.az < -Math.PI) toAz += Math.PI * 2;
    const to = { az: toAz, polar: polar ?? o.polar, dist: dist ?? o.dist, tx: target ? target.x : o.tx, ty: target ? target.y : o.ty, tz: target ? target.z : o.tz };
    const apply = () => { controls.target.set(o.tx, o.ty, o.tz); camera.position.setFromSphericalCoords(o.dist, o.polar, o.az).add(controls.target); };
    if (flying) flying.kill();
    if (!gsap || reduce) { Object.assign(o, to); apply(); return; }
    flying = gsap.to(o, { ...to, duration: dur, ease: 'power3.inOut', onUpdate: apply, onComplete: () => { flying = null; } });
  }
  controls.addEventListener('start', () => { if (flying) { flying.kill(); flying = null; } closeModeList(); });
  const resetView = () => flyTo({ az: HOME.az, polar: HOME.polar, dist: small() ? 175 : HOME.dist, target: HOME.target });
  const rotateBy = n => { sph.setFromVector3(tmp.copy(camera.position).sub(controls.target)); flyTo({ az: Math.round(sph.theta / (Math.PI / 6)) * (Math.PI / 6) + n * (Math.PI / 6) }, 0.9); };

  // ---------- state & filters ----------
  let mode = 'overview', hovered = null, selected = null;
  const F = { beds: 'all', type: 'all', area: [0, 0], floor: [0, 0], feat: new Set() };
  const R = { area: [0, 0], floor: [0, 0] };
  const group = u => (u.kind === 'Residence' ? 'Residence' : 'Business');
  const avail = u => u.status === 'Available' || u.status === 'New';
  function match(u) {
    if (mode === 'overview' || group(u) !== mode) return false;
    if (mode === 'Residence' && F.beds !== 'all' && (F.beds === 4 ? u.beds < 4 : u.beds !== F.beds)) return false;
    if (mode === 'Business' && F.type !== 'all' && u.kind !== F.type) return false;
    if (u.area < F.area[0] || u.area > F.area[1] || u.floor < F.floor[0] || u.floor > F.floor[1]) return false;
    const wings = [...F.feat].filter(f => f.startsWith('wing')).map(f => f.slice(4));
    if (wings.length && !wings.includes(u.wing)) return false;
    if (F.feat.has('available') && !avail(u)) return false;
    if (F.feat.has('garden') && !u.garden) return false;
    if (F.feat.has('terrace') && !u.terrace) return false;
    if (F.feat.has('corner') && !u.corner) return false;
    return true;
  }
  const filtering = () => F.beds !== 'all' || F.type !== 'all' || F.feat.size > 0 || F.area[0] > R.area[0] || F.area[1] < R.area[1] || F.floor[0] > R.floor[0] || F.floor[1] < R.floor[1];

  const pickable = [];
  let results = [];
  function paint() {
    pickable.length = 0; results = [];
    const active = filtering();
    for (const m of meshes) {
      const u = m.userData.unit; let mat;
      if (mode === 'overview') { mat = u.kind === 'Retail' ? M.shop : M.glass; pickable.push(m); }
      else if (!match(u)) mat = M.uDim;
      else { results.push(u); pickable.push(m); mat = u.status === 'Sold' ? M.uSold : active ? M.uMatch : M.uGhost; }
      if (u === selected) mat = M.uSel; else if (m === hovered) mat = M.uHover;
      m.material = mat;
    }
    results.sort((a, b) => a.wing.localeCompare(b.wing) || b.floor - a.floor || a.num - b.num);
    const n = results.length;
    $('#xf-count').textContent = `${n} result${n === 1 ? '' : 's'}`;
    const badge = $('.x-filters-btn .x-badge');
    badge.hidden = mode === 'overview'; badge.textContent = n;
  }

  // dual-handle ranges
  function setupRange(key, fmt) {
    const box = $('#xf-' + key), lo = $('.lo', box), hi = $('.hi', box), out = $(`#xf-${key}-out`);
    const sync = () => {
      let a = +lo.value, b = +hi.value; if (a > b) [a, b] = [b, a];
      F[key] = [a, b];
      const span = Math.max(1, R[key][1] - R[key][0]);
      box.style.setProperty('--lo', ((a - R[key][0]) / span) * 100 + '%'); box.style.setProperty('--hi', ((b - R[key][0]) / span) * 100 + '%');
      out.textContent = fmt(a, b);
    };
    [lo, hi].forEach(i => i.addEventListener('input', () => { sync(); paint(); }));
    return (min, max) => { R[key] = [min, max]; [lo, hi].forEach(i => { i.min = min; i.max = max; i.step = 1; }); lo.value = min; hi.value = max; sync(); };
  }
  const floorName = f => (f ? String(f) : 'G');
  const setArea = setupRange('area', (a, b) => `${a}–${b} m²`);
  const setFloor = setupRange('floor', (a, b) => (a === b ? `Floor ${floorName(a)}` : `${floorName(a)}–${floorName(b)}`));

  $$('[data-single]').forEach(g => g.addEventListener('click', e => {
    const b = e.target.closest('.x-chip'); if (!b) return;
    $$('.x-chip', g).forEach(c => c.setAttribute('aria-pressed', c === b));
    F[g.dataset.single] = b.dataset.v === 'all' ? 'all' : g.dataset.single === 'beds' ? +b.dataset.v : b.dataset.v;
    paint();
  }));
  $('[data-multi]').addEventListener('click', e => {
    const b = e.target.closest('.x-chip'); if (!b) return;
    const on = b.getAttribute('aria-pressed') !== 'true';
    b.setAttribute('aria-pressed', on); on ? F.feat.add(b.dataset.v) : F.feat.delete(b.dataset.v);
    paint();
  });
  function resetFilters() {
    F.beds = F.type = 'all'; F.feat.clear();
    $$('.x-chip').forEach(c => c.setAttribute('aria-pressed', c.dataset.v === 'all'));
    const list = units.filter(u => mode !== 'overview' && group(u) === mode);
    if (list.length) {
      setArea(Math.min(...list.map(u => u.area)), Math.max(...list.map(u => u.area)));
      setFloor(Math.min(...list.map(u => u.floor)), Math.max(...list.map(u => u.floor)));
    }
    paint();
  }
  $('.x-reset-filters').addEventListener('click', resetFilters);

  // ---------- mode (Residences / Business / building view) ----------
  const modeBtn = $('.x-mode__btn'), modeList = $('#x-mode-list'), filtersBtn = $('.x-filters-btn');
  const fins = { v: 1 };
  function closeModeList() { modeList.hidden = true; modeBtn.setAttribute('aria-expanded', 'false'); }
  modeBtn.addEventListener('click', () => { const open = modeList.hidden; modeList.hidden = !open; modeBtn.setAttribute('aria-expanded', open); if (open) ($('[aria-selected="true"]', modeList) || $('button', modeList)).focus(); });
  modeList.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b) { setMode(b.dataset.mode); closeModeList(); modeBtn.focus(); } });
  document.addEventListener('pointerdown', e => { if (!e.target.closest('.x-mode')) closeModeList(); });
  function setMode(m, opts = {}) {
    if (m === mode && !opts.force) return;
    mode = m; hovered = null; root.dataset.mode = m;
    $('#x-mode-label').textContent = m === 'Residence' ? 'Residences' : m === 'Business' ? 'Business' : 'Properties';
    $$('[data-mode]', modeList).forEach(b => b.setAttribute('aria-selected', b.dataset.mode === m));
    filtersBtn.disabled = m === 'overview';
    $$('[data-for]').forEach(el => { el.hidden = el.dataset.for !== m; });
    $$('[data-only]').forEach(el => { el.hidden = m !== 'overview' && el.dataset.only !== m; });
    const to = m === 'overview' ? 1 : 0.1;
    if (gsap && !reduce) gsap.to(fins, { v: to, duration: 0.8, ease: 'power2.inOut', onUpdate: () => world.setFins(fins.v) });
    else world.setFins(fins.v = to);
    if (m === 'overview') { closePanels(); selected = null; setUrl(); }
    else if (!opts.keepUrl) setUrl();
    // business space is on the lower floors, so look at it from closer to the ground
    if (!opts.keepUrl) flyTo(m === 'Business' ? { polar: 1.3, dist: small() ? 160 : 112, target: new THREE.Vector3(0, 3, 2) } : { polar: HOME.polar, dist: small() ? 175 : HOME.dist, target: HOME.target });
    resetFilters();
  }
  filtersBtn.addEventListener('click', () => openPanel($('#x-filters').classList.contains('is-open') ? null : 'filters'));

  // ---------- side panels ----------
  // while a panel is open, shift the picture so the model stays in the free space beside it (desktop) or above it (phone)
  const shift = { v: 0 };
  function applyView() {
    const w = stage.clientWidth, h = stage.clientHeight, d = shift.v * (small() ? h * 0.27 : Math.min(230, w * 0.16));
    if (d < 0.5) camera.clearViewOffset();
    else if (small()) camera.setViewOffset(w, h + 2 * d, 0, 2 * d, w, h);
    else camera.setViewOffset(w + 2 * d, h, 2 * d, 0, w, h);
    camera.updateProjectionMatrix();
  }
  function openPanel(which) {
    const to = which ? 1 : 0;
    if (gsap && !reduce) gsap.to(shift, { v: to, duration: 0.8, ease: 'power3.inOut', onUpdate: applyView });
    else { shift.v = to; applyView(); }
    $('#x-filters').classList.toggle('is-open', which === 'filters');
    $('#x-unit').classList.toggle('is-open', which === 'unit');
    filtersBtn.setAttribute('aria-expanded', which === 'filters');
    root.classList.toggle('has-panel', !!which);
  }
  function closePanels() { openPanel(null); }
  $$('.x-close').forEach(b => b.addEventListener('click', () => { if (b.closest('#x-unit')) select(null); else closePanels(); }));

  // ---------- unit card ----------
  function setUrl() {
    const q = selected ? 'unit=' + selected.id : mode !== 'overview' ? 'mode=' + mode.toLowerCase() : '';
    history.replaceState(null, '', location.pathname + (q ? '?' + q : ''));
  }
  const pos = new THREE.Vector3(), dir = new THREE.Vector3();
  function focus(u) {
    unitFrame(u, pos, dir);
    sph.setFromVector3(tmp.copy(camera.position).sub(controls.target));
    const camDir = tmp.set(Math.sin(sph.theta), 0, Math.cos(sph.theta));
    const az = dir.lengthSq() && camDir.dot(dir) < 0.35 ? Math.atan2(dir.x, dir.z) : undefined;
    flyTo({ az, polar: 1.3, dist: small() ? 110 : 92, target: pos.clone() });
  }
  function select(u, fly = true) {
    selected = u || null; setHover(null);
    if (u && group(u) !== mode) setMode(group(u), { keepUrl: true });
    paint(); setUrl();
    if (!u) { closePanels(); return; }
    $('#xu-kind').textContent = u.kind === 'Residence' ? (u.title === 'Penthouse' ? 'Penthouse' : 'Residence') : u.kind === 'Retail' ? 'Retail space' : 'Office space';
    $('#xu-code').textContent = u.code;
    const st = $('#xu-status'); st.className = 'badge badge--' + u.status.toLowerCase(); st.textContent = u.status;
    $('#xu-price').textContent = u.status === 'Sold' ? '' : eur(u.price);
    $('#xu-area').textContent = m2(u.area);
    const list = rooms(u);
    $('#xu-rooms').innerHTML = list.map(([n, a, out], i) => `<div class="${i > 3 ? 'is-extra' : ''}${out ? ' is-out' : ''}"><dt>${n}</dt><dd>${m2(a)}</dd></div>`).join('');
    const more = $('#xu-more'); more.hidden = list.length <= 4; more.setAttribute('aria-expanded', 'false'); more.textContent = 'More'; $('#xu-rooms').classList.remove('is-all');
    const facts = [['Wing', u.wing], ['Floor', u.floor ? u.floor : 'Ground'], ['Orientation', u.orient]];
    if (u.kind === 'Residence') facts.push(['Bedrooms', u.beds || 'Studio'], ['Bathrooms', u.baths]);
    if (u.garden || u.terrace || u.corner) facts.push(['Features', [u.garden && 'Garden', u.terrace && 'Terrace', u.corner && 'Corner'].filter(Boolean).join(' · ')]);
    $('#xu-facts').innerHTML = facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('#xu-request').href = link('contact', 'unit=' + encodeURIComponent(u.code));
    const det = $('#xu-details'); det.hidden = !u.prop; if (u.prop) det.href = link('property', 'id=' + u.prop);
    $('#xu-plan').src = window.IMG ? window.IMG.floorplan(900) : '';
    const i = results.indexOf(u);
    $('#xu-prev').disabled = $('#xu-next').disabled = results.length < 2 || i < 0;
    openPanel('unit');
    if (fly) focus(u);
  }
  $('#xu-more').addEventListener('click', e => { const on = $('#xu-rooms').classList.toggle('is-all'); e.currentTarget.setAttribute('aria-expanded', on); e.currentTarget.textContent = on ? 'Less' : 'More'; });
  const step = d => { const i = results.indexOf(selected); if (i > -1 && results.length) select(results[(i + d + results.length) % results.length]); };
  $('#xu-prev').addEventListener('click', () => step(-1));
  $('#xu-next').addEventListener('click', () => step(1));
  $('#xu-share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '?unit=' + selected.id, title = `${selected.code} — ${window.BRAND ? window.BRAND.name : ''}`;
    try {
      if (navigator.share && small()) await navigator.share({ title, url });
      else { await navigator.clipboard.writeText(url); if (window.toast) window.toast('Link copied'); }
    } catch (e) { /* share sheet closed */ }
  });

  // ---------- hover & pick ----------
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(pickable, false)[0];
    return hit ? hit.object : null;
  }
  function setHover(m, e) {
    if (m !== hovered) { hovered = m; paint(); root.classList.toggle('is-hovering', !!m); }
    if (!m) { tip.hidden = true; return; }
    if (!e) return;
    const u = m.userData.unit;
    const what = u.kind === 'Residence' ? (u.beds ? `${u.beds} bedroom${u.beds > 1 ? 's' : ''}` : 'Studio') : u.kind;
    tip.innerHTML = `<b>${u.code}</b><span>${what} · ${u.area} m²</span><small>${u.status === 'Sold' ? 'Sold' : `${u.status} · ${eur(u.price)}`}</small>`;
    tip.hidden = false;
    const r = stage.getBoundingClientRect();
    tip.style.transform = `translate(${Math.min(e.clientX - r.left + 18, r.width - 200)}px, ${e.clientY - r.top + 18}px)`;
  }
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !e.buttons) setHover(pick(e), e); else if (e.buttons) setHover(null); });
  canvas.addEventListener('pointerleave', () => setHover(null));
  canvas.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || performance.now() - down.t > 600) return;
    const m = pick(e);
    if (m) select(m.userData.unit);
    else if (selected) select(null);
    down = null;
  });

  // ---------- navigation mini-map ----------
  const plan = $('.x-nav__plan');
  const NS = 'http://www.w3.org/2000/svg';
  plan.innerHTML = `<rect x="-62" y="35.5" width="124" height="9" class="road"/><rect x="47.5" y="-46" width="9" height="96" class="road"/>
    <rect x="-39" y="-30" width="78" height="64" rx="3" class="plot"/><rect x="-15" y="-5" width="30" height="22" rx="2" class="lawn"/>
    ${WINGS.map(w => `<rect x="${-w.len / 2}" y="${-w.depth / 2}" width="${w.len}" height="${w.depth}" rx="1" class="wing" transform="translate(${w.x} ${w.z}) rotate(${(-w.rot * 180) / Math.PI})"/><text x="${w.x}" y="${w.z + 1.6}" class="wlabel">${w.id}</text>`).join('')}
    <g class="cam"><path d="M0 44 L-7 54 L7 54 Z"/><circle cx="0" cy="44" r="2.2"/></g>`;
  const camMark = $('.cam', plan);
  const mapBox = $('.x-nav__map');
  const dots = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6, b = document.createElement('button');
    b.type = 'button'; b.className = 'x-nav__dot'; b.setAttribute('aria-label', `View ${i + 1} of 12`); b.setAttribute('aria-pressed', 'false');
    b.style.left = 50 + 46 * Math.sin(a) + '%'; b.style.top = 50 + 44 * Math.cos(a) + '%';
    b.addEventListener('click', () => flyTo({ az: a }, 1.2));
    mapBox.appendChild(b); return b;
  });
  let lastAz = null, lastDot = -1;
  function syncMap() {
    sph.setFromVector3(tmp.copy(camera.position).sub(controls.target));
    if (lastAz !== null && Math.abs(sph.theta - lastAz) < 0.002) return;
    lastAz = sph.theta;
    camMark.setAttribute('transform', `rotate(${(-sph.theta * 180) / Math.PI})`);
    const idx = ((Math.round(sph.theta / (Math.PI / 6)) % 12) + 12) % 12;
    if (idx !== lastDot) { if (dots[lastDot]) dots[lastDot].setAttribute('aria-pressed', 'false'); dots[idx].setAttribute('aria-pressed', 'true'); lastDot = idx; }
  }
  $$('.x-reset').forEach(b => b.addEventListener('click', resetView));
  $$('[data-rot]').forEach(b => b.addEventListener('click', () => rotateBy(+b.dataset.rot)));

  // ---------- time of day ----------
  const hour = $('#x-hour'), hourOut = $('#x-hour-out');
  const setHour = h => {
    world.setHour(h);
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    hourOut.textContent = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'am' : 'pm'}`;
    hour.style.setProperty('--p', ((h - hour.min) / (hour.max - hour.min)) * 100 + '%');
  };
  hour.addEventListener('input', () => setHour(+hour.value));
  setHour(+hour.value);

  // ---------- keyboard ----------
  addEventListener('keydown', e => {
    if (e.target.closest('input, textarea, select') || $('#mobile-menu.is-open')) return;
    if (e.key === 'Escape') { if (!modeList.hidden) closeModeList(); else if (selected) select(null); else closePanels(); }
    if (e.key === 'ArrowLeft' && !e.target.closest('.x-panel')) rotateBy(-1);
    if (e.key === 'ArrowRight' && !e.target.closest('.x-panel')) rotateBy(1);
  });

  // ---------- size & loop ----------
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < 700 ? 44 : 30; applyView();
  }
  new ResizeObserver(resize).observe(stage); resize();
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) world.update(dt, now);
    controls.update(); syncMap(); world.cull(camera.position, controls.target);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- start: open from a link (?unit= / ?mode= / ?wing=) ----------
  const q = new URLSearchParams(location.search);
  const startUnit = q.get('unit') && world.byId.get(q.get('unit').toLowerCase());
  if (q.get('unit') && !startUnit) q.set('mode', 'residence');
  const startMode = { residence: 'Residence', residences: 'Residence', business: 'Business' }[(q.get('mode') || '').toLowerCase()];
  paint();
  renderer.render(scene, camera);
  root.classList.add('is-ready');
  if (startUnit) { flyTo({ az: HOME.az, polar: HOME.polar, dist: HOME.dist, target: HOME.target }, 0.01); select(startUnit); }
  else {
    resetView();
    if (startMode) {
      setMode(startMode);
      const wing = (q.get('wing') || '').toUpperCase();
      const chip = wing && $(`[data-multi] [data-v="wing${wing}"]`);
      if (chip) chip.click();
    }
  }
}
