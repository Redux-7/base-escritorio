// Tienda de Base · Sopa de letras (tamaño, tema, direcciones y tus propias palabras)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, seg, pick, btn, overlay, confetti, timer, fmtTime } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  // Listas por tema (compartidas por Sopa de letras y Ahorcado)
  const TEMAS = {
    animales: ['Elefante', 'Jirafa', 'Tigre', 'León', 'Cebra', 'Hipopótamo', 'Cocodrilo', 'Delfín', 'Ballena', 'Pingüino', 'Canguro', 'Koala', 'Zorro', 'Lobo', 'Oso', 'Conejo', 'Ardilla', 'Tortuga', 'Serpiente', 'Águila', 'Lechuza', 'Loro', 'Flamenco', 'Puma', 'Yaguareté', 'Carpincho', 'Hornero', 'Vicuña', 'Guanaco', 'Cóndor', 'Mulita', 'Ñandú', 'Caballo', 'Vaca', 'Oveja', 'Chancho', 'Gallina', 'Pato', 'Perro', 'Gato', 'Ratón', 'Camello', 'Gorila', 'Mono', 'Rinoceronte', 'Murciélago', 'Pulpo', 'Medusa', 'Tiburón', 'Foca'],
    frutas: ['Manzana', 'Banana', 'Naranja', 'Mandarina', 'Pera', 'Uva', 'Frutilla', 'Durazno', 'Ciruela', 'Cereza', 'Kiwi', 'Ananá', 'Mango', 'Sandía', 'Melón', 'Limón', 'Pomelo', 'Higo', 'Damasco', 'Frambuesa', 'Arándano', 'Membrillo', 'Palta', 'Tomate', 'Lechuga', 'Zanahoria', 'Papa', 'Batata', 'Cebolla', 'Zapallo', 'Berenjena', 'Pepino', 'Morrón', 'Choclo', 'Acelga', 'Espinaca', 'Brócoli', 'Coliflor', 'Remolacha', 'Ajo', 'Arveja', 'Lenteja', 'Poroto', 'Rabanito', 'Apio', 'Puerro', 'Zapallito'],
    paises: ['Argentina', 'Uruguay', 'Chile', 'Brasil', 'Paraguay', 'Bolivia', 'Perú', 'Ecuador', 'Colombia', 'Venezuela', 'México', 'Cuba', 'España', 'Francia', 'Italia', 'Alemania', 'Portugal', 'Grecia', 'Suecia', 'Noruega', 'Irlanda', 'Polonia', 'Rusia', 'China', 'Japón', 'India', 'Corea', 'Egipto', 'Marruecos', 'Kenia', 'Nigeria', 'Australia', 'Canadá', 'Panamá', 'Honduras', 'Guatemala', 'Turquía', 'Israel', 'Tailandia', 'Vietnam', 'Islandia', 'Suiza', 'Austria', 'Bélgica', 'Holanda', 'Hungría', 'Rumania', 'Croacia', 'Jamaica', 'Haití'],
    provincias: ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'Rosario', 'Bariloche', 'Ushuaia', 'Mar del Plata', 'Paraná', 'Resistencia', 'Posadas', 'Viedma', 'Rawson', 'Tandil', 'Iguazú', 'Calafate', 'Tilcara', 'Cafayate', 'Merlo', 'Pinamar', 'Gesell'],
    deportes: ['Fútbol', 'Básquet', 'Tenis', 'Pádel', 'Vóley', 'Rugby', 'Hockey', 'Natación', 'Ciclismo', 'Atletismo', 'Boxeo', 'Judo', 'Karate', 'Esgrima', 'Golf', 'Polo', 'Pato', 'Remo', 'Surf', 'Esquí', 'Patinaje', 'Gimnasia', 'Handball', 'Béisbol', 'Ajedrez', 'Maratón', 'Triatlón', 'Escalada', 'Buceo', 'Vela', 'Tiro', 'Arquería', 'Bochas', 'Bowling', 'Squash', 'Lucha', 'Waterpolo', 'Canotaje', 'Automovilismo', 'Motocross'],
    profesiones: ['Médico', 'Enfermera', 'Maestra', 'Profesor', 'Abogado', 'Contador', 'Ingeniero', 'Arquitecto', 'Plomero', 'Electricista', 'Carpintero', 'Albañil', 'Pintor', 'Cocinero', 'Panadero', 'Carnicero', 'Verdulero', 'Mecánico', 'Bombero', 'Policía', 'Cartero', 'Chofer', 'Piloto', 'Músico', 'Actor', 'Periodista', 'Fotógrafo', 'Dentista', 'Veterinario', 'Psicólogo', 'Farmacéutico', 'Jardinero', 'Peluquero', 'Sastre', 'Herrero', 'Zapatero', 'Programador', 'Diseñador', 'Escritor', 'Granjero'],
    cocina: ['Asado', 'Empanada', 'Milanesa', 'Ñoquis', 'Ravioles', 'Tallarines', 'Pizza', 'Fainá', 'Locro', 'Humita', 'Tamal', 'Choripán', 'Provoleta', 'Chimichurri', 'Puchero', 'Guiso', 'Tortilla', 'Alfajor', 'Medialuna', 'Facturas', 'Dulce de leche', 'Flan', 'Pastafrola', 'Chocotorta', 'Helado', 'Mate', 'Tostado', 'Sándwich', 'Polenta', 'Lasaña', 'Canelones', 'Matambre', 'Vacío', 'Morcilla', 'Chinchulines', 'Ensalada', 'Sopa', 'Arroz', 'Budín', 'Bizcochuelo', 'Panqueque', 'Churros'],
    musica: ['Guitarra', 'Piano', 'Violín', 'Batería', 'Bajo', 'Flauta', 'Trompeta', 'Saxofón', 'Bandoneón', 'Acordeón', 'Arpa', 'Chelo', 'Clarinete', 'Bombo', 'Charango', 'Quena', 'Ukelele', 'Teclado', 'Pandereta', 'Maracas', 'Tango', 'Folclore', 'Cumbia', 'Rock', 'Jazz', 'Blues', 'Ópera', 'Chacarera', 'Zamba', 'Milonga', 'Cuarteto', 'Reggae', 'Melodía', 'Ritmo', 'Acorde', 'Canción', 'Estribillo', 'Partitura', 'Orquesta', 'Coro'],
    casa: ['Cocina', 'Living', 'Comedor', 'Dormitorio', 'Baño', 'Patio', 'Terraza', 'Balcón', 'Garaje', 'Escalera', 'Ventana', 'Puerta', 'Techo', 'Pared', 'Piso', 'Sillón', 'Mesa', 'Silla', 'Cama', 'Placard', 'Heladera', 'Horno', 'Lavarropas', 'Televisor', 'Lámpara', 'Espejo', 'Alfombra', 'Cortina', 'Almohada', 'Frazada', 'Ducha', 'Canilla', 'Pileta', 'Parrilla', 'Estufa', 'Ventilador', 'Escritorio', 'Biblioteca', 'Maceta', 'Timbre'],
    naturaleza: ['Montaña', 'Volcán', 'Glaciar', 'Cascada', 'Río', 'Lago', 'Laguna', 'Mar', 'Océano', 'Playa', 'Isla', 'Desierto', 'Selva', 'Bosque', 'Llanura', 'Pampa', 'Valle', 'Quebrada', 'Médano', 'Arroyo', 'Cerro', 'Meseta', 'Pradera', 'Estepa', 'Cueva', 'Arcoíris', 'Tormenta', 'Relámpago', 'Lluvia', 'Nieve', 'Granizo', 'Viento', 'Niebla', 'Nube', 'Estrella', 'Luna', 'Sol', 'Cometa', 'Planeta', 'Aurora'],
    cuerpo: ['Cabeza', 'Cabello', 'Frente', 'Ceja', 'Ojo', 'Nariz', 'Boca', 'Labio', 'Diente', 'Lengua', 'Oreja', 'Cuello', 'Hombro', 'Brazo', 'Codo', 'Muñeca', 'Mano', 'Dedo', 'Uña', 'Pecho', 'Espalda', 'Cintura', 'Cadera', 'Pierna', 'Rodilla', 'Tobillo', 'Talón', 'Pie', 'Corazón', 'Pulmón', 'Hígado', 'Riñón', 'Estómago', 'Cerebro', 'Hueso', 'Músculo', 'Piel', 'Mejilla', 'Mentón', 'Pestaña'],
    transporte: ['Auto', 'Colectivo', 'Tren', 'Subte', 'Avión', 'Barco', 'Bicicleta', 'Moto', 'Camión', 'Taxi', 'Tranvía', 'Helicóptero', 'Lancha', 'Velero', 'Canoa', 'Kayak', 'Submarino', 'Cohete', 'Globo', 'Patineta', 'Monopatín', 'Ambulancia', 'Camioneta', 'Tractor', 'Grúa', 'Furgón', 'Ferry', 'Yate', 'Trineo', 'Carreta', 'Teleférico', 'Avioneta', 'Combi', 'Remís', 'Locomotora', 'Vagón', 'Andén', 'Peaje', 'Ruta', 'Autopista'],
    colores: ['Rojo', 'Azul', 'Verde', 'Amarillo', 'Naranja', 'Violeta', 'Rosa', 'Negro', 'Blanco', 'Gris', 'Marrón', 'Celeste', 'Turquesa', 'Lila', 'Fucsia', 'Dorado', 'Plateado', 'Beige', 'Bordó', 'Ocre', 'Crema', 'Magenta', 'Índigo', 'Coral', 'Salmón', 'Esmeralda', 'Carmesí', 'Ámbar', 'Lavanda', 'Oliva', 'Caqui', 'Granate', 'Cian', 'Marfil', 'Púrpura']
  };
  const TEMA_N = { animales: 'Animales', frutas: 'Frutas y verduras', paises: 'Países', provincias: 'Argentina', deportes: 'Deportes', profesiones: 'Oficios y profesiones', cocina: 'Comidas', musica: 'Música', casa: 'La casa', naturaleza: 'Naturaleza', cuerpo: 'El cuerpo', transporte: 'Transporte', colores: 'Colores' };
  // pasa a mayúsculas sin tildes (la Ñ se queda) y sin espacios
  const norm = (w) => String(w).toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');

  const CSS = `
.sp-wrap{display:flex;gap:22px;align-items:center;justify-content:center;width:100%;height:100%;padding:14px;box-sizing:border-box}
.sp-board{position:relative;display:grid;user-select:none;touch-action:none;background:#f6f1e4;border-radius:14px;padding:8px;box-shadow:0 18px 40px -18px rgba(0,0,0,.7)}
.sp-c{width:var(--s);height:var(--s);display:grid;place-items:center;font-weight:800;font-size:calc(var(--s)*.52);color:#2b2a33;cursor:pointer;position:relative;z-index:2;font-family:ui-rounded,system-ui,sans-serif}
.sp-c.sel{color:#000}
.sp-svg{position:absolute;inset:8px;pointer-events:none;z-index:1}
.sp-side{display:flex;flex-direction:column;gap:6px;min-width:170px;max-width:240px;max-height:100%;overflow:auto}
.sp-side h4{margin:0 0 4px;font-size:13px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.sp-w{font-weight:700;font-size:15px;padding:3px 10px;border-radius:8px;background:rgba(255,255,255,.06);transition:opacity .3s}
.sp-w.ok{text-decoration:line-through;opacity:.45;background:none}
.sp-dlg textarea{width:min(420px,70vw);height:160px;border-radius:10px;border:0;padding:10px;font:inherit;background:rgba(255,255,255,.08);color:#fff;resize:vertical}
@media (max-width:760px){.sp-wrap{flex-direction:column}.sp-side{flex-direction:row;flex-wrap:wrap;max-width:none;min-width:0}}
`;
  const SIZES = { 10: '10×10', 12: '12×12', 15: '15×15', 18: '18×18' };
  const DIRS = { facil: { n: 'Fácil (→ ↓)', d: [[0, 1], [1, 0]] }, normal: { n: 'Normal (+ diagonales)', d: [[0, 1], [1, 0], [1, 1], [-1, 1]] }, dificil: { n: 'Difícil (todas, también al revés)', d: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] } };
  const FILL = 'AAAAAAEEEEEEEOOOOOIIIISSSSRRRRNNNNLLLDDDTTTCCCUUUMMPPBGVYHFQJZÑX';
  const HUES = [8, 32, 52, 95, 160, 190, 215, 260, 290, 330];

  function sopa(H) {
    { const st0 = document.getElementById('st-sopa') || document.head.appendChild(h('style', { id: 'st-sopa' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    const S0 = H.get();
    let size = SIZES[S0.size] ? +S0.size : 12, tema = (S0.tema && (TEMAS[S0.tema] || S0.tema === 'mix' || S0.tema === 'propias')) ? S0.tema : 'animales', dirs = DIRS[S0.dirs] ? S0.dirs : 'normal';
    const root = h('div', { class: 'sp-wrap' });
    const board = h('div', { class: 'sp-board' }), side = h('div', { class: 'sp-side' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'sp-svg');
    root.append(board, side);
    let grid, words, cells, sel = null, done = false, cs = 34, lastSz = '';
    const t = timer(() => status());
    const status = () => H.status([`${words ? words.filter(w => w.ok).length : 0}/${words ? words.length : 0} palabras`, fmtTime(t.secs), H.get().best && H.get().best[key()] ? `Récord ${fmtTime(H.get().best[key()])}` : '']);
    const key = () => `${size}-${dirs}`;
    const save = (o) => { const s = H.get(); Object.assign(s, o); H.set(s); };
    function source() {
      if (tema === 'propias') { const l = (H.get().custom || '').split(/[\n,;]+/).map(x => x.trim()).filter(x => norm(x).length >= 2); return l.length ? l : ['Escribí', 'tus', 'palabras']; }
      if (tema === 'mix') return Object.values(TEMAS).flat();
      return TEMAS[tema];
    }
    function build() {
      const want = Math.round(size * 0.9) + 2, D = DIRS[dirs].d;
      let best = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pool = source().map(w => ({ show: w, w: norm(w) })).filter(x => x.w.length >= 2 && x.w.length <= size);
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
        const uniq = []; for (const p of pool) if (!uniq.some(u => u.w === p.w)) uniq.push(p);
        const list = (tema === 'propias' ? uniq : uniq.slice(0, want)).sort((a, b) => b.w.length - a.w.length);
        const g = Array.from({ length: size }, () => new Array(size).fill(''));
        const placed = [];
        for (const it of list) {
          let ok = false;
          for (let k = 0; k < 400 && !ok; k++) {
            const [dr, dc] = D[Math.floor(Math.random() * D.length)], L = it.w.length;
            const r0 = Math.floor(Math.random() * size), c0 = Math.floor(Math.random() * size), r1 = r0 + dr * (L - 1), c1 = c0 + dc * (L - 1);
            if (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) continue;
            let fit = true, overlap = 0;
            for (let i = 0; i < L; i++) { const ch = g[r0 + dr * i][c0 + dc * i]; if (ch && ch !== it.w[i]) { fit = false; break; } if (ch) overlap++; }
            if (!fit || overlap === L) continue;
            for (let i = 0; i < L; i++) g[r0 + dr * i][c0 + dc * i] = it.w[i];
            placed.push({ ...it, r0, c0, dr, dc, ok: false }); ok = true;
          }
        }
        if (!best || placed.length > best.placed.length) best = { g, placed };
        if (placed.length >= Math.min(list.length, want)) break;
      }
      grid = best.g; words = best.placed.sort((a, b) => a.show.localeCompare(b.show, 'es'));
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (!grid[r][c]) grid[r][c] = FILL[Math.floor(Math.random() * FILL.length)];
    }
    function fit() {
      const W = root.clientWidth || 800, Hh = root.clientHeight || 560, wide = W > 760;
      cs = Math.max(18, Math.min(44, Math.floor(Math.min((Hh - 50 - (wide ? 0 : 90)) / size, (W - (wide ? 290 : 40)) / size))));
      board.style.setProperty('--s', cs + 'px'); board.style.gridTemplateColumns = `repeat(${size}, ${cs}px)`;
      svg.setAttribute('viewBox', `0 0 ${size * cs} ${size * cs}`); svg.style.width = size * cs + 'px'; svg.style.height = size * cs + 'px';
      drawMarks();
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; fit(); }).observe(root);
    function render() {
      board.replaceChildren(svg); cells = [];
      for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) { const d = h('div', { class: 'sp-c', text: grid[r][c] }); d.dataset.r = r; d.dataset.c = c; board.append(d); cells.push(d); }
      side.replaceChildren(h('h4', { text: tema === 'propias' ? 'Tus palabras' : tema === 'mix' ? 'De todo un poco' : TEMA_N[tema] }), ...words.map(w => { w.el = h('div', { class: 'sp-w' + (w.ok ? ' ok' : ''), text: w.show }); return w.el; }));
      fit();
    }
    const capsule = (r0, c0, r1, c1, col, op) => {
      const x0 = (c0 + 0.5) * cs, y0 = (r0 + 0.5) * cs, x1 = (c1 + 0.5) * cs, y1 = (r1 + 0.5) * cs;
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', x0); l.setAttribute('y1', y0); l.setAttribute('x2', x1); l.setAttribute('y2', y1);
      l.setAttribute('stroke', col); l.setAttribute('stroke-width', cs * 0.78); l.setAttribute('stroke-linecap', 'round'); l.setAttribute('opacity', op);
      svg.append(l);
    };
    function drawMarks() {
      svg.replaceChildren();
      words.forEach((w, i) => { if (w.ok) capsule(w.r0, w.c0, w.r0 + w.dr * (w.w.length - 1), w.c0 + w.dc * (w.w.length - 1), `hsl(${HUES[i % HUES.length]} 80% 62%)`, 0.55); });
      if (sel && sel.r1 != null) capsule(sel.r0, sel.c0, sel.r1, sel.c1, '#4c8dff', 0.45);
      else if (sel) capsule(sel.r0, sel.c0, sel.r0, sel.c0, '#4c8dff', 0.45);
    }
    function cellAt(e) {
      const b = board.getBoundingClientRect(), c = Math.floor((e.clientX - b.left - 8) / cs), r = Math.floor((e.clientY - b.top - 8) / cs);
      return [Math.max(0, Math.min(size - 1, r)), Math.max(0, Math.min(size - 1, c))];
    }
    function snap(r0, c0, r, c) {
      let dr = r - r0, dc = c - c0; if (!dr && !dc) return [r0, c0];
      const ad = Math.abs(dr), ac = Math.abs(dc);
      if (ad > ac * 2) dc = 0; else if (ac > ad * 2) dr = 0; else { const m = Math.max(ad, ac); dr = Math.sign(dr) * m; dc = Math.sign(dc) * m; }
      let r1 = r0 + dr, c1 = c0 + dc;
      while (r1 < 0 || r1 >= size || c1 < 0 || c1 >= size) { r1 -= Math.sign(dr); c1 -= Math.sign(dc); }
      return [r1, c1];
    }
    function tryWord() {
      const { r0, c0, r1, c1 } = sel; sel = null; const okBefore = words.filter(w => w.ok).length;
      const L = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1, dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0);
      for (const w of words) {
        if (w.ok || w.w.length !== L) continue;
        const er = w.r0 + w.dr * (L - 1), ec = w.c0 + w.dc * (L - 1);
        if ((w.r0 === r0 && w.c0 === c0 && er === r1 && ec === c1) || (w.r0 === r1 && w.c0 === c1 && er === r0 && ec === c0)) { w.ok = true; w.el.classList.add('ok'); break; }
        // la palabra puede aparecer escrita en otro lado por casualidad: también vale
        let s = ''; for (let i = 0; i < L; i++) s += grid[r0 + dr * i][c0 + dc * i];
        if (s === w.w || [...s].reverse().join('') === w.w) { w.ok = true; w.r0 = r0; w.c0 = c0; w.dr = dr; w.dc = dc; if ([...s].reverse().join('') === w.w && s !== w.w) { w.r0 = r1; w.c0 = c1; w.dr = -dr; w.dc = -dc; } w.el.classList.add('ok'); break; }
      }
      drawMarks(); status();
      if (!words.every(w => w.ok)) SFX(words.filter(w => w.ok).length > okBefore ? 'good' : 'erase');
      if (words.every(w => w.ok) && !done) win();
    }
    let dragging = false, moved = false;
    board.addEventListener('pointerdown', (e) => {
      if (done) return; e.preventDefault(); const [r, c] = cellAt(e);
      if (sel && sel.r1 == null && !dragging) { // segundo clic: termina la selección
        const [r1, c1] = snap(sel.r0, sel.c0, r, c); sel.r1 = r1; sel.c1 = c1; tryWord(); return;
      }
      if (!t.running) t.start();
      SFX('tap'); sel = { r0: r, c0: c }; dragging = true; moved = false; board.setPointerCapture(e.pointerId); drawMarks();
    });
    board.addEventListener('pointermove', (e) => { if (!dragging || !sel) return; const [r, c] = cellAt(e); const [r1, c1] = snap(sel.r0, sel.c0, r, c); if (r1 !== sel.r0 || c1 !== sel.c0) moved = true; sel.r1 = r1; sel.c1 = c1; drawMarks(); });
    board.addEventListener('pointerup', () => { if (!dragging) return; dragging = false; if (moved && sel) tryWord(); else if (sel) { sel.r1 = null; drawMarks(); } });
    function win() {
      done = true; t.stop();
      const s = H.get(); s.best = s.best || {}; const k = key(), rec = !s.best[k] || t.secs < s.best[k];
      if (rec && tema !== 'propias') s.best[k] = Math.round(t.secs); s.wins = (s.wins || 0) + 1; H.set(s);
      confetti(root);
      overlay(root, '¡Encontraste todas!', `${fmtTime(t.secs)}${rec && tema !== 'propias' ? ' · ¡récord!' : ''}`, [btn('Otra sopa', newGame, 'primary')]);
      status();
    }
    function newGame() { closeOver(root); done = false; sel = null; t.reset(); build(); render(); status(); }
    function editCustom() {
      const ta = h('textarea', { placeholder: 'Una palabra por renglón (o separadas por comas)' }); ta.value = H.get().custom || '';
      const o = overlay(root, 'Tus palabras', 'Nombres de la familia, de tus amigos, de un tema… hasta 25.', [btn('Cancelar', () => closeOver(root)), btn('Armar la sopa', () => { save({ custom: ta.value.split(/\n/).slice(0, 40).join('\n'), tema: 'propias' }); tema = 'propias'; temaSel.value = 'propias'; newGame(); }, 'primary')]);
      o.querySelector('.mg-over-card').classList.add('sp-dlg'); o.querySelector('.mg-over-acts').before(ta); setTimeout(() => ta.focus(), 50);
    }
    const temaSel = pick('Tema', [...Object.entries(TEMA_N), ['mix', 'De todo un poco'], ['propias', 'Mis palabras']], tema, (v) => { tema = v; save({ tema: v }); if (v === 'propias' && !H.get().custom) editCustom(); else newGame(); });
    const tools = [
      temaSel,
      pick('Tamaño', Object.entries(SIZES), String(size), (v) => { size = +v; save({ size }); newGame(); }),
      pick('Direcciones', Object.entries(DIRS).map(([k, v]) => [k, v.n]), dirs, (v) => { dirs = v; save({ dirs }); newGame(); }),
      btn('✏️ Mis palabras', editCustom),
      btn('Nueva', newGame)
    ];
    requestAnimationFrame(newGame);
    return {
      el: root, tools,
      help: 'Arrastrá desde la primera letra hasta la última (o hacé clic en la primera y después en la última). Las palabras van sin tildes. Elegí tema, tamaño y direcciones, o armá la sopa con tus propias palabras.',
      hide: () => t.stop(), show: () => { if (!done && words && words.some(w => w.ok)) t.start(); }
    };
  }

  BM.register({ id: 'sopa', n: 'Sopa de letras', d: 'Encontrá las palabras escondidas. Elegí tema, tamaño y direcciones, o usá las tuyas.', c: '#c0743a', create: sopa,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#f6f1e4"/><g font-family="system-ui,sans-serif" font-weight="800" font-size="11" fill="#3a3540" text-anchor="middle"><text x="12" y="17">S</text><text x="25" y="17">O</text><text x="38" y="17">P</text><text x="51" y="17">A</text><text x="12" y="31">K</text><text x="25" y="31">L</text><text x="38" y="31">E</text><text x="51" y="31">T</text><text x="12" y="45">R</text><text x="25" y="45">A</text><text x="38" y="45">S</text><text x="51" y="45">M</text><text x="12" y="59">U</text><text x="25" y="59">Z</text><text x="38" y="59">O</text><text x="51" y="59">E</text></g><rect x="4" y="7" width="54" height="13" rx="6.5" fill="#e8743a" opacity=".45"/><line x1="12" y1="27" x2="38" y2="55" stroke="#4c8dff" stroke-width="10" stroke-linecap="round" opacity=".35"/></svg>',
    best: (s) => s.wins ? `${s.wins} sopas resueltas` : 'Nunca jugaste' });
})();
