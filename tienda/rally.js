// Tienda de Base · Rally (carreras vistas desde arriba)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const SFX = (BM.util && BM.util.sfx) || Object.assign(() => {}, { engine: () => ({ set() {}, stop() {} }) });
  const { h, rnd, seg, btn, overlay, confetti, fmtTime } = BM.util;
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };

  const TRACKS = {
    costanera: { n: 'Costanera', w: 150, pts: [[0, 0], [900, -60], [1500, 120], [1750, 600], [1500, 1050], [1000, 1150], [700, 900], [400, 1100], [-150, 1050], [-450, 700], [-380, 250]], grass: '#4f9a3f', dark: '#468c37' },
    montana: { n: 'Montaña', w: 135, pts: [[0, 0], [600, -250], [1200, -150], [1450, 250], [1100, 550], [1400, 900], [1200, 1300], [600, 1250], [350, 900], [0, 1200], [-500, 1000], [-600, 500], [-250, 300]], grass: '#8a7a55', dark: '#7d6e4b' },
    circuito: { n: 'Circuito', w: 160, pts: [[0, 0], [1400, 0], [1700, 300], [1700, 700], [1400, 1000], [900, 1000], [700, 750], [450, 1000], [0, 1000], [-300, 700], [-300, 300]], grass: '#3f8a4a', dark: '#387d42' }
  };
  // curva suave que pasa por los puntos (Catmull-Rom cerrada)
  function spline(pts, n) {
    const out = [], N = pts.length;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
      }
    }
    return out;
  }

  // tipos de vehículo: velocidad máxima, aceleración, cuánto dobla y cuánto pierde fuera de la pista
  const CARS = {
    compacto: { n: 'Compacto', max: 330, acc: 300, turn: 2.9, off: 0.45, len: 1 },
    deportivo: { n: 'Deportivo', max: 420, acc: 290, turn: 2.35, off: 0.38, len: 1.12 },
    camioneta: { n: '4x4', max: 310, acc: 260, turn: 2.45, off: 0.85, len: 1.15 },
    kart: { n: 'Karting', max: 280, acc: 400, turn: 3.4, off: 0.4, len: 0.8 }
  };
  const SKIN = { rojo: '#e8202a', azul: '#2f6fed', amarillo: '#f5b52e', verde: '#27ae60', violeta: '#8e44ad', negro: '#23262d', blanco: '#f2f2f2' };
  function rally(H) {
    let trackId = H.get().track || 'costanera';
    let carId = CARS[H.get().car] ? H.get().car : 'compacto';
    const LAPS = 3;
    const root = h('div', { class: 'mg-move' });
    const cv = h('canvas', { class: 'mv-cv' }); root.append(cv);
    const hud = h('div', { class: 'mv-hud' }), msg = h('div', { class: 'sn-msg', text: '' });
    root.append(hud, msg);
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500;
    let lastSz = '', rf = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); draw(); };
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);

    let T, path, cars, me, state, count, raceT, keys = {}, raf = 0, lastT = 0, trees = [], skids = [];
    const status = () => H.status([`Vuelta ${Math.min(LAPS, (me ? me.lap : 0) + 1)}/${LAPS}`, H.get()['best_' + trackId + '_' + carId] ? `Mejor vuelta ${fmtLap(H.get()['best_' + trackId + '_' + carId])}` : '']);
    const fmtLap = (s) => fmtTime(Math.floor(s)) + '.' + String(Math.floor((s % 1) * 10));
    function nearest(c, hint) {
      // busca el punto del trazado más cercano (cerca del último conocido para que sea rápido)
      const N = path.length; let best = hint, bd = 1e12;
      const scan = (from, to) => { for (let k = from; k <= to; k++) { const i = (k + N) % N, dx = path[i][0] - c.x, dy = path[i][1] - c.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } } };
      if (hint == null) scan(0, N - 1); else scan(hint - 25, hint + 25);
      return { i: best, d: Math.sqrt(bd) };
    }
    function newGame() {
      closeOver(root);
      T = TRACKS[trackId];
      path = spline(T.pts, 40);
      const N = path.length;
      const [sx, sy] = path[0], [nx, ny] = path[3];
      const ang = Math.atan2(ny - sy, nx - sx);
      const mine = SKIN[H.get().skin] || '#e8202a';
      const colors = [mine, ...['#e8202a', '#2f6fed', '#f5b52e', '#27ae60', '#8e44ad'].filter(c => c !== mine).slice(0, 3)];
      cars = colors.map((c, i) => {
        const row = Math.floor(i / 2), side = i % 2 ? 1 : -1;
        const bx = sx - Math.cos(ang) * (60 + row * 70), by = sy - Math.sin(ang) * (60 + row * 70);
        return { x: bx + Math.cos(ang + Math.PI / 2) * side * 34, y: by + Math.sin(ang + Math.PI / 2) * side * 34, a: ang, v: 0, c, ai: i > 0, skill: 0.86 + i * 0.035 + Math.random() * 0.04, lap: 0, idx: N - 6, prog: 0, cps: 0, lapStart: 0, best: 0, done: false, place: 0, finishT: 0, drift: 0 };
      });
      me = cars[0];
      // árboles al costado
      trees = [];
      for (let k = 0; k < 140; k++) {
        const i = rnd(N), [px, py] = path[i], [qx, qy] = path[(i + 1) % N];
        const nrm = Math.atan2(qy - py, qx - px) + Math.PI / 2, side = Math.random() < 0.5 ? -1 : 1, dist = T.w / 2 + 60 + Math.random() * 260;
        const t = { x: px + Math.cos(nrm) * side * dist, y: py + Math.sin(nrm) * side * dist, r: 18 + Math.random() * 22 };
        if (nearest(t).d > T.w / 2 + t.r + 20) trees.push(t);
      }
      skids = [];
      state = 'count'; count = 3.2; raceT = 0; keys = {};
      msg.hidden = true; status(); hudPaint();
      start();
    }
    function hudPaint() {
      const pos = 1 + cars.filter(c => c !== me && (c.lap * 1e5 + c.prog) > (me.lap * 1e5 + me.prog)).length;
      hud.innerHTML = `<span class="mv-big">${Math.round(Math.abs(me.v) * 0.42)}<small> km/h</small></span><span>Vuelta ${Math.min(LAPS, me.lap + 1)}/${LAPS}</span><span>Puesto ${me.done ? me.place : pos}°/4</span><span>${fmtLap(raceT)}</span>`;
    }
    function start() { cancelAnimationFrame(raf); lastT = 0; const fr = (t) => { const dt = Math.min(0.04, lastT ? (t - lastT) / 1000 : 0.016); lastT = t; step(dt); draw(); hudPaint(); if (state !== 'over' && state !== 'pause') raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }
    function drive(c, dt, thr, steer, brake) {
      const nr = nearest(c, c.idx); c.idx = nr.i;
      const off = nr.d > T.w / 2, K = CARS[carId];
      const maxV = K.max * (off ? K.off : 1) * (c.ai ? c.skill : 1);
      const acc = K.acc * (off ? 0.7 : 1);
      if (thr) c.v += acc * dt; else if (brake) c.v -= (c.v > 0 ? 520 : 160) * dt; else c.v -= Math.sign(c.v) * 110 * dt;
      if (c.v > maxV) c.v -= (c.v - maxV) * Math.min(1, dt * (off ? 3 : 1.5));
      c.v = Math.max(-110, c.v);
      const turn = steer * Math.min(1, Math.abs(c.v) / 120) * (c.v >= 0 ? 1 : -1) * K.turn;
      c.a += turn * dt;
      c.drift = c.drift * 0.9 + turn * Math.abs(c.v) / K.max * 0.1;
      c.x += Math.cos(c.a - c.drift * 0.25) * c.v * dt;
      c.y += Math.sin(c.a - c.drift * 0.25) * c.v * dt;
      if (Math.abs(c.drift) > 0.12 && Math.abs(c.v) > K.max * 0.6 && !c.ai && skids.length < 600) skids.push([c.x, c.y]);
      // avance por la pista
      const N = path.length, prev = c.prog; c.prog = c.idx;
      if (prev > N * 0.8 && c.idx < N * 0.2 && c.cps >= 2) { // cruzó la meta
        const lt = raceT - c.lapStart; c.lapStart = raceT; c.lap++; c.cps = 0; if (c === me) SFX('score');
        if (!c.ai) { if (!c.best || lt < c.best) c.best = lt; const s = H.get(); if (!s['best_' + trackId + '_' + carId] || lt < s['best_' + trackId + '_' + carId]) { s['best_' + trackId + '_' + carId] = lt; H.set(s); } status(); }
        if (c.lap >= LAPS && !c.done) { c.done = true; c.finishT = raceT; c.place = cars.filter(x => x.done).length; }
      }
      if (c.cps === 0 && c.idx > N * 0.33 && c.idx < N * 0.5) c.cps = 1;
      if (c.cps === 1 && c.idx > N * 0.66 && c.idx < N * 0.85) c.cps = 2;
    }
    let eng = null;
    function step(dt) {
      if (state === 'count') { const c0 = Math.ceil(count); count -= dt; if (count <= 0) { state = 'race'; SFX('go'); } else if (Math.ceil(count) !== c0) SFX('beep'); return; }
      if (!eng) eng = SFX.engine('auto'); eng.set(Math.abs(me.v) / (CARS[carId].max || 300));
      if (state !== 'race' && state !== 'finish') return;
      raceT += dt;
      const N = path.length;
      for (const c of cars) {
        if (c.ai || c.done) {
          // la compu mira unos puntos más adelante y dobla hacia ahí
          const look = path[(c.idx + 9 + Math.round(Math.abs(c.v) / 45)) % N];
          let da = Math.atan2(look[1] - c.y, look[0] - c.x) - c.a;
          while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
          const steer = Math.max(-1, Math.min(1, da * 2.2));
          const top = CARS[carId].max;
          drive(c, dt, Math.abs(da) < 0.5 || c.v < top * 0.55, steer, Math.abs(da) > 0.7 && c.v > top * 0.75);
        } else drive(c, dt, keys.up, (keys.left ? -1 : 0) + (keys.right ? 1 : 0), keys.down);
      }
      // choques entre autos
      for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i], b = cars[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < 40 && d > 0) { if ((a === me || b === me) && Math.abs(a.v - b.v) > 60 && Math.random() < 0.2) SFX('hit'); const push = (40 - d) / 2, ux = dx / d, uy = dy / d; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; a.v *= 0.96; b.v *= 0.96; }
      }
      // árboles
      for (const c of cars) for (const t of trees) { const dx = c.x - t.x, dy = c.y - t.y, d = Math.hypot(dx, dy); if (d < t.r + 16) { if (c === me && Math.abs(c.v) > 60) SFX('crash'); c.x = t.x + dx / d * (t.r + 16); c.y = t.y + dy / d * (t.r + 16); c.v *= 0.4; } }
      if (me.done && state === 'race') { state = 'finish'; setTimeout(finish, 1200); }
    }
    function finish() {
      state = 'over'; if (eng) { eng.stop(); eng = null; }
      const s = H.get(); s.games = (s.games || 0) + 1; if (me.place === 1) s.wins = (s.wins || 0) + 1; H.set(s); status();
      if (me.place === 1) confetti(root);
      overlay(root, me.place === 1 ? '¡Ganaste!' : `Llegaste ${me.place}°`, `Tiempo ${fmtLap(me.finishT)} · mejor vuelta ${fmtLap(me.best)}`, [btn('Otra carrera', newGame, 'primary')]);
    }
    function drawCar(c) {
      const K = CARS[carId], L = K.len;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.scale(L, L);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-20, -11, 44, 26);
      const wheels = (w, hh) => { ctx.fillStyle = '#111'; ctx.fillRect(-15, -hh - 4, w, 5 + (carId === 'camioneta' ? 2 : 0)); ctx.fillRect(8, -hh - 4, w, 5 + (carId === 'camioneta' ? 2 : 0)); ctx.fillRect(-15, hh - 1, w, 5 + (carId === 'camioneta' ? 2 : 0)); ctx.fillRect(8, hh - 1, w, 5 + (carId === 'camioneta' ? 2 : 0)); };
      if (carId === 'kart') {
        wheels(8, 12);
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(-16, -8); ctx.lineTo(14, -6); ctx.lineTo(20, 0); ctx.lineTo(14, 6); ctx.lineTo(-16, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#222'; ctx.fillRect(-18, -11, 4, 22);
        ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(-4, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.arc(-4, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      } else if (carId === 'deportivo') {
        wheels(9, 10);
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(-22, -9); ctx.lineTo(10, -10); ctx.quadraticCurveTo(26, -7, 26, 0); ctx.quadraticCurveTo(26, 7, 10, 10); ctx.lineTo(-22, 9); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1b1b1b'; ctx.fillRect(-24, -11, 5, 22);
        ctx.fillStyle = 'rgba(20,30,45,.9)'; ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(6, -6); ctx.lineTo(9, 0); ctx.lineTo(6, 6); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-22, -4, 46, 2); ctx.fillRect(-22, 2, 46, 2);
      } else if (carId === 'camioneta') {
        wheels(10, 11);
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.roundRect(-22, -11, 46, 22, 4); ctx.fill();
        ctx.fillStyle = 'rgba(20,30,45,.85)'; ctx.fillRect(4, -9, 9, 18);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-19, -8, 18, 16);
        ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.5; ctx.strokeRect(-17, -6, 14, 12);
        ctx.fillStyle = '#ffe9a8'; ctx.fillRect(22, -9, 3, 4); ctx.fillRect(22, 5, 3, 4);
      } else {
        wheels(9, 10);
        ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(-21, -10); ctx.lineTo(16, -10); ctx.quadraticCurveTo(23, -10, 23, 0); ctx.quadraticCurveTo(23, 10, 16, 10); ctx.lineTo(-21, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(20,30,45,.85)'; ctx.fillRect(2, -8, 9, 16); ctx.fillRect(-14, -7, 6, 14);
        ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-21, -1.5, 44, 3);
      }
      ctx.restore();
    }
    function draw() {
      if (!path) return;
      const zoom = Math.min(W, Hh) / 540;
      ctx.fillStyle = T.grass; ctx.fillRect(0, 0, W, Hh);
      ctx.save();
      const camX = me.x + Math.cos(me.a) * me.v * 0.25, camY = me.y + Math.sin(me.a) * me.v * 0.25;
      ctx.translate(W / 2, Hh / 2); ctx.scale(zoom, zoom); ctx.translate(-camX, -camY);
      // pasto a cuadros
      const g0x = Math.floor((camX - W / zoom) / 200) * 200, g0y = Math.floor((camY - Hh / zoom) / 200) * 200;
      ctx.fillStyle = T.dark;
      for (let x = g0x; x < camX + W / zoom; x += 200) for (let y = g0y; y < camY + Hh / zoom; y += 200) if (((x + y) / 200) % 2 === 0) ctx.fillRect(x, y, 200, 200);
      const line = (w, col, dash) => { ctx.beginPath(); ctx.moveTo(path[0][0], path[0][1]); for (const p of path) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.setLineDash(dash || []); ctx.lineJoin = 'round'; ctx.stroke(); ctx.setLineDash([]); };
      line(T.w + 22, '#c0392b'); line(T.w + 22, '#f2f2f2', [30, 30]); line(T.w, '#5a5d63'); line(4, 'rgba(255,255,255,.55)', [26, 30]);
      // meta a cuadros
      const [sx, sy] = path[0], [nx, ny] = path[1], a = Math.atan2(ny - sy, nx - sx);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a);
      for (let i = 0; i < 2; i++) for (let j = 0; j < Math.ceil(T.w / 12); j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(i * 12 - 12, -T.w / 2 + j * 12, 12, 12); }
      ctx.restore();
      ctx.fillStyle = 'rgba(20,20,20,.35)'; for (const s of skids) ctx.fillRect(s[0] - 2, s[1] - 2, 4, 4);
      for (const c of cars) drawCar(c);
      for (const t of trees) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(t.x + 6, t.y + 8, t.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#2e6b2a'; ctx.beginPath(); ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#3d8a37'; ctx.beginPath(); ctx.arc(t.x - t.r * 0.25, t.y - t.r * 0.25, t.r * 0.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      // mapita
      const mm = 150 * Math.min(1, W / 900), xs = path.map(p => p[0]), ys = path.map(p => p[1]);
      const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys), sc = mm / Math.max(maxx - minx, maxy - miny);
      ctx.save(); ctx.translate(W - mm - 18, Hh - (maxy - miny) * sc - 18);
      ctx.fillStyle = 'rgba(5,8,14,.45)'; ctx.fillRect(-8, -8, (maxx - minx) * sc + 16, (maxy - miny) * sc + 16);
      ctx.beginPath(); path.forEach((p, i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, (p[0] - minx) * sc, (p[1] - miny) * sc)); ctx.closePath(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
      for (const c of cars) { ctx.fillStyle = c.c; ctx.beginPath(); ctx.arc((c.x - minx) * sc, (c.y - miny) * sc, c === me ? 5 : 4, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      if (state === 'count') { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = '#fff'; ctx.font = `900 ${Math.min(W, Hh) * 0.25}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(count > 0.2 ? String(Math.ceil(count - 0.2)) : '¡YA!', W / 2, Hh / 2); }
    }
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
    addEventListener('keyup', (e) => { const k = KEYS[e.key]; if (k) keys[k] = false; });
    const key = (e) => {
      if (e.key === 'p' || e.key === 'P') { if (state === 'race') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } else if (state === 'pause') { state = 'race'; msg.hidden = true; start(); } return true; }
      const k = KEYS[e.key]; if (!k) return false; keys[k] = true; return true;
    };
    const tools = [seg(Object.entries(TRACKS).map(([k, v]) => [k, v.n]), trackId, (v) => { trackId = v; const s = H.get(); s.track = v; H.set(s); newGame(); }),
      seg(Object.entries(CARS).map(([k, v]) => [k, v.n]), carId, (v) => { carId = v; const s = H.get(); s.car = v; H.set(s); newGame(); }), btn('Nueva', newGame)];
    requestAnimationFrame(() => { fit(); newGame(); });
    return { el: root, tools, key, setSkin: (id) => { if (me) me.c = SKIN[id] || me.c; draw(); }, help: 'Carrera de 3 vueltas contra la compu. Elegí el vehículo: Compacto (parejo), Deportivo (el más rápido, dobla peor), 4x4 (casi no pierde fuera de la pista) o Karting (dobla y acelera muy bien). Flechas: ↑ acelera, ↓ frena, ← → doblás. P pausa.', hide: () => { if (state === 'race') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } keys = {}; } };
  }

  BM.register({ id: 'rally', n: 'Rally', d: 'Carreras vistas desde arriba: 3 vueltas contra la compu.', c: '#d35400', create: rally, skinLabel: 'Auto',
    skins: [['rojo', 'Rojo', '#e8202a'], ['azul', 'Azul', '#2f6fed'], ['amarillo', 'Amarillo', '#f5b52e'], ['verde', 'Verde', '#27ae60'], ['violeta', 'Violeta', '#8e44ad'], ['negro', 'Negro', '#23262d'], ['blanco', 'Blanco', '#f2f2f2']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#4f9a3f"/><path d="M14 50c-8-10-6-30 8-36s30-2 32 12-10 14-16 18-16 16-24 6z" fill="none" stroke="#5a5d63" stroke-width="9" stroke-linejoin="round"/><path d="M14 50c-8-10-6-30 8-36s30-2 32 12-10 14-16 18-16 16-24 6z" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="3 3"/><g transform="rotate(-30 22 18)"><rect x="15" y="14" width="14" height="8" rx="2" fill="#e8202a"/><rect x="22" y="15" width="3" height="6" fill="#1d2633"/></g><g transform="rotate(60 50 34)"><rect x="43" y="30" width="14" height="8" rx="2" fill="#2f6fed"/></g></svg>',
    best: (s) => s.wins ? `${s.wins} carreras ganadas` : (s.games ? 'Todavía sin ganar' : 'Nunca jugaste') });
})();
