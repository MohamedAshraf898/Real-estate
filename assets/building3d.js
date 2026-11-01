// Home page 3D teaser (Three.js): the shared building model from world3d.js. Hover a home to see it,
// click to open it in the full 3D Experience page. Scroll flies the camera around the building.
import * as THREE from 'three';
import { makeUnits, buildWorld } from './world3d.js';

const stage = document.querySelector('.b3d__stage');
if (stage) init().catch(err => { console.warn('3D disabled:', err); stage.classList.add('is-fallback'); });

async function init() {
  const canvas = stage.querySelector('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) throw new Error('WebGL not available');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let needs = true;
  const tip = document.querySelector('.b3d__tip');
  const hourInput = document.querySelector('#b3d-hour'), hourOut = document.querySelector('#b3d-hour-out');
  const go = q => (window.siteUrl ? window.siteUrl('explore', q) : 'explore.html' + (q ? '?' + q : ''));

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const units = makeUnits(window.PROPERTIES || []);
  const world = buildWorld(units, { renderer, mobile: innerWidth < 700 });
  const { scene, M, meshes, wingGroups } = world;
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 1400);
  const target = new THREE.Vector3(0, 7, 0);
  const baseMat = u => (u.kind === 'Retail' ? M.shop : M.glass);

  // ---- time of day ----
  function setHour(h) {
    world.setHour(h);
    if (hourOut) hourOut.textContent = `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;
    needs = true;
  }

  // ---- camera path (scroll + pointer) ----
  const cam = { angle: -0.55, radius: 112, height: 52 }, look = { x: 0, y: 7, z: 0 };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function placeCamera() {
    const a = cam.angle + pointer.x * 0.06;
    camera.position.set(Math.sin(a) * cam.radius, cam.height + pointer.y * 3, Math.cos(a) * cam.radius);
    target.set(look.x, look.y, look.z); camera.lookAt(target);
  }
  const ST = window.ScrollTrigger, gsap = window.gsap;
  const section = stage.closest('.b3d');
  if (gsap && ST && !reduce) {
    gsap.from(section.querySelector('.b3d__panel'), { y: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: section, start: 'top 70%', once: true } });
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', () => {
      gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: '+=160%', pin: true, scrub: 1, refreshPriority: 1, onUpdate: () => { needs = true; } } })
        .to(cam, { angle: 0.75, radius: 82, height: 34, ease: 'none' }, 0)
        .to(look, { y: 9, ease: 'none' }, 0);
    });
    mm.add('(max-width: 899px)', () => {
      gsap.to(cam, { angle: 0.6, ease: 'none', scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1, onUpdate: () => { needs = true; } } });
    });
    // this pin is created after the page's other ScrollTriggers, so re-sort and recalculate them all
    ST.sort(); ST.refresh();
  }

  // ---- hover / click units ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null, focusWing = null;
  const paint = m => { const u = m.userData.unit; m.material = m === hovered ? M.uHover : focusWing === u.wing ? M.wing : baseMat(u); };
  function setHover(m) {
    if (hovered === m) return;
    const prev = hovered; hovered = m;
    if (prev) paint(prev);
    if (m) {
      paint(m);
      const u = m.userData.unit;
      const what = u.kind === 'Residence' ? (u.beds ? `${u.beds} bedroom${u.beds > 1 ? 's' : ''}` : 'Studio') : u.kind;
      tip.innerHTML = `<b>${u.code} · ${what}</b><span>${u.status === 'Sold' ? 'Sold' : `${u.status} · ${u.area} m²`}</span><small>Click to explore in 3D</small>`;
      tip.hidden = false; canvas.style.cursor = 'pointer';
    } else { tip.hidden = true; canvas.style.cursor = ''; }
    needs = true;
  }
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.tx = ndc.x; pointer.ty = ndc.y;
    if (e.pointerType !== 'mouse') return;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(meshes, false)[0];
    setHover(hit ? hit.object : null);
    tip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`;
  });
  canvas.addEventListener('pointerleave', () => { setHover(null); pointer.tx = pointer.ty = 0; });
  canvas.addEventListener('click', e => {
    if (!hovered && e.pointerType !== 'mouse') { // touch: pick what was tapped
      const r = canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      if (hit) location.href = go('unit=' + hit.object.userData.unit.id);
      return;
    }
    if (hovered) location.href = go('unit=' + hovered.userData.unit.id);
  });

  // wing chips: highlight a wing
  document.querySelectorAll('[data-wing]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.wing; focusWing = focusWing === id ? null : id;
    document.querySelectorAll('[data-wing]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wing === focusWing));
    meshes.forEach(paint);
    const link = document.querySelector('#b3d-link');
    if (link) { link.href = go(focusWing ? 'mode=residence&wing=' + focusWing : ''); link.lastChild.textContent = focusWing ? ` Explore wing ${focusWing} in 3D` : ' Open the 3D experience'; }
    if (gsap) { const g = wingGroups[id]; gsap.to(look, { x: focusWing ? g.position.x * 0.6 : 0, z: focusWing ? g.position.z * 0.6 : 0, duration: 1.2, ease: 'power3.inOut', onUpdate: () => { needs = true; } }); }
    needs = true;
  }));
  if (hourInput) { hourInput.addEventListener('input', () => setHour(+hourInput.value)); setHour(+hourInput.value); } else setHour(10);

  // ---- render loop (only while visible) ----
  let visible = false, last = performance.now();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(stage);
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.fov = w < 700 ? 46 : 32; camera.updateProjectionMatrix(); needs = true;
  }
  new ResizeObserver(resize).observe(stage); resize();
  function loop(now) {
    if (!visible) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!reduce) {
      pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
      world.update(dt, now);
      if (!(gsap && ST)) cam.angle += dt * 0.05;
      needs = true;
    }
    if (needs) { placeCamera(); renderer.render(scene, camera); needs = false; }
    requestAnimationFrame(loop);
  }
  stage.classList.add('is-ready');
}
