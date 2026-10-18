// Tienda de Base · Manejá por tu barrio (calles reales de OpenStreetMap, vista desde arriba)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, btn, overlay } = BM.util; const confetti = BM.util.confetti || (() => {});
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
    roads.forEach((r, ri) => { r.ri = ri; });
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
    G.addB = (b) => put(b.bb[0], b.bb[1], b.bb[2], b.bb[3], { b });
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
    G.nearCorner = (x, y, d) => nearestCorner(x, y, d) != null;
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
          apps.push({ ux: dx / L, uy: dy / L, w: r.w, ri, ow: !!r.o, inbound: !(r.o === 1 && j > i) && !(r.o === -1 && j < i) });
        }
      }
      if (apps.length < 3) continue;
      const a0 = Math.atan2(apps[0].uy, apps[0].ux);
      for (const a of apps) { const d = Math.abs(angDiff(Math.atan2(a.uy, a.ux) - a0)); a.g = (d < Math.PI / 4 || d > 3 * Math.PI / 4) ? 0 : 1; }
      G.lights.set(n, { n, x, y, apps, maxW, off: (li++ * 7.3) % 30 });
    }
    // una esquina puede tener varios nodos con semáforo (avenidas con dos manos separadas, o datos repetidos):
    // se agrupan en un solo cruce con el mismo ciclo, y los tramos cortos entre esos nodos no llevan semáforo propio
    {
      const Ls = [...G.lights.values()], par = Ls.map((_, i) => i), f = (i) => par[i] === i ? i : (par[i] = f(par[i]));
      for (let i = 0; i < Ls.length; i++) for (let j = i + 1; j < Ls.length; j++) if (Math.hypot(Ls[i].x - Ls[j].x, Ls[i].y - Ls[j].y) < 36) par[f(i)] = f(j);
      const groups = new Map(); Ls.forEach((L, i) => { const k = f(i); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(L); });
      for (const grp of groups.values()) {
        if (grp.length < 2) continue;
        const ref = grp[0], a0 = Math.atan2(ref.apps[0].uy, ref.apps[0].ux), mw = Math.max(...grp.map(L => L.maxW));
        for (const L of grp) {
          L.off = ref.off; L.cluster = grp; L.maxW = Math.max(L.maxW, Math.min(mw, L.maxW + 6));
          for (const a of L.apps) {
            const d = Math.abs(angDiff(Math.atan2(a.uy, a.ux) - a0)); a.g = (d < Math.PI / 4 || d > 3 * Math.PI / 4) ? 0 : 1;
            for (const O of grp) { if (O === L) continue; const dx = L.x - O.x, dy = L.y - O.y, dd = Math.hypot(dx, dy) || 1; if ((dx * a.ux + dy * a.uy) / dd > 0.9) { a.inner = true; break; } }
          }
        }
      }
    }
    // carteles con el nombre de las calles en las esquinas
    G.signs = [];
    for (const n of corners) {
      const seen = new Map();
      for (const [ri, i] of links.get(n)) {
        const r = roads[ri]; if (!r.n || r.k >= 7 || seen.has(r.n)) continue;
        const j = i < r.p.length - 1 ? i + 1 : i - 1; const [x0, y0] = r.p[i], [x1, y1] = r.p[j], ang = Math.atan2(y1 - y0, x1 - x0);
        // sentido de circulación (si es mano única): o=1 va hacia índices crecientes
        const flow = !r.o ? null : ((r.o === 1) === (j > i) ? ang : ang + Math.PI);
        seen.set(r.n, { n: r.n, ang, w: r.w, flow });
      }
      if (seen.size < 1) continue;
      const [x, y] = nodePos(n), list = [...seen.values()].slice(0, 2), cor = { used: [] };
      list.forEach((S, k) => { const O = list[1 - k] || { w: S.w }; G.signs.push({ x0: x, y0: y, ang: S.ang, w: S.w, ow: O.w, name: S.n, flow: S.flow, cor }); });
    }
    // faroles en las esquinas (se ven de noche)
    G.lampsCorner = corners.map(n => { const [x, y] = nodePos(n); let mw = 0; for (const [ri] of links.get(n)) mw = Math.max(mw, roads[ri].w); return [x + mw / 2 + 1.5, y - mw / 2 - 1.5]; });
    // estaciones de servicio: las reales del mapa (si vinieron) o en esquinas de avenidas, separadas ~700 m
    G.stations = [];
    // distancia al asfalto más cercano (sólo calles de verdad, no los caminitos internos)
    const roadDist = (x, y) => { const g = grid.get(key(Math.floor(x / C), Math.floor(y / C))); if (!g) return 99; let bd = 99; for (const sg of g.s) { const r = roads[Math.floor(sg / 65536)]; if (r.k > 6) continue; const i = sg % 65536, [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)); bd = Math.min(bd, Math.hypot(x - ax - dx * t, y - ay - dy * t) - r.w / 2); } return bd; };
    const nearSeg = (x, y) => { let best = null, bd = 1e9; const cx = Math.floor(x / C), cy = Math.floor(y / C); for (let i2 = -1; i2 <= 1; i2++) for (let j2 = -1; j2 <= 1; j2++) { const g = grid.get(key(cx + i2, cy + j2)); if (!g) continue; for (const sg of g.s) { const r = roads[Math.floor(sg / 65536)]; if (r.k > 6) continue; const i = sg % 65536, [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)), d = Math.hypot(x - ax - dx * t, y - ay - dy * t); if (d < bd) { bd = d; best = { r, i, px: ax + dx * t, py: ay + dy * t, ux: dx / Math.sqrt(L2), uy: dy / Math.sqrt(L2), side: Math.sign(dx * (y - ay) - dy * (x - ax)) || 1 }; } } } return best; };
    // la estación va en la manzana: la playa sale del cordón hacia adentro y no puede pisar ninguna otra calle
    const addStation = (x, y) => {
      const q = nearSeg(x, y); if (!q) return false;
      const { r, px, py, ux, uy } = q;
      for (const sh of [0, -8, 8, -16, 16, -26, 26, -36, 36]) for (const side of [q.side, -q.side]) {
        const vx = -uy * side, vy = ux * side, ex = px + ux * sh + vx * (r.w / 2), ey = py + uy * sh + vy * (r.w / 2);
        let ok = true;
        for (const u of [-16, -8, 0, 8, 16]) { for (const v of [2.2, 6, 10, 14, 17.5]) { if (roadDist(ex + ux * u + vx * v, ey + uy * u + vy * v) < 0.6) { ok = false; break; } } if (!ok) break; if (roadDist(ex + ux * u - vx * 1, ey + uy * u - vy * 1) > 0.3) { ok = false; break; } }
        if (!ok || G.stations.some(st => Math.hypot(st.ex - ex, st.ey - ey) < 45)) continue;
        const bays = [];
        for (const iu of [-5, 5]) for (const bv of [[6, 8.6], [10.4, 13]]) bays.push({ u0: iu - 3.6, u1: iu + 3.6, v0: bv[0], v1: bv[1] });
        G.stations.push({ ex, ey, ux, uy, vx, vy, ang: Math.atan2(uy, ux), bays, x: ex + vx * 8.5, y: ey + vy * 8.5, rx: ex + vx * 7.3, ry: ey + vy * 7.3 });
        return true;
      }
      return false;
    };
    for (const f of (m.fuel || [])) addStation(f[0] * S, f[1] * S);
    if (G.stations.length < 4) {
      const cands = corners.filter(n => links.get(n).some(([ri]) => roads[ri].k <= 3)).sort((a, b) => hsh(a % 100003, 7) - hsh(b % 100003, 7));
      for (const n of cands) {
        if (G.stations.length >= 14) break;
        const [x, y] = nodePos(n); if (G.stations.some(st => (st.x - x) ** 2 + (st.y - y) ** 2 < 700 * 700)) continue;
        // a unos 35 m de la esquina, sobre la avenida
        const av = links.get(n).find(([ri]) => roads[ri].k <= 3); const r = roads[av[0]], i = av[1], j = i < r.p.length - 1 ? i + 1 : i - 1, dx = r.p[j][0] - x, dy = r.p[j][1] - y, L = Math.hypot(dx, dy) || 1;
        addStation(x + dx / L * 35 - dy / L * (r.w / 2 + 8), y + dy / L * 35 + dx / L * (r.w / 2 + 8));
      }
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
          const off = r.k >= 5 ? r.w / 2 + 1.05 : r.w / 2 + 1.6;
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
    root.addEventListener('pointerdown', () => { try { SND.init(); } catch {} });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); if (state === 'edit') return editWheel(e); setZoom(zoomMul * Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
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
    const shopAt = (x, y) => { const L = lotAt(x, y); return !!L && L.u > 10.8 && L.u < 15.8 && L.v > 9.6 && L.v < 16.8; };
    const WX = { dia: 'Día', noche: 'Noche', lluvia: 'Lluvia', noche_lluvia: 'Noche con lluvia' };
    let wx = WX[H.get().wx] ? H.get().wx : 'dia';
    const isNight = () => wx === 'noche' || wx === 'noche_lluvia', isRain = () => wx === 'lluvia' || wx === 'noche_lluvia';
    let inBay = false, splash = [];
    let drops = [], dark = null, blink = { l: false, r: false, haz: false, a0: 0 }, lights = 'off', fuelWarn = 0, filling = false, repairing = false, smoke = [], wrongT = 0, wrongKind = '';
    const LIGHTS = { off: 'Luces apagadas', low: 'Luces bajas', high: 'Luces altas' };
    const autoLights = () => { if ((isRain() || isNight()) && lights === 'off') lights = 'low'; };
    let veh = VEH[H.get().veh] ? H.get().veh : 'auto', siren = false;
    const DASH = { clasico: 'Tablero clásico', radar: 'Alrededor del radar', digital: 'Digital chico' };
    let dash = DASH[H.get().dash] ? H.get().dash : 'clasico';
    let stats = { red: 0, crash: 0, done: 0, pts: 0 }, job = null, zoom = 5, camX = 0, camY = 0, mini = null;
    const CAMS = { norte: 'Norte arriba', gira: 'Gira con el auto' };
    let camMode = CAMS[H.get().cam] ? H.get().cam : 'norte', camRot = 0;
    const rotV = (x, y) => { const c = Math.cos(camRot), s2 = Math.sin(camRot); return [x * c - y * s2, x * s2 + y * c]; };

    // ---------- mosaicos del mapa (se dibujan una vez y se reusan) ----------
    const TILE = 64, RES = 8, tiles = new Map();
    let noise = null;
    function noisePattern() {
      if (noise) return noise;
      const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
      g.fillStyle = '#7f8a63'; g.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 1400; i++) { const v = Math.random(); g.fillStyle = v < 0.45 ? `rgba(60,72,40,${0.15 + v * 0.3})` : v < 0.8 ? `rgba(150,160,110,${(v - 0.4) * 0.35})` : `rgba(130,115,85,${(v - 0.8) * 1.2})`; g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 3); }
      noise = c; return c;
    }
    let asph = null;
    function asphaltPattern() {
      if (asph) return asph;
      const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d');
      for (let i = 0; i < 1400; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${0.12 + v * 0.2})` : `rgba(255,255,255,${(v - 0.5) * 0.12})`; g.fillRect(Math.random() * 96, Math.random() * 96, 1, 1); }
      asph = c; return c;
    }
    let bcv = null;
    // tipo de techo, altura y eje principal de cada casa (se calcula una sola vez)
    function bInfo(b) {
      let area = 0, cx = 0, cy = 0, best = 0, ax = 0; const p = b.p, n = p.length;
      for (let i = 0; i < n; i++) { const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % n], cr = x1 * y2 - x2 * y1; area += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr; const L = Math.hypot(x2 - x1, y2 - y1); if (L > best) { best = L; ax = Math.atan2(y2 - y1, x2 - x1); } }
      area /= 2; if (Math.abs(area) < 1e-6) { cx = (b.bb[0] + b.bb[2]) / 2; cy = (b.bb[1] + b.bb[3]) / 2; } else { cx /= 6 * area; cy /= 6 * area; }
      b.area = Math.abs(area); b.cx = cx; b.cy = cy; b.ax = ax;
      { const c0 = Math.cos(ax), s0 = Math.sin(ax); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [x, y] of p) { const u = (x - cx) * c0 + (y - cy) * s0, v = -(x - cx) * s0 + (y - cy) * c0; u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
        const A = (u1 - u0) / 2, B = (v1 - v0) / 2; if (b.area > 0.86 * 4 * A * B && A > 1.5 && B > 1.5) { const mu = (u0 + u1) / 2, mv = (v0 + v1) / 2; b.rect = { cx: cx + mu * c0 - mv * s0, cy: cy + mu * s0 + mv * c0, A, B }; } }
      const q = b.c;
      b.kind = b.gen ? (q < 0.62 ? 'teja' : q < 0.7 ? 'chapa' : 'losa') : b.area > 260 ? (q < 0.25 ? 'chapa' : 'losa') : q < 0.5 ? 'teja' : q < 0.62 ? 'chapa' : 'losa';
      b.h = b.area > 600 ? 6 + q * 10 : b.area > 200 ? 3 + q * 4 : 1.5 + q * 2;
    }
    // árbol visto desde arriba: copa en grupitos, con luz de arriba a la izquierda
    function drawTree(g, x, y, rr, q) {
      g.fillStyle = 'rgba(20,25,15,.28)'; g.beginPath(); g.ellipse(x + rr * 0.45, y + rr * 0.5, rr * 1.02, rr * 0.92, 0, 0, TAU); g.fill();
      const hue = 82 + q * 22, sat = 20 + q * 14, lit = 25 + q * 8;
      for (let k = 0; k < 7; k++) {
        const an = k * 1.05 + q * 7, d = k === 6 ? 0 : rr * 0.46 * (0.6 + ((k * 0.37 + q) % 1) * 0.5), cr = rr * (k === 6 ? 0.55 : 0.4 + ((k * 0.53 + q) % 1) * 0.2);
        const cx = x + Math.cos(an) * d, cy = y + Math.sin(an) * d, gr = g.createRadialGradient(cx - cr * 0.35, cy - cr * 0.4, cr * 0.1, cx, cy, cr * 1.05);
        gr.addColorStop(0, `hsl(${hue} ${sat}% ${lit + 12}%)`); gr.addColorStop(0.7, `hsl(${hue} ${sat}% ${lit}%)`); gr.addColorStop(1, `hsl(${hue} ${sat}% ${lit - 7}%)`);
        g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, cr, 0, TAU); g.fill();
      }
    }
    // techo a cuatro aguas: cada faldón con su sombra según de dónde viene la luz
    function hipRoof(bg, b, base) {
      let { cx, cy, A, B } = b.rect, rot = b.ax; if (B > A) { [A, B] = [B, A]; rot += Math.PI / 2; }
      bg.save(); bg.translate(cx, cy); bg.rotate(rot);
      const cr = Math.cos(rot), sr = Math.sin(rot), LX = -0.62, LY = -0.78, r0 = Math.max(0, A - B);
      const F = [[[[-A, -B], [A, -B], [r0, 0], [-r0, 0]], 0, -1], [[[-A, B], [A, B], [r0, 0], [-r0, 0]], 0, 1], [[[-A, -B], [-A, B], [-r0, 0]], -1, 0], [[[A, -B], [A, B], [r0, 0]], 1, 0]];
      for (const [pts, nx, ny] of F) {
        const wx = nx * cr - ny * sr, wy = nx * sr + ny * cr, k = 0.24 * (wx * LX + wy * LY);
        bg.beginPath(); pts.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.closePath(); bg.fillStyle = shade(base, k); bg.fill();
        bg.save(); bg.clip(); bg.strokeStyle = 'rgba(40,20,10,.13)'; bg.lineWidth = 0.09; bg.beginPath();
        if (ny) for (let v = -B; v < B; v += 0.45) { bg.moveTo(-A, v); bg.lineTo(A, v); } else for (let u = -A; u < A; u += 0.45) { bg.moveTo(u, -B); bg.lineTo(u, B); }
        bg.stroke(); bg.restore();
      }
      bg.strokeStyle = 'rgba(255,238,220,.32)'; bg.lineWidth = 0.16; bg.beginPath(); bg.moveTo(-r0, 0); bg.lineTo(r0, 0);
      for (const [x, y] of [[-A, -B], [-A, B]]) { bg.moveTo(x, y); bg.lineTo(-r0, 0); } for (const [x, y] of [[A, -B], [A, B]]) { bg.moveTo(x, y); bg.lineTo(r0, 0); } bg.stroke();
      bg.restore();
    }
    // en las cuadras donde el mapa no trae casas, se arman lotes con casas (siempre iguales para el mismo lugar)
    function inGreen(x, y) { for (const a of G.parks) if (x >= a.bb[0] && x <= a.bb[2] && y >= a.bb[1] && y <= a.bb[3] && pointInPoly(x, y, a.p)) return true; for (const a of G.water) if (x >= a.bb[0] && x <= a.bb[2] && y >= a.bb[1] && y <= a.bb[3] && pointInPoly(x, y, a.p)) return true; return false; }
    function nearRail(x, y) { for (const a of G.rails) { if (x < a.bb[0] - 8 || x > a.bb[2] + 8 || y < a.bb[1] - 8 || y > a.bb[3] + 8) continue; for (let i = 0; i < a.p.length - 1; i++) { const [ax, ay] = a.p[i], [bx, by] = a.p[i + 1], dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L2)); if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < 7) return true; } } return false; }
    function genHouses(x0, y0, x1, y1) {
      if (!G.genDone) G.genDone = new Set();
      const free = (x, y) => { const q = nearestRoad(x, y); return !!q && q.d >= 3.15 && !inBuilding(x, y) && !lotAt(x, y) && !inGreen(x, y); };
      for (const r of G.inRect(x0, y0, x1, y1).roads) {
        if (r.k < 2 || r.k > 6) continue;
        for (let i = 0; i < r.p.length - 1; i++) {
          const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], L = Math.hypot(bx - ax, by - ay); if (L < 16) continue;
          const ux = (bx - ax) / L, uy = (by - ay) / L;
          for (let s0 = 7; s0 < L - 7; s0 += 10) {
            const cx = ax + ux * s0, cy = ay + uy * s0; if (cx < x0 || cx > x1 || cy < y0 || cy > y1) continue;
            for (const side of [-1, 1]) {
              const kk = r.ri + ',' + i + ',' + s0 + ',' + side; if (G.genDone.has(kk)) continue; G.genDone.add(kk);
              const H2 = (n) => hsh(r.ri * 7919 + i * 31 + side * 3 + n, s0 * 13 + n * 101), q = H2(0);
              if (q < 0.07) continue;
              const nx = -uy * side, ny = ux * side, wid = 7.2 + H2(1) * 2.3, q3 = H2(2), set = q3 < 0.5 ? 0.3 + q3 * 2 : 1.5 + q3 * 3.5, dep = 9 + H2(3) * 9;
              const f0 = r.w / 2 + 3.3 + set, f1 = f0 + dep, P = (a, v) => [cx + ux * a + nx * v, cy + uy * a + ny * v];
              const pts = [P(-wid / 2, f0), P(wid / 2, f0), P(wid / 2, f1), P(-wid / 2, f1)];
              if (![...pts, P(0, (f0 + f1) / 2), P(0, f0), P(0, f1)].every(([x, y]) => free(x, y)) || nearRail(cx + nx * f1, cy + ny * f1)) continue;
              const bb = [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
              const b = { p: pts, bb, c: H2(4), gen: true, yard: { fences: [[P(-5, r.w / 2 + 3.3), P(-5, f1 + 7)], [P(5, r.w / 2 + 3.3), P(5, f1 + 7)]], front: [P(-5, r.w / 2 + 3.3), P(5, r.w / 2 + 3.3)] } };
              if (H2(5) < 0.5 && set > 1) b.drive = [P(wid / 2 - 2.9, r.w / 2 - 0.1), P(wid / 2 - 0.3, r.w / 2 - 0.1), P(wid / 2 - 0.3, f0), P(wid / 2 - 2.9, f0)];
              if (H2(6) > 0.86) { const pp = [P(-1.6, f1 + 1.6), P(1.6, f1 + 1.6), P(1.6, f1 + 6.4), P(-1.6, f1 + 6.4)]; if (pp.every(([x, y]) => free(x, y))) b.yard.pool = pp; }
              G.addB(b);
            }
          }
        }
      }
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
      genHouses(x0 - 40, y0 - 40, x1 + 40, y1 + 40);
      const inside = G.inRect(x0 - pad, y0 - pad, x1 + pad, y1 + pad);
      const path = (p, close) => { g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); };
      for (const a of G.parks) if (inT(a.bb)) {
        path(a.p, true); g.fillStyle = '#6c7f4c'; g.fill();
        // pasto cortado a franjas y árboles adentro
        g.save(); path(a.p, true); g.clip(); g.fillStyle = 'rgba(255,255,255,.05)';
        for (let yy = Math.floor(a.bb[1] / 6) * 6; yy < a.bb[3]; yy += 12) g.fillRect(a.bb[0], yy, a.bb[2] - a.bb[0], 6);
        for (let xx = Math.floor(a.bb[0] / 9) * 9; xx < a.bb[2]; xx += 9) for (let yy = Math.floor(a.bb[1] / 9) * 9; yy < a.bb[3]; yy += 9) {
          const q = hsh(xx, yy); if (q > 0.35 || xx < x0 - 6 || xx > x1 + 6 || yy < y0 - 6 || yy > y1 + 6) continue;
          const tx2 = xx + q * 8, ty2 = yy + (1 - q) * 8, rr = 2.2 + q * 4;
          drawTree(g, tx2, ty2, rr, q * 2.7 % 1);
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
      for (const r of near) { if (r.k >= 7) continue; path(r.p); g.strokeStyle = '#c3c0b8'; g.lineWidth = r.w + 6.2; g.stroke(); }
      // juntas de las baldosas
      for (const r of near) { if (r.k >= 7) continue; path(r.p); g.strokeStyle = 'rgba(70,65,55,.13)'; g.lineWidth = r.w + 6.2; g.setLineDash([0.07, 1.1]); g.lineCap = 'butt'; g.stroke(); g.setLineDash([]); g.lineCap = 'round';
        for (const off of [-(r.w / 2 + 2.1), r.w / 2 + 2.1]) { offPath(g, r.p, off); g.strokeStyle = 'rgba(70,65,55,.1)'; g.lineWidth = 0.06; g.stroke(); } }
      // en las calles de barrio, cantero de pasto entre la vereda y el cordón
      for (const r of near) { if (r.k < 5 || r.k >= 7) continue; for (const off of [-(r.w / 2 + 1.05), r.w / 2 + 1.05]) { offPath(g, r.p, off); g.strokeStyle = '#71824f'; g.lineWidth = 1.35; g.lineCap = 'butt'; g.stroke(); offPath(g, r.p, off); g.strokeStyle = 'rgba(40,55,25,.25)'; g.setLineDash([0.3, 0.5]); g.lineWidth = 1.1; g.stroke(); g.setLineDash([]); } g.lineCap = 'round'; }
      // entradas de autos de las casas (cortan el cantero)
      for (const b of inside.buildings) if (b.drive) { g.beginPath(); b.drive.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = '#bab7af'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 0.08; g.stroke(); }
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
          if (a.inner) continue;
          const d = L.maxW / 2 + 2.6, cx = L.x - a.ux * d, cy = L.y - a.uy * d, ang = Math.atan2(a.uy, a.ux);
          g.save(); g.translate(cx, cy); g.rotate(ang); g.fillStyle = 'rgba(238,238,232,.85)';
          for (let s = -a.w / 2 + 0.5; s < a.w / 2 - 0.4; s += 1.1) g.fillRect(-1.4, s, 2.8, 0.55);
          if (a.inbound && !a.inner) { if (a.ow) g.fillRect(-2.4, -a.w / 2 + 0.3, 0.4, a.w - 0.6); else g.fillRect(-2.4, 0, 0.4, a.w / 2 - 0.3); }
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
        // borde de la playa y canteros
        g.fillStyle = '#b9b3a7'; g.fillRect(-16.6, -0.6, 0.6, 17.6); g.fillRect(16, -0.6, 0.6, 17.6);
        g.fillStyle = '#5d7d3b'; g.fillRect(-16, 12.6, 3.6, 4); g.fillStyle = '#6f9145'; for (const [tu, tv] of [[-15, 13.6], [-13.4, 15.4], [-14.6, 15.8]]) { g.beginPath(); g.arc(tu, tv, 0.9, 0, TAU); g.fill(); }
        // minimercado al fondo
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(11.6, 10.4, 5, 7.2);
        g.fillStyle = '#e8e6e1'; g.fillRect(10.8, 9.6, 5, 7.2); g.fillStyle = '#d5d2cb'; g.fillRect(11.2, 10, 4.2, 6.4);
        g.fillStyle = '#1f6fd6'; g.fillRect(10.8, 9.6, 5, 0.8); g.fillStyle = '#f5c518'; g.fillRect(10.8, 10.4, 5, 0.25);
        g.fillStyle = '#9aa0a6'; g.fillRect(12, 12, 1.4, 1); g.fillRect(13.8, 14.2, 1, 1); g.fillStyle = '#7a8086'; g.fillRect(12.15, 12.15, 1.1, 0.7);
        g.fillStyle = 'rgba(150,200,240,.8)'; g.fillRect(10.8, 11.6, 0.25, 3.6);
        // aire y agua
        g.fillStyle = '#2e7d4f'; g.fillRect(-15.2, 9.2, 0.8, 0.8); g.fillStyle = '#fff'; g.fillRect(-15, 9.4, 0.4, 0.15);
        // techo (semitransparente para ver los autos abajo), con columnas y paneles de luz
        g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-10 + 1.6, 4.4 + 1.6, 20, 10);
        g.fillStyle = 'rgba(246,246,244,.7)'; g.fillRect(-10, 4.4, 20, 10);
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let u = -8.5; u < 9; u += 3.4) for (const v of [6.6, 11.6]) g.fillRect(u, v, 1.6, 0.5);
        g.strokeStyle = 'rgba(120,125,130,.6)'; g.lineWidth = 0.15; g.strokeRect(-10, 4.4, 20, 10);
        g.fillStyle = 'rgba(31,111,214,.9)'; g.fillRect(-10, 4.4, 20, 0.9); g.fillRect(-10, 13.5, 20, 0.9);
        g.fillStyle = 'rgba(245,197,24,.9)'; g.fillRect(-10, 5.3, 20, 0.2); g.fillRect(-10, 13.3, 20, 0.2);
        g.fillStyle = 'rgba(90,95,100,.7)'; for (const iu of [-5, 5]) for (const cu of [iu - 2.6, iu + 2.6]) g.fillRect(cu - 0.25, 9.25, 0.5, 0.5);
        // tótem de precios junto a la vereda
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-15 + 0.4, 0.2 + 0.4, 1.4, 3);
        g.fillStyle = '#1f6fd6'; g.fillRect(-15, 0.2, 1.4, 3); g.fillStyle = '#111'; g.fillRect(-14.8, 1.1, 1, 0.5); g.fillRect(-14.8, 1.9, 1, 0.5); g.fillRect(-14.8, 2.6, 1, 0.4);
        g.fillStyle = '#ffd34d'; g.fillRect(-14.7, 1.2, 0.8, 0.3); g.fillRect(-14.7, 2, 0.8, 0.3);

        // flechas de entrada y salida
        g.fillStyle = 'rgba(255,255,255,.75)'; for (const au of [-13, 13]) { g.beginPath(); g.moveTo(au, 1.5); g.lineTo(au + 0.9, 3.2); g.lineTo(au - 0.9, 3.2); g.closePath(); if (au > 0) { g.save(); g.translate(au, 2.35); g.rotate(Math.PI); g.translate(-au, -2.35); g.fill(); g.restore(); } else g.fill(); }
        g.restore();
        // cartel derecho (siempre se lee)
        const lx = st.ex + st.vx * 18.5, ly = st.ey + st.vy * 18.5;
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(lx - 5.2 + 0.4, ly - 1.6 + 0.4, 10.4, 3.2);
        g.fillStyle = '#1f6fd6'; g.fillRect(lx - 5.2, ly - 1.6, 10.4, 3.2); g.fillStyle = '#fff'; g.font = '800 1.7px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⛽ NAFTA', lx, ly + 0.1);
      }
      // casas y edificios: se dibujan aparte y después se borra lo que pisa la calle o la vereda
      if (!bcv) { bcv = document.createElement('canvas'); bcv.width = bcv.height = TILE * RES; }
      const bg = bcv.getContext('2d'); bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, bcv.width, bcv.height);
      bg.setTransform(RES, 0, 0, RES, -x0 * RES, -y0 * RES); bg.lineJoin = 'round';
      const bpath = (p) => { bg.beginPath(); p.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.closePath(); };
      const TILES = ['#8f5a46', '#7f5444', '#946651', '#7a5d52', '#865a48', '#6f6560'];
      const blds = inside.buildings.filter(b => !G.stations.some(st => b.bb[2] > st.x - 19 && b.bb[0] < st.x + 19 && b.bb[3] > st.y - 19 && b.bb[1] < st.y + 19 && [[b.bb[0], b.bb[1]], [b.bb[2], b.bb[3]], [b.bb[0], b.bb[3]], [b.bb[2], b.bb[1]], [(b.bb[0] + b.bb[2]) / 2, (b.bb[1] + b.bb[3]) / 2]].some(([qx, qy]) => { const dx = qx - st.ex, dy = qy - st.ey, u = dx * st.ux + dy * st.uy, v = dx * st.vx + dy * st.vy; return u > -17 && u < 17 && v > -1 && v < 18; })));
      for (const b of blds) { if (!b.kind) bInfo(b); }
      // patios: medianeras, frentes con reja y alguna pileta
      for (const b of blds) if (b.yard) {
        bg.strokeStyle = 'rgba(90,85,78,.55)'; bg.lineWidth = 0.18; bg.beginPath(); for (const [[ax, ay], [bx, by]] of b.yard.fences) { bg.moveTo(ax, ay); bg.lineTo(bx, by); } bg.stroke();
        const [[fx0, fy0], [fx1, fy1]] = b.yard.front; bg.strokeStyle = 'rgba(60,58,55,.7)'; bg.lineWidth = 0.28; bg.beginPath(); bg.moveTo(fx0, fy0); bg.lineTo(fx1, fy1); bg.stroke();
        if (b.yard.pool) { bpath(b.yard.pool); bg.fillStyle = '#d9d6cc'; bg.fill(); bg.save(); bg.translate(0, 0); const pp = b.yard.pool, cxp = (pp[0][0] + pp[2][0]) / 2, cyp = (pp[0][1] + pp[2][1]) / 2; bg.beginPath(); pp.forEach(([x, y], i) => { const X = cxp + (x - cxp) * 0.8, Y = cyp + (y - cyp) * 0.84; i ? bg.lineTo(X, Y) : bg.moveTo(X, Y); }); bg.closePath(); const gp = bg.createLinearGradient(pp[0][0], pp[0][1], pp[2][0], pp[2][1]); gp.addColorStop(0, '#5fa3b8'); gp.addColorStop(1, '#3f7f99'); bg.fillStyle = gp; bg.fill(); bg.restore(); }
      }
      // sombras (más largas cuanto más alto)
      for (const b of blds) { const o = 0.6 + b.h * 0.32; bg.save(); bg.translate(o, o * 0.9); bpath(b.p); bg.fillStyle = 'rgba(0,0,0,.2)'; bg.fill(); bg.restore(); bg.save(); bg.translate(o * 0.45, o * 0.4); bpath(b.p); bg.fillStyle = 'rgba(0,0,0,.14)'; bg.fill(); bg.restore(); }
      for (const b of blds) {
        const [bx0, by0, bx1, by1] = b.bb, R = Math.hypot(bx1 - bx0, by1 - by0) / 2 + 1;
        bg.save(); bpath(b.p); bg.clip();
        bg.translate(b.cx, b.cy); bg.rotate(b.ax);
        if (b.kind === 'teja' && b.rect) { bg.restore(); hipRoof(bg, b, TILES[(b.c * 97 | 0) % TILES.length]); bpath(b.p); bg.strokeStyle = 'rgba(0,0,0,.3)'; bg.lineWidth = 0.22; bg.stroke(); continue; }
        if (b.kind === 'teja') {
          bg.fillStyle = TILES[(b.c * 97 | 0) % TILES.length]; bg.fillRect(-R, -R, 2 * R, 2 * R);
          bg.strokeStyle = 'rgba(60,20,10,.22)'; bg.lineWidth = 0.12; bg.beginPath(); for (let v = -R; v < R; v += 0.55) { bg.moveTo(-R, v); bg.lineTo(R, v); } bg.stroke();
          bg.fillStyle = 'rgba(0,0,0,.2)'; bg.fillRect(-R, 0, 2 * R, R);
          bg.fillStyle = 'rgba(255,230,200,.12)'; bg.fillRect(-R, -R, 2 * R, R);
          bg.strokeStyle = 'rgba(255,240,220,.4)'; bg.lineWidth = 0.3; bg.beginPath(); bg.moveTo(-R, 0); bg.lineTo(R, 0); bg.stroke();
          if (b.c > 0.75) { bg.fillStyle = '#6d6a66'; bg.fillRect(b.c * 4 - 3, -1.6, 0.9, 0.9); }
        } else if (b.kind === 'chapa') {
          bg.fillStyle = b.c < 0.5 ? '#8a9096' : '#959a92'; bg.fillRect(-R, -R, 2 * R, 2 * R);
          bg.strokeStyle = 'rgba(255,255,255,.16)'; bg.lineWidth = 0.1; bg.beginPath(); for (let u = -R; u < R; u += 0.32) { bg.moveTo(u, -R); bg.lineTo(u, R); } bg.stroke();
          bg.fillStyle = 'rgba(0,0,0,.12)'; bg.fillRect(-R, 0, 2 * R, R);
        } else {
          // losa plana: membrana clara, pretil, tanque de agua y aire acondicionado
          bg.fillStyle = b.c < 0.3 ? '#b8b5ad' : b.c < 0.6 ? '#a9aaa6' : '#c3beb3'; bg.fillRect(-R, -R, 2 * R, 2 * R);
          bg.fillStyle = 'rgba(0,0,0,.05)'; for (let u = -R; u < R; u += 2) bg.fillRect(u, -R, 1, 2 * R);
          bg.rotate(-b.ax); bg.translate(-b.cx, -b.cy);
          bpath(b.p); bg.strokeStyle = 'rgba(255,255,255,.55)'; bg.lineWidth = 0.9; bg.stroke(); bpath(b.p); bg.strokeStyle = 'rgba(0,0,0,.18)'; bg.lineWidth = 1.6; bg.setLineDash([]); bg.globalCompositeOperation = 'source-atop'; bg.stroke(); bg.globalCompositeOperation = 'source-over';
          bg.translate(b.cx, b.cy); bg.rotate(b.ax);
          if (b.area > 30) {
            const tx = (b.c - 0.5) * 3, ty = (b.c * 7 % 1 - 0.5) * 2;
            bg.fillStyle = 'rgba(0,0,0,.28)'; bg.beginPath(); bg.arc(tx + 0.5, ty + 0.5, 0.85, 0, TAU); bg.fill();
            bg.fillStyle = '#2c2f33'; bg.beginPath(); bg.arc(tx, ty, 0.85, 0, TAU); bg.fill(); bg.fillStyle = '#4a4f55'; bg.beginPath(); bg.arc(tx - 0.2, ty - 0.2, 0.4, 0, TAU); bg.fill();
            bg.fillStyle = '#e9eaec'; bg.fillRect(-tx - 0.6, -ty + 0.8, 1.2, 0.8); bg.fillStyle = '#9aa0a6'; bg.fillRect(-tx - 0.4, -ty + 1, 0.5, 0.4);
          }
        }
        bg.restore();
        bpath(b.p); bg.strokeStyle = 'rgba(0,0,0,.3)'; bg.lineWidth = 0.22; bg.stroke();
      }
      // lo que cae sobre la calle o la vereda no se dibuja
      bg.globalCompositeOperation = 'destination-out'; bg.lineCap = bg.lineJoin = 'round';
      for (const r of near) { bg.beginPath(); r.p.forEach(([x, y], i) => i ? bg.lineTo(x, y) : bg.moveTo(x, y)); bg.strokeStyle = '#000'; bg.lineWidth = r.k >= 7 ? r.w + 1 : r.w + 6.2; bg.stroke(); }
      bg.globalCompositeOperation = 'source-over';
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(bcv, 0, 0); g.restore();
      // árboles de vereda
      for (const [x, y, rr] of G.trees) {
        if (x < x0 - 6 || x > x1 + 6 || y < y0 - 6 || y > y1 + 6) continue;
        if (lotAt(x, y)) continue;
        const q = hsh(x | 0, y | 0); drawTree(g, x, y, rr, q);
      }
      // tono general más sobrio (menos saturado)
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'saturation'; g.fillStyle = 'rgba(128,128,128,.22)'; g.fillRect(0, 0, t.width, t.height); g.restore();
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
    // una casa solo frena si no está pisando la calle o la vereda (los mapas a veces dibujan la casa hasta el cordón)
    function solidAt(x, y) { if (shopAt(x, y)) return true; if (!inBuilding(x, y)) return false; const q = nearestRoad(x, y); return !(q && q.d < 3.2); }
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
    const laneOff = (r, lane) => r.o ? lane * Math.min(r.w / 4, 1.8) : Math.min(r.w / 4, 3.2);
    // al doblar, el carril de entrada y el de salida se cruzan en un punto P: el auto deja el tramo viejo un poco antes
    // de la esquina y entra al nuevo un poco después (así no vuelve para atrás haciendo un rulo)
    function turnCut(c, o) {
      const r = G.roads[c.ri], A = r.p[c.i], B = r.p[c.i + c.dir], r2 = G.roads[o.ri], C2 = r2.p[o.i], D = r2.p[o.i + o.d];
      let u1x = B[0] - A[0], u1y = B[1] - A[1], l1 = Math.hypot(u1x, u1y) || 1; u1x /= l1; u1y /= l1;
      let u2x = D[0] - C2[0], u2y = D[1] - C2[1], l2 = Math.hypot(u2x, u2y) || 1; u2x /= l2; u2y /= l2;
      const lane2 = r2.o ? c.lane : 1, o1 = laneOff(r, c.lane), o2 = laneOff(r2, lane2);
      const n1x = -u1y * o1, n1y = u1x * o1, n2x = -u2y * o2, n2y = u2x * o2;
      const det = -u1x * u2y + u2x * u1y; if (Math.abs(det) < 0.25) return { end: 0, start: 0 };
      const bx = n2x - n1x, by = n2y - n1y, s1 = (-bx * u2y + u2x * by) / det, s2 = (u1x * by - u1y * bx) / det;
      return { end: Math.min(Math.max(0, -s1), l1 * 0.45, 9), start: Math.min(Math.max(0, s2), l2 * 0.45, 9) };
    }
    function placeCar(c) {
      const { r, A, B } = segOf(c), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const off = laneOff(r, c.lane);
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
      const o = c.plan || planTurn(c); c.plan = null; c.sig = 0; c.cut = null;
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
        const ap = approachOf(L, c.ux, c.uy), st = ap && !ap.inner ? lightState(L, ap.g) : 'g';
        const stopD = distEnd - (L.maxW / 2 + 4);
        if ((st === 'r' || (st === 'y' && stopD > 9)) && stopD > -1.5) want = Math.min(want, Math.sqrt(Math.max(0, 2 * 4 * (stopD - 0.5))));
      }
      // guiño antes de doblar
      if (distEnd < 30 && !c.plan) { c.plan = planTurn(c); c.cut = c.plan ? turnCut(c, c.plan) : null; c.sig = c.plan && G.deg(endNode) >= 3 ? (c.plan.turn > 0.45 ? 1 : c.plan.turn < -0.45 ? -1 : 0) : 0; }
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
      if (c.hazT > 0) { c.hazT -= dt; want = 0; if (c.hazT <= 0) c.haz = false; }
      const acc = want > c.v ? 2.6 : -6;
      c.brake = want < c.v - 0.3;
      c.v = Math.max(0, c.v + Math.max(-6 * dt, Math.min(acc * dt, want - c.v)));
      c.stuck = c.v < 0.2 ? c.stuck + dt : 0;
      let move = c.v * dt;
      while (move > 0) {
        const rem = (1 - c.t) * c.segL - (c.cut ? c.cut.end : 0);
        if (move < rem) { c.t += move / c.segL; break; }
        move -= Math.max(0, rem);
        const st0 = c.cut ? c.cut.start : 0;
        if (!nextSeg(c)) { c.dead = true; return; }
        c.cut = null; placeCar(c); c.t = Math.min(0.45, st0 / c.segL);
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
      me = { fuel: 1, x: (A[0] + B[0]) / 2 - Math.sin(a) * off, y: (A[1] + B[1]) / 2 + Math.cos(a) * off, a, vf: 0, vr: 0, steer: 0, len: VEH[veh].len, wid: VEH[veh].wid, type: VEH[veh].t, V: VEH[veh], c: SKIN[H.get().skin] || '#d3202a', inLight: null, dmg: 0, hits: [] };
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
      const target = ((keys.left ? -1 : 0) + (keys.right ? 1 : 0)) * maxS + ((me.dmg || 0) > 0.45 && Math.abs(me.vf) > 3 ? (me.dmg - 0.45) * 0.06 : 0);
      me.steer += (target - me.steer) * Math.min(1, dt * 7);
      const wet = isRain() ? 0.68 : 1;
      let a = 0;
      const empty = me.fuel <= 0;
      const vmx = V.vmax * (1 - (me.dmg || 0) * 0.4);
      if (thr && !empty) a += me.vf < -0.3 ? 9 : V.acc * (1 - (me.dmg || 0) * 0.3) * Math.max(0, 1 - me.vf / vmx);
      if (!race) me.fuel = Math.max(0, me.fuel - (Math.abs(me.vf) * dt * (thr ? 1.25 : 0.7) + dt * 0.4) / (V.tank || 7000));
      if (empty && fuelWarn <= 0) { say('⛽ ¡Te quedaste sin nafta! R te lleva a la estación más cercana', true); fuelWarn = 6; }
      else if (me.fuel < 0.15 && fuelWarn <= 0) { say('⛽ Te queda poca nafta: buscá una estación (en el radar)', true); fuelWarn = 20; }
      fuelWarn -= dt;
      // cargar nafta: frenado al lado de una estación
      filling = false; repairing = false;
      inBay = false;
      { const L = lotAt(me.x, me.y); if (L) for (const b of L.st.bays) if (L.u > b.u0 + 0.6 && L.u < b.u1 - 0.6 && L.v > b.v0 + 0.2 && L.v < b.v1 - 0.2) { inBay = true; if (Math.abs(me.vf) < 0.5 && me.dmg > 0) { me.dmg = Math.max(0, me.dmg - dt * 0.12); repairing = true; if (me.dmg === 0) { me.hits = []; say('🔧 Auto reparado'); } else if (me.hits.length && me.hits.length > Math.ceil(me.dmg * 14)) me.hits.shift(); } if (Math.abs(me.vf) < 0.5 && me.fuel < 1) { me.fuel = Math.min(1, me.fuel + dt * 0.12); filling = true; if (me.fuel >= 1) { say('⛽ Tanque lleno'); SND.blip(1320, 0.25, 'sine', 0.12); } } break; }
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
        if (vn > 0) { vx -= nx * vn * 1.3; vy -= ny * vn * 1.3; if (vn > 7) { crash('¡Te subiste al cordón!'); const [lx, ly] = toLocal(me, me.x + nx * 3, me.y + ny * 3); hurt(me, vn * 0.6, lx * 2, ly * 2); } }
        // apoyado contra el cordón: la trompa se acomoda a lo largo del cordón para poder seguir (no se traba)
        if (thr || brk) { const fx = Math.cos(me.a) * Math.sign(me.vf || (thr ? 1 : -1)), fy = Math.sin(me.a) * Math.sign(me.vf || (thr ? 1 : -1)); if (fx * nx + fy * ny > 0.05) { let tx = -ny, ty = nx; if (tx * fx + ty * fy < 0) { tx = -tx; ty = -ty; } const want = Math.atan2(ty, tx) + (me.vf < 0 || (!me.vf && !thr) ? Math.PI : 0); me.a += angDiff(want - me.a) * Math.min(1, dt * 3.2); } }
        me.vf = (vx * ca2 + vy * sa2) * Math.exp(-dt * 0.5); me.vr = -vx * sa2 + vy * ca2;
      }
      // contramano: calle de mano única al revés, o carril izquierdo en doble mano (no cuenta en los cruces)
      { const q = nearestRoad(me.x, me.y); let wrong = false;
        if (!race && q && q.d < 0 && me.vf > 2.5 && q.r.k < 7 && !lotAt(me.x, me.y) && !G.nearCorner(me.x, me.y, q.r.w * 0.6 + 7)) {
          const along = Math.cos(me.a - q.ang);
          if (q.r.o) { if ((q.r.o === 1 && along < -0.5) || (q.r.o === -1 && along > 0.5)) { wrong = true; wrongKind = 'Esta calle es de mano única'; } }
          else if (q.r.w >= 8) { const lat = (me.x - q.px) * -Math.sin(q.ang) + (me.y - q.py) * Math.cos(q.ang); if ((along > 0.5 && lat < -1) || (along < -0.5 && lat > 1)) { wrong = true; wrongKind = 'Vas por el carril contrario: andá por la derecha'; } }
        }
        wrongT = wrong ? wrongT + dt : Math.max(0, wrongT - dt * 3); }
      // guiños: se apagan solos después de doblar
      if ((blink.l || blink.r) && Math.abs(angDiff(me.a - blink.a0)) > 1.1 && Math.abs(me.steer) < 0.08) { blink.l = blink.r = false; }
      // choques con casas
      const ca = Math.cos(me.a), sa = Math.sin(me.a), hl = me.len / 2 - 0.2, hw = me.wid / 2 - 0.1;
      for (const [fx, fy] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) {
        if (solidAt(me.x + ca * fx - sa * fy, me.y + sa * fx + ca * fy)) { me.x = px; me.y = py; if (Math.abs(me.vf) > 4) { crash('¡Chocaste contra una casa!'); hurt(me, Math.abs(me.vf), fx, fy); } me.vf *= -0.25; me.vr = 0; break; }
      }
      // choques con autos
      for (const c of cars) {
        const dx = c.x - me.x, dy = c.y - me.y, d = Math.hypot(dx, dy), minD = 1 + (c.len + me.len) / 5;
        if (d < minD && d > 0) {
          const push = (minD - d), ux = dx / d, uy = dy / d;
          me.x -= ux * push; me.y -= uy * push;
          if (Math.abs(me.vf) > 3 && clock - (c.hitT || -9) > 0.8) {
            crash('¡Choque!'); c.hitT = clock; const sp = Math.abs(me.vf);
            const [lx, ly] = toLocal(me, c.x, c.y); hurt(me, sp, lx * 3, ly * 3);
            const [ox, oy] = toLocal(c, me.x, me.y); hurt(c, sp, ox * 3, oy * 3); if (!c.racer) { c.haz = true; c.hazT = 6; } else c.v *= 0.5;
          }
          me.vf *= 0.35; if (!c.racer) c.v = 0;
        }
      }
      // semáforos: ¿cruzaste en rojo?
      let inside = null;
      for (const L of G.lights.values()) { if (Math.abs(L.x - me.x) < L.maxW && Math.abs(L.y - me.y) < L.maxW && Math.hypot(L.x - me.x, L.y - me.y) < L.maxW / 2 + 1) { inside = L; break; } }
      if (inside && me.inLight !== inside && me.vf > 2 && !race) {
        const ap = approachOf(inside, Math.cos(me.a), Math.sin(me.a));
        if (ap && !ap.inner && lightState(inside, ap.g) === 'r') { stats.red++; say('🚦 ¡Cruzaste en rojo!', true); SND.blip(180, 0.35, 'sawtooth', 0.12); SND.blip(150, 0.45, 'sawtooth', 0.1); if (job) job.red++; }
      }
      me.inLight = inside;
    }
    let lastCrash = 0;
    // daños: abolladuras en el punto del golpe (coordenadas del vehículo), y el total 0..1
    function hurt(o, spd, lx, ly) {
      const sev = Math.max(0.02, Math.min(0.35, (spd - 2) / 32)); o.dmg = Math.min(1, (o.dmg || 0) + sev); if (o === me) SND.crash(sev * 2.5);
      const hx = Math.max(-o.len / 2, Math.min(o.len / 2, lx)), hy = Math.max(-o.wid / 2, Math.min(o.wid / 2, ly));
      (o.hits || (o.hits = [])).push([hx, hy, sev, Math.random()]); if (o.hits.length > 14) o.hits.shift();
    }
    const toLocal = (o, x, y) => { const dx = x - o.x, dy = y - o.y, c = Math.cos(o.a), s2 = Math.sin(o.a); return [dx * c + dy * s2, -dx * s2 + dy * c]; };
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
        say(`✅ ¡Entregado! +${p} puntos`); SND.blip(660, 0.18, 'triangle', 0.16); setTimeout(() => SND.blip(990, 0.3, 'triangle', 0.16), 140); job = null; setTimeout(() => { if (state === 'run' && mode === 'entregas') newJob(); }, 1500);
      } else if (job.time <= 0) { say('⏰ Se te pasó el tiempo de esa entrega', true); job = null; setTimeout(() => { if (state === 'run' && mode === 'entregas') newJob(); }, 1500); }
    }

    // ---------- bucle ----------
    let tickPh = false, zoomMul = Math.min(1.6, Math.max(0.45, +H.get().zoom || 1)), padRS = false, zoomSaveT = 0;
    function setZoom(v) { zoomMul = Math.min(1.6, Math.max(0.45, v)); clearTimeout(zoomSaveT); zoomSaveT = setTimeout(() => { const st = H.get(); st.zoom = +zoomMul.toFixed(2); H.set(st); }, 600); }
    function step(dt) {
      clock += dt;
      { const ph = (clock * 2.6) % 1 < 0.5; if (ph !== tickPh) { tickPh = ph; if (blink.l || blink.r || blink.haz) SND.blip(ph ? 2100 : 1500, 0.025, 'square', 0.05); } }
      if (race && race.t < 0) { keys.up = keys.down = false; }
      carStep(dt);
      if (race) raceStep(dt);
      else {
        for (const c of cars) aiStep(c, dt);
        cars = cars.filter(c => !c.dead && c.stuck < 40 && Math.hypot(c.x - me.x, c.y - me.y) < 520);
        const want = Math.min(75, 32 + Math.round(G.roads.length / 20));
        if (cars.length < want) spawnCar(true);
      }
      if (mode === 'entregas') jobStep(dt);
      if (toastT > 0) { toastT -= dt; if (toastT <= 0) toastEl.className = 'br-toast'; }
      const spd = Math.abs(me.vf);
      // zoom: automático según la velocidad, multiplicado por el que elegís (analógico derecho, rueda del mouse o + / -)
      { const gp = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
        if (gp) { const ry = gp.axes[3] || 0; if (Math.abs(ry) > 0.2) setZoom(zoomMul * Math.exp(-ry * dt * 1.6)); const rs = gp.buttons[11] && gp.buttons[11].pressed; if (rs && !padRS) setZoom(1); padRS = rs; } }
      const z = Math.min(30, Math.max(1.6, Math.max(5.5, 12 - spd * 0.3) * (Math.min(W, Hh) / 700) * zoomMul));
      zoom += (z - zoom) * Math.min(1, dt * 1.5);
      camX += (me.x + Math.cos(me.a) * me.vf * 0.9 - camX) * Math.min(1, dt * 3);
      camY += (me.y + Math.sin(me.a) * me.vf * 0.9 - camY) * Math.min(1, dt * 3);
      const tr = camMode === 'gira' ? -me.a - Math.PI / 2 : 0; camRot += angDiff(tr - camRot) * Math.min(1, dt * 3.2);
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
      if (c.hits && c.hits.length && T !== 'moto') drawDamage(c, L, Wd);
      const brake = mine ? keys.down && me.vf > 0.5 : c.brake;
      const on = (clock * 2.6) % 1 < 0.5;
      const sigL = mine ? (blink.l || blink.haz) : (c.sig === -1 || c.haz), sigR = mine ? (blink.r || blink.haz) : (c.sig === 1 || c.haz);
      if (on) { ctx.fillStyle = '#ffae00'; if (sigL) { ctx.fillRect(L / 2 - 0.5, -Wd / 2 - 0.05, 0.45, 0.3); ctx.fillRect(-L / 2 + 0.05, -Wd / 2 - 0.05, 0.45, 0.3); } if (sigR) { ctx.fillRect(L / 2 - 0.5, Wd / 2 - 0.25, 0.45, 0.3); ctx.fillRect(-L / 2 + 0.05, Wd / 2 - 0.25, 0.45, 0.3); }
        ctx.fillStyle = 'rgba(255,174,0,.28)'; if (sigL) { ctx.beginPath(); ctx.arc(L / 2 - 0.3, -Wd / 2, 0.9, 0, TAU); ctx.arc(-L / 2 + 0.3, -Wd / 2, 0.9, 0, TAU); ctx.fill(); } if (sigR) { ctx.beginPath(); ctx.arc(L / 2 - 0.3, Wd / 2, 0.9, 0, TAU); ctx.arc(-L / 2 + 0.3, Wd / 2, 0.9, 0, TAU); ctx.fill(); } }
      ctx.fillStyle = brake ? '#ff2a2a' : '#7a1515'; ctx.fillRect(-L / 2, -Wd / 2 + 0.2, 0.3, 0.45); ctx.fillRect(-L / 2, Wd / 2 - 0.65, 0.3, 0.45);
      if (brake) { ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.arc(-L / 2, 0, 1.6, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // abolladuras, rayones, ópticas rotas y parabrisas astillado
    function drawDamage(c, L, Wd) {
      ctx.save(); ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 0.5); ctx.clip();
      for (const [hx, hy, sev, sd] of c.hits) {
        const r = 0.35 + sev * 2;
        const gr = ctx.createRadialGradient(hx, hy, 0, hx, hy, r); gr.addColorStop(0, 'rgba(10,10,12,.72)'); gr.addColorStop(0.55, 'rgba(30,30,34,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(hx, hy, r * 1.25, r * 0.8, sd * 3, 0, TAU); ctx.fill();
        // chapa arrugada: pliegues oscuros y claros alrededor del golpe
        ctx.lineWidth = 0.05; for (let k = 0; k < 2 + sev * 9; k++) { const a = sd * 20 + k * 1.7, d0 = r * 0.25, d1 = r * (0.7 + ((k * 0.43 + sd) % 1) * 0.4); ctx.strokeStyle = k % 2 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.45)'; ctx.beginPath(); ctx.moveTo(hx + Math.cos(a) * d0, hy + Math.sin(a) * d0 * 0.8); ctx.lineTo(hx + Math.cos(a + 0.3) * (d0 + d1) / 2, hy + Math.sin(a - 0.2) * (d0 + d1) / 2 * 0.8); ctx.lineTo(hx + Math.cos(a) * d1, hy + Math.sin(a) * d1 * 0.8); ctx.stroke(); }
        // pintura saltada (se ve el metal / la masilla)
        ctx.fillStyle = 'rgba(190,192,196,.55)'; for (let k = 0; k < 3 + sev * 10; k++) { const a = sd * 40 + k * 2.1, d = r * (0.2 + ((k * 0.37 + sd) % 1) * 0.7); ctx.fillRect(hx + Math.cos(a) * d, hy + Math.sin(a) * d * 0.7, 0.12 + sev * 0.2, 0.05); }
        // rayones a lo largo de la chapa
        ctx.strokeStyle = 'rgba(225,228,232,.6)'; ctx.lineWidth = 0.035; ctx.beginPath();
        for (let k = 0; k < 2 + sev * 8; k++) { const oy = (k - 2) * 0.07 + (sd - 0.5) * 0.2, len = 0.4 + sev * 2 + ((k * 0.61 + sd) % 1) * 0.5; ctx.moveTo(hx - len / 2, hy + oy); ctx.lineTo(hx + len / 2, hy + oy + (sd - 0.5) * 0.08); }
        ctx.stroke();
        // óptica rota si el golpe fue adelante o atrás
        if (sev > 0.08 && Math.abs(hx) > L / 2 - 0.9) {
          const fx = hx > 0 ? L / 2 - 0.25 : -L / 2 + 0.05, fy = hy < 0 ? -Wd / 2 + 0.12 : Wd / 2 - 0.5;
          ctx.fillStyle = '#1a1a1a'; ctx.fillRect(fx, fy, 0.2, 0.38);
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(fx + 0.05, fy + 0.1, 0.05, 0.05); ctx.fillRect(fx + 0.1, fy + 0.25, 0.04, 0.04);
        }
      }
      // parabrisas astillado cuando el daño es grande
      if ((c.dmg || 0) > 0.35) {
        const wx = L / 2 * 0.17, s0 = c.hits[0][3];
        ctx.strokeStyle = 'rgba(235,240,245,.75)'; ctx.lineWidth = 0.03; ctx.beginPath();
        for (let k = 0; k < 7; k++) { const a = k * 0.9 + s0 * 6; ctx.moveTo(wx, (s0 - 0.5) * 0.6); ctx.lineTo(wx + Math.cos(a) * 0.45, (s0 - 0.5) * 0.6 + Math.sin(a) * 0.55); }
        ctx.stroke(); ctx.beginPath(); ctx.arc(wx, (s0 - 0.5) * 0.6, 0.18, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
    function drawLights() {
      for (const L of G.lights.values()) {
        if (Math.abs(L.x - camX) > Math.max(W, Hh) / zoom || Math.abs(L.y - camY) > Math.max(W, Hh) / zoom) continue;
        for (const a of L.apps) {
          if (!a.inbound || a.inner) continue;
          const st = lightState(L, a.g);
          if (a.px == null) {
            // el poste va en la vereda, a la derecha: si cae sobre otra calle, se corre hacia afuera o hacia atrás
            const rx = -a.uy, ry = a.ux; let best = null;
            outer: for (const back of [0, 2, 4, 6, 9]) for (const lat of [1.4, 2, 2.6, 3.4]) {
              const d = L.maxW / 2 + 3.6 + back, x = L.x - a.ux * d + rx * (a.w / 2 + lat), y = L.y - a.uy * d + ry * (a.w / 2 + lat);
              let ok = true; for (const t of [-1.6, 0, 1.6]) { const q = nearestRoad(x + a.ux * t, y + a.uy * t); if (q && q.d < 0.35) { ok = false; break; } }
              if (ok) { best = [x, y]; break outer; }
            }
            if (!best) { const d = L.maxW / 2 + 3.6; best = [L.x - a.ux * d + rx * (a.w / 2 + 1.4), L.y - a.uy * d + ry * (a.w / 2 + 1.4)]; }
            a.px = best[0]; a.py = best[1];
          }
          // línea de frenado pintada del color de la luz, sobre los carriles que controla este semáforo
          const ang = Math.atan2(a.uy, a.ux), ds = L.maxW / 2 + 4.8, y0 = a.ow ? -a.w / 2 + 0.3 : 0.3, y1 = a.w / 2 - 0.3;
          const COL = { r: [255, 59, 48], y: [255, 196, 0], g: [48, 209, 88] }[st], rgb = (al) => `rgba(${COL[0]},${COL[1]},${COL[2]},${al})`;
          const mine = myLight && myLight.a === a;
          ctx.save(); ctx.translate(L.x - a.ux * ds, L.y - a.uy * ds); ctx.rotate(ang);
          const gl = ctx.createLinearGradient(-4, 0, 0, 0); gl.addColorStop(0, rgb(0)); gl.addColorStop(1, rgb(mine ? 0.32 : 0.2)); ctx.fillStyle = gl; ctx.fillRect(-4, y0, 4, y1 - y0);
          ctx.fillStyle = rgb(0.85); ctx.fillRect(-0.3, y0, 0.6, y1 - y0);
          // brazo desde el poste de la vereda hasta arriba del carril, con la cabeza mirando a los autos que vienen
          const hy = (y0 + y1) / 2, hx = 0.9;
          ctx.restore();
          const hxw = L.x - a.ux * ds + a.ux * hx - a.uy * hy, hyw = L.y - a.uy * ds + a.uy * hx + a.ux * hy;
          ctx.strokeStyle = '#3a3d42'; ctx.lineWidth = 0.22; ctx.beginPath(); ctx.moveTo(a.px, a.py); ctx.lineTo(hxw, hyw); ctx.stroke();
          ctx.fillStyle = '#2a2c30'; ctx.beginPath(); ctx.arc(a.px, a.py, 0.42, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8a8f96'; ctx.lineWidth = 0.08; ctx.stroke();
          ctx.save(); ctx.translate(hxw, hyw); ctx.rotate(ang); ctx.scale(1.35, 1.35);
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(-0.35, -1.25, 1.1, 2.7, 0.25); ctx.fill();
          ctx.fillStyle = '#121316'; ctx.beginPath(); ctx.roundRect(-0.5, -1.4, 1, 2.8, 0.25); ctx.fill();
          ctx.fillStyle = '#e8c21a'; ctx.fillRect(0.38, -1.4, 0.12, 2.8);
          const ys = { r: -0.9, y: 0, g: 0.9 }, cols = { r: '#ff3b30', y: '#ffc400', g: '#30d158' };
          for (const k of ['r', 'y', 'g']) {
            ctx.fillStyle = k === st ? cols[k] : 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(-0.05, ys[k], 0.36, 0, TAU); ctx.fill();
            ctx.fillStyle = '#121316'; ctx.beginPath(); ctx.moveTo(-0.5, ys[k] - 0.42); ctx.lineTo(-0.85, ys[k]); ctx.lineTo(-0.5, ys[k] + 0.42); ctx.closePath(); ctx.fill(); // visera hacia los autos
          }
          ctx.fillStyle = rgb(0.25); ctx.beginPath(); ctx.arc(-0.05, ys[st], 1.3, 0, TAU); ctx.fill();
          if (mine) { ctx.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * Math.sin(clock * 6)})`; ctx.lineWidth = 0.15; ctx.beginPath(); ctx.roundRect(-0.9, -1.8, 1.8, 3.6, 0.5); ctx.stroke(); }
          ctx.restore();
        }
      }
    }
    // el semáforo que te toca: el de la esquina que tenés adelante, en tu sentido
    let myLight = null;
    function findMyLight() {
      myLight = null; let bd = 1e9; const hx = Math.cos(me.a), hy = Math.sin(me.a);
      for (const L of G.lights.values()) {
        const dx = L.x - me.x, dy = L.y - me.y; if (Math.abs(dx) > 90 || Math.abs(dy) > 90) continue;
        for (const a of L.apps) {
          if (!a.inbound || a.inner || a.ux * hx + a.uy * hy < 0.7) continue;
          const along = dx * a.ux + dy * a.uy, lat = Math.abs(-dx * a.uy + dy * a.ux), stop = along - (L.maxW / 2 + 4.8);
          if (along < L.maxW / 2 || along > 85 || lat > a.w / 2 + 2.5) continue;
          if (along < bd) { bd = along; myLight = { L, a, dist: stop }; }
        }
      }
    }
    function drawMyLight() {
      if (!myLight || me.vf < -0.5) return;
      const st = lightState(myLight.L, myLight.a.g), x = 20, y = 62, w = 46, hh = 128;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(x + 2, y + 3, w, hh, 12); ctx.fill();
      ctx.fillStyle = '#121316'; ctx.beginPath(); ctx.roundRect(x, y, w, hh, 12); ctx.fill(); ctx.strokeStyle = '#e8c21a'; ctx.lineWidth = 2; ctx.stroke();
      const cols = { r: '#ff3b30', y: '#ffc400', g: '#30d158' };
      ['r', 'y', 'g'].forEach((k, i) => { const cy = y + 22 + i * 32; if (k === st) { const gr = ctx.createRadialGradient(x + w / 2, cy, 2, x + w / 2, cy, 22); gr.addColorStop(0, cols[k]); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x + w / 2, cy, 22, 0, TAU); ctx.fill(); } ctx.fillStyle = k === st ? cols[k] : 'rgba(255,255,255,.08)'; ctx.beginPath(); ctx.arc(x + w / 2, cy, 12, 0, TAU); ctx.fill(); });
      const d = Math.max(0, Math.round(myLight.dist));
      ctx.fillStyle = 'rgba(16,20,28,.85)'; ctx.beginPath(); ctx.roundRect(x - 4, y + hh + 6, w + 8, 22, 9); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '800 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(myLight.dist < 1 ? 'Cruce' : `${d} m`, x + w / 2, y + hh + 17.5);
      ctx.restore();
    }
    const toScr = (x, y) => { const [dx, dy] = rotV(x - camX, y - camY); return [W / 2 + dx * zoom, Hh / 2 + dy * zoom]; };
    // elige la esquina del cruce donde el cartel no pisa la calle (y distinta de la del otro cartel)
    function placeSign(s2) {
      const ca = Math.cos(s2.ang), sa = Math.sin(s2.ang); let best = null;
      for (const sg of [1, -1]) for (const side of [1, -1]) {
        const ux = ca * sg, uy = sa * sg, nx = -uy * side, ny = ux * side;
        const dx = ux + nx, dy = uy + ny; if (s2.cor.used.some(([qx, qy]) => qx * dx + qy * dy > 1.2)) continue;
        const ax = s2.x0 + ux * (s2.ow / 2 + 1.6) + nx * (s2.w / 2 + 0.8), ay = s2.y0 + uy * (s2.ow / 2 + 1.6) + ny * (s2.w / 2 + 0.8);
        let bad = 0;
        for (const t of [0, 3, 6, 9, 12]) for (const v of [0.2, 1.3, 2.4]) { const q = nearestRoad(ax + ux * t + nx * v, ay + uy * t + ny * v); if (q && q.d < 0.15) bad += 2; else if (q && inBuilding(ax + ux * t + nx * v, ay + uy * t + ny * v) && q.d > 3.2) bad += 0.3; }
        const sc = bad + (side === 1 ? 0 : 0.1) + (sg === 1 ? 0 : 0.05);
        if (!best || sc < best.sc) best = { sc, ax, ay, ux, uy, nx, ny, dx, dy };
      }
      if (!best || best.sc >= 6) { s2.hide = true; return; }
      Object.assign(s2, { x: best.ax, y: best.ay, ux: best.ux, uy: best.uy, nx: best.nx, ny: best.ny }); s2.cor.used.push([best.dx, best.dy]);
    }
    // carteles de esquina al estilo porteño: placa negra, nombre en blanco y flecha con el sentido de la calle
    function drawSigns() {
      // los carteles se achican con la cámara lejos (y desaparecen si quedan ilegibles)
      const sc = Math.max(0.5, Math.min(1.1, zoom / 9)); if (zoom < 3.4) return;
      ctx.save(); ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
      const placed = [];
      for (const s2 of G.signs) {
        if (s2.ok === undefined) { placeSign(s2); s2.ok = true; }
        if (s2.hide) continue;
        const [px, py] = toScr(s2.x, s2.y); if (px < -260 || py < -260 || px > W + 260 || py > Hh + 260) continue;
        ctx.font = `800 ${(11.5 * sc).toFixed(1)}px "Arial Narrow", "Roboto Condensed", system-ui, sans-serif`;
        const nm = s2.name.toUpperCase(), t = nm.length > 26 ? nm.slice(0, 25) + '…' : nm, tw = ctx.measureText(t).width, aw = 25 * sc, w = tw + 18 * sc + aw, hh = 20 * sc;
        const [sux, suy] = rotV(s2.ux, s2.uy), [snx, sny] = rotV(s2.nx, s2.ny);
        const cx = px + sux * (w / 2 + 3) + snx * (hh / 2 + 1), cy = py + suy * (w / 2 + 3) + sny * (hh / 2 + 1);
        let ang = Math.atan2(suy, sux); if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
        const ex = Math.abs(Math.cos(ang)) * w / 2 + Math.abs(Math.sin(ang)) * hh / 2, ey = Math.abs(Math.sin(ang)) * w / 2 + Math.abs(Math.cos(ang)) * hh / 2;
        const box = [cx - ex, cy - ey, cx + ex, cy + ey];
        if (placed.some(r => box[0] < r[2] + 3 && box[2] > r[0] - 3 && box[1] < r[3] + 3 && box[3] > r[1] - 3)) continue;
        placed.push(box);
        // poste
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(px + 1.6, py + 1.6, 2.6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2b2d31'; ctx.beginPath(); ctx.arc(px, py, 2.6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-w / 2 + 2, -hh / 2 + 2, w, hh);
        ctx.fillStyle = '#141414'; ctx.fillRect(-w / 2, -hh / 2, w, hh);
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.9; ctx.strokeRect(-w / 2 + 1.5, -hh / 2 + 1.5, w - 3, hh - 3);
        const sx = w / 2 - aw; ctx.beginPath(); ctx.moveTo(sx, -hh / 2 + 1.5); ctx.lineTo(sx, hh / 2 - 1.5); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.fillText(t, -aw / 2, 0.5);
        // flecha: hacia dónde circula la calle (doble si es de doble mano)
        ctx.translate(sx + aw / 2, 0); ctx.scale(sc, sc); ctx.translate(-(sx + aw / 2), 0);
        const mx = sx + aw / 2; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6;
        const head = (dir) => { ctx.beginPath(); ctx.moveTo(mx + dir * 8, 0); ctx.lineTo(mx + dir * 3.5, -3.6); ctx.lineTo(mx + dir * 3.5, 3.6); ctx.closePath(); ctx.fill(); };
        if (s2.flow == null) { ctx.beginPath(); ctx.moveTo(mx - 5, 0); ctx.lineTo(mx + 5, 0); ctx.stroke(); head(1); head(-1); }
        else { const rel = Math.cos(s2.flow + camRot - ang) >= 0 ? 1 : -1; ctx.beginPath(); ctx.moveTo(mx - rel * 8, 0); ctx.lineTo(mx + rel * 4, 0); ctx.stroke(); head(rel); }
        ctx.restore();
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
        g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.arc(x, y, L, c.a + camRot - 0.42, c.a + camRot + 0.42); g.closePath(); g.fill();
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
      ctx.fillStyle = '#7f8a63'; ctx.fillRect(0, 0, W, Hh);
      ctx.save();
      ctx.translate(W / 2, Hh / 2); ctx.rotate(camRot); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
      const rot = Math.abs(camRot) > 0.005, hwv = rot ? Math.hypot(W, Hh) / 2 / zoom : W / 2 / zoom, hhv = rot ? Math.hypot(W, Hh) / 2 / zoom : Hh / 2 / zoom;
      const vx0 = camX - hwv, vy0 = camY - hhv, vx1 = camX + hwv, vy1 = camY + hhv;
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
      if (!race) findMyLight(); else myLight = null;
      if (race) drawRaceTrack();
      drawCar(me, true);
      // humo del motor cuando el auto está muy golpeado
      if ((me.dmg || 0) > 0.55 && state === 'run') {
        if (smoke.length < 60 && Math.random() < (me.dmg - 0.45) * 0.7) { const fx = me.x + Math.cos(me.a) * me.len * 0.32, fy = me.y + Math.sin(me.a) * me.len * 0.32; smoke.push([fx - Math.cos(me.a) * 0.6, fy - Math.sin(me.a) * 0.6, (Math.random() - 0.5) * 0.8 - Math.cos(me.a) * me.vf * 0.15, (Math.random() - 0.5) * 0.8 - Math.sin(me.a) * me.vf * 0.15, 1.6]); }
      }
      for (const p2 of smoke) { p2[0] += p2[2] * 0.016; p2[1] += p2[3] * 0.016; p2[4] -= 0.016; }
      smoke = smoke.filter(p2 => p2[4] > 0);
      for (const p2 of smoke) { const t2 = 1.6 - p2[4]; ctx.fillStyle = `rgba(${me.dmg > 0.85 ? 40 : 120},${me.dmg > 0.85 ? 40 : 120},${me.dmg > 0.85 ? 44 : 124},${0.28 * Math.min(1, t2 * 3) * p2[4] / 1.6})`; ctx.beginPath(); ctx.arc(p2[0], p2[1], 0.25 + t2 * 1.5, 0, TAU); ctx.fill(); }
      if (!race) drawLights();
      ctx.restore();
      if (!isNight() && lights !== 'off') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const [x, y] = toScr(me.x + Math.cos(me.a) * me.len / 2, me.y + Math.sin(me.a) * me.len / 2), Lb = (lights === 'high' ? 40 : 24) * zoom; const gr = ctx.createRadialGradient(x, y, 0, x, y, Lb); gr.addColorStop(0, 'rgba(255,250,220,.13)'); gr.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, Lb, me.a + camRot - 0.4, me.a + camRot + 0.4); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (isNight()) drawNight();
      if (isRain()) drawRain();
      // viñeta suave en los bordes
      { const vg = ctx.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.45, W / 2, Hh / 2, Math.max(W, Hh) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, Hh); }
      drawSigns();
      drawMyLight();
      // cartel grande de contramano
      if (wrongT > 0.7) {
        const bw = Math.min(W - 40, 430), bx = W / 2 - bw / 2, by = 64, al = 0.75 + 0.25 * Math.sin(performance.now() / 120);
        ctx.save(); ctx.globalAlpha = al;
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.roundRect(bx + 3, by + 4, bw, 76, 16); ctx.fill();
        ctx.fillStyle = '#d7261e'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 76, 16); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(bx + 5, by + 5, bw - 10, 66, 12); ctx.stroke();
        ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.beginPath(); ctx.arc(bx + 44, by + 38, 21, 0, TAU); ctx.fill(); ctx.fillStyle = '#d7261e'; ctx.fillRect(bx + 31, by + 34, 26, 8);
        ctx.fillStyle = '#fff'; ctx.font = '900 30px system-ui, Segoe UI, sans-serif'; ctx.fillText('CONTRAMANO', W / 2 + 22, by + 30);
        ctx.font = '600 12.5px system-ui, Segoe UI, sans-serif'; ctx.fillText(wrongKind, W / 2 + 22, by + 56);
        ctx.restore();
      }
      // flecha hacia la entrega
      if (job) {
        const [dx, dy] = rotV(job.x - camX, job.y - camY), sx = W / 2 + dx * zoom, sy = Hh / 2 + dy * zoom;
        if (sx < 20 || sy < 20 || sx > W - 20 || sy > Hh - 20) {
          const a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - 34;
          ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r); ctx.rotate(a);
          ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-5, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      }
      // flecha verde hacia la estación de servicio más cercana (más visible con poca nafta)
      if (G.stations.length && !race) {
        let st = null, bd = 1e12; for (const s3 of G.stations) { const d = (s3.rx - me.x) ** 2 + (s3.ry - me.y) ** 2; if (d < bd) { bd = d; st = s3; } }
        const dist = Math.sqrt(bd), low = me.fuel < 0.3 || (me.dmg || 0) > 0.5;
        const [dx, dy] = rotV(st.rx - camX, st.ry - camY), sx = W / 2 + dx * zoom, sy = Hh / 2 + dy * zoom;
        if (sx < 30 || sy < 30 || sx > W - 30 || sy > Hh - 30) {
          const a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - (low ? 60 : 64), px = W / 2 + Math.cos(a) * r, py = Hh / 2 + Math.sin(a) * r, pul = low ? 1 + Math.sin(clock * 6) * 0.12 : 1;
          ctx.save(); ctx.translate(px, py); ctx.globalAlpha = low ? 1 : 0.8;
          ctx.save(); ctx.rotate(a); ctx.scale(pul, pul); ctx.fillStyle = '#1f9d55'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-8, -12); ctx.lineTo(-3, 0); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
          const t = `⛽ ${dist < 1000 ? Math.round(dist / 10) * 10 + ' m' : (dist / 1000).toFixed(1) + ' km'}`; ctx.font = '700 11px system-ui'; const tw = ctx.measureText(t).width + 12, lx = -Math.cos(a) * 30 - tw / 2, ly = -Math.sin(a) * 26 - 9;
          ctx.fillStyle = low ? 'rgba(31,157,85,.95)' : 'rgba(16,20,28,.8)'; ctx.beginPath(); ctx.roundRect(lx, ly, tw, 18, 9); ctx.fill(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, lx + tw / 2, ly + 9.5);
          ctx.restore();
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
        // sentido de las calles de mano única en el radar
        ctx.fillStyle = wx === 'dia' || wx === 'lluvia' ? 'rgba(50,56,66,.85)' : 'rgba(255,255,255,.8)';
        for (const r of near.roads) { if (!r.o || r.k >= 7) continue; for (let i = 0; i < r.p.length - 1; i++) { const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], Ls = Math.hypot(bx - ax, by - ay); if (Ls < 30) continue; const an = Math.atan2(by - ay, bx - ax) + (r.o === -1 ? Math.PI : 0); for (let t = 0.5 / Math.max(1, Math.round(Ls / 90)); t < 1; t += 1 / Math.max(1, Math.round(Ls / 90))) { ctx.save(); ctx.translate(ax + (bx - ax) * t, ay + (by - ay) * t); ctx.rotate(an); ctx.scale(1 / k, 1 / k); ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-3, -3.6); ctx.lineTo(-1, 0); ctx.lineTo(-3, 3.6); ctx.closePath(); ctx.fill(); ctx.restore(); } } }
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
      if (street) { const fl = nr.r.o ? (nr.r.o === 1 ? nr.ang : nr.ang + Math.PI) : null; h2 += `<span>📍 ${street.replace(/</g, '')}${fl == null ? ' <small style="opacity:.7">· doble mano</small>' : ` <b style="display:inline-block;transform:rotate(${(fl + camRot).toFixed(2)}rad);color:#ffd60a">➜</b> <small style="opacity:.7">mano única</small>`}</span>`; }
      if (race) { h2 += raceHud(); hud.innerHTML = h2; return; }
      if (mode === 'entregas' && job) h2 += `<span>📦 ${job.street.replace(/</g, '')} · ${(Math.hypot(job.x - me.x, job.y - me.y) / 1000).toFixed(2)} km · ${Math.max(0, Math.ceil(job.time))} s</span>`;
      h2 += `<span>🚦 ${stats.red}</span><span>💥 ${stats.crash}</span>`;
      if (me.dmg > 0.005) h2 += `<span style="color:${me.dmg > 0.6 ? '#ff8a80' : me.dmg > 0.3 ? '#ffd27a' : '#fff'}">🔧 Daños ${Math.round(me.dmg * 100)}%${repairing ? ' · reparando…' : ''}</span>`;
      if (mode === 'entregas') h2 += `<span>${stats.pts} pts</span>`;
      hud.innerHTML = h2;
    }
    function frame(t) {
      const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016); lastT = t;
      if (state === 'run') { step(dt); draw(); hudPaint(); if (race) drawRaceOverlay(); }
      else if (state === 'edit') drawEditor();
      SND.update(state === 'run');
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
      window.__barrioG = G; window.__barrio = { raw: () => cars, cars: () => cars.map(c => [Math.round(c.x), Math.round(c.y), +c.v.toFixed(1)]), me: () => me, lights: () => [...G.lights.values()].map(L => [L.x, L.y]), G: () => G, road: (x, y) => { const q = nearestRoad(x, y); return q && { w: q.r.w, d: q.d, o: q.r.o, ang: q.ang }; }, inB: (x, y) => inBuilding(x, y), race: () => race };
      msg.hidden = true; closeOver(root); state = 'run'; fit();
      H.status([m.name.split(',').slice(0, 2).join(','), `${G.lights.size} semáforos`]);
      if (mode === 'entregas') newJob(); else say('Paseo libre: andá por donde quieras');
      run();
    }
    async function menu(err) {
      if (race || edit) { race = null; edit = null; editPanel && editPanel.remove(); hud.style.display = ''; }
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


    // ---------- sonidos (sintetizados, sin archivos) ----------
    let sndOn = H.get().snd !== false;
    const SND = (() => {
      let A = null, master, eng1, eng2, engF, engG, tireG, rainG, sirenO, sirenG, sirenL, hornG, pumpG, noiseBuf;
      function init() {
        if (A) return true;
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        A = new AC(); master = A.createGain(); master.gain.value = sndOn ? 0.55 : 0; master.connect(A.destination);
        noiseBuf = A.createBuffer(1, A.sampleRate * 2, A.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const noise = () => { const n = A.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(); return n; };
        // motor: dos osciladores graves con filtro
        eng1 = A.createOscillator(); eng1.type = 'sawtooth'; eng2 = A.createOscillator(); eng2.type = 'square';
        engF = A.createBiquadFilter(); engF.type = 'lowpass'; engF.frequency.value = 400; engF.Q.value = 3; engG = A.createGain(); engG.gain.value = 0;
        const e2g = A.createGain(); e2g.gain.value = 0.5; eng1.connect(engF); eng2.connect(e2g); e2g.connect(engF); engF.connect(engG); engG.connect(master); eng1.start(); eng2.start();
        // gomas que chillan
        const tf = A.createBiquadFilter(); tf.type = 'bandpass'; tf.frequency.value = 1400; tf.Q.value = 6; tireG = A.createGain(); tireG.gain.value = 0; noise().connect(tf); tf.connect(tireG); tireG.connect(master);
        // lluvia
        const rf = A.createBiquadFilter(); rf.type = 'highpass'; rf.frequency.value = 2200; rainG = A.createGain(); rainG.gain.value = 0; noise().connect(rf); rf.connect(rainG); rainG.connect(master);
        // sirena del patrullero
        sirenO = A.createOscillator(); sirenO.type = 'triangle'; sirenO.frequency.value = 900; sirenL = A.createOscillator(); sirenL.frequency.value = 0.55; const sl = A.createGain(); sl.gain.value = 320; sirenL.connect(sl); sl.connect(sirenO.frequency); sirenG = A.createGain(); sirenG.gain.value = 0; sirenO.connect(sirenG); sirenG.connect(master); sirenO.start(); sirenL.start();
        // bocina
        hornG = A.createGain(); hornG.gain.value = 0; for (const f of [392, 494]) { const o = A.createOscillator(); o.type = 'square'; o.frequency.value = f; const of = A.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 1800; o.connect(of); of.connect(hornG); o.start(); } hornG.connect(master);
        // surtidor cargando
        const po = A.createOscillator(); po.type = 'sine'; po.frequency.value = 180; pumpG = A.createGain(); pumpG.gain.value = 0; po.connect(pumpG); pumpG.connect(master); po.start();
        return true;
      }
      const set = (g, v, t = 0.06) => { if (g) g.gain.setTargetAtTime(v, A.currentTime, t); };
      function blip(freq, dur, type = 'sine', vol = 0.15, slide = 0) {
        if (!A || !sndOn) return; const o = A.createOscillator(), g = A.createGain(); o.type = type; o.frequency.value = freq; if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), A.currentTime + dur);
        g.gain.setValueAtTime(vol, A.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + dur); o.connect(g); g.connect(master); o.start(); o.stop(A.currentTime + dur + 0.02);
      }
      function crash(sev) {
        if (!A || !sndOn) return; const n = A.createBufferSource(); n.buffer = noiseBuf; const f = A.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + sev * 1500; const g = A.createGain();
        const v = 0.25 + sev * 0.6; g.gain.setValueAtTime(v, A.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, A.currentTime + 0.45 + sev * 0.5); n.connect(f); f.connect(g); g.connect(master); n.start(); n.stop(A.currentTime + 1.2);
        blip(140 + Math.random() * 60, 0.3, 'square', 0.08 + sev * 0.1, -80); if (sev > 0.15) setTimeout(() => blip(2400 + Math.random() * 800, 0.25, 'triangle', 0.05), 60);
      }
      return {
        init, blip, crash,
        on(v) { sndOn = v; if (A) master.gain.setTargetAtTime(v ? 0.55 : 0, A.currentTime, 0.05); },
        horn(v) { if (A) set(hornG, v && sndOn ? 0.09 : 0, 0.015); },
        update(run) {
          if (!A) return;
          if (!run || !me) { for (const g of [engG, tireG, rainG, sirenG, hornG, pumpG]) set(g, 0, 0.05); return; }
          const V = me.V, spd = Math.abs(me.vf), span = V.vmax / 5, gear = Math.min(4, Math.floor(spd / span)), frac = (spd - gear * span) / span;
          const base = me.type === 'moto' ? 70 : me.type === 'bus' || me.type === 'truck' ? 28 : me.type === 'sport' ? 52 : 40;
          const rpm = spd < 0.3 ? 0 : 0.25 + frac * 0.75 + (keys.up ? 0.08 : 0), f = base * (1 + rpm * 1.6) * (1 + gear * 0.04);
          eng1.frequency.setTargetAtTime(f, A.currentTime, 0.05); eng2.frequency.setTargetAtTime(f / 2, A.currentTime, 0.05);
          engF.frequency.setTargetAtTime(300 + rpm * 1300 + (keys.up ? 300 : 0), A.currentTime, 0.08);
          set(engG, me.fuel <= 0 ? 0 : (0.045 + rpm * 0.05 + (keys.up ? 0.03 : 0)) * (1 + (me.dmg || 0) * 0.3), 0.08);
          set(tireG, Math.min(0.13, Math.max(0, (Math.abs(me.vr) - 1.6) / 5) * 0.13 + (keys.hb && spd > 4 ? 0.07 : 0) + (keys.down && me.vf > 9 ? 0.05 : 0)), 0.05);
          set(rainG, isRain() ? 0.05 : 0, 0.4);
          set(sirenG, siren && me.type === 'police' ? 0.045 : 0, 0.05);
          set(pumpG, filling ? 0.025 : 0, 0.1);
        }
      };
    })();

    // ---------- carreras: pistas trazadas por las calles de tu zona ----------
    const RCSS = `
.brr-panel{position:absolute;left:12px;top:12px;z-index:40;width:300px;max-height:calc(100% - 24px);overflow:auto;background:rgba(14,18,26,.94);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:9px;color:#fff;box-shadow:0 14px 40px -14px #000;font-size:13px}
.brr-panel b{font-size:16px}.brr-panel small{color:#aab1c2;line-height:1.35}
.brr-panel input{border:0;border-radius:9px;padding:8px 10px;background:rgba(255,255,255,.1);color:#fff;font:inherit}
.brr-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.brr-len{font-weight:700;color:#ffd60a}
.brr-tr{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center}
.brr-tr .mg-btn{text-align:left}
.brr-res{border-collapse:collapse;width:100%;font-size:14px}.brr-res td{padding:5px 8px;border-bottom:1px solid rgba(255,255,255,.08)}.brr-res tr.me td{color:#ffd60a;font-weight:800}
`;
    if (!document.getElementById('st-barrio-race')) document.head.append(h('style', { id: 'st-barrio-race', text: RCSS }));
    let race = null, edit = null, editPanel = null;
    const DIFF = { facil: { n: 'Fácil', k: 0.74 }, normal: { n: 'Normal', k: 0.86 }, dificil: { n: 'Difícil', k: 0.98 } };
    const raceOpts = { rivals: Math.min(5, Math.max(1, +H.get().rivals || 3)), diff: DIFF[H.get().rdiff] ? H.get().rdiff : 'normal' };
    const RIV = [['Tito', '#1f5fbf', 'auto'], ['La Flaca', '#e3b21c', 'sport'], ['Ruso', '#2f8f4e', 'auto'], ['Pocho', '#7a3fbf', 'pickup'], ['Chiqui', '#d35400', 'sport']];
    const fmtT = (t) => { t = Math.max(0, t); const m = Math.floor(t / 60), s2 = t - m * 60; return `${m}:${s2.toFixed(1).padStart(4, '0')}`; };
    const myTracks = () => ((H.get().tracks || {})[mapId] || []);
    function saveTracks(list) { const s = H.get(); s.tracks = s.tracks || {}; s.tracks[mapId] = list; H.set(s); }
    // esquina (o punto de calle) más cercana
    function snapNode(x, y, maxD) {
      let best = null, bd = maxD * maxD;
      for (const r of G.inRect(x - maxD, y - maxD, x + maxD, y + maxD).roads) { if (r.k > 6) continue; r.p.forEach(([px, py], i) => { const d = (px - x) ** 2 + (py - y) ** 2 - (G.deg(r.nd[i]) >= 3 ? 40 : 0); if (d < bd) { bd = d; best = r.nd[i]; } }); }
      return best;
    }
    // camino más corto por las calles entre dos esquinas (para la carrera las calles se cortan: no importa la mano)
    function shortest(a, b) {
      if (a === b) return [a];
      const dist = new Map([[a, 0]]), prev = new Map(), heap = [[0, a]];
      const push = (d, n) => { heap.push([d, n]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
      let it = 0;
      while (heap.length && it++ < 400000) {
        const [d, n] = pop(); if (n === b) break; if (d > (dist.get(n) ?? Infinity)) continue;
        const l = G.links.get(n); if (!l) continue;
        for (const [ri, i] of l) {
          const r = G.roads[ri]; if (r.k > 6) continue;
          for (const j of [i - 1, i + 1]) { if (j < 0 || j >= r.p.length) continue; const m = r.nd[j], nd2 = d + Math.hypot(r.p[j][0] - r.p[i][0], r.p[j][1] - r.p[i][1]); if (nd2 < (dist.get(m) ?? Infinity)) { dist.set(m, nd2); prev.set(m, n); push(nd2, m); } }
        }
      }
      if (!prev.has(b)) return null;
      const out = [b]; let n = b; while (n !== a) { n = prev.get(n); out.push(n); } return out.reverse();
    }
    function buildPath(wps, loop) {
      if (wps.length < 2) return null;
      const seq = loop && wps.length > 2 ? [...wps, wps[0]] : wps, nodes = [];
      for (let k = 0; k < seq.length - 1; k++) { const sp = shortest(seq[k].n, seq[k + 1].n); if (!sp) return null; if (nodes.length) sp.shift(); nodes.push(...sp); }
      const P = [];
      for (const n of nodes) { const p = G.nodePos(n); if (!P.length || Math.hypot(p[0] - P[P.length - 1][0], p[1] - P[P.length - 1][1]) > 0.5) P.push([p[0], p[1]]); }
      const lp = loop && wps.length > 2; if (lp && P.length > 2 && Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) < 0.6) P.pop();
      if (P.length < 2) return null;
      // en un circuito, la largada va en el medio de la primera recta larga (no justo en una esquina)
      if (lp) { for (let i = 0; i < P.length; i++) { const A = P[i], B = P[(i + 1) % P.length], sl = Math.hypot(B[0] - A[0], B[1] - A[1]); if (sl > 45) { const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; const rot = [M, ...P.slice(i + 1), ...P.slice(0, i + 1)]; P.length = 0; P.push(...rot); break; } } }
      const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
      const L = lp ? cum[cum.length - 1] + Math.hypot(P[0][0] - P[P.length - 1][0], P[0][1] - P[P.length - 1][1]) : cum[cum.length - 1];
      return { pts: P, cum, L, loop: lp };
    }
    function pathAt(path, s) {
      const { pts, cum, L, loop } = path, n = pts.length;
      if (loop) s = ((s % L) + L) % L;
      let lo = 0, hi = n - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (cum[mid] <= s) lo = mid; else hi = mid - 1; }
      let i = lo; if (!loop && i >= n - 1) i = n - 2;
      const A = pts[i], B = pts[(i + 1) % n], sl = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, ux = (B[0] - A[0]) / sl, uy = (B[1] - A[1]) / sl, d = s - cum[i];
      return [A[0] + ux * d, A[1] + uy * d, ux, uy];
    }
    function projPath(path, x, y, guess) {
      const { pts, cum, L, loop } = path, n = pts.length; let best = null;
      for (let i = 0; i < (loop ? n : n - 1); i++) {
        const A = pts[i], B = pts[(i + 1) % n], dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (y - A[1]) * dy) / L2));
        const d = Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t), s = cum[i] + t * Math.sqrt(L2);
        let ds = s - guess; if (loop) ds = ((ds % L) + L * 1.5) % L - L / 2;
        const sc = d + Math.abs(ds) * 0.08;
        if (!best || sc < best.sc) best = { sc, s, d, ds };
      }
      return best;
    }
    const lenTxt = (m) => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(2)} km`;
    // ---- menú de carreras ----
    function raceMenu() {
      endRace(); state = 'menu'; cancelAnimationFrame(raf); closeOver(root);
      const box = h('div', { class: 'mg-over br-menu' }), card = h('div', { class: 'mg-over-card br-card' }); box.append(card); root.append(box);
      card.append(h('b', { text: '🏁 Carreras' }), h('span', { text: 'Trazá una pista por las calles de tu zona y corré contra la compu. Durante la carrera las calles están cortadas: no hay tránsito ni semáforos.' }));
      const list = myTracks(), best = H.get().raceBest || {};
      if (list.length) {
        card.append(h('small', { class: 'br-sub', text: 'Tus pistas' }));
        for (const tr of list) {
          const p = buildPath(tr.wps, tr.loop), bt = best[mapId + ':' + tr.id];
          const go = btn(`▶ ${tr.name}`, () => startRace(tr), 'primary');
          const row = h('div', { class: 'brr-tr' }, go, btn('✏️', () => openEditor(tr)), btn('🗑', () => { if (!confirm(`¿Borrar la pista “${tr.name}”?`)) return; saveTracks(myTracks().filter(x => x.id !== tr.id)); raceMenu(); }));
          card.append(row, h('small', { style: 'margin:-4px 0 4px 4px', text: [p ? lenTxt(p.L) : 'sin camino', tr.loop ? `${tr.laps} vuelta${tr.laps > 1 ? 's' : ''}` : 'de punta a punta', bt ? `récord ${fmtT(bt.t)}` : ''].filter(Boolean).join(' · ') }));
        }
      } else card.append(h('small', { style: 'text-align:center', text: 'Todavía no armaste ninguna pista. Trazá una o probá una al azar.' }));
      card.append(h('small', { class: 'br-sub', text: 'Rivales' }),
        seg([1, 2, 3, 4, 5].map(n => [String(n), String(n)]), String(raceOpts.rivals), (v) => { raceOpts.rivals = +v; const s = H.get(); s.rivals = +v; H.set(s); }),
        seg(Object.entries(DIFF).map(([k, v]) => [k, v.n]), raceOpts.diff, (v) => { raceOpts.diff = v; const s = H.get(); s.rdiff = v; H.set(s); }),
        h('div', { class: 'brr-row', style: 'justify-content:center;margin-top:6px' },
          btn('✏️ Trazar una pista nueva', () => openEditor(null), 'primary'),
          btn('🎲 Pista al azar', () => { const tr = randomTrack(); if (!tr) { alert('No encontré una vuelta cerca. Trazala vos.'); return; } openEditor(tr); }),
          btn('Volver a manejar', () => { closeOver(root); mode = mode === 'carrera' ? 'libre' : mode; syncModeSeg(); state = 'run'; run(); })));
    }
    function syncModeSeg() { if (modeSeg) for (const b of modeSeg.children) b.classList.toggle('on', b.textContent === ({ entregas: 'Entregas', libre: 'Paseo libre', carrera: '🏁 Carreras' })[mode]); }
    function randomTrack() {
      for (let tries = 0; tries < 30; tries++) {
        const R = 170 + Math.random() * 160, a0 = Math.random() * TAU, wps = [];
        for (let k = 0; k < 4; k++) { const a = a0 + k * TAU / 4 + (Math.random() - 0.5) * 0.5; const n = snapNode(me.x + Math.cos(a) * R, me.y + Math.sin(a) * R, 70); if (n == null) break; const [x, y] = G.nodePos(n); if (wps.some(w => w.n === n)) break; wps.push({ x, y, n }); }
        if (wps.length < 4) continue;
        const p = buildPath(wps, true); if (p && p.L > 600 && p.L < 4000) return { id: 't' + Date.now().toString(36), name: 'Vuelta al barrio', wps, loop: true, laps: 3, fresh: true };
      }
      return null;
    }
    // ---- editor de pistas: un mapa de la zona donde marcás las esquinas en orden ----
    function openEditor(tr) {
      closeOver(root); cancelAnimationFrame(raf); state = 'edit'; hud.style.display = 'none';
      edit = { id: tr ? tr.id : 't' + Date.now().toString(36), name: tr ? tr.name : `Pista ${myTracks().length + 1}`, wps: tr ? tr.wps.map(w => ({ ...w })) : [], loop: tr ? tr.loop : true, laps: tr ? tr.laps || 3 : 3, cx: me.x, cy: me.y, z: 0.5, path: null, hover: null };
      if (edit.wps.length) { const xs = edit.wps.map(w => w.x), ys = edit.wps.map(w => w.y); edit.cx = (Math.min(...xs) + Math.max(...xs)) / 2; edit.cy = (Math.min(...ys) + Math.max(...ys)) / 2; edit.z = Math.max(0.15, Math.min(1.2, 0.7 * Math.min(W / (Math.max(...xs) - Math.min(...xs) + 80), Hh / (Math.max(...ys) - Math.min(...ys) + 80)))); }
      rebuildEdit();
      const name = h('input', { type: 'text', value: edit.name, maxlength: 40, placeholder: 'Nombre de la pista' }); name.oninput = () => { edit.name = name.value; };
      name.onkeydown = (e) => e.stopPropagation();
      const lenEl = h('span', { class: 'brr-len' }); edit.lenEl = lenEl;
      const lapsSel = pick('Vueltas', [1, 2, 3, 5, 10].map(n => [String(n), `${n} vuelta${n > 1 ? 's' : ''}`]), String(edit.laps), (v) => { edit.laps = +v; });
      editPanel = h('div', { class: 'brr-panel' },
        h('b', { text: '✏️ Trazá tu pista' }),
        h('small', { text: 'Hacé clic en las esquinas por donde pasa la carrera, en orden: el camino va solo por las calles. Arrastrá para mover el mapa y usá la rueda para acercar. Clic derecho borra la última.' }),
        name,
        seg([['vuelta', 'Circuito'], ['ida', 'De punta a punta']], edit.loop ? 'vuelta' : 'ida', (v) => { edit.loop = v === 'vuelta'; lapsSel.disabled = !edit.loop; rebuildEdit(); }),
        h('div', { class: 'brr-row' }, lapsSel, lenEl),
        h('div', { class: 'brr-row' }, btn('↶ Deshacer', () => { edit.wps.pop(); rebuildEdit(); }), btn('Borrar todo', () => { edit.wps = []; rebuildEdit(); })),
        h('div', { class: 'brr-row' }, btn('Cancelar', () => closeEditor()), btn('Guardar', () => saveEdit(false)), btn('🏁 Guardar y correr', () => saveEdit(true), 'primary')));
      lapsSel.disabled = !edit.loop;
      root.append(editPanel); cv.style.cursor = 'crosshair';
      lastT = 0; raf = requestAnimationFrame(frame);
    }
    function rebuildEdit() {
      edit.path = buildPath(edit.wps, edit.loop);
      if (edit.lenEl) edit.lenEl.textContent = edit.path ? `Largo: ${lenTxt(edit.path.L)}` : edit.wps.length < 2 ? 'Marcá al menos 2 esquinas' : 'No hay camino entre esas esquinas';
    }
    function closeEditor() { edit = null; if (editPanel) editPanel.remove(); editPanel = null; hud.style.display = ''; cv.style.cursor = ''; raceMenu(); }
    function saveEdit(go) {
      if (!edit.path || edit.path.L < 150) { alert('La pista tiene que tener al menos 150 m. Marcá más esquinas.'); return; }
      const tr = { id: edit.id, name: (edit.name || 'Mi pista').trim().slice(0, 40), wps: edit.wps.map(w => ({ x: +w.x.toFixed(1), y: +w.y.toFixed(1), n: w.n })), loop: edit.loop && edit.wps.length > 2, laps: edit.laps };
      const list = myTracks().filter(x => x.id !== tr.id); list.push(tr); saveTracks(list);
      edit = null; if (editPanel) editPanel.remove(); editPanel = null; hud.style.display = ''; cv.style.cursor = '';
      if (go) startRace(tr); else raceMenu();
    }
    function editToWorld(px, py) { const b = cv.getBoundingClientRect(); return [edit.cx + (px - b.left - W / 2) / edit.z, edit.cy + (py - b.top - Hh / 2) / edit.z]; }
    function editWheel(e) { if (!edit) return; const [wx, wy] = editToWorld(e.clientX, e.clientY); const z2 = Math.max(0.06, Math.min(4, edit.z * Math.exp(-e.deltaY * 0.0015))); edit.cx = wx - (wx - edit.cx) * edit.z / z2; edit.cy = wy - (wy - edit.cy) * edit.z / z2; edit.z = z2; }
    let edDown = null;
    cv.addEventListener('pointerdown', (e) => { if (state !== 'edit' || e.button === 2) return; edDown = { x: e.clientX, y: e.clientY, cx: edit.cx, cy: edit.cy, moved: false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => {
      if (state !== 'edit') return;
      if (edDown) { const dx = e.clientX - edDown.x, dy = e.clientY - edDown.y; if (Math.hypot(dx, dy) > 5) edDown.moved = true; if (edDown.moved) { edit.cx = edDown.cx - dx / edit.z; edit.cy = edDown.cy - dy / edit.z; cv.style.cursor = 'grabbing'; return; } }
      const [wx, wy] = editToWorld(e.clientX, e.clientY); edit.hover = snapNode(wx, wy, Math.max(12, 22 / edit.z));
    });
    cv.addEventListener('pointerup', (e) => {
      if (state !== 'edit' || !edDown) return; const d = edDown; edDown = null; cv.style.cursor = 'crosshair';
      if (d.moved) return;
      const [wx, wy] = editToWorld(e.clientX, e.clientY), n = snapNode(wx, wy, Math.max(12, 22 / edit.z)); if (n == null) return;
      if (edit.wps.length && edit.wps[edit.wps.length - 1].n === n) return;
      const [x, y] = G.nodePos(n); edit.wps.push({ x, y, n }); rebuildEdit();
    });
    cv.addEventListener('contextmenu', (e) => { if (state !== 'edit') return; e.preventDefault(); edit.wps.pop(); rebuildEdit(); });
    function drawEditor() {
      if (!edit || !G) return;
      const z = edit.z;
      ctx.fillStyle = '#151a21'; ctx.fillRect(0, 0, W, Hh);
      ctx.save(); ctx.translate(W / 2, Hh / 2); ctx.scale(z, z); ctx.translate(-edit.cx, -edit.cy);
      const x0 = edit.cx - W / 2 / z - 50, x1 = edit.cx + W / 2 / z + 50, y0 = edit.cy - Hh / 2 / z - 50, y1 = edit.cy + Hh / 2 / z + 50;
      const poly = (p) => { ctx.beginPath(); p.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); };
      for (const a of G.parks) if (a.bb[2] > x0 && a.bb[0] < x1 && a.bb[3] > y0 && a.bb[1] < y1) { poly(a.p); ctx.fillStyle = '#23382a'; ctx.fill(); }
      for (const a of G.water) if (a.bb[2] > x0 && a.bb[0] < x1 && a.bb[3] > y0 && a.bb[1] < y1) { poly(a.p); ctx.fillStyle = '#1b3550'; ctx.fill(); }
      ctx.lineCap = ctx.lineJoin = 'round';
      const vis = G.inRect(x0, y0, x1, y1).roads.sort((a, b) => b.k - a.k);
      for (const r of vis) { if (r.k > 7) continue; poly(r.p); ctx.strokeStyle = r.k <= 3 ? '#a2a9b3' : r.k === 7 ? '#3a404a' : '#646b76'; ctx.lineWidth = Math.max(r.w, (r.k <= 3 ? 3 : 2) / z); ctx.stroke(); }
      if (z > 0.7) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = `${11 / z}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (const r of vis) { if (!r.n || r.k > 6 || r.p.length < 2) continue; const m = r.p[Math.floor(r.p.length / 2)], m2 = r.p[Math.floor(r.p.length / 2) - 1] || r.p[1]; let an = Math.atan2(m[1] - m2[1], m[0] - m2[0]); if (an > Math.PI / 2 || an < -Math.PI / 2) an += Math.PI; ctx.save(); ctx.translate((m[0] + m2[0]) / 2, (m[1] + m2[1]) / 2); ctx.rotate(an); ctx.fillText(r.n, 0, -r.w / 2 - 6 / z); ctx.restore(); } }
      // la pista
      if (edit.path) {
        const P = edit.path; poly(P.pts); if (P.loop) ctx.closePath();
        ctx.strokeStyle = 'rgba(255,214,10,.35)'; ctx.lineWidth = Math.max(10, 9 / z); ctx.stroke();
        poly(P.pts); if (P.loop) ctx.closePath(); ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = Math.max(3, 3 / z); ctx.stroke();
        ctx.fillStyle = '#1b1b1b';
        for (let s2 = 30 / z; s2 < P.L; s2 += 80 / z) { const [x, y, ux, uy] = pathAt(P, s2); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux)); ctx.scale(1 / z, 1 / z); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
      }
      // esquinas marcadas
      edit.wps.forEach((w, i) => {
        ctx.save(); ctx.translate(w.x, w.y); ctx.scale(1 / z, 1 / z);
        ctx.fillStyle = i === 0 ? '#30d158' : '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#111'; ctx.font = '800 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i === 0 ? '🏁' : String(i + 1), 0, 0.5);
        ctx.restore();
      });
      if (edit.hover != null) { const [hx, hy] = G.nodePos(edit.hover); ctx.save(); ctx.translate(hx, hy); ctx.scale(1 / z, 1 / z); ctx.strokeStyle = '#4cc9f0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.stroke(); ctx.restore(); }
      // dónde estás vos
      ctx.save(); ctx.translate(me.x, me.y); ctx.scale(1 / z, 1 / z); ctx.fillStyle = '#ff3b30'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.restore();
      ctx.fillStyle = 'rgba(14,18,26,.85)'; ctx.beginPath(); ctx.roundRect(W - 190, Hh - 40, 176, 28, 10); ctx.fill(); ctx.fillStyle = '#cfd5df'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔴 vos · 🏁 largada', W - 102, Hh - 26);
    }
    // ---- la carrera ----
    function startRace(tr) {
      const path = buildPath(tr.wps, tr.loop);
      if (!path || path.L < 150) { alert('Esa pista no tiene un camino válido. Editala.'); return raceMenu(); }
      closeOver(root); edit = null; job = null;
      const laps = path.loop ? Math.max(1, tr.laps || 3) : 1, n = raceOpts.rivals, k = DIFF[raceOpts.diff].k;
      // grilla de largada: de a dos, detrás de la línea; vos salís último
      const slot = (i) => [-7 - Math.floor(i / 2) * 8, i % 2 ? 1.7 : -1.7];
      const place = (o, i) => { const [P0, ln] = slot(i), [x, y, ux, uy] = pathAt(path, P0); o.x = x - uy * ln; o.y = y + ux * ln; o.a = Math.atan2(uy, ux); return P0; };
      cars = [];
      for (let i = 0; i < n; i++) {
        const [nm, col, ty] = RIV[i], V = VEH[ty === 'sport' ? 'deportivo' : ty === 'pickup' ? 'camioneta' : 'auto'];
        const c = { racer: true, name: nm, c: col, type: ty, len: V.len, wid: V.wid, v: 0, lane: slot(i)[1], hits: [], skill: k * (0.95 + Math.random() * 0.08) * (ty === 'sport' ? 1.04 : ty === 'pickup' ? 0.96 : 1), brake: false };
        c.P = place(c, i); cars.push(c);
      }
      const P0 = place(me, n); me.vf = me.vr = 0; me.fuel = 1; me.steer = 0; camX = me.x; camY = me.y;
      race = { tr, path, laps, total: laps * path.L, P: P0, t: -3.6, lapIdx: 0, lapStart: 0, laps_: [], done: false, off: 0, lastCount: 4 };
      mode = 'carrera'; syncModeSeg(); lights = isNight() ? 'low' : lights;
      state = 'run'; run(); say(`🏁 ${tr.name}: ${laps > 1 ? laps + ' vueltas' : lenTxt(path.L)}`);
    }
    function endRace() { if (!race) return; race = null; cars = []; for (let i = 0; i < 25; i++) spawnCar(false); }
    function raceReset() { const [x, y, ux, uy] = pathAt(race.path, Math.max(0, race.P)); me.x = x; me.y = y; me.a = Math.atan2(uy, ux); me.vf = me.vr = 0; say('Volviste a la pista'); }
    function raceStep(dt) {
      const R = race; R.t += dt; const go = R.t >= 0;
      const c3 = Math.ceil(-R.t); if (!R.done && c3 !== R.lastCount && c3 >= 0 && c3 <= 3) { R.lastCount = c3; if (c3 > 0) SND.blip(440, 0.18, 'square', 0.1); else SND.blip(880, 0.45, 'square', 0.12); }
      // tu avance por la pista (sólo cuenta si vas por el camino y para adelante)
      const q = projPath(R.path, me.x, me.y, R.P);
      if (q.d < 22) { if (Math.abs(q.ds) < 40) R.P += q.ds; R.off = 0; } else R.off += dt;
      if (R.off > 1.2 && !R.done && Math.floor(R.off * 2) !== Math.floor((R.off - dt) * 2)) say('Te saliste de la pista: volvé al camino amarillo (R te lleva)', true);
      if (R.path.loop && !R.done) { const lap = Math.floor(R.P / R.path.L); if (lap > R.lapIdx && R.P > 0) { const lt = R.t - R.lapStart; R.laps_.push(lt); R.lapStart = R.t; R.lapIdx = lap; if (lap < R.laps) { say(`Vuelta ${lap}: ${fmtT(lt)}${lap === R.laps - 1 ? ' · ¡última vuelta!' : ''}`); SND.blip(990, 0.2, 'triangle', 0.12); } } }
      if (!R.done && R.P >= R.total) finishRace();
      for (const c of cars) racerStep(c, dt, go);
    }
    function racerStep(c, dt, go) {
      const R = race, path = R.path, V = 38 * c.skill;
      const [, , u1x, u1y] = pathAt(path, c.P + 3), [, , u2x, u2y] = pathAt(path, c.P + 26), [, , u3x, u3y] = pathAt(path, c.P + 48);
      const th = Math.abs(Math.atan2(u1x * u2y - u1y * u2x, u1x * u2x + u1y * u2y)), th2 = Math.abs(Math.atan2(u1x * u3y - u1y * u3x, u1x * u3x + u1y * u3y));
      let want = V;
      if (th > 0.12) want = Math.min(want, Math.max(6.5, Math.sqrt(7.2 * 22 / th)));
      if (th2 > 0.5) want = Math.min(want, Math.max(9, Math.sqrt(7.2 * 40 / th2)));
      if (isRain()) want *= 0.85;
      const gap = R.P - c.P; if (gap > 120) want *= 1.07; else if (gap < -160) want *= 0.95;
      // no pasar por arriba de nadie: frena o se abre para pasar
      for (const o of [me, ...cars]) {
        if (o === c) continue; const dx = o.x - c.x, dy = o.y - c.y, ah = dx * Math.cos(c.a) + dy * Math.sin(c.a), sd = -dx * Math.sin(c.a) + dy * Math.cos(c.a);
        if (ah > 0 && ah < 9 && Math.abs(sd) < 2.2) { const ov = o === me ? me.vf : o.v; want = Math.min(want, Math.max(0, ov - 0.3)); if (!c.passT || clock > c.passT) { c.lane = sd > 0 ? -1.8 : 1.8; c.passT = clock + 2.5; } }
      }
      if (!go) want = 0;
      if (c.fin) want = Math.min(want, 5);
      c.v += Math.max(-9 * dt, Math.min(5.4 * dt * Math.max(0.2, 1 - c.v / 46), want - c.v));
      c.brake = want < c.v - 0.4;
      c.P += c.v * dt;
      if (!c.fin && c.P >= R.total) c.fin = R.t;
      c.lc = c.lc == null ? c.lane : c.lc + (c.lane - c.lc) * Math.min(1, dt * 1.4);
      const [x, y, ux, uy] = pathAt(path, c.P), nr = nearestRoad(x, y), half = nr ? Math.max(0.4, nr.r.w / 2 - 1.3) : 1.5, ln = Math.max(-half, Math.min(half, c.lc));
      const tx = x - uy * ln, ty = y + ux * ln, kk = 1 - Math.exp(-dt * 8), ox = c.x, oy = c.y;
      c.x += (tx - c.x) * kk; c.y += (ty - c.y) * kk;
      const mvx = c.x - ox, mvy = c.y - oy; if (mvx * mvx + mvy * mvy > 1e-5) c.a += angDiff(Math.atan2(mvy, mvx) - c.a) * Math.min(1, dt * 10); else c.a += angDiff(Math.atan2(uy, ux) - c.a) * Math.min(1, dt * 4);
    }
    function racePos() { return 1 + cars.filter(c => (c.fin && !race.done) || c.P > race.P).length; }
    function finishRace() {
      const R = race; R.done = true; const T = R.t;
      if (R.path.loop && R.laps_.length < R.laps) R.laps_.push(T - R.lapStart);
      const rows = [{ name: 'Vos', t: T, me: true }];
      for (const c of cars) rows.push({ name: c.name, t: c.fin || (T + Math.max(0, R.total - c.P) / Math.max(10, c.v || 22)) });
      rows.sort((a, b) => a.t - b.t); const pos = rows.findIndex(r => r.me) + 1;
      const s = H.get(); s.raceBest = s.raceBest || {}; const key = mapId + ':' + R.tr.id, prev = s.raceBest[key], rec = !prev || T < prev.t, bl = R.laps_.length ? Math.min(...R.laps_) : null;
      if (rec) s.raceBest[key] = { t: T, lap: bl }; s.races = (s.races || 0) + 1; if (pos === 1) s.raceWins = (s.raceWins || 0) + 1; H.set(s);
      SND.blip(660, 0.2, 'triangle', 0.16); setTimeout(() => SND.blip(880, 0.2, 'triangle', 0.16), 150); setTimeout(() => SND.blip(1320, 0.4, 'triangle', 0.16), 300);
      if (pos === 1) confetti(root);
      say(pos === 1 ? '🏆 ¡Ganaste la carrera!' : `🏁 Llegaste ${pos}°`);
      setTimeout(() => {
        if (race !== R) return;
        state = 'menu';
        const tb = h('table', { class: 'brr-res' }, rows.map((r, i) => h('tr', { class: r.me ? 'me' : '' }, h('td', { text: `${i + 1}°` }), h('td', { text: r.name }), h('td', { style: 'text-align:right', text: fmtT(r.t) }))));
        const o = overlay(root, pos === 1 ? '🏆 ¡Ganaste!' : `Llegaste ${pos}°`, `${fmtT(T)}${rec ? ' · ¡nuevo récord de la pista!' : ''}${bl ? ` · mejor vuelta ${fmtT(bl)}` : ''}`, [btn('Correr de nuevo', () => startRace(R.tr), 'primary'), btn('Otra pista', () => raceMenu()), btn('Volver a manejar', () => { closeOver(root); endRace(); mode = 'libre'; syncModeSeg(); state = 'run'; run(); })]);
        o.querySelector('.mg-over-acts').before(tb);
      }, 1500);
    }
    function raceHud() {
      const R = race, n = cars.length + 1;
      const lapTxt = R.path.loop ? `🏁 Vuelta ${Math.min(R.laps, Math.max(1, R.lapIdx + 1))}/${R.laps}` : `🏁 ${Math.round(Math.max(0, Math.min(1, R.P / R.path.L)) * 100)}%`;
      const bl = R.laps_.length ? Math.min(...R.laps_) : null;
      return `<span>${lapTxt}</span><span>Posición ${R.done ? '—' : racePos()}/${n}</span><span>⏱ ${fmtT(R.t)}</span>${bl ? `<span>Mejor vuelta ${fmtT(bl)}</span>` : ''}${me.dmg > 0.005 ? `<span>🔧 ${Math.round(me.dmg * 100)}%</span>` : ''}`;
    }
    // la pista sobre las calles: línea amarilla de guía, flechitas y la largada a cuadros
    function drawRaceTrack() {
      const P = race.path;
      ctx.save(); ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath(); P.pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); if (P.loop) ctx.closePath();
      ctx.strokeStyle = 'rgba(255,214,10,.22)'; ctx.lineWidth = 2.2; ctx.stroke(); ctx.setLineDash([2.5, 3.5]); ctx.strokeStyle = 'rgba(255,214,10,.7)'; ctx.lineWidth = 0.35; ctx.stroke(); ctx.setLineDash([]);
      const s0 = Math.floor((race.P - 40) / 22) * 22;
      ctx.fillStyle = 'rgba(255,214,10,.75)';
      for (let s2 = s0; s2 < race.P + 160; s2 += 22) { if (!P.loop && (s2 < 0 || s2 > P.L)) continue; const [x, y, ux, uy] = pathAt(P, s2); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux)); ctx.beginPath(); ctx.moveTo(1.4, 0); ctx.lineTo(-0.8, -1.1); ctx.lineTo(-0.3, 0); ctx.lineTo(-0.8, 1.1); ctx.closePath(); ctx.fill(); ctx.restore(); }
      const checker = (s2) => { const [x, y, ux, uy] = pathAt(P, s2), nr = nearestRoad(x, y), w = nr ? nr.r.w : 8; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(uy, ux)); for (let i = 0; i < Math.ceil(w); i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#f4f4f4'; ctx.fillRect(j * 0.9 - 0.9, -w / 2 + i, 0.9, 1); } ctx.restore(); };
      checker(0); if (!P.loop) checker(P.L);
      ctx.restore();
    }
    // semáforo de largada y "volvé a la pista"
    function drawRaceOverlay() {
      const R = race; if (!R) return;
      if (R.t < 1) {
        const n = Math.ceil(-R.t), go = R.t >= 0, bw = 220, x = W / 2 - bw / 2, y = Hh * 0.28;
        ctx.save(); ctx.fillStyle = 'rgba(10,12,16,.85)'; ctx.beginPath(); ctx.roundRect(x, y, bw, 70, 16); ctx.fill();
        for (let i = 0; i < 3; i++) { const on = go || (3 - n) >= i; ctx.fillStyle = go ? '#30d158' : on ? '#ff3b30' : 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.arc(x + 45 + i * 65, y + 35, 20, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#fff'; ctx.font = '900 40px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(go ? '¡YA!' : String(n), W / 2, y - 30);
        ctx.restore();
      }
      if (R.off > 1.2 && !R.done) {
        const [x, y] = pathAt(R.path, Math.max(0, R.P)), [dx, dy] = rotV(x - camX, y - camY), a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - 80;
        ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r); ctx.rotate(a); ctx.fillStyle = '#ffd60a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-10, -14); ctx.lineTo(-4, 0); ctx.lineTo(-10, 14); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }

    // ---------- controles ----------
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', ' ': 'hb' };
    const keyUp = (e) => { const k = KEYS[e.key]; if (k) keys[k] = false; if (e.key === 'h' || e.key === 'H') SND.horn(false); };
    addEventListener('keyup', keyUp);
    const key = (e) => {
      SND.init();
      if ((e.key === 'h' || e.key === 'H') && state === 'run') { SND.horn(true); return true; }
      if (e.key === '+' || e.key === '=') { setZoom(zoomMul * 1.15); return true; }
      if (e.key === '-' || e.key === '_') { setZoom(zoomMul / 1.15); return true; }
      if (e.key === '0') { setZoom(1); return true; }
      if ((e.key === 'p' || e.key === 'P') && state === 'pause') { msg.hidden = true; state = 'run'; return true; }
      if (state !== 'run') return false;
      if ((e.key === 'r' || e.key === 'R') && race) { raceReset(); return true; }
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
    let modeSeg = null;
    const tools = [
      pick('Clima', Object.entries(WX), wx, (v) => { wx = v; const s = H.get(); s.wx = v; H.set(s); autoLights(); }),
      pick('Tablero', Object.entries(DASH), dash, (v) => { dash = v; const s = H.get(); s.dash = v; H.set(s); }),
      pick('Cámara', Object.entries(CAMS), camMode, (v) => { camMode = v; const st = H.get(); st.cam = v; H.set(st); }),
      pick('Vehículo', Object.entries(VEH).map(([k, v]) => [k, v.n]), veh, (v) => { veh = v; const s = H.get(); s.veh = v; H.set(s); if (me) { const V = VEH[v]; Object.assign(me, { len: V.len, wid: V.wid, type: V.t, V }); say(`Ahora manejás: ${V.n}`); } }),
      modeSeg = seg([['entregas', 'Entregas'], ['libre', 'Paseo libre'], ['carrera', '🏁 Carreras']], mode, (v) => {
        if (v === 'carrera') { if (G && me) raceMenu(); return; }
        const was = !!race; endRace(); mode = v; const s = H.get(); s.mode = v; H.set(s); job = null;
        if (state === 'run' || was) { if (v === 'entregas') newJob(); else say('Paseo libre: andá por donde quieras'); }
      }),
      btn('Cambiar zona', () => menu()),
      btn('Volver a la calle', () => { if (state === 'run') resetToRoad(); }),
      (() => { const b = btn(sndOn ? '🔊 Sonido' : '🔇 Sin sonido', () => { SND.init(); SND.on(!sndOn); b.textContent = sndOn ? '🔊 Sonido' : '🔇 Sin sonido'; const st = H.get(); st.snd = sndOn; H.set(st); }); return b; })()
    ];
    requestAnimationFrame(async () => {
      fit();
      if (host.map && mapId) { const list = await host.map.list().catch(() => []); if (list.some(x => x.id === mapId)) return loadMap(mapId); }
      menu();
    });
    return {
      el: root, tools, key,
      setSkin: (id) => { if (me) me.c = SKIN[id] || me.c; },
      help: '↑ acelerás · ↓ frenás (y marcha atrás) · ← → doblás · Espacio freno de mano · Q/E guiño izquierdo/derecho · B balizas · L luces altas · N sirena (patrullero) · H bocina · + / − o la rueda del mouse (o el analógico derecho del joystick) acercan y alejan la cámara · R volvés a la calle · P pausa. Podés ir por el borde de la vereda, más despacio. El sentido de cada calle está en el cartel de arriba, en el radar y en los carteles de las esquinas. Con lluvia frena y dobla peor.',
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
