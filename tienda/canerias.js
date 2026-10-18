// Tienda de Base · Cañerías (girá los caños para que el agua llegue a todas las casas)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti, timer, fmtTime } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const CSS = `
.cn-wrap{display:grid;place-items:center;width:100%;height:100%;padding:12px;box-sizing:border-box}
.cn-board{display:grid;gap:2px;padding:8px;border-radius:16px;background:var(--cn-bg);box-shadow:0 22px 50px -22px rgba(0,0,0,.8);touch-action:manipulation;user-select:none}
.cn-c{width:var(--s);height:var(--s);background:var(--cn-cell);border-radius:6px;cursor:pointer;display:block}
.cn-c svg{width:100%;height:100%;display:block}
.cn-c g.r{transition:transform .14s ease;transform-origin:50px 50px}
.cn-c .p{stroke:var(--cn-dry);stroke-width:20;stroke-linecap:round;fill:none}
.cn-c .pi{stroke:var(--cn-dry2);stroke-width:8;stroke-linecap:round;fill:none}
.cn-c.wet .p{stroke:var(--cn-wet)}
.cn-c.wet .pi{stroke:var(--cn-wet2)}
.cn-c .hub{fill:var(--cn-dry)}
.cn-c.wet .hub{fill:var(--cn-wet)}
.cn-c .house{fill:var(--cn-house)} .cn-c.wet .house{fill:var(--cn-house-on)}
.cn-board.done .cn-c{animation:cnw .6s ease}
@keyframes cnw{50%{filter:brightness(1.4)}}
[data-skin="agua"] .cn-board{--cn-bg:#1c2b36;--cn-cell:#24394a;--cn-dry:#8a96a3;--cn-dry2:#6d7884;--cn-wet:#2f9bff;--cn-wet2:#9ad2ff;--cn-house:#c9b79c;--cn-house-on:#ffd166}
[data-skin="cobre"] .cn-board{--cn-bg:#2b1f17;--cn-cell:#3a2a1f;--cn-dry:#9b6a43;--cn-dry2:#7a5232;--cn-wet:#3fd0c9;--cn-wet2:#b5fffa;--cn-house:#bba489;--cn-house-on:#ffe08a}
[data-skin="neon"] .cn-board{--cn-bg:#08070f;--cn-cell:#14112a;--cn-dry:#3b3560;--cn-dry2:#2a2648;--cn-wet:#39ff9e;--cn-wet2:#d6ffe9;--cn-house:#5b5490;--cn-house-on:#39ff9e}
`;
  const SIZES = { 5: '5×5', 7: '7×7', 9: '9×9', 11: '11×11' };
  const D = [[-1, 0, 1], [0, 1, 2], [1, 0, 4], [0, -1, 8]]; // arriba, derecha, abajo, izquierda
  const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
  const rot = (m) => ((m << 1) | (m >> 3)) & 15;
  const ARM = { 1: 'M50 50V0', 2: 'M50 50H100', 4: 'M50 50V100', 8: 'M50 50H0' };
  function canerias(H) {
    { const st0 = document.getElementById('st-cn') || document.head.appendChild(h('style', { id: 'st-cn' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    let n = SIZES[H.get().n] ? +H.get().n : 7;
    const root = h('div', { class: 'cn-wrap' });
    const board = h('div', { class: 'cn-board' }); root.append(board);
    let sol, cur, turns, cells = [], src = 0, moves = 0, done = false, lastSz = '';
    const t = timer(() => status());
    const key = () => 'best' + n;
    const status = () => { const b = H.get()[key()]; H.status([`${moves} giros`, fmtTime(t.secs), b ? `Récord ${fmtTime(b)}` : '']); };
    function newGame() {
      closeOver(root); done = false; moves = 0; t.reset(); board.classList.remove('done');
      // árbol al azar que cubre todo el tablero, desde el tanque del medio (Prim aleatorio)
      sol = new Array(n * n).fill(0); src = Math.floor(n / 2) * n + Math.floor(n / 2);
      const inT = new Set([src]), front = [];
      const addF = (i) => { const r = Math.floor(i / n), c = i % n; for (const [dr, dc, b] of D) { const r2 = r + dr, c2 = c + dc; if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) continue; const j = r2 * n + c2; if (!inT.has(j)) front.push([i, j, b]); } };
      addF(src);
      while (inT.size < n * n) {
        const k = Math.floor(Math.random() * front.length), [i, j, b] = front[k]; front.splice(k, 1);
        if (inT.has(j)) continue;
        // evitar cruces de 4 (se ven feos y son demasiado fáciles)
        if ([1, 2, 4, 8].filter(x => sol[i] & x).length >= 3 && Math.random() < 0.85) { front.push([i, j, b]); if (front.length < 3) { /* sin otra opción */ } else continue; }
        sol[i] |= b; sol[j] |= OPP[b]; inT.add(j); addF(j);
      }
      cur = sol.slice(); turns = new Array(n * n).fill(0);
      for (let i = 0; i < n * n; i++) { const k = Math.floor(Math.random() * 4); for (let q = 0; q < k; q++) cur[i] = rot(cur[i]); turns[i] = k; }
      build(); flow(); SFX('deal'); status();
    }
    function fit() {
      const P0 = root.parentElement || root, W = Math.min(root.clientWidth, P0.clientWidth) - 40, Hh = (P0.clientHeight || root.clientHeight) - 40;
      board.style.setProperty('--s', Math.max(26, Math.floor(Math.min(W, Hh) / n) - 2) + 'px');
    }
    function cellSvg(i) {
      // el dibujo es el del caño "sin girar"; se gira con CSS según los toques
      const m = sol[i], deg = [1, 2, 4, 8].filter(x => m & x);
      let body = deg.map(b => `<path class="p" d="${ARM[b]}"/>`).join('') + deg.map(b => `<path class="pi" d="${ARM[b]}"/>`).join('');
      let top = '';
      if (i === src) top = '<circle cx="50" cy="50" r="30" fill="#2f9bff" stroke="#fff" stroke-width="5"/><path d="M50 30c8 10 13 16 13 23a13 13 0 0 1-26 0c0-7 5-13 13-23z" fill="#fff"/>';
      else if (deg.length === 1) top = '<path class="house" d="M28 54 50 33l22 21v22H28z"/><rect x="45" y="61" width="10" height="15" fill="rgba(0,0,0,.35)"/>';
      else body += '<circle class="hub" cx="50" cy="50" r="11"/>';
      return `<svg viewBox="0 0 100 100"><g class="r">${body}</g>${top}</svg>`;
    }
    function build() {
      board.style.gridTemplateColumns = `repeat(${n}, var(--s))`;
      board.replaceChildren(); cells = [];
      for (let i = 0; i < n * n; i++) {
        const e = h('div', { class: 'cn-c' }); e.innerHTML = cellSvg(i);
        // el caño original gira hacia la derecha "turns" veces para llegar a cómo está ahora
        e.querySelector('g').style.transform = `rotate(${turns[i] * 90}deg)`;
        e.onclick = () => spin(i, 1);
        e.oncontextmenu = (ev) => { ev.preventDefault(); spin(i, -1); };
        board.append(e); cells.push(e);
      }
      fit();
    }
    function spin(i, dir) {
      if (done) return;
      if (dir > 0) { cur[i] = rot(cur[i]); turns[i]++; } else { cur[i] = rot(rot(rot(cur[i]))); turns[i]--; }
      cells[i].querySelector('g').style.transform = `rotate(${turns[i] * 90}deg)`;
      moves++; if (!t.running) t.start();
      const before = cells.filter(c => c.classList.contains('wet')).length;
      const all = flow(); const after = cells.filter(c => c.classList.contains('wet')).length;
      SFX(after > before ? 'pop' : 'click'); status();
      if (all) win();
    }
    // el agua sale del tanque y pasa por los caños que encastran de los dos lados
    function flow() {
      const wet = new Set([src]), st = [src];
      while (st.length) {
        const i = st.pop(), r = Math.floor(i / n), c = i % n;
        for (const [dr, dc, b] of D) {
          if (!(cur[i] & b)) continue;
          const r2 = r + dr, c2 = c + dc; if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) continue;
          const j = r2 * n + c2; if (wet.has(j) || !(cur[j] & OPP[b])) continue;
          wet.add(j); st.push(j);
        }
      }
      cells.forEach((e, i) => e.classList.toggle('wet', wet.has(i)));
      return wet.size === n * n;
    }
    function win() {
      done = true; t.stop(); board.classList.add('done');
      const s = H.get(), rec = !s[key()] || t.secs < s[key()]; if (rec) s[key()] = Math.round(t.secs); s.wins = (s.wins || 0) + 1; H.set(s); status();
      setTimeout(() => { confetti(root); overlay(root, '¡Llegó el agua a todas las casas!', `${moves} giros · ${fmtTime(t.secs)}${rec ? ' · ¡récord!' : ''}`, [btn('Otro', newGame, 'primary')]); }, 500);
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; requestAnimationFrame(fit); }).observe(root.parentElement ? root : root); requestAnimationFrame(() => { if (root.parentElement) new ResizeObserver(() => requestAnimationFrame(() => { try { fit(); } catch {} })).observe(root.parentElement); });
    const tools = [pick('Tamaño', Object.entries(SIZES), String(n), (v) => { n = +v; const s = H.get(); s.n = n; H.set(s); newGame(); }), btn('Nuevo', newGame)];
    requestAnimationFrame(newGame);
    return { el: root, tools, setSkin: () => {}, help: 'Tocá un caño para girarlo (clic derecho lo gira para el otro lado). Conectá todos los caños para que el agua del tanque llegue a todas las casas, sin que quede ninguno suelto.', hide: () => t.stop(), show: () => { if (!done && moves) t.start(); } };
  }

  BM.register({ id: 'canerias', n: 'Cañerías', d: 'Girá los caños para que el agua del tanque llegue a todas las casas.', c: '#2f9bff', create: canerias, skinLabel: 'Caños',
    skins: [['agua', 'Agua', '#2f9bff'], ['cobre', 'Cobre', '#9b6a43'], ['neon', 'Neón', '#39ff9e']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1c2b36"/><path d="M32 32V8M32 32H56M32 32V56M8 20H20V32H32" stroke="#2f9bff" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M8 44H20" stroke="#8a96a3" stroke-width="7" stroke-linecap="round"/><circle cx="32" cy="32" r="8" fill="#2f9bff" stroke="#fff" stroke-width="2"/><path d="M50 50l6-5 6 5v7H50z" fill="#ffd166"/></svg>',
    best: (s) => s.wins ? `${s.wins} resueltos${s.best7 ? ` · 7×7 en ${fmtTime(s.best7)}` : ''}` : 'Nunca jugaste' });
})();
