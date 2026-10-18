// Tienda de Base · Deslizá (rompecabezas de fichas que se deslizan, 3×3 a 6×6)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, pick, btn, overlay, confetti, timer, fmtTime } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const CSS = `
.dz-wrap{display:grid;place-items:center;width:100%;height:100%;padding:14px;box-sizing:border-box}
.dz-board{position:relative;border-radius:16px;padding:8px;box-sizing:content-box;background:var(--dz-bg);box-shadow:0 22px 50px -22px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.06);touch-action:none}
.dz-t{position:absolute;display:grid;place-items:center;border-radius:calc(var(--s)*.12);font-weight:800;font-size:calc(var(--s)*.42);font-family:ui-rounded,system-ui,sans-serif;cursor:pointer;user-select:none;transition:left .12s ease,top .12s ease,box-shadow .2s;background:var(--dz-t);color:var(--dz-ink);box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.25),0 3px 8px -3px rgba(0,0,0,.5)}
.dz-t.ok{box-shadow:inset 0 -4px 0 rgba(0,0,0,.18),inset 0 2px 0 rgba(255,255,255,.25),0 0 0 2px var(--dz-ok)}
.dz-t.pic{background-size:var(--bw) var(--bw);color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);font-size:calc(var(--s)*.26);align-items:start;justify-items:start;padding:6px;box-sizing:border-box}
.dz-board.done .dz-t{box-shadow:none;border-radius:0;transition:all .4s}
.dz-board.done .dz-t span{opacity:0;transition:opacity .4s}
[data-skin="madera"] .dz-board{--dz-bg:#5b3a22;--dz-t:linear-gradient(145deg,#e0b47a,#c38d52);--dz-ink:#4a2c14;--dz-ok:#ffe7b0}
[data-skin="colores"] .dz-board{--dz-bg:#20263a;--dz-t:#fff;--dz-ink:#20263a;--dz-ok:#7bd389}
[data-skin="noche"] .dz-board{--dz-bg:#0d1118;--dz-t:linear-gradient(145deg,#2c3446,#1c2230);--dz-ink:#9fd3ff;--dz-ok:#4cc9f0}
[data-skin="imagen"] .dz-board{--dz-bg:#141820;--dz-t:#333;--dz-ink:#fff;--dz-ok:#ffd166}
`;
  const SIZES = { 3: '3×3 (8 fichas)', 4: '4×4 (15 fichas)', 5: '5×5 (24 fichas)', 6: '6×6 (35 fichas)' };
  const HUES = [8, 28, 45, 95, 150, 175, 200, 225, 255, 285, 320, 345];
  // dibujo abstracto (siempre distinto) para el modo "Imagen": se reparte entre las fichas
  function artwork(seed) {
    const c = document.createElement('canvas'); c.width = c.height = 600; const g = c.getContext('2d');
    let x = seed * 9301 + 49297; const R = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
    const h0 = Math.floor(R() * 360);
    const gr = g.createLinearGradient(0, 0, 600, 600); gr.addColorStop(0, `hsl(${h0} 70% 55%)`); gr.addColorStop(1, `hsl(${(h0 + 140) % 360} 65% 35%)`); g.fillStyle = gr; g.fillRect(0, 0, 600, 600);
    for (let i = 0; i < 14; i++) { const r = 40 + R() * 160; g.fillStyle = `hsla(${(h0 + R() * 200) % 360} 80% ${45 + R() * 30}% / .55)`; g.beginPath(); g.arc(R() * 600, R() * 600, r, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(R() * 600, 0); g.bezierCurveTo(R() * 600, 200, R() * 600, 400, R() * 600, 600); g.stroke(); }
    for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(R() * 600, R() * 600, 2 + R() * 5, 0, 7); g.fill(); }
    return c.toDataURL('image/jpeg', 0.85);
  }

  function deslizante(H) {
    if (!document.getElementById('st-dz')) document.head.append(h('style', { id: 'st-dz', text: CSS }));
    let n = SIZES[H.get().n] ? +H.get().n : 4;
    const root = h('div', { class: 'dz-wrap' });
    const board = h('div', { class: 'dz-board' }); root.append(board);
    let tiles, pos, empty, moves = 0, done = false, cs = 80, els = [], pic = '', lastSz = '';
    const t = timer(() => status());
    const key = () => 'best' + n;
    const status = () => { const b = H.get()[key()]; H.status([`${moves} movimientos`, fmtTime(t.secs), b ? `Récord ${b.m} mov · ${fmtTime(b.s)}` : '']); };
    const skin = () => (root.closest('[data-skin]') || root).dataset.skin || 'madera';
    function solvedAt(i) { return pos[i] === i; }
    function newGame() {
      closeOver(root); done = false; moves = 0; t.reset(); board.classList.remove('done');
      // se mezcla moviendo el hueco al azar: siempre tiene solución
      pos = [...Array(n * n).keys()]; empty = n * n - 1; let prev = -1;
      const at = []; pos.forEach((p, i) => { at[p] = i; });
      for (let k = 0; k < n * n * 40; k++) {
        const er = Math.floor(empty / n), ec = empty % n, opts = [];
        if (er > 0) opts.push(empty - n); if (er < n - 1) opts.push(empty + n); if (ec > 0) opts.push(empty - 1); if (ec < n - 1) opts.push(empty + 1);
        const cand = opts.filter(o => o !== prev); const o = cand[Math.floor(Math.random() * cand.length)];
        const ti = at[o]; at[empty] = ti; pos[ti] = empty; at[o] = n * n - 1; prev = empty; empty = o; pos[n * n - 1] = empty;
      }
      if (pos.every((p, i) => p === i)) return newGame();
      pic = skin() === 'imagen' ? artwork(Math.floor(Math.random() * 1e6)) : '';
      build(); SFX('deal'); status();
    }
    function fit() {
      const P0 = root.parentElement || root, W = Math.min(root.clientWidth, P0.clientWidth) - 40, Hh = (P0.clientHeight || root.clientHeight) - 40;
      cs = Math.max(36, Math.floor(Math.min(W, Hh) / n));
      board.style.width = board.style.height = cs * n + 'px';
      board.style.setProperty('--s', cs + 'px'); board.style.setProperty('--bw', cs * n + 'px');
      place();
    }
    function build() {
      board.replaceChildren(); els = [];
      for (let i = 0; i < n * n - 1; i++) {
        const e = h('div', { class: 'dz-t' + (pic ? ' pic' : '') }, h('span', { text: String(i + 1) }));
        if (pic) e.style.backgroundImage = `url(${pic})`;
        else if (skin() === 'colores') { const r = Math.floor(i / n), c = i % n, hu = HUES[(r + c) % HUES.length]; e.style.background = `linear-gradient(145deg,hsl(${hu} 75% 62%),hsl(${hu} 70% 48%))`; e.style.color = '#fff'; }
        e.onpointerdown = (ev) => { ev.preventDefault(); tap(i); };
        board.append(e); els.push(e);
      }
      fit();
    }
    function place() {
      if (!els.length) return;
      const g = 4;
      els.forEach((e, i) => {
        const p = pos[i], r = Math.floor(p / n), c = p % n;
        e.style.left = (c * cs + g / 2) + 'px'; e.style.top = (r * cs + g / 2) + 'px'; e.style.width = e.style.height = (cs - g) + 'px';
        if (pic) e.style.backgroundPosition = `${-(i % n) * cs}px ${-Math.floor(i / n) * cs}px`;
        e.classList.toggle('ok', solvedAt(i));
      });
    }
    // tocar una ficha en la misma fila o columna que el hueco las corre a todas
    function tap(i) {
      if (done) return;
      const p = pos[i], pr = Math.floor(p / n), pc = p % n, er = Math.floor(empty / n), ec = empty % n;
      if (pr !== er && pc !== ec) { SFX('bad'); return; }
      const step = pr === er ? (pc < ec ? -1 : 1) : (pr < er ? -n : n);
      let cur = empty, cnt = 0;
      while (cur !== p) { const next = cur + step; const ti = pos.indexOf(next); pos[ti] = cur; cur = next; cnt++; }
      empty = p; pos[n * n - 1] = empty; moves += cnt;
      if (!t.running) t.start();
      SFX(cnt > 1 ? 'slide' : 'click'); place(); status();
      if (els.every((_, k) => solvedAt(k))) win();
    }
    function win() {
      done = true; t.stop(); board.classList.add('done');
      const s = H.get(), b = s[key()], rec = !b || moves < b.m || (moves === b.m && t.secs < b.s);
      if (rec) s[key()] = { m: moves, s: Math.round(t.secs) }; s.wins = (s.wins || 0) + 1; H.set(s); status();
      setTimeout(() => { confetti(root); overlay(root, '¡Armado!', `${moves} movimientos · ${fmtTime(t.secs)}${rec ? ' · ¡récord!' : ''}`, [btn('Otro', newGame, 'primary')]); }, 450);
    }
    // con las flechas se mueve la ficha que está al lado del hueco hacia él
    const key2 = (e) => {
      const er = Math.floor(empty / n), ec = empty % n; let from = -1;
      if (e.key === 'ArrowUp' && er < n - 1) from = empty + n; else if (e.key === 'ArrowDown' && er > 0) from = empty - n;
      else if (e.key === 'ArrowLeft' && ec < n - 1) from = empty + 1; else if (e.key === 'ArrowRight' && ec > 0) from = empty - 1;
      else return false;
      if (from >= 0) tap(pos.indexOf(from)); return true;
    };
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; requestAnimationFrame(fit); }).observe(root.parentElement ? root : root); requestAnimationFrame(() => { if (root.parentElement) new ResizeObserver(() => requestAnimationFrame(() => { try { fit(); } catch {} })).observe(root.parentElement); });
    const tools = [pick('Tamaño', Object.entries(SIZES), String(n), (v) => { n = +v; const s = H.get(); s.n = n; H.set(s); newGame(); }), btn('Mezclar', newGame)];
    requestAnimationFrame(newGame);
    return {
      el: root, tools, key: key2,
      setSkin: () => { if (!done) { pic = skin() === 'imagen' ? artwork(Math.floor(Math.random() * 1e6)) : ''; build(); } },
      help: 'Ordená las fichas del 1 al último dejando el hueco abajo a la derecha. Tocá una ficha que esté en la misma fila o columna que el hueco (se corren todas), o usá las flechas. En "Imagen" se arma un dibujo.',
      hide: () => t.stop(), show: () => { if (!done && moves) t.start(); }
    };
  }

  BM.register({ id: 'deslizante', n: 'Deslizá', d: 'El clásico rompecabezas de fichas que se deslizan: de 3×3 a 6×6, con números o con un dibujo.', c: '#b5793e', create: deslizante, skinLabel: 'Estilo',
    skins: [['madera', 'Madera', '#c38d52'], ['colores', 'Colores', '#ff7b54'], ['noche', 'Noche', '#2c3446'], ['imagen', 'Imagen', '#7b5cff']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#5b3a22"/><g fill="#d9a865"><rect x="6" y="6" width="16" height="16" rx="3"/><rect x="24" y="6" width="16" height="16" rx="3"/><rect x="42" y="6" width="16" height="16" rx="3"/><rect x="6" y="24" width="16" height="16" rx="3"/><rect x="24" y="24" width="16" height="16" rx="3"/><rect x="42" y="24" width="16" height="16" rx="3"/><rect x="6" y="42" width="16" height="16" rx="3"/><rect x="24" y="42" width="16" height="16" rx="3"/></g><g font-family="system-ui" font-weight="800" font-size="10" fill="#4a2c14" text-anchor="middle"><text x="14" y="18">1</text><text x="32" y="18">2</text><text x="50" y="18">3</text><text x="14" y="36">4</text><text x="32" y="36">5</text><text x="50" y="36">6</text><text x="14" y="54">7</text><text x="32" y="54">8</text></g></svg>',
    best: (s) => s.wins ? `${s.wins} armados${s.best4 ? ` · 4×4 en ${s.best4.m} mov` : ''}` : 'Nunca jugaste' });
})();
