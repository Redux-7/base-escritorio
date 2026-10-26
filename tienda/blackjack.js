// Tienda de Base · Blackjack (21) contra la banca, con fichas de mentira
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, shuffle, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  // ---------- naipes franceses (dibujos propios) ----------
  const SUITS = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const RED = { h: 1, d: 1 };
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUIT_SVG = {
    s: '<path d="M0-10C3 -5 9-2 9 3 9 7 5 8.6 2 6.4L3.4 10H-3.4L-2 6.4C-5 8.6-9 7-9 3-9-2-3-5 0-10Z"/>',
    h: '<path d="M0 9C-4-1-10-3-10-7.6-10-11.4-5.2-12.4 0-7.6 5.2-12.4 10-11.4 10-7.6 10-3 4-1 0 9Z" transform="translate(0 1.4)"/>',
    d: '<path d="M0-10 7.4 0 0 10-7.4 0Z"/>',
    c: '<circle cy="-5" r="4.4"/><circle cx="-5" cy="1.6" r="4.4"/><circle cx="5" cy="1.6" r="4.4"/><path d="M-1.6 2H1.6L3.4 10H-3.4Z"/>'
  };
  const PIPS = {
    2: [[30, 22], [30, 70]], 3: [[30, 20], [30, 46], [30, 72]], 4: [[19, 22], [41, 22], [19, 70], [41, 70]],
    5: [[19, 22], [41, 22], [30, 46], [19, 70], [41, 70]], 6: [[19, 22], [41, 22], [19, 46], [41, 46], [19, 70], [41, 70]],
    7: [[19, 22], [41, 22], [30, 34], [19, 46], [41, 46], [19, 70], [41, 70]],
    8: [[19, 22], [41, 22], [30, 34], [19, 46], [41, 46], [30, 58], [19, 70], [41, 70]],
    9: [[19, 20], [41, 20], [19, 36], [41, 36], [30, 46], [19, 56], [41, 56], [19, 72], [41, 72]],
    10: [[19, 20], [41, 20], [30, 28], [19, 38], [41, 38], [19, 54], [41, 54], [30, 64], [19, 72], [41, 72]]
  };
  const FACE = { J: ['#2f62c9', 'J'], Q: ['#c2367a', 'Q'], K: ['#b8860b', 'K'] };
  const SVGC = new Map();
  function cardSvg(c) {
    const key = c.r + c.s; if (SVGC.has(key)) return SVGC.get(key);
    const col = RED[c.s] ? '#c8232c' : '#1d1f2b', sym = (x, y, sc, flip) => `<g transform="translate(${x} ${y}) scale(${sc})${flip ? ' rotate(180)' : ''}" fill="${col}">${SUIT_SVG[c.s]}</g>`;
    let mid = '';
    if (c.r === 'A') mid = sym(30, 46, 1.9);
    else if (FACE[c.r]) {
      const [fc, L] = FACE[c.r];
      mid = `<rect x="11" y="16" width="38" height="60" rx="5" fill="${fc}" opacity=".12" stroke="${fc}" stroke-width="1.2"/>` +
        `<path d="M18 30 22 22 26 28 30 20 34 28 38 22 42 30Z" fill="${c.r === 'K' ? '#e2b53e' : c.r === 'Q' ? '#e2b53e' : 'none'}" stroke="${fc}" stroke-width="1"/>` +
        `<text x="30" y="58" font-size="26" font-weight="900" text-anchor="middle" fill="${fc}" font-family="Georgia,'Times New Roman',serif">${L}</text>` + sym(30, 68, .55);
    } else for (const [x, y] of PIPS[c.r]) mid += sym(x, y, .72, y > 50);
    const idx = `<text x="7" y="13" font-size="10.5" font-weight="800" text-anchor="middle" fill="${col}" font-family="'Segoe UI',system-ui,sans-serif">${c.r}</text>` + sym(7, 20, .38);
    const s = `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="5.5" fill="#fff" stroke="#c9ccd4"/>${mid}${idx}<g transform="rotate(180 30 46)">${idx}</g></svg>`;
    SVGC.set(key, s); return s;
  }
  const BACK = `<svg viewBox="0 0 60 92" aria-hidden="true"><defs><pattern id="bj-bp" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#1d4f8a"/><path d="M0 4H8" stroke="#3f78c0" stroke-width="1.4"/></pattern></defs><rect x=".6" y=".6" width="58.8" height="90.8" rx="5.5" fill="#fff" stroke="#c9ccd4"/><rect x="4" y="4" width="52" height="84" rx="3.5" fill="url(#bj-bp)"/><circle cx="30" cy="46" r="10" fill="#1d4f8a" stroke="#fff" stroke-width="1.2"/><text x="30" y="50.5" font-size="11" font-weight="900" text-anchor="middle" fill="#fff" font-family="'Segoe UI',system-ui,sans-serif">21</text></svg>`;
  const val = (c) => c.r === 'A' ? 11 : (FACE[c.r] || c.r === '10') ? 10 : +c.r;
  function total(cs) { let t = 0, a = 0; for (const c of cs) { t += val(c); if (c.r === 'A') a++; } while (t > 21 && a) { t -= 10; a--; } return { t, soft: a > 0 }; }
  const isBJ = (cs) => cs.length === 2 && total(cs).t === 21;
  const CSS = `
.bj{position:relative;width:100%;height:100%;box-sizing:border-box;overflow:hidden;border-radius:14px;color:#fff;
  background:radial-gradient(120% 90% at 50% 30%,#2f7d4a,#1b5232 70%,#123a23);display:grid;grid-template-rows:minmax(0,1fr) auto auto;gap:10px;padding:14px;--cw:clamp(52px,8.4vmin,100px)}
.bj[data-skin="azul"]{background:radial-gradient(120% 90% at 50% 30%,#2b5f9e,#1b3f6e 70%,#122a4a)}
.bj[data-skin="rojo"]{background:radial-gradient(120% 90% at 50% 30%,#9e2b35,#6e1b24 70%,#4a1218)}
.bj-arc{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:min(70%,560px);text-align:center;font-weight:800;letter-spacing:.08em;font-size:12.5px;color:rgba(255,236,170,.55);pointer-events:none;line-height:1.7}
.bj-arc b{display:block;font-size:15px;letter-spacing:.12em}
.bj-seat{display:grid;justify-items:center;gap:6px;position:relative;z-index:1}
.bj-row{display:flex;justify-content:center;align-items:flex-end;min-height:calc(var(--cw)*1.53)}
.bj-c{width:var(--cw);aspect-ratio:60/92;flex:none;border-radius:calc(var(--cw)*.09);box-shadow:0 4px 10px -3px rgba(0,0,0,.55);animation:bj-in .3s ease both}
.bj-c+.bj-c{margin-left:calc(var(--cw)*-.42)}
.bj-c svg{width:100%;height:100%;display:block;stroke-width:1}
.bj-c svg text{stroke:none}
@keyframes bj-in{from{transform:translate(30px,-40px) rotate(8deg);opacity:0}}
.bj-tag{display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;background:rgba(0,0,0,.3);font-size:13.5px;font-weight:750}
.bj-tag .n{min-width:26px;text-align:center;padding:1px 8px;border-radius:99px;background:#fff;color:#1d1f2b;font-weight:900}
.bj-tag.bust .n{background:#e5484d;color:#fff}.bj-tag.bj21 .n{background:#ffd34d}
.bj-hands{display:flex;gap:28px;justify-content:center;flex-wrap:wrap}
.bj-hand{display:grid;justify-items:center;gap:6px;padding:6px 10px;border-radius:16px}
.bj-hand.on{background:rgba(255,211,77,.14);box-shadow:inset 0 0 0 2px rgba(255,211,77,.55)}
.bj-res{font-size:12.5px;font-weight:800;padding:2px 10px;border-radius:99px}
.bj-res.win{background:#7fe08a;color:#14301a}.bj-res.lose{background:#e5484d}.bj-res.push{background:#fbf6ea;color:#2b2210}
.bj-bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px}
.bj-bank{justify-self:start;display:grid;gap:2px;font-size:12.5px;font-weight:700;opacity:.95}
.bj-bank b{font-size:20px}
.bj-chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.bj-chip{width:48px;height:48px;border-radius:50%;border:0;font:inherit;font-weight:900;font-size:13px;color:#fff;cursor:pointer;
  background:radial-gradient(circle at 50% 50%,var(--c) 0 52%,#fff 53% 58%,var(--c) 59%);box-shadow:0 4px 0 rgba(0,0,0,.35),inset 0 0 0 3px rgba(255,255,255,.35)}
.bj-chip:hover{transform:translateY(-2px)}.bj-chip:disabled{opacity:.35;cursor:default;transform:none}
.bj-acts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.bj-b{border:0;border-radius:12px;padding:10px 16px;font:inherit;font-weight:800;font-size:14.5px;background:#fbf6ea;color:#2b2210;cursor:pointer;box-shadow:0 3px 0 rgba(0,0,0,.35)}
.bj-b.hot{background:#ffd34d}.bj-b:disabled{opacity:.4;cursor:default}
.bj-b small{display:block;font-size:10.5px;font-weight:700;opacity:.7}
.bj-bet{justify-self:end;display:grid;justify-items:end;gap:4px;font-size:12.5px;font-weight:700}
.bj-bet b{font-size:20px;color:#ffd34d}
.bj-tip{justify-self:center;font-size:13px;font-weight:700;padding:5px 14px;border-radius:99px;background:rgba(0,0,0,.28);min-height:18px}
.bj-tip b{color:#ffd34d}
`;
  function blackjack(H) {
    const st = document.getElementById('st-bj') || document.head.appendChild(h('style', { id: 'st-bj' })); if (st.textContent !== CSS) st.textContent = CSS;
    const root = h('div', { class: 'bj' });
    const S = () => { const s = H.get(); if (typeof s.bank !== 'number' || s.bank < 10) s.bank = 1000; return s; };
    let shoe = [], dealer = [], hands = [], cur = 0, phase = 'bet', bet = 0, lastBet = 50, hint = '', reveal = false;
    const decks = () => +(H.get().decks || 6);
    function newShoe() { shoe = []; for (let d = 0; d < decks(); d++) for (const s of 'shdc') for (const r of RANKS) shoe.push({ r, s }); shuffle(shoe); shoe.cut = Math.floor(shoe.length * .25); }
    const draw = () => { if (shoe.length <= (shoe.cut || 0)) { newShoe(); tip('Se mezcló el mazo'); } return shoe.pop(); };
    const tip = (t) => { hint = t; };
    const bank = () => S().bank;
    const setBank = (v) => { const s = S(); s.bank = Math.max(0, Math.round(v)); if (s.bank > (s.best || 0)) s.best = s.bank; H.set(s); status(); };
    const status = () => H.status([`Fichas ${bank()}`, `Récord ${S().best || 1000}`, `${decks()} mazos`]);
    function card(c, back) { const e = h('div', { class: 'bj-c', title: back ? '' : `${c.r} de ${{ s: 'picas', h: 'corazones', d: 'diamantes', c: 'tréboles' }[c.s]}` }); e.innerHTML = back ? BACK : cardSvg(c); return e; }
    // estrategia básica simplificada (para el botón "¿Qué hago?")
    function advice(hd) {
      const p = total(hd.cards), up = val(dealer[0]) === 11 ? 11 : val(dealer[0]);
      const pair = hd.cards.length === 2 && val(hd.cards[0]) === val(hd.cards[1]);
      if (pair && canSplit(hd)) { const v = val(hd.cards[0]); if (v === 11 || v === 8) return 'Dividir'; if ([2, 3, 6, 7].includes(v) && up <= 7 && up >= 2 && !(v === 6 && up === 7)) return 'Dividir'; if (v === 9 && ![7, 10, 11].includes(up)) return 'Dividir'; }
      if (p.soft && p.t <= 21) { if (p.t >= 19) return 'Plantarse'; if (p.t === 18) return up >= 9 ? 'Pedir' : (up >= 3 && up <= 6 && canDouble(hd) ? 'Doblar' : 'Plantarse'); if (up >= 4 && up <= 6 && canDouble(hd)) return 'Doblar'; return 'Pedir'; }
      if (p.t >= 17) return 'Plantarse'; if (p.t >= 13) return up <= 6 ? 'Plantarse' : 'Pedir'; if (p.t === 12) return up >= 4 && up <= 6 ? 'Plantarse' : 'Pedir';
      if (p.t === 11) return canDouble(hd) ? 'Doblar' : 'Pedir'; if (p.t === 10) return up <= 9 && canDouble(hd) ? 'Doblar' : 'Pedir'; if (p.t === 9) return up >= 3 && up <= 6 && canDouble(hd) ? 'Doblar' : 'Pedir';
      return 'Pedir';
    }
    const canDouble = (hd) => hd.cards.length === 2 && !hd.done && bank() >= hd.bet;
    const canSplit = (hd) => hands.length < 4 && hd.cards.length === 2 && val(hd.cards[0]) === val(hd.cards[1]) && bank() >= hd.bet;
    async function deal() {
      if (!bet || phase !== 'bet') return;
      if (bet > bank()) { bet = bank(); }
      setBank(bank() - bet); lastBet = bet;
      phase = 'play'; reveal = false; dealer = []; hands = [{ cards: [], bet, done: false, res: '' }]; cur = 0; tip('');
      for (let i = 0; i < 2; i++) { hands[0].cards.push(draw()); SFX('flip'); render(); await wait(260); dealer.push(draw()); SFX('flip'); render(); await wait(260); }
      if (isBJ(hands[0].cards) || isBJ(dealer)) { reveal = true; return finish(); }
      tip('¿Pedís otra carta o te plantás?'); render();
    }
    async function act(kind) {
      if (phase !== 'play') return;
      const hd = hands[cur];
      if (kind === 'hit') { hd.cards.push(draw()); SFX('flip'); if (total(hd.cards).t >= 21) hd.done = true; }
      else if (kind === 'stand') hd.done = true;
      else if (kind === 'double') { if (!canDouble(hd)) return; setBank(bank() - hd.bet); hd.bet *= 2; hd.cards.push(draw()); SFX('coin'); hd.done = true; hd.dbl = true; }
      else if (kind === 'split') {
        if (!canSplit(hd)) return; setBank(bank() - hd.bet);
        const nh = { cards: [hd.cards.pop()], bet: hd.bet, done: false, res: '' };
        hd.cards.push(draw()); nh.cards.push(draw()); hands.splice(cur + 1, 0, nh); SFX('flip');
        if (hd.cards[0].r === 'A') { hd.done = true; nh.done = true; } // ases divididos: una carta cada uno
      }
      tip(''); render();
      while (cur < hands.length && hands[cur].done) cur++;
      if (cur >= hands.length) { await wait(350); return dealerPlay(); }
      render();
    }
    async function dealerPlay() {
      phase = 'dealer'; reveal = true; render(); await wait(550);
      const alive = hands.some(hd => total(hd.cards).t <= 21);
      // la banca pide hasta 17 (se planta con 17 blando)
      while (alive && total(dealer).t < 17) { dealer.push(draw()); SFX('flip'); render(); await wait(520); }
      finish();
    }
    function finish() {
      phase = 'end'; reveal = true;
      const d = total(dealer).t, dBJ = isBJ(dealer);
      let gain = 0, wins = 0, losses = 0;
      for (const hd of hands) {
        const p = total(hd.cards).t, pBJ = isBJ(hd.cards) && hands.length === 1;
        let pay = 0;
        if (p > 21) { hd.res = 'Te pasaste'; losses++; }
        else if (pBJ && !dBJ) { pay = hd.bet * 2.5; hd.res = '¡Blackjack! paga 3 a 2'; wins++; }
        else if (dBJ && !pBJ) { hd.res = 'Blackjack de la banca'; losses++; }
        else if (d > 21 || p > d) { pay = hd.bet * 2; hd.res = d > 21 ? 'La banca se pasó' : 'Ganaste'; wins++; }
        else if (p === d) { pay = hd.bet; hd.res = 'Empate'; }
        else { hd.res = 'Ganó la banca'; losses++; }
        hd.win = pay > hd.bet ? 1 : pay === hd.bet ? 0 : -1;
        gain += pay;
      }
      setBank(bank() + gain);
      const s = S(); s.played = (s.played || 0) + 1; s.won = (s.won || 0) + wins; H.set(s);
      if (wins > losses) { SFX('win'); if (hands.some(hd => /Blackjack!/.test(hd.res))) confetti(root); } else if (losses > wins) SFX('lose');
      bet = Math.min(lastBet, bank());
      tip(bank() <= 0 ? 'Te quedaste sin fichas' : 'Apostá y repartí de nuevo');
      render();
      if (bank() <= 0) overlay(root, 'Te quedaste sin fichas', 'Empezá de nuevo con 1000', [btn('Empezar de nuevo', () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); setBank(1000); bet = 50; phase = 'bet'; render(); }, 'primary')]);
    }
    function render() {
      status();
      const dT = total(reveal ? dealer : dealer.slice(0, 1));
      const dealerSeat = h('div', { class: 'bj-seat' },
        h('span', { class: 'bj-tag' + (reveal && dT.t > 21 ? ' bust' : '') + (reveal && isBJ(dealer) ? ' bj21' : '') }, 'Banca', dealer.length ? h('span', { class: 'n', text: reveal ? String(dT.t) : String(dT.t) + (dealer.length > 1 ? ' + ?' : '') }) : null),
        h('div', { class: 'bj-row' }, dealer.map((c, i) => card(c, i === 1 && !reveal))));
      const handsBox = h('div', { class: 'bj-hands' }, hands.map((hd, i) => {
        const t = total(hd.cards);
        return h('div', { class: 'bj-hand' + (phase === 'play' && i === cur && hands.length > 1 ? ' on' : '') },
          h('div', { class: 'bj-row' }, hd.cards.map(c => card(c))),
          h('span', { class: 'bj-tag' + (t.t > 21 ? ' bust' : '') + (isBJ(hd.cards) ? ' bj21' : '') }, hands.length > 1 ? `Mano ${i + 1}` : 'Vos', h('span', { class: 'n', text: (t.soft && t.t < 21 ? `${t.t - 10}/` : '') + t.t }), `· ${hd.bet}${hd.dbl ? ' (doble)' : ''}`),
          hd.res ? h('span', { class: 'bj-res ' + (hd.win > 0 ? 'win' : hd.win < 0 ? 'lose' : 'push'), text: hd.res }) : null);
      }));
      const playerSeat = h('div', { class: 'bj-seat' }, hands.length ? handsBox : h('div', { class: 'bj-row' }));
      const middle = h('div', { style: 'display:grid;grid-template-rows:auto 1fr auto;min-height:0;height:100%;position:relative' }, dealerSeat, h('div', { class: 'bj-arc' }, h('b', { text: 'BLACKJACK PAGA 3 A 2' }), 'La banca pide hasta 16 y se planta con 17'), playerSeat);
      const tipEl = h('div', { class: 'bj-tip' }, hint || (phase === 'bet' ? 'Elegí tu apuesta con las fichas y tocá Repartir' : ''));
      let center;
      if (phase === 'bet' || phase === 'end') {
        const chips = h('div', { class: 'bj-chips' }, [[5, '#7a8590'], [10, '#2f62c9'], [25, '#2f8a43'], [50, '#d23a2e'], [100, '#1d1f2b'], [500, '#7b4dff']].map(([v, c]) => {
          const b = h('button', { class: 'bj-chip', style: `--c:${c}`, text: String(v), title: `Sumar ${v} a la apuesta` });
          b.disabled = bet + v > bank(); b.onclick = () => { if (phase === 'end') { phase = 'bet'; hands = []; dealer = []; bet = 0; } bet += v; SFX('coin'); render(); }; return b;
        }));
        const dealB = Object.assign(h('button', { class: 'bj-b hot', text: phase === 'end' ? `Repartir (${bet})` : 'Repartir' }), { onclick: () => { if (phase === 'end') { phase = 'bet'; hands = []; dealer = []; } deal(); } });
        dealB.disabled = !bet || bet > bank();
        const clr = Object.assign(h('button', { class: 'bj-b', text: 'Borrar' }), { onclick: () => { if (phase === 'end') { phase = 'bet'; hands = []; dealer = []; } bet = 0; render(); } });
        center = h('div', { style: 'display:grid;gap:8px;justify-items:center' }, chips, h('div', { class: 'bj-acts' }, clr, dealB));
      } else {
        const hd = hands[cur], on = phase === 'play' && hd;
        const B = (t, sub, k, ok, cls) => Object.assign(h('button', { class: 'bj-b ' + (cls || ''), disabled: !ok }, t, h('small', { text: sub })), { onclick: () => act(k) });
        center = h('div', { class: 'bj-acts' },
          B('Pedir', 'otra carta', 'hit', on, 'hot'), B('Plantarse', 'quedarme así', 'stand', on),
          B('Doblar', 'una carta y apuesta x2', 'double', on && canDouble(hd)), B('Dividir', 'separar el par', 'split', on && canSplit(hd)),
          Object.assign(h('button', { class: 'bj-b', disabled: !on }, '¿Qué hago?', h('small', { text: 'una ayuda' })), { onclick: () => { tip(`Te conviene: ${advice(hd)}`); render(); } }));
      }
      const bar = h('div', { class: 'bj-bar' }, h('div', { class: 'bj-bank' }, 'Tus fichas', h('b', { text: String(bank()) })), center, h('div', { class: 'bj-bet' }, 'Apuesta', h('b', { text: String(phase === 'play' || phase === 'dealer' ? hands.reduce((a, x) => a + x.bet, 0) : bet) })));
      root.replaceChildren(middle, tipEl, bar);
    }
    const fit = () => { const w = root.clientWidth, hh = root.clientHeight; if (!w) return; root.style.setProperty('--cw', Math.max(44, Math.min(104, Math.min(w / 11, (hh - 270) / 3.25))) + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const keys = (e) => { if (!root.isConnected || e.target.closest('input,select,textarea')) return; const k = e.key.toLowerCase(); if (phase === 'play') { if (k === 'p' || k === ' ') { e.preventDefault(); act('hit'); } else if (k === 'enter' || k === 'q') act('stand'); else if (k === 'd') act('double'); } else if ((k === 'enter' || k === ' ') && bet) { e.preventDefault(); if (phase === 'end') { phase = 'bet'; hands = []; dealer = []; } deal(); } };
    addEventListener('keydown', keys);
    newShoe(); bet = 50;
    const tools = [pick('Mazos', [['1', '1 mazo'], ['2', '2 mazos'], ['6', '6 mazos']], String(decks()), (v) => { const s = H.get(); s.decks = +v; H.set(s); newShoe(); render(); }),
      btn('Fichas de nuevo', () => { if (phase === 'play' || phase === 'dealer') return; setBank(1000); bet = 50; phase = 'bet'; hands = []; dealer = []; render(); })];
    requestAnimationFrame(() => { fit(); render(); });
    return { el: root, tools, help: 'Blackjack: sacá más que la banca sin pasarte de 21. Las figuras valen 10 y el as 1 u 11. Pedir te da otra carta, Plantarse deja la mano como está, Doblar duplica la apuesta con una sola carta más, y Dividir separa un par en dos manos. Blackjack (as + figura o 10) paga 3 a 2. Teclas: P o Espacio pide, Enter se planta, D dobla.', pad: { a: ' ', b: 'Enter', x: 'd' } };
  }
  BM.register({ id: 'blackjack', n: 'Blackjack', d: 'El 21 contra la banca: pedí, plantate, doblá o dividí. Con fichas de mentira y una ayuda.', c: '#1d4f8a', create: blackjack, skinLabel: 'Mesa', skins: [['verde', 'Paño verde', '#2f7d4a'], ['azul', 'Paño azul', '#2b5f9e'], ['rojo', 'Paño rojo', '#9e2b35']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1b5232"/><g transform="rotate(-12 24 34)"><rect x="10" y="14" width="24" height="36" rx="3" fill="#fff" stroke="#c9ccd4"/><text x="15" y="24" font-size="8" font-weight="800" fill="#1d1f2b" font-family="sans-serif">A</text><path d="M22 26c2 3 6 5 6 9 0 3-3 4-5 2.6l1 2.4h-4l1-2.4c-2 1.4-5 .4-5-2.6 0-4 4-6 6-9z" fill="#1d1f2b"/></g><g transform="rotate(10 42 34)"><rect x="30" y="14" width="24" height="36" rx="3" fill="#fff" stroke="#c9ccd4"/><text x="35" y="24" font-size="8" font-weight="800" fill="#c8232c" font-family="sans-serif">K</text><text x="42" y="40" font-size="14" font-weight="900" text-anchor="middle" fill="#b8860b" font-family="Georgia,serif">K</text></g><circle cx="50" cy="52" r="7" fill="#d23a2e" stroke="#fff" stroke-width="1.5"/></svg>',
    best: (s) => s.played ? `${s.best || 1000} fichas de récord · ${s.played} manos` : 'Nunca jugaste' });
})();
