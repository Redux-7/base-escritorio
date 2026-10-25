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
  const pl = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
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
      const pile = (p) => h('div', { class: 'es-pile' }, h('div', { class: 'ce-tag', text: `${G.cap[p].length} cartas · ${pl(G.esc[p], 'escoba')} · ${pl(G.cap[p].filter(k => k.s === 'o').length, 'oro')} · ${pl(G.cap[p].filter(k => k.n === 7).length, 'siete')}${G.cap[p].some(k => k.s === 'o' && k.n === 7) ? ' (con el 7 de oros)' : ''}` }));
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
      // la setenta: gana el que tiene más sietes; si empatan, más seises, y así para abajo
      { let w = -1; for (const n of [7, 6, 5, 4, 3, 2, 1]) { const a = c[0].filter(k => k.n === n).length, b = c[1].filter(k => k.n === n).length; if (a !== b) { w = a > b ? 0 : 1; break; } }
        if (w >= 0) add(w, 1, `La setenta (sietes: ${c[w].filter(k => k.n === 7).length} a ${c[1 - w].filter(k => k.n === 7).length})`);
        for (const p of [0, 1]) if (c[p].filter(k => k.n === 7).length === 4) add(p, 1, 'Los cuatro sietes'); }
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
    return { el: root, tools, setSkin: () => {}, help: 'Escoba de 15: tocá una carta de tu mano y después las de la mesa que, sumadas a la tuya, den 15 (sota 8, caballo 9, rey 10). Si levantás todo es escoba. Al final de cada mano suman: escobas, más cartas, más oros, el siete de oros y la setenta (más sietes; si empatan, más seises y así).' };
  }
  BM.register({ id: 'escoba', n: 'Escoba de 15', d: 'El clásico de naipes españoles contra la compu: sumá 15 y hacé escobas.', c: '#2f7d4a', create: escoba, skinLabel: 'Mesa', skins: CE_SKINS,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#2f7d4a"/><g transform="rotate(-12 22 34)"><rect x="10" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><circle cx="22" cy="32" r="6" fill="#e2b13c" stroke="#8f650f"/></g><g transform="rotate(10 42 34)"><rect x="30" y="14" width="24" height="36" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="42" y="38" font-size="14" font-weight="800" text-anchor="middle" fill="#b02a20" font-family="Georgia,serif">15</text></g></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}` : 'Nunca jugaste' });
})();
