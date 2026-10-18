// Tienda de Base · Luces (apagá todas: cada luz cambia también a sus vecinas)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const CSS = `
.lz-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:100%;height:100%;padding:12px;box-sizing:border-box}
.lz-board{display:grid;gap:var(--g);padding:var(--g);border-radius:18px;background:var(--lz-bg);box-shadow:0 22px 50px -22px rgba(0,0,0,.8);touch-action:manipulation}
.lz-c{width:var(--s);height:var(--s);border-radius:calc(var(--s)*.22);border:0;cursor:pointer;background:var(--lz-off);box-shadow:inset 0 -5px 0 rgba(0,0,0,.25),inset 0 2px 0 rgba(255,255,255,.06);transition:background .18s,box-shadow .18s,transform .08s;position:relative}
.lz-c:active{transform:scale(.94)}
.lz-c.on{background:var(--lz-on);box-shadow:0 0 calc(var(--s)*.45) var(--lz-glow),inset 0 -5px 0 rgba(0,0,0,.15),inset 0 3px 0 rgba(255,255,255,.45)}
.lz-c.hint::after{content:"";position:absolute;inset:28%;border-radius:50%;border:3px dashed rgba(255,255,255,.85);animation:lzh 1s linear infinite}
@keyframes lzh{to{transform:rotate(1turn)}}
.lz-info{font-size:13.5px;color:var(--muted);text-align:center}
[data-skin="foco"] .lz-board{--lz-bg:#1b1d24;--lz-off:#2d313c;--lz-on:radial-gradient(circle at 40% 35%,#fff8c9,#ffd23f 55%,#f0a500);--lz-glow:rgba(255,210,63,.55)}
[data-skin="neon"] .lz-board{--lz-bg:#0a0612;--lz-off:#1d1430;--lz-on:radial-gradient(circle at 40% 35%,#ffd6ff,#ff3df2 55%,#9b1fd1);--lz-glow:rgba(255,61,242,.55)}
[data-skin="hielo"] .lz-board{--lz-bg:#0f2233;--lz-off:#1d3a52;--lz-on:radial-gradient(circle at 40% 35%,#ffffff,#8fe3ff 55%,#2aa9e0);--lz-glow:rgba(143,227,255,.55)}
[data-skin="flores"] .lz-board{--lz-bg:#20331f;--lz-off:#33502f;--lz-on:radial-gradient(circle at 40% 35%,#fff0f6,#ff7eb6 55%,#e0437f);--lz-glow:rgba(255,126,182,.5)}
`;
  const SIZES = { 4: '4×4', 5: '5×5', 6: '6×6', 7: '7×7' };
  function luces(H) {
    { const st0 = document.getElementById('st-lz') || document.head.appendChild(h('style', { id: 'st-lz' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    let n = SIZES[H.get().n] ? +H.get().n : 5;
    const root = h('div', { class: 'lz-wrap' });
    const board = h('div', { class: 'lz-board' }), info = h('div', { class: 'lz-info' });
    root.append(board, info);
    let on, cells = [], moves = 0, presses = [], level = 1, done = false, lastSz = '';
    const lvKey = () => 'lv' + n;
    const status = () => H.status([`Nivel ${level}`, `${moves} toques`, `${on ? on.filter(Boolean).length : 0} prendidas`]);
    const nb = (i) => { const r = Math.floor(i / n), c = i % n, out = [i]; if (r > 0) out.push(i - n); if (r < n - 1) out.push(i + n); if (c > 0) out.push(i - 1); if (c < n - 1) out.push(i + 1); return out; };
    function newLevel(again) {
      closeOver(root); done = false; moves = 0;
      level = H.get()[lvKey()] || 1;
      if (!again) {
        // se arma tocando luces al azar desde todo apagado: siempre tiene solución
        const k = Math.min(Math.floor(n * n * 0.6), 2 + level);
        const idx = [...Array(n * n).keys()].sort(() => Math.random() - 0.5).slice(0, k);
        presses = idx;
      }
      on = new Array(n * n).fill(false);
      for (const i of presses) for (const j of nb(i)) on[j] = !on[j];
      if (!on.some(Boolean)) return newLevel();
      build(); status(); SFX('start');
    }
    function fit() {
      const P0 = root.parentElement || root, W = Math.min(root.clientWidth, P0.clientWidth) - 40, Hh = (P0.clientHeight || root.clientHeight) - 80;
      const s = Math.max(34, Math.floor(Math.min(W, Hh) / (n + (n + 1) * 0.12)));
      board.style.setProperty('--s', s + 'px'); board.style.setProperty('--g', Math.round(s * 0.12) + 'px');
    }
    function build() {
      board.style.gridTemplateColumns = `repeat(${n}, var(--s))`;
      board.replaceChildren(); cells = [];
      for (let i = 0; i < n * n; i++) { const b = h('button', { class: 'lz-c' + (on[i] ? ' on' : ''), type: 'button', 'aria-label': 'Luz' }); b.onclick = () => press(i); board.append(b); cells.push(b); }
      info.textContent = `Nivel ${level}: apagá todas las luces. Cada toque cambia la luz y las de al lado (arriba, abajo, izquierda y derecha).`;
      fit();
    }
    function press(i) {
      if (done) return;
      for (const j of nb(i)) { on[j] = !on[j]; cells[j].classList.toggle('on', on[j]); }
      for (const c of cells) c.classList.remove('hint');
      moves++; SFX(on[i] ? 'pop' : 'click'); status();
      if (!on.some(Boolean)) win();
    }
    // pista: resolver con eliminación de Gauss (módulo 2) y marcar una luz de la solución
    function solve() {
      const N = n * n, A = [];
      for (let i = 0; i < N; i++) { const row = new Array(N + 1).fill(0); for (const j of nb(i)) row[j] = 1; row[N] = on[i] ? 1 : 0; A.push(row); }
      let r = 0; const piv = [];
      for (let c = 0; c < N && r < N; c++) {
        let p = -1; for (let k = r; k < N; k++) if (A[k][c]) { p = k; break; } if (p < 0) continue;
        [A[r], A[p]] = [A[p], A[r]];
        for (let k = 0; k < N; k++) if (k !== r && A[k][c]) for (let j = c; j <= N; j++) A[k][j] ^= A[r][j];
        piv.push(c); r++;
      }
      const x = new Array(N).fill(0); piv.forEach((c, k) => { x[c] = A[k][N]; });
      return x;
    }
    function hint() {
      if (done) return;
      const x = solve(); const list = x.map((v, i) => v ? i : -1).filter(i => i >= 0);
      if (!list.length) return;
      const i = list[Math.floor(Math.random() * list.length)];
      for (const c of cells) c.classList.remove('hint'); cells[i].classList.add('hint'); SFX('select');
    }
    function win() {
      done = true;
      const s = H.get(); s[lvKey()] = level + 1; s.wins = (s.wins || 0) + 1; s.top = Math.max(s.top || 0, level); H.set(s);
      setTimeout(() => { confetti(root); overlay(root, '¡Todo apagado!', `Nivel ${level} en ${moves} toques`, [btn('Siguiente nivel', () => newLevel(), 'primary')]); }, 250);
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; requestAnimationFrame(fit); }).observe(root.parentElement ? root : root); requestAnimationFrame(() => { if (root.parentElement) new ResizeObserver(() => requestAnimationFrame(() => { try { fit(); } catch {} })).observe(root.parentElement); });
    const tools = [
      pick('Tamaño', Object.entries(SIZES), String(n), (v) => { n = +v; const s = H.get(); s.n = n; H.set(s); newLevel(); }),
      btn('💡 Pista', hint), btn('↺ Reiniciar', () => newLevel(true)),
      btn('Elegir nivel', () => {
        const inp = h('input', { type: 'number', min: '1', max: '999', value: String(level), style: 'width:120px;padding:10px;border-radius:10px;border:0;font:inherit;font-size:18px;text-align:center' });
        const go = () => { const k = parseInt(inp.value, 10); if (k > 0 && k < 1000) { const s = H.get(); s[lvKey()] = k; H.set(s); newLevel(); } };
        const o = overlay(root, 'Elegir nivel', 'Más alto = más luces prendidas', [btn('Cancelar', () => closeOver(root)), btn('Ir', go, 'primary')]);
        o.querySelector('.mg-over-acts').before(inp); inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); }; setTimeout(() => inp.select(), 50);
      })
    ];
    requestAnimationFrame(() => newLevel());
    return { el: root, tools, help: 'Apagá todas las luces. Cada toque cambia esa luz y las de arriba, abajo, izquierda y derecha. Cada nivel tiene más luces. Si te trabás, pedí una pista.', setSkin: () => {} };
  }

  BM.register({ id: 'luces', n: 'Luces', d: 'Apagá todas las luces: cada toque cambia también las de al lado. Niveles sin fin.', c: '#e0a800', create: luces, skinLabel: 'Luces',
    skins: [['foco', 'Focos', '#ffd23f'], ['neon', 'Neón', '#ff3df2'], ['hielo', 'Hielo', '#8fe3ff'], ['flores', 'Flores', '#ff7eb6']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1b1d24"/><g fill="#2d313c"><rect x="7" y="7" width="14" height="14" rx="3"/><rect x="43" y="7" width="14" height="14" rx="3"/><rect x="7" y="43" width="14" height="14" rx="3"/><rect x="25" y="43" width="14" height="14" rx="3"/></g><g fill="#ffd23f"><rect x="25" y="7" width="14" height="14" rx="3"/><rect x="7" y="25" width="14" height="14" rx="3"/><rect x="25" y="25" width="14" height="14" rx="3"/><rect x="43" y="25" width="14" height="14" rx="3"/><rect x="43" y="43" width="14" height="14" rx="3"/></g><circle cx="32" cy="32" r="12" fill="#ffd23f" opacity=".25"/></svg>',
    best: (s) => s.wins ? `Llegaste al nivel ${(s.top || 0) + 1} · ${s.wins} resueltos` : 'Nunca jugaste' });
})();
