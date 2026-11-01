// Shared 3D world for the home teaser and the 3D Experience page. Everything is built in code:
// three wings with branching facade fins, one mesh per apartment / office / shop, rooftop gardens,
// trees, cars, people and a low-rise city. Unit data is generated here and merged with window.PROPERTIES.
import * as THREE from 'three';

export const FLOOR_H = 1.25, GROUND_H = 1.9;
export const WINGS = [
  { id: 'A', floors: 14, len: 46, depth: 11, x: 0, z: -14, rot: 0, perSide: 5 },
  { id: 'B', floors: 12, len: 30, depth: 10, x: 19, z: 6, rot: Math.PI / 2, perSide: 4, offices: 2 },
  { id: 'V', floors: 10, len: 30, depth: 10, x: -19, z: 6, rot: Math.PI / 2, perSide: 4 },
];
const levelY = f => (f === 0 ? 0.5 : 0.5 + GROUND_H + (f - 1) * FLOOR_H);
const levelH = f => (f === 0 ? GROUND_H : FLOOR_H);
const pad = n => String(n).padStart(2, '0');
const TITLES = ['Studio', 'One Bedroom', 'Two Bedroom', 'Three Bedroom', 'Four Bedroom'];

// Compass side a wing face looks at (+z is the boulevard, south).
function facing(rot, side) {
  const x = Math.sin(rot) * side, z = Math.cos(rot) * side;
  return Math.abs(z) > Math.abs(x) ? (z > 0 ? 'South' : 'North') : (x > 0 ? 'East' : 'West');
}

// ---------- unit list: shops on the ground floor, offices low in wing B, homes above, penthouses on top of A ----------
export function makeUnits(props = []) {
  let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const units = [];
  for (const w of WINGS) {
    for (let f = 0; f <= w.floors; f++) {
      const add = (kind, num, x, z, len, dep, side, extra) => {
        const u = Object.assign({
          id: `${w.id.toLowerCase()}-${f ? pad(f) : 'g'}${pad(num)}`, code: `${w.id} ${f || 'G'}.${pad(num)}`, kind, wing: w.id, floor: f, num,
          box: { x, z, w: len, d: dep }, side, orient: side ? facing(w.rot, side) : 'Dual aspect', corner: false,
          beds: 0, baths: 1, area: 0, outdoor: 0, garden: false, terrace: false, title: '', prop: null,
        }, extra);
        units.push(u); return u;
      };
      if (f === 0) {
        const n = w.id === 'A' ? 4 : 2, L = w.len / n;
        for (let i = 0; i < n; i++) add('Retail', i + 1, -w.len / 2 + L * (i + 0.5), 0, L, w.depth, 0, { title: 'Retail unit', area: Math.round(L * w.depth * 0.9) });
        continue;
      }
      const office = f <= (w.offices || 0), pent = w.id === 'A' && f === w.floors;
      if (office || pent) {
        const L = w.len / 2;
        for (let i = 0; i < 2; i++) {
          const u = add(office ? 'Office' : 'Residence', i + 1, -w.len / 2 + L * (i + 0.5), 0, L, w.depth, 0, { corner: true });
          if (office) Object.assign(u, { title: 'Office suite', area: Math.round(L * w.depth * 0.92), baths: 2 });
          else Object.assign(u, { title: 'Penthouse', area: Math.round(L * w.depth * 0.56), beds: 4, baths: 3, outdoor: 40 + Math.round(rnd() * 12), terrace: true });
        }
        continue;
      }
      const wts = Array.from({ length: w.perSide }, (_, i) => (i === 0 || i === w.perSide - 1 ? 1.4 : 1));
      const sum = wts.reduce((a, b) => a + b);
      let num = 1;
      for (const side of [1, -1]) {
        let x0 = -w.len / 2;
        wts.forEach(wt => {
          const L = (w.len * wt) / sum, dep = w.depth / 2;
          const area = Math.round(Math.min(118, Math.max(29, L * dep * (0.85 + rnd() * 0.75))));
          const beds = area < 38 ? 0 : area < 56 ? 1 : area < 76 ? 2 : area < 100 ? 3 : 4;
          add('Residence', num++, x0 + L / 2, (side * dep) / 2, L, dep, side, {
            corner: wt > 1, area, beds, baths: beds >= 3 ? 2 : 1, title: TITLES[beds],
            garden: f === 1, terrace: f >= w.floors - 1, outdoor: f === 1 ? Math.round(area * 0.35) : Math.round(4 + rnd() * 8),
          });
          x0 += L;
        });
      }
    }
  }
  for (const u of units) {
    const r = rnd();
    u.status = r < 0.56 ? 'Available' : r < 0.7 ? 'Reserved' : 'Sold';
    const ppm = u.kind === 'Retail' ? 4100 : u.kind === 'Office' ? 3600 : 3650 + u.floor * 48 + (u.orient === 'South' ? 220 : 0) + (u.terrace ? 180 : 0);
    u.price = Math.round((u.area * ppm) / 1000) * 1000;
  }
  // the listed properties take the place of a unit on their floor, so the 3D model and the listings agree
  for (const p of props) {
    const floor = units.filter(u => u.wing === p.wing && u.floor === p.floor);
    const num = parseInt(p.id.slice(-2), 10) || 1;
    const u = floor.find(x => x.num === num) || floor.find(x => x.beds === p.beds && !x.prop) || floor.find(x => !x.prop);
    if (!u) continue;
    Object.assign(u, {
      id: p.id, num, code: `${p.wing} ${p.floor || 'G'}.${pad(num)}`, prop: p.id, title: p.title, beds: p.beds, baths: p.baths,
      area: p.area, outdoor: p.outdoor, price: p.price, status: p.status, orient: p.orient || u.orient,
      kind: p.type === 'Retail' ? 'Retail' : p.type === 'Office' ? 'Office' : 'Residence',
    });
  }
  return units;
}

// Room-by-room areas (m²) for the unit card. Third value marks outdoor space.
export function rooms(u) {
  const r = [];
  if (u.kind === 'Retail') {
    const st = u.area * 0.12;
    r.push(['Sales floor', u.area - st - 3.2], ['Storage', st], ['WC', 3.2]);
  } else if (u.kind === 'Office') {
    r.push(['Open-plan office', u.area - 18 - 6 - 8.5 - 7.2], ['Meeting room', 18], ['Reception', 6], ['Kitchenette', 8.5], ['WC ×2', 7.2]);
  } else {
    const ent = 3.2 + u.beds * 0.6, bath = 4.4 * u.baths, kit = u.beds ? 7.4 : 0, laundry = u.area > 55 ? 1.6 : 0, stor = u.area > 70 ? 2.2 : 0;
    const beds = Array.from({ length: u.beds }, (_, i) => [u.beds > 1 ? (i ? `Bedroom ${i + 1}` : 'Main bedroom') : 'Bedroom', i ? 10.6 : 13.2]);
    const living = u.area - ent - bath - kit - laundry - stor - beds.reduce((a, b) => a + b[1], 0);
    r.push(['Entrance', ent], [u.beds ? 'Living & dining' : 'Living, sleeping & kitchen', living]);
    if (kit) r.push(['Kitchen', kit]);
    r.push(...beds, [u.baths > 1 ? `Bathrooms ×${u.baths}` : 'Bathroom', bath]);
    if (laundry) r.push(['Laundry', laundry]);
    if (stor) r.push(['Storage', stor]);
    if (u.outdoor) r.push([u.garden ? 'Private garden' : u.terrace ? 'Terrace' : 'Balcony', u.outdoor, true]);
  }
  return r.map(([n, a, out]) => [n, Math.round(a * 100) / 100, !!out]);
}

// ---------- scene ----------
export function buildWorld(units, opts = {}) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#EEF0E4', opts.fogNear || 120, opts.fogFar || 260);

  const hemi = new THREE.HemisphereLight('#FDFBEF', '#A9AD93', 0.9);
  const sun = new THREE.DirectionalLight('#FFF4D6', 2.4);
  sun.castShadow = true;
  const sm = opts.mobile ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 10, far: 280 });
  sun.shadow.bias = -0.0005;
  scene.add(hemi, sun, sun.target);

  // sky dome with a vertical gradient (colours set by the time of day)
  const skyGeo = new THREE.SphereGeometry(600, 32, 16);
  skyGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
  scene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false })));
  const tmpC = new THREE.Color();
  function paintSky(top, horizon) {
    const pos = skyGeo.attributes.position, col = skyGeo.attributes.color;
    for (let i = 0; i < pos.count; i++) {
      const t = Math.pow(Math.min(1, Math.max(0, pos.getY(i) / 600) * 1.8), 0.7);
      tmpC.copy(horizon).lerp(top, t); col.setXYZ(i, tmpC.r, tmpC.g, tmpC.b);
    }
    col.needsUpdate = true;
  }

  const std = o => new THREE.MeshStandardMaterial(o);
  const M = {
    ground: std({ color: '#D9D2B6', roughness: 1 }),
    lawn: std({ color: '#9AA894', roughness: 1 }),
    path: std({ color: '#EDE6CF', roughness: 1 }),
    road: std({ color: '#5E6358', roughness: 0.9 }),
    slab: std({ color: '#F6F1E1', roughness: 0.75 }),
    glass: std({ color: '#56634F', roughness: 0.18, metalness: 0.35, emissive: '#FFC870', emissiveIntensity: 0 }),
    shop: std({ color: '#6B735F', roughness: 0.15, metalness: 0.4, emissive: '#FFD9A0', emissiveIntensity: 0.05 }),
    fin: std({ color: '#F1EADA', roughness: 0.6 }),
    roof: std({ color: '#7F9270', roughness: 1 }),
    city: std({ color: '#E4DDC8', roughness: 0.9 }),
    trunk: std({ color: '#7A6448', roughness: 1 }),
    leaf: std({ color: '#6F8461', roughness: 0.9, flatShading: true }),
    person: std({ color: '#FBF8EF', roughness: 0.8 }),
    // unit states
    uGhost: std({ color: '#FBF8EF', roughness: 0.85, emissive: '#FFE3B0', emissiveIntensity: 0 }),
    uMatch: std({ color: '#E4F488', roughness: 0.6, emissive: '#C9E23A', emissiveIntensity: 0.28 }),
    uSold: std({ color: '#D3CEC0', roughness: 0.9 }),
    uDim: std({ color: '#F4F0E4', roughness: 1, transparent: true, opacity: 0.14, depthWrite: false }),
    uHover: std({ color: '#C8F23E', roughness: 0.45, emissive: '#B5DE2C', emissiveIntensity: 0.55 }),
    uSel: std({ color: '#6FBF3A', roughness: 0.4, emissive: '#4E9A22', emissiveIntensity: 0.55 }),
    wing: std({ color: '#E7FD55', roughness: 0.4, emissive: '#B8CC30', emissiveIntensity: 0.3 }),
  };
  const box = (w, h, d, mat, x, y, z, parent = scene, shadow = true) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z);
    m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
  };

  // ground, plot, roads
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.ground); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  box(78, 0.2, 64, M.path, 0, 0.1, 2, scene, false);
  box(30, 0.25, 22, M.lawn, 0, 0.15, 6, scene, false);
  box(320, 0.12, 9, M.road, 0, 0.06, 40, scene, false);
  box(9, 0.12, 320, M.road, 52, 0.06, 0, scene, false);
  for (let i = -150; i < 150; i += 7) { box(3, 0.14, 0.3, M.path, i, 0.08, 40, scene, false); box(0.3, 0.14, 3, M.path, 52, 0.08, i, scene, false); }

  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const crowns = [];
  function tree(parent, x, y, z, s) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 6), M.trunk); tr.position.set(x, y + 0.8 * s, z); tr.castShadow = true; parent.add(tr);
    const cr = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25 * s, 0), M.leaf); cr.position.set(x, y + 2.1 * s, z); cr.castShadow = true; cr.userData.ph = rnd() * 6; parent.add(cr); crowns.push(cr);
  }

  // wings: slabs, one mesh per unit, branching fins, roof garden
  const byId = new Map(units.map(u => [u.id, u]));
  const meshes = [], wingGroups = {};
  WINGS.forEach((w, wi) => {
    const g = new THREE.Group(); g.position.set(w.x, 0, w.z); g.rotation.y = w.rot; scene.add(g); wingGroups[w.id] = g;
    box(w.len + 1, 0.5, w.depth + 1, M.slab, 0, 0.25, 0, g);
    for (let f = 0; f <= w.floors; f++) box(w.len + 0.8, 0.2, w.depth + 0.9, M.slab, 0, levelY(f) + levelH(f) - 0.1, 0, g);
    units.filter(u => u.wing === w.id).forEach(u => {
      const h = levelH(u.floor) - 0.24;
      const m = box(u.box.w - 0.16, h, u.box.d - 0.16, u.kind === 'Retail' ? M.shop : M.glass, u.box.x, levelY(u.floor) + h / 2 + 0.02, u.box.z, g);
      m.userData.unit = u; u.mesh = m; meshes.push(m);
    });
    const top = levelY(w.floors) + FLOOR_H, y0 = levelY(1) - 0.2, H = top - y0;
    box(w.len - 2, 0.6, w.depth - 2, M.roof, 0, top + 0.3, 0, g);
    for (let t = 0; t < Math.floor(w.len / 7); t++) tree(g, -w.len / 2 + 4 + t * 7 + (t % 2), top + 0.6, t % 2 ? 1.6 : -1.6, 0.55);
    // vertical fins ("trunks") with a slight lean, and diagonal "branches" between them
    const step = 1.7, n = Math.floor(w.len / step), band = FLOOR_H * 3, bands = Math.floor(H / band);
    const fins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 1, 0.6), M.fin, n * 2 + n * bands * 2);
    fins.castShadow = fins.receiveShadow = true;
    const o = new THREE.Object3D(); let k = 0;
    for (const s of [1, -1]) {
      const zf = s * (w.depth / 2 + 0.75);
      for (let i = 0; i < n; i++) {
        const x = -w.len / 2 + step / 2 + i * step;
        o.position.set(x, y0 + H / 2, zf); o.rotation.set(0, 0, Math.sin(i * 1.7 + wi) * 0.06); o.scale.set(1, H, 1);
        o.updateMatrix(); fins.setMatrixAt(k++, o.matrix);
        if (i === n - 1) continue;
        for (let b = 0; b < bands; b++) {
          if (rnd() < 0.55) continue;
          const dir = rnd() < 0.5 ? 1 : -1, len = Math.hypot(step, band);
          o.position.set(x + step / 2, y0 + band * (b + 0.5), zf); o.rotation.set(0, 0, dir * Math.atan2(step, band)); o.scale.set(0.8, len, 0.9);
          o.updateMatrix(); fins.setMatrixAt(k++, o.matrix);
        }
      }
    }
    fins.count = k; g.add(fins);
  });

  // trees, city, cars, people
  for (let i = 0; i < 80; i++) {
    const a = rnd() * Math.PI * 2, r = 30 + rnd() * 30, x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 + 6;
    if (Math.abs(z - 40) < 7 || Math.abs(x - 52) < 7) continue;
    tree(scene, x, 0, z, 0.9 + rnd() * 0.8);
  }
  for (let i = 0; i < 9; i++) tree(scene, -12 + i * 3, 0.25, 9 + (i % 2) * 3, 0.8);
  for (let i = -140; i < 140; i += 9) { tree(scene, i, 0, 34, 0.7); tree(scene, i + 4, 0, 46, 0.7); }
  const city = [];
  for (let i = 0; i < 110; i++) {
    const a = rnd() * Math.PI * 2, r = 80 + rnd() * 150, h = 4 + rnd() * rnd() * 34, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(z - 40) < 14 || Math.abs(x - 52) < 14) continue;
    const b = box(8 + rnd() * 14, h, 8 + rnd() * 14, M.city, x, h / 2, z);
    b.geometry.computeBoundingBox(); b.userData.bb = b.geometry.boundingBox.clone().translate(b.position).expandByScalar(4); city.push(b);
  }
  const CAR = ['#F6F1E1', '#5E6358', '#A68150', '#2E3A26', '#B4453A', '#DAD6CB', '#3C4A5C'].map(c => std({ color: c, roughness: 0.35, metalness: 0.3 }));
  const cabin = std({ color: '#2A3128', roughness: 0.2, metalness: 0.5 });
  const cars = [];
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group(), alongX = i < 9;
    box(3.4, 0.8, 1.6, CAR[i % CAR.length], 0, 0.55, 0, c); box(1.9, 0.6, 1.4, cabin, -0.2, 1.2, 0, c);
    const lane = i % 2 ? 1 : -1, sp = 7 + rnd() * 5;
    if (alongX) { c.position.set(-150 + i * 34, 0, 40 + lane * 2); c.rotation.y = lane > 0 ? Math.PI : 0; c.userData = { ax: 'x', v: lane > 0 ? -sp : sp }; }
    else { c.position.set(52 + lane * 2, 0, -150 + (i - 9) * 60); c.rotation.y = lane > 0 ? Math.PI / 2 : -Math.PI / 2; c.userData = { ax: 'z', v: lane > 0 ? sp : -sp }; }
    scene.add(c); cars.push(c);
  }
  const people = [], pGeo = new THREE.CapsuleGeometry(0.2, 0.75, 3, 8);
  for (let i = 0; i < 22; i++) {
    const p = new THREE.Mesh(pGeo, M.person); p.castShadow = true;
    const onX = i % 3 !== 0, a = onX ? -34 + rnd() * 68 : -30 + rnd() * 58;
    if (onX) { p.position.set(a, 0.6, 27 + rnd() * 6); p.userData = { ax: 'x', min: -36, max: 36 }; }
    else { p.position.set(rnd() < 0.5 ? -31 : 31, 0.6, a); p.userData = { ax: 'z', min: -30, max: 30 }; }
    p.userData.v = (rnd() < 0.5 ? -1 : 1) * (0.8 + rnd() * 0.7);
    scene.add(p); people.push(p);
  }

  // time of day
  const C = h => new THREE.Color(h);
  const SKY = [[5, C('#1B2433'), C('#2E3A26')], [7, C('#9DB4C8'), C('#F2D3B0')], [10, C('#9EC0DA'), C('#EEF0E4')], [16, C('#9EC0DA'), C('#EEF0E4')], [19, C('#7F8FB0'), C('#EBB98E')], [21, C('#1B2433'), C('#2E3A26')]];
  function setHour(h) {
    let a = SKY[0], b = SKY[SKY.length - 1];
    for (let i = 0; i < SKY.length - 1; i++) if (h >= SKY[i][0] && h <= SKY[i + 1][0]) { a = SKY[i]; b = SKY[i + 1]; }
    const t = (h - a[0]) / Math.max(0.001, b[0] - a[0]);
    const top = a[1].clone().lerp(b[1], t), horizon = a[2].clone().lerp(b[2], t);
    paintSky(top, horizon); scene.fog.color.copy(horizon);
    const day = Math.max(0, Math.sin(((h - 6) / 14) * Math.PI)), az = ((h - 6) / 14) * Math.PI;
    sun.position.set(Math.cos(az) * -110, 15 + day * 95, -40 + Math.sin(az) * 30);
    sun.intensity = 0.3 + day * 2.3; sun.color.set(day < 0.35 ? '#FFC58A' : '#FFF4D6');
    hemi.intensity = 0.45 + day * 0.85;
    const night = Math.min(1, Math.max(0, (0.25 - day) / 0.25));
    M.glass.emissiveIntensity = night * 0.9; M.shop.emissiveIntensity = 0.05 + night * 1.1; M.uGhost.emissiveIntensity = night * 0.5; M.uMatch.emissiveIntensity = 0.28 + night * 0.5;
    if (opts.renderer) opts.renderer.toneMappingExposure = 0.95 + day * 0.25;
  }

  // facade fins fade out when browsing units
  function setFins(op) {
    const tr = op < 0.999;
    if (M.fin.transparent !== tr) { M.fin.transparent = tr; M.fin.depthWrite = !tr; M.fin.needsUpdate = true; }
    M.fin.opacity = op;
  }

  function update(dt, now) {
    for (const c of cars) { const p = c.position, d = c.userData; p[d.ax] += d.v * dt; if (p[d.ax] > 160) p[d.ax] = -160; if (p[d.ax] < -160) p[d.ax] = 160; }
    for (const p of people) { const d = p.userData; p.position[d.ax] += d.v * dt; if (p.position[d.ax] > d.max || p.position[d.ax] < d.min) d.v *= -1; p.position.y = 0.6 + Math.abs(Math.sin(now / 180 + d.min)) * 0.04; }
    for (const c of crowns) c.rotation.z = Math.sin(now / 1400 + c.userData.ph) * 0.04;
  }

  // hide city blocks the camera is inside or that stand between the camera and what it looks at
  const ray = new THREE.Ray(), hit = new THREE.Vector3();
  function cull(camPos, target) {
    ray.origin.copy(camPos); ray.direction.copy(target).sub(camPos);
    const dist = ray.direction.length(); ray.direction.normalize();
    for (const b of city) {
      const bb = b.userData.bb;
      b.visible = !(bb.containsPoint(camPos) || (ray.intersectBox(bb, hit) && hit.distanceTo(camPos) < dist));
    }
  }

  return { scene, sun, hemi, M, meshes, wingGroups, byId, setHour, setFins, update, cull };
}

// World-space centre and outward direction of a unit, for flying the camera to it.
export function unitFrame(u, outPos, outDir) {
  u.mesh.getWorldPosition(outPos);
  const w = WINGS.find(x => x.id === u.wing);
  if (u.side) outDir.set(Math.sin(w.rot) * u.side, 0, Math.cos(w.rot) * u.side);
  else outDir.set(0, 0, 0);
  return outPos;
}
