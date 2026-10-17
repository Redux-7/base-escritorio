// Tienda de Base · Manejá por tu barrio (calles reales de OpenStreetMap, vista desde arriba)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, btn, overlay } = BM.util;
  const pick = BM.util.pick || ((l, o, v, f) => seg(o, v, f));
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const TAU = Math.PI * 2;
  const angDiff = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const SPEED = [24, 14, 15, 13.5, 12, 9, 6, 5, 4]; // velocidad de la compu por tipo de calle (m/s)
  const CAR_COLS = ['#d8dadf', '#2b2f36', '#8d939c', '#b3201c', '#1f4f9a', '#f2f2f2', '#6b6f75', '#9a7b4f', '#245a3a', '#e3b23c', '#5a2a6a', '#c7cbd1'];
  const SKIN = { rojo: '#d3202a', azul: '#1f5fe0', amarillo: '#f2c21b', verde: '#1e9e4a', negro: '#23262d', blanco: '#f2f2f2', naranja: '#ff7a1a' };
  // vehículos que podés manejar: largo, ancho, aceleración, velocidad máxima (m/s), distancia entre ejes, agarre, volante
  const VEH = {
    auto: { tank: 9000, n: 'Auto', t: 'auto', len: 4.4, wid: 1.9, acc: 4.6, vmax: 36, wb: 2.6, grip: 9.5, steer: 0.62 },
    deportivo: { tank: 6000, n: 'Deportivo', t: 'sport', len: 4.5, wid: 1.95, acc: 7, vmax: 50, wb: 2.6, grip: 11.5, steer: 0.6 },
    camioneta: { tank: 8000, n: 'Camioneta', t: 'pickup', len: 5.3, wid: 2.0, acc: 3.9, vmax: 33, wb: 3.2, grip: 8.5, steer: 0.56 },
    moto: { tank: 7000, n: 'Moto', t: 'moto', len: 2.1, wid: 0.8, acc: 6.5, vmax: 40, wb: 1.4, grip: 10.5, steer: 0.72 },
    taxi: { tank: 9000, n: 'Taxi', t: 'taxi', len: 4.4, wid: 1.85, acc: 4.4, vmax: 34, wb: 2.6, grip: 9.5, steer: 0.62 },
    patrullero: { tank: 8000, n: 'Patrullero', t: 'police', len: 4.7, wid: 1.9, acc: 5.4, vmax: 42, wb: 2.7, grip: 10, steer: 0.62 },
    colectivo: { tank: 12000, n: 'Colectivo', t: 'bus', len: 11.5, wid: 2.55, acc: 2.2, vmax: 23, wb: 6, grip: 7, steer: 0.6 },
    camion: { tank: 12000, n: 'Camión', t: 'truck', len: 9, wid: 2.5, acc: 2.1, vmax: 25, wb: 5, grip: 7, steer: 0.56 }
  };
  // hash para que lo "al azar" del mapa salga siempre igual
  const hsh = (a, b) => { let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

  // ===================== preparar el mapa =====================
  function prepare(m) {
    const S = 0.5;
    const roads = m.roads.map((r) => { const p = []; for (let i = 0; i < r.p.length; i += 2) p.push([r.p[i] * S, r.p[i + 1] * S]); return { n: r.n, k: r.k, w: r.k >= 7 ? r.w : r.w * 1.18 + 0.6, o: r.o, p, nd: r.nd && r.nd.length === p.length ? r.nd : null }; });
    // nodos del grafo: los puntos compartidos entre calles son esquinas
    const links = new Map();
    let fake = 1e7;
    for (let ri = 0; ri < roads.length; ri++) {
      const r = roads[ri];
      if (!r.nd) r.nd = r.p.map(() => fake++);
      r.nd.forEach((n, i) => { let l = links.get(n); if (!l) links.set(n, l = []); l.push([ri, i]); });
    }
    const nodePos = (n) => { const l = links.get(n); const [ri, i] = l[0]; return roads[ri].p[i]; };
    const deg = (n) => { let d = 0; for (const [ri, i] of links.get(n)) { const r = roads[ri]; if (i > 0) d++; if (i < r.p.length - 1) d++; } return d; };
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (const r of roads) for (const [x, y] of r.p) { if (x < minx) minx = x; if (y < miny) miny = y; if (x > maxx) maxx = x; if (y > maxy) maxy = y; }
    const G = { roads, links, nodePos, deg, bounds: [minx, miny, maxx, maxy] };
    // grilla para buscar rápido (celdas de 50 m)
    const C = 50, grid = new Map();
    const key = (cx, cy) => cx * 100003 + cy;
    const put = (x0, y0, x1, y1, item) => { for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++) { const k = key(cx, cy); let g = grid.get(k); if (!g) grid.set(k, g = { s: [], b: [] }); item.b ? g.b.push(item.b) : g.s.push(item.s); } };
    roads.forEach((r, ri) => { for (let i = 0; i < r.p.length - 1; i++) { const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], pad = r.w / 2 + 2; put(Math.min(ax, bx) - pad, Math.min(ay, by) - pad, Math.max(ax, bx) + pad, Math.max(ay, by) + pad, { s: ri * 65536 + i }); } });
    const poly = (arr) => { const p = []; for (let i = 0; i < arr.length; i += 2) p.push([arr[i] * S, arr[i + 1] * S]); return p; };
    const bbox = (p) => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of p) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } return [a, b, c, d]; };
    G.buildings = m.buildings.map((b, i) => { const p = poly(b); const bb = bbox(p); return { p, bb, c: hsh(i, 7) }; });
    G.buildings.forEach((b) => put(b.bb[0], b.bb[1], b.bb[2], b.bb[3], { b }));
    G.parks = m.parks.map((a) => { const p = poly(a); return { p, bb: bbox(p) }; });
    G.water = m.water.map((a) => { const p = poly(a); return { p, bb: bbox(p) }; });
    G.rivers = m.rivers.map((a) => { const p = poly(a); return { p, bb: bbox(p) }; });
    G.rails = m.rails.map((a) => { const p = poly(a); return { p, bb: bbox(p) }; });
    G.cell = (x, y) => grid.get(key(Math.floor(x / C), Math.floor(y / C)));
    // todo lo que cae en un rectángulo (para dibujar un mosaico sin recorrer el mapa entero)
    G.inRect = (x0, y0, x1, y1) => {
      const rs = new Set(), bs = new Set();
      for (let cx = Math.floor(x0 / C); cx <= Math.floor(x1 / C); cx++) for (let cy = Math.floor(y0 / C); cy <= Math.floor(y1 / C); cy++) {
        const g = grid.get(key(cx, cy)); if (!g) continue;
        for (const sg of g.s) rs.add(Math.floor(sg / 65536));
        for (const b of g.b) bs.add(b);
      }
      return { roads: [...rs].map(i => roads[i]), buildings: [...bs] };
    };
    // ---------- semáforos: los de OSM, agrupados por esquina; si faltan, en cruces de avenidas ----------
    const corners = [];
    for (const [n] of links) if (deg(n) >= 3) corners.push(n);
    const sig = new Map();
    const nearestCorner = (x, y, maxD) => { let best = null, bd = maxD * maxD; for (const n of cornersNear(x, y)) { const [nx, ny] = nodePos(n), d = (nx - x) ** 2 + (ny - y) ** 2; if (d < bd) { bd = d; best = n; } } return best; };
    const cgrid = new Map();
    for (const n of corners) { const [x, y] = nodePos(n), k = key(Math.floor(x / C), Math.floor(y / C)); let g = cgrid.get(k); if (!g) cgrid.set(k, g = []); g.push(n); }
    function cornersNear(x, y) { const out = [], cx = Math.floor(x / C), cy = Math.floor(y / C); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const g = cgrid.get(key(cx + i, cy + j)); if (g) out.push(...g); } return out; }
    for (const s of m.signals) { const n = nearestCorner(s[0] * S, s[1] * S, 30); if (n != null) sig.set(n, true); }
    for (const n of corners) {
      if (sig.has(n)) continue;
      const ks = new Set(links.get(n).map(([ri]) => roads[ri].k));
      const big = [...ks].filter(k => k >= 2 && k <= 3).length, anyBig = [...ks].some(k => k >= 2 && k <= 3), anyMid = [...ks].some(k => k <= 4);
      if ((big >= 2 || (anyBig && anyMid && ks.size >= 2)) && m.signals.length < 3) sig.set(n, true);
      else if (anyBig && ks.size >= 2 && links.get(n).some(([ri]) => roads[ri].k === 4)) {
        const [x, y] = nodePos(n); let far = true;
        for (const o of sig.keys()) { const [ox, oy] = nodePos(o); if ((ox - x) ** 2 + (oy - y) ** 2 < 120 * 120) { far = false; break; } }
        if (far && m.signals.length < 40) sig.set(n, true);
      }
    }
    G.lights = new Map();
    let li = 0;
    for (const n of sig.keys()) {
      const [x, y] = nodePos(n), apps = [];
      let maxW = 0;
      for (const [ri, i] of links.get(n)) {
        const r = roads[ri]; maxW = Math.max(maxW, r.w);
        for (const j of [i - 1, i + 1]) {
          if (j < 0 || j >= r.p.length) continue;
          const [px, py] = r.p[j], dx = x - px, dy = y - py, L = Math.hypot(dx, dy) || 1;
          apps.push({ ux: dx / L, uy: dy / L, w: r.w, ri, inbound: !(r.o === 1 && j > i) && !(r.o === -1 && j < i) });
        }
      }
      if (apps.length < 3) continue;
      const a0 = Math.atan2(apps[0].uy, apps[0].ux);
      for (const a of apps) { const d = Math.abs(angDiff(Math.atan2(a.uy, a.ux) - a0)); a.g = (d < Math.PI / 4 || d > 3 * Math.PI / 4) ? 0 : 1; }
      G.lights.set(n, { n, x, y, apps, maxW, off: (li++ * 7.3) % 30 });
    }
    // carteles con el nombre de las calles en las esquinas
    G.signs = [];
    for (const n of corners) {
      const seen = new Map();
      for (const [ri, i] of links.get(n)) { const r = roads[ri]; if (!r.n || r.k >= 7 || seen.has(r.n)) continue; const j = i < r.p.length - 1 ? i + 1 : i - 1; const [x0, y0] = r.p[i], [x1, y1] = r.p[j]; seen.set(r.n, { n: r.n, ang: Math.atan2(y1 - y0, x1 - x0), w: r.w }); }
      if (seen.size < 1) continue;
      const [x, y] = nodePos(n), list = [...seen.values()].slice(0, 2);
      // en la vereda de una esquina: corrido del cordón de las dos calles
      const A = list[0], Bq = list[1] || { ang: A.ang + Math.PI / 2, w: A.w };
      const u1x = Math.cos(A.ang), u1y = Math.sin(A.ang), u2x = Math.cos(Bq.ang), u2y = Math.sin(Bq.ang);
      let sx = x + u1x * (Bq.w / 2 + 2.4) + u2x * (A.w / 2 + 2.4), sy = y + u1y * (Bq.w / 2 + 2.4) + u2y * (A.w / 2 + 2.4);
      let dx = u1x + u2x, dy = u1y + u2y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      // un cartel por calle, en esquinas opuestas del cruce (así no se enciman)
      G.signs.push({ x: sx, y: sy, dx, dy, names: [list[0].n] });
      if (list[1]) {
        const sx2 = x - u1x * (Bq.w / 2 + 2.4) - u2x * (A.w / 2 + 2.4), sy2 = y - u1y * (Bq.w / 2 + 2.4) - u2y * (A.w / 2 + 2.4);
        G.signs.push({ x: sx2, y: sy2, dx: -dx, dy: -dy, names: [list[1].n] });
      }
    }
    // faroles en las esquinas (se ven de noche)
    G.lampsCorner = corners.map(n => { const [x, y] = nodePos(n); let mw = 0; for (const [ri] of links.get(n)) mw = Math.max(mw, roads[ri].w); return [x + mw / 2 + 1.5, y - mw / 2 - 1.5]; });
    // estaciones de servicio: las reales del mapa (si vinieron) o en esquinas de avenidas, separadas ~700 m
    G.stations = [];
    const addStation = (x, y) => {
      let best = null, bd = 1e9;
      for (const n of cornersNear(x, y)) { const [nx, ny] = nodePos(n), d = (nx - x) ** 2 + (ny - y) ** 2; if (d < bd) { bd = d; best = n; } }
      const n = best; if (n == null) return;
      const [nx, ny] = nodePos(n); let mw = 0, ang = 0; for (const [ri, i] of links.get(n)) { const r = roads[ri]; if (r.w > mw) { mw = r.w; const j = i < r.p.length - 1 ? i + 1 : i - 1; ang = Math.atan2(r.p[j][1] - r.p[i][1], r.p[j][0] - r.p[i][0]); } }
      // en la vereda, al costado de la avenida y corrido de la esquina
      const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
      // la playa arranca en el cordón y entra en la vereda/manzana; el centro está a 28 m de la esquina
      const ex = nx + ux * 28 + vx * (mw / 2), ey = ny + uy * 28 + vy * (mw / 2);
      const bays = [];
      for (const iu of [-5, 5]) for (const bv of [[6, 8.6], [10.4, 13]]) bays.push({ u0: iu - 3.6, u1: iu + 3.6, v0: bv[0], v1: bv[1] });
      G.stations.push({ ex, ey, ux, uy, vx, vy, ang, bays, x: ex + vx * 8.5, y: ey + vy * 8.5, rx: ex + vx * 7.3, ry: ey + vy * 7.3 });
    };
    for (const f of (m.fuel || [])) addStation(f[0] * S, f[1] * S);
    if (G.stations.length < 4) {
      const cands = corners.filter(n => links.get(n).some(([ri]) => roads[ri].k <= 3)).map(n => nodePos(n)).sort((a, b) => hsh(a[0] | 0, a[1] | 0) - hsh(b[0] | 0, b[1] | 0));
      for (const [x, y] of cands) { if (G.stations.length >= 14) break; if (G.stations.some(st => (st.x - x) ** 2 + (st.y - y) ** 2 < 700 * 700)) continue; addStation(x, y); }
    }
    // faroles a lo largo de las calles (uno cada ~32 m, alternando veredas) + los de las esquinas
    G.lamps = G.lampsCorner.slice();
    roads.forEach((r, ri) => {
      if (r.k > 6) return;
      for (let i = 0; i < r.p.length - 1; i++) {
        const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], L = Math.hypot(bx - ax, by - ay); if (L < 25) continue;
        const ux = (bx - ax) / L, uy = (by - ay) / L;
        for (let t = 12, k = 0; t < L - 8; t += 26, k++) { const off = r.w / 2 + 1.2; for (const sd of r.k <= 3 ? [-1, 1] : [(k + ri) % 2 ? 1 : -1]) G.lamps.push([ax + ux * t - uy * off * sd, ay + uy * t + ux * off * sd]); }
      }
    });
    // charcos (solo se ven con lluvia): cerca del cordón, al azar pero siempre en el mismo lugar
    G.puddles = [];
    roads.forEach((r, ri) => {
      if (r.k > 6) return;
      for (let i = 0; i < r.p.length - 1; i++) {
        const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], L = Math.hypot(bx - ax, by - ay); if (L < 20) continue;
        const ux = (bx - ax) / L, uy = (by - ay) / L;
        for (let t = 10; t < L - 10; t += 22) { const q = hsh(ri * 131 + i, t | 0); if (q > 0.3) continue; const sd = q < 0.15 ? -1 : 1, off = r.w / 2 - 1.2 - q * 5; G.puddles.push([ax + ux * t - uy * off * sd, ay + uy * t + ux * off * sd, 1.4 + q * 7, Math.atan2(uy, ux), q]); }
      }
    });
    // árboles en las veredas
    G.trees = [];
    roads.forEach((r, ri) => {
      if (r.k < 2 || r.k > 6) return;
      for (let i = 0; i < r.p.length - 1; i++) {
        const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], L = Math.hypot(bx - ax, by - ay);
        if (L < 20) continue;
        const ux = (bx - ax) / L, uy = (by - ay) / L;
        for (let t = 9; t < L - 9; t += 13) for (const sd of [-1, 1]) {
          const q = hsh(ri * 977 + i, Math.round(t) * 3 + sd); if (q < 0.45) continue;
          const off = r.w / 2 + 2.2;
          G.trees.push([ax + ux * t - uy * off * sd, ay + uy * t + ux * off * sd, 2.2 + q * 1.8]);
        }
      }
    });
    return G;
  }
  function pointInPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }

  // ===================== el juego =====================
  function barrio(H) {
    const host = BM.host || {};
    const root = h('div', { class: 'mg-move br-root' });
    const cv = h('canvas', { class: 'mv-cv' }); root.append(cv);
    const hud = h('div', { class: 'mv-hud' }), msg = h('div', { class: 'sn-msg' }), toastEl = h('div', { class: 'br-toast' });
    root.append(hud, msg, toastEl); msg.hidden = true;
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500, lastSz = '', rf = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); DPR = d; };
    let DPR = 1;
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);

    let G = null, mapId = H.get().map || null, mode = H.get().mode === 'libre' ? 'libre' : 'entregas';
    let me, cars = [], keys = {}, raf = 0, lastT = 0, state = 'menu', clock = 0, skids = [], toastT = 0;
    const SIDE = 2.2;
    // ¿el punto está dentro de la playa de una estación de servicio? (devuelve la estación y las coordenadas locales)
    function lotAt(x, y) {
      for (const st of G.stations) { const dx = x - st.ex, dy = y - st.ey, u = dx * st.ux + dy * st.uy, v = dx * st.vx + dy * st.vy; if (u > -16 && u < 16 && v > -1 && v < 17) return { st, u, v }; }
      return null;
    }
    const WX = { dia: 'Día', noche: 'Noche', lluvia: 'Lluvia', noche_lluvia: 'Noche con lluvia' };
    let wx = WX[H.get().wx] ? H.get().wx : 'dia';
    const isNight = () => wx === 'noche' || wx === 'noche_lluvia', isRain = () => wx === 'lluvia' || wx === 'noche_lluvia';
    let inBay = false, splash = [];
    let drops = [], dark = null, blink = { l: false, r: false, haz: false, a0: 0 }, lights = 'off', fuelWarn = 0, filling = false;
    const LIGHTS = { off: 'Luces apagadas', low: 'Luces bajas', high: 'Luces altas' };
    const autoLights = () => { if ((isRain() || isNight()) && lights === 'off') lights = 'low'; };
    let veh = VEH[H.get().veh] ? H.get().veh : 'auto', siren = false;
    const DASH = { clasico: 'Tablero clásico', radar: 'Alrededor del radar', digital: 'Digital chico' };
    let dash = DASH[H.get().dash] ? H.get().dash : 'clasico';
    let stats = { red: 0, crash: 0, done: 0, pts: 0 }, job = null, zoom = 5, camX = 0, camY = 0, mini = null;

    // ---------- mosaicos del mapa (se dibujan una vez y se reusan) ----------
    const TILE = 64, RES = 8, tiles = new Map();
    let noise = null;
    function noisePattern() {
      if (noise) return noise;
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#b9b3a6'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 900; i++) { const v = 150 + Math.random() * 60 | 0; g.fillStyle = `rgba(${v},${v - 6},${v - 16},.35)`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 2, 1 + Math.random() * 2); }
      noise = c; return c;
    }
    let asph = null;
    function asphaltPattern() {
      if (asph) return asph;
      const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
      for (let i = 0; i < 1400; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.12 + v * 0.2})` : `rgba(255,255,255,${(v - 0.5) * 0.12})`; g.fillRect(Math.random() * 96, Math.random() * 96, 1, 1); }
      asph = c; return c;
    }
    function tile(tx, ty) {
      const k = tx + ',' + ty;
      let t = tiles.get(k);
      if (t) { tiles.delete(k); tiles.set(k, t); return t; }
      t = document.createElement('canvas'); t.width = t.height = TILE * RES;
      const g = t.getContext('2d');
      const x0 = tx * TILE, y0 = ty * TILE, x1 = x0 + TILE, y1 = y0 + TILE, pad = 30;
      const inT = (bb) => bb[2] >= x0 - pad && bb[0] <= x1 + pad && bb[3] >= y0 - pad && bb[1] <= y1 + pad;
      g.setTransform(RES, 0, 0, RES, -x0 * RES, -y0 * RES);
      // manzanas: veredas y patios
      const pat = g.createPattern(noisePattern(), 'repeat'); pat.setTransform && pat.setTransform(new DOMMatrix().scale(0.18));
      g.fillStyle = pat; g.fillRect(x0, y0, TILE, TILE);
      const inside = G.inRect(x0 - pad, y0 - pad, x1 + pad, y1 + pad);
      const path = (p, close) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); };
      for (const a of G.parks) if (inT(a.bb)) {
        path(a.p, true); g.fillStyle = '#6f8f4e'; g.fill();
        // pasto cortado a franjas y árboles adentro
        g.save(); path(a.p, true); g.clip(); g.fillStyle = 'rgba(255,255,255,.05)';
        for (let yy = Math.floor(a.bb[1] / 6) * 6; yy < a.bb[3]; yy += 12) g.fillRect(a.bb[0], yy, a.bb[2] - a.bb[0], 6);
        for (let xx = Math.floor(a.bb[0] / 9) * 9; xx < a.bb[2]; xx += 9) for (let yy = Math.floor(a.bb[1] / 9) * 9; yy < a.bb[3]; yy += 9) {
          const q = hsh(xx, yy); if (q > 0.35 || xx < x0 - 6 || xx > x1 + 6 || yy < y0 - 6 || yy > y1 + 6) continue;
          const tx2 = xx + q * 8, ty2 = yy + (1 - q) * 8, rr = 2.2 + q * 4;
          g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(tx2 + 1.2, ty2 + 1.3, rr, 0, TAU); g.fill();
          g.fillStyle = q < 0.17 ? '#3f5f2c' : '#4d6d35'; g.beginPath(); for (let kq = 0; kq < 5; kq++) { const an = kq * 1.26 + q * 9, d = rr * 0.4; g.moveTo(tx2 + Math.cos(an) * d + rr * 0.6, ty2 + Math.sin(an) * d); g.arc(tx2 + Math.cos(an) * d, ty2 + Math.sin(an) * d, rr * 0.6, 0, TAU); } g.fill();
        }
        g.restore();
      }
      for (const a of G.water) if (inT(a.bb)) { path(a.p, true); g.fillStyle = '#4f7896'; g.fill(); }
      for (const a of G.rivers) if (inT(a.bb)) { path(a.p); g.strokeStyle = '#4f7896'; g.lineWidth = 7; g.lineJoin = g.lineCap = 'round'; g.stroke(); }
      for (const a of G.rails) if (inT(a.bb)) {
        path(a.p); g.strokeStyle = '#7d7466'; g.lineWidth = 6; g.lineCap = 'butt'; g.stroke();
        g.setLineDash([0.5, 1]); g.strokeStyle = '#5a4a38'; g.lineWidth = 3.6; g.stroke(); g.setLineDash([]);
        g.strokeStyle = '#b8bcc2'; g.lineWidth = 0.35; for (const off of [-0.75, 0.75]) { g.save(); g.translate(0, off); path(a.p); g.stroke(); g.restore(); }
      }
      // calles: cordón, asfalto y pintura
      const near = inside.roads.sort((a, b) => a.w - b.w);
      g.lineJoin = g.lineCap = 'round';
      // veredas de baldosa clara, cordón y asfalto
      for (const r of near) { if (r.k >= 7) continue; path(r.p); g.strokeStyle = '#cbc4b6'; g.lineWidth = r.w + 6.2; g.stroke(); }
      for (const r of near) { if (r.k >= 7) continue; path(r.p); g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = r.w + 6.2; g.setLineDash([0.08, 1.5]); g.lineCap = 'butt'; g.stroke(); g.setLineDash([]); g.lineCap = 'round'; }
      for (const r of near) { path(r.p); g.strokeStyle = r.k === 8 ? '#a9a296' : '#e4dfd5'; g.lineWidth = r.w + 0.9; g.stroke(); }
      for (const r of near) { path(r.p); g.strokeStyle = r.k === 8 ? '#bdb5a6' : r.k <= 3 ? '#43464c' : '#4b4e54'; g.lineWidth = r.w; g.stroke(); }
      { const ap = g.createPattern(asphaltPattern(), 'repeat'); ap.setTransform && ap.setTransform(new DOMMatrix().scale(0.12)); for (const r of near) { if (r.k === 8) continue; path(r.p); g.strokeStyle = ap; g.lineWidth = r.w; g.stroke(); } }
      // borde gastado junto al cordón
      for (const r of near) { if (r.k >= 7) continue; for (const off of [-r.w / 2 + 0.25, r.w / 2 - 0.25]) { offPath(g, r.p, off); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.4; g.lineCap = 'butt'; g.stroke(); } g.lineCap = 'round'; }
      // manchas del asfalto
      g.fillStyle = 'rgba(0,0,0,.06)';
      for (const r of near) for (let i = 0; i < r.p.length - 1; i += 1) { const [ax, ay] = r.p[i]; const q = hsh(ax * 7 | 0, ay * 7 | 0); if (q < 0.5) g.fillRect(ax + q * 6 - 3, ay - q * 4, 2 + q * 3, 1 + q * 2); }
      for (const r of near) {
        if (r.k === 8 || r.k === 7) continue;
        g.lineCap = 'butt';
        if (!r.o && r.w >= 9) {
          if (r.k <= 3) { for (const off of [-0.2, 0.2]) { offPath(g, r.p, off); g.strokeStyle = '#e0b43a'; g.lineWidth = 0.18; g.setLineDash([]); g.stroke(); } }
          else { path(r.p); g.strokeStyle = 'rgba(235,190,70,.85)'; g.lineWidth = 0.16; g.setLineDash([3, 4]); g.stroke(); }
        }
        if (r.w >= 13) for (const off of r.o ? [-r.w / 6, r.w / 6] : [-r.w / 4, r.w / 4]) { offPath(g, r.p, off); g.strokeStyle = 'rgba(240,240,240,.7)'; g.lineWidth = 0.15; g.setLineDash([3, 6]); g.stroke(); }
        else if (r.o && r.w >= 9) { path(r.p); g.strokeStyle = 'rgba(240,240,240,.6)'; g.lineWidth = 0.15; g.setLineDash([3, 6]); g.stroke(); }
        g.setLineDash([]);
      }
      // sendas peatonales y líneas de frenado en las esquinas con semáforo
      for (const L of G.lights.values()) {
        if (L.x < x0 - 40 || L.x > x1 + 40 || L.y < y0 - 40 || L.y > y1 + 40) continue;
        for (const a of L.apps) {
          const d = L.maxW / 2 + 2.6, cx = L.x - a.ux * d, cy = L.y - a.uy * d, ang = Math.atan2(a.uy, a.ux);
          g.save(); g.translate(cx, cy); g.rotate(ang); g.fillStyle = 'rgba(238,238,232,.85)';
          for (let s = -a.w / 2 + 0.5; s < a.w / 2 - 0.4; s += 1.1) g.fillRect(-1.4, s, 2.8, 0.55);
          if (a.inbound) { g.fillRect(-2.4, 0, 0.4, a.w / 2 - 0.3); }
          g.restore();
        }
      }
      // estaciones de servicio
      for (const st of G.stations) {
        if (st.x < x0 - 30 || st.x > x1 + 30 || st.y < y0 - 30 || st.y > y1 + 30) continue;
        g.save(); g.translate(st.ex, st.ey); g.transform(st.ux, st.uy, st.vx, st.vy, 0, 0);
        // playa de hormigón con rampas en el cordón
        g.fillStyle = '#8d9096'; g.fillRect(-16, -0.6, 32, 17.6);
        g.fillStyle = '#7d8086'; for (let u = -16; u < 16; u += 4) for (let v = 0; v < 17; v += 4) if (((u + v) / 4) % 2 === 0) g.fillRect(u, v, 4, 4);
        g.fillStyle = '#d9d4ca'; g.fillRect(-16, 16.4, 32, 0.6);
        // dársenas de carga (recuadros amarillos)
        for (const bq of st.bays) { g.strokeStyle = '#f5c518'; g.lineWidth = 0.22; g.setLineDash([0.8, 0.5]); g.strokeRect(bq.u0, bq.v0, bq.u1 - bq.u0, bq.v1 - bq.v0); g.setLineDash([]); }
        // islas con surtidores
        for (const iu of [-5, 5]) { g.fillStyle = '#c7c2b8'; g.fillRect(iu - 3, 8.7, 6, 1.6); for (const pu of [iu - 1.5, iu + 1.5]) { g.fillStyle = '#d6413a'; g.fillRect(pu - 0.5, 9, 1, 1); g.fillStyle = '#fff'; g.fillRect(pu - 0.3, 9.15, 0.6, 0.3); } }
        // techo (se ve semitransparente para ver los autos abajo)
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(-10 + 1.4, 4.4 + 1.4, 20, 10);
        g.fillStyle = 'rgba(244,244,242,.72)'; g.fillRect(-10, 4.4, 20, 10);
        g.fillStyle = 'rgba(31,111,214,.85)'; g.fillRect(-10, 4.4, 20, 0.9); g.fillRect(-10, 13.5, 20, 0.9);

        // flechas de entrada y salida
        g.fillStyle = 'rgba(255,255,255,.75)'; for (const au of [-13, 13]) { g.beginPath(); g.moveTo(au, 1.5); g.lineTo(au + 0.9, 3.2); g.lineTo(au - 0.9, 3.2); g.closePath(); if (au > 0) { g.save(); g.translate(au, 2.35); g.rotate(Math.PI); g.translate(-au, -2.35); g.fill(); g.restore(); } else g.fill(); }
        g.restore();
        // cartel derecho (siempre se lee)
        const lx = st.ex + st.vx * 18.5, ly = st.ey + st.vy * 18.5;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(lx - 5.2 + 0.4, ly - 1.6 + 0.4, 10.4, 3.2);
        g.fillStyle = '#1f6fd6'; g.fillRect(lx - 5.2, ly - 1.6, 10.4, 3.2); g.fillStyle = '#fff'; g.font = '800 1.7px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⛽ NAFTA', lx, ly + 0.1);
      }
      // árboles de vereda
      for (const [x, y, rr] of G.trees) {
        if (x < x0 - 6 || x > x1 + 6 || y < y0 - 6 || y > y1 + 6) continue;
        if (lotAt(x, y)) continue;
        const q = hsh(x | 0, y | 0), base = q < 0.5 ? '#4b6a33' : '#577739';
        g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(x + 1.1, y + 1.2, rr * 1.05, 0, TAU); g.fill();
        g.fillStyle = base; g.beginPath();
        for (let k = 0; k < 5; k++) { const an = k * 1.26 + q * 6, d = rr * 0.42; g.moveTo(x + Math.cos(an) * d + rr * 0.62, y + Math.sin(an) * d); g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, rr * 0.62, 0, TAU); }
        g.fill();
        g.fillStyle = 'rgba(160,200,110,.22)'; g.beginPath(); g.arc(x - rr * 0.28, y - rr * 0.3, rr * 0.45, 0, TAU); g.fill();
      }
      // techos
      const ROOF = ['#b0603c', '#a35a3a', '#8e8e8a', '#c9bfae', '#9b8b74', '#b7aa98', '#7d7f84', '#c06a45'];
      for (const b of inside.buildings) {
        if (G.stations.some(st => b.bb[2] > st.x - 19 && b.bb[0] < st.x + 19 && b.bb[3] > st.y - 19 && b.bb[1] < st.y + 19 && [[b.bb[0], b.bb[1]], [b.bb[2], b.bb[3]], [b.bb[0], b.bb[3]], [b.bb[2], b.bb[1]], [(b.bb[0] + b.bb[2]) / 2, (b.bb[1] + b.bb[3]) / 2]].some(([qx, qy]) => { const dx = qx - st.ex, dy = qy - st.ey, u = dx * st.ux + dy * st.uy, v = dx * st.vx + dy * st.vy; return u > -17 && u < 17 && v > -1 && v < 18; }))) continue;
        g.save(); g.translate(2.6, 2.4); path(b.p, true); g.fillStyle = 'rgba(0,0,0,.12)'; g.fill(); g.restore();
        g.save(); g.translate(1.3, 1.2); path(b.p, true); g.fillStyle = 'rgba(0,0,0,.22)'; g.fill(); g.restore();
        const rc = ROOF[(b.c * ROOF.length) | 0];
        path(b.p, true); g.fillStyle = rc; g.fill();
        // techo a dos aguas: una mitad más oscura y la cumbrera
        const [bx0, by0, bx1, by1] = b.bb, wide = bx1 - bx0 > by1 - by0, mx = (bx0 + bx1) / 2, my = (by0 + by1) / 2;
        g.save(); path(b.p, true); g.clip();
        g.fillStyle = 'rgba(0,0,0,.16)'; if (wide) g.fillRect(bx0, my, bx1 - bx0, by1 - my); else g.fillRect(mx, by0, bx1 - mx, by1 - by0);
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 0.25; g.beginPath(); if (wide) { g.moveTo(bx0, my); g.lineTo(bx1, my); } else { g.moveTo(mx, by0); g.lineTo(mx, by1); } g.stroke();
        if (b.c > 0.8) { g.fillStyle = 'rgba(40,40,40,.35)'; g.fillRect(mx - 0.6 + (b.c - 0.8) * 8, my - 0.6, 1.2, 1.2); }
        g.restore();
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.25; path(b.p, true); g.stroke();
      }
      tiles.set(k, t);
      if (tiles.size > 90) tiles.delete(tiles.keys().next().value);
      return t;
    }
    function offPath(g, p, off) {
      g.beginPath();
      for (let i = 0; i < p.length - 1; i++) {
        const [ax, ay] = p[i], [bx, by] = p[i + 1], L = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / L * off, ny = (bx - ax) / L * off;
        g.moveTo(ax + nx, ay + ny); g.lineTo(bx + nx, by + ny);
      }
    }
    function buildMini() {
      const [a, b, c, d] = G.bounds, s = 140 / Math.max(c - a, d - b);
      const m2 = document.createElement('canvas'); m2.width = Math.ceil((c - a) * s) + 8; m2.height = Math.ceil((d - b) * s) + 8;
      const g = m2.getContext('2d'); g.fillStyle = 'rgba(20,22,26,.9)'; g.fillRect(0, 0, m2.width, m2.height);
      g.translate(4, 4); g.scale(s, s); g.translate(-a, -b); g.lineCap = g.lineJoin = 'round';
      for (const p of G.parks) { g.beginPath(); p.p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fillStyle = '#3f5a33'; g.fill(); }
      for (const r of G.roads) { g.beginPath(); r.p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = r.k <= 3 ? '#e6c35a' : '#aeb3ba'; g.lineWidth = Math.max(1 / s, r.k <= 3 ? 2.2 / s : 1.1 / s); g.stroke(); }
      mini = { c: m2, s, a, b };
    }

    // ---------- semáforos ----------
    const CYCLE = 34; // 15 verde + 3 amarillo + 1 rojo, para cada lado
    function lightState(L, grp) {
      const t = (clock + L.off) % CYCLE, half = CYCLE / 2, tt = grp === 0 ? t : (t + half) % CYCLE;
      return tt < 13 ? 'g' : tt < 16 ? 'y' : 'r';
    }
    function approachOf(L, ux, uy) { let best = null, bd = -2; for (const a of L.apps) { const d = a.ux * ux + a.uy * uy; if (d > bd) { bd = d; best = a; } } return best; }

    // ---------- calles: dónde estoy ----------
    function nearestRoad(x, y) {
      const c = G.cell(x, y); if (!c) return null;
      let best = null, bd = 1e9;
      for (const s of c.s) {
        const ri = Math.floor(s / 65536), i = s % 65536, r = G.roads[ri], [ax, ay] = r.p[i], [bx, by] = r.p[i + 1];
        const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2));
        const px = ax + dx * t, py = ay + dy * t, d = Math.hypot(x - px, y - py) - r.w / 2;
        if (d < bd) { bd = d; best = { r, ri, i, t, d, px, py, ang: Math.atan2(dy, dx) }; }
      }
      return best;
    }
    function inBuilding(x, y) { const c = G.cell(x, y); if (!c) return false; for (const b of c.b) if (x >= b.bb[0] && x <= b.bb[2] && y >= b.bb[1] && y <= b.bb[3] && pointInPoly(x, y, b.p)) return true; return false; }

    // ---------- autos de la compu ----------
    function spawnCar(near) {
      for (let tries = 0; tries < 30; tries++) {
        const ri = Math.floor(Math.random() * G.roads.length), r = G.roads[ri];
        if (r.k >= 7 && Math.random() < 0.8) continue;
        const i = Math.floor(Math.random() * (r.p.length - 1));
        const [x, y] = r.p[i];
        const d = Math.hypot(x - me.x, y - me.y);
        if (near ? (d < 110 || d > 420) : (d < 35 || d > 380)) continue;
        const dir = r.o === 1 ? 1 : r.o === -1 ? -1 : (Math.random() < 0.5 ? 1 : -1);
        const from = dir === 1 ? i : i + 1;
        if (from + dir < 0 || from + dir >= r.p.length) continue;
        const q = Math.random(), bus = r.k <= 3 && q < 0.12;
        const ty = bus ? 'bus' : q < 0.22 ? 'taxi' : q < 0.3 ? 'moto' : q < 0.37 ? 'pickup' : q < 0.41 && r.k <= 5 ? 'truck' : 'auto';
        const dims = { bus: [11.5, 2.55], taxi: [4.4, 1.85], moto: [2.1, 0.8], pickup: [5.3, 2], truck: [9, 2.5], auto: [4.3, 1.85] }[ty];
        const c = { ri, i: from, dir, t: Math.random(), v: SPEED[r.k] * 0.6, type: ty, c: bus ? '#e8e2d0' : ty === 'taxi' ? '#1b1b1d' : ty === 'truck' ? ['#d9d9d9', '#2f5d8a', '#b3201c'][Math.floor(Math.random() * 3)] : CAR_COLS[Math.floor(Math.random() * CAR_COLS.length)], len: dims[0], wid: dims[1], bus, lane: r.o ? (Math.random() < 0.5 ? -1 : 1) : 1, x, y, a: 0, brake: false, stuck: 0 };
        c.snap = true; placeCar(c); if (cars.some(o => Math.hypot(o.x - c.x, o.y - c.y) < 9)) continue;
        cars.push(c); return;
      }
    }
    function segOf(c) { const r = G.roads[c.ri], A = r.p[c.i], B = r.p[c.i + c.dir]; return { r, A, B }; }
    function placeCar(c) {
      const { r, A, B } = segOf(c), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const off = r.o ? c.lane * Math.min(r.w / 4, 1.8) : Math.min(r.w / 4, 3.2);
      c.tx = A[0] + dx * c.t - uy * off; c.ty = A[1] + dy * c.t + ux * off; c.ta = Math.atan2(uy, ux); c.segL = L; c.ux = ux; c.uy = uy;
      if (c.x == null || c.snap) { c.x = c.tx; c.y = c.ty; c.a = c.ta; c.snap = false; }
    }
    function planTurn(c) {
      const r = G.roads[c.ri], j = c.i + c.dir, n = r.nd[j];
      const opts = [];
      for (const [ri, i] of G.links.get(n)) {
        const r2 = G.roads[ri];
        for (const d of [1, -1]) {
          if (i + d < 0 || i + d >= r2.p.length) continue;
          if (r2.o === 1 && d === -1) continue; if (r2.o === -1 && d === 1) continue;
          if (ri === c.ri && i + d === c.i) continue;
          const [ax, ay] = r2.p[i], [bx, by] = r2.p[i + d], ang = Math.atan2(by - ay, bx - ax);
          const turn = angDiff(ang - c.a);
          opts.push({ ri, i, d, turn, wgt: Math.abs(turn) < 0.4 ? 3 : Math.abs(turn) < 2.2 ? 1 : 0.15 });
        }
      }
      if (!opts.length) return null;
      let s2 = Math.random() * opts.reduce((a, o) => a + o.wgt, 0), o = opts[0];
      for (const q of opts) { s2 -= q.wgt; if (s2 <= 0) { o = q; break; } }
      return o;
    }
    function nextSeg(c) {
      const o = c.plan || planTurn(c); c.plan = null; c.sig = 0;
      if (!o) return false;
      c.ri = o.ri; c.i = o.i; c.dir = o.d; c.t = 0; const r2 = G.roads[o.ri]; if (!r2.o) c.lane = 1; return true;
    }
    function nextSegOld(c) {
      const r = G.roads[c.ri], j = c.i + c.dir, n = r.nd[j];
      const opts = [];
      for (const [ri, i] of G.links.get(n)) {
        const r2 = G.roads[ri];
        for (const d of [1, -1]) {
          if (i + d < 0 || i + d >= r2.p.length) continue;
          if (r2.o === 1 && d === -1) continue; if (r2.o === -1 && d === 1) continue;
          if (ri === c.ri && i + d === c.i) continue;
          const [ax, ay] = r2.p[i], [bx, by] = r2.p[i + d], ang = Math.atan2(by - ay, bx - ax);
          const turn = Math.abs(angDiff(ang - c.a));
          opts.push({ ri, i, d, wgt: turn < 0.4 ? 3 : turn < 2.2 ? 1 : 0.15 });
        }
      }
      if (!opts.length) return false;
      let s = Math.random() * opts.reduce((a, o) => a + o.wgt, 0), o = opts[0];
      for (const q of opts) { s -= q.wgt; if (s <= 0) { o = q; break; } }
      c.ri = o.ri; c.i = o.i; c.dir = o.d; c.t = 0; const r2 = G.roads[o.ri]; if (!r2.o) c.lane = 1; return true;
    }
    function aiStep(c, dt) {
      const { r, B } = segOf(c);
      let want = SPEED[r.k];
      // semáforo al final del tramo
      const endNode = r.nd[c.i + c.dir], L = G.lights.get(endNode);
      const distEnd = (1 - c.t) * c.segL;
      if (L) {
        const ap = approachOf(L, c.ux, c.uy), st = ap ? lightState(L, ap.g) : 'g';
        const stopD = distEnd - (L.maxW / 2 + 4);
        if ((st === 'r' || (st === 'y' && stopD > 9)) && stopD > -1.5) want = Math.min(want, Math.sqrt(Math.max(0, 2 * 4 * (stopD - 0.5))));
      }
      // guiño antes de doblar
      if (distEnd < 30 && !c.plan && G.deg(endNode) >= 3) { c.plan = planTurn(c); c.sig = c.plan ? (c.plan.turn > 0.45 ? 1 : c.plan.turn < -0.45 ? -1 : 0) : 0; }
      if (isRain()) want *= 0.82;
      // auto de adelante (y el tuyo)
      for (const o of [...cars, me]) {
        if (o === c) continue;
        const dx = o.x - c.x, dy = o.y - c.y, ahead = dx * Math.cos(c.a) + dy * Math.sin(c.a), side = Math.abs(-dx * Math.sin(c.a) + dy * Math.cos(c.a));
        if (ahead > 0 && ahead < 32 && side < 2.4) { const gap = ahead - (c.len + (o.len || 4.3)) / 2 - 2.2; want = Math.min(want, Math.max(0, Math.sqrt(Math.max(0, 2 * 4.5 * gap)))); }
      }
      // doblar más despacio (y bastante más si el giro es cerrado)
      if (distEnd < 18) want = Math.min(want, Math.max(5, want * 0.7));
      if (c.plan && distEnd < 20 && Math.abs(c.plan.turn) > 0.5) want = Math.min(want, 3.6 + (distEnd / 20) * 3);
      const acc = want > c.v ? 2.6 : -6;
      c.brake = want < c.v - 0.3;
      c.v = Math.max(0, c.v + Math.max(-6 * dt, Math.min(acc * dt, want - c.v)));
      c.stuck = c.v < 0.2 ? c.stuck + dt : 0;
      let move = c.v * dt;
      while (move > 0) {
        const rem = (1 - c.t) * c.segL;
        if (move < rem) { c.t += move / c.segL; break; }
        move -= rem;
        if (!nextSeg(c)) { c.dead = true; return; }
        placeCar(c);
      }
      placeCar(c);
      // suavizado: el auto "corta" la esquina en curva en vez de girar de golpe
      const kk = 1 - Math.exp(-dt * 5.5), ox = c.x, oy = c.y;
      c.x += (c.tx - c.x) * kk; c.y += (c.ty - c.y) * kk;
      const mvx = c.x - ox, mvy = c.y - oy;
      if (mvx * mvx + mvy * mvy > 1e-4) { const want = Math.atan2(mvy, mvx); c.a += angDiff(want - c.a) * Math.min(1, dt * 9); }
      else c.a += angDiff(c.ta - c.a) * Math.min(1, dt * 4);
    }

    // ---------- tu auto ----------
    function startCar() {
      // arranca en la calle más cercana al centro del mapa
      let best = null, bd = 1e12;
      G.roads.forEach((r, ri) => { if (r.k > 6) return; r.p.forEach(([x, y], i) => { const d = x * x + y * y; if (d < bd && i < r.p.length - 1) { bd = d; best = [ri, i]; } }); });
      const r = G.roads[best[0]], A = r.p[best[1]], B = r.p[best[1] + 1], a = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const off = r.o ? 0 : Math.min(r.w / 4, 3.2);
      me = { fuel: 1, x: (A[0] + B[0]) / 2 - Math.sin(a) * off, y: (A[1] + B[1]) / 2 + Math.cos(a) * off, a, vf: 0, vr: 0, steer: 0, len: VEH[veh].len, wid: VEH[veh].wid, type: VEH[veh].t, V: VEH[veh], c: SKIN[H.get().skin] || '#d3202a', inLight: null };
      camX = me.x; camY = me.y;
    }
    function resetToRoad() {
      const nr = nearestRoad(me.x, me.y) || nearestRoad(me.x + 30, me.y) || null;
      if (!nr) { startCar(); return; }
      me.x = nr.px; me.y = nr.py; me.a = nr.ang; me.vf = me.vr = 0;
    }
    function carStep(dt) {
      const thr = keys.up ? 1 : 0, brk = keys.down ? 1 : 0, hb = keys.hb;
      const V = me.V, maxS = V.steer / (1 + Math.abs(me.vf) / 8);
      const target = ((keys.left ? -1 : 0) + (keys.right ? 1 : 0)) * maxS;
      me.steer += (target - me.steer) * Math.min(1, dt * 7);
      const wet = isRain() ? 0.68 : 1;
      let a = 0;
      const empty = me.fuel <= 0;
      if (thr && !empty) a += me.vf < -0.3 ? 9 : V.acc * Math.max(0, 1 - me.vf / V.vmax);
      me.fuel = Math.max(0, me.fuel - (Math.abs(me.vf) * dt * (thr ? 1.25 : 0.7) + dt * 0.4) / (V.tank || 7000));
      if (empty && fuelWarn <= 0) { say('⛽ ¡Te quedaste sin nafta! R te lleva a la estación más cercana', true); fuelWarn = 6; }
      else if (me.fuel < 0.15 && fuelWarn <= 0) { say('⛽ Te queda poca nafta: buscá una estación (en el radar)', true); fuelWarn = 20; }
      fuelWarn -= dt;
      // cargar nafta: frenado al lado de una estación
      filling = false;
      inBay = false;
      { const L = lotAt(me.x, me.y); if (L) for (const b of L.st.bays) if (L.u > b.u0 + 0.6 && L.u < b.u1 - 0.6 && L.v > b.v0 + 0.2 && L.v < b.v1 - 0.2) { inBay = true; if (Math.abs(me.vf) < 0.5 && me.fuel < 1) { me.fuel = Math.min(1, me.fuel + dt * 0.12); filling = true; if (me.fuel >= 1) say('⛽ Tanque lleno'); } break; }
        if (L && !inBay && me.fuel < 0.95 && fuelWarn <= 0) { say('Pará dentro de un recuadro amarillo, al lado del surtidor'); fuelWarn = 6; } }
      if (brk) a += me.vf > 0.3 ? -9.5 * wet : -3 * (me.vf > -6 ? 1 : 0);
      if (hb) a += me.vf > 0 ? -4 : 4;
      a -= 0.25 * Math.sign(me.vf) + 0.0009 * me.vf * Math.abs(me.vf) * 2;
      if (!thr && !brk && Math.abs(me.vf) < 0.25) me.vf = 0;
      me.vf += a * dt;
      // giro según volante y velocidad, con límite de agarre
      let omega = me.vf / V.wb * Math.tan(me.steer);
      const grip = (hb ? 4.5 : V.grip) * wet;
      if (Math.abs(omega * me.vf) > grip) { const ex = Math.abs(omega * me.vf) - grip; omega = Math.sign(omega) * grip / Math.max(0.1, Math.abs(me.vf)); me.vr -= Math.sign(omega * me.vf) * ex * dt * 0.6; }
      if (hb && Math.abs(me.vf) > 4) omega *= 1.35;
      me.a += omega * dt;
      me.vr *= Math.exp(-(hb ? 1.2 : 7 * wet) * dt);
      const px = me.x, py = me.y;
      me.x += (Math.cos(me.a) * me.vf - Math.sin(me.a) * me.vr) * dt;
      me.y += (Math.sin(me.a) * me.vf + Math.cos(me.a) * me.vr) * dt;
      // marcas de frenada
      if ((Math.abs(me.vr) > 2 || (brk && me.vf > 8)) && skids.length < 900) for (const s of [-0.75, 0.75]) skids.push([me.x - Math.cos(me.a) * 1.4 - Math.sin(me.a) * s, me.y - Math.sin(me.a) * 1.4 + Math.cos(me.a) * s]);
      // por la calle y el borde de la vereda (hasta SIDE metros pasado el cordón); en la vereda se va más lento
      { const q = nearestRoad(me.x, me.y); if (q && q.d > 0 && !lotAt(me.x, me.y) && Math.abs(me.vf) > 6) me.vf *= 1 - dt * 0.8; }
      // se revisan las 4 puntas del auto: ninguna puede pasar el cordón
      let worst = 0, nx = 0, ny = 0;
      const cA = Math.cos(me.a), sA = Math.sin(me.a);
      for (const [fx, fy] of [[me.len / 2, me.wid / 2], [me.len / 2, -me.wid / 2], [-me.len / 2, me.wid / 2], [-me.len / 2, -me.wid / 2]]) {
        const qx = me.x + cA * fx - sA * fy, qy = me.y + sA * fx + cA * fy;
        if (lotAt(qx, qy)) continue;
        const q = nearestRoad(qx, qy);
        if (!q) { worst = 99; break; }
        if (q.d > worst) { worst = q.d; const dd = Math.hypot(qx - q.px, qy - q.py) || 0.001; nx = (qx - q.px) / dd; ny = (qy - q.py) / dd; }
      }
      if (worst === 99) { me.x = px; me.y = py; me.vf *= -0.2; me.vr = 0; }
      else if (worst > SIDE) {
        me.x -= nx * (worst - SIDE + 0.02); me.y -= ny * (worst - SIDE + 0.02);
        const ca2 = Math.cos(me.a), sa2 = Math.sin(me.a);
        let vx = ca2 * me.vf - sa2 * me.vr, vy = sa2 * me.vf + ca2 * me.vr;
        const vn = vx * nx + vy * ny;
        if (vn > 0) { vx -= nx * vn * 1.3; vy -= ny * vn * 1.3; if (vn > 7) crash('¡Te subiste al cordón!'); }
        me.vf = (vx * ca2 + vy * sa2) * 0.985; me.vr = -vx * sa2 + vy * ca2;
      }
      // guiños: se apagan solos después de doblar
      if ((blink.l || blink.r) && Math.abs(angDiff(me.a - blink.a0)) > 1.1 && Math.abs(me.steer) < 0.08) { blink.l = blink.r = false; }
      // choques con casas
      const ca = Math.cos(me.a), sa = Math.sin(me.a), hl = me.len / 2 - 0.2, hw = me.wid / 2 - 0.1;
      for (const [fx, fy] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) {
        if (inBuilding(me.x + ca * fx - sa * fy, me.y + sa * fx + ca * fy)) { me.x = px; me.y = py; if (Math.abs(me.vf) > 4) crash('¡Chocaste contra una casa!'); me.vf *= -0.25; me.vr = 0; break; }
      }
      // choques con autos
      for (const c of cars) {
        const dx = c.x - me.x, dy = c.y - me.y, d = Math.hypot(dx, dy), minD = 1 + (c.len + me.len) / 5;
        if (d < minD && d > 0) {
          const push = (minD - d), ux = dx / d, uy = dy / d;
          me.x -= ux * push; me.y -= uy * push;
          if (Math.abs(me.vf) > 3) crash('¡Choque!');
          me.vf *= 0.35; c.v = 0;
        }
      }
      // semáforos: ¿cruzaste en rojo?
      let inside = null;
      for (const L of G.lights.values()) { if (Math.abs(L.x - me.x) < L.maxW && Math.abs(L.y - me.y) < L.maxW && Math.hypot(L.x - me.x, L.y - me.y) < L.maxW / 2 + 1) { inside = L; break; } }
      if (inside && me.inLight !== inside && me.vf > 2) {
        const ap = approachOf(inside, Math.cos(me.a), Math.sin(me.a));
        if (ap && lightState(inside, ap.g) === 'r') { stats.red++; say('🚦 ¡Cruzaste en rojo!', true); if (job) job.red++; }
      }
      me.inLight = inside;
    }
    let lastCrash = 0;
    function crash(t) { if (clock - lastCrash < 1.2) return; lastCrash = clock; stats.crash++; if (job) job.crash++; say(t, true); }
    function say(t, bad) { toastEl.textContent = t; toastEl.className = 'br-toast on' + (bad ? ' bad' : ''); toastT = 2.2; }

    // ---------- entregas ----------
    function newJob() {
      const opts = [];
      for (const [n] of G.links) { if (G.deg(n) < 2) continue; const [x, y] = G.nodePos(n), d = Math.hypot(x - me.x, y - me.y); if (d > 450 && d < 1400) opts.push([x, y, d]); }
      if (!opts.length) for (const [n] of G.links) { const [x, y] = G.nodePos(n), d = Math.hypot(x - me.x, y - me.y); if (d > 150) opts.push([x, y, d]); }
      const [x, y, d] = opts[Math.floor(Math.random() * opts.length)];
      const nr = nearestRoad(x, y);
      job = { x, y, street: nr && nr.r.n ? nr.r.n : 'una esquina', time: Math.round(d * 1.45 / 9 + 25), red: 0, crash: 0 };
      say(`📦 Nueva entrega: ${job.street} (${(d / 1000).toFixed(1)} km)`);
    }
    function jobStep(dt) {
      if (!job) return;
      job.time -= dt;
      if (Math.hypot(job.x - me.x, job.y - me.y) < 14 && Math.abs(me.vf) < 6) {
        const p = Math.max(20, Math.round(100 + job.time * 3 - job.red * 25 - job.crash * 15));
        stats.pts += p; stats.done++; const s = H.get(); s.done = (s.done || 0) + 1; if (stats.pts > (s.best || 0)) s.best = stats.pts; H.set(s);
        say(`✅ ¡Entregado! +${p} puntos`); job = null; setTimeout(() => { if (state === 'run' && mode === 'entregas') newJob(); }, 1500);
      } else if (job.time <= 0) { say('⏰ Se te pasó el tiempo de esa entrega', true); job = null; setTimeout(() => { if (state === 'run' && mode === 'entregas') newJob(); }, 1500); }
    }

    // ---------- bucle ----------
    function step(dt) {
      clock += dt;
      carStep(dt);
      for (const c of cars) aiStep(c, dt);
      cars = cars.filter(c => !c.dead && c.stuck < 40 && Math.hypot(c.x - me.x, c.y - me.y) < 520);
      const want = Math.min(75, 32 + Math.round(G.roads.length / 20));
      if (cars.length < want) spawnCar(true);
      if (mode === 'entregas') jobStep(dt);
      if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.className = 'br-toast'; }
      const spd = Math.abs(me.vf);
      const z = Math.max(5.5, 12 - spd * 0.3) * (Math.min(W, Hh) / 700);
      zoom += (z - zoom) * Math.min(1, dt * 1.5);
      camX += (me.x + Math.cos(me.a) * me.vf * 0.9 - camX) * Math.min(1, dt * 3);
      camY += (me.y + Math.sin(me.a) * me.vf * 0.9 - camY) * Math.min(1, dt * 3);
    }
    // ---------- dibujos de los vehículos (vista desde arriba, con brillo y sombras) ----------
    const SPR = new Map(), PX = 22;
    function shade(hex, k) { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(r)},${f(g)},${f(b)})`; }
    function sprite(T, col, L, Wd) {
      const key = T + col + L + Wd; let cvs = SPR.get(key); if (cvs) return cvs;
      cvs = document.createElement('canvas'); cvs.width = Math.ceil((L + 0.6) * PX); cvs.height = Math.ceil((Wd + 0.6) * PX);
      const g = cvs.getContext('2d'); g.scale(PX, PX); g.translate(L / 2 + 0.3, Wd / 2 + 0.3);
      const body = (x0, x1, y0, y1, rf, rr) => { g.beginPath(); g.moveTo(x0 + rr, y0); g.lineTo(x1 - rf, y0); g.quadraticCurveTo(x1, y0, x1, y0 + rf); g.lineTo(x1, y1 - rf); g.quadraticCurveTo(x1, y1, x1 - rf, y1); g.lineTo(x0 + rr, y1); g.quadraticCurveTo(x0, y1, x0, y1 - rr); g.lineTo(x0, y0 + rr); g.quadraticCurveTo(x0, y0, x0 + rr, y0); g.closePath(); };
      const paint = (x0, x1, y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, shade(col, -0.28)); gr.addColorStop(0.22, shade(col, 0.08)); gr.addColorStop(0.5, shade(col, 0.18)); gr.addColorStop(0.78, shade(col, 0.08)); gr.addColorStop(1, shade(col, -0.28)); return gr; };
      const wheels = (xs, w) => { g.fillStyle = '#141414'; for (const x of xs) for (const sd of [-1, 1]) g.fillRect(x - 0.33, sd * (w / 2) - 0.13 - (sd < 0 ? 0 : 0.0), 0.66, 0.26); };
      const glass = (pts, light) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); const gr = g.createLinearGradient(pts[0][0], 0, pts[2][0], 0); gr.addColorStop(0, light ? '#4a5d74' : '#1d2836'); gr.addColorStop(1, '#0e151f'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 0.04; g.stroke(); };
      const lights = (x1, x0, w) => { g.fillStyle = '#fff4cc'; g.fillRect(x1 - 0.12, -w / 2 + 0.12, 0.1, 0.38); g.fillRect(x1 - 0.12, w / 2 - 0.5, 0.1, 0.38); g.fillStyle = '#8a1a1a'; g.fillRect(x0 + 0.02, -w / 2 + 0.12, 0.1, 0.36); g.fillRect(x0 + 0.02, w / 2 - 0.48, 0.1, 0.36); };
      const hl = L / 2, hw = Wd / 2;
      if (T === 'moto') {
        g.fillStyle = '#111'; g.beginPath(); g.ellipse(hl - 0.32, 0, 0.32, 0.1, 0, 0, TAU); g.ellipse(-hl + 0.32, 0, 0.32, 0.1, 0, 0, TAU); g.fill();
        g.fillStyle = paint(-0.3, 0.3, -0.3, 0.3); g.beginPath(); g.ellipse(0.25, 0, 0.42, 0.2, 0, 0, TAU); g.fill();
        g.fillStyle = '#2a2a2a'; g.beginPath(); g.ellipse(-0.25, 0, 0.38, 0.16, 0, 0, TAU); g.fill();
        g.strokeStyle = '#b8bcc2'; g.lineWidth = 0.06; g.beginPath(); g.moveTo(hl - 0.55, -0.4); g.lineTo(hl - 0.62, 0.4); g.stroke();
        g.fillStyle = '#3b3f46'; g.beginPath(); g.ellipse(-0.12, 0, 0.22, 0.34, 0, 0, TAU); g.fill();
        const hg = g.createRadialGradient(-0.05, -0.05, 0.02, 0, 0, 0.22); hg.addColorStop(0, '#fff'); hg.addColorStop(1, col); g.fillStyle = hg; g.beginPath(); g.arc(0, 0, 0.2, 0, TAU); g.fill();
        g.fillStyle = '#fff4cc'; g.fillRect(hl - 0.1, -0.08, 0.08, 0.16);
      } else if (T === 'bus' || T === 'truck') {
        const isBus = T === 'bus';
        wheels(isBus ? [hl - 1.6, -hl + 2.2] : [hl - 1.2, -hl + 1.4, -hl + 2.6], Wd);
        if (isBus) {
          body(-hl, hl, -hw, hw, 0.5, 0.3); g.fillStyle = paint(-hl, hl, -hw, hw); g.fill();
          g.fillStyle = 'rgba(20,30,42,.75)'; g.fillRect(-hl + 0.7, -hw + 0.12, L - 1.6, 0.28); g.fillRect(-hl + 0.7, hw - 0.4, L - 1.6, 0.28);
          glass([[hl - 0.15, -hw + 0.18], [hl - 0.15, hw - 0.18], [hl - 0.55, hw - 0.22], [hl - 0.55, -hw + 0.22]], true);
          g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-hl * 0.2, -0.55, 1.4, 1.1); g.fillRect(-hl * 0.75, -0.45, 1.0, 0.9);
          g.fillStyle = shade(col === '#e8e2d0' ? '#2f6b4f' : col, -0.3); g.fillRect(-hl + 0.5, -0.08, L - 1.4, 0.16);
        } else {
          body(-hl, hl * 0.42, -hw, hw, 0.15, 0.15); g.fillStyle = paint(-hl, hl, -hw, hw).constructor ? (() => { const gr = g.createLinearGradient(0, -hw, 0, hw); gr.addColorStop(0, '#bdbdb8'); gr.addColorStop(0.5, '#f4f4f0'); gr.addColorStop(1, '#bdbdb8'); return gr; })() : '#eee'; g.fill();
          g.strokeStyle = 'rgba(0,0,0,.12)'; g.lineWidth = 0.05; for (let x = -hl + 0.6; x < hl * 0.42; x += 0.6) { g.beginPath(); g.moveTo(x, -hw + 0.1); g.lineTo(x, hw - 0.1); g.stroke(); }
          body(hl * 0.46, hl, -hw + 0.05, hw - 0.05, 0.4, 0.12); g.fillStyle = paint(0, 0, -hw, hw); g.fill();
          glass([[hl - 0.18, -hw + 0.22], [hl - 0.18, hw - 0.22], [hl - 0.62, hw - 0.28], [hl - 0.62, -hw + 0.28]], true);
        }
        lights(hl, -hl, Wd);
      } else {
        const sport = T === 'sport', pick = T === 'pickup';
        wheels([hl - (sport ? 0.85 : 0.8), -hl + (pick ? 1.05 : 0.85)], Wd - 0.05);
        body(-hl, hl, -hw, hw, sport ? 0.9 : 0.7, sport ? 0.5 : 0.45); g.fillStyle = paint(-hl, hl, -hw, hw); g.fill();
        g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 0.05; g.stroke();
        // capó con líneas, parabrisas, techo, luneta
        const ws0 = sport ? hl * 0.18 : hl * 0.28, ws1 = sport ? -hl * 0.05 : hl * 0.05, rf1 = pick ? -hl * 0.18 : -hl * 0.45, rw = pick ? -hl * 0.26 : -hl * 0.62;
        g.strokeStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.moveTo(hl - 0.2, -hw * 0.45); g.lineTo(ws0 + 0.1, -hw * 0.5); g.moveTo(hl - 0.2, hw * 0.45); g.lineTo(ws0 + 0.1, hw * 0.5); g.stroke();
        glass([[ws0, -hw + 0.22], [ws0, hw - 0.22], [ws1, hw - 0.12], [ws1, -hw + 0.12]], true);
        g.fillStyle = shade(T === 'taxi' ? '#f2c21b' : col, T === 'taxi' ? 0 : 0.12); g.beginPath(); g.roundRect(rf1, -hw + 0.14, ws1 - rf1, Wd - 0.28, 0.2); g.fill();
        if (T === 'taxi') { g.fillStyle = '#fff'; g.fillRect(rf1 + (ws1 - rf1) * 0.4, -0.22, 0.32, 0.44); g.fillStyle = '#c0392b'; g.fillRect(rf1 + (ws1 - rf1) * 0.4 + 0.05, -0.15, 0.22, 0.3); }
        if (T === 'police') { g.fillStyle = '#1f3f9a'; g.fillRect(-hl + 0.4, -hw + 0.02, L - 0.9, 0.18); g.fillRect(-hl + 0.4, hw - 0.2, L - 0.9, 0.18); }
        if (sport) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(-hl + 0.1, -0.3, L - 0.3, 0.17); g.fillRect(-hl + 0.1, 0.13, L - 0.3, 0.17); g.fillStyle = '#111'; g.fillRect(-hl + 0.05, -hw + 0.12, 0.22, Wd - 0.24); }
        if (pick) { g.fillStyle = shade(col, -0.35); g.beginPath(); g.roundRect(-hl + 0.18, -hw + 0.2, rw + hl - 0.25, Wd - 0.4, 0.15); g.fill(); g.strokeStyle = 'rgba(0,0,0,.25)'; for (let x = -hl + 0.5; x < rw; x += 0.35) { g.beginPath(); g.moveTo(x, -hw + 0.25); g.lineTo(x, hw - 0.25); g.stroke(); } }
        else glass([[rf1, -hw + 0.18], [rf1, hw - 0.18], [rw, hw - 0.26], [rw, -hw + 0.26]], false);
        // ventanillas laterales y espejos
        g.fillStyle = 'rgba(15,22,32,.7)'; g.fillRect(rf1, -hw + 0.06, ws1 - rf1, 0.09); g.fillRect(rf1, hw - 0.15, ws1 - rf1, 0.09);
        g.fillStyle = shade(col, -0.2); g.beginPath(); g.ellipse(ws0 - 0.05, -hw - 0.08, 0.14, 0.09, 0, 0, TAU); g.ellipse(ws0 - 0.05, hw + 0.08, 0.14, 0.09, 0, 0, TAU); g.fill();
        // brillo del sol en la chapa
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.ellipse(hl * 0.55, -hw * 0.35, hl * 0.25, 0.12, 0, 0, TAU); g.fill();
        lights(hl, -hl, Wd);
      }
      SPR.set(key, cvs); return cvs;
    }
    function drawCar(c, mine) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
      const L = c.len, Wd = c.wid;
      const T = c.type || (c.bus ? 'bus' : 'auto');
      // sombra suave y el dibujo del vehículo (hecho una sola vez por modelo y color)
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.roundRect(-L / 2 + 0.25, -Wd / 2 + 0.35, L + 0.3, Wd + 0.3, 0.8); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.roundRect(-L / 2 + 0.35, -Wd / 2 + 0.3, L, Wd, 0.6); ctx.fill();
      const sp = sprite(T, T === 'police' ? '#f2f2f2' : c.c, L, Wd, mine);
      ctx.drawImage(sp, -L / 2 - 0.3, -Wd / 2 - 0.3, L + 0.6, Wd + 0.6);
      if (T === 'police') { const f = (clock * 3) % 1 < 0.5, act = mine ? siren : true; ctx.fillStyle = act && f ? '#ff2a2a' : '#6a1414'; ctx.fillRect(-L * 0.06, -Wd / 2 + 0.3, 0.38, (Wd - 0.6) / 2); ctx.fillStyle = act && !f ? '#2a6bff' : '#14266a'; ctx.fillRect(-L * 0.06, 0, 0.38, (Wd - 0.6) / 2); if (act) { ctx.fillStyle = f ? 'rgba(255,40,40,.25)' : 'rgba(40,100,255,.25)'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); } }
      const brake = mine ? keys.down && me.vf > 0.5 : c.brake;
      const on = (clock * 2.6) % 1 < 0.5;
      const sigL = mine ? (blink.l || blink.haz) : (c.sig === -1 || c.haz), sigR = mine ? (blink.r || blink.haz) : (c.sig === 1 || c.haz);
      if (on) { ctx.fillStyle = '#ffae00'; if (sigL) { ctx.fillRect(L / 2 - 0.5, -Wd / 2 - 0.05, 0.45, 0.3); ctx.fillRect(-L / 2 + 0.05, -Wd / 2 - 0.05, 0.45, 0.3); } if (sigR) { ctx.fillRect(L / 2 - 0.5, Wd / 2 - 0.25, 0.45, 0.3); ctx.fillRect(-L / 2 + 0.05, Wd / 2 - 0.25, 0.45, 0.3); }
        ctx.fillStyle = 'rgba(255,174,0,.28)'; if (sigL) { ctx.beginPath(); ctx.arc(L / 2 - 0.3, -Wd / 2, 0.9, 0, TAU); ctx.arc(-L / 2 + 0.3, -Wd / 2, 0.9, 0, TAU); ctx.fill(); } if (sigR) { ctx.beginPath(); ctx.arc(L / 2 - 0.3, Wd / 2, 0.9, 0, TAU); ctx.arc(-L / 2 + 0.3, Wd / 2, 0.9, 0, TAU); ctx.fill(); } }
      ctx.fillStyle = brake ? '#ff2a2a' : '#7a1515'; ctx.fillRect(-L / 2, -Wd / 2 + 0.2, 0.3, 0.45); ctx.fillRect(-L / 2, Wd / 2 - 0.65, 0.3, 0.45);
      if (brake) { ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.arc(-L / 2, 0, 1.6, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    function drawLights() {
      for (const L of G.lights.values()) {
        if (Math.abs(L.x - camX) > W / zoom || Math.abs(L.y - camY) > Hh / zoom) continue;
        for (const a of L.apps) {
          if (!a.inbound) continue;
          const st = lightState(L, a.g), d = L.maxW / 2 + 3.6, rx = -a.uy, ry = a.ux;
          const x = L.x - a.ux * d + rx * (a.w / 2 + 1.4), y = L.y - a.uy * d + ry * (a.w / 2 + 1.4);
          ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(a.uy, a.ux));
          ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.roundRect(-0.6, -1.7, 1.2, 3.4, 0.3); ctx.fill();
          const col = { r: '#ff3b30', y: '#ffc400', g: '#30d158' }, ys = { r: -1.05, y: 0, g: 1.05 };
          for (const k of ['r', 'y', 'g']) { ctx.fillStyle = k === st ? col[k] : 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(0, ys[k], 0.42, 0, TAU); ctx.fill(); }
          ctx.fillStyle = st === 'r' ? 'rgba(255,59,48,.22)' : st === 'y' ? 'rgba(255,196,0,.2)' : 'rgba(48,209,88,.18)'; ctx.beginPath(); ctx.arc(0, ys[st], 1.5, 0, TAU); ctx.fill();
          ctx.restore();
        }
      }
    }
    const toScr = (x, y) => [W / 2 + (x - camX) * zoom, Hh / 2 + (y - camY) * zoom];
    function drawSigns() {
      ctx.save(); ctx.font = '700 11px system-ui, Segoe UI, sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const placed = [];
      for (const s2 of G.signs) {
        if (s2.ok === undefined) {
          // si por la forma de la esquina quedó sobre el asfalto, se corre hacia adentro de la manzana
          let k = 0; while (k < 12) { const q = nearestRoad(s2.x, s2.y); if (!q || q.d > 0.8) break; s2.x += s2.dx; s2.y += s2.dy; k++; }
          s2.ok = true;
        }
        const [sx, sy] = toScr(s2.x, s2.y); if (sx < -200 || sy < -80 || sx > W + 200 || sy > Hh + 80) continue;
        const lines = s2.names.map(n => n.length > 22 ? n.slice(0, 21) + '…' : n), w = Math.max(...lines.map(t => ctx.measureText(t).width)) + 12, hh = lines.length * 15 + 5;
        // el cartel crece hacia adentro de la vereda (lejos de las calles)
        const bx = s2.dx >= 0 ? sx + 3 : sx - 3 - w, by = s2.dy >= 0 ? sy + 3 : sy - 3 - hh;
        if (placed.some(r => bx < r[2] + 4 && bx + w > r[0] - 4 && by < r[3] + 4 && by + hh > r[1] - 4)) continue;
        placed.push([bx, by, bx + w, by + hh]);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(bx + 2, by + 2, w, hh);
        ctx.fillStyle = '#183a5c'; ctx.fillRect(bx, by, w, hh);
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 2.5, by + 2.5, w - 5, hh - 5);
        ctx.fillStyle = '#fff'; lines.forEach((t, i) => ctx.fillText(t, bx + 6, by + 10 + i * 15));
        ctx.fillStyle = '#cfd3d8'; ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#555'; ctx.stroke();
      }
      ctx.restore();
    }
    function drawNight() {
      if (!dark) dark = document.createElement('canvas');
      if (dark.width !== cv.width || dark.height !== cv.height) { dark.width = cv.width; dark.height = cv.height; }
      const g = dark.getContext('2d'), d = DPR;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over';
      g.fillStyle = isRain() ? 'rgba(10,14,26,.6)' : 'rgba(12,16,34,.52)'; g.fillRect(0, 0, dark.width, dark.height);
      g.setTransform(d, 0, 0, d, 0, 0); g.globalCompositeOperation = 'destination-out';
      const glow = (x, y, r, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
      const beam = (c, len, a) => {
        const [x, y] = toScr(c.x + Math.cos(c.a) * c.len / 2, c.y + Math.sin(c.a) * c.len / 2), L = len * zoom;
        const gr = g.createRadialGradient(x, y, 0, x, y, L); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.arc(x, y, L, c.a - 0.42, c.a + 0.42); g.closePath(); g.fill();
      };
      for (const [lx, ly] of G.lamps) { const [x, y] = toScr(lx, ly); if (x > -200 && y > -200 && x < W + 200 && y < Hh + 200) glow(x, y, 19 * zoom, 0.8); }
      for (const c of cars) { const [x, y] = toScr(c.x, c.y); if (x > -300 && y > -300 && x < W + 300 && y < Hh + 300) beam(c, 22, 0.75); }
      if (lights !== 'off') beam(me, lights === 'high' ? 50 : 32, 0.95);
      { const [x, y] = toScr(me.x, me.y); glow(x, y, 7 * zoom, 0.5); }
      for (const L of G.lights.values()) { const [x, y] = toScr(L.x, L.y); if (x > -100 && y > -100 && x < W + 100 && y < Hh + 100) glow(x, y, (L.maxW / 2 + 6) * zoom, 0.35); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(dark, 0, 0); ctx.restore();
      // brillos que se suman: alumbrado público, luces traseras y semáforos
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [lx, ly] of G.lamps) { const [x, y] = toScr(lx, ly); if (x < -40 || y < -40 || x > W + 40 || y > Hh + 40) continue; const gr = ctx.createRadialGradient(x, y, 0, x, y, 3 * zoom); gr.addColorStop(0, 'rgba(255,214,140,.55)'); gr.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 3 * zoom, 0, TAU); ctx.fill(); }
      for (const c of [...cars, me]) {
        const bx = c.x - Math.cos(c.a) * c.len / 2, by = c.y - Math.sin(c.a) * c.len / 2, [x, y] = toScr(bx, by); if (x < -40 || y < -40 || x > W + 40 || y > Hh + 40) continue;
        const br = c === me ? keys.down && me.vf > 0.5 : c.brake;
        ctx.fillStyle = br ? 'rgba(255,30,30,.5)' : 'rgba(255,30,30,.22)'; ctx.beginPath(); ctx.arc(x, y, (br ? 2.4 : 1.4) * zoom, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    function drawRain() {
      ctx.save();
      ctx.fillStyle = isNight() ? 'rgba(40,50,70,.12)' : 'rgba(70,80,95,.28)'; ctx.fillRect(0, 0, W, Hh);
      if (drops.length < 260) for (let i = drops.length; i < 260; i++) drops.push([Math.random() * W, Math.random() * Hh, 0.6 + Math.random() * 0.6]);
      ctx.strokeStyle = isNight() ? 'rgba(170,190,220,.35)' : 'rgba(220,230,245,.45)'; ctx.lineWidth = 1; ctx.beginPath();
      for (const dr of drops) { dr[0] -= 3 * dr[2]; dr[1] += 18 * dr[2]; if (dr[1] > Hh) { dr[1] = -10; dr[0] = Math.random() * (W + 80); } if (dr[0] < -10) dr[0] = W; ctx.moveTo(dr[0], dr[1]); ctx.lineTo(dr[0] + 2.5 * dr[2], dr[1] - 13 * dr[2]); }
      ctx.stroke();
      // salpicaduras en el piso
      ctx.fillStyle = 'rgba(220,230,245,.35)';
      for (let i = 0; i < 25; i++) { const x = Math.random() * W, y = Math.random() * Hh; ctx.fillRect(x, y, 3, 1); }
      ctx.restore();
    }
    function draw() {
      if (!G || !me) return;
      ctx.fillStyle = '#b9b3a6'; ctx.fillRect(0, 0, W, Hh);
      ctx.save();
      ctx.translate(W / 2, Hh / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
      const vx0 = camX - W / 2 / zoom, vy0 = camY - Hh / 2 / zoom, vx1 = camX + W / 2 / zoom, vy1 = camY + Hh / 2 / zoom;
      ctx.imageSmoothingEnabled = true;
      for (let tx = Math.floor(vx0 / TILE); tx <= Math.floor(vx1 / TILE); tx++) for (let ty = Math.floor(vy0 / TILE); ty <= Math.floor(vy1 / TILE); ty++) ctx.drawImage(tile(tx, ty), tx * TILE, ty * TILE, TILE, TILE);
      ctx.fillStyle = 'rgba(20,20,20,.35)'; for (const [x, y] of skids) ctx.fillRect(x - 0.15, y - 0.15, 0.3, 0.3);
      if (isRain()) {
        // charcos con reflejo y gotitas que caen
        for (const [px, py, pr, pa, q] of G.puddles) {
          if (px < vx0 - 8 || px > vx1 + 8 || py < vy0 - 8 || py > vy1 + 8) continue;
          ctx.save(); ctx.translate(px, py); ctx.rotate(pa);
          ctx.fillStyle = isNight() ? 'rgba(30,45,65,.7)' : 'rgba(60,80,105,.62)'; ctx.beginPath(); ctx.ellipse(0, 0, pr, pr * 0.55, 0, 0, TAU); ctx.ellipse(pr * 0.5, pr * 0.15, pr * 0.6, pr * 0.4, 0.4, 0, TAU); ctx.fill();
          ctx.fillStyle = 'rgba(200,220,240,.18)'; ctx.beginPath(); ctx.ellipse(-pr * 0.3, -pr * 0.15, pr * 0.45, pr * 0.12, 0, 0, TAU); ctx.fill();
          const ph = (clock * 1.3 + q * 7) % 1; ctx.strokeStyle = `rgba(220,235,250,${0.5 * (1 - ph)})`; ctx.lineWidth = 0.06; ctx.beginPath(); ctx.ellipse((q - 0.15) * pr * 2, 0, 0.2 + ph * 0.9, (0.2 + ph * 0.9) * 0.6, 0, 0, TAU); ctx.stroke();
          ctx.restore();
          // si pasás por arriba rápido: salpica y patina un poco
          if (Math.hypot(me.x - px, me.y - py) < pr && Math.abs(me.vf) > 6 && state === 'run') { if (splash.length < 120) for (let k2 = 0; k2 < 3; k2++) splash.push([me.x, me.y, (Math.random() - 0.5) * 8 - Math.cos(me.a) * 3, (Math.random() - 0.5) * 8 - Math.sin(me.a) * 3, 0.5]); me.vr += (Math.random() - 0.5) * 0.6; }
        }
        for (const sp2 of splash) { sp2[0] += sp2[2] * 0.016; sp2[1] += sp2[3] * 0.016; sp2[4] -= 0.016; }
        splash = splash.filter(sp2 => sp2[4] > 0);
        ctx.fillStyle = 'rgba(210,225,240,.6)'; for (const sp2 of splash) { ctx.beginPath(); ctx.arc(sp2[0], sp2[1], 0.12 + (0.5 - sp2[4]) * 0.3, 0, TAU); ctx.fill(); }
      }
      if (job) { const p = 1 + Math.sin(clock * 5) * 0.15; ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(job.x, job.y, 12 * p, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,214,10,.18)'; ctx.fill(); }
      for (const c of cars) if (c.x > vx0 - 12 && c.x < vx1 + 12 && c.y > vy0 - 12 && c.y < vy1 + 12) drawCar(c);
      drawCar(me, true);
      drawLights();
      ctx.restore();
      if (!isNight() && lights !== 'off') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const [x, y] = toScr(me.x + Math.cos(me.a) * me.len / 2, me.y + Math.sin(me.a) * me.len / 2), Lb = (lights === 'high' ? 40 : 24) * zoom; const gr = ctx.createRadialGradient(x, y, 0, x, y, Lb); gr.addColorStop(0, 'rgba(255,250,220,.13)'); gr.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, Lb, me.a - 0.4, me.a + 0.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (isNight()) drawNight();
      if (isRain()) drawRain();
      // viñeta suave en los bordes
      { const vg = ctx.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.45, W / 2, Hh / 2, Math.max(W, Hh) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh); }
      drawSigns();
      // flecha hacia la entrega
      if (job) {
        const dx = job.x - camX, dy = job.y - camY, sx = W / 2 + dx * zoom, sy = Hh / 2 + dy * zoom;
        if (sx < 20 || sy < 20 || sx > W - 20 || sy > Hh - 20) {
          const a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - 34;
          ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r); ctx.rotate(a);
          ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-5, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      }
      // radar redondo estilo GPS: gira con el auto (siempre para adelante es arriba)
      if (G) {
        const R = 74, cx = W - R - 18, cy = Hh - R - 18, RANGE = 260, k = R / RANGE;
        const TH = { dia: { bg: 'rgba(238,240,243,.94)', road: '#a7adb5', ave: '#e0a400', park: 'rgba(110,170,90,.5)', rim: '#ffffff' },
          lluvia: { bg: 'rgba(196,215,235,.94)', road: '#7f93ab', ave: '#3d6fb0', park: 'rgba(90,150,120,.45)', rim: '#e8f1fb' },
          noche: { bg: 'rgba(14,17,26,.92)', road: 'rgba(190,198,210,.7)', ave: '#e8c15a', park: 'rgba(70,120,70,.45)', rim: 'rgba(255,255,255,.8)' },
          noche_lluvia: { bg: 'rgba(16,58,58,.92)', road: '#8fd6cc', ave: '#e8f6a0', park: 'rgba(60,140,110,.5)', rim: '#a6efe4' } }[wx];
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fillStyle = TH.bg; ctx.fill();
        ctx.clip();
        ctx.translate(cx, cy); ctx.rotate(-me.a - Math.PI / 2); ctx.scale(k, k); ctx.translate(-me.x, -me.y);
        const near = G.inRect(me.x - RANGE, me.y - RANGE, me.x + RANGE, me.y + RANGE);
        for (const pk of G.parks) { if (pk.bb[2] < me.x - RANGE || pk.bb[0] > me.x + RANGE || pk.bb[3] < me.y - RANGE || pk.bb[1] > me.y + RANGE) continue; ctx.beginPath(); pk.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.fillStyle = TH.park; ctx.fill(); }
        ctx.lineCap = ctx.lineJoin = 'round';
        for (const pass of [0, 1]) for (const r of near.roads) {
          const big = r.k <= 3; if ((pass === 1) !== big) continue;
          ctx.beginPath(); r.p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
          ctx.strokeStyle = big ? TH.ave : TH.road; ctx.lineWidth = (big ? 4.5 : 2.6) / k; ctx.stroke();
        }
        for (const st of G.stations) { ctx.fillStyle = '#1f9d55'; ctx.beginPath(); ctx.arc(st.rx, st.ry, 7 / k, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = `${8 / k}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(st.rx, st.ry); ctx.rotate(me.a + Math.PI / 2); ctx.fillText('⛽', 0, 0.5 / k); ctx.restore(); }
        if (job) { ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(job.x, job.y, 6 / k, 0, TAU); ctx.fill(); }
        ctx.restore();
        // destino fuera del radar: flechita en el borde
        if (job) {
          const dx = job.x - me.x, dy = job.y - me.y, d = Math.hypot(dx, dy);
          if (d > RANGE * 0.92) { const a2 = Math.atan2(dy, dx) - me.a - Math.PI / 2; ctx.save(); ctx.translate(cx + Math.cos(a2) * (R - 9), cy + Math.sin(a2) * (R - 9)); ctx.rotate(a2); ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-5, -6); ctx.lineTo(-5, 6); ctx.closePath(); ctx.fill(); ctx.restore(); }
        }
        // tu auto en el centro, y la N que marca el norte
        ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6.5, 7); ctx.lineTo(0, 3.5); ctx.lineTo(-6.5, 7); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
        const na = -me.a - Math.PI / 2 - Math.PI / 2;
        ctx.save(); ctx.translate(cx + Math.cos(na) * (R - 1), cy + Math.sin(na) * (R - 1)); ctx.fillStyle = '#d6413a'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', 0, 0.5); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.strokeStyle = TH.rim; ctx.lineWidth = 2.5; ctx.stroke();
        if (dash === 'clasico') drawGauges();
        else if (dash === 'radar') {
          // nafta como anillo alrededor del radar y la velocidad abajo
          const f = me.fuel, colF = f < 0.15 ? '#ff3b30' : f < 0.35 ? '#f5b52e' : '#30d158';
          ctx.lineCap = 'round'; ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(cx, cy, R + 8, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
          ctx.strokeStyle = colF; ctx.beginPath(); ctx.arc(cx, cy, R + 8, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * Math.max(0.001, f)); ctx.stroke(); ctx.lineCap = 'butt';
          ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('⛽', cx + Math.cos(Math.PI * 0.75) * (R + 8) - 4, cy + Math.sin(Math.PI * 0.75) * (R + 8) + 10);
          const kmh = Math.round(Math.abs(me.vf) * 3.6), t = String(kmh);
          const px2 = cx - R - 46, py2 = cy + R - 30;
          ctx.fillStyle = 'rgba(16,20,28,.9)'; ctx.beginPath(); ctx.roundRect(px2 - 34, py2 - 22, 68, 44, 16); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.fillStyle = '#fff'; ctx.font = '800 22px system-ui'; ctx.fillText(t, px2, py2 - 4); ctx.font = '600 9px system-ui'; ctx.fillStyle = '#aab1c2'; ctx.fillText('km/h', px2, py2 + 14);
          if (filling) { ctx.fillStyle = '#30d158'; ctx.font = '800 12px system-ui'; ctx.fillText('Cargando…', cx, cy - R - 44); }
          ctx.font = '13px system-ui'; ctx.globalAlpha = lights === 'off' ? 0.35 : 1; ctx.fillText(lights === 'high' ? '💡💡' : '💡', cx - R - 4, cy - R + 4); ctx.globalAlpha = 1;
        } else {
          const kmh = Math.round(Math.abs(me.vf) * 3.6), f = me.fuel, bx = 20, by = Hh - 74;
          ctx.fillStyle = 'rgba(16,20,28,.88)'; ctx.beginPath(); ctx.roundRect(bx, by, 132, 56, 14); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '800 28px ui-monospace, Consolas, monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(kmh).padStart(3, ' '), bx + 12, by + 33);
          ctx.font = '600 10px system-ui'; ctx.fillStyle = '#aab1c2'; ctx.fillText('km/h', bx + 76, by + 31);
          ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(bx + 12, by + 42, 108, 6); ctx.fillStyle = f < 0.15 ? '#ff3b30' : f < 0.35 ? '#f5b52e' : '#30d158'; ctx.fillRect(bx + 12, by + 42, 108 * f, 6);
          ctx.font = '11px system-ui'; ctx.fillStyle = '#fff'; ctx.fillText(lights === 'off' ? '' : lights === 'high' ? '💡💡' : '💡', bx + 100, by + 20);
          if (filling) { ctx.fillStyle = '#30d158'; ctx.font = '800 12px system-ui'; ctx.fillText('Cargando…', bx + 140, by + 47); }
        }
        if (job) { const t = `📦 ${(Math.hypot(job.x - me.x, job.y - me.y) / 1000).toFixed(2)} km`; ctx.font = '700 12px system-ui'; const tw = ctx.measureText(t).width + 16; ctx.fillStyle = 'rgba(16,20,28,.86)'; ctx.beginPath(); ctx.roundRect(cx - tw / 2, cy - R - 30, tw, 22, 11); ctx.fill(); ctx.fillStyle = '#ffd60a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, cx, cy - R - 19); }
      }
    }
    function drawGauges() {
      const R = 64, cx = 22 + R, cy = Hh - R - 18, V = me.V, top = Math.ceil(V.vmax * 3.6 / 20) * 20, kmh = Math.abs(me.vf) * 3.6;
      const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = (v) => a0 + (a1 - a0) * Math.min(1, v / top);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); const bg = ctx.createRadialGradient(cx, cy - 10, 5, cx, cy, R); bg.addColorStop(0, '#2a303c'); bg.addColorStop(1, '#10141c'); ctx.fillStyle = bg; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.stroke();
      // zona roja
      ctx.beginPath(); ctx.arc(cx, cy, R - 7, ang(top * 0.82), a1); ctx.strokeStyle = '#d6413a'; ctx.lineWidth = 4; ctx.stroke();
      ctx.fillStyle = '#dfe3ea'; ctx.font = '700 9.5px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let v = 0; v <= top; v += 10) {
        const a = ang(v), big = v % 20 === 0, r1 = R - 5, r2 = R - (big ? 13 : 9);
        ctx.strokeStyle = big ? '#fff' : 'rgba(255,255,255,.55)'; ctx.lineWidth = big ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke();
        if (big && (top <= 140 || v % 40 === 0)) ctx.fillText(v, cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22));
      }
      // aguja
      const na = ang(kmh); ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx - Math.cos(na) * 8, cy - Math.sin(na) * 8); ctx.lineTo(cx + Math.cos(na) * (R - 12), cy + Math.sin(na) * (R - 12)); ctx.stroke();
      ctx.fillStyle = '#2a2f38'; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '800 17px system-ui'; ctx.fillText(Math.round(kmh), cx, cy + 26); ctx.font = '600 9px system-ui'; ctx.fillStyle = '#aab1c2'; ctx.fillText('km/h', cx, cy + 40);
      // nafta: arco al costado
      const fx = cx + R + 22, fy = cy - 6, fh = R * 1.2, f = me.fuel;
      ctx.fillStyle = 'rgba(16,20,28,.86)'; ctx.beginPath(); ctx.roundRect(fx - 11, fy - fh / 2 - 6, 22, fh + 30, 11); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      const col = f < 0.15 ? '#ff3b30' : f < 0.35 ? '#f5b52e' : '#30d158';
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(fx - 4, fy - fh / 2, 8, fh);
      ctx.fillStyle = col; ctx.fillRect(fx - 4, fy - fh / 2 + fh * (1 - f), 8, fh * f);
      ctx.fillStyle = '#fff'; ctx.font = '700 8px system-ui'; ctx.fillText('F', fx, fy - fh / 2 - 0.5 + 0); ctx.fillText('E', fx, fy + fh / 2 + 7);
      ctx.font = '12px system-ui'; ctx.fillText('⛽', fx, fy + fh / 2 + 18);
      if (filling) { ctx.fillStyle = '#30d158'; ctx.font = '800 12px system-ui'; ctx.textAlign = 'left'; ctx.fillText('Cargando…', fx + 16, fy); }
      // estado de las luces
      ctx.textAlign = 'center'; ctx.font = '13px system-ui'; ctx.globalAlpha = lights === 'off' ? 0.35 : 1; ctx.fillText(lights === 'high' ? '💡💡' : '💡', cx, cy - R - 10); ctx.globalAlpha = 1;
      ctx.restore();
    }
    function hudPaint() {
      const nr = nearestRoad(me.x, me.y), street = nr && nr.d < 4 && nr.r.n ? nr.r.n : '';
      const kmh = Math.round(Math.abs(me.vf) * 3.6);
      let h2 = '';
      if (street) h2 += `<span>📍 ${street.replace(/</g, '')}</span>`;
      if (mode === 'entregas' && job) h2 += `<span>📦 ${job.street.replace(/</g, '')} · ${(Math.hypot(job.x - me.x, job.y - me.y) / 1000).toFixed(2)} km · ${Math.max(0, Math.ceil(job.time))} s</span>`;
      h2 += `<span>🚦 ${stats.red}</span><span>💥 ${stats.crash}</span>`;
      if (mode === 'entregas') h2 += `<span>${stats.pts} pts</span>`;
      hud.innerHTML = h2;
    }
    function frame(t) {
      const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016); lastT = t;
      if (state === 'run') { step(dt); draw(); hudPaint(); }
      raf = requestAnimationFrame(frame);
    }
    function run() { cancelAnimationFrame(raf); lastT = 0; raf = requestAnimationFrame(frame); }

    // ---------- elegir zona ----------
    async function loadMap(id) {
      msg.hidden = false; msg.textContent = 'Preparando el mapa…';
      const m = await host.map.get(id);
      if (!m) { msg.hidden = true; return menu('No pude abrir ese mapa. Bajalo de nuevo.'); }
      await new Promise(r => setTimeout(r, 30));
      G = prepare(m); tiles.clear(); mapId = id; const s = H.get(); s.map = id; H.set(s);
      buildMini(); startCar(); autoLights(); cars = []; skids = []; stats = { red: 0, crash: 0, done: 0, pts: 0 }; job = null;
      for (let i = 0; i < 30; i++) spawnCar(false);
      window.__barrioG = G; window.__barrio = { cars: () => cars.map(c => [Math.round(c.x), Math.round(c.y), +c.v.toFixed(1)]), me: () => me, lights: () => [...G.lights.values()].map(L => [L.x, L.y]) };
      msg.hidden = true; closeOver(root); state = 'run'; fit();
      H.status([m.name.split(',').slice(0, 2).join(','), `${G.lights.size} semáforos`]);
      if (mode === 'entregas') newJob(); else say('Paseo libre: andá por donde quieras');
      run();
    }
    async function menu(err) {
      state = 'menu'; cancelAnimationFrame(raf); closeOver(root);
      const box = h('div', { class: 'mg-over br-menu' });
      const card = h('div', { class: 'mg-over-card br-card' });
      box.append(card); root.append(box);
      card.append(h('b', { text: 'Manejá por tu barrio' }), h('span', { text: 'Elegí tu zona: se bajan las calles reales (OpenStreetMap) y queda guardado para jugar sin internet.' }));
      if (err) card.append(h('p', { class: 'br-err', text: err }));
      if (!host.map) { card.append(h('p', { class: 'br-err', text: 'Este juego necesita Base 2.27 o más nueva. Actualizá Base y volvé a abrirlo.' })); return; }
      const saved = await host.map.list().catch(() => []);
      if (saved.length) {
        const ul = h('div', { class: 'br-list' });
        for (const s of saved) {
          const row = h('div', { class: 'br-row' }, h('button', { class: 'mg-btn primary', type: 'button', text: '▶ ' + s.name.split(',').slice(0, 3).join(',') }), h('small', { text: (s.size / 1048576).toFixed(1) + ' MB' }));
          row.firstChild.onclick = () => loadMap(s.id);
          const del = h('button', { class: 'mg-btn', type: 'button', text: 'Borrar', title: 'Borrar este mapa' }); del.onclick = async () => { await host.map.remove(s.id); menu(); };
          row.append(del); ul.append(row);
        }
        card.append(h('small', { class: 'br-sub', text: 'Tus zonas guardadas' }), ul);
      }
      const inp = h('input', { class: 'br-in', type: 'text', placeholder: 'Calle y altura, barrio o ciudad (ej.: Av. Corrientes 1500, CABA)' });
      let rad = 5000;
      const radSeg = seg([['1500', '1,5 km'], ['3000', '3 km'], ['5000', '5 km']], '5000', (v) => { rad = +v; });
      const go = h('button', { class: 'mg-btn primary', type: 'button', text: 'Buscar' });
      const res = h('div', { class: 'br-list' }), info = h('p', { class: 'br-info' });
      const search = async () => {
        const q = inp.value.trim(); if (q.length < 3) return;
        res.replaceChildren(h('small', { text: 'Buscando…' }));
        const r = await host.map.search(q).catch((e) => ({ ok: false, error: e.message }));
        res.replaceChildren();
        if (!r.ok) { res.append(h('small', { class: 'br-err', text: r.error || 'No pude buscar' })); return; }
        if (!r.list.length) { res.append(h('small', { text: 'No encontré esa dirección. Probá con la ciudad (ej.: "Av. Corrientes 1500, CABA").' })); return; }
        for (const x of r.list) {
          const b = h('button', { class: 'br-res', type: 'button', text: x.name });
          b.onclick = async () => {
            res.replaceChildren(); info.textContent = 'Bajando las calles… puede tardar un minuto (o dos si elegiste 5 km).';
            const d = await host.map.download({ lat: x.lat, lon: x.lon, r: rad, name: x.name }).catch((e) => ({ ok: false, error: e.message }));
            if (!d.ok) { info.textContent = ''; res.append(h('small', { class: 'br-err', text: d.error || 'No pude bajar el mapa' })); return; }
            info.textContent = `Listo: ${d.map.roads} calles y ${d.map.signals} semáforos.`;
            loadMap(d.map.id);
          };
          res.append(b);
        }
      };
      go.onclick = search; inp.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); search(); } };
      card.append(h('small', { class: 'br-sub', text: saved.length ? 'O bajá otra zona' : 'Tu zona' }), h('div', { class: 'br-search' }, inp, go), h('div', { class: 'br-rad' }, h('small', { text: 'Radio:' }), radSeg), res, info);
      if (host.map.onProgress && !menu.hooked) { menu.hooked = true; host.map.onProgress((t) => { const i = root.querySelector('.br-info'); if (i) i.textContent = t; }); }
      setTimeout(() => inp.focus(), 50);
    }

    // ---------- controles ----------
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', ' ': 'hb' };
    const keyUp = (e) => { const k = KEYS[e.key]; if (k) keys[k] = false; };
    addEventListener('keyup', keyUp);
    const key = (e) => {
      if ((e.key === 'p' || e.key === 'P') && state === 'pause') { msg.hidden = true; state = 'run'; return true; }
      if (state !== 'run') return false;
      if (e.key === 'r' || e.key === 'R') {
        if (me.fuel <= 0.02 && G.stations.length) { const st = G.stations.slice().sort((a, b) => Math.hypot(a.rx - me.x, a.ry - me.y) - Math.hypot(b.rx - me.x, b.ry - me.y))[0]; const b0 = st.bays[0], bu = (b0.u0 + b0.u1) / 2, bv = (b0.v0 + b0.v1) / 2; me.x = st.ex + st.ux * bu + st.vx * bv; me.y = st.ey + st.uy * bu + st.vy * bv; me.a = st.ang; me.vf = me.vr = 0; me.fuel = 0.08; if (mode === 'entregas') stats.pts = Math.max(0, stats.pts - 30); say('🚛 La grúa te dejó en la estación (−30 pts). Quedate quieto para cargar'); return true; }
        resetToRoad(); say('Volviste a la calle'); return true;
      }
      if (e.key === 'q' || e.key === 'Q') { blink.l = !blink.l; blink.r = false; blink.a0 = me.a; return true; }
      if (e.key === 'e' || e.key === 'E') { blink.r = !blink.r; blink.l = false; blink.a0 = me.a; return true; }
      if (e.key === 'b' || e.key === 'B') { blink.haz = !blink.haz; say(blink.haz ? 'Balizas prendidas' : 'Balizas apagadas'); return true; }
      if ((e.key === 'n' || e.key === 'N') && me.type === 'police') { siren = !siren; say(siren ? '🚨 Sirena prendida' : 'Sirena apagada'); return true; }
      if (e.key === 'l' || e.key === 'L') { lights = lights === 'off' ? 'low' : lights === 'low' ? 'high' : 'off'; say('💡 ' + LIGHTS[lights]); return true; }
      if (e.key === 'p' || e.key === 'P') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; keys = {}; return true; }
      const k = KEYS[e.key]; if (!k) return false; keys[k] = true; return true;
    };
    const tools = [
      pick('Clima', Object.entries(WX), wx, (v) => { wx = v; const s = H.get(); s.wx = v; H.set(s); autoLights(); }),
      pick('Tablero', Object.entries(DASH), dash, (v) => { dash = v; const s = H.get(); s.dash = v; H.set(s); }),
      pick('Vehículo', Object.entries(VEH).map(([k, v]) => [k, v.n]), veh, (v) => { veh = v; const s = H.get(); s.veh = v; H.set(s); if (me) { const V = VEH[v]; Object.assign(me, { len: V.len, wid: V.wid, type: V.t, V }); say(`Ahora manejás: ${V.n}`); } }),
      seg([['entregas', 'Entregas'], ['libre', 'Paseo libre']], mode, (v) => { mode = v; const s = H.get(); s.mode = v; H.set(s); job = null; if (state === 'run') { if (v === 'entregas') newJob(); else say('Paseo libre: andá por donde quieras'); } }),
      btn('Cambiar zona', () => menu()),
      btn('Volver a la calle', () => { if (state === 'run') resetToRoad(); })
    ];
    requestAnimationFrame(async () => {
      fit();
      if (host.map && mapId) { const list = await host.map.list().catch(() => []); if (list.some(x => x.id === mapId)) return loadMap(mapId); }
      menu();
    });
    return {
      el: root, tools, key,
      setSkin: (id) => { if (me) me.c = SKIN[id] || me.c; },
      help: '↑ acelerás · ↓ frenás (y marcha atrás) · ← → doblás · Espacio freno de mano · Q/E guiño izquierdo/derecho · B balizas · L luces altas · N sirena (patrullero) · R volvés a la calle · P pausa. Podés ir por el borde de la vereda, más despacio. Con lluvia frena y dobla peor.',
      hide: () => { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } keys = {}; },
      show: () => {}
    };
  }

  BM.register({
    id: 'barrio', n: 'Manejá por tu barrio', d: 'Tus calles reales vistas desde arriba, con semáforos, tránsito y entregas.', c: '#3a6b8f', create: barrio, skinLabel: 'Auto',
    skins: [['rojo', 'Rojo', '#d3202a'], ['azul', 'Azul', '#1f5fe0'], ['amarillo', 'Amarillo', '#f2c21b'], ['verde', 'Verde', '#1e9e4a'], ['negro', 'Negro', '#23262d'], ['blanco', 'Blanco', '#f2f2f2'], ['naranja', 'Naranja', '#ff7a1a']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#b9b3a6"/><path d="M0 22h64M0 46h64M20 0v64M46 0v64" stroke="#4b4e54" stroke-width="9"/><path d="M0 22h64M20 0v64" stroke="#e0b43a" stroke-width="0.8" stroke-dasharray="3 3"/><rect x="26" y="26" width="14" height="14" fill="#b0603c"/><rect x="4" y="4" width="10" height="12" fill="#8e8e8a"/><rect x="52" y="52" width="9" height="9" fill="#6f8f4e"/><rect x="28" y="19" width="9" height="5" rx="1.2" fill="#d3202a"/><rect x="43" y="30" width="5" height="9" rx="1.2" fill="#f2f2f2"/><circle cx="16" cy="18" r="2" fill="#30d158"/></svg>',
    best: (s) => s.done ? `${s.done} entregas · récord ${s.best || 0} pts` : 'Nunca jugaste'
  });
})();
