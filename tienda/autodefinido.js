// Tienda de Base · Autodefinido (crucigrama con las definiciones adentro de la grilla)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti, timer, fmtTime } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const PISTAS = {"AS": ["Carta de valor uno"], "FE": ["Creencia"], "TE": ["Infusión"], "YO": ["Primera persona"], "MI": ["Nota musical"], "RE": ["Nota musical"], "LA": ["Nota musical"], "SOL": ["Astro rey"], "DO": ["Primera nota"], "OSO": ["Animal que hiberna"], "ASA": ["Agarradera de taza"], "ALA": ["Sirve para volar"], "AVE": ["Animal con plumas"], "ORO": ["Metal precioso"], "MAR": ["Agua salada"], "RIO": ["Corre hacia el mar"], "LUZ": ["Contrario de sombra"], "PAN": ["Sale del horno"], "SAL": ["Condimento blanco"], "OLA": ["Viene de la orilla"], "OJO": ["Órgano de la vista"], "UVA": ["Da el vino"], "ARO": ["Anillo, argolla"], "OCA": ["Ganso"], "ETA": ["Letra griega"], "RED": ["Para pescar"], "TOS": ["Síntoma de resfrío"], "PIE": ["Tiene cinco dedos"], "SED": ["Ganas de beber"], "MES": ["Dura unos 30 días"], "DIA": ["Tiene 24 horas"], "AÑO": ["Período de doce meses"], "REY": ["Lleva corona"], "LEY": ["Norma del Congreso"], "VOZ": ["Sale al hablar"], "NOE": ["Construyó el arca"], "EVA": ["Primera mujer"], "ADAN": ["Primer hombre"], "ISLA": ["Tierra rodeada de agua"], "LAGO": ["Agua dulce quieta"], "OSA": ["Hembra del oso"], "ROSA": ["Flor con espinas", "Color suave"], "CASA": ["Hogar"], "MESA": ["Mueble para comer"], "SILLA": ["Para sentarse"], "CAMA": ["Para dormir"], "LUNA": ["Satélite de la Tierra"], "NUBE": ["Trae lluvia"], "ARCO": ["Lanza flechas", "Lo defiende el arquero"], "FOCA": ["Mamífero marino"], "LOBO": ["Aúlla a la luna"], "PATO": ["Ave de laguna"], "GATO": ["Maúlla"], "PERRO": ["Ladra"], "VACA": ["Da leche"], "TORO": ["Macho de la vaca"], "LORO": ["Ave que habla"], "MONO": ["Primate"], "PUMA": ["Felino americano"], "RANA": ["Croa"], "SAPO": ["Pariente de la rana"], "ERA": ["Período histórico"], "ORA": ["Reza"], "ATE": ["Del verbo atar"], "ESE": ["Pronombre demostrativo"], "OTRO": ["No este"], "NADA": ["Ninguna cosa"], "TODO": ["La totalidad"], "AMOR": ["Sentimiento del corazón"], "ODIO": ["Contrario del amor"], "RISA": ["Muestra de alegría"], "PAZ": ["Contrario de guerra"], "AGUA": ["H2O"], "AIRE": ["Lo respiramos"], "FUEGO": ["Quema"], "TIERRA": ["Nuestro planeta"], "NIEVE": ["Cae en invierno"], "HIELO": ["Agua congelada"], "VIENTO": ["Mueve las hojas"], "LLUVIA": ["Cae de las nubes"], "RAYO": ["Cae en la tormenta"], "TRUENO": ["Ruido de tormenta"], "ESTE": ["Punto cardinal"], "OESTE": ["Por donde se pone el sol"], "NORTE": ["Lo marca la brújula"], "SUR": ["Punto cardinal"], "ARENA": ["Hay en la playa"], "PLAYA": ["Lugar de veraneo"], "DUNA": ["Médano"], "OASIS": ["Agua en el desierto"], "SELVA": ["Bosque tropical"], "VALLE": ["Entre montañas"], "CERRO": ["Monte pequeño"], "ALAMO": ["Árbol alto"], "PINO": ["Árbol de Navidad"], "CEIBO": ["Flor nacional"], "ROBLE": ["Árbol de madera dura"], "HOJA": ["Tiene el árbol"], "RAMA": ["Sale del tronco"], "RAIZ": ["Va bajo tierra"], "SEMILLA": ["Origen de la planta"], "TALLO": ["Sostiene la flor"], "LIMA": ["Herramienta o fruta", "Capital de Perú"], "LIMON": ["Fruta ácida"], "PERA": ["Fruta con forma de lámpara"], "HIGO": ["Fruto de la higuera"], "KIWI": ["Fruta peluda"], "MANGO": ["Fruta tropical"], "COCO": ["Fruto de la palmera"], "MELON": ["Fruta de verano"], "SANDIA": ["Roja por dentro"], "PAPA": ["Tubérculo", "Padre"], "AJO": ["Espanta vampiros"], "ARROZ": ["Cereal oriental"], "TRIGO": ["Da la harina"], "MAIZ": ["Da el choclo"], "CAFE": ["Bebida negra"], "MATE": ["Infusión argentina"], "LECHE": ["Blanca y nutritiva"], "QUESO": ["Hecho con leche"], "DULCE": ["Contrario de salado"], "TORTA": ["De cumpleaños"], "FLAN": ["Postre con caramelo"], "ASADO": ["Comida del domingo"], "GUISO": ["Plato de olla"], "SOPA": ["Se toma con cuchara"], "TACO": ["Comida mexicana"], "PIZZA": ["Muzzarella sobre masa"], "HELADO": ["Postre frío"], "MIEL": ["La hacen las abejas"], "ACEITE": ["De oliva o girasol"], "HUEVO": ["Lo pone la gallina"], "POLLO": ["Cría de gallina"], "CARNE": ["La vende el carnicero"], "PESCADO": ["Comida del mar"], "OLLA": ["Recipiente de cocina"], "TAZA": ["Para el café"], "VASO": ["Para beber"], "PLATO": ["Para servir"], "TENEDOR": ["Cubierto con dientes"], "CUCHARA": ["Cubierto para sopa"], "HORNO": ["Cocina el pan"], "MANO": ["Tiene cinco dedos"], "DEDO": ["Tiene uña"], "UÑA": ["Crece en el dedo"], "BRAZO": ["Va del hombro a la mano"], "CODO": ["Articulación del brazo"], "NARIZ": ["Órgano del olfato"], "BOCA": ["Por ella comemos"], "LABIO": ["Borde de la boca"], "DIENTE": ["Lo arregla el dentista"], "OREJA": ["Órgano del oído"], "PELO": ["Cabello"], "PIEL": ["Cubre el cuerpo"], "HUESO": ["Lo roe el perro"], "SANGRE": ["Corre por las venas"], "NUCA": ["Parte de atrás del cuello"], "RODILLA": ["Articulación de la pierna"], "CARA": ["Rostro"], "CEJA": ["Encima del ojo"], "TIO": ["Hermano del padre"], "TIA": ["Hermana de la madre"], "NIETO": ["Hijo del hijo"], "PRIMO": ["Hijo del tío"], "MAMA": ["Madre"], "NENE": ["Niño chico"], "BEBE": ["Recién nacido"], "NOVIA": ["Prometida"], "BODA": ["Casamiento"], "AMIGO": ["Compañero querido"], "VECINO": ["Vive al lado"], "REINA": ["Esposa del rey"], "PAPEL": ["Se escribe en él"], "LAPIZ": ["Escribe y se borra"], "LIBRO": ["Tiene páginas"], "CARTA": ["Se manda por correo"], "SOBRE": ["Envuelve la carta"], "NOTA": ["Calificación escolar", "Sonido musical"], "AULA": ["Salón de clases"], "TIZA": ["Escribe en el pizarrón"], "REGLA": ["Mide en centímetros"], "MAPA": ["Representa un territorio"], "RELOJ": ["Da la hora"], "HORA": ["Sesenta minutos"], "AYER": ["Antes de hoy"], "HOY": ["Este día"], "TARDE": ["Después del mediodía"], "NOCHE": ["Cuando sale la luna"], "ALBA": ["Primera luz del día"], "AURORA": ["Luz del amanecer"], "LUNES": ["Primer día hábil"], "MARTES": ["Día de mala suerte"], "ENERO": ["Primer mes"], "MAYO": ["Mes de la Revolución"], "JULIO": ["Mes de la Independencia"], "ABRIL": ["Cuarto mes"], "OTOÑO": ["Caen las hojas"], "VERANO": ["Estación de calor"], "INVIERNO": ["Estación fría"], "AUTO": ["Vehículo de cuatro ruedas"], "TREN": ["Va por las vías"], "AVION": ["Vuela con pasajeros"], "BARCO": ["Navega"], "MOTO": ["Vehículo de dos ruedas"], "TAXI": ["Auto de alquiler"], "BICI": ["Se pedalea"], "CAMION": ["Lleva cargas"], "RUEDA": ["Es redonda y gira"], "RUTA": ["Camino entre ciudades"], "CALLE": ["Va entre veredas"], "PLAZA": ["Espacio verde urbano"], "PUENTE": ["Cruza el río"], "TORRE": ["Construcción alta"], "MURO": ["Pared gruesa"], "TECHO": ["Cubre la casa"], "PUERTA": ["Se abre y se cierra"], "LLAVE": ["Abre la cerradura"], "VENTANA": ["Deja pasar la luz"], "PISO": ["Se camina sobre él"], "PATIO": ["Espacio al aire libre"], "JARDIN": ["Tiene flores"], "CANCHA": ["Se juega al fútbol"], "GOL": ["Grito del fútbol"], "PELOTA": ["Es redonda y rebota"], "TENIS": ["Deporte de raqueta"], "BOXEO": ["Deporte de guantes"], "JUDO": ["Arte marcial japonés"], "POLO": ["Deporte a caballo"], "RUGBY": ["Deporte con pelota ovalada"], "NADO": ["Del verbo nadar"], "TANGO": ["Baile porteño"], "DANZA": ["Baile"], "CANTO": ["Lo hace el cantante"], "PIANO": ["Instrumento de teclas"], "ARPA": ["Instrumento de cuerdas"], "BOMBO": ["Instrumento de percusión"], "GUITARRA": ["Tiene seis cuerdas"], "OPERA": ["Teatro cantado"], "COPLA": ["Estrofa popular"], "POEMA": ["Escrito en verso"], "VERSO": ["Línea de un poema"], "RIMA": ["Coincidencia de sonidos"], "CINE": ["Se ven películas"], "FILM": ["Película"], "ACTOR": ["Trabaja en el teatro"], "DRAMA": ["Obra seria"], "RADIO": ["Se escucha en el auto"], "DIARIO": ["Sale todos los días"], "FOTO": ["Imagen capturada"], "ARTE": ["Expresión creativa", "Pintura o escultura"], "OLEO": ["Pintura al aceite"], "MUSEO": ["Exhibe obras"], "ROJO": ["Color de la sangre"], "AZUL": ["Color del cielo"], "VERDE": ["Color del pasto"], "GRIS": ["Entre blanco y negro"], "NEGRO": ["Ausencia de color"], "BLANCO": ["Color de la nieve"], "CELESTE": ["Color de la bandera"], "OCRE": ["Color tierra"], "UNO": ["Primer número"], "DOS": ["Par"], "TRES": ["Número de un trío"], "CINCO": ["Dedos de la mano"], "SEIS": ["Caras de un dado"], "SIETE": ["Días de la semana"], "OCHO": ["Patas de la araña"], "NUEVE": ["Uno menos que diez"], "DIEZ": ["Decena"], "CIEN": ["Diez decenas"], "MIL": ["Diez centenas"], "PAR": ["Dos iguales"], "CERO": ["Nada en números"], "SUMA": ["Operación de adición"], "RESTA": ["Operación inversa a sumar"], "ESPADA": ["Arma de caballero"], "ESCUDO": ["Defiende del golpe"], "CASCO": ["Protege la cabeza"], "TRONO": ["Asiento del rey"], "CETRO": ["Bastón real"], "CORONA": ["La usa el rey"], "DUQUE": ["Título noble"], "CONDE": ["Título nobiliario"], "HADA": ["Tiene varita mágica"], "OGRO": ["Gigante de cuento"], "ENANO": ["Hay siete con Blancanieves"], "MAGO": ["Hace trucos"], "BRUJA": ["Vuela en escoba"], "GENIO": ["Sale de la lámpara"], "ANGEL": ["Tiene alas y aureola"], "SANTO": ["Persona canonizada"], "MISA": ["Ceremonia religiosa"], "TEMPLO": ["Lugar de culto"], "FARO": ["Guía a los barcos"], "PUERTO": ["Llegan los barcos"], "ANCLA": ["Fija el barco"], "VELA": ["Impulsa el velero", "Se sopla en la torta"], "REMO": ["Mueve el bote"], "BOTE": ["Barca pequeña"], "NAVE": ["Embarcación"], "COHETE": ["Va al espacio"], "ASTRO": ["Cuerpo celeste"], "COMETA": ["Tiene cola luminosa"], "ORBITA": ["Camino de un planeta"], "MARTE": ["Planeta rojo"], "VENUS": ["Lucero del alba"], "CIELO": ["Es celeste"], "ESTRELLA": ["Brilla de noche"], "ZORRO": ["Animal astuto"], "CIERVO": ["Tiene astas"], "LIEBRE": ["Pariente del conejo"], "CONEJO": ["Sale de la galera"], "RATON": ["Le teme al gato"], "ARDILLA": ["Junta nueces"], "CEBRA": ["Tiene rayas"], "TIGRE": ["Felino rayado", "Ciudad del delta"], "LEON": ["Rey de la selva"], "OVEJA": ["Da lana"], "CABRA": ["Trepa montañas"], "CERDO": ["Chancho"], "BURRO": ["Animal de carga"], "MULA": ["Hija de burro y yegua"], "YEGUA": ["Hembra del caballo"], "POTRO": ["Caballo joven"], "CABALLO": ["Relincha"], "GALLO": ["Canta al amanecer"], "GALLINA": ["Pone huevos"], "PALOMA": ["Ave de la paz"], "AGUILA": ["Ave rapaz"], "CONDOR": ["Ave de los Andes"], "HORNERO": ["Ave nacional"], "GAVIOTA": ["Ave costera"], "PINGUINO": ["Ave que no vuela"], "BALLENA": ["Mamífero gigante"], "DELFIN": ["Mamífero inteligente"], "PULPO": ["Tiene ocho brazos"], "TIBURON": ["Pez temido"], "ATUN": ["Pez en lata"], "MERLUZA": ["Pez para filete"], "ABEJA": ["Hace miel"], "HORMIGA": ["Insecto trabajador"], "ARAÑA": ["Teje su tela"], "MOSCA": ["Insecto molesto"], "GRILLO": ["Canta de noche"], "MARIPOSA": ["Fue oruga"], "CANGURO": ["Salta con la cría"], "CAMELLO": ["Tiene jorobas"], "JIRAFA": ["Cuello largo"], "ELEFANTE": ["Tiene trompa"], "TORTUGA": ["Lleva su caparazón"], "LAGARTO": ["Reptil"], "NIDO": ["Casa del pájaro"], "CUEVA": ["Refugio en la roca"], "CAMPO": ["Afuera de la ciudad"], "GRANJA": ["Tiene animales"], "ESTANCIA": ["Campo grande"], "TRACTOR": ["Ara el campo"], "ARADO": ["Abre surcos"], "COSECHA": ["Recolección"], "SILO": ["Guarda granos"], "ACERO": ["Hierro con carbono"], "HIERRO": ["Metal fuerte"], "PLATA": ["Metal blanco"], "COBRE": ["Metal rojizo"], "PLOMO": ["Metal pesado"], "CARBON": ["Combustible negro"], "PIEDRA": ["Roca"], "MARMOL": ["Piedra de estatuas"], "VIDRIO": ["Transparente y frágil"], "MADERA": ["Viene del árbol"], "TELA": ["Se cose"], "LANA": ["Viene de la oveja"], "SEDA": ["Tela del gusano"], "HILO": ["Se pasa por la aguja"], "AGUJA": ["Para coser"], "BOTON": ["Abrocha la camisa"], "CAMISA": ["Prenda con cuello"], "SACO": ["Abrigo de traje"], "GORRO": ["Para la cabeza"], "BUFANDA": ["Abriga el cuello"], "MEDIA": ["Va en el pie"], "ZAPATO": ["Calzado"], "BOTA": ["Calzado alto"], "FALDA": ["Pollera"], "POLLERA": ["Prenda femenina"], "ANILLO": ["Va en el dedo"], "COLLAR": ["Va en el cuello"], "PERLA": ["Sale de la ostra"], "RUBI": ["Piedra roja"], "DIAMANTE": ["Piedra más dura"], "SOFA": ["Sillón grande"], "ALFOMBRA": ["Cubre el piso"], "ESPEJO": ["Refleja"], "LAMPARA": ["Ilumina"], "CORTINA": ["Tapa la ventana"], "ESTUFA": ["Da calor"], "DUCHA": ["Para bañarse"], "JABON": ["Hace espuma"], "TOALLA": ["Para secarse"], "PEINE": ["Para el pelo"], "CEPILLO": ["Para los dientes"], "ESCOBA": ["Para barrer"], "BALDE": ["Lleva agua"], "REGALO": ["Se da en cumpleaños"], "FIESTA": ["Celebración"], "GLOBO": ["Se infla"], "JUEGO": ["Diversión"], "DADO": ["Tiene seis caras"], "NAIPE": ["Carta de juego"], "TRUCO": ["Juego de cartas criollo"], "AJEDREZ": ["Tiene rey y reina"], "DAMA": ["Pieza de ajedrez"], "ALFIL": ["Mueve en diagonal"], "PEON": ["Pieza menor del ajedrez"], "LOTERIA": ["Juego de azar"], "SUERTE": ["Fortuna"], "SALUD": ["Bienestar"], "MEDICO": ["Cura enfermos"], "REMEDIO": ["Medicamento"], "FIEBRE": ["Temperatura alta"], "SUEÑO": ["Ganas de dormir"], "HAMBRE": ["Ganas de comer"], "MIEDO": ["Temor"], "ENOJO": ["Bronca"], "ALEGRIA": ["Felicidad"], "TRISTE": ["Apenado"], "FELIZ": ["Contento"], "LENTO": ["Sin prisa"], "RAPIDO": ["Veloz"], "ALTO": ["De gran estatura"], "BAJO": ["De poca altura"], "GORDO": ["Contrario de flaco"], "FLACO": ["Delgado"], "VIEJO": ["Anciano"], "NUEVO": ["Recién hecho"], "FRIO": ["Contrario de calor"], "CALOR": ["Temperatura alta"], "SECO": ["Sin agua"], "LIMPIO": ["Sin suciedad"], "LLENO": ["Sin lugar libre"], "VACIO": ["Sin nada adentro"], "LEJOS": ["Contrario de cerca"], "CERCA": ["A poca distancia"], "ARRIBA": ["Contrario de abajo"], "NUNCA": ["En ningún momento"], "SIEMPRE": ["En todo momento"], "ROMA": ["Capital de Italia"], "PARIS": ["Ciudad Luz"], "QUITO": ["Capital de Ecuador"], "CUBA": ["Isla del Caribe"], "CHILE": ["País trasandino"], "PERU": ["País de los incas"], "OSLO": ["Capital de Noruega"], "NILO": ["Río de Egipto"], "ANDES": ["Cordillera sudamericana"], "ETNA": ["Volcán de Sicilia"], "URAL": ["Montes de Rusia"], "SALTA": ["La Linda"], "JUJUY": ["Tiene la Quebrada de Humahuaca"], "TANDIL": ["Ciudad serrana bonaerense"], "PARANA": ["Río y ciudad"], "CHACO": ["Provincia del norte"], "EUROPA": ["Continente viejo"], "ASIA": ["Continente más grande"], "AFRICA": ["Continente del Sahara"]};

  const CSS = `
.ad-wrap{display:flex;align-items:center;justify-content:center;width:100%;height:100%;padding:12px;box-sizing:border-box;user-select:none;gap:18px}
.ad-grid{display:grid;gap:2px;background:#2b2f38;padding:3px;border-radius:8px;box-shadow:0 18px 40px -18px rgba(0,0,0,.8)}
.ad-c{width:var(--s);height:var(--s);position:relative;box-sizing:border-box}
.ad-c.x{background:#3b404b}
.ad-c.l{background:#fbf8f0;display:grid;place-items:center;font-weight:800;font-size:calc(var(--s)*.56);color:#1b2433;cursor:pointer;font-family:ui-rounded,system-ui,sans-serif}
.ad-c.l.hl{background:#dfeaff}.ad-c.l.cur{background:#ffe27a}
.ad-c.l.bad{color:#d62d20}.ad-c.l.rev{color:#2f6fd6}.ad-c.l.okw{background:#e3f5e6}
.ad-c.q{background:#cfe0f2;display:flex;flex-direction:column;color:#1d3350;cursor:pointer}
.ad-c.q.hl{background:#a9c8ec}
.ad-q{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.05;padding:1px 2px;font-weight:650;position:relative;overflow:hidden;overflow-wrap:anywhere;hyphens:auto}
.ad-q + .ad-q{border-top:1px solid rgba(29,51,80,.35)}
.ad-q i{position:absolute;font-style:normal;font-size:calc(var(--s)*.2);color:#c0392b;font-weight:900}
.ad-q i.r{right:0;top:50%;transform:translateY(-55%)}.ad-q i.d{bottom:-2px;left:50%;transform:translateX(-50%)}
.ad-side{max-width:250px;display:flex;flex-direction:column;gap:8px;color:var(--muted);font-size:13px}
.ad-side b{color:#fff;font-size:15px}
@media (max-width:900px){.ad-side{display:none}}
`;
  const SIZES = { chico: { n: 'Chico (9×9)', r: 9, c: 9 }, mediano: { n: 'Mediano (11×11)', r: 11, c: 11 }, grande: { n: 'Grande (11×15)', r: 11, c: 15 } };

  // ---------- generador ----------
  function generate(R, C) {
    const words = Object.keys(PISTAS).filter(w => w.length >= 2 && w.length <= Math.max(R, C) - 1);
    const byLetter = new Map();
    for (const w of words) for (let k = 0; k < w.length; k++) { const key = w[k]; if (!byLetter.has(key)) byLetter.set(key, []); byLetter.get(key).push([w, k]); }
    let best = null;
    for (let attempt = 0; attempt < 24; attempt++) {
      const G = Array.from({ length: R }, () => new Array(C).fill(null)); // null | {t:'l',ch} | {t:'q',clues:{r?,d?}} | {t:'b'}
      const used = new Set(), list = [];
      const inB = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
      const isL = (r, c) => inB(r, c) && G[r][c] && G[r][c].t === 'l';
      function canPlace(w, r0, c0, dr, dc) {
        const qr = r0 - dr, qc = c0 - dc; if (!inB(qr, qc)) return -1;
        const q = G[qr][qc]; const dk = dr ? 'd' : 'r';
        if (q && (q.t === 'l' || (q.t === 'q' && q.clues[dk]))) return -1;
        const er = r0 + dr * w.length, ec = c0 + dc * w.length;
        if (inB(er, ec) && G[er][ec] && G[er][ec].t === 'l') return -1;
        let cross = 0;
        for (let i = 0; i < w.length; i++) {
          const r = r0 + dr * i, c = c0 + dc * i; if (!inB(r, c)) return -1;
          const g = G[r][c];
          if (g) { if (g.t !== 'l' || g.ch !== w[i]) return -1; if (g[dk]) return -1; cross++; continue; }
          // sin letras pegadas de costado (para no formar palabras sin definición)
          if (isL(r + dc, c + dr) || isL(r - dc, c - dr)) return -1;
        }
        if (cross === w.length) return -1;
        return cross;
      }
      function place(w, r0, c0, dr, dc) {
        const dk = dr ? 'd' : 'r', qr = r0 - dr, qc = c0 - dc;
        if (!G[qr][qc] || G[qr][qc].t !== 'q') G[qr][qc] = { t: 'q', clues: {} };
        const cl = PISTAS[w]; G[qr][qc].clues[dk] = { w, txt: cl[Math.floor(Math.random() * cl.length)] };
        const cells = [];
        for (let i = 0; i < w.length; i++) { const r = r0 + dr * i, c = c0 + dc * i; if (!G[r][c]) G[r][c] = { t: 'l', ch: w[i] }; G[r][c][dk] = list.length + 1; cells.push([r, c]); }
        const er = r0 + dr * w.length, ec = c0 + dc * w.length; if (inB(er, ec) && !G[er][ec]) G[er][ec] = { t: 'b' };
        used.add(w); list.push({ w, cells, dk, q: [qr, qc] });
      }
      // primera palabra
      const first = words.filter(w => w.length >= Math.min(6, C - 2) && w.length <= C - 1);
      const fw = first[Math.floor(Math.random() * first.length)];
      const fr = 1 + 2 * Math.floor(Math.random() * Math.min(3, Math.floor((R - 1) / 2)));
      place(fw, fr, 1, 0, 1);
      for (let step = 0; step < 200; step++) {
        const cands = [];
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const g = G[r][c]; if (!g || g.t !== 'l') continue;
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const dk = dr ? 'd' : 'r'; if (g[dk]) continue;
            const opts = byLetter.get(g.ch) || [];
            for (let n = 0; n < 40; n++) {
              const [w, k] = opts[Math.floor(Math.random() * opts.length)]; if (used.has(w)) continue;
              const r0 = r - dr * k, c0 = c - dc * k, cr = canPlace(w, r0, c0, dr, dc);
              if (cr > 0) cands.push({ w, r0, c0, dr, dc, sc: cr * 4 + w.length + Math.random() * 3 });
            }
          }
        }
        if (!cands.length) break;
        cands.sort((a, b) => b.sc - a.sc);
        const pk = cands[Math.floor(Math.random() * Math.min(3, cands.length))];
        place(pk.w, pk.r0, pk.c0, pk.dr, pk.dc);
      }
      let letters = 0; for (const row of G) for (const g of row) if (g && g.t === 'l') letters++;
      const sc = letters + list.length * 2;
      if (!best || sc > best.sc) best = { G, list, sc };
    }
    return best;
  }

  function autodefinido(H) {
    { const st0 = document.getElementById('st-autodef') || document.head.appendChild(h('style', { id: 'st-autodef' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    let size = SIZES[H.get().size] ? H.get().size : 'mediano';
    const root = h('div', { class: 'ad-wrap' }), gridEl = h('div', { class: 'ad-grid' }), side = h('div', { class: 'ad-side' });
    root.append(gridEl, side);
    let P, R, C, ans, els, cur = null, dk = 'r', done, checked, lastSz = '';
    const t = timer(() => status());
    const status = () => { if (!P) return; const tot = P.list.length, ok = P.list.filter(x => x.cells.every(([r, c]) => ans[r][c] === P.G[r][c].ch)).length; H.status([`${ok}/${tot} palabras`, fmtTime(t.secs), H.get().solved ? `Resueltos ${H.get().solved}` : '']); };
    function newGame() {
      closeOver(root); const S = SIZES[size]; R = S.r; C = S.c;
      P = generate(R, C); ans = Array.from({ length: R }, () => new Array(C).fill('')); cur = null; done = false; checked = false; t.reset();
      render(); fit(); status();
      side.replaceChildren(h('b', { text: 'Cómo se juega' }), h('span', { text: 'Cada casillero celeste tiene una definición; la flechita indica hacia dónde va la respuesta.' }), h('span', { text: 'Tocá un casillero blanco y escribí. Tocalo otra vez (o Espacio) para cambiar entre horizontal y vertical.' }), h('span', { text: 'Las respuestas van sin tildes.' }));
    }
    function wordAt(r, c, d) { const g = P.G[r][c]; if (!g || g.t !== 'l' || !g[d]) return null; return P.list[g[d] - 1]; }
    function render() {
      gridEl.style.gridTemplateColumns = `repeat(${C}, var(--s))`; gridEl.replaceChildren(); els = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const g = P.G[r][c]; let d;
        if (!g || g.t === 'b') d = h('div', { class: 'ad-c x' });
        else if (g.t === 'l') { d = h('div', { class: 'ad-c l' }); d.onclick = () => select(r, c, true); }
        else {
          d = h('div', { class: 'ad-c q' });
          const parts = [['r', '▸'], ['d', '▾']].filter(([k]) => g.clues[k]);
          for (const [k, arrow] of parts) {
            const txt = g.clues[k].txt, n = txt.length, two = parts.length > 1;
            const fs = two ? (n > 18 ? 0.135 : n > 11 ? 0.15 : 0.17) : (n > 24 ? 0.15 : n > 14 ? 0.17 : 0.2);
            const longest = Math.max(...txt.split(/\s+/).map(x => x.length)), fs2 = Math.min(fs, 0.8 / (0.6 * longest));
            const q = h('div', { class: 'ad-q', lang: 'es', style: `font-size:calc(var(--s) * ${fs2.toFixed(3)})` }, txt, h('i', { class: k, text: arrow }));
            q.onclick = () => { const w = g.clues[k]; const it = P.list.find(x => x.w === w.w && x.dk === k); if (it) { dk = k; const fc = it.cells.find(([rr, cc]) => !ans[rr][cc]) || it.cells[0]; select(fc[0], fc[1]); } };
            d.append(q);
          }
        }
        gridEl.append(d); els.push(d);
      }
      paint();
    }
    function paint() {
      const W = cur ? wordAt(cur[0], cur[1], dk) : null, inW = new Set(W ? W.cells.map(([r, c]) => r * C + c) : []);
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const g = P.G[r][c], d = els[r * C + c]; if (!g) continue;
        if (g.t === 'l') {
          d.textContent = ans[r][c];
          d.classList.toggle('hl', inW.has(r * C + c)); d.classList.toggle('cur', !!cur && cur[0] === r && cur[1] === c);
          d.classList.toggle('bad', checked && !!ans[r][c] && ans[r][c] !== g.ch);
        } else if (g.t === 'q') d.classList.toggle('hl', !!W && W.q[0] === r && W.q[1] === c);
      }
    }
    function select(r, c, click) {
      if (done) return;
      const g = P.G[r][c];
      if (click && cur && cur[0] === r && cur[1] === c && g.r && g.d) dk = dk === 'r' ? 'd' : 'r';
      else if (!g[dk]) dk = g.r ? 'r' : 'd';
      cur = [r, c]; paint();
    }
    function move(step) {
      const W = wordAt(cur[0], cur[1], dk); if (!W) return;
      const i = W.cells.findIndex(([r, c]) => r === cur[0] && c === cur[1]), j = i + step;
      if (j >= 0 && j < W.cells.length) cur = W.cells[j].slice();
    }
    function nextWord() {
      const W = wordAt(cur[0], cur[1], dk); const k = P.list.indexOf(W);
      for (let n = 1; n <= P.list.length; n++) { const X = P.list[(k + n) % P.list.length]; const e = X.cells.find(([r, c]) => !ans[r][c]); if (e) { dk = X.dk; cur = e.slice(); return; } }
    }
    function typeCh(ch) {
      if (!cur || done) return;
      if (!t.running) t.start();
      ans[cur[0]][cur[1]] = ch; checked = false; SFX('type');
      const W = wordAt(cur[0], cur[1], dk); const i = W.cells.findIndex(([r, c]) => r === cur[0] && c === cur[1]);
      let moved = false; for (let j = i + 1; j < W.cells.length; j++) { const [r, c] = W.cells[j]; if (!ans[r][c]) { cur = [r, c]; moved = true; break; } }
      if (!moved) { if (W.cells.every(([r, c]) => ans[r][c])) nextWord(); else move(1); }
      paint(); status(); checkWin();
    }
    function checkWin() {
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const g = P.G[r][c]; if (g && g.t === 'l' && ans[r][c] !== g.ch) return; }
      done = true; t.stop(); cur = null; paint();
      const s = H.get(); s.solved = (s.solved || 0) + 1; s.best = s.best || {}; const rec = !s.best[size] || t.secs < s.best[size]; if (rec) s.best[size] = Math.round(t.secs); H.set(s);
      confetti(root); overlay(root, '¡Autodefinido completo!', `${fmtTime(t.secs)}${rec ? ' · ¡récord!' : ''}`, [btn('Otro', newGame, 'primary')]); status();
    }
    function check() { checked = true; SFX('select'); paint(); }
    function revealLetter() { if (!cur || done) return; const g = P.G[cur[0]][cur[1]]; ans[cur[0]][cur[1]] = g.ch; els[cur[0] * C + cur[1]].classList.add('rev'); typeCh(g.ch); }
    function revealAll() { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const g = P.G[r][c]; if (g && g.t === 'l') { if (ans[r][c] !== g.ch) els[r * C + c].classList.add('rev'); ans[r][c] = g.ch; } } done = true; t.stop(); cur = null; paint(); status(); }
    const key = (e) => {
      if (done || e.ctrlKey || e.altKey || e.metaKey) return false;
      if (!cur) { if (/^[a-zñ]$/i.test(e.key) || e.key.startsWith('Arrow')) { const f = P.list[0]; dk = f.dk; cur = f.cells[0].slice(); paint(); } else return false; }
      const A = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      if (A[e.key]) { const [a, b] = A[e.key]; let r = cur[0] + a, c = cur[1] + b; while (r >= 0 && c >= 0 && r < R && c < C) { const g = P.G[r][c]; if (g && g.t === 'l') { if (!g[dk]) dk = a ? 'd' : 'r'; if (!g[dk]) dk = g.r ? 'r' : 'd'; cur = [r, c]; break; } r += a; c += b; } paint(); return true; }
      if (e.key === ' ') { const g = P.G[cur[0]][cur[1]]; if (g.r && g.d) dk = dk === 'r' ? 'd' : 'r'; paint(); return true; }
      if (e.key === 'Backspace') { if (!ans[cur[0]][cur[1]]) move(-1); ans[cur[0]][cur[1]] = ''; paint(); status(); return true; }
      if (e.key === 'Tab' || e.key === 'Enter') { nextWord(); paint(); return true; }
      if (e.key.length === 1) { const ch = e.key.toUpperCase().normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC'); if (/^[A-ZÑ]$/.test(ch)) { typeCh(ch); return true; } }
      return false;
    };
    function fit() {
      if (!R) return; const W = root.clientWidth || 900, Hh = root.clientHeight || 600, wide = W > 900;
      const s = Math.floor(Math.max(26, Math.min(64, (Hh - 20) / R - 2, ((wide ? W - 290 : W - 20)) / C - 2)));
      gridEl.style.setProperty('--s', s + 'px');
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; fit(); }).observe(root);
    const tools = [pick('Tamaño', Object.entries(SIZES).map(([k, v]) => [k, v.n]), size, (v) => { size = v; const s = H.get(); s.size = v; H.set(s); newGame(); }), btn('✔ Revisar', check), btn('Ver letra', revealLetter), btn('Resolver', revealAll), btn('Nuevo', newGame)];
    requestAnimationFrame(newGame);
    return { el: root, tools, key, help: 'Tocá un casillero blanco (o la definición) y escribí. Espacio cambia la dirección, Enter pasa a la próxima palabra, las flechas mueven. “Revisar” marca en rojo lo que está mal.', hide: () => t.stop(), show: () => { if (!done && P && ans.some(r => r.some(Boolean))) t.start(); } };
  }

  BM.register({ id: 'autodefinido', n: 'Autodefinido', d: 'Crucigrama con las definiciones adentro de la grilla. Uno nuevo cada vez, en tres tamaños.', c: '#2f6fd6', create: autodefinido,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#2b2f38"/><g><rect x="5" y="5" width="17" height="17" fill="#cfe0f2"/><rect x="23" y="5" width="17" height="17" fill="#fbf8f0"/><rect x="41" y="5" width="17" height="17" fill="#fbf8f0"/><rect x="5" y="23" width="17" height="17" fill="#fbf8f0"/><rect x="23" y="23" width="17" height="17" fill="#cfe0f2"/><rect x="41" y="23" width="17" height="17" fill="#fbf8f0"/><rect x="5" y="41" width="17" height="17" fill="#fbf8f0"/><rect x="23" y="41" width="17" height="17" fill="#fbf8f0"/><rect x="41" y="41" width="17" height="17" fill="#3b404b"/></g><g fill="#1d3350" font-family="system-ui" font-size="4.3" font-weight="700"><text x="7" y="12">Astro</text><text x="7" y="17">rey ▸</text><text x="25" y="30">Mar</text><text x="25" y="35">...▾</text></g><g font-family="system-ui" font-weight="800" font-size="12" fill="#1b2433" text-anchor="middle"><text x="31.5" y="18">S</text><text x="49.5" y="18">O</text><text x="49.5" y="36">L</text></g></svg>',
    best: (s) => s.solved ? `${s.solved} resueltos` : 'Nunca jugaste' });
})();
