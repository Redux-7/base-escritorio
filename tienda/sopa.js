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
.sp-board{position:relative;display:grid;user-select:none;touch-action:none;background:linear-gradient(180deg,#fffdf7,#f6efdc);border-radius:18px;padding:10px;box-shadow:0 0 0 1px rgba(120,90,40,.15),0 22px 50px -22px rgba(0,0,0,.75)}
.sp-board::before{content:"";position:absolute;inset:10px;border-radius:10px;background-image:linear-gradient(rgba(120,90,40,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(120,90,40,.08) 1px,transparent 1px);background-size:var(--s) var(--s);pointer-events:none}
.sp-c{width:var(--s);height:var(--s);display:grid;place-items:center;font-weight:750;font-size:calc(var(--s)*.5);color:#33302b;cursor:pointer;position:relative;z-index:2;font-family:"Bricolage Grotesque",ui-rounded,system-ui,sans-serif;border-radius:30%;transition:color .15s,transform .12s}
.sp-c:hover{color:#000;transform:scale(1.08)}
.sp-c.on{color:#0b1f4a;transform:scale(1.12)}
.sp-c.got{color:#1f1a14}
.sp-svg{position:absolute;inset:10px;pointer-events:none;z-index:1}
.sp-side{display:flex;flex-direction:column;gap:8px;min-width:190px;max-width:250px;max-height:100%;overflow:auto;background:rgba(255,255,255,.06);border-radius:16px;padding:12px}
.sp-side h4{margin:0;font-size:12px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.08em}
.sp-side .t{font-size:18px;font-weight:800;color:#fff;margin:-4px 0 2px}
.sp-prog{height:6px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden}.sp-prog i{display:block;height:100%;background:linear-gradient(90deg,#7bd389,#4cc9f0);transition:width .3s}
.sp-list{display:flex;flex-wrap:wrap;gap:6px}
.sp-w{display:inline-flex;align-items:center;gap:6px;font-weight:700;font-size:14px;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,.08);color:#fff;transition:all .3s}
.sp-w::before{content:"";width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.25)}
.sp-w.ok{background:color-mix(in srgb,var(--hc) 30%,transparent);text-decoration:line-through;text-decoration-thickness:2px;opacity:.8}
.sp-w.ok::before{background:var(--hc)}
.sp-tip{font-size:12px;color:var(--muted);line-height:1.4}
.sp-dlg textarea{width:min(420px,70vw);height:160px;border-radius:10px;border:0;padding:10px;font:inherit;background:rgba(255,255,255,.08);color:#fff;resize:vertical}
@media (max-width:760px){.sp-wrap{flex-direction:column}.sp-side{max-width:none;min-width:0;width:100%}}
`;
  const SIZES = { 10: 'Chico', 12: 'Mediano', 15: 'Grande', 18: 'Enorme' };
  const DIRS = {
    facil: { n: 'Fácil (→ ↓)', d: [[0, 1], [1, 0]] }, normal: { n: 'Normal (+ diagonales)', d: [[0, 1], [1, 0], [1, 1], [-1, 1]] },
    dificil: { n: 'Difícil (todas, también al revés)', d: [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]] },
    libre: { n: 'Libre (en zigzag)', snake: true }
  };
  const N4 = [[0, 1], [1, 0], [0, -1], [-1, 0]]; // en el modo libre las letras se unen sólo de costado o arriba/abajo
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
    let grid, words, cells, path = null, done = false, cs = 34, lastSz = '', progEl = null, R = 12, C = 12;
    // en el modo libre el tablero es más chico y no sobra ninguna letra: todas son de alguna palabra
    const LIBRE_DIM = { 10: [6, 8], 12: [8, 8], 15: [8, 10], 18: [10, 10] };
    const dims = () => snake() ? LIBRE_DIM[size] : [size, size];
    const t = timer(() => status());
    const status = () => H.status([`${words ? words.filter(w => w.ok).length : 0}/${words ? words.length : 0} palabras`, fmtTime(t.secs), H.get().best && H.get().best[key()] ? `Récord ${fmtTime(H.get().best[key()])}` : '']);
    const key = () => `${size}-${dirs}`;
    const save = (o) => { const s = H.get(); Object.assign(s, o); H.set(s); };
    const snake = () => !!DIRS[dirs].snake;
    function source() {
      if (tema === 'propias') { const l = (H.get().custom || '').split(/[\n,;]+/).map(x => x.trim()).filter(x => norm(x).length >= 2); return l.length ? l : ['Escribí', 'tus', 'palabras']; }
      if (tema === 'mix') return Object.values(TEMAS).flat();
      return TEMAS[tema];
    }
    const inB = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
    // un camino que pasa por todas las casillas una sola vez (de costado o arriba/abajo), mezclado al azar
    function hamPath() {
      let p = []; for (let r = 0; r < R; r++) for (let k = 0; k < C; k++) p.push([r, r % 2 ? C - 1 - k : k]);
      const N = R * C, idx = new Map(); const reidx = () => { idx.clear(); p.forEach(([r, c], i) => idx.set(r * C + c, i)); }; reidx();
      for (let it = 0; it < N * 40; it++) { // "mordida": se une una punta con un vecino y se da vuelta el pedazo
        if (Math.random() < .5) { p.reverse(); reidx(); }
        const [r, c] = p[N - 1], nb = N4.map(([a, b]) => [r + a, c + b]).filter(([a, b]) => inB(a, b));
        const [a, b] = nb[Math.floor(Math.random() * nb.length)], k = idx.get(a * C + b);
        if (k === N - 2) continue;
        p = p.slice(0, k + 1).concat(p.slice(k + 1).reverse()); reidx();
      }
      return p;
    }
    // elige palabras cuyas letras suman justo todas las casillas
    function pickExact(pool, total) {
      for (let tries = 0; tries < 80; tries++) {
        const sh = pool.slice(); for (let i = sh.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [sh[i], sh[j]] = [sh[j], sh[i]]; }
        const out = []; let left = total;
        for (const it of sh) { const L = it.w.length; if (L <= left && (left - L === 0 || left - L >= 3)) { out.push(it); left -= L; } if (left === 0) return out; if (left < 12) break; }
        // lo que falta, con una combinación exacta de las que quedan
        const rest = sh.filter(x => !out.includes(x) && x.w.length <= left), dp = new Map([[0, []]]);
        for (const it of rest) for (const [v, l] of [...dp]) { const nv = v + it.w.length; if (nv <= left && !dp.has(nv)) dp.set(nv, [...l, it]); }
        if (dp.has(left)) return out.concat(dp.get(left));
      }
      return null;
    }
    function buildLibre() {
      let pool = source().map(w => ({ show: w, w: norm(w) })).filter(x => x.w.length >= 3 && x.w.length <= 10);
      const uniq = []; for (const p of pool) if (!uniq.some(u => u.w === p.w)) uniq.push(p); pool = uniq;
      if (tema === 'propias') { const extra = Object.values(TEMAS).flat().map(w => ({ show: w, w: norm(w) })).filter(x => x.w.length >= 3 && x.w.length <= 8 && !pool.some(u => u.w === x.w)); pool = pool.concat(extra.sort(() => Math.random() - .5).slice(0, 80)); }
      let sel = pickExact(pool, R * C);
      if (!sel) sel = pickExact(Object.values(TEMAS).flat().map(w => ({ show: w, w: norm(w) })).filter(x => x.w.length >= 3 && x.w.length <= 10), R * C);
      // las palabras propias van primero si se puede
      const hp = hamPath(), g = Array.from({ length: R }, () => new Array(C).fill(''));
      const order = sel.sort(() => Math.random() - .5); let i = 0; const placed = [];
      for (const it of order) {
        let p = hp.slice(i, i + it.w.length); i += it.w.length;
        if (Math.random() < .5) p = p.reverse();
        p.forEach(([r, c], k) => { g[r][c] = it.w[k]; });
        placed.push({ ...it, path: p, ok: false });
      }
      grid = g; words = placed.sort((a, b) => a.show.localeCompare(b.show, 'es'));
      words.forEach((w, k) => { w.hue = HUES[k % HUES.length]; });
    }
    function build() {
      [R, C] = dims();
      if (snake()) return buildLibre();
      const want = Math.round(size * 0.9) + 2, D = DIRS[dirs].d;
      let best = null;
      for (let attempt = 0; attempt < 6; attempt++) {
        const pool = source().map(w => ({ show: w, w: norm(w) })).filter(x => x.w.length >= 2 && x.w.length <= size);
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
        const uniq = []; for (const p of pool) if (!uniq.some(u => u.w === p.w)) uniq.push(p);
        const list = (tema === 'propias' ? uniq : uniq.slice(0, want)).sort((a, b) => b.w.length - a.w.length);
        const g = Array.from({ length: R }, () => new Array(C).fill(''));
        const placed = [];
        for (const it of list) {
          let p = null;
          for (let k = 0; k < 400 && !p; k++) {
            const [dr, dc] = D[Math.floor(Math.random() * D.length)], L = it.w.length;
            const r0 = Math.floor(Math.random() * R), c0 = Math.floor(Math.random() * C);
            if (!inB(r0 + dr * (L - 1), c0 + dc * (L - 1))) continue;
            let fit = true, overlap = 0;
            for (let i = 0; i < L; i++) { const ch = g[r0 + dr * i][c0 + dc * i]; if (ch && ch !== it.w[i]) { fit = false; break; } if (ch) overlap++; }
            if (!fit || overlap === L) continue;
            p = Array.from({ length: L }, (_, i) => [r0 + dr * i, c0 + dc * i]);
          }
          if (!p) continue;
          p.forEach(([r, c], i) => { g[r][c] = it.w[i]; });
          placed.push({ ...it, path: p, ok: false });
        }
        if (!best || placed.length > best.placed.length) best = { g, placed };
        if (placed.length >= Math.min(list.length, want)) break;
      }
      grid = best.g; words = best.placed.sort((a, b) => a.show.localeCompare(b.show, 'es'));
      words.forEach((w, i) => { w.hue = HUES[i % HUES.length]; });
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (!grid[r][c]) grid[r][c] = FILL[Math.floor(Math.random() * FILL.length)];
    }
    function fit() {
      const W = root.clientWidth || 800, Hh = root.clientHeight || 560, wide = W > 760;
      cs = Math.max(18, Math.min(snake() ? 64 : 46, Math.floor(Math.min((Hh - 50 - (wide ? 0 : 140)) / R, (W - (wide ? 310 : 40)) / C))));
      board.style.setProperty('--s', cs + 'px'); board.style.gridTemplateColumns = `repeat(${C}, ${cs}px)`;
      svg.setAttribute('viewBox', `0 0 ${C * cs} ${R * cs}`); svg.style.width = C * cs + 'px'; svg.style.height = R * cs + 'px';
      drawMarks();
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; fit(); }).observe(root);
    function render() {
      board.replaceChildren(svg); cells = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const d = h('div', { class: 'sp-c', text: grid[r][c] }); board.append(d); cells.push(d); }
      progEl = h('div', { class: 'sp-prog' }, h('i'));
      side.replaceChildren(h('h4', { text: 'Sopa de letras' }), h('div', { class: 't', text: tema === 'propias' ? 'Tus palabras' : tema === 'mix' ? 'De todo un poco' : TEMA_N[tema] }), progEl,
        h('div', { class: 'sp-list' }, words.map(w => { w.el = h('div', { class: 'sp-w' + (w.ok ? ' ok' : ''), text: w.show, style: `--hc:hsl(${w.hue} 80% 62%)` }); return w.el; })),
        h('div', { class: 'sp-tip', text: snake() ? 'En modo libre no sobra ninguna letra: todas son de alguna palabra. Cada letra está pegada a la anterior de costado, arriba o abajo (nunca en diagonal) y la palabra puede doblar. Pasá el dedo o el mouse por todas sus letras.' : 'Arrastrá de la primera a la última letra.' }));
      fit(); paintProg();
    }
    const paintProg = () => { if (progEl) progEl.firstChild.style.width = (words.length ? words.filter(w => w.ok).length / words.length * 100 : 0) + '%'; };
    const NS = 'http://www.w3.org/2000/svg';
    function line(p, col, op, wid) {
      const pts = p.map(([r, c]) => `${(c + 0.5) * cs},${(r + 0.5) * cs}`).join(' ');
      const l = document.createElementNS(NS, p.length === 1 ? 'circle' : 'polyline');
      if (p.length === 1) { l.setAttribute('cx', (p[0][1] + .5) * cs); l.setAttribute('cy', (p[0][0] + .5) * cs); l.setAttribute('r', cs * wid / 2); l.setAttribute('fill', col); }
      else { l.setAttribute('points', pts); l.setAttribute('fill', 'none'); l.setAttribute('stroke', col); l.setAttribute('stroke-width', cs * wid); l.setAttribute('stroke-linecap', 'round'); l.setAttribute('stroke-linejoin', 'round'); }
      l.setAttribute('opacity', op); svg.append(l);
    }
    function drawMarks() {
      svg.replaceChildren();
      const got = new Set();
      for (const w of words || []) if (w.ok) { line(w.path, `hsl(${w.hue} 85% 66%)`, .6, .74); w.path.forEach(([r, c]) => got.add(r * C + c)); }
      if (path) line(path, '#4c8dff', .45, .7);
      const on = new Set((path || []).map(([r, c]) => r * C + c));
      (cells || []).forEach((e, i) => { e.classList.toggle('on', on.has(i)); e.classList.toggle('got', got.has(i)); });
    }
    function cellAt(e, strict) {
      const b = board.getBoundingClientRect(), x = e.clientX - b.left - 10, y = e.clientY - b.top - 10, c = Math.floor(x / cs), r = Math.floor(y / cs);
      if (strict) { const fx = x / cs - c - .5, fy = y / cs - r - .5; if (fx * fx + fy * fy > .3) return null; } // en zigzag, sólo cuenta cerca del centro de la letra
      return [Math.max(0, Math.min(R - 1, r)), Math.max(0, Math.min(C - 1, c))];
    }
    function snap(r0, c0, r, c) {
      let dr = r - r0, dc = c - c0; if (!dr && !dc) return [[r0, c0]];
      const ad = Math.abs(dr), ac = Math.abs(dc);
      if (ad > ac * 2) dc = 0; else if (ac > ad * 2) dr = 0; else { const m = Math.max(ad, ac); dr = Math.sign(dr) * m; dc = Math.sign(dc) * m; }
      let r1 = r0 + dr, c1 = c0 + dc;
      while (!inB(r1, c1)) { r1 -= Math.sign(dr); c1 -= Math.sign(dc); }
      const L = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0)) + 1, sr = Math.sign(r1 - r0), sc = Math.sign(c1 - c0);
      return Array.from({ length: L }, (_, i) => [r0 + sr * i, c0 + sc * i]);
    }
    function tryWord() {
      const p = path; path = null; if (!p || p.length < 2) { drawMarks(); return; }
      const okBefore = words.filter(w => w.ok).length;
      const s1 = p.map(([r, c]) => grid[r][c]).join(''), s2 = [...s1].reverse().join(''); 
      const w = words.find(x => !x.ok && (x.w === s1 || x.w === s2));
      if (w) { w.ok = true; w.path = w.w === s1 ? p : p.slice().reverse(); w.el.classList.add('ok'); }
      drawMarks(); status(); paintProg();
      if (!words.every(x => x.ok)) SFX(words.filter(x => x.ok).length > okBefore ? 'good' : 'erase');
      if (words.every(x => x.ok) && !done) win();
    }
    let dragging = false, start = null, clickMode = false;
    board.addEventListener('pointerdown', (e) => {
      if (done) return; e.preventDefault(); const rc = cellAt(e); if (!rc) return; const [r, c] = rc;
      if (clickMode && path && !snake()) { path = snap(start[0], start[1], r, c); clickMode = false; tryWord(); return; }
      if (!t.running) t.start();
      SFX('tap'); start = [r, c]; path = [[r, c]]; dragging = true; clickMode = false; board.setPointerCapture(e.pointerId); drawMarks();
    });
    board.addEventListener('pointermove', (e) => {
      if (!dragging || !path) return;
      if (snake()) {
        const rc = cellAt(e, true); if (!rc) return; const [r, c] = rc, last = path[path.length - 1];
        if (r === last[0] && c === last[1]) return;
        const prev = path[path.length - 2];
        if (prev && prev[0] === r && prev[1] === c) { path.pop(); drawMarks(); return; } // volver atrás borra la última
        if (Math.abs(r - last[0]) + Math.abs(c - last[1]) === 1 && !path.some(([a, b]) => a === r && b === c)) { path.push([r, c]); SFX('tick'); drawMarks(); }
      } else { const [r, c] = cellAt(e); path = snap(start[0], start[1], r, c); drawMarks(); }
    });
    board.addEventListener('pointerup', () => {
      if (!dragging) return; dragging = false;
      if (path && path.length > 1) tryWord();
      else if (!snake()) { clickMode = true; drawMarks(); } // clic en la primera y después en la última
      else { path = null; drawMarks(); }
    });
    function win() {
      done = true; t.stop();
      const s = H.get(); s.best = s.best || {}; const k = key(), rec = !s.best[k] || t.secs < s.best[k];
      if (rec && tema !== 'propias') s.best[k] = Math.round(t.secs); s.wins = (s.wins || 0) + 1; H.set(s);
      confetti(root);
      overlay(root, '¡Encontraste todas!', `${fmtTime(t.secs)}${rec && tema !== 'propias' ? ' · ¡récord!' : ''}`, [btn('Otra sopa', newGame, 'primary')]);
      status();
    }
    function newGame() { closeOver(root); done = false; path = null; clickMode = false; t.reset(); build(); render(); status(); }
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
    root.__sp = { words: () => words, grid: () => grid, size: () => size, cs: () => cs, dims: () => [R, C] };
    requestAnimationFrame(newGame);
    return {
      el: root, tools,
      help: 'Arrastrá desde la primera letra hasta la última (o hacé clic en la primera y después en la última). En Direcciones > Libre todas las letras son de alguna palabra; cada letra se une a la siguiente de costado, arriba o abajo y la palabra puede doblar: pasá por todas. Las palabras van sin tildes.',
      hide: () => t.stop(), show: () => { if (!done && words && words.some(w => w.ok)) t.start(); }
    };
  }

  BM.register({ id: 'sopa', n: 'Sopa de letras', d: 'Encontrá las palabras escondidas. Elegí tema, tamaño y direcciones, o usá las tuyas.', c: '#c0743a', create: sopa,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#f6f1e4"/><g font-family="system-ui,sans-serif" font-weight="800" font-size="11" fill="#3a3540" text-anchor="middle"><text x="12" y="17">S</text><text x="25" y="17">O</text><text x="38" y="17">P</text><text x="51" y="17">A</text><text x="12" y="31">K</text><text x="25" y="31">L</text><text x="38" y="31">E</text><text x="51" y="31">T</text><text x="12" y="45">R</text><text x="25" y="45">A</text><text x="38" y="45">S</text><text x="51" y="45">M</text><text x="12" y="59">U</text><text x="25" y="59">Z</text><text x="38" y="59">O</text><text x="51" y="59">E</text></g><rect x="4" y="7" width="54" height="13" rx="6.5" fill="#e8743a" opacity=".45"/><line x1="12" y1="27" x2="38" y2="55" stroke="#4c8dff" stroke-width="10" stroke-linecap="round" opacity=".35"/></svg>',
    best: (s) => s.wins ? `${s.wins} sopas resueltas` : 'Nunca jugaste' });
})();
