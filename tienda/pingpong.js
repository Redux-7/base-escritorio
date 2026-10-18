// Tienda de Base · Ping pong contra la compu
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const LV = { facil: { n: 'Fácil', ai: 300 }, normal: { n: 'Normal', ai: 430 }, dificil: { n: 'Difícil', ai: 600 } };
  function pingpong(H) {
    let lv = H.get().lv || 'normal';
    const root = h('div', { class: 'mg-move' });
    const cv = h('canvas', { class: 'mv-cv' }); root.append(cv);
    const msg = h('div', { class: 'sn-msg' }); root.append(msg);
    const ctx = cv.getContext('2d');
    let W = 800, Hh = 500, lastSz = '', rf = 0;
    const fit = () => { W = Math.max(320, root.clientWidth); Hh = Math.max(240, root.clientHeight); const d = Math.min(2, devicePixelRatio || 1); cv.width = W * d; cv.height = Hh * d; cv.style.width = W + 'px'; cv.style.height = Hh + 'px'; ctx.setTransform(d, 0, 0, d, 0, 0); draw(); };
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; cancelAnimationFrame(rf); rf = requestAnimationFrame(fit); }).observe(root);
    const PW = 14, PH = 0.18;
    let me, cpu, ball, sMe, sCpu, state, keys = {}, raf = 0, lastT = 0, serveT = 0, mouseY = null;
    const status = () => H.status([`Vos ${sMe || 0}`, `Compu ${sCpu || 0}`, `Ganadas ${H.get().wins || 0}`]);
    function serve(dir) { ball = { x: 0.5, y: 0.5, vx: 0.42 * dir, vy: (Math.random() - 0.5) * 0.5, sp: 1 }; serveT = 0.8; }
    function newGame() { closeOver(root); me = 0.5; cpu = 0.5; sMe = 0; sCpu = 0; state = 'run'; serve(Math.random() < 0.5 ? 1 : -1); msg.hidden = true; status(); start(); }
    function start() { cancelAnimationFrame(raf); lastT = 0; const fr = (t) => { const dt = Math.min(0.03, lastT ? (t - lastT) / 1000 : 0.016); lastT = t; step(dt); draw(); if (state === 'run') raf = requestAnimationFrame(fr); }; raf = requestAnimationFrame(fr); }
    function step(dt) {
      if (mouseY != null) me += (mouseY - me) * Math.min(1, dt * 18);
      if (keys.up) me -= 1.1 * dt; if (keys.down) me += 1.1 * dt;
      me = Math.max(PH / 2, Math.min(1 - PH / 2, me));
      const aiV = LV[lv].ai / Hh;
      const goal = ball.vx > 0 ? ball.y : 0.5;
      cpu += Math.max(-aiV * dt, Math.min(aiV * dt, goal - cpu));
      cpu = Math.max(PH / 2, Math.min(1 - PH / 2, cpu));
      if (serveT > 0) { serveT -= dt; return; }
      const ar = W / Hh;
      ball.x += ball.vx * ball.sp * dt / ar * 1.6; ball.y += ball.vy * ball.sp * dt * 1.6;
      if (ball.y < 0.02) { ball.y = 0.02; ball.vy = Math.abs(ball.vy); SFX('tap'); }
      if (ball.y > 0.98) { ball.y = 0.98; ball.vy = -Math.abs(ball.vy); SFX('tap'); }
      const px = 40 / W, cx = 1 - 40 / W;
      if (ball.vx < 0 && ball.x < px + PW / W && ball.x > px - 0.02 && Math.abs(ball.y - me) < PH / 2 + 0.02) { SFX('bounce'); ball.vx = Math.abs(ball.vx); ball.vy = (ball.y - me) / (PH / 2) * 0.55; ball.sp = Math.min(2.4, ball.sp * 1.07); }
      if (ball.vx > 0 && ball.x > cx - PW / W && ball.x < cx + 0.02 && Math.abs(ball.y - cpu) < PH / 2 + 0.02) { SFX('bounce'); ball.vx = -Math.abs(ball.vx); ball.vy = (ball.y - cpu) / (PH / 2) * 0.55; ball.sp = Math.min(2.4, ball.sp * 1.07); }
      if (ball.x < -0.02) { sCpu++; status(); SFX('bad'); if (sCpu >= 7) return end(false); serve(1); }
      if (ball.x > 1.02) { sMe++; status(); SFX('score'); if (sMe >= 7) return end(true); serve(-1); }
    }
    function end(won) {
      state = 'over';
      const s = H.get(); s.games = (s.games || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s); status();
      if (won) confetti(root);
      overlay(root, won ? '¡Ganaste!' : 'Ganó la compu', `${sMe} a ${sCpu}`, [btn('Revancha', newGame, 'primary')]);
    }
    function draw() {
      if (!ball) return;
      ctx.fillStyle = ({ verde: '#1f6f5c', azul: '#1d4f91', rojo: '#8e2430', noche: '#14171f' })[H.get().skin] || '#1f6f5c'; ctx.fillRect(0, 0, W, Hh);
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4; ctx.strokeRect(12, 12, W - 24, Hh - 24);
      ctx.setLineDash([12, 14]); ctx.beginPath(); ctx.moveTo(W / 2, 12); ctx.lineTo(W / 2, Hh - 12); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = `900 ${Hh * 0.22}px system-ui`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(sMe, W * 0.3, Hh * 0.08); ctx.fillText(sCpu, W * 0.7, Hh * 0.08);
      const ph = PH * Hh;
      ctx.fillStyle = '#e8202a'; ctx.fillRect(40 - PW, me * Hh - ph / 2, PW, ph);
      ctx.fillStyle = '#2f6fed'; ctx.fillRect(W - 40, cpu * Hh - ph / 2, PW, ph);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ball.x * W, ball.y * Hh, 9, 0, Math.PI * 2); ctx.fill();
    }
    const key = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { keys.up = true; mouseY = null; return true; }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { keys.down = true; mouseY = null; return true; }
      return false;
    };
    addEventListener('keyup', (e) => { if (/^(ArrowUp|w|W)$/.test(e.key)) keys.up = false; if (/^(ArrowDown|s|S)$/.test(e.key)) keys.down = false; });
    cv.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouseY = (e.clientY - r.top) / r.height; });
    const tools = [seg(Object.entries(LV).map(([k, v]) => [k, v.n]), lv, (v) => { lv = v; const s = H.get(); s.lv = v; H.set(s); newGame(); }), btn('Nueva', newGame)];
    requestAnimationFrame(() => { fit(); newGame(); });
    return { el: root, tools, key, setSkin: () => draw(), help: 'Mové tu paleta (la roja) con el mouse o con ↑ ↓. Gana el primero que llega a 7.', hide: () => { if (state === 'run') { state = 'pause'; cancelAnimationFrame(raf); } }, show: () => { if (state === 'pause') { state = 'run'; start(); } } };
  }
  BM.register({ id: 'pingpong', n: 'Ping pong', d: 'El clásico de paletas contra la compu, a 7 puntos.', c: '#1f6f5c', create: pingpong, skinLabel: 'Mesa',
    skins: [['verde', 'Verde', '#1f6f5c'], ['azul', 'Azul', '#1d4f91'], ['rojo', 'Roja', '#8e2430'], ['noche', 'Noche', '#14171f']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1f6f5c"/><rect x="6" y="6" width="52" height="52" fill="none" stroke="#fff" stroke-width="2"/><path d="M32 6v52" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><rect x="10" y="20" width="5" height="16" fill="#e8202a"/><rect x="49" y="28" width="5" height="16" fill="#2f6fed"/><circle cx="36" cy="26" r="3.5" fill="#fff"/></svg>',
    best: (s) => s.games ? `${s.wins || 0} ganadas de ${s.games}` : 'Nunca jugaste' });
})();
