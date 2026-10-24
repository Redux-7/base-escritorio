// Tienda de Base · Escoba de 15 (naipes españoles, contra la compu)
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
.es-wrap{display:grid;grid-template-rows:auto auto 1fr auto auto;gap:10px;padding:12px 14px;height:100%;box-sizing:border-box}
.es-top,.es-bot{display:flex;align-items:center;justify-content:space-between;gap:10px}
.es-mid{display:flex;align-items:center;justify-content:center;gap:18px;min-height:0}
.es-mesa{display:flex;flex-wrap:wrap;gap:calc(var(--cw)*.14);justify-content:center;align-content:center;max-width:min(860px,80%);min-height:calc(var(--cw)*1.6)}
.es-deck{display:grid;justify-items:center;gap:4px;font-size:12px;font-weight:700}
.es-sum{font-size:13px;font-weight:700;min-height:20px;text-align:center}
.es-sum b{color:#ffd34d}
.es-pile{display:grid;justify-items:center;gap:4px;font-size:12px;font-weight:700}
.es-pile .ce-card{--cw:calc(var(--cw0,70px)*.6)}
`;
  const VAL = (k) => k.n <= 7 ? k.n : k.n - 2; // sota 8, caballo 9, rey 10
  // todas las formas de sumar 15 con la carta jugada y cartas de la mesa
  function combos(card, mesa) {
    const out = [], need = 15 - VAL(card);
    const rec = (i, sum, pickd) => { if (sum === need && pickd.length) out.push(pickd.slice()); if (sum >= need || i >= mesa.length) return; for (let j = i; j < mesa.length; j++) { pickd.push(j); rec(j + 1, sum + VAL(mesa[j]), pickd); pickd.pop(); } };
    rec(0, 0, []); return out;
  }
  function escoba(H) {
    ceStyle('st-es', CSS);
    const root = h('div', { class: 'ce-table' });
    const wrap = h('div', { class: 'es-wrap' }); root.append(wrap);
    let G = null, sel = null, pickT = new Set(), busy = false;
    const target = () => +(H.get().meta || 15);
    function newMatch() { G = { score: [0, 0], mano: Math.random() < .5 ? 0 : 1, round: 0 }; newRound(); }
    function newRound() {
      Object.assign(G, { deck: mazo(false), hands: [[], []], mesa: [], cap: [[], []], esc: [0, 0], last: -1, turn: 0 });
      G.round++; G.turn = G.mano === 0 ? 1 : 0; // juega primero el que no reparte
      for (let i = 0; i < 3; i++) for (const p of [G.turn, 1 - G.turn]) G.hands[p].push(G.deck.pop());
      for (let i = 0; i < 4; i++) G.mesa.push(G.deck.pop());
      const s = G.mesa.reduce((a, k) => a + VAL(k), 0);
      render();
      if (s === 15 || s === 30) { // el que reparte se lleva la mesa
        const d = G.mano; G.cap[d].push(...G.mesa); G.esc[d] += s === 30 ? 2 : 1; G.mesa = []; G.last = d;
        ceMsg(root, d === 0 ? `¡Escoba al repartir!${s === 30 ? ' (doble)' : ''}` : `La compu hizo escoba al repartir${s === 30 ? ' (doble)' : ''}`, 1800); SFX('good');
      }
      sel = null; pickT.clear(); render(); if (G.turn === 1) setTimeout(cpuTurn, 900);
    }
    const sumSel = () => (sel ? VAL(sel) : 0) + [...pickT].reduce((a, i) => a + VAL(G.mesa[i]), 0);
    function status() { H.status([`Vos ${G.score[0]}`, `Compu ${G.score[1]}`, `A ${target()}`, `Mano ${G.round}`]); }
    function render() {
      status();
      const tag = (txt, on) => h('span', { class: 'ce-tag' + (on ? ' turn' : ''), text: txt });
      const pile = (p) => h('div', { class: 'es-pile' }, h('div', { class: 'ce-tag', text: `${G.cap[p].length} cartas · ${G.esc[p]} escoba${G.esc[p] === 1 ? '' : 's'}` }));
      const top = h('div', { class: 'es-top' }, tag('Compu', G.turn === 1), h('div', { class: 'ce-row ce-fan' }, G.hands[1].map(k => cardEl(k, { back: true }))), pile(1));
      const mesa = h('div', { class: 'es-mesa' }, G.mesa.length ? G.mesa.map((k, i) => cardEl(k, { cls: pickT.has(i) ? 'sel' : '', click: G.turn === 0 && sel && !busy ? () => { if (pickT.has(i)) pickT.delete(i); else pickT.add(i); render(); } : null })) : h('span', { class: 'ce-tag', text: 'Mesa vacía' }));
      const deck = h('div', { class: 'es-deck' }, G.deck.length ? h('div', { class: 'ce-pile' }, cardEl({}, { back: true })) : h('div', { class: 'ce-slot' }), h('span', { text: `${G.deck.length} en el mazo` }));
      const mid = h('div', { class: 'es-mid' }, deck, mesa);
      const s = sumSel();
      const opts = sel ? combos(sel, G.mesa) : [];
      const sum = h('div', { class: 'es-sum' }, G.turn !== 0 ? 'Juega la compu…' : !sel ? 'Elegí una carta de tu mano' :
        opts.length ? h('span', {}, 'Suman ', h('b', { text: String(s) }), ' de 15 · ', opts.length === 1 ? 'tocá Levantar' : `hay ${opts.length} formas de levantar: marcá las cartas de la mesa`) : 'Con esa carta no se levanta nada: tirala a la mesa');
      const hand = h('div', { class: 'ce-row' }, G.hands[0].map(k => cardEl(k, { cls: sel === k ? 'sel' : '', click: G.turn === 0 && !busy ? () => choose(k) : null })));
      const can = sel && s === 15 && pickT.size > 0;
      const acts = h('div', { class: 'ce-acts' },
        Object.assign(h('button', { class: 'ce-b hot', text: 'Levantar', disabled: !can }), { onclick: () => play(0, sel, [...pickT]) }),
        Object.assign(h('button', { class: 'ce-b', text: 'Tirar a la mesa', disabled: !sel || busy }), { onclick: () => play(0, sel, []) }));
      const bot = h('div', { class: 'es-bot' }, tag('Vos', G.turn === 0), hand, pile(0));
      wrap.replaceChildren(top, mid, sum, bot, acts);
    }
    function choose(k) {
      if (sel === k) { sel = null; pickT.clear(); render(); return; }
      sel = k; pickT.clear(); SFX('select');
      const o = combos(k, G.mesa); if (o.length === 1) o[0].forEach(i => pickT.add(i));
      render();
    }
    async function play(p, card, idx) {
      if (busy) return; busy = true;
      G.hands[p] = G.hands[p].filter(k => k !== card);
      if (idx.length) {
        const taken = idx.map(i => G.mesa[i]);
        G.mesa = G.mesa.filter((_, i) => !idx.includes(i));
        G.cap[p].push(card, ...taken); G.last = p;
        SFX('good');
        if (!G.mesa.length) { G.esc[p]++; ceMsg(root, p === 0 ? '¡Escoba!' : 'Escoba de la compu', 1500); SFX('coin'); }
        else ceMsg(root, `${p === 0 ? 'Levantaste' : 'La compu levantó'} ${taken.length + 1} cartas`, 1000);
      } else { G.mesa.push(card); SFX('place'); }
      sel = null; pickT.clear();
      G.turn = 1 - p; render();
      await wait(450);
      if (!G.hands[0].length && !G.hands[1].length) {
        if (G.deck.length) { for (let i = 0; i < 3; i++) for (const q of [G.turn, 1 - G.turn]) G.hands[q].push(G.deck.pop()); SFX('deal'); render(); }
        else { busy = false; return endRound(); }
      }
      busy = false; render();
      if (G.turn === 1) setTimeout(cpuTurn, 800);
    }
    // la compu: levanta lo que más conviene; si no puede, tira la carta que menos escobas deja servidas
    function cpuTurn() {
      if (!G || G.turn !== 1) return;
      let best = null;
      for (const k of G.hands[1]) for (const c of combos(k, G.mesa)) {
        const cards = [k, ...c.map(i => G.mesa[i])];
        let v = cards.length + cards.filter(x => x.s === 'o').length * 1.5 + cards.filter(x => x.n === 7).length * 2 + (cards.some(x => x.s === 'o' && x.n === 7) ? 6 : 0);
        if (c.length === G.mesa.length) v += 12;
        const rest = G.mesa.filter((_, i) => !c.includes(i)).reduce((a, x) => a + VAL(x), 0); if (rest >= 5 && rest <= 14) v -= 3; // deja escoba servida
        if (!best || v > best.v) best = { k, c, v };
      }
      if (best) return play(1, best.k, best.c);
      const S = G.mesa.reduce((a, x) => a + VAL(x), 0);
      let pickK = null, pv = -1e9;
      for (const k of G.hands[1]) {
        const ns = S + VAL(k); let v = 0;
        if (ns >= 5 && ns <= 14) v -= 8; // le dejo escoba al rival
        if (k.n === 7) v -= 6; if (k.s === 'o') v -= 3; if (k.s === 'o' && k.n === 7) v -= 20;
        v -= VAL(k) * .2 * (ns > 14 ? -1 : 1);
        if (v > pv) { pv = v; pickK = k; }
      }
      play(1, pickK, []);
    }
    function endRound() {
      if (G.mesa.length && G.last >= 0) { G.cap[G.last].push(...G.mesa); G.mesa = []; }
      const c = G.cap, pts = [[], []];
      const add = (p, n, why) => pts[p].push([why, n]);
      for (const p of [0, 1]) if (G.esc[p]) add(p, G.esc[p], `Escobas (${G.esc[p]})`);
      const cmp = (f, why, allWhy, total) => { const a = f(c[0]), b = f(c[1]); if (a > b) add(0, 1, why); else if (b > a) add(1, 1, why); if (total && a === total) add(0, 1, allWhy); if (total && b === total) add(1, 1, allWhy); };
      cmp(x => x.length, 'Más cartas');
      cmp(x => x.filter(k => k.s === 'o').length, 'Más oros', 'Todos los oros', 10);
      cmp(x => x.filter(k => k.n === 7).length, 'Más sietes', 'Los cuatro sietes', 4);
      for (const p of [0, 1]) if (c[p].some(k => k.s === 'o' && k.n === 7)) add(p, 1, 'Siete de oros (el siete bello)');
      const tot = pts.map(l => l.reduce((a, [, n]) => a + n, 0));
      G.score[0] += tot[0]; G.score[1] += tot[1]; status();
      const T = target(), over = G.score[0] >= T || G.score[1] >= T;
      const lines = (p) => pts[p].length ? pts[p].map(([w, n]) => `${w}: ${n}`).join(' · ') : 'nada';
      const sub = `Vos +${tot[0]} (${lines(0)})\nCompu +${tot[1]} (${lines(1)})\nVan ${G.score[0]} a ${G.score[1]}`;
      if (over && G.score[0] !== G.score[1]) {
        const won = G.score[0] > G.score[1]; const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s);
        if (won) confetti(root);
        overlay(root, won ? '¡Ganaste la partida!' : 'Ganó la compu', sub, [btn('Otra partida', () => { closeOver(); newMatch(); }, 'primary')]);
      } else overlay(root, `Fin de la mano ${G.round}`, sub, [btn('Seguir', () => { closeOver(); G.mano = 1 - G.mano; newRound(); }, 'primary')]);
      const sp = root.querySelector('.mg-over span'); if (sp) sp.style.whiteSpace = 'pre-line';
    }
    const closeOver = () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
    const fit = () => { const w = root.clientWidth, hh = root.clientHeight; if (!w) return; const cw = Math.max(46, Math.min(104, Math.min(w / 10.5, hh / 6.4))); root.style.setProperty('--cw', cw + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const tools = [pick('Partida a', [['15', 'A 15 puntos'], ['21', 'A 21 puntos'], ['31', 'A 31 puntos']], String(target()), (v) => { const s = H.get(); s.meta = +v; H.set(s); newMatch(); }), btn('Nueva partida', () => { closeOver(); newMatch(); })];
    root.__es = { G: () => G, cpu: cpuTurn, play: (i, idx) => play(0, G.hands[0][i], idx || []) };
    requestAnimationFrame(() => { fit(); newMatch(); });
    return { el: root, tools, setSkin: () => {}, help: 'Escoba de 15: tocá una carta de tu mano y después las de la mesa que, sumadas a la tuya, den 15 (sota 8, caballo 9, rey 10). Si levantás todo es escoba. Al final de cada mano suman: escobas, más cartas, más oros, siete de oros y más sietes.' };
  }
  BM.register({ id: 'escoba', n: 'Escoba de 15', d: 'El clásico de naipes españoles contra la compu: sumá 15 y hacé escobas.', c: '#2f7d4a', create: escoba, skinLabel: 'Mesa', skins: CE_SKINS,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#2f7d4a"/><g transform="rotate(-12 22 34)"><rect x="10" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><circle cx="22" cy="32" r="6" fill="#e2b13c" stroke="#8f650f"/></g><g transform="rotate(10 42 34)"><rect x="30" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="42" y="38" font-size="14" font-weight="800" text-anchor="middle" fill="#b02a20" font-family="Georgia,serif">15</text></g></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}` : 'Nunca jugaste' });
})();
