// Tienda de Base · Gran Ciudad (juego de comprar barrios y cobrar alquileres, contra 1 a 3 compus)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, shuffle, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const CSS = `
.gc-wrap{display:grid;place-items:center;width:100%;height:100%;padding:8px;box-sizing:border-box}
.gc-board{position:relative;display:grid;grid-template-columns:1.35fr repeat(6,1fr) 1.35fr;grid-template-rows:1.35fr repeat(6,1fr) 1.35fr;gap:2px;background:#1f3b2c;padding:2px;border-radius:10px;width:var(--bs);height:var(--bs);box-shadow:0 20px 50px -20px rgba(0,0,0,.8);font-size:calc(var(--bs)/82)}
.gc-sq{position:relative;background:#f4f0e2;color:#222;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center;overflow:hidden;cursor:pointer;min-width:0;min-height:0}
.gc-sq .band{width:100%;height:22%;flex:none}
.gc-sq .nm{font-weight:800;line-height:1.05;padding:0 2px;font-size:1.05em}
.gc-sq .pr{font-size:.95em;opacity:.8;padding-bottom:2px}
.gc-sq .ic{font-size:2.1em;line-height:1}
.gc-sq.corner{background:#e9dfc4;justify-content:center;gap:4px}
.gc-sq.corner .ic{font-size:3em}
.gc-sq.own::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 3px var(--oc);pointer-events:none}
.gc-sq.mort{filter:grayscale(.8) brightness(.85)}
.gc-sq .hs{position:absolute;top:1px;left:0;right:0;display:flex;justify-content:center;gap:2px}
.gc-sq .hs i{width:.9em;height:.9em;background:#2e8b57;border:1px solid #0d3d22;border-radius:2px}
.gc-sq .hs i.hotel{width:2.2em;background:#c0392b;border-color:#5a1510}
.gc-tok{position:absolute;width:calc(var(--bs)/26);height:calc(var(--bs)/26);border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5);transition:left .14s linear,top .14s linear;z-index:4;display:grid;place-items:center;font-size:calc(var(--bs)/50);color:#fff;font-weight:900}
.gc-center{grid-column:2/8;grid-row:2/8;background:linear-gradient(160deg,#eaf3e6,#cfe3c7);display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;padding:10px;font-size:13px;color:#1d2a20;overflow:hidden}
.gc-title{font-weight:900;font-size:calc(var(--bs)/26);letter-spacing:.06em;text-align:center;color:#1f3b2c;line-height:1}
.gc-players{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px}
.gc-pl{background:#fff;border-radius:10px;padding:5px 8px;box-shadow:0 2px 6px -3px rgba(0,0,0,.35);border-left:5px solid var(--pc)}
.gc-pl b{display:block;font-size:12.5px}.gc-pl span{font-size:12px}
.gc-pl.turn{outline:2px solid #ffb020}
.gc-pl.out{opacity:.4;text-decoration:line-through}
.gc-log{overflow:auto;font-size:12px;display:grid;gap:2px;align-content:start;background:rgba(255,255,255,.55);border-radius:10px;padding:6px 8px;min-height:0}
.gc-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}
.gc-b{border:0;border-radius:10px;padding:7px 12px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:#1f3b2c;color:#fff}
.gc-b.hot{background:#e8a10c;color:#2b2210}.gc-b.alt{background:#fff;color:#1d2a20}
.gc-b:disabled{opacity:.4;cursor:default}
.gc-dice{display:flex;gap:6px}
.gc-die{width:30px;height:30px;border-radius:7px;background:#fff;box-shadow:0 2px 0 #bbb;display:grid;place-items:center;font-weight:900;font-size:17px;color:#1d2a20}
.gc-die.roll{animation:gcroll .35s linear}
@keyframes gcroll{50%{transform:rotate(180deg) scale(.85)}}
.gc-card{position:absolute;inset:18% 14%;background:#fff;border-radius:14px;box-shadow:0 20px 50px -10px rgba(0,0,0,.6);z-index:8;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;color:#1d2a20}
.gc-card .hd{padding:10px 14px;font-weight:900;font-size:16px;color:#fff;background:var(--cc,#1f3b2c)}
.gc-card .bd{padding:10px 14px;font-size:13px;overflow:auto}
.gc-card .bd table{width:100%;border-collapse:collapse}.gc-card .bd td{padding:2px 4px;border-bottom:1px solid #eee}
.gc-card .ft{padding:10px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;background:#f4f4f4}
`;
  // ---------- tablero (28 casillas) ----------
  const GR = { 1: '#8b5a2b', 2: '#7cc6e8', 3: '#d6409f', 4: '#f39c12', 5: '#e74c3c', 6: '#f1c40f', 7: '#27ae60', 8: '#2c5fb8' };
  const HC = { 1: 50, 2: 50, 3: 100, 4: 100, 5: 150, 6: 150, 7: 200, 8: 200 };
  const P = (n, g, price) => ({ t: 'prop', n, g, price, base: Math.round(price / 10) });
  const SQ = [
    { t: 'go', n: 'Salida', ic: '➜' }, P('La Boca', 1, 60), { t: 'suerte', n: 'Suerte', ic: '❓' }, P('Barracas', 1, 70), { t: 'tax', n: 'Impuestos', ic: '💸', amt: 100 }, { t: 'sub', n: 'Línea A', price: 200, ic: '🚇' }, P('Pompeya', 2, 100),
    { t: 'jail', n: 'Comisaría', ic: '🚓' }, P('Mataderos', 2, 120), { t: 'util', n: 'Compañía de luz', price: 150, ic: '💡' }, P('Flores', 3, 140), P('Caballito', 3, 160), { t: 'sub', n: 'Línea B', price: 200, ic: '🚇' }, P('Almagro', 4, 180),
    { t: 'free', n: 'Plaza', ic: '🌳' }, P('Boedo', 4, 200), { t: 'suerte', n: 'Suerte', ic: '❓' }, P('San Telmo', 5, 220), P('Montserrat', 5, 240), { t: 'sub', n: 'Línea D', price: 200, ic: '🚇' }, P('Villa Crespo', 6, 260),
    { t: 'gojail', n: 'Vas preso', ic: '👮' }, P('Colegiales', 6, 280), P('Belgrano', 7, 300), P('Núñez', 7, 320), { t: 'sub', n: 'Línea E', price: 200, ic: '🚇' }, P('Palermo', 8, 350), P('Recoleta', 8, 400)
  ];
  const JAIL = 7, N = SQ.length;
  const RENT_MULT = [1, 5, 15, 35, 45, 60]; // sin casas (x2 si tenés el grupo), 1 a 4 casas, hotel
  const LUCK = [
    ['Te devolvieron un impuesto mal cobrado. Cobrás $100.', g => g.money(+100)],
    ['Multa por estacionar en doble fila. Pagás $50.', g => g.money(-50)],
    ['Ganaste el sorteo del club del barrio. Cobrás $150.', g => g.money(+150)],
    ['Avanzá hasta la Salida (cobrás $200).', g => g.moveTo(0)],
    ['Retrocedé 3 casillas.', g => g.moveBy(-3)],
    ['Arreglos en tus propiedades: $25 por casa y $100 por hotel.', g => g.repairs(25, 100)],
    ['Vas preso directo, sin pasar por la Salida.', g => g.toJail()],
    ['Salís de la comisaría gratis (guardala hasta que la necesites).', g => g.freeCard()],
    ['Es tu cumpleaños: cada jugador te regala $20.', g => g.birthday(20)],
    ['Tomá el subte más cercano hacia adelante.', g => g.nearestSub()],
    ['Pagás la expensas del mes: $80.', g => g.money(-80)],
    ['Vendiste cosas que no usabas. Cobrás $60.', g => g.money(+60)]
  ];
  const COLORS = ['#e8a10c', '#2c5fb8', '#c0392b', '#7b4fc9'];
  function ciudad(H) {
    { const st = document.getElementById('st-gc') || document.head.appendChild(h('style', { id: 'st-gc' })); if (st.textContent !== CSS) st.textContent = CSS; }
    const root = h('div', { class: 'gc-wrap' });
    const board = h('div', { class: 'gc-board' }); root.append(board);
    const cfg = () => { const s = H.get(); return { rivals: +(s.rivals || 2), largo: s.largo || 'corto' }; };
    let G = null, busy = false, sqEls = [], toks = [], center = null, cardBox = null;
    const pos = (i) => { // casilla -> fila/columna del tablero de 8x8
      if (i <= 7) return [8, 8 - i]; if (i <= 14) return [8 - (i - 7), 1]; if (i <= 21) return [1, 1 + (i - 14)]; return [1 + (i - 21), 8];
    };
    function buildBoard() {
      board.replaceChildren(); sqEls = [];
      SQ.forEach((q, i) => {
        const [r, c] = pos(i);
        const corner = ['go', 'jail', 'free', 'gojail'].includes(q.t);
        const e = h('div', { class: 'gc-sq' + (corner ? ' corner' : ''), style: `grid-row:${r};grid-column:${c}`, title: q.n });
        if (q.t === 'prop') e.append(h('div', { class: 'band', style: `background:${GR[q.g]}` }), h('div', { class: 'nm', text: q.n }), h('div', { class: 'pr', text: '$' + q.price }), h('div', { class: 'hs' }));
        else e.append(h('div', { class: 'ic', text: q.ic }), h('div', { class: 'nm', text: q.n }), q.price ? h('div', { class: 'pr', text: '$' + q.price }) : q.amt ? h('div', { class: 'pr', text: '$' + q.amt }) : null);
        e.onclick = () => showDeed(i);
        sqEls.push(e); board.append(e);
      });
      center = h('div', { class: 'gc-center' }); board.append(center);
      toks = G.players.map((p, i) => { const t = h('div', { class: 'gc-tok', style: `background:${p.c}`, text: p.cpu ? String(i) : '★' }); board.append(t); return t; });
    }
    // ---------- partida ----------
    function newGame() {
      const c = cfg();
      const names = ['Vos', 'Compu 1', 'Compu 2', 'Compu 3'].slice(0, c.rivals + 1);
      G = { players: names.map((n, i) => ({ n, c: COLORS[i], cpu: i > 0, cash: 1500, pos: 0, jail: 0, free: 0, out: false, doubles: 0 })),
        own: {}, houses: {}, mort: {}, turn: 0, round: 1, rolled: false, dice: [1, 1], log: [], maxRounds: c.largo === 'corto' ? 20 : 999, luck: shuffle(LUCK.map((_, i) => i)) };
      busy = false; buildBoard(); paint(); placeTokens();
      log('Arranca la partida. Cada uno empieza con $1500.');
    }
    const cur = () => G.players[G.turn];
    const log = (t) => { G.log.push(t); if (G.log.length > 60) G.log.shift(); paint(); };
    const groupOf = (g) => SQ.map((q, i) => [q, i]).filter(([q]) => q.t === 'prop' && q.g === g).map(([, i]) => i);
    const hasGroup = (p, g) => groupOf(g).every(i => G.own[i] === p);
    function rent(i, dice) {
      const q = SQ[i], o = G.own[i]; if (o == null || G.mort[i]) return 0;
      if (q.t === 'prop') { const hs = G.houses[i] || 0; return hs ? q.base * RENT_MULT[hs] : q.base * (hasGroup(o, q.g) ? 2 : 1); }
      if (q.t === 'sub') { const n = SQ.filter((x, j) => x.t === 'sub' && G.own[j] === o && !G.mort[j]).length; return 25 * Math.pow(2, n - 1); }
      if (q.t === 'util') return (dice[0] + dice[1]) * 8;
      return 0;
    }
    const worth = (pi) => { const p = G.players[pi]; let w = p.cash; for (const [i, o] of Object.entries(G.own)) if (o === pi) { w += G.mort[i] ? SQ[i].price / 2 : SQ[i].price; w += (G.houses[i] || 0) * (HC[SQ[i].g] || 0); } return w; };
    function placeTokens() {
      const bw = board.clientWidth; if (!bw) return;
      G.players.forEach((p, pi) => {
        const e = sqEls[p.pos], t = toks[pi]; if (!e || !t) return;
        t.style.display = p.out ? 'none' : '';
        const off = [[-.22, -.18], [.22, -.18], [-.22, .22], [.22, .22]][pi];
        t.style.left = (e.offsetLeft + e.offsetWidth * (.5 + off[0]) - t.offsetWidth / 2) + 'px';
        t.style.top = (e.offsetTop + e.offsetHeight * (.55 + off[1]) - t.offsetHeight / 2) + 'px';
      });
    }
    function paintSquares() {
      SQ.forEach((q, i) => {
        const e = sqEls[i], o = G.own[i];
        e.classList.toggle('own', o != null); e.classList.toggle('mort', !!G.mort[i]);
        if (o != null) e.style.setProperty('--oc', G.players[o].c);
        const hs = e.querySelector('.hs'); if (hs) { const n = G.houses[i] || 0; hs.replaceChildren(...(n === 5 ? [h('i', { class: 'hotel' })] : Array.from({ length: n }, () => h('i')))); }
      });
    }
    function status() { const p = G.players[0]; H.status([`Vos $${p.cash}`, `Vuelta ${G.round}${G.maxRounds < 999 ? ' de ' + G.maxRounds : ''}`, `Turno de ${cur().n}`]); }
    function paint() {
      if (!center) return; status(); paintSquares();
      const pls = h('div', { class: 'gc-players' }, G.players.map((p, i) => h('div', { class: 'gc-pl' + (i === G.turn ? ' turn' : '') + (p.out ? ' out' : ''), style: `--pc:${p.c}` }, h('b', { text: p.n + (p.jail ? ' 🚓' : '') + (p.free ? ' 🎟️' : '') }), h('span', { text: `$${p.cash} · ${Object.values(G.own).filter(o => o === i).length} prop.` }))));
      const dice = h('div', { class: 'gc-dice' }, G.dice.map(d => h('div', { class: 'gc-die', text: '⚀⚁⚂⚃⚄⚅'[d - 1] })));
      const me = G.turn === 0 && !G.players[0].out && !busy && !G.over;
      const p0 = G.players[0];
      const acts = h('div', { class: 'gc-acts' }, dice);
      if (me && !G.rolled) {
        if (p0.jail) { acts.append(Object.assign(h('button', { class: 'gc-b alt', text: 'Pagar $50 y salir', disabled: p0.cash < 50 }), { onclick: () => { pay(0, 50, null); p0.jail = 0; log('Pagaste la fianza.'); paint(); } }));
          if (p0.free) acts.append(Object.assign(h('button', { class: 'gc-b alt', text: 'Usar la tarjeta para salir' }), { onclick: () => { p0.free--; p0.jail = 0; log('Usaste la tarjeta para salir.'); paint(); } })); }
        acts.append(Object.assign(h('button', { class: 'gc-b hot', text: p0.jail ? 'Tirar (sacá dobles para salir)' : 'Tirar los dados' }), { onclick: () => roll() }));
      }
      if (me && G.rolled) acts.append(Object.assign(h('button', { class: 'gc-b hot', text: 'Terminar turno' }), { onclick: () => endTurn() }));
      if (me) acts.append(Object.assign(h('button', { class: 'gc-b alt', text: 'Mis propiedades' }), { onclick: () => showMine() }));
      const lg = h('div', { class: 'gc-log' }, G.log.slice(-40).map(t => h('div', { text: t })));
      center.replaceChildren(h('div', { class: 'gc-title', text: 'GRAN CIUDAD' }), pls, lg, acts);
      lg.scrollTop = 1e6;
    }
    // ---------- dinero ----------
    function pay(pi, amt, to) { // devuelve false si quebró
      const p = G.players[pi];
      if (p.cash < amt) raise(pi, amt - p.cash);
      if (p.cash < amt) { bankrupt(pi, to); return false; }
      p.cash -= amt; if (to != null) G.players[to].cash += amt; SFX('coin'); return true;
    }
    // vende casas e hipoteca solo lo necesario (para vos y para la compu)
    function raise(pi, need) {
      const mine = Object.keys(G.own).map(Number).filter(i => G.own[i] === pi);
      const p = G.players[pi];
      for (const i of mine.sort((a, b) => SQ[b].price - SQ[a].price)) { while ((G.houses[i] || 0) > 0 && need > 0) { G.houses[i]--; const v = HC[SQ[i].g] / 2; p.cash += v; need -= v; log(`${p.n} vendió una casa en ${SQ[i].n} (+$${v}).`); } }
      for (const i of mine.sort((a, b) => SQ[a].price - SQ[b].price)) { if (need <= 0) break; if (G.mort[i] || (G.houses[i] || 0)) continue; G.mort[i] = true; const v = SQ[i].price / 2; p.cash += v; need -= v; log(`${p.n} hipotecó ${SQ[i].n} (+$${v}).`); }
    }
    function bankrupt(pi, to) {
      const p = G.players[pi]; p.out = true;
      for (const i of Object.keys(G.own).map(Number)) if (G.own[i] === pi) { if (to != null) G.own[i] = to; else { delete G.own[i]; delete G.mort[i]; } G.houses[i] = 0; }
      if (to != null) G.players[to].cash += Math.max(0, p.cash); p.cash = 0;
      log(`💥 ${p.n} quebró${to != null ? ' y todo pasa a ' + G.players[to].n : ''}.`); SFX('lose');
      checkEnd();
    }
    function checkEnd(force) {
      const alive = G.players.filter(p => !p.out);
      if (!force && alive.length > 1 && !G.players[0].out) return false;
      G.over = true; paint();
      let won, sub;
      if (G.players[0].out) { won = false; sub = 'Te quedaste sin plata.'; }
      else if (alive.length === 1) { won = true; sub = 'Quebraron todos los demás.'; }
      else { const w = alive.map(p => [p, worth(G.players.indexOf(p))]).sort((a, b) => b[1] - a[1]); won = w[0][0] === G.players[0]; sub = w.map(([p, v]) => `${p.n}: $${v}`).join(' · '); }
      const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s);
      if (won) confetti(root);
      setTimeout(() => overlay(root, won ? '¡Ganaste! Sos el dueño de la ciudad' : 'Ganó la compu', sub, [btn('Otra partida', () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); }, 'primary')]), 600);
      return true;
    }
    // ---------- movimiento ----------
    async function roll() {
      if (busy || G.over) return; busy = true; paint();
      const p = cur(), pi = G.turn;
      G.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
      SFX('whoosh'); paint(); center.querySelectorAll('.gc-die').forEach(d => d.classList.add('roll')); await wait(380);
      const [a, b] = G.dice, dbl = a === b;
      log(`${p.n} sacó ${a} y ${b}${dbl ? ' (dobles)' : ''}.`);
      if (p.jail) {
        if (dbl) { p.jail = 0; log(`${p.n} salió de la comisaría con dobles.`); }
        else { p.jail++; if (p.jail > 3) { if (!pay(pi, 50, null)) return after(); p.jail = 0; log(`${p.n} pagó la fianza al tercer intento.`); } else { G.rolled = true; return after(); } }
      } else if (dbl) { p.doubles++; if (p.doubles >= 3) { log(`${p.n} sacó tres dobles seguidos: ¡preso!`); toJail(pi); G.rolled = true; return after(); } }
      await walk(pi, a + b);
      await land(pi);
      G.rolled = !(dbl && !p.jail && !p.out);
      if (!G.rolled) log(`${p.n} vuelve a tirar.`);
      after();
    }
    function after() { busy = false; paint(); if (G.over) return; if (cur().out) { G.rolled = true; return endTurn(); } if (cur().cpu) setTimeout(cpuStep, 700); }
    async function walk(pi, steps) {
      const p = G.players[pi], dir = steps < 0 ? -1 : 1;
      for (let s = 0; s < Math.abs(steps); s++) {
        p.pos = (p.pos + dir + N) % N;
        if (p.pos === 0 && dir > 0) { p.cash += 200; log(`${p.n} pasó por la Salida: +$200.`); }
        placeTokens(); SFX('tick'); await wait(150);
      }
    }
    function toJail(pi) { const p = G.players[pi]; p.pos = JAIL; p.jail = 1; p.doubles = 0; placeTokens(); SFX('bad'); }
    async function land(pi) {
      const p = G.players[pi], i = p.pos, q = SQ[i];
      if (q.t === 'gojail') { log(`${p.n} cayó en "Vas preso".`); toJail(pi); return; }
      if (q.t === 'tax') { log(`${p.n} paga $${q.amt} de impuestos.`); pay(pi, q.amt, null); return; }
      if (q.t === 'suerte') return luck(pi);
      if (!['prop', 'sub', 'util'].includes(q.t)) return;
      const o = G.own[i];
      if (o == null) {
        if (p.cpu) { if (cpuWantsBuy(pi, i)) buy(pi, i); else log(`${p.n} no compró ${q.n}.`); }
        else await askBuy(i);
      } else if (o !== pi && !G.players[o].out) {
        const r = rent(i, G.dice); if (!r) return;
        log(`${p.n} le paga $${r} de alquiler a ${G.players[o].n} por ${q.n}.`);
        pay(pi, r, o);
      }
    }
    function buy(pi, i) { const p = G.players[pi]; p.cash -= SQ[i].price; G.own[i] = pi; log(`${p.n} compró ${SQ[i].n} por $${SQ[i].price}.`); SFX('coin'); paint(); }
    async function luck(pi) {
      if (!G.luck.length) G.luck = shuffle(LUCK.map((_, i) => i));
      const [txt, fn] = LUCK[G.luck.pop()], p = G.players[pi];
      log(`${p.n} sacó Suerte: ${txt}`);
      if (!p.cpu) await showCard('Suerte', txt, '#7b4fc9', [['Dale', true]]);
      const api = {
        money: (v) => { if (v >= 0) p.cash += v; else pay(pi, -v, null); },
        moveTo: async (t) => { const d = (t - p.pos + N) % N; await walk(pi, d); await land(pi); },
        moveBy: async (d) => { await walk(pi, d); await land(pi); },
        repairs: (hc, ho) => { let t = 0; for (const [i, o] of Object.entries(G.own)) if (o === pi) { const n = G.houses[i] || 0; t += n === 5 ? ho : n * hc; } if (t) pay(pi, t, null); else log('No tenés casas: no pagás nada.'); },
        toJail: () => toJail(pi), freeCard: () => { p.free++; },
        birthday: (v) => { G.players.forEach((q, j) => { if (j !== pi && !q.out) pay(j, v, pi); }); },
        nearestSub: async () => { let d = 1; while (SQ[(p.pos + d) % N].t !== 'sub') d++; await walk(pi, d); await land(pi); }
      };
      await fn(api);
    }
    // ---------- cartelitos ----------
    function showCard(title, body, color, buttons) {
      return new Promise((res) => {
        if (cardBox) cardBox.remove();
        const bd = h('div', { class: 'bd' }); if (typeof body === 'string') bd.textContent = body; else bd.append(body);
        cardBox = h('div', { class: 'gc-card', style: `--cc:${color}` }, h('div', { class: 'hd', text: title }), bd, h('div', { class: 'ft' }, buttons.map(([t, v, cls]) => Object.assign(h('button', { class: 'gc-b ' + (cls || ''), text: t, disabled: v === null }), { onclick: () => { cardBox.remove(); cardBox = null; res(v); } }))));
        board.append(cardBox);
      });
    }
    function deedBody(i) {
      const q = SQ[i], t = h('table');
      const row = (a, b) => t.append(h('tr', {}, h('td', { text: a }), h('td', { text: b, style: 'text-align:right;font-weight:700' })));
      if (q.t === 'prop') { row('Alquiler', '$' + q.base); row('Con el grupo completo', '$' + q.base * 2); for (let k = 1; k <= 4; k++) row(`Con ${k} casa${k > 1 ? 's' : ''}`, '$' + q.base * RENT_MULT[k]); row('Con hotel', '$' + q.base * RENT_MULT[5]); row('Cada casa cuesta', '$' + HC[q.g]); row('Hipoteca', '$' + q.price / 2); }
      else if (q.t === 'sub') { row('Con 1 línea', '$25'); row('Con 2', '$50'); row('Con 3', '$100'); row('Con las 4', '$200'); }
      else if (q.t === 'util') row('Alquiler', '8 × lo que salió en los dados');
      const o = G.own[i]; row('Dueño', o == null ? 'nadie' : G.players[o].n + (G.mort[i] ? ' (hipotecada)' : ''));
      return t;
    }
    async function askBuy(i) {
      const q = SQ[i], p = G.players[0];
      const v = await showCard(`${q.n} · $${q.price}`, deedBody(i), q.g ? GR[q.g] : '#1f3b2c', [[p.cash >= q.price ? `Comprar ($${q.price})` : 'No te alcanza', p.cash >= q.price ? true : null, 'hot'], ['No, gracias', false, 'alt']]);
      if (v) buy(0, i); else log(`No compraste ${q.n}.`);
    }
    function showDeed(i) { const q = SQ[i]; if (busy || !['prop', 'sub', 'util'].includes(q.t)) return; showCard(q.n + (q.price ? ` · $${q.price}` : ''), deedBody(i), q.g ? GR[q.g] : '#1f3b2c', [['Cerrar', true]]); }
    function showMine() {
      const box = h('div', { style: 'display:grid;gap:6px' });
      const mine = Object.keys(G.own).map(Number).filter(i => G.own[i] === 0).sort((a, b) => a - b);
      if (!mine.length) box.append(h('div', { text: 'Todavía no tenés propiedades.' }));
      for (const i of mine) {
        const q = SQ[i], n = G.houses[i] || 0, grp = q.t === 'prop' && hasGroup(0, q.g) && groupOf(q.g).every(j => !G.mort[j]);
        const even = q.t === 'prop' ? groupOf(q.g).every(j => (G.houses[j] || 0) >= n) : false;
        const evenDown = q.t === 'prop' ? groupOf(q.g).every(j => (G.houses[j] || 0) <= n) : false;
        const row = h('div', { style: `display:flex;align-items:center;gap:6px;flex-wrap:wrap;border-left:6px solid ${q.g ? GR[q.g] : '#999'};padding-left:8px` }, h('b', { text: q.n, style: 'flex:1;min-width:110px' }), h('span', { text: G.mort[i] ? 'hipotecada' : n === 5 ? 'hotel' : n ? `${n} casa${n > 1 ? 's' : ''}` : '' }));
        const B = (t, ok, fn) => row.append(Object.assign(h('button', { class: 'gc-b alt', text: t, disabled: !ok, style: 'padding:4px 8px;font-size:12px' }), { onclick: () => { fn(); paint(); showMine(); } }));
        if (q.t === 'prop') {
          B(`+ Casa ($${HC[q.g]})`, grp && n < 5 && even && G.players[0].cash >= HC[q.g], () => { G.houses[i] = n + 1; G.players[0].cash -= HC[q.g]; log(`Construiste en ${q.n}.`); SFX('place'); });
          B('Vender casa', n > 0 && evenDown, () => { G.houses[i] = n - 1; G.players[0].cash += HC[q.g] / 2; log(`Vendiste una casa en ${q.n}.`); });
        }
        if (!G.mort[i]) B(`Hipotecar (+$${q.price / 2})`, !(q.t === 'prop' && groupOf(q.g).some(j => G.houses[j])), () => { G.mort[i] = true; G.players[0].cash += q.price / 2; log(`Hipotecaste ${q.n}.`); });
        else B(`Levantar hipoteca ($${Math.round(q.price * .55)})`, G.players[0].cash >= Math.round(q.price * .55), () => { G.mort[i] = false; G.players[0].cash -= Math.round(q.price * .55); log(`Levantaste la hipoteca de ${q.n}.`); });
        box.append(row);
      }
      showCard(`Tus propiedades · $${G.players[0].cash}`, box, '#1f3b2c', [['Cerrar', true]]);
    }
    // ---------- la compu ----------
    function cpuWantsBuy(pi, i) {
      const p = G.players[pi], q = SQ[i];
      if (p.cash < q.price) return false;
      const completes = q.t === 'prop' && groupOf(q.g).every(j => j === i || G.own[j] === pi);
      const blocks = q.t === 'prop' && groupOf(q.g).some(j => G.own[j] != null && G.own[j] !== pi);
      return p.cash - q.price >= (completes ? 40 : blocks ? 260 : 140);
    }
    function cpuBuild(pi) {
      const p = G.players[pi];
      for (let g = 8; g >= 1; g--) {
        if (!hasGroup(pi, g) || groupOf(g).some(j => G.mort[j])) continue;
        let built = true;
        while (built) { built = false; const gs = groupOf(g).sort((a, b) => (G.houses[a] || 0) - (G.houses[b] || 0)); const i = gs[0], n = G.houses[i] || 0;
          if (n < 5 && p.cash - HC[g] >= 250) { G.houses[i] = n + 1; p.cash -= HC[g]; log(`${p.n} construyó en ${SQ[i].n}.`); built = true; } }
      }
      for (const i of Object.keys(G.mort).map(Number)) if (G.mort[i] && G.own[i] === pi && p.cash - SQ[i].price * .55 > 400) { G.mort[i] = false; p.cash -= Math.round(SQ[i].price * .55); log(`${p.n} levantó la hipoteca de ${SQ[i].n}.`); }
    }
    function cpuStep() {
      if (G.over || !cur().cpu || busy) return;
      const p = cur(), pi = G.turn;
      if (!G.rolled) {
        if (p.jail && p.free) { p.free--; p.jail = 0; log(`${p.n} usó su tarjeta para salir.`); }
        else if (p.jail && p.cash > 300 && G.round < 12) { pay(pi, 50, null); p.jail = 0; log(`${p.n} pagó la fianza.`); }
        return roll();
      }
      cpuBuild(pi); endTurn();
    }
    function endTurn() {
      if (busy || G.over) return;
      const was = G.turn; cur().doubles = 0; G.rolled = false;
      do { G.turn = (G.turn + 1) % G.players.length; if (G.turn === 0) { G.round++; } } while (G.players[G.turn].out);
      if (G.turn <= was && G.round > G.maxRounds) { log('Se terminaron las vueltas.'); return checkEnd(true); }
      paint();
      if (cur().cpu) setTimeout(cpuStep, 700);
    }
    const fit = () => { const w = root.clientWidth - 16, hh = root.clientHeight - 16; if (w <= 0) return; board.style.setProperty('--bs', Math.max(360, Math.min(w, hh)) + 'px'); requestAnimationFrame(placeTokens); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const set = (k, v) => { const s = H.get(); s[k] = v; H.set(s); const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); };
    const tools = [
      pick('Rivales', [['1', '1 rival'], ['2', '2 rivales'], ['3', '3 rivales']], String(cfg().rivals), (v) => set('rivals', +v)),
      pick('Duración', [['corto', 'Corta (20 vueltas)'], ['largo', 'Hasta que quiebren']], cfg().largo, (v) => set('largo', v)),
      btn('Nueva partida', () => set('x', 0))];
    root.__gc = { G: () => G, busy: () => busy, roll, endTurn, SQ };
    requestAnimationFrame(() => { newGame(); fit(); });
    return { el: root, tools, setSkin: () => {}, help: 'Tirá los dados, comprá barrios y cobrá alquiler cuando otros caen en ellos. Si juntás los dos barrios de un mismo color podés construir casas y hoteles (en "Mis propiedades") y el alquiler sube mucho. Pasar por la Salida da $200. Si te quedás sin plata, quebrás. En la partida corta gana el que más tiene al terminar las 20 vueltas.' };
  }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  BM.register({ id: 'ciudad', n: 'Gran Ciudad', d: 'Comprá barrios, construí casas y cobrá alquileres. Contra 1 a 3 compus.', c: '#1f3b2c', create: ciudad,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1f3b2c"/><rect x="6" y="6" width="52" height="52" rx="3" fill="#f4f0e2"/><rect x="16" y="16" width="32" height="32" fill="#cfe3c7"/><rect x="6" y="6" width="10" height="4" fill="#8b5a2b"/><rect x="48" y="6" width="10" height="4" fill="#2c5fb8"/><rect x="6" y="54" width="10" height="4" fill="#e74c3c"/><rect x="48" y="54" width="10" height="4" fill="#27ae60"/><path d="M24 40V30l6-5 6 5v10z" fill="#2e8b57"/><rect x="38" y="30" width="6" height="10" fill="#c0392b"/><circle cx="20" cy="22" r="3" fill="#e8a10c" stroke="#fff"/></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}` : 'Nunca jugaste' });
})();
