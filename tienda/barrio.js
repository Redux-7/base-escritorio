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
  // hash para que lo "al azar" del mapa salga siempre igual
  const hsh = (a, b) => { let x = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };

  // ===================== preparar el mapa =====================
  function prepare(m) {
    const S = 0.5;
    const roads = m.roads.map((r) => { const p = []; for (let i = 0; i < r.p.length; i += 2) p.push([r.p[i] * S, r.p[i + 1] * S]); return { n: r.n, k: r.k, w: r.w, o: r.o, p, nd: r.nd && r.nd.length === p.length ? r.nd : null }; });
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
    root.append(hud, msg, toastEl);
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500, lastSz = '', rf = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); DPR = d; };
    let DPR = 1;
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);

    let G = null, mapId = H.get().map || null, mode = H.get().mode === 'libre' ? 'libre' : 'entregas';
    let me, cars = [], keys = {}, raf = 0, lastT = 0, state = 'menu', clock = 0, skids = [], toastT = 0;
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
      for (const a of G.parks) if (inT(a.bb)) { path(a.p, true); g.fillStyle = '#6f8f4e'; g.fill(); }
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
      for (const r of near) { path(r.p); g.strokeStyle = r.k === 8 ? '#a9a296' : '#8e897f'; g.lineWidth = r.w + 2.6; g.stroke(); }
      for (const r of near) { path(r.p); g.strokeStyle = r.k === 8 ? '#bdb5a6' : r.k <= 3 ? '#44474d' : '#4c4f55'; g.lineWidth = r.w; g.stroke(); }
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
      // árboles de vereda
      for (const [x, y, rr] of G.trees) {
        if (x < x0 - 6 || x > x1 + 6 || y < y0 - 6 || y > y1 + 6) continue;
        g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(x + 0.9, y + 0.9, rr, 0, TAU); g.fill();
        g.fillStyle = hsh(x | 0, y | 0) < 0.5 ? '#4f6e36' : '#5b7a3c'; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.5, 0, TAU); g.fill();
      }
      // techos
      const ROOF = ['#b0603c', '#a35a3a', '#8e8e8a', '#c9bfae', '#9b8b74', '#b7aa98', '#7d7f84', '#c06a45'];
      for (const b of inside.buildings) {
        g.save(); g.translate(1.2, 1.2); path(b.p, true); g.fillStyle = 'rgba(0,0,0,.28)'; g.fill(); g.restore();
        path(b.p, true); g.fillStyle = ROOF[(b.c * ROOF.length) | 0]; g.fill();
        g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 0.3; g.stroke();
      }
      // nombres de calles (solo los tramos que entran enteros en el mosaico)
      g.font = '600 2.6px system-ui, Segoe UI, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const r of near) {
        if (!r.n || r.k >= 7) continue;
        for (let i = 0; i < r.p.length - 1; i++) {
          const [ax, ay] = r.p[i], [bx, by] = r.p[i + 1], L = Math.hypot(bx - ax, by - ay);
          const mx = (ax + bx) / 2, my = (ay + by) / 2;
          if (L < 45 || mx < x0 + 18 || mx > x1 - 18 || my < y0 + 18 || my > y1 - 18) continue;
          let an = Math.atan2(by - ay, bx - ax); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI;
          g.save(); g.translate(mx, my); g.rotate(an); g.lineWidth = 0.7; g.strokeStyle = 'rgba(20,20,22,.75)'; g.strokeText(r.n, 0, 0); g.fillStyle = '#f4f2ea'; g.fillText(r.n, 0, 0); g.restore();
        }
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
      const [a, b, c, d] = G.bounds, s = 220 / Math.max(c - a, d - b);
      const m2 = document.createElement('canvas'); m2.width = Math.ceil((c - a) * s) + 8; m2.height = Math.ceil((d - b) * s) + 8;
      const g = m2.getContext('2d'); g.fillStyle = 'rgba(20,22,26,.72)'; g.fillRect(0, 0, m2.width, m2.height);
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
        const bus = r.k <= 3 && Math.random() < 0.12;
        const c = { ri, i: from, dir, t: Math.random(), v: SPEED[r.k] * 0.6, c: bus ? '#e8e2d0' : CAR_COLS[Math.floor(Math.random() * CAR_COLS.length)], len: bus ? 11 : 4.3, wid: bus ? 2.5 : 1.85, bus, lane: r.o ? (Math.random() < 0.5 ? -1 : 1) : 1, x, y, a: 0, brake: false, stuck: 0 };
        placeCar(c); if (cars.some(o => Math.hypot(o.x - c.x, o.y - c.y) < 9)) continue;
        cars.push(c); return;
      }
    }
    function segOf(c) { const r = G.roads[c.ri], A = r.p[c.i], B = r.p[c.i + c.dir]; return { r, A, B }; }
    function placeCar(c) {
      const { r, A, B } = segOf(c), dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const off = r.o ? c.lane * Math.min(r.w / 4, 1.8) : Math.min(r.w / 4, 3.2);
      c.x = A[0] + dx * c.t - uy * off; c.y = A[1] + dy * c.t + ux * off; c.a = Math.atan2(uy, ux); c.segL = L; c.ux = ux; c.uy = uy;
    }
    function nextSeg(c) {
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
      // auto de adelante (y el tuyo)
      for (const o of [...cars, me]) {
        if (o === c) continue;
        const dx = o.x - c.x, dy = o.y - c.y, ahead = dx * Math.cos(c.a) + dy * Math.sin(c.a), side = Math.abs(-dx * Math.sin(c.a) + dy * Math.cos(c.a));
        if (ahead > 0 && ahead < 32 && side < 2.4) { const gap = ahead - (c.len + (o.len || 4.3)) / 2 - 2.2; want = Math.min(want, Math.max(0, Math.sqrt(Math.max(0, 2 * 4.5 * gap)))); }
      }
      // doblar más despacio
      if (distEnd < 18) want = Math.min(want, Math.max(5, want * 0.7));
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
    }

    // ---------- tu auto ----------
    function startCar() {
      // arranca en la calle más cercana al centro del mapa
      let best = null, bd = 1e12;
      G.roads.forEach((r, ri) => { if (r.k > 6) return; r.p.forEach(([x, y], i) => { const d = x * x + y * y; if (d < bd && i < r.p.length - 1) { bd = d; best = [ri, i]; } }); });
      const r = G.roads[best[0]], A = r.p[best[1]], B = r.p[best[1] + 1], a = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const off = r.o ? 0 : Math.min(r.w / 4, 3.2);
      me = { x: (A[0] + B[0]) / 2 - Math.sin(a) * off, y: (A[1] + B[1]) / 2 + Math.cos(a) * off, a, vf: 0, vr: 0, steer: 0, len: 4.4, wid: 1.9, c: SKIN[H.get().skin] || '#d3202a', inLight: null };
      camX = me.x; camY = me.y;
    }
    function resetToRoad() {
      const nr = nearestRoad(me.x, me.y) || nearestRoad(me.x + 30, me.y) || null;
      if (!nr) { startCar(); return; }
      me.x = nr.px; me.y = nr.py; me.a = nr.ang; me.vf = me.vr = 0;
    }
    function carStep(dt) {
      const thr = keys.up ? 1 : 0, brk = keys.down ? 1 : 0, hb = keys.hb;
      const maxS = 0.62 / (1 + Math.abs(me.vf) / 8);
      const target = ((keys.left ? -1 : 0) + (keys.right ? 1 : 0)) * maxS;
      me.steer += (target - me.steer) * Math.min(1, dt * 7);
      const nr = nearestRoad(me.x, me.y), off = !nr || nr.d > 1.2;
      let a = 0;
      if (thr) a += me.vf < -0.3 ? 9 : 4.6 * Math.max(0, 1 - me.vf / 36);
      if (brk) a += me.vf > 0.3 ? -9.5 : -3 * (me.vf > -6 ? 1 : 0);
      if (hb) a += me.vf > 0 ? -4 : 4;
      a -= 0.25 * Math.sign(me.vf) + 0.0009 * me.vf * Math.abs(me.vf) * 2;
      if (off) { a -= Math.sign(me.vf) * 2.5; if (Math.abs(me.vf) > 9) me.vf *= 1 - dt * 1.2; }
      if (!thr && !brk && Math.abs(me.vf) < 0.25) me.vf = 0;
      me.vf += a * dt;
      // giro según volante y velocidad, con límite de agarre
      let omega = me.vf / 2.6 * Math.tan(me.steer);
      const grip = hb ? 4.5 : 9.5;
      if (Math.abs(omega * me.vf) > grip) { const ex = Math.abs(omega * me.vf) - grip; omega = Math.sign(omega) * grip / Math.max(0.1, Math.abs(me.vf)); me.vr -= Math.sign(omega * me.vf) * ex * dt * 0.6; }
      if (hb && Math.abs(me.vf) > 4) omega *= 1.35;
      me.a += omega * dt;
      me.vr *= Math.exp(-(hb ? 1.2 : 7) * dt);
      const px = me.x, py = me.y;
      me.x += (Math.cos(me.a) * me.vf - Math.sin(me.a) * me.vr) * dt;
      me.y += (Math.sin(me.a) * me.vf + Math.cos(me.a) * me.vr) * dt;
      // marcas de frenada
      if ((Math.abs(me.vr) > 2 || (brk && me.vf > 8)) && skids.length < 900) for (const s of [-0.75, 0.75]) skids.push([me.x - Math.cos(me.a) * 1.4 - Math.sin(me.a) * s, me.y - Math.sin(me.a) * 1.4 + Math.cos(me.a) * s]);
      // choques con casas
      const ca = Math.cos(me.a), sa = Math.sin(me.a), hl = me.len / 2 - 0.2, hw = me.wid / 2 - 0.1;
      for (const [fx, fy] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw]]) {
        if (inBuilding(me.x + ca * fx - sa * fy, me.y + sa * fx + ca * fy)) { me.x = px; me.y = py; if (Math.abs(me.vf) > 4) crash('¡Chocaste contra una casa!'); me.vf *= -0.25; me.vr = 0; break; }
      }
      // choques con autos
      for (const c of cars) {
        const dx = c.x - me.x, dy = c.y - me.y, d = Math.hypot(dx, dy), minD = (c.bus ? 4.2 : 2.9);
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
    function drawCar(c, mine) {
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
      const L = c.len, Wd = c.wid;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(-L / 2 + 0.4, -Wd / 2 + 0.4, L, Wd, 0.6); ctx.fill();
      ctx.fillStyle = c.c; ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, c.bus ? 0.4 : 0.7); ctx.fill();
      if (c.bus) { ctx.fillStyle = 'rgba(30,40,55,.55)'; ctx.fillRect(-L / 2 + 0.6, -Wd / 2 + 0.25, L - 1.2, 0.35); ctx.fillRect(-L / 2 + 0.6, Wd / 2 - 0.6, L - 1.2, 0.35); ctx.fillStyle = '#2f6b4f'; ctx.fillRect(-L / 2 + 0.5, -0.5, L - 1, 1); }
      else {
        ctx.fillStyle = 'rgba(25,35,50,.85)'; ctx.beginPath(); ctx.roundRect(L * 0.08, -Wd / 2 + 0.2, L * 0.2, Wd - 0.4, 0.3); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-L * 0.36, -Wd / 2 + 0.25, L * 0.13, Wd - 0.5, 0.25); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-L * 0.2, -Wd / 2 + 0.25, L * 0.27, Wd - 0.5);
      }
      ctx.fillStyle = '#fff6c8'; ctx.fillRect(L / 2 - 0.25, -Wd / 2 + 0.2, 0.25, 0.45); ctx.fillRect(L / 2 - 0.25, Wd / 2 - 0.65, 0.25, 0.45);
      const brake = mine ? keys.down && me.vf > 0.5 : c.brake;
      ctx.fillStyle = brake ? '#ff2a2a' : '#7a1515'; ctx.fillRect(-L / 2, -Wd / 2 + 0.2, 0.3, 0.45); ctx.fillRect(-L / 2, Wd / 2 - 0.65, 0.3, 0.45);
      if (brake) { ctx.fillStyle = 'rgba(255,40,40,.25)'; ctx.beginPath(); ctx.arc(-L / 2, 0, 1.6, 0, TAU); ctx.fill(); }
      if (mine) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 0.7); ctx.stroke(); }
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
    function draw() {
      if (!G || !me) return;
      ctx.fillStyle = '#b9b3a6'; ctx.fillRect(0, 0, W, Hh);
      ctx.save();
      ctx.translate(W / 2, Hh / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
      const vx0 = camX - W / 2 / zoom, vy0 = camY - Hh / 2 / zoom, vx1 = camX + W / 2 / zoom, vy1 = camY + Hh / 2 / zoom;
      ctx.imageSmoothingEnabled = true;
      for (let tx = Math.floor(vx0 / TILE); tx <= Math.floor(vx1 / TILE); tx++) for (let ty = Math.floor(vy0 / TILE); ty <= Math.floor(vy1 / TILE); ty++) ctx.drawImage(tile(tx, ty), tx * TILE, ty * TILE, TILE, TILE);
      ctx.fillStyle = 'rgba(20,20,20,.35)'; for (const [x, y] of skids) ctx.fillRect(x - 0.15, y - 0.15, 0.3, 0.3);
      if (job) { const p = 1 + Math.sin(clock * 5) * 0.15; ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(job.x, job.y, 12 * p, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,214,10,.18)'; ctx.fill(); }
      for (const c of cars) if (c.x > vx0 - 12 && c.x < vx1 + 12 && c.y > vy0 - 12 && c.y < vy1 + 12) drawCar(c);
      drawCar(me, true);
      drawLights();
      ctx.restore();
      // flecha hacia la entrega
      if (job) {
        const dx = job.x - camX, dy = job.y - camY, sx = W / 2 + dx * zoom, sy = Hh / 2 + dy * zoom;
        if (sx < 20 || sy < 20 || sx > W - 20 || sy > Hh - 20) {
          const a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - 34;
          ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r); ctx.rotate(a);
          ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -11); ctx.lineTo(-5, 0); ctx.lineTo(-10, 11); ctx.closePath(); ctx.fill(); ctx.restore();
        }
      }
      // mapita
      if (mini) {
        const mx = W - mini.c.width - 14, my = Hh - mini.c.height - 14;
        ctx.drawImage(mini.c, mx, my);
        const P = (x, y) => [mx + 4 + (x - mini.a) * mini.s, my + 4 + (y - mini.b) * mini.s];
        if (job) { const [x, y] = P(job.x, job.y); ctx.fillStyle = '#ffd60a'; ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill(); }
        const [x, y] = P(me.x, me.y); ctx.save(); ctx.translate(x, y); ctx.rotate(me.a); ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
    function hudPaint() {
      const nr = nearestRoad(me.x, me.y), street = nr && nr.d < 4 && nr.r.n ? nr.r.n : '';
      const kmh = Math.round(Math.abs(me.vf) * 3.6);
      let h2 = `<span class="mv-big">${kmh}<small> km/h</small></span>`;
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
      buildMini(); startCar(); cars = []; skids = []; stats = { red: 0, crash: 0, done: 0, pts: 0 }; job = null;
      for (let i = 0; i < 30; i++) spawnCar(false);
      window.__barrio = { cars: () => cars.map(c => [Math.round(c.x), Math.round(c.y), +c.v.toFixed(1)]), me: () => me, lights: () => [...G.lights.values()].map(L => [L.x, L.y]) };
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
      const inp = h('input', { class: 'br-in', type: 'text', placeholder: 'Calle y altura, barrio o ciudad (ej.: Belgrano 100, Morón)' });
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
        if (!r.list.length) { res.append(h('small', { text: 'No encontré esa dirección. Probá con la ciudad (ej.: "Belgrano 100, Morón").' })); return; }
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
      if (e.key === 'r' || e.key === 'R') { resetToRoad(); say('Volviste a la calle'); return true; }
      if (e.key === 'p' || e.key === 'P') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; keys = {}; return true; }
      const k = KEYS[e.key]; if (!k) return false; keys[k] = true; return true;
    };
    const tools = [
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
      help: '↑ acelerás · ↓ frenás (y marcha atrás) · ← → doblás · Espacio freno de mano · R volvés a la calle · P pausa. Respetá los semáforos: cruzar en rojo resta puntos.',
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
