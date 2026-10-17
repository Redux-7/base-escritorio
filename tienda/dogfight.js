// Tienda de Base · Duelo aéreo (naves que se disparan, vistas desde arriba)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, rnd, seg, btn, overlay, confetti } = BM.util;
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
    bomb: { n: 'Bombardero (1ª Guerra)', turn: 1.8, vMin: 95, vMid: 135, vMax: 180, hp: 22, cd: 0.2, bs: 560, ww1: true, gunner: true }
  };
  const SKIN = { rojo: '#e8202a', amarillo: '#f5c518', blanco: '#eceff3', negro: '#2b2f37', camuflado: '#5b6b3a', naranja: '#ff7a1a' };
  function dogfight(H) {
    let lv = H.get().lv || 'normal';
    let mode = MODES[H.get().mode] ? H.get().mode : 'jet';
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

    let fields = [];
    let me, foes, shots, fx, pickups, clouds, wave, score, state, keys = {}, raf = 0, lastT = 0, waveT = 0;
    const status = () => H.status([`${score || 0} puntos`, `Oleada ${wave || 1}`, `Mejor ${H.get()[bestKey()] || 0}`]);
    function plane(x, y, a, c, foe) { return { x, y, a, v: foe ? 230 : M().vMid, c, hp: foe ? 3 : M().hp, max: foe ? 3 : M().hp, cd: 0, gcd: 0, foe, hit: 0, think: Math.random(), kind: foe ? 'caza' : mode }; }
    function newGame() {
      closeOver(root);
      me = plane(WORLD / 2, WORLD / 2, -Math.PI / 2, SKIN[H.get().skin] || '#e8202a', false);
      foes = []; shots = []; fx = []; pickups = []; wave = 0; score = 0; keys = {};
      clouds = []; for (let i = 0; i < 40; i++) clouds.push({ x: Math.random() * WORLD, y: Math.random() * WORLD, r: 60 + Math.random() * 120, hi: Math.random() < 0.4 });
      // campo visto desde arriba (parcelas, caminos y casitas) para la Primera Guerra
      fields = [];
      for (let gx = 0; gx < WORLD; gx += 200) for (let gy = 0; gy < WORLD; gy += 200) fields.push({ x: gx, y: gy, c: ['#7a9a4a', '#8fa957', '#a39556', '#6d8b43', '#b5a46a', '#86a24f'][rnd(6)], rows: Math.random() < 0.5, house: Math.random() < 0.12 });
      nextWave(); state = 'run'; msg.hidden = true; status(); start();
    }
    function nextWave() {
      wave++; waveT = 2.5;
      const n = Math.min(8, 1 + wave);
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2, d = 900 + Math.random() * 500;
        const ww1 = M().ww1;
        const cols = ww1 ? ['#b8322b', '#5b6b3a', '#7a5a34', '#3f5d7a'] : ['#2f6fed', '#27ae60', '#8e44ad', '#f39c12'];
        const f = plane(wrapP(me.x + Math.cos(ang) * d), wrapP(me.y + Math.sin(ang) * d), ang + Math.PI, cols[wave % 4], true);
        f.hp = f.max = 2 + Math.floor(wave / 3); f.v = ww1 ? 150 + wave * 5 : 210 + wave * 8;
        if (ww1 && wave >= 2 && i % 3 === 2) { f.kind = 'bomb'; f.hp = f.max = f.hp * 3; f.v *= 0.7; }
        foes.push(f);
      }
      status();
    }
    function start() { cancelAnimationFrame(raf); lastT = 0; const fr = (t) => { const dt = Math.min(0.04, lastT ? (t - lastT) / 1000 : 0.016); lastT = t; step(dt); draw(); hudPaint(); if (state === 'run') raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }
    function hudPaint() {
      hud.innerHTML = `<span class="mv-big">${score}<small> puntos</small></span><span>Oleada ${wave}</span><span>Enemigos ${foes.length}</span><span class="mv-fuel${me.hp <= 3 ? ' low' : ''}"><i style="width:${Math.max(0, me.hp / me.max) * 100}%;background:linear-gradient(90deg,#27ae60,#7bd389)"></i></span>`;
    }
    function shoot(p, dir, off) {
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
    function step(dt) {
      if (state !== 'run') return;
      // jugador
      const turn = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
      me.a += turn * M().turn * dt;
      const target = keys.up ? M().vMax : keys.down ? M().vMin : M().vMid;
      me.v += (target - me.v) * Math.min(1, dt * 2);
      me.x = wrapP(me.x + Math.cos(me.a) * me.v * dt); me.y = wrapP(me.y + Math.sin(me.a) * me.v * dt);
      me.cd -= dt; if (keys.fire && me.cd <= 0) { if (mode === 'bomb') { shoot(me, null, -8); shoot(me, me.a, 8); } else shoot(me); }
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
          if (Math.hypot(wrapD(s.x - me.x), wrapD(s.y - me.y)) < 20) { s.life = 0; me.hp--; me.hit = 0.2; boom(s.x, s.y); if (me.hp <= 0) return die(); }
        } else for (const f of foes) {
          if (f.hp > 0 && Math.hypot(wrapD(s.x - f.x), wrapD(s.y - f.y)) < 22) {
            s.life = 0; f.hp--; f.hit = 0.15; boom(s.x, s.y);
            if (f.hp <= 0) { score += (f.kind === 'bomb' ? 250 : 100) + wave * 10; boom(f.x, f.y, true); if (Math.random() < 0.3) pickups.push({ x: f.x, y: f.y, life: 12 }); }
            break;
          }
        }
      }
      shots = shots.filter(s => s.life > 0);
      foes = foes.filter(f => f.hp > 0);
      for (const p of fx) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.vx *= 0.96; p.vy *= 0.96; }
      fx = fx.filter(p => p.life > 0);
      for (const p of pickups) { p.life -= dt; if (Math.hypot(wrapD(p.x - me.x), wrapD(p.y - me.y)) < 34) { p.life = 0; me.hp = Math.min(me.max, me.hp + 3); score += 25; } }
      pickups = pickups.filter(p => p.life > 0);
      if (!foes.length) { waveT -= dt; if (waveT <= 0) { score += wave * 50; nextWave(); } }
    }
    function die() {
      state = 'over'; boom(me.x, me.y, true); draw();
      const s = H.get(); const rec = score > (s[bestKey()] || 0); if (rec) s[bestKey()] = score; s.games = (s.games || 0) + 1; H.set(s); status();
      if (rec && score) confetti(root);
      overlay(root, rec && score ? '¡Nuevo récord!' : 'Te derribaron', `${score} puntos · llegaste a la oleada ${wave}`, [btn('Otra vez', newGame, 'primary')]);
    }
    function drawBiplane(p, sx, sy) {
      const c = p.hit > 0 ? '#fff' : p.c, big = p.kind === 'bomb';
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(p.a); if (big) ctx.scale(1.35, 1.35);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-4, -20, 16, 46);
      // cola
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-24, -9, 7, 18, 2); ctx.fill();
      // fuselaje
      ctx.fillStyle = '#c9b58a'; ctx.beginPath(); ctx.moveTo(16, -3.5); ctx.lineTo(-22, -2); ctx.lineTo(-22, 2); ctx.lineTo(16, 3.5); ctx.closePath(); ctx.fill();
      // ala de abajo (se asoma) y ala de arriba
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(-1, -24, 9, 48, 3); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(2, -26, 10, 52, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; for (let k = -20; k <= 20; k += 8) { ctx.beginPath(); ctx.moveTo(2, k); ctx.lineTo(12, k); ctx.stroke(); }
      // escarapelas
      for (const yy of [-17, 17]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, yy, 4.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.foe ? '#222' : '#1f5fe0'; ctx.beginPath(); ctx.arc(7, yy, 2.2, 0, Math.PI * 2); ctx.fill(); }
      const prop = (x, y) => { ctx.fillStyle = 'rgba(40,40,40,.35)'; ctx.beginPath(); ctx.ellipse(x, y, 1.6, 7.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill(); };
      if (big) {
        // dos motores en las alas, puesto del artillero atrás
        for (const yy of [-12, 12]) { ctx.fillStyle = '#555'; ctx.beginPath(); ctx.roundRect(9, yy - 2.5, 9, 5, 2); ctx.fill(); prop(19, yy); }
        ctx.fillStyle = '#5b4a2e'; ctx.beginPath(); ctx.arc(-12, 0, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9b58a'; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(16, -3.5); ctx.lineTo(16, 3.5); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = '#5b4a2e'; ctx.beginPath(); ctx.arc(-3, 0, 2.6, 0, Math.PI * 2); ctx.fill();
        prop(18, 0);
      }
      ctx.restore();
      if (p.foe && p.hp < p.max) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(sx - 18, sy - 40, 36, 5); ctx.fillStyle = '#ff6b6b'; ctx.fillRect(sx - 18, sy - 40, 36 * p.hp / p.max, 5); }
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
        // campo: parcelas de colores, surcos y alguna casita
        ctx.fillStyle = '#6d8b43'; ctx.fillRect(0, 0, W, Hh);
        for (const f of fields) {
          const [x, y] = scr(f.x, f.y); if (x < -210 || y < -210 || x > W + 10 || y > Hh + 10) continue;
          ctx.fillStyle = f.c; ctx.fillRect(x + 2, y + 2, 196, 196);
          if (f.rows) { ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 3; for (let k = 14; k < 196; k += 16) { ctx.beginPath(); ctx.moveTo(x + 4, y + k); ctx.lineTo(x + 196, y + k); ctx.stroke(); } }
          if (f.house) { ctx.fillStyle = '#9c4a32'; ctx.fillRect(x + 80, y + 80, 26, 20); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x + 80, y + 90, 26, 10); }
        }
        ctx.strokeStyle = '#b9a77a'; ctx.lineWidth = 6;
        for (let k = 0; k < WORLD; k += 800) { const [x1, y1] = scr(k, 0); ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, Hh); ctx.stroke(); }
      } else {
      const g = ctx.createLinearGradient(0, 0, 0, Hh); g.addColorStop(0, '#3d86c6'); g.addColorStop(1, '#2a6aa8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
      // mar con olitas que se mueven con la cámara
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      const ox = ((-me.x * 0.5) % 120 + 120) % 120, oy = ((-me.y * 0.5) % 120 + 120) % 120;
      for (let x = ox - 120; x < W + 120; x += 120) for (let y = oy - 120; y < Hh + 120; y += 120) ctx.fillRect(x, y, 30, 3);
      }
      for (const c of clouds) if (!c.hi) { const [x, y] = scr(c.x, c.y); if (x < -200 || y < -200 || x > W + 200 || y > Hh + 200) continue; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x, y, c.r, 0, Math.PI * 2); ctx.arc(x + c.r * 0.8, y + c.r * 0.2, c.r * 0.7, 0, Math.PI * 2); ctx.fill(); }
      for (const p of pickups) { const [x, y] = scr(p.x, p.y); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, 16, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#27ae60'; ctx.fillRect(x - 3, y - 10, 6, 20); ctx.fillRect(x - 10, y - 3, 20, 6); }
      for (const s of shots) { const [x, y] = scr(s.x, s.y); ctx.strokeStyle = s.foe ? '#ffb347' : '#fffbcc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - s.vx * 0.02, y - s.vy * 0.02); ctx.stroke(); }
      for (const f of foes) { const [x, y] = scr(f.x, f.y); if (x > -60 && y > -60 && x < W + 60 && y < Hh + 60) drawPlane(f, x, y); }
      if (state !== 'over') drawPlane(me, W / 2, Hh / 2);
      for (const p of fx) { const [x, y] = scr(p.x, p.y); ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
      for (const c of clouds) if (c.hi) { const [x, y] = scr(c.x, c.y); if (x < -200 || y < -200 || x > W + 200 || y > Hh + 200) continue; ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x, y, c.r * 0.8, 0, Math.PI * 2); ctx.arc(x + c.r * 0.6, y + c.r * 0.3, c.r * 0.6, 0, Math.PI * 2); ctx.fill(); }
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
    const tools = [BM.util.pick ? BM.util.pick('Avión', modeOpts, mode, onMode) : seg(modeOpts, mode, onMode),
      seg(Object.entries(LV).map(([k, v]) => [k, v.n]), lv, (v) => { lv = v; const s = H.get(); s.lv = v; H.set(s); newGame(); }), btn('Nueva', newGame)];
    requestAnimationFrame(() => { fit(); newGame(); });
    return { el: root, tools, key, setSkin: (id) => { if (me) me.c = SKIN[id] || me.c; draw(); }, help: '← → girás, ↑ acelerás, ↓ frenás, espacio dispara. Elegí el avión: jet moderno, o en la Primera Guerra el caza (rápido y ágil) o el bombardero (lento, aguanta mucho, dispara con dos ametralladoras y tiene un artillero atrás que tira solo). Los botiquines verdes te curan. P pausa.', hide: () => { if (state === 'run') { state = 'pause'; msg.hidden = false; msg.textContent = 'En pausa · P para seguir'; } keys = {}; }, show: () => { if (state === 'pause') { /* sigue en pausa hasta que toques P */ } } };
  }

  BM.register({ id: 'dogfight', n: 'Duelo aéreo', d: 'Combate de aviones: derribá las oleadas enemigas.', c: '#2a6aa8', create: dogfight, skinLabel: 'Avión',
    skins: [['rojo', 'Rojo', '#e8202a'], ['amarillo', 'Amarillo', '#f5c518'], ['blanco', 'Blanco', '#eceff3'], ['negro', 'Negro', '#2b2f37'], ['camuflado', 'Camuflado', '#5b6b3a'], ['naranja', 'Naranja', '#ff7a1a']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#3d86c6"/><circle cx="46" cy="44" r="12" fill="rgba(255,255,255,.35)"/><g transform="rotate(-35 22 30)"><path d="M34 30l-6-2-3-8h-3l1 8-6 1-2-3h-2l1 4-1 4h2l2-3 6 1-1 8h3l3-8z" fill="#e8202a"/></g><g transform="rotate(150 46 22)"><path d="M58 22l-6-2-3-8h-3l1 8-6 1-2-3h-2l1 4-1 4h2l2-3 6 1-1 8h3l3-8z" fill="#2f6fed"/></g><path d="M30 24l8-5" stroke="#fffbcc" stroke-width="2.5" stroke-linecap="round"/><circle cx="41" cy="18" r="3" fill="#ffb347"/></svg>',
    best: (s) => { const b = Math.max(0, ...Object.keys(s).filter(k => k.startsWith('best_')).map(k => s[k] || 0)); return b ? `Mejor: ${b} puntos` : 'Nunca jugaste'; } });
})();
