// Interactive 3D building (Three.js). A stylised model built in code: three wings with tree-like facade fins,
// rooftop gardens, trees and a low-rise city around it. Hover a floor to see availability, click to browse.
import * as THREE from 'three';

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

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const sky = new THREE.Color('#EEF0E4');
  scene.background = sky.clone();
  scene.fog = new THREE.Fog(sky.clone(), 120, 260);
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 600);
  const target = new THREE.Vector3(0, 7, 0);

  // ---- lights ----
  const hemi = new THREE.HemisphereLight('#FDFBEF', '#7D8A6A', 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#FFF4D6', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 260 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  // ---- materials ----
  const M = {
    ground: new THREE.MeshStandardMaterial({ color: '#D9D2B6', roughness: 1 }),
    lawn: new THREE.MeshStandardMaterial({ color: '#9AA894', roughness: 1 }),
    path: new THREE.MeshStandardMaterial({ color: '#EDE6CF', roughness: 1 }),
    road: new THREE.MeshStandardMaterial({ color: '#5E6358', roughness: 0.9 }),
    slab: new THREE.MeshStandardMaterial({ color: '#F6F1E1', roughness: 0.75 }),
    glass: new THREE.MeshStandardMaterial({ color: '#56634F', roughness: 0.18, metalness: 0.35, emissive: '#FFC870', emissiveIntensity: 0 }),
    hover: new THREE.MeshStandardMaterial({ color: '#E7FD55', roughness: 0.4, emissive: '#C9DE3A', emissiveIntensity: 0.55 }),
    wing: new THREE.MeshStandardMaterial({ color: '#E7FD55', roughness: 0.4, emissive: '#B8CC30', emissiveIntensity: 0.3 }),
    fin: new THREE.MeshStandardMaterial({ color: '#F1EADA', roughness: 0.6 }),
    roof: new THREE.MeshStandardMaterial({ color: '#7F9270', roughness: 1 }),
    city: new THREE.MeshStandardMaterial({ color: '#E4DDC8', roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: '#7A6448', roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#6F8461', roughness: 0.9, flatShading: true }),
    car: new THREE.MeshStandardMaterial({ color: '#A68150', roughness: 0.5 }),
  };
  const box = (w, h, d, mat, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m; };

  // ---- ground, plot, roads ----
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(700, 700), M.ground); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  box(78, 0.2, 64, M.path, 0, 0.1, 2).castShadow = false;
  box(30, 0.25, 22, M.lawn, 0, 0.15, 6).castShadow = false;
  box(260, 0.12, 9, M.road, 0, 0.06, 40).castShadow = false;
  box(9, 0.12, 260, M.road, 52, 0.06, 0).castShadow = false;
  for (let i = -120; i < 120; i += 7) box(3, 0.14, 0.3, M.path, i, 0.08, 40).castShadow = false;

  const trunks = [], crowns = [];
  // ---- building wings ----
  const FLOOR_H = 1.25;
  const wings = [
    { id: 'A', floors: 14, len: 46, depth: 11, x: 0, z: -14, rot: 0 },
    { id: 'B', floors: 10, len: 30, depth: 10, x: 19, z: 6, rot: Math.PI / 2 },
    { id: 'V', floors: 8, len: 30, depth: 10, x: -19, z: 6, rot: Math.PI / 2 },
  ];
  const floorMeshes = [];
  const wingGroups = {};
  wings.forEach((w, wi) => {
    const g = new THREE.Group(); g.position.set(w.x, 0, w.z); g.rotation.y = w.rot; scene.add(g); wingGroups[w.id] = g;
    box(w.len + 1, 0.5, w.depth + 1, M.slab, 0, 0.25, 0, g);
    for (let f = 0; f < w.floors; f++) {
      const y = 0.5 + f * FLOOR_H;
      box(w.len + 1.2, 0.2, w.depth + 1.6, M.slab, 0, y + FLOOR_H - 0.1, 0, g);
      const glass = box(w.len - 0.6, FLOOR_H - 0.22, w.depth - 0.6, M.glass, 0, y + (FLOOR_H - 0.2) / 2, 0, g);
      glass.userData = { wing: w.id, floor: f + 1, avail: (f * 7 + wi * 3 + 2) % 5 };
      floorMeshes.push(glass);
    }
    const top = 0.5 + w.floors * FLOOR_H;
    box(w.len - 2, 0.6, w.depth - 2, M.roof, 0, top + 0.3, 0, g);
    // facade fins: tall slender blades, gently leaning like branches
    const H = top - 0.5, n = Math.floor(w.len / 1.7);
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, H, 0.7), M.fin, n * 2);
    fins.castShadow = fins.receiveShadow = true;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) for (let s = 0; s < 2; s++) {
      o.position.set(-w.len / 2 + 0.85 + i * 1.7, 0.5 + H / 2, (s ? 1 : -1) * (w.depth / 2 + 0.75));
      o.rotation.set(0, 0, Math.sin(i * 1.7 + wi) * 0.09);
      o.updateMatrix(); fins.setMatrixAt(i * 2 + s, o.matrix);
    }
    g.add(fins);
    // rooftop trees
    for (let t = 0; t < Math.floor(w.len / 7); t++) tree(g, -w.len / 2 + 4 + t * 7 + (t % 2), top + 0.6, (t % 2 ? 1.6 : -1.6), 0.55);
  });

  // ---- trees & city ----
  function tree(parent, x, y, z, s) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 6), M.trunk); tr.position.set(x, y + 0.8 * s, z); tr.castShadow = true; parent.add(tr); trunks.push(tr);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * s, 0), M.leaf); cr.position.set(x, y + 2.1 * s, z); cr.castShadow = true; cr.userData.ph = Math.random() * 6; parent.add(cr); crowns.push(cr);
  }
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 30 + rnd() * 26, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 + 6;
    if (Math.abs(z - 40) < 7 || Math.abs(x - 52) < 7) continue;
    tree(scene, x, 0, z, 0.9 + rnd() * 0.8);
  }
  for (let i = 0; i < 9; i++) tree(scene, -12 + i * 3, 0.25, 9 + (i % 2) * 3, 0.8);
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 75 + rnd() * 110, h = 4 + rnd() * rnd() * 34;
    box(8 + rnd() * 14, h, 8 + rnd() * 14, M.city, Math.cos(a) * r, h / 2, Math.sin(a) * r);
  }
  const cars = [];
  for (let i = 0; i < 8; i++) { const c = box(3.2, 1.2, 1.6, i % 3 ? M.city : M.car, -120 + i * 32, 0.7, 38 + (i % 2) * 4); c.userData.speed = (i % 2 ? -1 : 1) * (6 + rnd() * 4); cars.push(c); }

  // ---- time of day ----
  const C = (h) => new THREE.Color(h);
  const SKY = [[5, C('#2E3A26')], [7, C('#F2D3B0')], [10, C('#EEF0E4')], [16, C('#EEF0E4')], [19, C('#EBB98E')], [21, C('#2E3A26')]];
  function setHour(h) {
    let a = SKY[0], b = SKY[SKY.length - 1];
    for (let i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; }
    const t = (h - a[0]) / Math.max(0.001, b[0] - a[0]), col = a[1].clone().lerp(b[1], t);
    scene.background.copy(col); scene.fog.color.copy(col);
    const day = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI)); // 0 at 6h/20h, 1 at 13h
    const az = ((h - 6) / 14) * Math.PI;
    sun.position.set(Math.cos(az) * -110, 15 + day * 95, -40 + Math.sin(az) * 30);
    sun.intensity = 0.3 + day * 2.3;
    sun.color.set(day < 0.35 ? '#FFC58A' : '#FFF4D6');
    hemi.intensity = 0.35 + day * 0.6;
    const night = Math.min(1, Math.max(0, (0.25 - day) / 0.25));
    M.glass.emissiveIntensity = night * 0.9;
    renderer.toneMappingExposure = 0.9 + day * 0.2;
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

  // ---- hover / click floors ----
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let hovered = null, focusWing = null;
  function setHover(m) {
    if (hovered === m) return;
    if (hovered) hovered.material = focusWing === hovered.userData.wing ? M.wing : M.glass;
    hovered = m;
    if (m) {
      m.material = M.hover;
      const { wing, floor, avail } = m.userData;
      tip.innerHTML = `<b>Wing ${wing} · Floor ${floor}</b><span>${avail ? `${avail} home${avail > 1 ? 's' : ''} available` : 'Sold out'}</span><small>Click to view homes</small>`;
      tip.hidden = false; canvas.style.cursor = 'pointer';
    } else { tip.hidden = true; canvas.style.cursor = ''; }
    needs = true;
  }
  canvas.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    pointer.tx = ndc.x; pointer.ty = ndc.y;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(floorMeshes, false)[0];
    setHover(hit ? hit.object : null);
    tip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`;
  });
  canvas.addEventListener('pointerleave', () => { setHover(null); pointer.tx = pointer.ty = 0; });
  canvas.addEventListener('click', () => { if (hovered) location.href = `properties.html?wing=${hovered.userData.wing}`; });

  // wing chips: highlight a wing
  document.querySelectorAll('[data-wing]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.wing; focusWing = focusWing === id ? null : id;
    document.querySelectorAll('[data-wing]').forEach(b => b.setAttribute('aria-pressed', b.dataset.wing === focusWing));
    floorMeshes.forEach(m => { if (m !== hovered) m.material = m.userData.wing === focusWing ? M.wing : M.glass; });
    const link = document.querySelector('#b3d-link');
    if (link) { link.href = focusWing ? `properties.html?wing=${focusWing}` : 'properties.html'; link.lastChild.textContent = focusWing ? ` Homes in wing ${focusWing}` : ' Browse all homes'; }
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
      cars.forEach(c => { c.position.x += c.userData.speed * dt; if (c.position.x > 130) c.position.x = -130; if (c.position.x < -130) c.position.x = 130; });
      crowns.forEach(c => { c.rotation.z = Math.sin(now / 1400 + c.userData.ph) * 0.04; });
      if (!(gsap && ST)) cam.angle += dt * 0.05;
      needs = true;
    }
    if (needs) { placeCamera(); renderer.render(scene, camera); needs = false; }
    requestAnimationFrame(loop);
  }
  stage.classList.add('is-ready');
}
