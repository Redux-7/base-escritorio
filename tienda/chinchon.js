// Tienda de Base · Chinchón (naipes españoles, contra 1 a 3 compus)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, shuffle, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  // ---------- Naipes españoles (dibujos propios) ----------
  const PALOS = { o: 'Oros', c: 'Copas', e: 'Espadas', b: 'Bastos' };
  const PALO1 = { o: 'oro', c: 'copa', e: 'espada', b: 'basto' };
  const FIG = { 10: 'Sota', 11: 'Caballo', 12: 'Rey' };
  const cardName = (k) => k.j ? 'Comodín' : `${k.n === 1 ? 'As' : (FIG[k.n] || k.n)} de ${PALOS[k.s].toLowerCase()}`;
  const SYM = {
    o: '<circle r="9" fill="#e2b13c" stroke="#8f650f" stroke-width="1.2"/><circle r="5.6" fill="none" stroke="#8f650f" stroke-width="1"/><path d="M0-3.4L1 -1 3.4 0 1 1 0 3.4-1 1-3.4 0-1-1z" fill="#8f650f"/>',
    c: '<path d="M-7.5-9H7.5C7.5-1.5 4.5 2 1.6 3.2V6.2H5.2V9H-5.2V6.2H-1.6V3.2C-4.5 2-7.5-1.5-7.5-9Z" fill="#c8372d" stroke="#6e1a14" stroke-width="1.1" stroke-linejoin="round"/><path d="M-7.3-7.2H7.3" stroke="#f0c050" stroke-width="2"/>',
    e: '<path d="M0-11L2.3 4H-2.3Z" fill="#4c80d0" stroke="#1d3c70" stroke-width="1" stroke-linejoin="round"/><rect x="-5.6" y="3.6" width="11.2" height="2.2" rx="1" fill="#d9a640" stroke="#7a5a10" stroke-width=".6"/><rect x="-1.1" y="5.8" width="2.2" height="3.6" fill="#7a4a26"/><circle cy="10.2" r="1.5" fill="#d9a640"/>',
    b: '<path d="M-2.2 10C-3.4 4-4.4-2.5-3.6-7.8-3-10.6 3-10.6 3.6-7.8 4.4-2.5 3.4 4 2.2 10Z" fill="#5d9a3f" stroke="#2b5220" stroke-width="1.1" stroke-linejoin="round"/><circle cx="-2.6" cy="-3" r="1.3" fill="#2b5220"/><circle cx="2.4" cy="1.5" r="1.2" fill="#2b5220"/><circle cx="-1.6" cy="5.5" r="1" fill="#2b5220"/>'
  };
  const PCOL = { o: '#b8860b', c: '#b02a20', e: '#2a5aa8', b: '#3d7a2a' };
  const PIPS = {
    1: [[30, 46, 2.1]], 2: [[30, 25], [30, 67]], 3: [[30, 22], [30, 46], [30, 70]],
    4: [[19, 25], [41, 25], [19, 67], [41, 67]], 5: [[19, 24], [41, 24], [30, 46], [19, 68], [41, 68]],
    6: [[19, 22], [41, 22], [19, 46], [41, 46], [19, 70], [41, 70]], 7: [[19, 22], [41, 22], [30, 34], [19, 46], [41, 46], [19, 70], [41, 70]],
    8: [[19, 22], [41, 22], [30, 34], [19, 46], [41, 46], [30, 58], [19, 70], [41, 70]],
    9: [[18, 24], [30, 24], [42, 24], [18, 46], [30, 46], [42, 46], [18, 68], [30, 68], [42, 68]]
  };
  // marco con cortes: oros sin cortes, copas uno, espadas dos, bastos tres (como en los mazos de siempre)
  function frame(s) {
    const cuts = { o: 0, c: 1, e: 2, b: 3 }[s], col = PCOL[s];
    let d = '';
    for (const y of [9, 83]) {
      const xs = [7]; for (let i = 1; i <= cuts; i++) { const cx = 7 + (46 * i) / (cuts + 1); xs.push(cx - 2.5, cx + 2.5); } xs.push(53);
      for (let i = 0; i < xs.length; i += 2) d += `M${xs[i]} ${y}H${xs[i + 1]}`;
    }
    d += 'M7 9V83M53 9V83';
    return `<path d="${d}" stroke="${col}" stroke-width="1.4" fill="none"/>`;
  }
  function figure(s, n) {
    const col = PCOL[s], skin = '#f1c9a0';
    const robe = n === 12 ? `<path d="M17 76L21 46Q30 40 39 46L43 76Z" fill="${col}"/><path d="M21 52H39" stroke="#f0c050" stroke-width="2"/>`
      : n === 11 ? `<path d="M14 76C14 64 18 56 26 54L36 53C42 53 46 58 46 64V76Z" fill="#8a5a33"/><path d="M38 54C44 46 48 44 50 38L45 36C42 40 38 44 34 48Z" fill="#8a5a33"/><circle cx="47" cy="38" r=".9" fill="#222"/><path d="M22 56L26 44H34L36 56Z" fill="${col}"/>`
        : `<path d="M20 76L23 48Q30 43 37 48L40 76Z" fill="${col}"/><path d="M23 60H37" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`;
    const headY = n === 11 ? 38 : 38;
    const hat = n === 12 ? `<path d="M24 31L25.5 24 28 28 30 23 32 28 34.5 24 36 31Z" fill="#f0c050" stroke="#8f650f" stroke-width=".7"/>`
      : n === 11 ? `<path d="M24 32Q30 25 36 32Z" fill="#333"/>` : `<path d="M24 33Q30 26 37 31L38 33Z" fill="${col}"/><circle cx="37.5" cy="31.5" r="1.4" fill="#f0c050"/>`;
    return `${robe}<circle cx="30" cy="${headY}" r="6.2" fill="${skin}" stroke="#7a4f2a" stroke-width=".7"/>${hat}<g transform="translate(${n === 11 ? 18 : 42} ${n === 11 ? 64 : 58}) scale(.75)">${SYM[s]}</g>`;
  }
  const CARD_SVG = new Map();
  function cardSvg(k) {
    const key = k.j ? 'J' : k.s + k.n; if (CARD_SVG.has(key)) return CARD_SVG.get(key);
    let inner = '';
    if (k.j) inner = `<rect x="7" y="9" width="46" height="74" rx="3" fill="none" stroke="#7b3fb0" stroke-width="1.4"/><path d="M30 26L35 38 48 39 38 47 41 60 30 53 19 60 22 47 12 39 25 38Z" fill="#f0c050" stroke="#7b3fb0" stroke-width="1.2"/><text x="30" y="74" font-size="7.5" font-weight="800" text-anchor="middle" fill="#7b3fb0" font-family="Georgia,serif">COMODÍN</text>`;
    else {
      inner = frame(k.s);
      if (k.n >= 10) inner += figure(k.s, k.n);
      else for (const [x, y, sc] of PIPS[k.n]) inner += `<g transform="translate(${x} ${y}) scale(${sc || (k.n > 6 ? .82 : .95)})">${SYM[k.s]}</g>`;
      const lab = String(k.n);
      inner += `<text x="4.2" y="17" font-size="10" font-weight="800" fill="${PCOL[k.s]}" font-family="Georgia,serif">${lab}</text><text x="55.8" y="81" font-size="10" font-weight="800" text-anchor="end" fill="${PCOL[k.s]}" font-family="Georgia,serif">${lab}</text>`;
    }
    const s = `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#fbf6ea" stroke="#3a3328" stroke-width="1.1"/>${inner}</svg>`;
    CARD_SVG.set(key, s); return s;
  }
  const BACK_SVG = `<svg viewBox="0 0 60 92" aria-hidden="true"><defs><pattern id="ce-bp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--ce-back,#9b2b2b)"/><path d="M0 4H8M4 0V8" stroke="rgba(255,255,255,.28)" stroke-width="1"/></pattern></defs><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#fbf6ea" stroke="#3a3328" stroke-width="1.1"/><rect x="4" y="4" width="52" height="84" rx="3" fill="url(#ce-bp)"/><circle cx="30" cy="46" r="10" fill="#fbf6ea" opacity=".9"/><circle cx="30" cy="46" r="6" fill="none" stroke="var(--ce-back,#9b2b2b)" stroke-width="2"/></svg>`;
  function cardEl(k, opt = {}) {
    const e = h('div', { class: 'ce-card' + (opt.back ? ' back' : '') + (opt.cls ? ' ' + opt.cls : ''), title: opt.back ? '' : cardName(k), role: opt.click ? 'button' : null, tabindex: opt.click ? '0' : null });
    e.innerHTML = opt.back ? BACK_SVG : cardSvg(k);
    if (opt.click) { e.onclick = opt.click; e.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opt.click(ev); } }; }
    e.__k = k; return e;
  }
  function mazo(conOchoNueve, comodines) {
    const d = []; for (const s of 'oceb') for (let n = 1; n <= 12; n++) { if (!conOchoNueve && (n === 8 || n === 9)) continue; d.push({ s, n }); }
    for (let i = 0; i < (comodines || 0); i++) d.push({ j: true, s: 'x', n: 0, id: 'J' + i });
    return shuffle(d);
  }
  const sameCard = (a, b) => a && b && a.s === b.s && a.n === b.n && !!a.j === !!b.j && (!a.j || a.id === b.id);
  const CE_CSS = `
.ce-table{position:relative;width:100%;height:100%;box-sizing:border-box;overflow:hidden;border-radius:14px;background:var(--ce-felt);color:#fff;font-family:inherit;--cw:clamp(52px,7.2vmin,96px)}
.ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#2f7d4a,#1b5232 70%,#123a23)}
[data-skin="madera"].ce-table,[data-skin="madera"] .ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#8a5a33,#5e3b1f 70%,#3e2614);--ce-back:#1f4e8a}
[data-skin="azul"].ce-table,[data-skin="azul"] .ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#2b5f9e,#1b3f6e 70%,#122a4a);--ce-back:#a3322b}
.ce-card{width:var(--cw);aspect-ratio:60/92;flex:none;border-radius:calc(var(--cw)*.09);box-shadow:0 3px 8px -2px rgba(0,0,0,.55);background:#fbf6ea;transition:transform .16s ease,box-shadow .16s,opacity .2s;position:relative;user-select:none}
.ce-card svg{width:100%;height:100%;display:block;stroke:none;fill:#000;stroke-width:1}
.ce-card svg text{stroke:none!important}
.ce-card[role=button]{cursor:pointer}
.ce-card[role=button]:hover{transform:translateY(-6px);box-shadow:0 10px 18px -6px rgba(0,0,0,.6)}
.ce-card.sel{transform:translateY(-14px);box-shadow:0 0 0 3px #ffd34d,0 12px 20px -6px rgba(0,0,0,.6)}
.ce-card.dim{opacity:.45}
.ce-card.glow{box-shadow:0 0 0 3px #7fe08a,0 8px 18px -6px rgba(0,0,0,.6)}
.ce-card.in{animation:ce-in .28s ease both}
@keyframes ce-in{from{transform:translateY(-30px) scale(.9);opacity:0}}
.ce-row{display:flex;gap:calc(var(--cw)*.12);justify-content:center;align-items:flex-end;flex-wrap:nowrap}
.ce-fan .ce-card+.ce-card{margin-left:calc(var(--cw)*-.55)}
.ce-tag{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.28);font-size:13px;font-weight:650;color:#fff;white-space:nowrap}
.ce-tag.turn{background:#ffd34d;color:#2b2210}
.ce-msg{position:absolute;left:50%;transform:translateX(-50%);padding:8px 16px;border-radius:12px;background:rgba(10,20,14,.82);color:#fff;font-weight:700;font-size:15px;box-shadow:0 8px 24px -8px rgba(0,0,0,.6);pointer-events:none;animation:ce-pop .25s ease;white-space:nowrap;z-index:6}
@keyframes ce-pop{from{transform:translateX(-50%) scale(.8);opacity:0}}
.ce-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.ce-b{border:0;border-radius:10px;padding:8px 14px;font:inherit;font-weight:700;font-size:14px;background:#fbf6ea;color:#2b2210;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.35)}
.ce-b:hover{filter:brightness(1.06)}
.ce-b.hot{background:#ffd34d}
.ce-b.red{background:#e5484d;color:#fff}
.ce-b:disabled{opacity:.4;cursor:default}
.ce-pile{position:relative;width:var(--cw);aspect-ratio:60/92}
.ce-pile .ce-card{position:absolute;inset:0}
.ce-slot{width:var(--cw);aspect-ratio:60/92;border-radius:calc(var(--cw)*.09);border:2px dashed rgba(255,255,255,.35)}
.ce-score{font-size:13px;line-height:1.4;background:rgba(0,0,0,.25);padding:8px 12px;border-radius:12px}
`;
  function ceStyle(id, css) { const st = document.getElementById(id) || document.head.appendChild(h('style', { id })); const all = CE_CSS + css; if (st.textContent !== all) st.textContent = all; }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  function ceMsg(root, text, ms = 1300, top = '42%') { const m = h('div', { class: 'ce-msg', text, style: `top:${top}` }); root.append(m); setTimeout(() => m.remove(), ms); return m; }
  const CE_SKINS = [['pano', 'Paño verde', '#2f7d4a'], ['madera', 'Madera', '#8a5a33'], ['azul', 'Paño azul', '#2b5f9e']];

  const CSS = `
.ch-wrap{display:grid;grid-template-rows:auto 1fr auto auto auto;gap:8px;padding:12px 14px;height:100%;box-sizing:border-box}
.ch-opps{display:flex;justify-content:space-around;gap:10px;flex-wrap:wrap}
.ch-opp{display:grid;justify-items:center;gap:6px}
.ch-opp .ce-card{--cw:calc(var(--cw0)*.55)}
.ch-opp .ce-fan .ce-card+.ce-card{margin-left:calc(var(--cw0)*-.42)}
.ch-opp.out{opacity:.4}
.ch-mid{display:flex;align-items:center;justify-content:center;gap:26px}
.ch-pile{display:grid;justify-items:center;gap:6px;font-size:12px;font-weight:700}
.ch-pile .ce-pile.can{cursor:pointer;filter:drop-shadow(0 0 8px #ffd34d)}
.ch-info{text-align:center;font-size:13.5px;font-weight:700;min-height:20px}
.ch-info b{color:#ffd34d}
.ch-hand{display:flex;justify-content:center;gap:calc(var(--cw)*.08);flex-wrap:nowrap}
.ch-grp{display:flex;gap:calc(var(--cw)*.06);padding:5px;border-radius:12px}
.ch-grp.meld{background:rgba(255,211,77,.18);box-shadow:inset 0 0 0 2px rgba(255,211,77,.55)}
.ch-show{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ch-show .ch-grp .ce-card{--cw:calc(var(--cw0)*.5)}
`;
  const NUMS40 = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12], NUMS48 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  function chinchon(H) {
    ceStyle('st-ch', CSS);
    const root = h('div', { class: 'ce-table' });
    const wrap = h('div', { class: 'ch-wrap' }); root.append(wrap);
    const cfg = () => { const s = H.get(); return { rivals: +(s.rivals || 1), mazo: s.mazo || '50' }; };
    let G = null, sel = null, busy = false;
    const NUMS = () => G.mazo === '40' ? NUMS40 : NUMS48;
    const pv = (k) => k.j ? 25 : k.n; // puntos de una carta suelta
    // ¿estas cartas forman un juego? (3 o 4 del mismo número, o escalera del mismo palo; el comodín reemplaza a cualquiera)
    function valid(cards) {
      if (cards.length < 3) return false;
      const R = cards.filter(k => !k.j), J = cards.length - R.length; if (!R.length) return false;
      if (R.every(k => k.n === R[0].n)) { const su = new Set(R.map(k => k.s)); return su.size === R.length && cards.length <= 4; }
      if (!R.every(k => k.s === R[0].s)) return false;
      const N = NUMS(), idx = R.map(k => N.indexOf(k.n)).sort((a, b) => a - b);
      for (let i = 1; i < idx.length; i++) if (idx[i] === idx[i - 1]) return false;
      const gaps = idx[idx.length - 1] - idx[0] + 1 - idx.length;
      return gaps <= J && cards.length <= N.length;
    }
    // mejor forma de acomodar la mano: la que deja menos puntos sueltos
    function arrange(hand) {
      const n = hand.length, cand = [];
      for (let m = 1; m < (1 << n); m++) { let c = 0; for (let x = m; x; x &= x - 1) c++; if (c < 3) continue; const cs = []; for (let i = 0; i < n; i++) if (m & (1 << i)) cs.push(hand[i]); if (valid(cs)) cand.push(m); }
      const memo = new Map();
      const best = (mask) => {
        if (!mask) return { cost: 0, melds: [] };
        if (memo.has(mask)) return memo.get(mask);
        let i = 0; while (!(mask & (1 << i))) i++;
        const r0 = best(mask & ~(1 << i)); let res = { cost: r0.cost + pv(hand[i]), melds: r0.melds };
        for (const m of cand) if ((m & (1 << i)) && (m & mask) === m) { const r = best(mask & ~m); if (r.cost < res.cost) res = { cost: r.cost, melds: [m, ...r.melds] }; }
        memo.set(mask, res); return res;
      };
      const r = best((1 << n) - 1);
      const used = r.melds.reduce((a, m) => a | m, 0);
      const melds = r.melds.map(m => sortMeld(hand.filter((_, i) => m & (1 << i))));
      const loose = hand.filter((_, i) => !(used & (1 << i))).sort((a, b) => pv(a) - pv(b));
      return { cost: r.cost, melds, loose };
    }
    function sortMeld(cs) {
      const R = cs.filter(k => !k.j), J = cs.filter(k => k.j);
      if (R.every(k => k.n === R[0].n)) return [...R, ...J];
      const N = NUMS(); R.sort((a, b) => N.indexOf(a.n) - N.indexOf(b.n));
      const out = []; let ji = 0;
      for (let i = 0; i < R.length; i++) { if (i) { let g = N.indexOf(R[i].n) - N.indexOf(R[i - 1].n) - 1; while (g-- > 0) out.push(J[ji++]); } out.push(R[i]); }
      while (ji < J.length) out.push(J[ji++]);
      return out;
    }
    const isChinchon = (cs) => cs.length === 7 && !cs.some(k => k.j) && cs.every(k => k.s === cs[0].s) && valid(cs);
    // ---------- partida ----------
    function newMatch() {
      const c = cfg();
      const names = ['Vos', 'Compu 1', 'Compu 2', 'Compu 3'].slice(0, c.rivals + 1);
      G = { mazo: c.mazo, players: names.map((n, i) => ({ n, cpu: i > 0, pts: 0, out: false, hand: [] })), dealer: Math.floor(Math.random() * names.length), round: 0 };
      newRound();
    }
    function newRound() {
      G.round++;
      G.deck = mazo(G.mazo !== '40', G.mazo === '50' ? 2 : 0);
      G.pozo = []; G.phase = 'draw'; sel = null;
      const act = G.players.filter(p => !p.out);
      for (const p of act) p.hand = [];
      for (let i = 0; i < 7; i++) for (const p of act) p.hand.push(G.deck.pop());
      G.pozo.push(G.deck.pop());
      G.turn = nextActive(G.dealer);
      SFX('deal'); render();
      if (G.players[G.turn].cpu) setTimeout(cpuTurn, 900);
    }
    function nextActive(i) { const n = G.players.length; for (let k = 1; k <= n; k++) { const j = (i + k) % n; if (!G.players[j].out) return j; } return i; }
    const me = () => G.players[0];
    function drawFrom(src) {
      const p = G.players[G.turn];
      if (src === 'pozo') p.hand.push(G.pozo.pop());
      else { if (!G.deck.length) { const top = G.pozo.pop(); G.deck = shuffle(G.pozo); G.pozo = [top]; ceMsg(root, 'Se mezcló el pozo', 900); } p.hand.push(G.deck.pop()); }
      G.phase = 'discard'; SFX('flip');
    }
    function status() { H.status(G.players.map(p => `${p.n} ${p.out ? 'afuera' : p.pts}`).concat([`Mano ${G.round}`])); }
    function render() {
      status();
      const opps = h('div', { class: 'ch-opps' }, G.players.slice(1).map((p, i) => h('div', { class: 'ch-opp' + (p.out ? ' out' : '') },
        h('span', { class: 'ce-tag' + (G.turn === i + 1 ? ' turn' : ''), text: `${p.n} · ${p.out ? 'afuera' : p.pts + ' pts'}` }),
        h('div', { class: 'ce-row ce-fan' }, p.hand.map(k => cardEl(k, { back: true }))))));
      const myTurn = G.turn === 0 && !busy && !me().out;
      const canDraw = myTurn && G.phase === 'draw';
      const deckP = h('div', { class: 'ce-pile' + (canDraw ? ' can' : '') }, cardEl({}, { back: true })); if (canDraw) deckP.onclick = () => { drawFrom('mazo'); render(); };
      const top = G.pozo[G.pozo.length - 1];
      const pozoP = h('div', { class: 'ce-pile' + (canDraw && top ? ' can' : '') }, top ? cardEl(top) : h('div', { class: 'ce-slot' })); if (canDraw && top) pozoP.onclick = () => { drawFrom('pozo'); render(); };
      const mid = h('div', { class: 'ch-mid' }, h('div', { class: 'ch-pile' }, deckP, h('span', { text: `Mazo (${G.deck.length})` })), h('div', { class: 'ch-pile' }, pozoP, h('span', { text: 'Pozo' })));
      const ar = arrange(me().hand);
      let info;
      if (me().out) info = 'Quedaste afuera: mirá cómo sigue la partida';
      else if (G.turn !== 0) info = `Juega ${G.players[G.turn].n}…`;
      else if (G.phase === 'draw') info = 'Tu turno: robá del mazo o del pozo';
      else {
        const cut = sel ? arrange(me().hand.filter(k => k !== sel)) : null;
        info = h('span', {}, sel ? (cut.cost <= 5 ? h('span', {}, 'Con esa carta podés ', h('b', { text: cut.cost === 0 ? 'cortar a menos diez' : `cortar con ${cut.cost}` })) : `Tirando esa te quedan ${cut.cost} puntos sueltos`) : 'Elegí la carta para tirar al pozo');
      }
      // mano: primero los juegos armados, después las sueltas
      const groups = [...ar.melds.map(m => ({ m: true, cs: m })), { m: false, cs: ar.loose }].filter(g => g.cs.length);
      const hand = h('div', { class: 'ch-hand' }, groups.map(g => h('div', { class: 'ch-grp' + (g.m ? ' meld' : '') }, g.cs.map(k => cardEl(k, { cls: sel === k ? 'sel' : '', click: myTurn && G.phase === 'discard' ? () => { sel = sel === k ? null : k; SFX('select'); render(); } : null })))));
      const cutOk = sel && arrange(me().hand.filter(k => k !== sel)).cost <= 5;
      const acts = h('div', { class: 'ce-acts' },
        Object.assign(h('button', { class: 'ce-b', text: 'Tirar al pozo', disabled: !(myTurn && G.phase === 'discard' && sel) }), { onclick: () => discard(0, sel, false) }),
        Object.assign(h('button', { class: 'ce-b hot', text: 'Cortar', disabled: !(myTurn && G.phase === 'discard' && cutOk) }), { onclick: () => discard(0, sel, true) }));
      const tag = h('div', { class: 'ce-acts' }, h('span', { class: 'ce-tag' + (G.turn === 0 ? ' turn' : ''), text: `Vos · ${me().pts} pts · sueltas ${ar.cost}` }));
      wrap.replaceChildren(opps, mid, h('div', { class: 'ch-info' }, info), hand, h('div', { class: 'ce-acts' }, tag, acts));
    }
    async function discard(pi, card, cut) {
      const p = G.players[pi];
      p.hand = p.hand.filter(k => k !== card); G.pozo.push(card); sel = null; SFX('place');
      if (cut) return endRound(pi);
      G.phase = 'draw'; G.turn = nextActive(pi); render();
      if (G.players[G.turn].cpu) setTimeout(cpuTurn, 750);
    }
    // ---------- la compu ----------
    function bestDiscard(hand) {
      let best = null;
      for (const k of hand) { if (k.j) continue; const a = arrange(hand.filter(x => x !== k)); const sc = a.cost * 10 - pv(k); if (!best || sc < best.sc) best = { k, a, sc }; }
      if (!best) { const k = hand[0]; best = { k, a: arrange(hand.slice(1)) }; }
      return best;
    }
    async function cpuTurn() {
      if (!G || !G.players[G.turn].cpu) return;
      busy = true; const pi = G.turn, p = G.players[pi];
      render(); await wait(500);
      const now = arrange(p.hand).cost, top = G.pozo[G.pozo.length - 1];
      let take = false;
      if (top) { const t = bestDiscard([...p.hand, top]); take = t.k !== top && t.a.cost < now - 1; if (top.j) take = true; }
      drawFrom(take ? 'pozo' : 'mazo');
      if (take) ceMsg(root, `${p.n} levantó del pozo`, 900, '30%');
      render(); await wait(650);
      const d = bestDiscard(p.hand);
      const after = d.a;
      const rest = p.hand.filter(k => k !== d.k);
      const cut = after.cost <= 5 && (after.cost <= 2 || G.deck.length < 14 || Math.random() < .75 || isChinchon(rest));
      busy = false;
      if (cut) ceMsg(root, `${p.n} corta`, 1100, '30%');
      discard(pi, d.k, cut);
    }
    // ---------- fin de mano ----------
    function endRound(cutter) {
      busy = true;
      const C = G.players[cutter], cArr = arrange(C.hand);
      const chin = isChinchon(C.hand);
      const res = [];
      const cutMelds = cArr.melds.map(m => m.slice());
      for (const [i, p] of G.players.entries()) {
        if (p.out) continue;
        if (i === cutter) { const add = cArr.cost === 0 ? -10 : cArr.cost; p.pts += add; res.push([p, add, cArr.melds, cArr.loose, cArr.cost === 0 ? 'menos diez' : 'cortó']); continue; }
        const a = arrange(p.hand); let loose = a.loose.slice();
        // las sueltas se pueden acomodar en los juegos del que cortó
        let moved = true;
        while (moved) { moved = false; for (const k of loose) for (const m of cutMelds) if (valid([...m, k])) { m.push(k); loose = loose.filter(x => x !== k); moved = true; break; } }
        const add = loose.reduce((s, k) => s + pv(k), 0); p.pts += add; res.push([p, add, a.melds, loose, '']);
      }
      if (chin) { for (const p of G.players) if (p !== C && !p.out) p.out = true; }
      for (const p of G.players) if (!p.out && p.pts > 100) p.out = true;
      status();
      const show = h('div', { class: 'ch-show' }, res.map(([p, add, melds, loose, why]) => h('div', { style: 'display:grid;gap:4px;justify-items:center' },
        h('span', { class: 'ce-tag', text: `${p.n}: ${add >= 0 ? '+' : ''}${add}${why ? ' (' + why + ')' : ''} → ${p.pts}${p.out && !chin ? ' · afuera' : ''}` }),
        h('div', { style: 'display:flex;gap:6px' }, [...melds.map(m => h('div', { class: 'ch-grp meld' }, m.map(k => cardEl(k)))), loose.length ? h('div', { class: 'ch-grp' }, loose.map(k => cardEl(k))) : null]))));
      const alive = G.players.filter(p => !p.out);
      const meOut = me().out && !(chin && cutter === 0);
      let title, acts;
      if (chin) title = cutter === 0 ? '¡CHINCHÓN! Ganaste la partida' : `${C.n} hizo chinchón y ganó`;
      else title = cutter === 0 ? (cArr.cost === 0 ? '¡Cortaste a menos diez!' : 'Cortaste') : `${C.n} cortó`;
      const over = chin || meOut || alive.length <= 1;
      if (over) {
        const won = chin ? cutter === 0 : (!me().out && alive.length === 1);
        const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; if (chin && cutter === 0) s.chin = (s.chin || 0) + 1; H.set(s);
        if (won) confetti(root);
        if (!chin) title = won ? '¡Ganaste la partida!' : (meOut ? 'Pasaste los 100: quedaste afuera' : 'Ganó la compu');
        acts = [btn('Otra partida', () => { closeOver(); newMatch(); }, 'primary')];
      } else acts = [btn('Siguiente mano', () => { closeOver(); busy = false; G.dealer = nextActive(G.dealer); newRound(); }, 'primary')];
      const o = overlay(root, title, '', acts);
      const card = o.querySelector('.mg-over-card'); card.insertBefore(show, card.querySelector('.mg-over-acts')); card.style.maxWidth = 'min(96%, 980px)';
      root.style.setProperty('--cw0', getComputedStyle(root).getPropertyValue('--cw'));
    }
    const closeOver = () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
    const fit = () => { const w = root.clientWidth, hh = root.clientHeight; if (!w) return; const cw = Math.max(44, Math.min(100, Math.min(w / 11.5, hh / 6.2))); root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--cw0', cw + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const set = (k, v) => { const s = H.get(); s[k] = v; H.set(s); closeOver(); busy = false; newMatch(); };
    const tools = [
      pick('Rivales', [['1', '1 rival'], ['2', '2 rivales'], ['3', '3 rivales']], String(cfg().rivals), (v) => set('rivals', +v)),
      pick('Mazo', [['50', '50 cartas (con comodines)'], ['48', '48 cartas'], ['40', '40 cartas']], cfg().mazo, (v) => set('mazo', v)),
      btn('Nueva partida', () => { closeOver(); busy = false; newMatch(); })];
    root.__ch = { G: () => G, arrange, valid, cpu: cpuTurn, busy: () => busy };
    requestAnimationFrame(() => { fit(); newMatch(); });
    return { el: root, tools, setSkin: () => {}, help: 'Chinchón: robá del mazo o del pozo y tirá una carta. Armá juegos de 3 o 4 del mismo número o escaleras del mismo palo (el comodín reemplaza a cualquiera). Podés cortar cuando te quedan 5 puntos sueltos o menos; con todo armado es "menos diez", y 7 en escalera del mismo palo es ¡chinchón! (ganás). El que pasa los 100 puntos queda afuera.' };
  }
  BM.register({ id: 'chinchon', n: 'Chinchón', d: 'Armá juegos y escaleras con naipes españoles y cortá antes que la compu (de 1 a 3 rivales).', c: '#b02a20', create: chinchon, skinLabel: 'Mesa', skins: CE_SKINS,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1b5232"/><g transform="rotate(-18 20 40)"><rect x="8" y="18" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="19" y="40" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">5</text></g><rect x="21" y="14" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="32" y="36" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">6</text><g transform="rotate(18 44 40)"><rect x="34" y="18" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="45" y="40" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">7</text></g></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}${s.chin ? ` · ${s.chin} chinchón` : ''}` : 'Nunca jugaste' });
})();
