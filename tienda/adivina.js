// Tienda de Base · Adiviná quién (preguntá por sí o por no y descubrí el personaje de la compu)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, shuffle, pick, btn, overlay, confetti } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const CSS = `
.aq-wrap{position:absolute;inset:0;display:grid;grid-template-rows:minmax(0,1fr);grid-template-columns:1fr clamp(230px,24vw,300px);gap:14px;padding:12px;width:100%;height:100%;box-sizing:border-box;background:var(--aq-bg);border-radius:14px;color:#1d2433}
.aq-wrap{--aq-bg:linear-gradient(160deg,#d6e4f5,#b9cdea);--aq-tile:#2a5aa8}
.aq-wrap[data-skin="rojo"]{--aq-bg:linear-gradient(160deg,#f4d7d2,#e9b8b0);--aq-tile:#b8322a}
.aq-wrap[data-skin="verde"]{--aq-bg:linear-gradient(160deg,#d9efd9,#b5dbb7);--aq-tile:#2f7d4a}
.aq-board{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:8px;min-height:0;perspective:900px}
.aq-c{position:relative;border:0;padding:0;border-radius:12px;background:#fff;box-shadow:0 4px 10px -4px rgba(0,0,0,.4);cursor:pointer;transform-style:preserve-3d;transition:transform .45s cubic-bezier(.3,.7,.3,1);min-height:0}
.aq-c .f,.aq-c .b{position:absolute;inset:0;border-radius:12px;backface-visibility:hidden;overflow:hidden;display:grid;grid-template-rows:1fr auto}
.aq-c .f svg{width:100%;height:100%;display:block;min-height:0}
.aq-wrap svg{stroke:none;fill:#000;stroke-width:1}
.aq-c .f span{font-size:12.5px;font-weight:800;text-align:center;padding:2px 0 4px;background:#fff}
.aq-c .b{background:repeating-linear-gradient(45deg,var(--aq-tile) 0 8px,color-mix(in srgb,var(--aq-tile) 80%,#000) 8px 16px);transform:rotateX(180deg);place-items:center}
.aq-c .b::after{content:"?";font-size:32px;font-weight:900;color:rgba(255,255,255,.75)}
.aq-c.down{transform:rotateX(180deg)}
.aq-c.guess{box-shadow:0 0 0 3px #ffb020,0 6px 14px -4px rgba(0,0,0,.5)}
.aq-side{display:grid;grid-template-rows:auto minmax(0,auto) minmax(90px,1fr);gap:10px;min-height:0}
.aq-side>.aq-box{min-height:0;overflow:auto}
.aq-box{background:rgba(255,255,255,.75);border-radius:14px;padding:10px 12px;box-shadow:0 4px 12px -6px rgba(0,0,0,.3)}
.aq-box h4{margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;opacity:.7}
.aq-me{display:grid;grid-template-columns:72px 1fr;gap:10px;align-items:center}
.aq-me svg{width:72px;height:84px;border-radius:10px;display:block}
.aq-qs{display:flex;flex-wrap:wrap;gap:5px;max-height:100%;overflow:auto}
.aq-q{border:0;border-radius:999px;padding:5px 10px;font:inherit;font-size:12.5px;font-weight:650;background:#fff;color:#1d2433;cursor:pointer;box-shadow:0 1px 0 rgba(0,0,0,.15)}
.aq-q:hover{background:#ffe9a8}
.aq-q:disabled{opacity:.35;cursor:default}
.aq-log{overflow:auto;font-size:12.5px;display:grid;gap:3px;align-content:start;min-height:0}
.aq-log .y{color:#1f7a3a;font-weight:700}.aq-log .n{color:#b8322a;font-weight:700}
.aq-ask{display:grid;gap:8px}
.aq-ask b{font-size:15px}
.aq-row{display:flex;gap:8px;flex-wrap:wrap}
.aq-b{border:0;border-radius:10px;padding:8px 14px;font:inherit;font-weight:800;cursor:pointer;background:#1d2433;color:#fff}
.aq-b.y{background:#1f7a3a}.aq-b.n{background:#b8322a}.aq-b.alt{background:#fff;color:#1d2433}
.aq-b:disabled{opacity:.4;cursor:default}
`;
  // ---------- personajes (se dibujan solos, cada partida igual) ----------
  const NAMES = ['Ana', 'Beto', 'Carla', 'Diego', 'Elena', 'Fede', 'Gabi', 'Hugo', 'Inés', 'Juan', 'Lola', 'Marcos', 'Nora', 'Omar', 'Paula', 'Quique', 'Rosa', 'Santi', 'Tina', 'Ulises', 'Vero', 'Walter', 'Yami', 'Zoe'];
  const HAIR = { negro: '#2b2420', castano: '#7a4a24', rubio: '#e8c25a', colorado: '#c8562a', canoso: '#c9c9c9' };
  const EYES = { marrones: '#6b3f1d', azules: '#2f6fd0', verdes: '#3b9a4a' };
  const SKIN = ['#f6d3b3', '#e9b48a', '#c98b5e', '#8d5a3b'];
  const BGS = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6', '#a0c4ff', '#ffadad'];
  function makePeople() {
    let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const hairs = ['negro', 'negro', 'negro', 'negro', 'castano', 'castano', 'castano', 'castano', 'castano', 'rubio', 'rubio', 'rubio', 'rubio', 'colorado', 'colorado', 'colorado', 'canoso', 'canoso', 'canoso', 'canoso', 'pelado', 'pelado', 'pelado', 'pelado'];
    const order = hairs.map((x, i) => [x, r()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    const eyes = Object.keys(EYES);
    return NAMES.map((n, i) => {
      const fem = ['Ana', 'Carla', 'Elena', 'Gabi', 'Inés', 'Lola', 'Nora', 'Paula', 'Rosa', 'Tina', 'Vero', 'Yami', 'Zoe'].includes(n);
      const pelo = order[i];
      const p = {
        n, pelo, largo: pelo !== 'pelado' && (fem ? r() < .7 : r() < .2),
        anteojos: r() < .3, sombrero: pelo !== 'pelado' ? r() < .22 : r() < .3,
        barba: !fem && r() < .38, bigote: !fem && r() < .4, aros: fem ? r() < .55 : r() < .1,
        ojos: eyes[Math.floor(r() * 3)], pecas: r() < .25, sonrie: r() < .55,
        skin: SKIN[Math.floor(r() * SKIN.length)], bg: BGS[i % BGS.length], fem
      };
      return p;
    });
  }
  function face(p) {
    const hc = HAIR[p.pelo] || '#000', ec = EYES[p.ojos];
    let s = `<svg viewBox="0 0 100 116" aria-hidden="true"><rect width="100" height="116" fill="${p.bg}"/>`;
    // pelo de atrás (largo)
    if (p.largo) s += `<path d="M20 50C18 80 22 100 26 112H74C78 100 82 80 80 50Z" fill="${hc}"/>`;
    // cuello y hombros
    s += `<path d="M42 82H58V96H42Z" fill="${p.skin}"/><path d="M14 116C16 100 30 92 50 92S84 100 86 116Z" fill="${['#e76f51', '#2a9d8f', '#264653', '#e9c46a', '#8d99ae', '#6d597a'][NAMES.indexOf(p.n) % 6]}"/>`;
    // cabeza
    s += `<ellipse cx="50" cy="56" rx="24" ry="29" fill="${p.skin}" stroke="rgba(0,0,0,.25)" stroke-width="1"/>`;
    s += `<ellipse cx="26" cy="58" rx="4" ry="6" fill="${p.skin}"/><ellipse cx="74" cy="58" rx="4" ry="6" fill="${p.skin}"/>`;
    if (p.aros) s += `<circle cx="26" cy="66" r="2.6" fill="#f0c050" stroke="#9a7410" stroke-width=".8"/><circle cx="74" cy="66" r="2.6" fill="#f0c050" stroke="#9a7410" stroke-width=".8"/>`;
    // pelo de arriba
    if (p.pelo !== 'pelado') s += p.largo ? `<path d="M25 52C24 32 36 24 50 24S77 32 75 52C68 40 58 36 50 36S32 42 25 52Z" fill="${hc}"/>` : `<path d="M26 50C25 32 37 25 50 25S75 32 74 50C70 42 64 38 56 37 46 40 36 40 26 50Z" fill="${hc}"/>`;
    else s += `<path d="M27 56C25 50 26 46 28 44" stroke="${p.skin === SKIN[3] ? '#5a3a26' : '#c9a080'}" stroke-width="3" fill="none"/>`;
    // ojos y cejas
    s += `<ellipse cx="41" cy="55" rx="4.5" ry="3.6" fill="#fff"/><ellipse cx="59" cy="55" rx="4.5" ry="3.6" fill="#fff"/><circle cx="41" cy="55" r="2.4" fill="${ec}"/><circle cx="59" cy="55" r="2.4" fill="${ec}"/><circle cx="41" cy="55" r="1" fill="#111"/><circle cx="59" cy="55" r="1" fill="#111"/>`;
    s += `<path d="M35 48Q41 45 46 48M54 48Q59 45 65 48" stroke="${p.pelo === 'pelado' ? '#5a4030' : hc === '#c9c9c9' ? '#8a8a8a' : hc}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    if (p.anteojos) s += `<g fill="none" stroke="#1d2433" stroke-width="2"><circle cx="41" cy="55" r="7"/><circle cx="59" cy="55" r="7"/><path d="M48 55H52M34 54L27 52M66 54L73 52"/></g>`;
    // nariz, pecas, boca
    s += `<path d="M50 58Q47 66 50 67" stroke="rgba(0,0,0,.35)" stroke-width="1.6" fill="none"/>`;
    if (p.pecas) s += `<g fill="#b5653a" opacity=".7"><circle cx="36" cy="63" r="1"/><circle cx="39" cy="65" r="1"/><circle cx="34" cy="66" r="1"/><circle cx="64" cy="63" r="1"/><circle cx="61" cy="65" r="1"/><circle cx="66" cy="66" r="1"/></g>`;
    if (p.barba) s += `<path d="M28 64C30 82 40 88 50 88S70 82 72 64C66 72 58 74 50 74S34 72 28 64Z" fill="${p.pelo === 'pelado' ? '#4a3426' : hc}" opacity=".95"/>`;
    s += p.sonrie ? `<path d="M42 73Q50 80 58 73" stroke="#7a2a2a" stroke-width="2.4" fill="${p.barba ? 'none' : '#fff'}" stroke-linecap="round"/>` : `<path d="M43 75H57" stroke="#7a2a2a" stroke-width="2.4" stroke-linecap="round"/>`;
    if (p.bigote) s += `<path d="M40 70Q45 66 50 69Q55 66 60 70Q55 72 50 71Q45 72 40 70Z" fill="${p.pelo === 'pelado' ? '#4a3426' : hc}"/>`;
    // sombrero
    if (p.sombrero) s += `<path d="M22 38H78Q76 32 70 31C68 18 60 14 50 14S32 18 30 31Q24 32 22 38Z" fill="#3a3f58"/><path d="M30 31H70" stroke="#e76f51" stroke-width="3"/>`;
    return s + '</svg>';
  }
  // ---------- preguntas ----------
  const QS = [
    ['anteojos', '¿Tiene anteojos?', p => p.anteojos], ['sombrero', '¿Tiene sombrero?', p => p.sombrero],
    ['barba', '¿Tiene barba?', p => p.barba], ['bigote', '¿Tiene bigote?', p => p.bigote], ['aros', '¿Tiene aros?', p => p.aros],
    ['pelado', '¿Es pelado/a?', p => p.pelo === 'pelado'], ['largo', '¿Tiene el pelo largo?', p => p.largo],
    ['negro', '¿Tiene el pelo negro?', p => p.pelo === 'negro'], ['castano', '¿Tiene el pelo castaño?', p => p.pelo === 'castano'],
    ['rubio', '¿Es rubio/a?', p => p.pelo === 'rubio'], ['colorado', '¿Es colorado/a?', p => p.pelo === 'colorado'], ['canoso', '¿Tiene canas?', p => p.pelo === 'canoso'],
    ['azules', '¿Tiene ojos azules?', p => p.ojos === 'azules'], ['verdes', '¿Tiene ojos verdes?', p => p.ojos === 'verdes'], ['marrones', '¿Tiene ojos marrones?', p => p.ojos === 'marrones'],
    ['pecas', '¿Tiene pecas?', p => p.pecas], ['sonrie', '¿Está sonriendo?', p => p.sonrie], ['vocal', '¿Su nombre empieza con vocal?', p => /^[AEIOUÁÉÍÓÚ]/.test(p.n)]
  ];
  function adivina(H) {
    { const st = document.getElementById('st-aq') || document.head.appendChild(h('style', { id: 'st-aq' })); if (st.textContent !== CSS) st.textContent = CSS; }
    const PEOPLE = makePeople();
    const root = h('div', { class: 'aq-wrap' });
    const board = h('div', { class: 'aq-board' }), side = h('div', { class: 'aq-side' });
    root.append(board, side);
    let G = null;
    const lvl = () => H.get().lvl || 'normal';
    function newGame() {
      const ids = shuffle(PEOPLE.map((_, i) => i));
      G = { mine: ids[0], theirs: ids[1], down: new Set(), cpuLeft: new Set(PEOPLE.map((_, i) => i)), asked: new Set(), cpuAsked: new Set(), turn: Math.random() < .5 ? 0 : 1, phase: 'ask', lastQ: null, log: [], guessing: false, over: false };
      paintBoard(); renderSide();
      if (G.turn === 1) setTimeout(cpuAsk, 900);
    }
    const cards = [];
    function paintBoard() {
      board.replaceChildren(); cards.length = 0;
      PEOPLE.forEach((p, i) => {
        const c = h('button', { class: 'aq-c', type: 'button', title: p.n }, h('div', { class: 'f' }), h('div', { class: 'b' }));
        c.firstChild.innerHTML = face(p); c.firstChild.append(h('span', { text: p.n }));
        c.onclick = () => clickCard(i);
        cards.push(c); board.append(c);
      });
    }
    function syncBoard() { cards.forEach((c, i) => { c.classList.toggle('down', G.down.has(i)); c.classList.toggle('guess', G.guessing && !G.down.has(i)); }); }
    function clickCard(i) {
      if (G.over) return;
      if (G.guessing) { if (G.down.has(i)) return; return guess(i); }
      if (G.down.has(i)) G.down.delete(i); else G.down.add(i);
      SFX('flip'); syncBoard(); renderSide();
    }
    const say = (who, text, cls) => { G.log.push([who, text, cls]); };
    function status() { H.status([`Te quedan ${24 - G.down.size}`, `A la compu le quedan ${G.cpuLeft.size}`, H.get().wins ? `Ganadas ${H.get().wins}` : '']); }
    function renderSide() {
      status(); syncBoard();
      const me = PEOPLE[G.mine];
      const meBox = h('div', { class: 'aq-box' }, h('h4', { text: 'Tu personaje' }), h('div', { class: 'aq-me' }, h('div', {}), h('div', {}, h('b', { text: me.n }), h('div', { style: 'font-size:12.5px;opacity:.75', text: 'La compu tiene que adivinarlo' }))));
      meBox.querySelector('.aq-me > div').innerHTML = face(me);
      let act;
      if (G.over) act = h('div', { class: 'aq-box' }, h('b', { text: 'Partida terminada' }));
      else if (G.turn === 1 && G.phase === 'answer') {
        const q = QS.find(x => x[0] === G.lastQ);
        act = h('div', { class: 'aq-box aq-ask' }, h('h4', { text: 'Te pregunta la compu' }), h('b', { text: q[1] }), h('div', { class: 'aq-row' },
          Object.assign(h('button', { class: 'aq-b y', text: 'Sí' }), { onclick: () => answer(true) }), Object.assign(h('button', { class: 'aq-b n', text: 'No' }), { onclick: () => answer(false) })));
      } else if (G.turn === 1) act = h('div', { class: 'aq-box' }, h('b', { text: 'Piensa la compu…' }));
      else if (G.phase === 'flip') {
        act = h('div', { class: 'aq-box aq-ask' }, h('h4', { text: 'Respuesta' }), h('b', { text: G.lastAns }), h('span', { style: 'font-size:12.5px', text: 'Bajá los que no pueden ser (tocándolos) y pasá el turno.' }), h('div', { class: 'aq-row' },
          Object.assign(h('button', { class: 'aq-b alt', text: 'Bajar los que no son' }), { onclick: autoFlip }),
          Object.assign(h('button', { class: 'aq-b', text: 'Listo, le toca a la compu' }), { onclick: endTurn })));
      } else {
        act = h('div', { class: 'aq-box aq-ask' }, h('h4', { text: G.guessing ? 'Arriesgá: tocá a quién elegís' : 'Tu turno: preguntá' }),
          G.guessing ? h('div', { class: 'aq-row' }, Object.assign(h('button', { class: 'aq-b alt', text: 'Mejor no, sigo preguntando' }), { onclick: () => { G.guessing = false; renderSide(); } }))
            : h('div', { class: 'aq-qs' }, QS.map(([id, t]) => Object.assign(h('button', { class: 'aq-q', text: t, disabled: G.asked.has(id) }), { onclick: () => ask(id) }))),
          !G.guessing ? h('div', { class: 'aq-row' }, Object.assign(h('button', { class: 'aq-b', text: '¡Ya sé quién es!' }), { onclick: () => { G.guessing = true; renderSide(); } })) : null);
      }
      const lg = h('div', { class: 'aq-box aq-log' }, h('h4', { text: 'Preguntas' }), G.log.slice(-30).map(([w, t, c]) => h('div', {}, h('b', { text: w + ': ' }), h('span', { class: c || '', text: t }))));
      side.replaceChildren(meBox, act, lg);
      lg.scrollTop = 1e6;
    }
    function ask(id) {
      const q = QS.find(x => x[0] === id), yes = q[2](PEOPLE[G.theirs]);
      G.asked.add(id); G.lastQ = id; G.lastAns = `${q[1].replace(/[¿?]/g, '')}: ${yes ? 'sí' : 'no'}`; G.lastYes = yes;
      say('Vos', q[1]); say('Compu', yes ? 'Sí' : 'No', yes ? 'y' : 'n');
      G.phase = 'flip'; SFX('pop'); renderSide();
    }
    function autoFlip() { const q = QS.find(x => x[0] === G.lastQ); PEOPLE.forEach((p, i) => { if (q[2](p) !== G.lastYes) G.down.add(i); }); SFX('flip'); syncBoard(); renderSide(); }
    function endTurn() { G.phase = 'ask'; G.turn = 1; renderSide(); setTimeout(cpuAsk, 800); }
    function guess(i) {
      G.guessing = false; G.over = true;
      const ok = i === G.theirs; say('Vos', `¿Es ${PEOPLE[i].n}?`); say('Compu', ok ? '¡Sí!' : `No, era ${PEOPLE[G.theirs].n}`, ok ? 'y' : 'n');
      finish(ok);
    }
    function finish(won) {
      G.over = true; renderSide();
      const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s);
      if (won) confetti(root);
      setTimeout(() => overlay(root, won ? '¡Adivinaste!' : 'Ganó la compu', won ? `Era ${PEOPLE[G.theirs].n}.` : `La compu tenía a ${PEOPLE[G.theirs].n}.`, [btn('Otra partida', () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); }, 'primary')]), 500);
    }
    // ---------- la compu ----------
    function cpuAsk() {
      if (G.over) return;
      const left = [...G.cpuLeft];
      if (left.length === 1) { // arriesga
        const i = left[0]; const ok = i === G.mine;
        say('Compu', `¿Es ${PEOPLE[i].n}?`); say('Vos', ok ? 'Sí' : 'No', ok ? 'y' : 'n');
        if (ok) return finish(false);
        G.cpuLeft.delete(i); G.turn = 0; G.phase = 'ask'; return renderSide();
      }
      const cand = QS.filter(q => !G.cpuAsked.has(q[0])).map(q => { const y = left.filter(i => q[2](PEOPLE[i])).length; return [q, Math.abs(left.length / 2 - y), y]; }).filter(x => x[2] > 0 && x[2] < left.length);
      if (!cand.length || (lvl() === 'facil' && left.length <= 3)) { // no hay pregunta útil: arriesga uno al azar
        const i = left[Math.floor(Math.random() * left.length)], ok = i === G.mine;
        say('Compu', `¿Es ${PEOPLE[i].n}?`); say('Vos', ok ? 'Sí' : 'No', ok ? 'y' : 'n');
        if (ok) return finish(false);
        G.cpuLeft.delete(i); G.turn = 0; return renderSide();
      }
      cand.sort((a, b) => a[1] - b[1]);
      const q = lvl() === 'facil' ? cand[Math.floor(Math.random() * cand.length)][0] : lvl() === 'normal' ? cand[Math.min(cand.length - 1, Math.floor(Math.random() * 3))][0] : cand[0][0];
      G.cpuAsked.add(q[0]); G.lastQ = q[0]; G.phase = 'answer'; say('Compu', q[1]); SFX('pop'); renderSide();
    }
    function answer(yes) {
      const q = QS.find(x => x[0] === G.lastQ), truth = q[2](PEOPLE[G.mine]);
      if (yes !== truth) H.toast && H.toast(`Ojo: ${PEOPLE[G.mine].n} ${truth ? 'sí' : 'no'} cumple eso. Le contesto bien a la compu.`);
      say('Vos', truth ? 'Sí' : 'No', truth ? 'y' : 'n');
      for (const i of [...G.cpuLeft]) if (q[2](PEOPLE[i]) !== truth) G.cpuLeft.delete(i);
      G.phase = 'ask'; G.turn = 0; renderSide();
    }
    const tools = [pick('Dificultad', [['facil', 'Fácil'], ['normal', 'Normal'], ['dificil', 'Difícil']], lvl(), (v) => { const s = H.get(); s.lvl = v; H.set(s); newGame(); }), btn('Nueva partida', () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); newGame(); })];
    root.__aq = { G: () => G, P: PEOPLE, ask, answer, guess, autoFlip, endTurn };
    requestAnimationFrame(() => newGame());
    return { el: root, tools, setSkin: () => {}, help: 'Cada uno tiene un personaje secreto. En tu turno hacé una pregunta de sí o no, bajá los personajes que no pueden ser y pasá el turno. Cuando sepas quién es, tocá "¡Ya sé quién es!" y elegilo (si le errás, perdés). La compu hace lo mismo con el tuyo.' };
  }
  BM.register({ id: 'adivina', n: 'Adiviná quién', d: 'Preguntá por sí o por no y descubrí el personaje secreto de la compu antes que ella el tuyo.', c: '#2a5aa8', create: adivina, skinLabel: 'Tablero',
    skins: [['azul', 'Azul', '#2a5aa8'], ['rojo', 'Rojo', '#b8322a'], ['verde', 'Verde', '#2f7d4a']],
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#b9cdea"/><rect x="8" y="10" width="20" height="24" rx="3" fill="#fff"/><circle cx="18" cy="21" r="6" fill="#f6d3b3"/><path d="M12 19c0-6 12-6 12 0" fill="#7a4a24"/><rect x="36" y="10" width="20" height="24" rx="3" fill="#2a5aa8"/><text x="46" y="27" font-size="14" font-weight="900" text-anchor="middle" fill="#fff">?</text><rect x="8" y="38" width="20" height="20" rx="3" fill="#2a5aa8"/><rect x="36" y="38" width="20" height="20" rx="3" fill="#fff"/><circle cx="46" cy="48" r="5.5" fill="#e9b48a"/><circle cx="43.5" cy="47" r="2.4" fill="none" stroke="#1d2433"/><circle cx="48.5" cy="47" r="2.4" fill="none" stroke="#1d2433"/></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}` : 'Nunca jugaste' });
})();
