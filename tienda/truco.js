// Tienda de Base · Truco argentino (mano a mano contra la compu, sin flor)
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
  // ---- dibujos de los palos (con relieve y brillo) ----
  const DEFS = `<defs><linearGradient id="ceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#e5b53e"/><stop offset="1" stop-color="#a36e14"/></linearGradient><linearGradient id="ceS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d8ab3"/><stop offset=".45" stop-color="#f2f6ff"/><stop offset="1" stop-color="#8aa3c6"/></linearGradient><linearGradient id="ceR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e1f17"/><stop offset=".4" stop-color="#e2543f"/><stop offset="1" stop-color="#9a261c"/></linearGradient><linearGradient id="ceW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3414"/><stop offset=".45" stop-color="#a8703a"/><stop offset="1" stop-color="#5e3816"/></linearGradient><radialGradient id="ceP" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1e6cb"/></radialGradient><linearGradient id="ceB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ce-back,#a3262a)"/><stop offset="1" stop-color="var(--ce-back2,#6c1418)"/></linearGradient></defs>`;
  const SYM = {
    o: '<circle r="9.6" fill="url(#ceG)" stroke="#6e4a08" stroke-width="1"/>' + Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return `<circle cx="${(Math.cos(a) * 7.6).toFixed(2)}" cy="${(Math.sin(a) * 7.6).toFixed(2)}" r=".85" fill="#fff4c4" stroke="#8f650f" stroke-width=".3"/>`; }).join('') + '<circle r="5.4" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".8"/><path d="M0-4.2 1.1-1.2 4.2 0 1.1 1.2 0 4.2-1.1 1.2-4.2 0-1.1-1.2Z" fill="#b2421f" stroke="#6e4a08" stroke-width=".4"/><circle r="1.3" fill="#ffe680"/>',
    c: '<path d="M-8-8.6H8C8-1.8 4.6 1.6 1.7 2.7V4.6C1.7 5.6 3.8 6.3 5.8 7.6V9.6H-5.8V7.6C-3.8 6.3-1.7 5.6-1.7 4.6V2.7C-4.6 1.6-8-1.8-8-8.6Z" fill="url(#ceR)" stroke="#4a0f0a" stroke-width=".9" stroke-linejoin="round"/><rect x="-8.6" y="-10" width="17.2" height="2.6" rx="1.2" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".6"/><ellipse cy="4" rx="2.8" ry="1.3" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".4"/><rect x="-6.2" y="8.4" width="12.4" height="1.6" rx=".8" fill="url(#ceG)"/><path d="M-5-5.8C-4.6-2.5-3-1 -1.4-.2" stroke="#ffc0b0" stroke-width="1" fill="none" stroke-linecap="round" opacity=".8"/><circle cx="0" cy="-4.6" r="1.5" fill="#2a5aa8" stroke="#f0c050" stroke-width=".5"/>',
    e: '<g transform="scale(.82)"><path d="M0-15L2.1-11.6V7H-2.1V-11.6Z" fill="url(#ceS)" stroke="#2b3f5e" stroke-width=".7" stroke-linejoin="round"/><path d="M0-12V6" stroke="#5d7aa0" stroke-width=".6"/><path d="M-8.4 6.4Q-4.6 9.6 0 7.8Q4.6 9.6 8.4 6.4Q5 11.4 0 10.2Q-5 11.4-8.4 6.4Z" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".6"/><circle cx="-8.4" cy="6.4" r="1.2" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".4"/><circle cx="8.4" cy="6.4" r="1.2" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".4"/><rect x="-1.4" y="10" width="2.8" height="4.6" rx=".6" fill="#6b3a1e" stroke="#3a1e0c" stroke-width=".4"/><path d="M-1.4 11.4h2.8M-1.4 12.8h2.8" stroke="#a46a3a" stroke-width=".5"/><circle cy="15.8" r="1.9" fill="url(#ceG)" stroke="#6e4a08" stroke-width=".5"/></g>',
    b: '<g transform="scale(.9)"><path d="M-2.4 14C-2.8 10-3.6 7-3.3 4-4.4 3-4.6 1.6-3.8.8-4.4-2.4-4.9-5-5.4-7.2-6.4-8-6.4-10-5-11.2-3.8-13.2 3.8-13.2 5-11.2 6.4-10 6.4-8 5.4-7.2 4.9-5 4.4-2 3.8.4 4.6 1.4 4.4 3 3.3 3.8 3.6 7 2.8 10 2.4 14Z" fill="url(#ceW)" stroke="#3a2008" stroke-width=".9" stroke-linejoin="round"/><path d="M-4.6-10.4C-3-12.2 3-12.2 4.6-10.4" stroke="#e9b77a" stroke-width="1.1" fill="none" opacity=".7"/><ellipse cx="-2.2" cy="-6" rx="1.5" ry="1" fill="#4a2a10"/><ellipse cx="2.4" cy="-1.6" rx="1.3" ry=".9" fill="#4a2a10"/><ellipse cx="-1.2" cy="3.4" rx="1.1" ry=".8" fill="#4a2a10"/><ellipse cx="1" cy="8.6" rx=".9" ry=".6" fill="#4a2a10"/><path d="M4.6 1.6L7.4.2 7.8 1.8 4.4 3Z" fill="#7a4b22" stroke="#3a2008" stroke-width=".5"/><path d="M-4.4-2L-7.2-3.6-7.6-2-4.2-.6Z" fill="#7a4b22" stroke="#3a2008" stroke-width=".5"/><path d="M7.6 0.4Q10 -1.6 10.8.4Q9.4 1.8 7.8 1.6Z" fill="#4f9a3a"/></g>'
  };
  const PCOL = { o: '#a8741a', c: '#b02a20', e: '#2a5aa8', b: '#3d7a2a' };
  // posición, tamaño y giro de cada palo según el número (espadas y bastos se cruzan, como en los mazos de siempre)
  const PIPS = {
    1: [[30, 46, 2.3, 0]], 2: [[30, 26, 1, 0], [30, 66, 1, 0]], 3: [[30, 22, 1, 0], [30, 46, 1, 0], [30, 70, 1, 0]],
    4: [[19, 26, 1, 0], [41, 26, 1, 0], [19, 66, 1, 0], [41, 66, 1, 0]], 5: [[19, 23, .95, 0], [41, 23, .95, 0], [30, 46, .95, 0], [19, 69, .95, 0], [41, 69, .95, 0]],
    6: [[19, 22, .92, 0], [41, 22, .92, 0], [19, 46, .92, 0], [41, 46, .92, 0], [19, 70, .92, 0], [41, 70, .92, 0]],
    7: [[19, 19, .78, 0], [41, 19, .78, 0], [30, 33, .78, 0], [19, 47, .78, 0], [41, 47, .78, 0], [19, 72, .78, 0], [41, 72, .78, 0]],
    8: [[19, 19, .76, 0], [41, 19, .76, 0], [30, 32, .76, 0], [19, 45, .76, 0], [41, 45, .76, 0], [30, 58.5, .76, 0], [19, 72, .76, 0], [41, 72, .76, 0]],
    9: [[18, 23, .82, 0], [30, 23, .82, 0], [42, 23, .82, 0], [18, 46, .82, 0], [30, 46, .82, 0], [42, 46, .82, 0], [18, 69, .82, 0], [30, 69, .82, 0], [42, 69, .82, 0]]
  };
  const TILT = { e: [-14, 14], b: [14, -14] };
  // marco con cortes: oros sin cortes, copas uno, espadas dos, bastos tres (como en los mazos de siempre)
  function frame(s) {
    const cuts = { o: 0, c: 1, e: 2, b: 3 }[s], col = PCOL[s];
    let d = '';
    for (const y of [8.5, 83.5]) {
      const xs = [6.5]; for (let i = 1; i <= cuts; i++) { const cx = 6.5 + (47 * i) / (cuts + 1); xs.push(cx - 2.6, cx + 2.6); } xs.push(53.5);
      for (let i = 0; i < xs.length; i += 2) d += `M${xs[i]} ${y}H${xs[i + 1]}`;
    }
    d += 'M6.5 8.5V83.5M53.5 8.5V83.5';
    return `<path d="${d}" stroke="${col}" stroke-width="1.5" fill="none"/>`;
  }
  // figuras: sota de pie, caballo con jinete y rey con manto y corona (dibujos propios)
  const ROPA = { o: ['#c8372d', '#2a5aa8'], c: ['#2a5aa8', '#c8372d'], e: ['#3d7a2a', '#c8372d'], b: ['#d9a640', '#2a5aa8'] };
  function face(cx, cy, r, beard) {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f2c9a0" stroke="#7a4f2a" stroke-width=".6"/><circle cx="${cx - r * .35}" cy="${cy - r * .1}" r="${r * .11}" fill="#222"/><circle cx="${cx + r * .35}" cy="${cy - r * .1}" r="${r * .11}" fill="#222"/><path d="M${cx - r * .3} ${cy + r * .42}Q${cx} ${cy + r * .62} ${cx + r * .3} ${cy + r * .42}" stroke="#8a3b2a" stroke-width=".6" fill="none"/>` +
      (beard ? `<path d="M${cx - r * .92} ${cy + r * .1}Q${cx - r * .7} ${cy + r * 1.7} ${cx} ${cy + r * 1.9}Q${cx + r * .7} ${cy + r * 1.7} ${cx + r * .92} ${cy + r * .1}Q${cx} ${cy + r * .9} ${cx - r * .92} ${cy + r * .1}Z" fill="${beard}"/>` : '');
  }
  function figure(s, n) {
    const [c1, c2] = ROPA[s], G = 'url(#ceG)', sym = (x, y, sc) => `<g transform="translate(${x} ${y}) scale(${sc})">${SYM[s]}</g>`;
    if (n === 10) return `<path d="M24.5 80V62H28V80ZM32 80V62H35.5V80Z" fill="${c2}"/><path d="M23 81h6M31 81h6" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M21 64L23.5 40Q30 35 36.5 40L39 64Z" fill="${c1}" stroke="#3a2a1a" stroke-width=".6"/><path d="M21.6 55H38.4" stroke="${G}" stroke-width="2.4"/><path d="M23.5 40Q18 46 17.5 58L21 58Q21.5 48 25 44Z" fill="${c2}"/><path d="M36.5 40Q42 46 42.5 58L39 58Q38.5 48 35 44Z" fill="${c2}"/>` +
      `<path d="M26 40Q30 43 34 40L33 37H27Z" fill="#fff" stroke="#999" stroke-width=".4"/>${face(30, 31.5, 5.2)}<path d="M24 29Q30 21 37 28L38.5 30H23Z" fill="${c2}" stroke="#2a1a10" stroke-width=".5"/><path d="M36 27Q42 20 45 22Q40 24 37.5 28Z" fill="#f0f0f0" stroke="#999" stroke-width=".3"/>` + sym(30, 49, .78);
    if (n === 11) return `<path d="M13 62Q12 52 20 49L38 47Q46 46 48 54L47 64Q46 69 40 69H20Q14 69 13 62Z" fill="#c8a07a" stroke="#4a2e18" stroke-width=".7"/>` +
      `<path d="M44 52Q48 40 52 36L51 30Q47 28 44 32L39 47Z" fill="#c8a07a" stroke="#4a2e18" stroke-width=".7"/><path d="M47 30L49 26 50.5 30" fill="#c8a07a" stroke="#4a2e18" stroke-width=".5"/><circle cx="49.5" cy="33" r=".7" fill="#222"/><path d="M45 34Q41 38 41 46" stroke="#5a3a20" stroke-width="2" fill="none"/>` +
      `<path d="M17 68V81M22 68V81M38 68V81M43 68V81" stroke="#a37e5a" stroke-width="2.6" stroke-linecap="round"/><path d="M13 58Q8 62 9 72" stroke="#5a3a20" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
      `<path d="M21 48H39L37 58H23Z" fill="${c2}" stroke="#3a2a1a" stroke-width=".5"/><path d="M21 52H39" stroke="${G}" stroke-width="1.6"/>` +
      `<path d="M24 48L25.5 30Q30 26 34.5 30L36 48Z" fill="${c1}" stroke="#3a2a1a" stroke-width=".6"/><path d="M26 58V66" stroke="${c1}" stroke-width="3.4" stroke-linecap="round"/>${face(30, 22.5, 4.6, '#6b3a1e')}<path d="M24.5 21Q30 14 35.5 21Z" fill="${c2}" stroke="#2a1a10" stroke-width=".5"/>` + sym(18, 30, .72);
    return `<path d="M17 81L20 44Q30 37 40 44L43 81Z" fill="${c1}" stroke="#3a2a1a" stroke-width=".6"/><path d="M28 44V81" stroke="${c2}" stroke-width="5"/><path d="M28 44V81" stroke="${G}" stroke-width="1" stroke-dasharray="2 2"/>` +
      `<path d="M19 46Q30 52 41 46L40 42Q30 47 20 42Z" fill="#fbf8f2" stroke="#999" stroke-width=".4"/><g fill="#222"><circle cx="23" cy="45.5" r=".5"/><circle cx="27" cy="47" r=".5"/><circle cx="33" cy="47" r=".5"/><circle cx="37" cy="45.5" r=".5"/></g>` +
      `${face(30, 33, 5.4, '#e8e2d6')}<path d="M24 28L25 20 27.6 24.6 30 18.6 32.4 24.6 35 20 36 28Z" fill="${G}" stroke="#6e4a08" stroke-width=".6"/><circle cx="30" cy="22" r=".9" fill="#c8372d"/><path d="M24 28H36" stroke="${G}" stroke-width="2"/>` +
      `<path d="M44 40V78" stroke="${G}" stroke-width="1.6"/><circle cx="44" cy="39" r="1.8" fill="${G}" stroke="#6e4a08" stroke-width=".4"/>` + sym(30, 60, .82);
  }
  // as: el palo grande con un adorno
  function ace(s) {
    const deco = {
      o: '<path d="M14 58Q8 44 16 30M46 58Q52 44 44 30" stroke="#3d7a2a" stroke-width="1.4" fill="none"/>' + [0, 1, 2, 3].map(i => `<ellipse cx="${13.5 + i * .4}" cy="${54 - i * 7}" rx="1.4" ry="2.6" transform="rotate(-30 ${13.5 + i * .4} ${54 - i * 7})" fill="#4f9a3a"/><ellipse cx="${46.5 - i * .4}" cy="${54 - i * 7}" rx="1.4" ry="2.6" transform="rotate(30 ${46.5 - i * .4} ${54 - i * 7})" fill="#4f9a3a"/>`).join(''),
      c: '<path d="M30 20Q34 16 38 19Q34 21 30 20Q26 21 22 19Q26 16 30 20Z" fill="#f0c050" stroke="#6e4a08" stroke-width=".4"/>',
      e: '<path d="M14 70Q22 64 30 68Q38 72 46 66L46 72Q38 78 30 74Q22 70 14 76Z" fill="#c8372d" stroke="#6e1a14" stroke-width=".5"/>',
      b: ''
    }[s];
    return deco + `<g transform="translate(30 46) scale(2.3)">${SYM[s]}</g>`;
  }
  const CARD_SVG = new Map();
  function cardSvg(k) {
    const key = k.j ? 'J' : k.s + k.n; if (CARD_SVG.has(key)) return CARD_SVG.get(key);
    let inner = '';
    if (k.j) inner = `<rect x="6.5" y="8.5" width="47" height="75" fill="none" stroke="#7b3fb0" stroke-width="1.5"/><path d="M18 50L22 30 30 40 38 30 42 50Z" fill="#7b3fb0"/><path d="M22 30L18 22M38 30L42 22M30 40V28" stroke="#7b3fb0" stroke-width="1.4"/><circle cx="18" cy="21" r="2.2" fill="url(#ceG)"/><circle cx="42" cy="21" r="2.2" fill="url(#ceG)"/><circle cx="30" cy="26.5" r="2.2" fill="url(#ceG)"/>${face(30, 56, 7)}<path d="M20 50Q30 46 40 50" stroke="#f0c050" stroke-width="2.4" fill="none"/><text x="30" y="77" font-size="7" font-weight="800" text-anchor="middle" fill="#7b3fb0" font-family="Georgia,serif">COMODÍN</text>`;
    else {
      inner = frame(k.s);
      if (k.n >= 10) inner += figure(k.s, k.n);
      else if (k.n === 1) inner += ace(k.s);
      else PIPS[k.n].forEach(([x, y, sc, _], i) => { const tl = TILT[k.s] ? TILT[k.s][(i + (k.n > 3 ? Math.floor(i / 2) : 0)) % 2] : 0; inner += `<g transform="translate(${x} ${y}) rotate(${k.n === 2 || k.n === 3 ? 0 : tl}) scale(${sc * (TILT[k.s] ? (k.n === 2 ? 1.3 : k.n === 3 ? 1.05 : 1) : 1)})">${SYM[k.s]}</g>`; });
      const lab = String(k.n), col = PCOL[k.s];
      inner += `<rect x="1.8" y="1.8" width="9.4" height="11.8" rx="2" fill="#fffdf5"/><text x="6.5" y="11.4" font-size="10" font-weight="800" text-anchor="middle" fill="${col}" font-family="Georgia,'Times New Roman',serif">${lab}</text>` +
        `<rect x="48.8" y="78.4" width="9.4" height="11.8" rx="2" fill="#fffdf5"/><text x="53.5" y="88" font-size="10" font-weight="800" text-anchor="middle" fill="${col}" font-family="Georgia,'Times New Roman',serif">${lab}</text>`;
    }
    const s = `<svg viewBox="0 0 60 92" aria-hidden="true">${DEFS}<rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="url(#ceP)" stroke="#3a3328" stroke-width="1"/>${inner}</svg>`;
    CARD_SVG.set(key, s); return s;
  }
  const BACK_SVG = `<svg viewBox="0 0 60 92" aria-hidden="true">${DEFS}<defs><pattern id="ce-bp" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="url(#ceB)"/><path d="M0 3.5H7M3.5 0V7" stroke="rgba(255,230,180,.28)" stroke-width=".8"/><circle cx="3.5" cy="3.5" r=".9" fill="rgba(255,230,180,.45)"/></pattern></defs><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#fbf6ea" stroke="#3a3328" stroke-width="1"/><rect x="3.5" y="3.5" width="53" height="85" rx="3.5" fill="url(#ce-bp)"/><rect x="5.5" y="5.5" width="49" height="81" rx="2.5" fill="none" stroke="rgba(255,230,180,.6)" stroke-width=".8"/><ellipse cx="30" cy="46" rx="13" ry="17" fill="url(#ceB)" stroke="#f0c050" stroke-width="1.4"/><ellipse cx="30" cy="46" rx="9.5" ry="13.5" fill="none" stroke="rgba(255,230,180,.7)" stroke-width=".7"/><g transform="translate(30 46) scale(.62)">${'<path d="M0-12C4-6 4-2 0 0C-4-2-4-6 0-12ZM0 12C4 6 4 2 0 0C-4 2-4 6 0 12ZM-12 0C-6 4-2 4 0 0C-2-4-6-4-12 0ZM12 0C6 4 2 4 0 0C2-4 6-4 12 0Z" fill="#f0c050"/><circle r="2.4" fill="#fff4c4"/>'}</g></svg>`;
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
.ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#2f7d4a,#1b5232 70%,#123a23);--ce-back:#a3262a;--ce-back2:#6c1418}
[data-skin="madera"].ce-table,[data-skin="madera"] .ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#8a5a33,#5e3b1f 70%,#3e2614);--ce-back:#1f4e8a;--ce-back2:#10294a}
[data-skin="azul"].ce-table,[data-skin="azul"] .ce-table{--ce-felt:radial-gradient(120% 90% at 50% 40%,#2b5f9e,#1b3f6e 70%,#122a4a);--ce-back:#a3322b;--ce-back2:#5e1a16}
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
.tr-wrap{display:grid;grid-template-columns:1fr auto;gap:14px;padding:12px 14px;height:100%;box-sizing:border-box}
.tr-main{display:grid;grid-template-rows:auto 1fr auto auto;gap:8px;min-width:0;min-height:0}
.tr-side{display:grid;align-content:start;gap:10px;width:clamp(150px,16vw,210px)}
.tr-player{display:flex;align-items:center;justify-content:center;gap:12px;position:relative}
.tr-mesa{display:grid;grid-template-columns:repeat(3,var(--cw));grid-template-rows:auto auto;gap:10px calc(var(--cw)*.35);justify-content:center;align-content:center}
.tr-mesa .ce-slot{opacity:.35}
.tr-mesa .win{box-shadow:0 0 0 3px #ffd34d,0 6px 14px -4px rgba(0,0,0,.6)}
.tr-mesa .lose{opacity:.55}
.tr-bub{position:absolute;padding:6px 12px;border-radius:14px;background:#fff;color:#2b2210;font-weight:800;font-size:15px;box-shadow:0 6px 18px -6px rgba(0,0,0,.6);animation:ce-pop .25s ease;white-space:nowrap;z-index:5}
.tr-bub::after{content:"";position:absolute;left:24px;border:7px solid transparent}
.tr-bub.top{top:100%;margin-top:8px}.tr-bub.top::after{bottom:100%;border-bottom-color:#fff}
.tr-bub.bot{bottom:100%;margin-bottom:8px}.tr-bub.bot::after{top:100%;border-top-color:#fff}
.tr-score{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:rgba(0,0,0,.25);border-radius:14px;padding:10px}
.tr-score b{display:block;text-align:center;font-size:13px}
.tr-score .n{font-size:28px;font-weight:800;text-align:center;line-height:1.1}
.tr-tally{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;min-height:22px}
.tr-tally svg{width:22px;height:22px}
.tr-state{font-size:12.5px;line-height:1.45;background:rgba(0,0,0,.22);border-radius:12px;padding:8px 10px}
.tr-acts{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.tr-acts .ce-b{padding:7px 12px;font-size:13.5px}
.tr-hint{text-align:center;font-size:13px;font-weight:700;min-height:18px}
.tr-log{font-size:12px;opacity:.9;max-height:200px;overflow:auto;display:grid;gap:2px;align-content:start;background:rgba(0,0,0,.18);border-radius:12px;padding:8px 10px}
`;
  const RANK = (k) => { const { s, n } = k;
    if (n === 1 && s === 'e') return 14; if (n === 1 && s === 'b') return 13; if (n === 7 && s === 'e') return 12; if (n === 7 && s === 'o') return 11;
    if (n === 3) return 10; if (n === 2) return 9; if (n === 1) return 8; if (n === 12) return 7; if (n === 11) return 6; if (n === 10) return 5; if (n === 7) return 4; if (n === 6) return 3; if (n === 5) return 2; return 1; };
  const ENV = (k) => k.n >= 10 ? 0 : k.n;
  function envido(cards) {
    let best = 0;
    for (let i = 0; i < cards.length; i++) { best = Math.max(best, ENV(cards[i])); for (let j = i + 1; j < cards.length; j++) if (cards[i].s === cards[j].s) best = Math.max(best, 20 + ENV(cards[i]) + ENV(cards[j])); }
    return best;
  }
  const ENAME = { envido: 'Envido', real: 'Real envido', falta: 'Falta envido' };
  const TNAME = { 2: '¡Truco!', 3: '¡Quiero retruco!', 4: '¡Quiero vale cuatro!' };
  function tally(n) { // porotos de a 5, dibujados como fósforos
    const out = []; let left = n;
    while (left > 0) { const k = Math.min(5, left); left -= k;
      const L = ['M4 4V18', 'M4 4H18', 'M18 4V18', 'M4 18H18', 'M5 17L17 5'].slice(0, k).map(d => `<path d="${d}" stroke="#f0d9a8" stroke-width="2.4" stroke-linecap="round"/>`).join('');
      const s = h('span'); s.innerHTML = `<svg viewBox="0 0 22 22">${L}</svg>`; out.push(s); }
    return out;
  }
  function truco(H) {
    ceStyle('st-tr', CSS);
    const root = h('div', { class: 'ce-table' });
    const wrap = h('div', { class: 'tr-wrap' }); root.append(wrap);
    const target = () => +(H.get().meta || 15);
    let G = null, T = null, busy = false, bubbles = [null, null], log = [];
    const other = (p) => 1 - p;
    function newMatch() { G = { score: [0, 0], mano: Math.random() < .5 ? 0 : 1, hands: 0 }; log = []; newHand(); }
    function newHand() {
      const d = mazo(false);
      G.hands++;
      T = { cards: [[], []], played: [[], []], baza: 0, turn: G.mano, wins: [], lvl: 1, lvlBy: -1, pend: null, envDone: false, saved: null, over: false, env0: [0, 0] };
      for (let i = 0; i < 3; i++) for (const p of [G.mano, other(G.mano)]) T.cards[p].push(d.pop());
      T.env0 = [envido(T.cards[0]), envido(T.cards[1])];
      bubbles = [null, null]; busy = false;
      addLog(`— Mano ${G.hands}: ${G.mano === 0 ? 'sos mano' : 'es mano la compu'}`);
      SFX('deal'); render(); kick();
    }
    const addLog = (t) => { log.push(t); if (log.length > 40) log.shift(); };
    function say(p, text) { bubbles[p] = text; addLog(`${p === 0 ? 'Vos' : 'Compu'}: ${text}`); SFX('pop'); }
    function points(p, n, why) { if (n <= 0) return; G.score[p] += n; addLog(`${p === 0 ? 'Vos' : 'Compu'} +${n} (${why})`); }
    // ---------- qué se puede cantar ----------
    const playedCount = (p) => T.played[p].filter(Boolean).length;
    const canEnvido = (p) => !T.envDone && T.baza === 0 && !T.played[p][0] && T.lvl === 1 && (!T.pend || (T.pend.kind === 'truco' && T.pend.to === p && T.pend.lvl === 2));
    const canTruco = (p) => !T.over && T.lvl < 4 && T.lvlBy !== p && (!T.pend ? T.turn === p : (T.pend.kind === 'truco' && T.pend.to === p));
    const envRaises = (seq) => { const o = []; if (seq.length === 1 && seq[0] === 'envido') o.push('envido'); if (!seq.includes('real') && !seq.includes('falta')) o.push('real'); if (!seq.includes('falta')) o.push('falta'); return o; };
    function envValue(seq, accepted) {
      const lead = Math.max(...G.score), falta = Math.max(1, target() - lead);
      if (accepted) { if (seq.includes('falta')) return falta; return seq.reduce((a, c) => a + (c === 'real' ? 3 : 2), 0); }
      const prev = seq.slice(0, -1); if (!prev.length) return 1;
      return prev.reduce((a, c) => a + (c === 'real' ? 3 : 2), 0);
    }
    // ---------- acciones (las usan vos y la compu) ----------
    function callEnvido(p, kind) {
      if (T.pend && T.pend.kind === 'truco') { T.saved = T.pend; T.pend = null; } // "el envido está primero"
      const seq = T.pend && T.pend.kind === 'envido' ? [...T.pend.seq, kind] : [kind];
      T.pend = { kind: 'envido', seq, by: p, to: other(p) };
      say(p, kind === 'envido' && seq.length === 2 ? 'Envido envido' : ENAME[kind]);
    }
    function answerEnvido(p, yes) {
      const seq = T.pend.seq, by = T.pend.by; T.pend = null; T.envDone = true;
      if (!yes) { say(p, 'No quiero'); points(by, envValue(seq, false), 'envido no querido'); }
      else {
        say(p, 'Quiero');
        const e = T.env0, win = e[0] === e[1] ? G.mano : (e[0] > e[1] ? 0 : 1), v = envValue(seq, true);
        addLog(`Envido: vos ${e[0]}, compu ${e[1]}`);
        setTimeout(() => { bubbles[G.mano] = `${e[G.mano]}`; bubbles[other(G.mano)] = e[other(G.mano)] > e[G.mano] ? `${e[other(G.mano)]} son mejores` : 'Son buenas'; render(); }, 500);
        points(win, v, 'envido');
      }
      if (T.saved) { T.pend = T.saved; T.saved = null; }
      checkMatch();
    }
    function callTruco(p) {
      const lvl = (T.pend && T.pend.kind === 'truco') ? T.pend.lvl + 1 : T.lvl + 1;
      if (T.pend && T.pend.kind === 'truco') { T.lvl = T.pend.lvl; T.lvlBy = T.pend.by; } // subir es querer lo anterior
      T.pend = { kind: 'truco', lvl, by: p, to: other(p) };
      say(p, TNAME[lvl]);
    }
    function answerTruco(p, yes) {
      const pd = T.pend; T.pend = null;
      if (yes) { say(p, 'Quiero'); T.lvl = pd.lvl; T.lvlBy = pd.by; }
      else { say(p, 'No quiero'); points(pd.by, T.lvl, 'truco no querido'); endHand(); }
    }
    function mazoOut(p) { say(p, 'Me voy al mazo'); points(other(p), T.lvl + (T.baza === 0 && !T.envDone && !playedCount(p) && p === G.mano ? 1 : 0), 'se fue al mazo'); endHand(); }
    function playCard(p, k) {
      T.cards[p] = T.cards[p].filter(x => x !== k); T.played[p][T.baza] = k; SFX('place');
      const o = other(p);
      if (!T.played[o][T.baza]) { T.turn = o; return; }
      // se jugaron las dos de esta baza
      const a = RANK(T.played[0][T.baza]), b = RANK(T.played[1][T.baza]);
      const w = a === b ? -1 : (a > b ? 0 : 1);
      T.wins[T.baza] = w;
      const res = handWinner();
      if (res !== null) { setTimeout(() => { points(res, T.lvl, T.lvl === 1 ? 'la mano' : `truco (${T.lvl})`); endHand(); }, 700); T.over = true; return; }
      T.baza++;
      T.turn = w === -1 ? G.mano : w;
    }
    function handWinner() {
      const W = T.wins;
      const c0 = W.filter(x => x === 0).length, c1 = W.filter(x => x === 1).length;
      if (c0 >= 2) return 0; if (c1 >= 2) return 1;
      if (W.length >= 2) {
        if (W[0] === -1 && W[1] !== -1) return W[1];
        if (W[0] !== -1 && W[1] === -1) return W[0];
      }
      if (W.length === 3) { if (W[2] === -1) return W[0] !== -1 ? W[0] : G.mano; return W[2]; }
      return null;
    }
    function endHand() {
      T.over = true; T.pend = null; busy = true; render();
      if (checkMatch()) return;
      setTimeout(() => { G.mano = other(G.mano); newHand(); }, 1900);
    }
    function checkMatch() {
      status();
      const t = target(); if (G.score[0] < t && G.score[1] < t) return false;
      T.over = true; busy = true; render();
      const won = G.score[0] >= t; const s = H.get(); s.played = (s.played || 0) + 1; if (won) s.wins = (s.wins || 0) + 1; H.set(s);
      setTimeout(() => { if (won) confetti(root); overlay(root, won ? '¡Ganaste el partido!' : 'Ganó la compu', `${G.score[0]} a ${G.score[1]}`, [btn('Otro partido', () => { closeOver(); newMatch(); }, 'primary')]); }, 900);
      return true;
    }
    const closeOver = () => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
    // ---------- turno de quien corresponda ----------
    function actor() { if (T.over) return -1; if (T.pend) return T.pend.to; return T.turn; }
    function kick() { render(); if (actor() === 1 && !busy) { busy = true; setTimeout(() => { busy = false; cpu(); }, 950); } }
    function act(fn) { if (busy || actor() !== 0) return; bubbles = [null, null]; fn(); kick(); }
    // ---------- la compu ----------
    function est(p) { // chances de ganar la mano
      const r = T.cards[p].map(RANK).sort((a, b) => b - a), W = T.wins, ob = T.played[other(p)][T.baza];
      if (ob && T.played[p][T.baza] == null) { const beat = r.some(x => x > RANK(ob)); if (T.baza === 2 || (T.baza === 1 && W[0] === other(p))) return beat ? .95 : (r.some(x => x === RANK(ob)) ? .5 : .05); }
      if (T.baza === 0) return Math.min(1, ((r[0] || 0) + (r[1] || 0) * .8 + (r[2] || 0) * .3) / 26);
      if (T.baza === 1) { const top = (r[0] || 0) / 14; if (W[0] === p) return .55 + top * .45; if (W[0] === -1) return top; return Math.pow(top, 1.6) * .7; }
      return (r[0] || 0) / 14 * (W.includes(p) ? 1 : .8);
    }
    function cpu() {
      if (!T || T.over || actor() !== 1) return;
      bubbles[0] = null;
      const e = T.env0[1], s = est(1), rnd = Math.random();
      if (T.pend && T.pend.kind === 'envido') {
        const seq = T.pend.seq, last = seq[seq.length - 1], need = last === 'falta' ? 30 : last === 'real' ? 28 : 26;
        const opts = envRaises(seq);
        if (e >= 31 && opts.length && rnd < .6) callEnvido(1, e >= 33 && opts.includes('falta') ? 'falta' : opts.includes('real') ? 'real' : opts[0]);
        else answerEnvido(1, e >= need || (G.mano === 1 && e >= need - 2));
        return kick();
      }
      if (T.pend && T.pend.kind === 'truco') {
        if (canEnvido(1) && e >= 27) { callEnvido(1, e >= 31 ? 'real' : 'envido'); return kick(); }
        if (s > .8 && T.pend.lvl < 4 && rnd < .7) { callTruco(1); return kick(); }
        answerTruco(1, s > .42 || rnd < .08); return kick();
      }
      // es mi turno de jugar
      if (canEnvido(1) && !T.played[1][0]) {
        if (e >= 33 && G.score[1] < G.score[0]) { callEnvido(1, 'falta'); return kick(); }
        if (e >= 30) { callEnvido(1, rnd < .5 ? 'real' : 'envido'); return kick(); }
        if (e >= 27 || (G.mano === 1 && rnd < .08)) { callEnvido(1, 'envido'); return kick(); }
      }
      if (canTruco(1) && (s > .66 || (rnd < .07 && T.lvl === 1))) { callTruco(1); return kick(); }
      if (s < .08 && T.lvl >= 3 && T.baza > 0) { mazoOut(1); return; }
      // qué carta tirar
      const mine = T.cards[1].slice().sort((a, b) => RANK(a) - RANK(b)), ob = T.played[0][T.baza];
      let k;
      if (ob) { const r = RANK(ob); k = mine.find(x => RANK(x) > r) || (T.baza > 0 && T.wins[0] === 1 && mine.find(x => RANK(x) === r)) || mine[0]; }
      else if (T.baza === 0) k = mine.length === 3 ? mine[1] : mine[0];
      else k = mine[mine.length - 1];
      playCard(1, k); kick();
    }
    // ---------- dibujo ----------
    function status() { H.status([`Vos ${G.score[0]}`, `Compu ${G.score[1]}`, `A ${target()}`]); }
    function render() {
      status();
      const a = actor();
      const bub = (p, cls) => bubbles[p] ? h('div', { class: 'tr-bub ' + cls, text: bubbles[p] }) : null;
      const cpuRow = h('div', { class: 'tr-player' }, h('span', { class: 'ce-tag' + (a === 1 ? ' turn' : ''), text: 'Compu' + (G.mano === 1 ? ' · mano' : '') }), h('div', { class: 'ce-row' }, T.cards[1].map(k => cardEl(k, { back: !T.over || !T.cards[1].length ? true : false }))), bub(1, 'top'));
      const mesa = h('div', { class: 'tr-mesa' });
      for (const p of [1, 0]) for (let b = 0; b < 3; b++) {
        const k = T.played[p][b];
        const w = T.wins[b];
        mesa.append(k ? cardEl(k, { cls: w === undefined || w === -1 ? '' : (w === p ? 'win' : 'lose') }) : h('div', { class: 'ce-slot' }));
      }
      const mine = a === 0 && !T.pend;
      const hand = h('div', { class: 'tr-player' }, h('span', { class: 'ce-tag' + (a === 0 ? ' turn' : ''), text: 'Vos' + (G.mano === 0 ? ' · mano' : '') }),
        h('div', { class: 'ce-row' }, T.cards[0].map(k => cardEl(k, { click: mine && !busy ? () => act(() => playCard(0, k)) : null }))), bub(0, 'bot'));
      // botones según el momento
      const B = (t, fn, cls) => Object.assign(h('button', { class: 'ce-b ' + (cls || ''), text: t, disabled: busy }), { onclick: () => act(fn) });
      const acts = [];
      if (a === 0 && !T.over) {
        if (T.pend && T.pend.kind === 'envido') {
          acts.push(B('Quiero', () => answerEnvido(0, true), 'hot'), B('No quiero', () => answerEnvido(0, false)));
          for (const r of envRaises(T.pend.seq)) acts.push(B(r === 'envido' ? 'Envido' : ENAME[r], () => callEnvido(0, r)));
        } else if (T.pend && T.pend.kind === 'truco') {
          acts.push(B('Quiero', () => answerTruco(0, true), 'hot'), B('No quiero', () => answerTruco(0, false)));
          if (T.pend.lvl < 4) acts.push(B(T.pend.lvl === 2 ? 'Quiero retruco' : 'Quiero vale cuatro', () => callTruco(0)));
          if (canEnvido(0)) acts.push(B('Envido', () => callEnvido(0, 'envido')), B('Real envido', () => callEnvido(0, 'real')), B('Falta envido', () => callEnvido(0, 'falta')));
        } else {
          if (canEnvido(0)) acts.push(B('Envido', () => callEnvido(0, 'envido')), B('Real envido', () => callEnvido(0, 'real')), B('Falta envido', () => callEnvido(0, 'falta')));
          if (canTruco(0)) acts.push(B(T.lvl === 1 ? 'Truco' : T.lvl === 2 ? 'Quiero retruco' : 'Quiero vale cuatro', () => callTruco(0), 'hot'));
          acts.push(B('Irse al mazo', () => mazoOut(0), 'red'));
        }
      }
      const hint = h('div', { class: 'tr-hint', text: T.over ? '' : a === 1 ? 'Piensa la compu…' : T.pend ? (T.pend.kind === 'envido' ? `Te cantaron ${T.pend.seq.map(x => ENAME[x]).join(' + ')}: tenés ${T.env0[0]} de envido` : `Te cantaron ${TNAME[T.pend.lvl].replace(/[¡!]/g, '')}`) : `Tu turno: tirá una carta${canEnvido(0) ? ` · tenés ${T.env0[0]} de envido` : ''}` });
      const main = h('div', { class: 'tr-main' }, cpuRow, mesa, hand, h('div', {}, hint, h('div', { class: 'tr-acts' }, acts)));
      const score = h('div', { class: 'tr-score' },
        h('div', {}, h('b', { text: 'Vos' }), h('div', { class: 'n', text: String(G.score[0]) }), h('div', { class: 'tr-tally' }, tally(G.score[0]))),
        h('div', {}, h('b', { text: 'Compu' }), h('div', { class: 'n', text: String(G.score[1]) }), h('div', { class: 'tr-tally' }, tally(G.score[1]))));
      const st = h('div', { class: 'tr-state' }, `Partido a ${target()}`, h('br'), `En juego: ${T.lvl === 1 ? 'sin truco (1)' : T.lvl === 2 ? 'truco (2)' : T.lvl === 3 ? 'retruco (3)' : 'vale cuatro (4)'}`, h('br'), T.envDone ? 'Envido: ya se jugó' : 'Envido: sin cantar');
      const lg = h('div', { class: 'tr-log' }, log.slice(-14).map(t => h('span', { text: t })));
      wrap.replaceChildren(main, h('div', { class: 'tr-side' }, score, st, lg));
      lg.scrollTop = 1e6;
    }
    const fit = () => { const w = root.clientWidth, hh = root.clientHeight; if (!w) return; const cw = Math.max(44, Math.min(100, Math.min((w - 260) / 7.5, (hh - 150) / 6.4))); root.style.setProperty('--cw', cw + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const tools = [pick('Partido a', [['15', 'A 15'], ['30', 'A 30']], String(target()), (v) => { const s = H.get(); s.meta = +v; H.set(s); closeOver(); newMatch(); }), btn('Nuevo partido', () => { closeOver(); newMatch(); })];
    root.__tr = { G: () => G, T: () => T, actor, play: (i) => act(() => playCard(0, T.cards[0][i])), busy: () => busy, envido, RANK };
    requestAnimationFrame(() => { fit(); newMatch(); });
    return { el: root, tools, setSkin: () => {}, help: 'Truco mano a mano, sin flor. Tirá cartas tocándolas; las bazas las gana la carta más alta (ancho de espada, ancho de basto, siete de espada, siete de oro, treses, doses, anchos falsos, reyes…). Antes de tirar tu primera carta podés cantar envido, real envido o falta envido; el truco se canta cuando es tu turno y se puede subir a retruco y vale cuatro.' };
  }
  BM.register({ id: 'truco', n: 'Truco', d: 'Truco argentino mano a mano contra la compu: envido, truco, retruco y vale cuatro.', c: '#2a5aa8', create: truco, skinLabel: 'Mesa', skins: CE_SKINS,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#5e3b1f"/><g transform="rotate(-14 22 34)"><rect x="9" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><path d="M21 20l2.6 18h-5.2z" fill="#4c80d0" stroke="#1d3c70"/><rect x="15.5" y="37" width="11" height="2.4" fill="#d9a640"/></g><g transform="rotate(12 42 34)"><rect x="30" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><path d="M39.8 44c-1.2-6-2.2-12-1.4-17 .6-2.8 6-2.8 6.6 0 .8 5-.2 11-1.4 17z" fill="#5d9a3f" stroke="#2b5220"/></g><path d="M6 58h52" stroke="#f0d9a8" stroke-width="2"/></svg>',
    best: (s) => s.played ? `${s.wins || 0} partidos ganados de ${s.played}` : 'Nunca jugaste' });
})();
