// Tienda de Base · Damas (contra la compu)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const CSS = `
.dm-wrap{display:grid;place-items:center;width:100%;height:100%;padding:10px;box-sizing:border-box}
.dm-board{display:grid;grid-template-columns:repeat(8,1fr);width:var(--bs);height:var(--bs);border-radius:10px;overflow:hidden;box-shadow:0 0 0 8px var(--dm-edge),0 24px 50px -18px rgba(0,0,0,.8);position:relative}
.dm-wrap{--dm-l:#f0d9b5;--dm-d:#b58863;--dm-edge:#6b4226;--dm-a:#f7f2e8;--dm-b:#2b2b2b}
.dm-wrap[data-skin="verde"]{--dm-l:#eeeed2;--dm-d:#769656;--dm-edge:#3e5a2a;--dm-a:#ffffff;--dm-b:#c0392b}
.dm-wrap[data-skin="azul"]{--dm-l:#dee3e6;--dm-d:#5b7a99;--dm-edge:#2c3e50;--dm-a:#fff8e7;--dm-b:#1d2433}
.dm-sq{position:relative;display:grid;place-items:center}
.dm-sq.l{background:var(--dm-l)}.dm-sq.d{background:var(--dm-d)}
.dm-sq.can{cursor:pointer}
.dm-sq.dst::after{content:"";width:30%;height:30%;border-radius:50%;background:rgba(255,211,77,.85);box-shadow:0 0 0 3px rgba(0,0,0,.2)}
.dm-sq.last{box-shadow:inset 0 0 0 3px rgba(255,211,77,.7)}
.dm-p{width:78%;height:78%;border-radius:50%;display:grid;place-items:center;transition:transform .15s;pointer-events:none}
.dm-p.a{background:radial-gradient(circle at 35% 30%,#fff,var(--dm-a) 55%,#cfc6b5);box-shadow:0 4px 0 #a99f8c,0 6px 10px rgba(0,0,0,.4)}
.dm-p.b{background:radial-gradient(circle at 35% 30%,#666,var(--dm-b) 60%,#000);box-shadow:0 4px 0 #000,0 6px 10px rgba(0,0,0,.5)}
.dm-p::before{content:"";width:62%;height:62%;border-radius:50%;box-shadow:inset 0 0 0 2px rgba(0,0,0,.18)}
.dm-p.k::after{content:"♛";position:absolute;font-size:calc(var(--bs)/16);color:#e2b13c;text-shadow:0 1px 1px #000}
.dm-sq.sel .dm-p{transform:translateY(-4px) scale(1.06);outline:3px solid #ffd34d;outline-offset:2px}
.dm-sq.movable .dm-p{box-shadow:0 0 0 3px rgba(127,224,138,.9),0 4px 0 #a99f8c}
.dm-p.gone{opacity:.25}
`;
  // tablero: 64 casillas, 'a' son las tuyas (abajo, suben), 'b' las de la compu; mayúscula = dama
  const RC = (i) => [i >> 3, i & 7], IX = (r, c) => r * 8 + c, inb = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const side = (x) => x ? (x.toLowerCase() === 'a' ? 'a' : 'b') : null;
  const isK = (x) => x && x === x.toUpperCase();
  function moves(B, who, back) {
    const caps = [], plain = [];
    const fwd = who === 'a' ? -1 : 1;
    for (let i = 0; i < 64; i++) {
      const x = B[i]; if (side(x) !== who) continue;
      const [r, c] = RC(i), king = isK(x);
      // capturas (en cadena)
      const rec = (r0, c0, b, path, taken) => {
        let ext = false;
        for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
          if (!king && !back && dr !== fwd) continue;
          if (king) {
            let rr = r0 + dr, cc = c0 + dc; while (inb(rr, cc) && !b[IX(rr, cc)]) { rr += dr; cc += dc; }
            if (!inb(rr, cc) || side(b[IX(rr, cc)]) === who || taken.includes(IX(rr, cc))) continue;
            const ci = IX(rr, cc); let lr = rr + dr, lc = cc + dc;
            while (inb(lr, lc) && !b[IX(lr, lc)]) { ext = true; const nb = b.slice(); nb[ci] = null; nb[IX(lr, lc)] = nb[IX(r0, c0)]; nb[IX(r0, c0)] = null; rec(lr, lc, nb, [...path, IX(lr, lc)], [...taken, ci]); lr += dr; lc += dc; }
          } else {
            const mr = r0 + dr, mc = c0 + dc, lr = r0 + 2 * dr, lc = c0 + 2 * dc;
            if (!inb(lr, lc) || b[IX(lr, lc)] || side(b[IX(mr, mc)]) !== (who === 'a' ? 'b' : 'a')) continue;
            ext = true; const nb = b.slice(); nb[IX(mr, mc)] = null; nb[IX(lr, lc)] = nb[IX(r0, c0)]; nb[IX(r0, c0)] = null;
            rec(lr, lc, nb, [...path, IX(lr, lc)], [...taken, IX(mr, mc)]);
          }
        }
        if (!ext && taken.length) caps.push({ from: i, path, caps: taken });
      };
      rec(r, c, B, [], []);
      for (const [dr, dc] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        if (!king && dr !== fwd) continue;
        let rr = r + dr, cc = c + dc;
        while (inb(rr, cc) && !B[IX(rr, cc)]) { plain.push({ from: i, path: [IX(rr, cc)], caps: [] }); if (!king) break; rr += dr; cc += dc; }
      }
    }
    if (caps.length) { const mx = Math.max(...caps.map(m => m.caps.length)); return caps.filter(m => m.caps.length === mx); }
    return plain;
  }
  function apply(B, m) {
    const b = B.slice(), to = m.path[m.path.length - 1]; let x = b[m.from]; b[m.from] = null; for (const c of m.caps) b[c] = null;
    const [r] = RC(to); if (x === 'a' && r === 0) x = 'A'; if (x === 'b' && r === 7) x = 'B'; b[to] = x; return b;
  }
  function evalB(B) { let s = 0; for (let i = 0; i < 64; i++) { const x = B[i]; if (!x) continue; const [r, c] = RC(i); const v = isK(x) ? 320 : 100 + (side(x) === 'b' ? r : 7 - r) * 4 + (c > 1 && c < 6 ? 3 : 0); s += side(x) === 'b' ? v : -v; } return s; }
  function search(B, depth, who, alpha, beta, back) {
    const ms = moves(B, who, back);
    if (!ms.length) return who === 'b' ? -100000 - depth : 100000 + depth;
    if (depth === 0) return evalB(B);
    if (who === 'b') { let v = -Infinity; for (const m of ms) { v = Math.max(v, search(apply(B, m), depth - 1, 'a', alpha, beta, back)); alpha = Math.max(alpha, v); if (alpha >= beta) break; } return v; }
    let v = Infinity; for (const m of ms) { v = Math.min(v, search(apply(B, m), depth - 1, 'b', alpha, beta, back)); beta = Math.min(beta, v); if (alpha >= beta) break; } return v;
  }
  function damas(H) {
    { const st = document.getElementById('st-dm') || document.head.appendChild(h('style', { id: 'st-dm' })); if (st.textContent !== CSS) st.textContent = CSS; }
    const root = h('div', { class: 'dm-wrap' }), board = h('div', { class: 'dm-board' }); root.append(board);
    const lvl = () => H.get().lvl || 'normal', back = () => (H.get().reglas || 'clasicas') === 'inter';
    let B, turn, sel = null, last = [], busy = false, over = false, sqs = [];
    for (let i = 0; i < 64; i++) { const [r, c] = RC(i); const e = h('div', { class: 'dm-sq ' + ((r + c) % 2 ? 'd' : 'l') }); e.onclick = () => click(i); sqs.push(e); board.append(e); }
    function newGame() {
      B = Array(64).fill(null);
      for (let i = 0; i < 64; i++) { const [r, c] = RC(i); if ((r + c) % 2) { if (r < 3) B[i] = 'b'; if (r > 4) B[i] = 'a'; } }
      turn = 'a'; sel = null; last = []; busy = false; over = false; paint();
    }
    const count = (w) => B.filter(x => side(x) === w).length;
    function status() { H.status([`Tus fichas ${count('a')}`, `De la compu ${count('b')}`, turn === 'a' ? 'Te toca' : 'Piensa la compu…', H.get().wins ? `Ganadas ${H.get().wins}` : '']); }
    function paint() {
      status();
      const ms = turn === 'a' && !busy && !over ? moves(B, 'a', back()) : [];
      const movable = new Set(ms.map(m => m.from)), dsts = new Set(sel != null ? ms.filter(m => m.from === sel).map(m => m.path[m.path.length - 1]) : []);
      sqs.forEach((e, i) => {
        e.replaceChildren(); const x = B[i];
        if (x) e.append(h('div', { class: 'dm-p ' + side(x) + (isK(x) ? ' k' : '') }));
        e.classList.toggle('sel', sel === i); e.classList.toggle('movable', movable.has(i) && sel == null);
        e.classList.toggle('dst', dsts.has(i)); e.classList.toggle('can', movable.has(i) || dsts.has(i)); e.classList.toggle('last', last.includes(i));
      });
    }
    function click(i) {
      if (busy || over || turn !== 'a') return;
      const ms = moves(B, 'a', back());
      if (side(B[i]) === 'a' && ms.some(m => m.from === i)) { sel = sel === i ? null : i; SFX('select'); return paint(); }
      if (sel == null) { if (ms.length && ms[0].caps.length) H.toast && H.toast('Tenés que comer: es obligatorio (y con la que más come)'); return; }
      const m = ms.find(x => x.from === sel && x.path[x.path.length - 1] === i); if (!m) return;
      play(m);
    }
    async function play(m) {
      if (!m || over) return;
      busy = true; sel = null;
      const orig = B.slice(); let cur = m.from; const x = B[m.from];
      for (const [k, step] of m.path.entries()) { B[cur] = null; B[step] = x; if (m.caps[k] != null) B[m.caps[k]] = null; last = [cur, step]; cur = step; paint(); SFX(m.caps.length ? 'hit' : 'place'); await wait(200); }
      B = apply(orig, m); // coronación y capturas
      last = [m.from, m.path[m.path.length - 1]];
      turn = turn === 'a' ? 'b' : 'a'; busy = false; paint();
      if (end()) return;
      if (turn === 'b') { busy = true; paint(); setTimeout(cpu, 350); }
    }
    function end() {
      const ms = moves(B, turn, back()); if (ms.length) return false;
      over = true; const won = turn === 'b'; const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s); paint();
      if (won) confetti(root);
      setTimeout(() => overlay(root, won ? '¡Ganaste!' : 'Ganó la compu', won ? 'La compu se quedó sin jugadas.' : 'Te quedaste sin jugadas.', [btn('Otra partida', () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); }, 'primary')]), 400);
      return true;
    }
    function cpu() {
      const ms = moves(B, 'b', back()); const d = { facil: 1, normal: 3, dificil: 5 }[lvl()] || 3;
      let best = null, bv = -Infinity;
      for (const m of ms) { const v = search(apply(B, m), d - 1, 'a', -Infinity, Infinity, back()) + Math.random() * (lvl() === 'facil' ? 60 : 4); if (v > bv) { bv = v; best = m; } }
      busy = false; play(best);
    }
    const fit = () => { const w = root.clientWidth - 40, hh = root.clientHeight - 40; if (w <= 0) return; board.style.setProperty('--bs', Math.max(280, Math.min(w, hh)) + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const set = (k, v) => { const s = H.get(); s[k] = v; H.set(s); const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); };
    const tools = [pick('Dificultad', [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']], lvl(), (v) => set('lvl', v)),
      pick('Reglas', [['clasicas', 'Las fichas comen para adelante'], ['inter', 'Las fichas comen para atrás también']], H.get().reglas || 'clasicas', (v) => set('reglas', v)),
      btn('Nueva partida', () => set('x', 0))];
    root.__dm = { B: () => B, moves: () => moves(B, turn, back()), play, turn: () => turn, busy: () => busy };
    requestAnimationFrame(() => { fit(); newGame(); });
    return { el: root, tools, setSkin: () => {}, help: 'Movés en diagonal hacia adelante. Comer es obligatorio, y si hay varias formas hay que elegir la que más fichas come. La ficha que llega al fondo se corona dama (♛) y se mueve las casillas que quiera en diagonal. Gana el que deja al otro sin jugadas.' };
  }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  BM.register({ id: 'damas', n: 'Damas', d: 'El clásico de fichas contra la compu, con coronación y damas que vuelan.', c: '#6b4226', create: damas, skinLabel: 'Tablero',
    skins: [['madera', 'Madera', '#b58863'], ['verde', 'Verde', '#769656'], ['azul', 'Azul', '#5b7a99']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#6b4226"/><rect x="8" y="8" width="48" height="48" fill="#f0d9b5"/><path d="M8 8h12v12H8zM32 8h12v12H32zM20 20h12v12H20zM44 20h12v12H44zM8 32h12v12H8zM32 32h12v12H32zM20 44h12v12H20zM44 44h12v12H44z" fill="#b58863"/><circle cx="26" cy="26" r="5" fill="#2b2b2b"/><circle cx="38" cy="38" r="5" fill="#f7f2e8" stroke="#a99f8c"/><circle cx="14" cy="50" r="5" fill="#f7f2e8" stroke="#a99f8c"/></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}` : 'Nunca jugaste' });
})();
