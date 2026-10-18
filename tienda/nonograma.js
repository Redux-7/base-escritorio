// Tienda de Base · Nonograma (pintá las casillas según los números de filas y columnas)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti, timer, fmtTime, seg } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const CSS = `
.ng-wrap{display:grid;place-items:center;width:100%;height:100%;padding:10px;box-sizing:border-box}
.ng-grid{display:grid;user-select:none;touch-action:none;background:var(--ng-paper);padding:10px;border-radius:14px;box-shadow:0 22px 50px -22px rgba(0,0,0,.8);color:var(--ng-ink)}
.ng-col{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:1px;padding-bottom:4px;font-weight:800;font-size:calc(var(--s)*.42);line-height:1.05;font-family:ui-rounded,system-ui,sans-serif}
.ng-row{display:flex;justify-content:flex-end;align-items:center;gap:calc(var(--s)*.28);padding-right:6px;font-weight:800;font-size:calc(var(--s)*.42);font-family:ui-rounded,system-ui,sans-serif;white-space:nowrap}
.ng-col.ok,.ng-row.ok{opacity:.3}
.ng-col.cur,.ng-row.cur{color:var(--ng-acc)}
.ng-c{width:var(--s);height:var(--s);box-sizing:border-box;border-right:1px solid var(--ng-line);border-bottom:1px solid var(--ng-line);background:var(--ng-cell);position:relative;cursor:pointer}
.ng-c.b5r{border-right:2px solid var(--ng-line5)} .ng-c.b5b{border-bottom:2px solid var(--ng-line5)}
.ng-c.l{border-left:2px solid var(--ng-line5)} .ng-c.t{border-top:2px solid var(--ng-line5)}
.ng-c.f{background:var(--ng-fill)}
.ng-c.x::before,.ng-c.x::after{content:"";position:absolute;left:22%;right:22%;top:50%;height:2px;background:var(--ng-x);transform:rotate(45deg)}
.ng-c.x::after{transform:rotate(-45deg)}
.ng-c.hl{box-shadow:inset 0 0 0 999px rgba(255,200,60,.12)}
.ng-grid.done .ng-c{border-color:transparent}
.ng-grid.done .ng-c.x::before,.ng-grid.done .ng-c.x::after{display:none}
[data-skin="papel"] .ng-grid{--ng-paper:#f7f3ea;--ng-ink:#2b2a33;--ng-cell:#fffdf8;--ng-fill:#2b2a33;--ng-line:#d8d1c2;--ng-line5:#8f8676;--ng-x:#c0392b;--ng-acc:#d35400}
[data-skin="noche"] .ng-grid{--ng-paper:#1a1e29;--ng-ink:#d7deea;--ng-cell:#232838;--ng-fill:#8fd3ff;--ng-line:#2f3548;--ng-line5:#56607a;--ng-x:#ff7a7a;--ng-acc:#ffd166}
[data-skin="pixel"] .ng-grid{--ng-paper:#203024;--ng-ink:#d9f2c4;--ng-cell:#2c4232;--ng-fill:#9ee35b;--ng-line:#365040;--ng-line5:#5b8063;--ng-x:#ff9b6b;--ng-acc:#ffe36e}
`;
  const SIZES = { 5: '5×5', 10: '10×10', 15: '15×15' };
  const clueOf = (arr) => { const out = []; let k = 0; for (const v of arr) { if (v) k++; else if (k) { out.push(k); k = 0; } } if (k) out.push(k); return out.length ? out : [0]; };
  function nonograma(H) {
    if (!document.getElementById('st-ng')) document.head.append(h('style', { id: 'st-ng', text: CSS }));
    let n = SIZES[H.get().n] ? +H.get().n : 10;
    const root = h('div', { class: 'ng-wrap' });
    const grid = h('div', { class: 'ng-grid' }); root.append(grid);
    let sol, cur, rowC, colC, cells = [], rowEls = [], colEls = [], done = false, mode = 'f', drag = null, lastSz = '', hints = 0;
    const t = timer(() => status());
    const key = () => 'best' + n;
    const status = () => { const b = H.get()[key()]; H.status([fmtTime(t.secs), hints ? `${hints} pistas` : '', b ? `Récord ${fmtTime(b)}` : '']); };
    // dibujo al azar con manchas (no ruido): se suaviza un par de veces para que tenga formas
    function makePic() {
      let g = Array.from({ length: n * n }, () => Math.random() < 0.55);
      for (let it = 0; it < 2; it++) {
        const ng = g.slice();
        for (let i = 0; i < n * n; i++) { const r = Math.floor(i / n), c = i % n; let s = 0, k = 0; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const r2 = r + dr, c2 = c + dc; if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) continue; k++; if (g[r2 * n + c2]) s++; } ng[i] = s * 2 > k ? true : s * 2 < k ? false : g[i]; }
        g = ng;
      }
      const fill = g.filter(Boolean).length / (n * n);
      if (fill < 0.35 || fill > 0.72) return makePic();
      return g;
    }
    function newGame() {
      closeOver(root); done = false; hints = 0; t.reset(); grid.classList.remove('done');
      sol = makePic(); cur = new Array(n * n).fill(0);
      rowC = []; colC = [];
      for (let r = 0; r < n; r++) rowC.push(clueOf(sol.slice(r * n, r * n + n)));
      for (let c = 0; c < n; c++) colC.push(clueOf(Array.from({ length: n }, (_, r) => sol[r * n + c])));
      build(); SFX('deal'); status();
    }
    function fit() {
      const maxRow = Math.max(...rowC.map(x => x.length)), maxCol = Math.max(...colC.map(x => x.length));
      const P0 = root.parentElement || root, W = Math.min(root.clientWidth, P0.clientWidth) - 40, Hh = (P0.clientHeight || root.clientHeight) - 40;
      const s = Math.floor(Math.min(W / (n + maxRow * 0.75 + 0.6), Hh / (n + maxCol * 0.5 + 0.8)));
      grid.style.setProperty('--s', Math.max(14, Math.min(46, s)) + 'px');
    }
    function build() {
      const maxRow = Math.max(...rowC.map(x => x.length));
      grid.style.gridTemplateColumns = `auto repeat(${n}, var(--s))`;
      grid.replaceChildren(h('div')); cells = []; rowEls = []; colEls = [];
      for (let c = 0; c < n; c++) { const e = h('div', { class: 'ng-col' }, ...colC[c].map(v => h('span', { text: String(v) }))); grid.append(e); colEls.push(e); }
      for (let r = 0; r < n; r++) {
        const re = h('div', { class: 'ng-row', style: `min-width:calc(var(--s)*${maxRow * 0.62})` }, ...rowC[r].map(v => h('span', { text: String(v) }))); grid.append(re); rowEls.push(re);
        for (let c = 0; c < n; c++) {
          const i = r * n + c;
          const e = h('div', { class: 'ng-c' + ((c + 1) % 5 === 0 && c < n - 1 ? ' b5r' : '') + ((r + 1) % 5 === 0 && r < n - 1 ? ' b5b' : '') + (c === 0 ? ' l' : '') + (r === 0 ? ' t' : '') });
          e.dataset.i = i; grid.append(e); cells.push(e);
        }
      }
      fit(); paint();
    }
    function paint() {
      cells.forEach((e, i) => { e.classList.toggle('f', cur[i] === 1); e.classList.toggle('x', cur[i] === 2); });
      for (let r = 0; r < n; r++) rowEls[r].classList.toggle('ok', clueOf(cur.slice(r * n, r * n + n).map(v => v === 1)).join() === rowC[r].join());
      for (let c = 0; c < n; c++) colEls[c].classList.toggle('ok', clueOf(Array.from({ length: n }, (_, r) => cur[r * n + c] === 1)).join() === colC[c].join());
    }
    function setCell(i, v) { if (cur[i] === v) return false; cur[i] = v; return true; }
    function check() {
      // vale cualquier dibujo que cumpla todos los números
      if (rowEls.every(e => e.classList.contains('ok')) && colEls.every(e => e.classList.contains('ok'))) win();
    }
    function highlight(i) {
      const r = Math.floor(i / n), c = i % n;
      rowEls.forEach((e, k) => e.classList.toggle('cur', k === r)); colEls.forEach((e, k) => e.classList.toggle('cur', k === c));
    }
    grid.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.ng-c'); if (!el || done) return; e.preventDefault();
      const i = +el.dataset.i, want = (e.button === 2 || mode === 'x') ? 2 : 1;
      const v = cur[i] === want ? 0 : want;
      drag = { v, last: i, r: Math.floor(i / n), c: i % n, axis: null };
      if (!t.running) t.start();
      setCell(i, v); SFX(v === 1 ? 'click' : v === 2 ? 'tick' : 'erase'); paint(); highlight(i);
      grid.setPointerCapture(e.pointerId);
    });
    grid.addEventListener('pointermove', (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY), c = el && el.closest && el.closest('.ng-c');
      if (c) highlight(+c.dataset.i);
      if (!drag || !c) return;
      let i = +c.dataset.i; if (i === drag.last) return;
      // al arrastrar se queda en la misma fila o columna
      const r = Math.floor(i / n), cc = i % n;
      if (!drag.axis) drag.axis = r === drag.r ? 'r' : cc === drag.c ? 'c' : null;
      if (drag.axis === 'r') i = drag.r * n + cc; else if (drag.axis === 'c') i = r * n + drag.c; else return;
      drag.last = i;
      if (setCell(i, drag.v)) { SFX('move'); paint(); }
    });
    const endDrag = () => { if (!drag) return; drag = null; check(); };
    grid.addEventListener('pointerup', endDrag); grid.addEventListener('pointercancel', endDrag);
    grid.addEventListener('contextmenu', (e) => e.preventDefault());
    function hint() {
      if (done) return;
      const wrong = []; for (let i = 0; i < n * n; i++) if ((cur[i] === 1) !== sol[i]) wrong.push(i);
      if (!wrong.length) return;
      const i = wrong[Math.floor(Math.random() * wrong.length)]; cur[i] = sol[i] ? 1 : 2; hints++;
      cells[i].classList.add('hl'); setTimeout(() => cells[i] && cells[i].classList.remove('hl'), 1200);
      SFX('select'); paint(); status(); check();
    }
    function win() {
      done = true; t.stop(); grid.classList.add('done');
      for (let i = 0; i < n * n; i++) if (cur[i] === 2) cur[i] = 0; paint();
      const s = H.get(), rec = !hints && (!s[key()] || t.secs < s[key()]); if (rec) s[key()] = Math.round(t.secs); s.wins = (s.wins || 0) + 1; H.set(s); status();
      setTimeout(() => { confetti(root); overlay(root, '¡Resuelto!', `${fmtTime(t.secs)}${hints ? ` · ${hints} pistas` : ''}${rec ? ' · ¡récord!' : ''}`, [btn('Otro', newGame, 'primary')]); }, 500);
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; if (rowC) requestAnimationFrame(fit); }).observe(root.parentElement ? root : root); requestAnimationFrame(() => { if (root.parentElement) new ResizeObserver(() => requestAnimationFrame(() => { try { fit(); } catch {} })).observe(root.parentElement); });
    const tools = [
      pick('Tamaño', Object.entries(SIZES), String(n), (v) => { n = +v; const s = H.get(); s.n = n; H.set(s); newGame(); }),
      seg([['f', '■ Pintar'], ['x', '✕ Marcar']], mode, (v) => { mode = v; }),
      btn('💡 Pista', hint), btn('Borrar todo', () => { if (done) return; cur.fill(0); SFX('erase'); paint(); }), btn('Nuevo', newGame)
    ];
    requestAnimationFrame(newGame);
    return { el: root, tools, setSkin: () => {}, help: 'Los números dicen cuántas casillas seguidas hay que pintar en cada fila y columna, en ese orden y con al menos un espacio entre grupos. Clic pinta, clic derecho (o el modo "Marcar") pone una cruz donde seguro no va nada. Podés arrastrar.', hide: () => t.stop(), show: () => { if (!done && cur && cur.some(Boolean)) t.start(); } };
  }

  BM.register({ id: 'nonograma', n: 'Nonograma', d: 'Pintá las casillas según los números de cada fila y columna, y aparece un dibujo.', c: '#2b2a33', create: nonograma, skinLabel: 'Papel',
    skins: [['papel', 'Papel', '#f7f3ea'], ['noche', 'Noche', '#8fd3ff'], ['pixel', 'Pixel', '#9ee35b']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#f7f3ea"/><g fill="#2b2a33"><rect x="22" y="22" width="8" height="8"/><rect x="30" y="22" width="8" height="8"/><rect x="22" y="30" width="8" height="8"/><rect x="38" y="30" width="8" height="8"/><rect x="30" y="38" width="8" height="8"/><rect x="38" y="38" width="8" height="8"/><rect x="22" y="46" width="8" height="8"/></g><g font-family="system-ui" font-weight="800" font-size="7" fill="#8f8676"><text x="12" y="28">2</text><text x="8" y="36">1 1</text><text x="12" y="44">2</text><text x="12" y="52">1</text><text x="24" y="18">3</text><text x="32" y="12">1</text><text x="32" y="18">1</text><text x="40" y="18">2</text></g><path d="M22 22h24v32H22z" fill="none" stroke="#8f8676"/></svg>',
    best: (s) => s.wins ? `${s.wins} resueltos${s.best10 ? ` · 10×10 en ${fmtTime(s.best10)}` : ''}` : 'Nunca jugaste' });
})();
