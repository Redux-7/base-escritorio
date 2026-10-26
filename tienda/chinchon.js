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
  // ---- dibujos de los palos (con relieve y brillo) ----
  const DEFS = `<defs><linearGradient id="ceG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#e5b53e"/><stop offset="1" stop-color="#a36e14"/></linearGradient><linearGradient id="ceS" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6d8ab3"/><stop offset=".45" stop-color="#f2f6ff"/><stop offset="1" stop-color="#8aa3c6"/></linearGradient><linearGradient id="ceR" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e1f17"/><stop offset=".4" stop-color="#e2543f"/><stop offset="1" stop-color="#9a261c"/></linearGradient><linearGradient id="ceW" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3414"/><stop offset=".45" stop-color="#a8703a"/><stop offset="1" stop-color="#5e3816"/></linearGradient><radialGradient id="ceP" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#fffdf5"/><stop offset="1" stop-color="#f1e6cb"/></radialGradient><linearGradient id="ceB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--ce-back,#a3262a)"/><stop offset="1" stop-color="var(--ce-back2,#6c1418)"/></linearGradient><radialGradient id="cePn" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#2a3044"/><stop offset="1" stop-color="#161a26"/></radialGradient><radialGradient id="cePa" cx=".5" cy=".45" r=".8"><stop offset="0" stop-color="#f6e8c6"/><stop offset=".75" stop-color="#e6cf9c"/><stop offset="1" stop-color="#c9a76a"/></radialGradient></defs>`;
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
    const cuts = { o: 0, c: 1, e: 2, b: 3 }[s], col = DECK === 'noche' ? NCOL[s] : PCOL[s];
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
  // ---- estilos de mazo (se comparten entre el truco, el chinchón y la escoba) ----
  const DECKS = [['clasico', 'Naipes clásicos'], ['moderno', 'Naipes modernos (planos)'], ['grande', 'Naipes con números grandes'], ['antiguo', 'Naipes antiguos'], ['noche', 'Naipes nocturnos']];
  let DECK = (() => { try { const v = localStorage.getItem('base-naipes'); return DECKS.some(d => d[0] === v) ? v : 'clasico'; } catch { return 'clasico'; } })();
  const FLAT = {
    o: (c) => `<circle r="9.4" fill="${c}"/><circle r="6.2" fill="none" stroke="#fff" stroke-width="1.4" opacity=".75"/><circle r="2.2" fill="#fff" opacity=".85"/>`,
    c: (c) => `<path d="M-8-9H8C8-2 4.5 1.6 1.6 2.6V5.4C2.6 6.4 5 7.2 6 8.2V9.6H-6V8.2C-5 7.2-2.6 6.4-1.6 5.4V2.6C-4.5 1.6-8-2-8-9Z" fill="${c}"/><path d="M-5-6.6H5" stroke="#fff" stroke-width="1.2" opacity=".6"/>`,
    e: (c) => `<path d="M0-14 2-10.5V6H-2V-10.5Z" fill="${c}"/><path d="M-7.5 6H7.5V8.4H-7.5Z" fill="${c}"/><path d="M-1.3 8.4H1.3V13.4H-1.3Z" fill="${c}"/><circle cy="14.6" r="1.9" fill="${c}"/>`,
    b: (c) => `<path d="M-2.4 13.6C-2.8 9-3.8 2-4.6-5-5.6-7.4-5.6-10.6-2.6-12.8-.4-13.8 2.4-13.4 4.2-11.4 6-9 5.6-6 4.6-4.4 3.8 2 2.8 9 2.4 13.6Z" fill="${c}"/><circle cx="-1.6" cy="-6.4" r="1.2" fill="#fff" opacity=".55"/><circle cx="1.6" cy="-1.4" r="1" fill="#fff" opacity=".55"/><circle cx="-.8" cy="4" r=".9" fill="#fff" opacity=".55"/>`
  };
  const FCOL = { o: '#d99a1e', c: '#d23a2e', e: '#2f62c9', b: '#2f8a43' };
  const NCOL = { o: '#ffcf5a', c: '#ff6b5b', e: '#7fb0ff', b: '#6fdc84' };
  function modernCard(k) {
    const c = FCOL[k.s], sym = (x, y, sc, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${sc})">${FLAT[k.s](c)}</g>`;
    let inner = '';
    if (k.n >= 10) {
      const L = { 10: 'S', 11: 'C', 12: 'R' }[k.n], W = { 10: 'SOTA', 11: 'CABALLO', 12: 'REY' }[k.n];
      inner += `<rect x="8" y="16" width="44" height="60" rx="6" fill="${c}" opacity=".12"/><text x="30" y="52" font-size="30" font-weight="900" text-anchor="middle" fill="${c}" font-family="'Segoe UI',system-ui,sans-serif">${L}</text>${sym(30, 64, .62)}<text x="30" y="27" font-size="6.2" font-weight="800" letter-spacing=".6" text-anchor="middle" fill="${c}" font-family="'Segoe UI',system-ui,sans-serif">${W}</text>`;
    } else if (k.n === 1) inner += sym(30, 48, 2.1);
    else PIPS[k.n].forEach(([x, y, sc]) => { inner += sym(x, y + 2, sc * .9); });
    const lab = String(k.n);
    inner += `<text x="5" y="13" font-size="11" font-weight="900" fill="${c}" font-family="'Segoe UI',system-ui,sans-serif">${lab}</text>${sym(9.2 + (lab.length > 1 ? 2 : 0), 18.5, .3)}` +
      `<g transform="rotate(180 30 46)"><text x="5" y="13" font-size="11" font-weight="900" fill="${c}" font-family="'Segoe UI',system-ui,sans-serif">${lab}</text></g>`;
    return `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="6" fill="#ffffff" stroke="#c9ccd4" stroke-width="1"/>${inner}</svg>`;
  }
  const CARD_SVG = new Map();
  function cardSvg(k) {
    const key = DECK + ':' + (k.j ? 'J' : k.s + k.n); if (CARD_SVG.has(key)) return CARD_SVG.get(key);
    if (DECK === 'moderno' && !k.j) { const sv = modernCard(k); CARD_SVG.set(key, sv); return sv; }
    let inner = '';
    if (k.j) inner = `<rect x="6.5" y="8.5" width="47" height="75" fill="none" stroke="#7b3fb0" stroke-width="1.5"/><path d="M18 50L22 30 30 40 38 30 42 50Z" fill="#7b3fb0"/><path d="M22 30L18 22M38 30L42 22M30 40V28" stroke="#7b3fb0" stroke-width="1.4"/><circle cx="18" cy="21" r="2.2" fill="url(#ceG)"/><circle cx="42" cy="21" r="2.2" fill="url(#ceG)"/><circle cx="30" cy="26.5" r="2.2" fill="url(#ceG)"/>${face(30, 56, 7)}<path d="M20 50Q30 46 40 50" stroke="#f0c050" stroke-width="2.4" fill="none"/><text x="30" y="77" font-size="7" font-weight="800" text-anchor="middle" fill="#7b3fb0" font-family="Georgia,serif">COMODÍN</text>`;
    else {
      inner = frame(k.s);
      if (k.n >= 10) inner += figure(k.s, k.n);
      else if (k.n === 1) inner += ace(k.s);
      else PIPS[k.n].forEach(([x, y, sc, _], i) => { const tl = TILT[k.s] ? TILT[k.s][(i + (k.n > 3 ? Math.floor(i / 2) : 0)) % 2] : 0; inner += `<g transform="translate(${x} ${y}) rotate(${k.n === 2 || k.n === 3 ? 0 : tl}) scale(${sc * (TILT[k.s] ? (k.n === 2 ? 1.3 : k.n === 3 ? 1.05 : 1) : 1)})">${SYM[k.s]}</g>`; });
      const lab = String(k.n), col = DECK === 'noche' ? NCOL[k.s] : PCOL[k.s], bg = DECK === 'noche' ? '#161a26' : DECK === 'antiguo' ? '#f2e2bd' : '#fffdf5';
      if (DECK === 'grande') inner += `<rect x="1.4" y="1.4" width="17" height="19" rx="3" fill="${bg}" stroke="${col}" stroke-width=".8"/><text x="9.9" y="16.2" font-size="16" font-weight="900" text-anchor="middle" fill="${col}" font-family="'Segoe UI',system-ui,sans-serif">${lab}</text>` +
        `<rect x="41.6" y="71.6" width="17" height="19" rx="3" fill="${bg}" stroke="${col}" stroke-width=".8"/><text x="50.1" y="86.4" font-size="16" font-weight="900" text-anchor="middle" fill="${col}" font-family="'Segoe UI',system-ui,sans-serif">${lab}</text>`;
      else inner += `<rect x="1.8" y="1.8" width="9.4" height="11.8" rx="2" fill="${bg}"/><text x="6.5" y="11.4" font-size="10" font-weight="800" text-anchor="middle" fill="${col}" font-family="Georgia,'Times New Roman',serif">${lab}</text>` +
        `<rect x="48.8" y="78.4" width="9.4" height="11.8" rx="2" fill="${bg}"/><text x="53.5" y="88" font-size="10" font-weight="800" text-anchor="middle" fill="${col}" font-family="Georgia,'Times New Roman',serif">${lab}</text>`;
    }
    const paper = DECK === 'noche' ? 'url(#cePn)' : DECK === 'antiguo' ? 'url(#cePa)' : 'url(#ceP)', edge = DECK === 'noche' ? '#59607a' : DECK === 'antiguo' ? '#7a5a2a' : '#3a3328';
    const s = `<svg viewBox="0 0 60 92" aria-hidden="true">${DEFS}<rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="${paper}" stroke="${edge}" stroke-width="1"/>${inner}</svg>`;
    CARD_SVG.set(key, s); return s;
  }
  const BACK_SVG = `<svg viewBox="0 0 60 92" aria-hidden="true">${DEFS}<defs><pattern id="ce-bp" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="url(#ceB)"/><path d="M0 3.5H7M3.5 0V7" stroke="rgba(255,230,180,.28)" stroke-width=".8"/><circle cx="3.5" cy="3.5" r=".9" fill="rgba(255,230,180,.45)"/></pattern></defs><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#fbf6ea" stroke="#3a3328" stroke-width="1"/><rect x="3.5" y="3.5" width="53" height="85" rx="3.5" fill="url(#ce-bp)"/><rect x="5.5" y="5.5" width="49" height="81" rx="2.5" fill="none" stroke="rgba(255,230,180,.6)" stroke-width=".8"/><ellipse cx="30" cy="46" rx="13" ry="17" fill="url(#ceB)" stroke="#f0c050" stroke-width="1.4"/><ellipse cx="30" cy="46" rx="9.5" ry="13.5" fill="none" stroke="rgba(255,230,180,.7)" stroke-width=".7"/><g transform="translate(30 46) scale(.62)">${'<path d="M0-12C4-6 4-2 0 0C-4-2-4-6 0-12ZM0 12C4 6 4 2 0 0C-4 2-4 6 0 12ZM-12 0C-6 4-2 4 0 0C-2-4-6-4-12 0ZM12 0C6 4 2 4 0 0C2-4 6-4 12 0Z" fill="#f0c050"/><circle r="2.4" fill="#fff4c4"/>'}</g></svg>`;
  // dorsos: cada mazo tiene el suyo
  const BACKS = {
    moderno: `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="6" fill="#2f62c9"/><rect x="4" y="4" width="52" height="84" rx="4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.2"/><g fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"><circle cx="30" cy="46" r="8"/><circle cx="30" cy="46" r="14"/><circle cx="30" cy="46" r="20"/></g><circle cx="30" cy="46" r="3" fill="#fff" fill-opacity=".8"/></svg>`,
    grande: `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#fbf6ea" stroke="#3a3328"/><rect x="3.5" y="3.5" width="53" height="85" rx="3.5" fill="#1d3f7a"/><path d="M3.5 3.5L56.5 88.5M56.5 3.5L3.5 88.5" stroke="#f0c050" stroke-opacity=".35" stroke-width="1"/><rect x="18" y="32" width="24" height="28" rx="4" fill="#1d3f7a" stroke="#f0c050" stroke-width="1.4"/><text x="30" y="51" font-size="13" font-weight="900" text-anchor="middle" fill="#f0c050" font-family="'Segoe UI',system-ui,sans-serif">B</text></svg>`,
    antiguo: `<svg viewBox="0 0 60 92" aria-hidden="true"><defs><pattern id="ce-bpa" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#6b4422"/><path d="M0 4h8M4 0v8" stroke="#8a5e34" stroke-width="1"/><circle cx="4" cy="4" r="1" fill="#c9a76a"/></pattern></defs><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#e6cf9c" stroke="#5a3e1a"/><rect x="4" y="4" width="52" height="84" rx="3" fill="url(#ce-bpa)"/><rect x="6" y="6" width="48" height="80" rx="2" fill="none" stroke="#c9a76a" stroke-width=".8"/><circle cx="30" cy="46" r="11" fill="#6b4422" stroke="#c9a76a" stroke-width="1.4"/><path d="M30 38l2.4 5.6 6 .6-4.6 4 1.4 5.8L30 51l-5.2 3 1.4-5.8-4.6-4 6-.6Z" fill="#c9a76a"/></svg>`,
    noche: `<svg viewBox="0 0 60 92" aria-hidden="true"><rect x=".6" y=".6" width="58.8" height="90.8" rx="5" fill="#10131c" stroke="#59607a"/><rect x="4" y="4" width="52" height="84" rx="3.5" fill="none" stroke="#ffcf5a" stroke-opacity=".7" stroke-width=".8"/><path d="M30 14 46 46 30 78 14 46Z" fill="none" stroke="#ffcf5a" stroke-opacity=".55" stroke-width="1"/><path d="M30 24 40 46 30 68 20 46Z" fill="none" stroke="#7fb0ff" stroke-opacity=".55" stroke-width="1"/><circle cx="30" cy="46" r="3" fill="#ffcf5a"/></svg>`
  };
  const backSvg = () => BACKS[DECK] || BACK_SVG;
  // selector de mazo para las herramientas del juego (cambia los dibujos al instante)
  function deckPick(onChange) {
    return pick('Naipes', DECKS, DECK, (v) => { DECK = v; try { localStorage.setItem('base-naipes', v); } catch {} if (onChange) onChange(); });
  }
  function cardEl(k, opt = {}) {
    const e = h('div', { class: 'ce-card' + (opt.back ? ' back' : '') + (opt.cls ? ' ' + opt.cls : '') + ' dk-' + DECK, title: opt.back ? '' : cardName(k), role: opt.click ? 'button' : null, tabindex: opt.click ? '0' : null });
    e.innerHTML = opt.back ? backSvg() : cardSvg(k);
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
.ce-card.dk-antiguo:not(.back) svg{filter:sepia(.35) saturate(.85) contrast(1.02)}
.ce-card.dk-noche{background:#161a26}
.ce-card.dk-moderno{border-radius:calc(var(--cw)*.1);background:#fff}
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
.ce-dock{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;align-content:flex-end;max-width:min(380px,34vw)}
.ce-dock>.ce-b{flex:1 1 100%}
.ce-dock .ce-b{padding:8px 12px;text-align:center;font-size:13.5px}
.ce-dock small{display:block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;opacity:.75;margin:2px 2px -2px}
.ce-grp2{flex:1 1 160px;display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:6px;padding:8px;border-radius:14px;background:rgba(0,0,0,.2)}
.ce-grp2 small{grid-column:1/-1}
.ce-grp2.ask{background:rgba(255,211,77,.18);box-shadow:inset 0 0 0 2px rgba(255,211,77,.55)}
.ce-hint{justify-self:center;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;background:rgba(0,0,0,.3);font-size:13.5px;font-weight:700;text-align:center}
.ce-hint b{color:#ffd34d}
`;
  // ---- voces (truco): cada canto se escucha; la compu habla con otra voz ----
  const VOZ = { on: (() => { try { return localStorage.getItem('base-voces') !== '0'; } catch { return true; } })() };
  function vozList() {
    if (!window.speechSynthesis) return [];
    const pref = ['es-AR', 'es-419', 'es-UY', 'es-MX', 'es-US', 'es-ES'];
    const rank = (v) => { const i = pref.findIndex(p => v.lang && v.lang.toLowerCase().startsWith(p.toLowerCase())); return i < 0 ? 9 : i; };
    return speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang || '')).sort((a, b) => rank(a) - rank(b));
  }
  function ceSay(text, who) {
    if (!VOZ.on || !window.speechSynthesis || !text) return;
    if (SFX && SFX.get && !SFX.get()) return; // con el sonido de los juegos apagado, tampoco hablan
    const vs = vozList();
    const u = new SpeechSynthesisUtterance(String(text).replace(/[¡!¿?]/g, ''));
    const mine = vs[0], cpu = vs.find(v => v.name !== (mine && mine.name)) || mine;
    const v = who === 1 ? cpu : mine;
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-AR';
    u.pitch = who === 1 ? (cpu !== mine ? 1 : .72) : 1.08; u.rate = who === 1 ? .98 : 1.06; u.volume = 1;
    try { speechSynthesis.speak(u); } catch {}
  }
  if (window.speechSynthesis) try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch {}
  function vozBtn() {
    const b = btn('', () => { VOZ.on = !VOZ.on; try { localStorage.setItem('base-voces', VOZ.on ? '1' : '0'); } catch {} paint(); if (VOZ.on) ceSay('Voces prendidas', 0); else try { speechSynthesis.cancel(); } catch {} });
    const paint = () => { b.textContent = VOZ.on ? '🗣️ Voces' : '🤐 Sin voces'; b.title = VOZ.on ? 'Los cantos se escuchan (tocá para callarlos)' : 'Los cantos no se escuchan (tocá para prenderlos)'; };
    paint(); return b;
  }
  function ceStyle(id, css) { const st = document.getElementById(id) || document.head.appendChild(h('style', { id })); const all = CE_CSS + css; if (st.textContent !== all) st.textContent = all; }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  function ceMsg(root, text, ms = 1300, top = '42%') { const m = h('div', { class: 'ce-msg', text, style: `top:${top}` }); root.append(m); setTimeout(() => m.remove(), ms); return m; }
  const CE_SKINS = [['pano', 'Paño verde', '#2f7d4a'], ['madera', 'Madera', '#8a5a33'], ['azul', 'Paño azul', '#2b5f9e']];

  const CSS = `
.ch-wrap{display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:8px;padding:12px 14px;height:100%;box-sizing:border-box}
.ch-opps{display:flex;justify-content:space-around;gap:10px;flex-wrap:wrap}
.ch-opp{display:grid;justify-items:center;gap:6px}
.ch-opp .ce-card{--cw:calc(var(--cw0)*.55)}
.ch-opp .ce-fan .ce-card+.ce-card{margin-left:calc(var(--cw0)*-.42)}
.ch-opp.out{opacity:.4}
.ch-mid{display:flex;align-items:center;justify-content:center;gap:34px}
.ch-pile{display:grid;justify-items:center;gap:8px;font-size:12px;font-weight:700}
.ch-pile .ce-pile.can{cursor:pointer;filter:drop-shadow(0 0 10px #ffd34d)}
.ch-pile .ce-b{padding:6px 12px;font-size:13px}
.ch-me{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);align-items:end;gap:14px}
.ch-me .who{justify-self:end;align-self:center;display:grid;justify-items:end;gap:6px;max-width:260px}
.ch-me .ce-dock{justify-self:start}
.ch-handbox{display:grid;justify-items:center;gap:8px}
.ch-hand{display:flex;justify-content:center;gap:calc(var(--cw)*.08);flex-wrap:nowrap}
.ch-grp{display:flex;gap:calc(var(--cw)*.06);padding:5px;border-radius:12px;position:relative}
.ch-grp.meld{background:rgba(255,211,77,.18);box-shadow:inset 0 0 0 2px rgba(255,211,77,.55)}
.ch-grp.meld::before{content:"juego";position:absolute;top:-9px;left:10px;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;background:#ffd34d;color:#2b2210;border-radius:99px;padding:0 6px}
.ch-show{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ch-show .ch-grp .ce-card{--cw:calc(var(--cw0)*.5)}
.ch-show .ch-grp.meld::before{display:none}
@media (max-width:900px){.ch-me{grid-template-columns:1fr}.ch-me .who,.ch-me .ce-dock{justify-self:center}}
`;
  const NUMS40 = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12], NUMS48 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  function chinchon(H) {
    ceStyle('st-ch', CSS);
    const root = h('div', { class: 'ce-table' });
    const wrap = h('div', { class: 'ch-wrap' }); root.append(wrap);
    const cfg = () => { const s = H.get(); return { rivals: +(s.rivals || 1), mazo: s.mazo || '50' }; };
    let G = null, sel = null, busy = false;
    const NUMS = () => (G.mazo === '40' || G.mazo === '42') ? NUMS40 : NUMS48;
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
      G.deck = mazo(G.mazo === '50' || G.mazo === '48', G.mazo === '50' || G.mazo === '42' ? 2 : 0);
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
      const drawB = (t, fn, ok) => Object.assign(h('button', { class: 'ce-b' + (ok ? ' hot' : ''), text: t, disabled: !ok }), { onclick: fn });
      const mid = h('div', { class: 'ch-mid' },
        h('div', { class: 'ch-pile' }, deckP, canDraw ? drawB('Robar del mazo', () => { drawFrom('mazo'); render(); }, true) : h('span', { text: `Mazo · ${G.deck.length}` })),
        h('div', { class: 'ch-pile' }, pozoP, canDraw && top ? drawB('Levantar del pozo', () => { drawFrom('pozo'); render(); }, true) : h('span', { text: 'Pozo' })));
      const ar = arrange(me().hand);
      let info;
      if (me().out) info = 'Quedaste afuera: mirá cómo sigue la partida';
      else if (G.turn !== 0) info = `Juega ${G.players[G.turn].n}…`;
      else if (G.phase === 'draw') info = 'Tu turno: robá del mazo o levantá del pozo';
      else {
        const cut = sel ? arrange(me().hand.filter(k => k !== sel)) : null;
        info = h('span', {}, sel ? (cut.cost <= 5 ? h('span', {}, 'Con esa carta podés ', h('b', { text: cut.cost === 0 ? 'cortar a menos diez' : `cortar con ${cut.cost}` })) : `Tirando esa te quedan ${cut.cost} sueltos`) : 'Tocá la carta que querés tirar (doble clic la tira directo)');
      }
      // mano: primero los juegos armados, después las sueltas
      const groups = [...ar.melds.map(m => ({ m: true, cs: m })), { m: false, cs: ar.loose }].filter(g => g.cs.length);
      const canPick = myTurn && G.phase === 'discard';
      const hand = h('div', { class: 'ch-hand' }, groups.map(g => h('div', { class: 'ch-grp' + (g.m ? ' meld' : '') }, g.cs.map(k => {
        const c = cardEl(k, { cls: sel === k ? 'sel' : '', click: canPick ? () => { sel = sel === k ? null : k; SFX('select'); render(); } : null });
        if (canPick) c.ondblclick = () => discard(0, k, false);
        return c;
      }))));
      const cutCost = sel ? arrange(me().hand.filter(k => k !== sel)).cost : 99, cutOk = sel && cutCost <= 5;
      const dock = h('div', { class: 'ce-dock' },
        h('div', { class: 'ce-grp2' + (cutOk ? ' ask' : '') }, h('small', { text: G.phase === 'discard' && myTurn ? 'Tu jugada' : 'Esperá tu turno' }),
          Object.assign(h('button', { class: 'ce-b', text: 'Tirar al pozo', disabled: !(canPick && sel) }), { onclick: () => discard(0, sel, false) }),
          Object.assign(h('button', { class: 'ce-b hot', text: cutOk ? (cutCost === 0 ? 'Cortar a menos diez' : `Cortar con ${cutCost}`) : 'Cortar', disabled: !(canPick && cutOk) }), { onclick: () => discard(0, sel, true) })));
      const who = h('div', { class: 'who' }, h('span', { class: 'ce-tag' + (G.turn === 0 ? ' turn' : ''), text: `Vos · ${me().pts} pts` }), h('span', { class: 'ce-tag', text: `Sueltas: ${ar.cost}` }));
      const meRow = h('div', { class: 'ch-me' }, who, h('div', { class: 'ch-handbox' }, h('span', { class: 'ce-hint' }, info), hand), dock);
      wrap.replaceChildren(opps, mid, meRow);
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
    const fit = () => { const w = root.clientWidth, hh = root.clientHeight; if (!w) return; const cw = Math.max(40, Math.min(96, Math.min((w - 420) / 8.2, hh / 6.4))); root.style.setProperty('--cw', cw + 'px'); root.style.setProperty('--cw0', cw + 'px'); };
    new ResizeObserver(() => requestAnimationFrame(fit)).observe(root);
    const set = (k, v) => { const s = H.get(); s[k] = v; H.set(s); closeOver(); busy = false; newMatch(); };
    const tools = [
      pick('Rivales', [['1', '1 rival'], ['2', '2 rivales'], ['3', '3 rivales']], String(cfg().rivals), (v) => set('rivals', +v)),
      pick('Mazo', [['50', '48 cartas + 2 comodines'], ['48', '48 cartas'], ['42', '40 cartas + 2 comodines'], ['40', '40 cartas']], cfg().mazo, (v) => set('mazo', v)),
      deckPick(() => { render(); }),
      btn('Nueva partida', () => { closeOver(); busy = false; newMatch(); })];
    root.__ch = { G: () => G, arrange, valid, cpu: cpuTurn, busy: () => busy };
    requestAnimationFrame(() => { fit(); newMatch(); });
    return { el: root, tools, setSkin: () => {}, help: 'Chinchón: robá del mazo o del pozo y tirá una carta. Armá juegos de 3 o 4 del mismo número o escaleras del mismo palo (el comodín reemplaza a cualquiera). Podés cortar cuando te quedan 5 puntos sueltos o menos; con todo armado es "menos diez", y 7 en escalera del mismo palo es ¡chinchón! (ganás). El que pasa los 100 puntos queda afuera.' };
  }
  BM.register({ id: 'chinchon', n: 'Chinchón', d: 'Armá juegos y escaleras con naipes españoles y cortá antes que la compu (de 1 a 3 rivales).', c: '#b02a20', create: chinchon, skinLabel: 'Mesa', skins: CE_SKINS,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1b5232"/><g transform="rotate(-18 20 40)"><rect x="8" y="18" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="19" y="40" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">5</text></g><rect x="21" y="14" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="32" y="36" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">6</text><g transform="rotate(18 44 40)"><rect x="34" y="18" width="22" height="34" rx="3" fill="#fbf6ea" stroke="#3a3328"/><text x="45" y="40" font-size="13" font-weight="800" text-anchor="middle" fill="#2a5aa8" font-family="Georgia,serif">7</text></g></svg>',
    best: (s) => s.played ? `${s.wins || 0} ganadas de ${s.played}${s.chin ? ` · ${s.chin} chinchón` : ''}` : 'Nunca jugaste' });
})();
