// Tienda de Base · Ahorcado (por temas, o de a dos: uno escribe la palabra)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, seg, btn, overlay, confetti } = BM.util;
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
.ah-wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;width:100%;height:100%;padding:14px;box-sizing:border-box}
.ah-top{display:flex;align-items:center;gap:34px}
.ah-svg{width:min(250px,30vh);height:min(250px,30vh)}
.ah-info{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.ah-tema{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.ah-lives{display:flex;gap:5px}.ah-lives i{width:14px;height:14px;border-radius:50%;background:#e2554f}.ah-lives i.off{background:rgba(255,255,255,.13)}
.ah-word{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:92%}
.ah-w{display:flex;gap:6px}
.ah-l{width:clamp(26px,4.4vw,46px);height:clamp(36px,5.6vw,58px);display:grid;place-items:end center;border-bottom:4px solid rgba(255,255,255,.55);font-size:clamp(20px,3.4vw,36px);font-weight:800;color:#fff;padding-bottom:2px}
.ah-l.miss{color:#ff8a80}.ah-l.pop{animation:ahpop .35s}
@keyframes ahpop{0%{transform:scale(.4)}70%{transform:scale(1.15)}100%{transform:scale(1)}}
.ah-kb{display:flex;flex-direction:column;gap:6px;align-items:center}
.ah-kr{display:flex;gap:5px}
.ah-k{min-width:40px;height:46px;border:0;border-radius:9px;background:#5b616c;color:#fff;font-weight:800;font-size:16px;cursor:pointer}
.ah-k:hover:not(:disabled){background:#6d7480}.ah-k.ok{background:#3f9a5a}.ah-k.no{background:#2d3036;color:rgba(255,255,255,.35)}
.ah-k:disabled{cursor:default}
.ah-secret input{width:min(360px,70vw);padding:10px 12px;border-radius:10px;border:0;font:inherit;font-size:18px;background:rgba(255,255,255,.1);color:#fff;text-align:center;letter-spacing:.1em}
.ah-secret input.hint{font-size:14px;letter-spacing:0;margin-top:6px}
`;
  const LIVES = { facil: { n: '8 vidas', v: 8 }, normal: { n: '6 vidas', v: 6 }, dificil: { n: '4 vidas', v: 4 } };
  const ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
  const PARTS = 10; // horca (4) + persona (6)

  function ahorcado(H) {
    { const st0 = document.getElementById('st-ahorcado') || document.head.appendChild(h('style', { id: 'st-ahorcado' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    const S0 = H.get();
    let tema = TEMAS[S0.tema] || S0.tema === 'mix' ? S0.tema : 'mix', lv = LIVES[S0.lv] ? S0.lv : 'normal', modo = S0.modo === 'dos' ? 'dos' : 'uno';
    const root = h('div', { class: 'ah-wrap' });
    const svgBox = h('div'), info = h('div', { class: 'ah-info' }), top = h('div', { class: 'ah-top' }, svgBox, info);
    const wordBox = h('div', { class: 'ah-word' }), kb = h('div', { class: 'ah-kb' });
    root.append(top, wordBox, kb);
    let word = '', shown = '', hint = '', tried = new Set(), misses = 0, max = 6, over = true;
    const keyEls = {};
    for (const row of ROWS) kb.append(h('div', { class: 'ah-kr' }, [...row].map(ch => { const b = h('button', { type: 'button', class: 'ah-k', text: ch }); b.onclick = () => guess(ch); keyEls[ch] = b; return b; })));
    const st = () => { const s = H.get(); s.wins = s.wins || 0; s.games = s.games || 0; s.racha = s.racha || 0; return s; };
    const status = () => { const s = st(); H.status([`Ganadas ${s.wins}/${s.games}`, `Racha ${s.racha}`, modo === 'dos' ? 'De a dos' : '']); };
    const save = (o) => { const s = H.get(); Object.assign(s, o); H.set(s); };
    function drawMan() {
      // la horca aparece de a partes; con menos vidas se arranca con más partes dibujadas
      const shownParts = Math.min(PARTS, (PARTS - max) + misses);
      const P = [
        '<line x1="20" y1="230" x2="140" y2="230"/>', '<line x1="50" y1="230" x2="50" y2="20"/>', '<line x1="50" y1="20" x2="160" y2="20"/><line x1="50" y1="55" x2="85" y2="20"/>', '<line x1="160" y1="20" x2="160" y2="50"/>',
        '<circle cx="160" cy="72" r="22"/>', '<line x1="160" y1="94" x2="160" y2="160"/>', '<line x1="160" y1="112" x2="132" y2="140"/>', '<line x1="160" y1="112" x2="188" y2="140"/>', '<line x1="160" y1="160" x2="136" y2="200"/>', '<line x1="160" y1="160" x2="184" y2="200"/>'];
      const face = shownParts >= PARTS ? '<g stroke-width="3"><line x1="149" y1="65" x2="155" y2="71"/><line x1="155" y1="65" x2="149" y2="71"/><line x1="165" y1="65" x2="171" y2="71"/><line x1="171" y1="65" x2="165" y2="71"/><path d="M150 84q10-6 20 0" fill="none"/></g>' : shownParts >= 5 ? '<g fill="#fff" stroke="none"><circle cx="152" cy="68" r="2.6"/><circle cx="168" cy="68" r="2.6"/></g><path d="M151 80q9 6 18 0" fill="none" stroke-width="3"/>' : '';
      svgBox.innerHTML = `<svg class="ah-svg" viewBox="0 0 220 250" fill="none" stroke="#e9e4d8" stroke-width="5" stroke-linecap="round"><g stroke="#8a6a4a" stroke-width="7">${P.slice(0, Math.min(4, shownParts)).join('')}</g>${P.slice(4, shownParts).join('')}${face}</svg>`;
      info.replaceChildren(h('div', { class: 'ah-tema', text: hint }), h('div', { class: 'ah-lives' }, Array.from({ length: max }, (_, i) => h('i', { class: i < max - misses ? '' : 'off' }))),
        h('small', { style: 'color:var(--muted)', text: tried.size ? 'Probaste: ' + [...tried].join(' ') : 'Elegí una letra' }));
    }
    function renderWord(pop) {
      wordBox.replaceChildren();
      const parts = word.split(' ');
      let idx = 0;
      for (const p of parts) {
        const wEl = h('div', { class: 'ah-w' });
        for (let i = 0; i < p.length; i++, idx++) { const c = shown[idx]; const miss = over && c === '_'; wEl.append(h('div', { class: 'ah-l' + (miss ? ' miss' : '') + (pop && pop.has(idx) ? ' pop' : ''), text: miss ? word[idx] : c === '_' ? '' : c })); }
        idx++; wordBox.append(wEl);
      }
    }
    function start(w, label) {
      closeOver(root);
      word = w.toUpperCase().replace(/\s+/g, ' ').trim(); hint = label; tried = new Set(); misses = 0; max = LIVES[lv].v; over = false;
      shown = [...word].map(c => c === ' ' ? ' ' : /[A-ZÑÁÉÍÓÚÜ]/.test(c) ? '_' : c).join('');
      for (const b of Object.values(keyEls)) { b.className = 'ah-k'; b.disabled = false; }
      renderWord(); drawMan(); status();
    }
    function newGame() {
      if (modo === 'dos') return askSecret();
      const list = tema === 'mix' ? Object.entries(TEMAS).flatMap(([k, l]) => l.map(w => [w, TEMA_N[k]])) : TEMAS[tema].map(w => [w, TEMA_N[tema]]);
      const recent = H.get().recent || [];
      let pickw; for (let i = 0; i < 20; i++) { pickw = list[Math.floor(Math.random() * list.length)]; if (!recent.includes(pickw[0])) break; }
      save({ recent: [pickw[0], ...recent].slice(0, 30) });
      start(pickw[0], 'Tema: ' + pickw[1]);
    }
    function askSecret() {
      over = true;
      const inp = h('input', { type: 'password', placeholder: 'La palabra secreta', maxlength: 30, autocomplete: 'off' });
      const pista = h('input', { type: 'text', class: 'hint', placeholder: 'Pista (opcional): ej. "Una fruta"', maxlength: 40 });
      const go = () => { const v = inp.value.trim(); if (norm(v).length < 2) { inp.focus(); return; } start(v.replace(/[^A-Za-zÑñÁÉÍÓÚÜáéíóúü ]/g, ''), pista.value.trim() ? 'Pista: ' + pista.value.trim() : 'Palabra secreta'); };
      inp.onkeydown = pista.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Enter') go(); };
      const o = overlay(root, 'De a dos', 'Uno escribe la palabra sin que el otro mire.', [btn('Empezar', go, 'primary')]);
      o.querySelector('.mg-over-card').classList.add('ah-secret'); o.querySelector('.mg-over-acts').before(h('div', { style: 'display:grid' }, inp, pista)); setTimeout(() => inp.focus(), 50);
    }
    function guess(ch) {
      if (over || tried.has(ch)) return;
      tried.add(ch);
      const pop = new Set(); let hit = false;
      shown = [...shown].map((c, i) => { if (c === '_' && norm(word[i]) === ch) { hit = true; pop.add(i); return word[i]; } return c; }).join('');
      keyEls[ch].classList.add(hit ? 'ok' : 'no'); keyEls[ch].disabled = true;
      if (!hit) misses++;
      SFX(hit ? (pop.size > 1 ? 'good' : 'pop') : 'bad');
      const won = !shown.includes('_'), lost = misses >= max;
      if (won || lost) {
        over = true;
        const s = st(); s.games++; if (won) { s.wins++; s.racha++; s.mejor = Math.max(s.mejor || 0, s.racha); } else s.racha = 0; H.set(s);
        for (const b of Object.values(keyEls)) b.disabled = true;
        if (won) { confetti(root); overlay(root, '¡Adivinaste!', `${word}${s.racha > 1 ? ` · racha de ${s.racha}` : ''}`, [btn(modo === 'dos' ? 'Otra palabra' : 'Otra', newGame, 'primary')]); }
        else setTimeout(() => overlay(root, 'Uy, se terminó', `Era “${word}”`, [btn('Otra', newGame, 'primary')]), 700);
      }
      renderWord(pop); drawMan(); status();
    }
    function clue() {
      if (over) return;
      const left = [...new Set([...word].filter((c, i) => shown[i] === '_').map(norm))].filter(c => !tried.has(c));
      if (!left.length) return;
      if (misses + 1 >= max) { H.toast && H.toast('No te alcanzan las vidas para una pista'); return; }
      const ch = left[Math.floor(Math.random() * left.length)];
      misses++; tried.add(ch); SFX('coin'); // la pista cuesta una vida
      const pop = new Set(); shown = [...shown].map((c, i) => { if (c === '_' && norm(word[i]) === ch) { pop.add(i); return word[i]; } return c; }).join('');
      keyEls[ch].classList.add('ok'); keyEls[ch].disabled = true;
      if (!shown.includes('_')) { over = true; const s = st(); s.games++; s.wins++; s.racha++; H.set(s); confetti(root); overlay(root, '¡Adivinaste!', word, [btn('Otra', newGame, 'primary')]); }
      renderWord(pop); drawMan(); status();
    }
    const key = (e) => { if (e.ctrlKey || e.altKey || e.metaKey) return false; const k = norm(e.key); if (k.length === 1 && e.key.length === 1) { guess(k); return true; } return false; };
    const tools = [
      seg([['uno', 'Solo'], ['dos', 'De a dos']], modo, (v) => { modo = v; save({ modo: v }); newGame(); }),
      pick('Tema', [['mix', 'Todos los temas'], ...Object.entries(TEMA_N)], tema, (v) => { tema = v; save({ tema: v }); if (modo === 'uno') newGame(); }),
      pick('Vidas', Object.entries(LIVES).map(([k, v]) => [k, v.n]), lv, (v) => { lv = v; save({ lv: v }); newGame(); }),
      btn('💡 Pista', clue),
      btn('Nueva', newGame)
    ];
    requestAnimationFrame(newGame);
    return { el: root, tools, key, help: 'Escribí letras con el teclado o tocalas en pantalla. No hace falta poner tildes. La pista descubre una letra pero cuesta una vida. En “De a dos”, uno escribe la palabra secreta y el otro adivina.' };
  }

  BM.register({ id: 'ahorcado', n: 'Ahorcado', d: 'Adiviná la palabra letra por letra, por temas o de a dos (uno escribe la palabra).', c: '#7a5a3a', create: ahorcado,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#2f3542"/><g stroke="#c9a77a" stroke-width="3.5" stroke-linecap="round"><line x1="10" y1="52" x2="32" y2="52"/><line x1="16" y1="52" x2="16" y2="10"/><line x1="16" y1="10" x2="40" y2="10"/></g><g stroke="#eee" stroke-width="2.6" stroke-linecap="round" fill="none"><line x1="40" y1="10" x2="40" y2="16"/><circle cx="40" cy="21" r="5"/><line x1="40" y1="26" x2="40" y2="38"/><line x1="40" y1="30" x2="34" y2="35"/><line x1="40" y1="30" x2="46" y2="35"/></g><g fill="#fff" font-family="system-ui" font-weight="800" font-size="8"><text x="30" y="61">A _ _ A</text></g></svg>',
    best: (s) => s.games ? `${s.wins} de ${s.games} · mejor racha ${s.mejor || 0}` : 'Nunca jugaste' });
})();
