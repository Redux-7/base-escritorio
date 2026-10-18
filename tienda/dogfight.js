// Tienda de Base · Duelo aéreo (naves que se disparan, vistas desde arriba)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, rnd, seg, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || Object.assign(() => {}, { engine: () => ({ set() {}, stop() {} }) });
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const WORLD = 3200;
  const wrapD = (d) => { while (d > WORLD / 2) d -= WORLD; while (d < -WORLD / 2) d += WORLD; return d; };
  const wrapP = (v) => ((v % WORLD) + WORLD) % WORLD;
  const angDiff = (a) => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };
  const LV = { facil: { n: 'Fácil', aim: 0.45, turn: 2.0, fire: 1.6 }, normal: { n: 'Normal', aim: 0.25, turn: 2.4, fire: 1.15 }, as: { n: 'As del aire', aim: 0.12, turn: 2.8, fire: 0.8 } };

  // aviones: jet moderno o biplanos de la Primera Guerra (caza ágil o bombardero lento con artillero atrás)
  const MODES = {
    jet: { n: 'Jet moderno', turn: 3.1, vMin: 170, vMid: 260, vMax: 380, hp: 10, cd: 0.12, bs: 720 },
    caza: { n: 'Caza (1ª Guerra)', turn: 3.6, vMin: 120, vMid: 175, vMax: 245, hp: 8, cd: 0.11, bs: 560, ww1: true },
    bomb: { n: 'Bombardero (1ª Guerra)', turn: 1.8, vMin: 95, vMid: 135, vMax: 180, hp: 22, cd: 0.2, bs: 560, ww1: true, gunner: true },
    // Fokker Dr.I del Barón Rojo: lento y frágil, pero el que mejor dobla
    baron: { n: 'Barón Rojo (Fokker Dr.I)', turn: 4.4, vMin: 105, vMid: 150, vMax: 200, hp: 6, cd: 0.1, bs: 560, ww1: true, tri: true }
  };
  const SIDES = {
    aliados: { n: 'Aliados', cols: ['#7a7346', '#8c7f55', '#6a6a48', '#857a5c'] },
    centrales: { n: 'Potencias Centrales', cols: ['#4f5b3c', '#5e4b34', '#56603f', '#6b5a44'] }
  };
  const LOCS = {
    frente: { n: 'Frente occidental' }, flandes: { n: 'Campos de Flandes' }, alpes: { n: 'Alpes (frente italiano)' },
    costa: { n: 'Costa del canal' }, noche: { n: 'Frente de noche' }
  };
  const CHEATS = { no: 'Sin trucos', inv: 'Invencible', triple: 'Disparo triple', todo: 'Invencible + triple' };
  const SKIN = { rojo: '#e8202a', amarillo: '#f5c518', blanco: '#eceff3', negro: '#2b2f37', camuflado: '#5b6b3a', naranja: '#ff7a1a' };
  function dogfight(H) {
    let lv = H.get().lv || 'normal';
    let mode = MODES[H.get().mode] ? H.get().mode : 'jet';
    let side = SIDES[H.get().side] ? H.get().side : 'aliados';
    let loc = LOCS[H.get().loc] ? H.get().loc : 'frente';
    let cheat = CHEATS[H.get().cheat] ? H.get().cheat : 'no';
    const mySide = () => mode === 'baron' ? 'centrales' : side;
    const foeSide = () => mySide() === 'aliados' ? 'centrales' : 'aliados';
    const invincible = () => cheat === 'inv' || cheat === 'todo';
    const triple = () => cheat === 'triple' || cheat === 'todo';
    const M = () => MODES[mode];
    const bestKey = () => 'best_' + lv + (mode === 'jet' ? '' : '_' + mode);
    const root = h('div', { class: 'mg-move' });
    const cv = h('canvas', { class: 'mv-cv' }); root.append(cv);
    const hud = h('div', { class: 'mv-hud' }), msg = h('div', { class: 'sn-msg' });
    root.append(hud, msg);
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500, lastSz = '', rf = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); draw(); };
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);

    let fields = [], feats = [], trenches = [], ships = [], lights = [], wrecks = [], flak = 0;
    let me, foes, shots, fx, pickups, clouds, wave, score, state, keys = {}, raf = 0, lastT = 0, waveT = 0;
    const status = () => H.status([`${score || 0} puntos`, `Oleada ${wave || 1}`, cheat !== 'no' ? `Con trucos: ${CHEATS[cheat]} (sin récord)` : `Mejor ${H.get()[bestKey()] || 0}`]);
    function plane(x, y, a, c, foe) { return { x, y, a, v: foe ? 230 : M().vMid, c, hp: foe ? 3 : M().hp, max: foe ? 3 : M().hp, cd: 0, gcd: 0, foe, hit: 0, think: Math.random(), kind: foe ? 'caza' : (mode === 'baron' ? 'tri' : mode), side: foe ? foeSide() : mySide() }; }
    function newGame() {
      closeOver(root);
      const myCol = mode === 'baron' ? '#b3201c' : M().ww1 ? SIDES[mySide()].cols[0] : (SKIN[H.get().skin] || '#e8202a');
      me = plane(WORLD / 2, WORLD / 2, -Math.PI / 2, myCol, false);
      wrecks = [];
      foes = []; shots = []; fx = []; pickups = []; wave = 0; score = 0; keys = {};
      clouds = []; for (let i = 0; i < 40; i++) clouds.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, r: 60 + Math.random() * 120, hi: Math.random() < 0.4 });
      // campo visto desde arriba (parcelas, caminos y casitas) para la Primera Guerra
      buildGround();
      nextWave(); state = 'run'; msg.hidden = true; status(); start();
    }
    function nextWave() {
      wave++; waveT = 2.5; if (wave > 1) SFX('start');
      const n = Math.min(8, 1 + wave);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, d = 900 + Math.random() * 500;
        const ww1 = M().ww1;
        const cols = ww1 ? SIDES[foeSide()].cols : ['#2f6fed', '#27ae60', '#8e44ad', '#f39c12'];
        const f = plane(wrapP(me.x + Math.cos(ang) * d), wrapP(me.y + Math.sin(ang) * d), ang + Math.PI, cols[wave % 4], true);
        f.hp = f.max = 2 + Math.floor(wave / 3); f.v = ww1 ? 150 + wave * 5 : 210 + wave * 8;
        if (ww1 && wave >= 2 && i % 3 === 2) { f.kind = 'bomb'; f.hp = f.max = f.hp * 3; f.v *= 0.7; }
        foes.push(f);
      }
      status();
    }
    // ---------- suelo de la Primera Guerra según el lugar ----------
    const PAL = {
      frente: ['#5a5040', '#655a47', '#4f4636', '#6b5f4a', '#574d3c'],
      flandes: ['#5f6b45', '#6d7550', '#56603f', '#717455', '#62684a'],
      alpes: ['#dfe3e6', '#d3d8dc', '#e8ebee', '#c9cfd4', '#dde1e4'],
      costa: ['#5f6b45', '#6d7550', '#56603f', '#6a6c4f', '#62684a'],
      noche: ['#5a5040', '#655a47', '#4f4636', '#6b5f4a', '#574d3c']
    };
    function buildGround() {
      fields = []; feats = []; trenches = []; ships = []; lights = [];
      const pal = PAL[loc];
      for (let gx = 0; gx < WORLD; gx += 200) for (let gy = 0; gy < WORLD; gy += 200) {
        const sea = loc === 'costa' && gx < WORLD * 0.35;
        const beach = loc === 'costa' && gx >= WORLD * 0.35 && gx < WORLD * 0.35 + 200;
        fields.push({ x: gx, y: gy, c: sea ? '#3c5566' : beach ? '#b3a585' : pal[rnd(pal.length)], sea, rows: !sea && !beach && loc !== 'alpes' && Math.random() < 0.35 });
      }
      const add = (n, t, f) => { for (let i = 0; i < n; i++) { const x = Math.random() * WORLD, y = Math.random() * WORLD; if (loc === 'costa' && x < WORLD * 0.37) continue; feats.push(Object.assign({ t, x, y, r: 8 + Math.random() * 22 }, f ? f() : {})); } };
      if (loc === 'frente' || loc === 'noche') { add(260, 'crater'); add(70, 'stump'); add(10, 'ruin'); }
      if (loc === 'flandes') { add(90, 'crater'); add(40, 'ruin'); add(80, 'tree'); add(160, 'poppy'); }
      if (loc === 'alpes') { add(110, 'rock'); add(160, 'pine'); add(30, 'crater'); }
      if (loc === 'costa') { add(80, 'crater'); add(25, 'ruin'); add(40, 'tree'); for (let i = 0; i < 7; i++) ships.push({ x: Math.random() * WORLD * 0.3, y: Math.random() * WORLD, a: Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2, len: 70 + Math.random() * 60 }); }
      if (loc !== 'alpes') {
        // trincheras en zigzag que cruzan el mapa
        for (const ty of [WORLD * 0.3, WORLD * 0.62]) { const pts = []; for (let x = 0; x <= WORLD; x += 70) pts.push([x, ty + (pts.length % 2 ? 26 : -26) + (Math.random() - 0.5) * 20]); trenches.push(pts); }
      }
      if (loc === 'noche') for (let i = 0; i < 9; i++) lights.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, a: Math.random() * 6.28, sp: (0.25 + Math.random() * 0.3) * (Math.random() < 0.5 ? -1 : 1) });
    }
    function smoke(x, y, dark, big) { fx.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20, life: big ? 1.6 : 1.1, max: big ? 1.6 : 1.1, r: big ? 10 : 5, smoke: true, c: dark ? '40,38,36' : '120,118,112' }); }
    function crash(f) {
      // el avión cae dando vueltas con humo y fuego, y explota contra el suelo
      wrecks.push({ x: f.x, y: f.y, a: f.a, v: f.v * 0.6, spin: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 2), t: 1.6, p: f });
    }
    function start() { cancelAnimationFrame(raf); lastT = 0; const fr = (t) => { const dt = Math.min(0.04, lastT ? (t - lastT) / 1000 : 0.016); lastT = t; step(dt); draw(); hudPaint(); if (state === 'run') raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }
    function hudPaint() {
      hud.innerHTML = `<span class="mv-big">${score}<small> puntos</small></span><span>Oleada ${wave}</span><span>Enemigos ${foes.length}</span><span class="mv-fuel${me.hp <= 3 ? ' low' : ''}"><i style="width:${Math.max(0, me.hp / me.max) * 100}%;background:linear-gradient(90deg,#27ae60,#7bd389)"></i></span>`;
    }
    function shoot(p, dir, off) {
      if (p === me && dir == null) SFX('shoot');
      const a = dir == null ? p.a : dir, bs = M().bs;
      if (dir == null) p.cd = p.foe ? LV[lv].fire * (0.7 + Math.random() * 0.6) * (M().ww1 ? 1.2 : 1) : M().cd;
      const spread = p.foe ? (Math.random() - 0.5) * LV[lv].aim : (Math.random() - 0.5) * (dir == null ? 0.04 : 0.12);
      const ox = off ? Math.cos(p.a + Math.PI / 2) * off : 0, oy = off ? Math.sin(p.a + Math.PI / 2) * off : 0;
      shots.push({ x: p.x + Math.cos(a) * 22 + ox, y: p.y + Math.sin(a) * 22 + oy, vx: Math.cos(a + spread) * bs + Math.cos(p.a) * p.v * 0.4, vy: Math.sin(a + spread) * bs + Math.sin(p.a) * p.v * 0.4, life: M().ww1 ? 1.0 : 1.1, foe: p.foe });
    }
    // artillero de cola: dispara solo al enemigo más cercano que esté atrás o al costado
    function gunner(p, targets, dt, range) {
      p.gcd -= dt; if (p.gcd > 0) return;
      let best = null, bd = range;
      for (const t of targets) { const dx = wrapD(t.x - p.x), dy = wrapD(t.y - p.y), d = Math.hypot(dx, dy); if (d < bd && Math.abs(angDiff(Math.atan2(dy, dx) - p.a)) > 0.9) { bd = d; best = t; } }
      if (!best) return;
      const dx = wrapD(best.x - p.x), dy = wrapD(best.y - p.y), lead = bd / M().bs;
      shoot(p, Math.atan2(dy + Math.sin(best.a) * best.v * lead, dx + Math.cos(best.a) * best.v * lead));
      p.gcd = p.foe ? 1.4 + Math.random() : 0.32;
    }
    function boom(x, y, big) { for (let i = 0; i < (big ? 26 : 8); i++) { const a = Math.random() * Math.PI * 2, s = 40 + Math.random() * (big ? 220 : 90); fx.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.5, c: Math.random() < 0.5 ? '#ffb347' : '#ff5e3a' }); } }
    let eng = null;
    function step(dt) {
      if (state !== 'run') return;
      if (!eng) eng = SFX.engine('avion'); eng.set(me.v / M().vMax);
      // jugador
      const turn = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
      me.a += turn * M().turn * dt;
      const target = keys.up ? M().vMax : keys.down ? M().vMin : M().vMid;
      me.v += (target - me.v) * Math.min(1, dt * 2);
      me.x = wrapP(me.x + Math.cos(me.a) * me.v * dt); me.y = wrapP(me.y + Math.sin(me.a) * me.v * dt);
      me.cd -= dt; if (keys.fire && me.cd <= 0) { if (mode === 'bomb') { shoot(me, null, -8); shoot(me, me.a, 8); } else shoot(me); if (triple()) { shoot(me, me.a - 0.14); shoot(me, me.a + 0.14); } }
      if (M().gunner) gunner(me, foes, dt, 430);
      if (me.hit > 0) me.hit -= dt;
      // enemigos: persiguen y disparan cuando te tienen enfrente
      for (const f of foes) {
        const dx = wrapD(me.x - f.x), dy = wrapD(me.y - f.y), d = Math.hypot(dx, dy);
        const lead = d / 720;
        const want = Math.atan2(dy + Math.sin(me.a) * me.v * lead, dx + Math.cos(me.a) * me.v * lead);
        f.think -= dt;
        let da = angDiff(want - f.a);
        if (d < 160) da = angDiff(want + Math.PI * 0.6 - f.a); // si está muy cerca se abre
        f.a += Math.max(-1, Math.min(1, da * 2)) * LV[lv].turn * (M().ww1 ? (f.kind === 'bomb' ? 0.55 : 0.85) : 1) * dt;
        if (f.kind === 'bomb') gunner(f, [me], dt, 380);
        f.x = wrapP(f.x + Math.cos(f.a) * f.v * dt); f.y = wrapP(f.y + Math.sin(f.a) * f.v * dt);
        f.cd -= dt;
        if (f.cd <= 0 && d < (M().ww1 ? 520 : 650) && Math.abs(angDiff(want - f.a)) < 0.25) shoot(f);
        if (f.hit > 0) f.hit -= dt;
      }
      // balas
      for (const s of shots) {
        s.x = wrapP(s.x + s.vx * dt); s.y = wrapP(s.y + s.vy * dt); s.life -= dt;
        if (s.foe) {
          if (Math.hypot(wrapD(s.x - me.x), wrapD(s.y - me.y)) < 20) { s.life = 0; me.hit = 0.2; boom(s.x, s.y); SFX('crash'); if (!invincible()) { me.hp--; if (me.hp <= 0) return die(); } }
        } else for (const f of foes) {
          if (f.hp > 0 && Math.hypot(wrapD(s.x - f.x), wrapD(s.y - f.y)) < 22) {
            s.life = 0; f.hp--; f.hit = 0.15; boom(s.x, s.y); SFX(f.hp <= 0 ? 'boom' : 'hit');
            if (f.hp <= 0) { score += (f.kind === 'bomb' ? 250 : 100) + wave * 10; if (M().ww1) crash(f); else boom(f.x, f.y, true); if (Math.random() < 0.3) pickups.push({ x: f.x, y: f.y, life: 12 }); }
            break;
          }
        }
      }
      shots = shots.filter(s => s.life > 0);
      foes = foes.filter(f => f.hp > 0);
      // humo de los aviones dañados y de los que caen
      if (M().ww1) {
        for (const p of [me, ...foes]) if (p.hp > 0 && p.hp <= p.max * 0.5 && Math.random() < dt * 14) smoke(p.x - Math.cos(p.a) * 14, p.y - Math.sin(p.a) * 14, p.hp <= p.max * 0.25);
        for (const w of wrecks) {
          w.t -= dt; w.a += w.spin * dt; w.x = wrapP(w.x + Math.cos(w.a) * w.v * dt); w.y = wrapP(w.y + Math.sin(w.a) * w.v * dt);
          if (Math.random() < dt * 30) smoke(w.x, w.y, true, true);
          if (Math.random() < dt * 20) fx.push({ x: w.x, y: w.y, vx: 0, vy: 0, life: 0.3, c: '#ff8a3a' });
          if (w.t <= 0) { boom(w.x, w.y, true); feats.push({ t: 'crater', x: w.x, y: w.y, r: 26, fresh: true }); }
        }
        wrecks = wrecks.filter(w => w.t > 0);
        if (loc === 'noche') { for (const l of lights) l.a += l.sp * dt; flak -= dt; if (flak <= 0) { flak = 0.6 + Math.random() * 1.6; const a = Math.random() * 6.28, d = 150 + Math.random() * 400; for (let i = 0; i < 6; i++) smoke(wrapP(me.x + Math.cos(a) * d), wrapP(me.y + Math.sin(a) * d), true); fx.push({ x: wrapP(me.x + Math.cos(a) * d), y: wrapP(me.y + Math.sin(a) * d), vx: 0, vy: 0, life: 0.25, c: '#ffd27a', flash: true }); } }
      }
      for (const p of fx) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.96; p.vy *= 0.96; }
      fx = fx.filter(p => p.life > 0);
      for (const p of pickups) { p.life -= dt; if (Math.hypot(wrapD(p.x - me.x), wrapD(p.y - me.y)) < 34) { p.life = 0; SFX('coin'); me.hp = Math.min(me.max, me.hp + 3); score += 25; } }
      pickups = pickups.filter(p => p.life > 0);
      if (!foes.length) { waveT -= dt; if (waveT <= 0) { score += wave * 50; nextWave(); } }
    }
    function die() {
      state = 'over'; boom(me.x, me.y, true); draw(); SFX('boom'); if (eng) { eng.stop(); eng = null; }
      const s = H.get(); const rec = cheat === 'no' && score > (s[bestKey()] || 0); if (rec) s[bestKey()] = score; s.games = (s.games || 0) + 1; H.set(s); status();
      if (rec && score) confetti(root);
      overlay(root, rec && score ? '¡Nuevo récord!' : 'Te derribaron', `${score} puntos · llegaste a la oleada ${wave}`, [btn('Otra vez', newGame, 'primary')]);
    }
    // insignias de época: escarapela (Aliados) o cruz pattée negra (Potencias Centrales)
    function insignia(x, y, r, sd) {
      if (sd === 'aliados') { ctx.fillStyle = '#1f3f8a'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.29); ctx.fill(); ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.arc(x, y, r * 0.66, 0, 6.29); ctx.fill(); ctx.fillStyle = '#b3201c'; ctx.beginPath(); ctx.arc(x, y, r * 0.34, 0, 6.29); ctx.fill(); return; }
      ctx.fillStyle = '#eee'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#111'; const w = r * 0.42;
      ctx.beginPath(); ctx.moveTo(x - w, y - r * 0.95); ctx.lineTo(x + w, y - r * 0.95); ctx.lineTo(x + w * 0.45, y); ctx.lineTo(x + w, y + r * 0.95); ctx.lineTo(x - w, y + r * 0.95); ctx.lineTo(x - w * 0.45, y); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - r * 0.95, y - w); ctx.lineTo(x - r * 0.95, y + w); ctx.lineTo(x, y + w * 0.45); ctx.lineTo(x + r * 0.95, y + w); ctx.lineTo(x + r * 0.95, y - w); ctx.lineTo(x, y - w * 0.45); ctx.closePath(); ctx.fill();
    }
    function drawBiplane(p, sx, sy, fall) {
      const c = p.hit > 0 ? '#f2e6c9' : p.c, big = p.kind === 'bomb', tri = p.kind === 'tri';
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.a);
      if (fall) ctx.scale(fall, fall); else if (big) ctx.scale(1.35, 1.35);
      // sombra en el suelo
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(4, -18, 12, 42);
      const prop = (x, y) => { ctx.fillStyle = 'rgba(30,30,30,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 1.6, 7.5, 0, 0, 6.29); ctx.fill(); ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 6.29); ctx.fill(); };
      const dark = (col, k) => { const n = parseInt(col.slice(1), 16); const r = (n >> 16) * k | 0, g = ((n >> 8) & 255) * k | 0, b = (n & 255) * k | 0; return `rgb(${r},${g},${b})`; };
      // cola
      ctx.fillStyle = dark(c, 0.85); ctx.beginPath(); ctx.roundRect(-24, -9, 7, 18, 2); ctx.fill();
      // fuselaje (madera y tela)
      ctx.fillStyle = tri ? c : '#8f7f5c'; ctx.beginPath(); ctx.moveTo(16, -3.5); ctx.lineTo(-22, -2); ctx.lineTo(-22, 2); ctx.lineTo(16, 3.5); ctx.closePath(); ctx.fill();
      if (tri) {
        // tres alas apiladas, todo rojo
        ctx.fillStyle = dark(c, 0.55); ctx.beginPath(); ctx.roundRect(-2, -20, 8, 40, 3); ctx.fill();
        ctx.fillStyle = dark(c, 0.75); ctx.beginPath(); ctx.roundRect(1, -22, 9, 44, 3); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(4, -25, 10, 50, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(4, k); ctx.lineTo(14, k); ctx.stroke(); }
        insignia(9, -18, 4, 'centrales'); insignia(9, 18, 4, 'centrales'); insignia(-20, 0, 3.2, 'centrales');
        ctx.fillStyle = '#2a2a2a'; ctx.beginPath(); ctx.arc(-3, 0, 2.6, 0, 6.29); ctx.fill();
        prop(18, 0);
      } else {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.roundRect(-1, -24, 9, 48, 3); ctx.fill();
        ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(2, -26, 10, 52, 4); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1; for (let k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(2, k); ctx.lineTo(12, k); ctx.stroke(); }
        // manchas de camuflaje
        ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(6, -8, 3, 6, 0.4, 0, 6.29); ctx.ellipse(8, 10, 3, 5, -0.3, 0, 6.29); ctx.fill();
        insignia(7, -18, 4.2, p.side); insignia(7, 18, 4.2, p.side);
        if (big) {
          for (const yy of [-12, 12]) { ctx.fillStyle = '#3c3c3c'; ctx.beginPath(); ctx.roundRect(9, yy - 2.5, 9, 5, 2); ctx.fill(); prop(19, yy); }
          ctx.fillStyle = '#3b3326'; ctx.beginPath(); ctx.arc(-12, 0, 3, 0, 6.29); ctx.fill();
          ctx.fillStyle = '#8f7f5c'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(16, -3.5); ctx.lineTo(16, 3.5); ctx.closePath(); ctx.fill();
        } else { ctx.fillStyle = '#3b3326'; ctx.beginPath(); ctx.arc(-3, 0, 2.6, 0, 6.29); ctx.fill(); prop(18, 0); }
      }
      ctx.restore();
      if (!fall && p.foe && p.hp < p.max) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(sx - 18, sy - 40, 36, 5); ctx.fillStyle = '#c94a3a'; ctx.fillRect(sx - 18, sy - 40, 36 * p.hp / p.max, 5); }
    }
    function drawPlane(p, sx, sy) {
      if (M().ww1) return drawBiplane(p, sx, sy);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.a);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(10, 14, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
      const c = p.hit > 0 ? '#fff' : p.c;
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(10, -4); ctx.lineTo(4, -22); ctx.lineTo(-4, -22); ctx.lineTo(-2, -4); ctx.lineTo(-16, -3); ctx.lineTo(-20, -10); ctx.lineTo(-24, -10); ctx.lineTo(-22, 0); ctx.lineTo(-24, 10); ctx.lineTo(-20, 10); ctx.lineTo(-16, 3); ctx.lineTo(-2, 4); ctx.lineTo(-4, 22); ctx.lineTo(4, 22); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(20,30,45,.8)'; ctx.beginPath(); ctx.ellipse(8, 0, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-14, -1, 30, 2);
      ctx.restore();
      if (p.foe && p.hp < p.max) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(sx - 18, sy - 34, 36, 5); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(sx - 18, sy - 34, 36 * p.hp / p.max, 5); }
    }
    function scr(x, y) { return [W / 2 + wrapD(x - me.x), Hh / 2 + wrapD(y - me.y)]; }
    function draw() {
      if (!me) return;
      if (M().ww1) {
        ctx.fillStyle = PAL[loc][0]; ctx.fillRect(0, 0, W, Hh);
        const vis = (x, y, m) => x > -m && y > -m && x < W + m && y < Hh + m;
        for (const f of fields) {
          const [x, y] = scr(f.x, f.y); if (x < -210 || y < -210 || x > W + 10 || y > Hh + 10) continue;
          ctx.fillStyle = f.c; ctx.fillRect(x, y, 201, 201);
          if (f.sea) { ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 20; k < 200; k += 40) ctx.fillRect(x + (k * 7 % 120), y + k, 40, 2); }
          if (f.rows) { ctx.strokeStyle = 'rgba(0,0,0,.07)'; ctx.lineWidth = 3; for (let k = 14; k < 196; k += 16) { ctx.beginPath(); ctx.moveTo(x + 4, y + k); ctx.lineTo(x + 196, y + k); ctx.stroke(); } }
        }
        // trincheras con alambradas
        for (const tr of trenches) {
          ctx.lineJoin = 'round';
          for (const [w, col] of [[16, 'rgba(30,26,20,.55)'], [8, '#2a251d']]) {
            ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); let first = true, px = 0;
            for (const [tx, ty] of tr) { const [x, y] = scr(tx, ty); if (!first && Math.abs(x - px) > 400) { ctx.stroke(); ctx.beginPath(); first = true; } first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false; px = x; }
            ctx.stroke();
          }
          ctx.strokeStyle = 'rgba(30,30,30,.45)'; ctx.lineWidth = 1;
          for (const [tx, ty] of tr) { const [x, y] = scr(tx, ty - 46); if (!vis(x, y, 40)) continue; for (let k = 0; k < 70; k += 7) { ctx.beginPath(); ctx.moveTo(x + k, y - 3); ctx.lineTo(x + k + 5, y + 3); ctx.moveTo(x + k + 5, y - 3); ctx.lineTo(x + k, y + 3); ctx.stroke(); } }
        }
        for (const f of feats) {
          const [x, y] = scr(f.x, f.y); if (!vis(x, y, 40)) continue;
          if (f.t === 'crater') { ctx.fillStyle = 'rgba(25,22,18,.45)'; ctx.beginPath(); ctx.arc(x, y, f.r, 0, 6.29); ctx.fill(); ctx.strokeStyle = 'rgba(150,140,120,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, f.r + 2, 0, 6.29); ctx.stroke(); if (f.fresh) { ctx.fillStyle = 'rgba(255,120,40,.25)'; ctx.beginPath(); ctx.arc(x, y, f.r * 0.5, 0, 6.29); ctx.fill(); } }
          else if (f.t === 'stump') { ctx.strokeStyle = '#2b241b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + f.r * 0.5, y - f.r * 0.6); ctx.moveTo(x, y); ctx.lineTo(x - f.r * 0.4, y - f.r * 0.3); ctx.stroke(); }
          else if (f.t === 'ruin') { ctx.fillStyle = '#6e6a63'; ctx.fillRect(x - 14, y - 10, 28, 20); ctx.fillStyle = '#3d3a35'; ctx.fillRect(x - 6, y - 4, 16, 12); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 14, y + 6, 28, 4); }
          else if (f.t === 'tree') { ctx.fillStyle = '#3c4a30'; ctx.beginPath(); ctx.arc(x, y, f.r * 0.7, 0, 6.29); ctx.fill(); }
          else if (f.t === 'pine') { ctx.fillStyle = '#2f3d33'; ctx.beginPath(); ctx.moveTo(x, y - f.r * 0.7); ctx.lineTo(x + f.r * 0.5, y + f.r * 0.5); ctx.lineTo(x - f.r * 0.5, y + f.r * 0.5); ctx.closePath(); ctx.fill(); }
          else if (f.t === 'rock') { ctx.fillStyle = '#8a8f94'; ctx.beginPath(); ctx.ellipse(x, y, f.r, f.r * 0.6, f.r, 0, 6.29); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 3, f.r * 0.7, f.r * 0.4, f.r, 0, 6.29); ctx.fill(); }
          else if (f.t === 'poppy') { ctx.fillStyle = '#8e2a22'; ctx.fillRect(x, y, 3, 3); }
        }
        for (const sh of ships) { const [x, y] = scr(sh.x, sh.y); if (!vis(x, y, 120)) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(sh.a); ctx.fillStyle = '#4a4f55'; ctx.beginPath(); ctx.moveTo(sh.len / 2, 0); ctx.lineTo(sh.len / 2 - 14, -9); ctx.lineTo(-sh.len / 2, -9); ctx.lineTo(-sh.len / 2, 9); ctx.lineTo(sh.len / 2 - 14, 9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2e3236'; ctx.fillRect(-10, -5, 18, 10); ctx.restore(); }
      } else {
      const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#3d86c6'); g.addColorStop(1, '#2a6aa8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      // mar con olitas que se mueven con la cámara
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      const ox = ((-me.x * 0.5) % 120 + 120) % 120, oy = ((-me.y * 0.5) % 120 + 120) % 120;
      for (let x = ox - 120; x < W + 120; x += 120) for (let y = oy - 120; y < Hh + 120; y += 120) ctx.fillRect(x, y, 30, 3);
      }
      for (const c of clouds) if (!c.hi) { const [x, y] = scr(c.x, c.y); if (x < -200 || y < -200 || x > W + 200 || y > Hh + 200) continue; ctx.fillStyle = M().ww1 ? (loc === 'noche' ? 'rgba(20,22,30,.35)' : 'rgba(150,150,145,.28)') : 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, c.r, 0, Math.PI * 2); ctx.arc(x + c.r * 0.8, y + c.r * 0.2, c.r * 0.7, 0, Math.PI * 2); ctx.fill(); }
      for (const p of pickups) { const [x, y] = scr(p.x, p.y); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#27ae60'; ctx.fillRect(x - 3, y - 10, 6, 20); ctx.fillRect(x - 10, y - 3, 20, 6); }
      for (const s of shots) { const [x, y] = scr(s.x, s.y); ctx.strokeStyle = s.foe ? '#ffb347' : '#fffbcc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.02, y - s.vy * 0.02); ctx.stroke(); }
      for (const f of foes) { const [x, y] = scr(f.x, f.y); if (x > -60 && y > -60 && x < W + 60 && y < Hh + 60) drawPlane(f, x, y); }
      if (state !== 'over') drawPlane(me, W / 2, Hh / 2);
      for (const w of wrecks) { const [x, y] = scr(w.x, w.y); drawBiplane(w.p, x, y, 0.45 + 0.55 * (w.t / 1.6)); }
      for (const p of fx) {
        const [x, y] = scr(p.x, p.y);
        if (p.smoke) { const k = 1 - p.life / p.max; ctx.fillStyle = `rgba(${p.c},${0.55 * (1 - k)})`; ctx.beginPath(); ctx.arc(x, y, p.r * (1 + k * 2.2), 0, 6.29); ctx.fill(); continue; }
        if (p.flash) { ctx.fillStyle = `rgba(255,210,120,${p.life * 3})`; ctx.beginPath(); ctx.arc(x, y, 26, 0, 6.29); ctx.fill(); continue; }
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
      }
      for (const c of clouds) if (c.hi) { const [x, y] = scr(c.x, c.y); if (x < -200 || y < -200 || x > W + 200 || y > Hh + 200) continue; ctx.fillStyle = M().ww1 ? (loc === 'noche' ? 'rgba(25,28,38,.5)' : 'rgba(170,170,165,.42)') : 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x, y, c.r * 0.8, 0, Math.PI * 2); ctx.arc(x + c.r * 0.6, y + c.r * 0.3, c.r * 0.6, 0, Math.PI * 2); ctx.fill(); }
      if (M().ww1 && loc === 'noche') {
        ctx.fillStyle = 'rgba(6,9,22,.62)'; ctx.fillRect(0, 0, W, Hh);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const l of lights) { const [x, y] = scr(l.x, l.y); if (x < -900 || y < -900 || x > W + 900 || y > Hh + 900) continue; const g2 = ctx.createRadialGradient(x, y, 10, x, y, 700); g2.addColorStop(0, 'rgba(255,248,210,.22)'); g2.addColorStop(1, 'rgba(255,248,210,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, 700, l.a - 0.09, l.a + 0.09); ctx.closePath(); ctx.fill(); }
        { const g3 = ctx.createRadialGradient(W / 2, Hh / 2, 0, W / 2, Hh / 2, 110); g3.addColorStop(0, 'rgba(255,240,200,.22)'); g3.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g3; ctx.fillRect(W / 2 - 110, Hh / 2 - 110, 220, 220); }
        // las balas y los fogonazos se ven en la oscuridad
        for (const s2 of shots) { const [x, y] = scr(s2.x, s2.y); ctx.strokeStyle = 'rgba(255,220,140,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s2.vx * 0.02, y - s2.vy * 0.02); ctx.stroke(); }
        ctx.restore();
      } else if (M().ww1) { ctx.fillStyle = 'rgba(60,62,66,.12)'; ctx.fillRect(0, 0, W, Hh); }
      // flechitas que apuntan a los enemigos fuera de pantalla
      for (const f of foes) {
        const dx = wrapD(f.x - me.x), dy = wrapD(f.y - me.y);
        if (Math.abs(dx) < W / 2 - 20 && Math.abs(dy) < Hh / 2 - 20) continue;
        const a = Math.atan2(dy, dx), r = Math.min(W, Hh) / 2 - 26;
        ctx.save(); ctx.translate(W / 2 + Math.cos(a) * r, Hh / 2 + Math.sin(a) * r); ctx.rotate(a);
        ctx.fillStyle = f.c; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      if (!foes.length && state === 'run') { ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`Oleada ${wave + 1}`, W / 2, Hh * 0.3); }
    }
    const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right', ' ': 'fire', Control: 'fire', x: 'fire', X: 'fire' };
    addEventListener('keyup', (e) => { const k = KEYS[e.key]; if (k) keys[k] = false; });
    const key = (e) => {
      if (e.key === 'p' || e.key === 'P') { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } else if (state === 'pause') { state = 'run'; msg.hidden = true; start(); } return true; }
      const k = KEYS[e.key]; if (!k) return false; keys[k] = true; return true;
    };
    // tocando: mitad izquierda gira a la izquierda, derecha a la derecha, y dispara
    cv.addEventListener('pointerdown', (e) => { const r = cv.getBoundingClientRect(); keys.fire = true; if (e.clientX - r.left < r.width / 3) keys.left = true; else if (e.clientX - r.left > r.width * 2 / 3) keys.right = true; });
    addEventListener('pointerup', () => { keys.fire = keys.left = keys.right = false; });
    const onMode = (v) => { mode = v; const s = H.get(); s.mode = v; H.set(s); newGame(); };
    const modeOpts = Object.entries(MODES).map(([k, v]) => [k, v.n]);
    const P = BM.util.pick || ((l, o, v, f) => seg(o, v, f));
    const setK = (k, v) => { const s = H.get(); s[k] = v; H.set(s); };
    const tools = [P('Avión', modeOpts, mode, onMode),
      P('Bando (1ª Guerra)', Object.entries(SIDES).map(([k, v]) => [k, v.n]), side, (v) => { side = v; setK('side', v); newGame(); }),
      P('Lugar (1ª Guerra)', Object.entries(LOCS).map(([k, v]) => [k, v.n]), loc, (v) => { loc = v; setK('loc', v); newGame(); }),
      P('Trucos', Object.entries(CHEATS), cheat, (v) => { cheat = v; setK('cheat', v); newGame(); }),
      seg(Object.entries(LV).map(([k, v]) => [k, v.n]), lv, (v) => { lv = v; const s = H.get(); s.lv = v; H.set(s); newGame(); }), btn('Nueva', newGame)];
    requestAnimationFrame(() => { fit(); newGame(); });
    return { el: root, tools, key, setSkin: (id) => { if (me) me.c = SKIN[id] || me.c; draw(); }, help: '← → girás, ↑ acelerás, ↓ frenás, espacio dispara. Primera Guerra: elegí bando, lugar y avión (caza, bombardero con artillero, o el triplano rojo del Barón Rojo, el que mejor dobla). Trucos: invencible o disparo triple (no cuentan para el récord). P pausa.', hide: () => { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } keys = {}; }, show: () => { if (state === 'pause') { /* sigue en pausa hasta que toques P */ } } };
  }

  BM.register({ id: 'dogfight', n: 'Duelo aéreo', d: 'Combate de aviones: jet moderno o la Primera Guerra, con el Barón Rojo.', c: '#2a6aa8', create: dogfight, skinLabel: 'Avión',
    skins: [['rojo', 'Rojo', '#e8202a'], ['amarillo', 'Amarillo', '#f5c518'], ['blanco', 'Blanco', '#eceff3'], ['negro', 'Negro', '#2b2f37'], ['camuflado', 'Camuflado', '#5b6b3a'], ['naranja', 'Naranja', '#ff7a1a']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#3d86c6"/><circle cx="46" cy="44" r="12" fill="rgba(255,255,255,.35)"/><g transform="rotate(-35 22 30)"><path d="M34 30l-6-2-3-8h-3l1 8-6 1-2-3h-2l1 4-1 4h2l2-3 6 1-1 8h3l3-8z" fill="#e8202a"/></g><g transform="rotate(150 46 22)"><path d="M58 22l-6-2-3-8h-3l1 8-6 1-2-3h-2l1 4-1 4h2l2-3 6 1-1 8h3l3-8z" fill="#2f6fed"/></g><path d="M30 24l8-5" stroke="#fffbcc" stroke-width="2.5" stroke-linecap="round"/><circle cx="41" cy="18" r="3" fill="#ffb347"/></svg>',
    best: (s) => { const b = Math.max(0, ...Object.keys(s).filter(k => k.startsWith('best_')).map(k => s[k] || 0)); return b ? `Mejor: ${b} puntos` : 'Nunca jugaste'; } });
})();
