// Tienda de Base · Tubos de colores (ordená las bolitas: cada tubo de un solo color)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const CSS = `
.tb-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;width:100%;height:100%;padding:12px;box-sizing:border-box}
.tb-rows{display:flex;flex-direction:column;gap:calc(var(--b)*.9);align-items:center}
.tb-row{display:flex;gap:calc(var(--b)*.55);justify-content:center}
.tb-t{position:relative;width:calc(var(--b)*1.3);height:calc(var(--b)*(var(--cap)*1.08 + .7));border:3px solid var(--tb-glass);border-top:0;border-radius:0 0 calc(var(--b)*.65) calc(var(--b)*.65);background:linear-gradient(90deg,rgba(255,255,255,.1),rgba(255,255,255,.02) 40%,rgba(255,255,255,.08));cursor:pointer;display:flex;flex-direction:column-reverse;align-items:center;padding-bottom:calc(var(--b)*.12);box-sizing:border-box;transition:transform .15s}
.tb-t::before{content:"";position:absolute;top:-4px;left:-7px;right:-7px;height:6px;border-radius:4px;background:var(--tb-glass)}
.tb-t.sel{transform:translateY(calc(var(--b)*-.35))}
.tb-t.full{box-shadow:0 0 18px -2px var(--tb-done)}
.tb-t.nope{animation:tbn .3s}
@keyframes tbn{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.tb-ball{width:var(--b);height:var(--b);border-radius:50%;margin-top:calc(var(--b)*.08);flex:none;box-shadow:inset -4px -5px 0 rgba(0,0,0,.18),inset 4px 4px 0 rgba(255,255,255,.3);transition:transform .15s}
.tb-t.sel .tb-ball:last-child{transform:translateY(calc(var(--b)*-.9))}
.tb-ball.k{display:grid;place-items:center;font-size:calc(var(--b)*.55);font-weight:900;color:rgba(0,0,0,.5);font-family:system-ui}
.tb-info{font-size:13.5px;color:var(--muted)}
[data-skin="vidrio"]{--tb-glass:rgba(220,235,255,.55);--tb-done:#7bd389}
[data-skin="neon"]{--tb-glass:rgba(255,80,240,.7);--tb-done:#ff50f0}
[data-skin="simbolos"]{--tb-glass:rgba(255,255,255,.6);--tb-done:#ffd166}
`;
  const COLS = ['#e63946', '#f4a261', '#ffd23f', '#2a9d8f', '#4cc9f0', '#3a5bd9', '#9b5de5', '#f15bb5', '#8d6e63', '#7bd389', '#ffffff', '#3d3d3d'];
  const SYMS = ['●', '▲', '■', '◆', '★', '✚', '♥', '♣', '☾', '✿', '◐', '✱'];
  const CAP = 4;
  // ¿se puede ordenar? búsqueda en profundidad con memoria y un tope de pasos
  function solvable(tubes, limit = 60000) {
    const seen = new Set(); let steps = 0;
    const keyOf = (T) => T.map(t => t.join(',')).sort().join('|');
    const done = (T) => T.every(t => !t.length || (t.length === CAP && t.every(x => x === t[0])));
    function rec(T) {
      if (done(T)) return true;
      if (++steps > limit) return null;
      const k = keyOf(T); if (seen.has(k)) return false; seen.add(k);
      for (let a = 0; a < T.length; a++) {
        const A = T[a]; if (!A.length) continue;
        const c = A[A.length - 1];
        if (A.length === CAP && A.every(x => x === c)) continue;
        for (let b = 0; b < T.length; b++) {
          if (a === b) continue; const B = T[b];
          if (B.length >= CAP || (B.length && B[B.length - 1] !== c)) continue;
          if (!B.length && A.every(x => x === c)) continue; // pasar un tubo de un solo color a uno vacío no sirve
          const N = T.map(t => t.slice()); N[b].push(N[a].pop());
          while (N[a].length && N[a][N[a].length - 1] === c && N[b].length < CAP) N[b].push(N[a].pop());
          const r = rec(N); if (r) return true; if (r === null) return null;
        }
      }
      return false;
    }
    return rec(tubes);
  }
  function tubos(H) {
    { const st0 = document.getElementById('st-tb') || document.head.appendChild(h('style', { id: 'st-tb' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    const root = h('div', { class: 'tb-wrap' });
    const rows = h('div', { class: 'tb-rows' }), info = h('div', { class: 'tb-info' });
    root.append(rows, info);
    let T = [], start = [], sel = -1, hist = [], moves = 0, level = 1, extra = false, done = false, lastSz = '';
    const status = () => H.status([`Nivel ${level}`, `${moves} movimientos`, extra ? 'Con tubo extra' : '']);
    const nColors = () => Math.min(12, 3 + Math.floor((level - 1) / 2));
    function newLevel(again) {
      closeOver(root); done = false; sel = -1; hist = []; moves = 0; extra = false;
      level = H.get().lv || 1;
      if (!again) {
        const n = nColors(); let tries = 0;
        do {
          const balls = []; for (let c = 0; c < n; c++) for (let k = 0; k < CAP; k++) balls.push(c);
          for (let i = balls.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [balls[i], balls[j]] = [balls[j], balls[i]]; }
          start = []; for (let c = 0; c < n; c++) start.push(balls.slice(c * CAP, c * CAP + CAP)); start.push([], []);
          tries++;
        } while ((start.some(t => t.length === CAP && t.every(x => x === t[0])) || solvable(start.map(t => t.slice()), n > 8 ? 25000 : 60000) !== true) && tries < 40);
      }
      T = start.map(t => t.slice());
      render(); status(); SFX('deal');
    }
    function fit() {
      const n = T.length, perRow = n > 7 ? Math.ceil(n / 2) : n, rowsN = n > 7 ? 2 : 1;
      const P0 = root.parentElement || root, W = Math.min(root.clientWidth, P0.clientWidth) - 30, Hh = (P0.clientHeight || root.clientHeight) - 60;
      const bw = W / (perRow * 1.85), bh = Hh / (rowsN * (CAP * 1.08 + 1.6) + 0.4);
      root.style.setProperty('--b', Math.max(18, Math.min(54, Math.floor(Math.min(bw, bh)))) + 'px');
      root.style.setProperty('--cap', CAP + (extra ? 0 : 0));
    }
    function render() {
      const n = T.length, perRow = n > 7 ? Math.ceil(n / 2) : n;
      const syms = (root.dataset.skin || '') === 'simbolos';
      rows.replaceChildren();
      for (let r = 0; r * perRow < n; r++) {
        const row = h('div', { class: 'tb-row' });
        for (let i = r * perRow; i < Math.min(n, (r + 1) * perRow); i++) {
          const t = T[i], full = t.length === CAP && t.every(x => x === t[0]);
          const el = h('div', { class: 'tb-t' + (i === sel ? ' sel' : '') + (full ? ' full' : '') });
          for (const c of t) el.append(h('div', { class: 'tb-ball' + (syms ? ' k' : ''), style: `background:${COLS[c]}`, text: syms ? SYMS[c] : '' }));
          el.onclick = () => tap(i, el);
          row.append(el);
        }
        rows.append(row);
      }
      info.textContent = `Nivel ${level} · ${nColors()} colores. Tocá un tubo y después otro para pasar las bolitas de arriba (sólo arriba de una del mismo color o a un tubo vacío).`;
      fit();
    }
    function tap(i, el) {
      if (done) return;
      if (sel < 0) { if (!T[i].length) return; sel = i; SFX('select'); return render(); }
      if (sel === i) { sel = -1; SFX('tap'); return render(); }
      const A = T[sel], B = T[i], c = A[A.length - 1];
      if (B.length >= CAP || (B.length && B[B.length - 1] !== c)) { SFX('bad'); el.classList.remove('nope'); void el.offsetWidth; el.classList.add('nope'); if (B.length) { sel = B.length ? i : -1; } return setTimeout(render, 280); }
      hist.push(T.map(t => t.slice()));
      let k = 0; while (A.length && A[A.length - 1] === c && B.length < CAP) { B.push(A.pop()); k++; }
      moves++; sel = -1;
      const full = B.length === CAP && B.every(x => x === B[0]);
      SFX(full ? 'good' : 'place'); render(); status();
      if (T.every(t => !t.length || (t.length === CAP && t.every(x => x === t[0])))) win();
    }
    function undo() { const p = hist.pop(); if (!p || done) return; T = p; moves++; sel = -1; SFX('erase'); render(); status(); }
    function addTube() { if (extra || done) return; extra = true; T.push([]); SFX('pop'); render(); status(); }
    function win() {
      done = true;
      const s = H.get(); s.lv = level + 1; s.wins = (s.wins || 0) + 1; s.top = Math.max(s.top || 0, level); H.set(s);
      setTimeout(() => { confetti(root); overlay(root, '¡Ordenado!', `Nivel ${level} en ${moves} movimientos${extra ? ' (con tubo extra)' : ''}`, [btn('Siguiente nivel', () => newLevel(), 'primary')]); }, 300);
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; requestAnimationFrame(fit); }).observe(root.parentElement ? root : root); requestAnimationFrame(() => { if (root.parentElement) new ResizeObserver(() => requestAnimationFrame(() => { try { fit(); } catch {} })).observe(root.parentElement); });
    const key = (e) => { if ((e.ctrlKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'Backspace') { undo(); return true; } return false; };
    const tools = [btn('↶ Deshacer', undo), btn('＋ Tubo extra', addTube), btn('↺ Reiniciar', () => newLevel(true)), btn('Saltar nivel', () => { const s = H.get(); s.lv = level + 1; H.set(s); newLevel(); })];
    requestAnimationFrame(() => newLevel());
    return { el: root, tools, key, setSkin: () => render(), help: 'Dejá cada tubo con bolitas de un solo color. Tocá un tubo y después otro: las bolitas de arriba pasan si caen sobre una del mismo color o en un tubo vacío. Ctrl+Z deshace. Una vez por nivel podés sumar un tubo extra.' };
  }

  BM.register({ id: 'tubos', n: 'Tubos de colores', d: 'Ordená las bolitas para que cada tubo quede de un solo color. Niveles cada vez con más colores.', c: '#3a5bd9', create: tubos, skinLabel: 'Tubos',
    skins: [['vidrio', 'Vidrio', '#cfe3ff'], ['neon', 'Neón', '#ff50f0'], ['simbolos', 'Con símbolos (daltónicos)', '#ffd166']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1d2433"/><g fill="none" stroke="#cfe3ff" stroke-width="2"><path d="M8 10v40a6 6 0 0 0 12 0V10"/><path d="M26 10v40a6 6 0 0 0 12 0V10"/><path d="M44 10v40a6 6 0 0 0 12 0V10"/></g><circle cx="14" cy="50" r="4.5" fill="#e63946"/><circle cx="14" cy="40" r="4.5" fill="#ffd23f"/><circle cx="14" cy="30" r="4.5" fill="#e63946"/><circle cx="32" cy="50" r="4.5" fill="#ffd23f"/><circle cx="32" cy="40" r="4.5" fill="#4cc9f0"/><circle cx="50" cy="50" r="4.5" fill="#4cc9f0"/></svg>',
    best: (s) => s.wins ? `Llegaste al nivel ${(s.top || 0) + 1}` : 'Nunca jugaste' });
})();
