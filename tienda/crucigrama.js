// Tienda de Base · Crucigrama (el clásico: grilla con números y definiciones al costado)
(() => {
  'use strict';
  const BM = window.BaseMini; if (!BM || !BM.register) return;
  const { h, pick, btn, overlay, confetti, timer, fmtTime } = BM.util;
  const SFX = (BM.util && BM.util.sfx) || (() => {});
  const closeOver = (root) => { const o = root.querySelector('.mg-over'); if (o) o.remove(); };
  const PISTAS = {"AS": ["Carta de valor uno"], "FE": ["Creencia"], "TE": ["Infusión"], "YO": ["Primera persona"], "MI": ["Nota musical"], "RE": ["Nota musical"], "LA": ["Nota musical"], "SOL": ["Astro rey"], "DO": ["Primera nota"], "OSO": ["Animal que hiberna"], "ASA": ["Agarradera de taza"], "ALA": ["Sirve para volar"], "AVE": ["Animal con plumas"], "ORO": ["Metal precioso"], "MAR": ["Agua salada"], "RIO": ["Corre hacia el mar"], "LUZ": ["Contrario de sombra"], "PAN": ["Sale del horno"], "SAL": ["Condimento blanco"], "OLA": ["Viene de la orilla"], "OJO": ["Órgano de la vista"], "UVA": ["Da el vino"], "ARO": ["Anillo, argolla"], "OCA": ["Ganso"], "ETA": ["Letra griega"], "RED": ["Para pescar"], "TOS": ["Síntoma de resfrío"], "PIE": ["Tiene cinco dedos"], "SED": ["Ganas de beber"], "MES": ["Dura unos 30 días"], "DIA": ["Tiene 24 horas"], "AÑO": ["Período de doce meses"], "REY": ["Lleva corona"], "LEY": ["Norma del Congreso"], "VOZ": ["Sale al hablar"], "NOE": ["Construyó el arca"], "EVA": ["Primera mujer"], "ADAN": ["Primer hombre"], "ISLA": ["Tierra rodeada de agua"], "LAGO": ["Agua dulce quieta"], "OSA": ["Hembra del oso"], "ROSA": ["Flor con espinas", "Color suave"], "CASA": ["Hogar"], "MESA": ["Mueble para comer"], "SILLA": ["Para sentarse"], "CAMA": ["Para dormir"], "LUNA": ["Satélite de la Tierra"], "NUBE": ["Trae lluvia"], "ARCO": ["Lanza flechas", "Lo defiende el arquero"], "FOCA": ["Mamífero marino"], "LOBO": ["Aúlla a la luna"], "PATO": ["Ave de laguna"], "GATO": ["Maúlla"], "PERRO": ["Ladra"], "VACA": ["Da leche"], "TORO": ["Macho de la vaca"], "LORO": ["Ave que habla"], "MONO": ["Primate"], "PUMA": ["Felino americano"], "RANA": ["Croa"], "SAPO": ["Pariente de la rana"], "ERA": ["Período histórico"], "ORA": ["Reza"], "ATE": ["Del verbo atar"], "ESE": ["Pronombre demostrativo", "Nombre de la S"], "OTRO": ["No este"], "NADA": ["Ninguna cosa"], "TODO": ["La totalidad"], "AMOR": ["Sentimiento del corazón"], "ODIO": ["Contrario del amor"], "RISA": ["Muestra de alegría"], "PAZ": ["Contrario de guerra"], "AGUA": ["H2O"], "AIRE": ["Lo respiramos"], "FUEGO": ["Quema"], "TIERRA": ["Nuestro planeta"], "NIEVE": ["Cae en invierno"], "HIELO": ["Agua congelada"], "VIENTO": ["Mueve las hojas"], "LLUVIA": ["Cae de las nubes"], "RAYO": ["Cae en la tormenta"], "TRUENO": ["Ruido de tormenta"], "ESTE": ["Punto cardinal"], "OESTE": ["Por donde se pone el sol"], "NORTE": ["Lo marca la brújula"], "SUR": ["Punto cardinal"], "ARENA": ["Hay en la playa"], "PLAYA": ["Lugar de veraneo"], "DUNA": ["Médano"], "OASIS": ["Agua en el desierto"], "SELVA": ["Bosque tropical"], "VALLE": ["Entre montañas"], "CERRO": ["Monte pequeño"], "ALAMO": ["Árbol alto"], "PINO": ["Árbol de Navidad"], "CEIBO": ["Flor nacional"], "ROBLE": ["Árbol de madera dura"], "HOJA": ["Tiene el árbol"], "RAMA": ["Sale del tronco"], "RAIZ": ["Va bajo tierra"], "SEMILLA": ["Origen de la planta"], "TALLO": ["Sostiene la flor"], "LIMA": ["Herramienta o fruta", "Capital de Perú"], "LIMON": ["Fruta ácida"], "PERA": ["Fruta con forma de lámpara"], "HIGO": ["Fruto de la higuera"], "KIWI": ["Fruta peluda"], "MANGO": ["Fruta tropical"], "COCO": ["Fruto de la palmera"], "MELON": ["Fruta de verano"], "SANDIA": ["Roja por dentro"], "PAPA": ["Tubérculo", "Padre"], "AJO": ["Espanta vampiros"], "ARROZ": ["Cereal oriental"], "TRIGO": ["Da la harina"], "MAIZ": ["Da el choclo"], "CAFE": ["Bebida negra"], "MATE": ["Infusión argentina"], "LECHE": ["Blanca y nutritiva"], "QUESO": ["Hecho con leche"], "DULCE": ["Contrario de salado"], "TORTA": ["De cumpleaños"], "FLAN": ["Postre con caramelo"], "ASADO": ["Comida del domingo"], "GUISO": ["Plato de olla"], "SOPA": ["Se toma con cuchara"], "TACO": ["Comida mexicana", "Parte del zapato"], "PIZZA": ["Muzzarella sobre masa"], "HELADO": ["Postre frío"], "MIEL": ["La hacen las abejas"], "ACEITE": ["De oliva o girasol"], "HUEVO": ["Lo pone la gallina"], "POLLO": ["Cría de gallina"], "CARNE": ["La vende el carnicero"], "PESCADO": ["Comida del mar"], "OLLA": ["Recipiente de cocina"], "TAZA": ["Para el café"], "VASO": ["Para beber"], "PLATO": ["Para servir"], "TENEDOR": ["Cubierto con dientes"], "CUCHARA": ["Cubierto para sopa"], "HORNO": ["Cocina el pan"], "MANO": ["Tiene cinco dedos"], "DEDO": ["Tiene uña"], "UÑA": ["Crece en el dedo"], "BRAZO": ["Va del hombro a la mano"], "CODO": ["Articulación del brazo"], "NARIZ": ["Órgano del olfato"], "BOCA": ["Por ella comemos"], "LABIO": ["Borde de la boca"], "DIENTE": ["Lo arregla el dentista"], "OREJA": ["Órgano del oído"], "PELO": ["Cabello"], "PIEL": ["Cubre el cuerpo"], "HUESO": ["Lo roe el perro"], "SANGRE": ["Corre por las venas"], "NUCA": ["Parte de atrás del cuello"], "RODILLA": ["Articulación de la pierna"], "CARA": ["Rostro"], "CEJA": ["Encima del ojo"], "TIO": ["Hermano del padre"], "TIA": ["Hermana de la madre"], "NIETO": ["Hijo del hijo"], "PRIMO": ["Hijo del tío"], "MAMA": ["Madre"], "NENE": ["Niño chico"], "BEBE": ["Recién nacido"], "NOVIA": ["Prometida"], "BODA": ["Casamiento"], "AMIGO": ["Compañero querido"], "VECINO": ["Vive al lado"], "REINA": ["Esposa del rey"], "PAPEL": ["Se escribe en él"], "LAPIZ": ["Escribe y se borra"], "LIBRO": ["Tiene páginas"], "CARTA": ["Se manda por correo"], "SOBRE": ["Envuelve la carta"], "NOTA": ["Calificación escolar", "Sonido musical", "Calificación"], "AULA": ["Salón de clases"], "TIZA": ["Escribe en el pizarrón"], "REGLA": ["Mide en centímetros"], "MAPA": ["Representa un territorio"], "RELOJ": ["Da la hora"], "HORA": ["Sesenta minutos"], "AYER": ["Antes de hoy"], "HOY": ["Este día"], "TARDE": ["Después del mediodía"], "NOCHE": ["Cuando sale la luna"], "ALBA": ["Primera luz del día"], "AURORA": ["Luz del amanecer"], "LUNES": ["Primer día hábil"], "MARTES": ["Día de mala suerte", "Día de mala suerte, según el dicho"], "ENERO": ["Primer mes"], "MAYO": ["Mes de la Revolución"], "JULIO": ["Mes de la Independencia"], "ABRIL": ["Cuarto mes"], "OTOÑO": ["Caen las hojas"], "VERANO": ["Estación de calor", "Estación del calor"], "INVIERNO": ["Estación fría", "Estación del frío"], "AUTO": ["Vehículo de cuatro ruedas"], "TREN": ["Va por las vías"], "AVION": ["Vuela con pasajeros"], "BARCO": ["Navega"], "MOTO": ["Vehículo de dos ruedas"], "TAXI": ["Auto de alquiler", "Auto con taxímetro"], "BICI": ["Se pedalea"], "CAMION": ["Lleva cargas"], "RUEDA": ["Es redonda y gira", "Tiene el auto"], "RUTA": ["Camino entre ciudades", "Camino"], "CALLE": ["Va entre veredas", "Por ella pasan los autos"], "PLAZA": ["Espacio verde urbano", "Espacio verde del barrio"], "PUENTE": ["Cruza el río"], "TORRE": ["Construcción alta"], "MURO": ["Pared gruesa", "Pared alta"], "TECHO": ["Cubre la casa"], "PUERTA": ["Se abre y se cierra", "Se abre para entrar"], "LLAVE": ["Abre la cerradura", "Abre la puerta"], "VENTANA": ["Deja pasar la luz", "Por ella entra la luz"], "PISO": ["Se camina sobre él", "Suelo"], "PATIO": ["Espacio al aire libre"], "JARDIN": ["Tiene flores"], "CANCHA": ["Se juega al fútbol"], "GOL": ["Grito del fútbol"], "PELOTA": ["Es redonda y rebota"], "TENIS": ["Deporte de raqueta"], "BOXEO": ["Deporte de guantes"], "JUDO": ["Arte marcial japonés"], "POLO": ["Deporte a caballo", "Deporte con caballos"], "RUGBY": ["Deporte con pelota ovalada"], "NADO": ["Del verbo nadar"], "TANGO": ["Baile porteño"], "DANZA": ["Baile"], "CANTO": ["Lo hace el cantante", "Acción de cantar"], "PIANO": ["Instrumento de teclas", "Tiene teclas blancas y negras"], "ARPA": ["Instrumento de cuerdas"], "BOMBO": ["Instrumento de percusión", "Tambor grande"], "GUITARRA": ["Tiene seis cuerdas", "Instrumento de seis cuerdas"], "OPERA": ["Teatro cantado"], "COPLA": ["Estrofa popular"], "POEMA": ["Escrito en verso"], "VERSO": ["Línea de un poema"], "RIMA": ["Coincidencia de sonidos"], "CINE": ["Se ven películas", "Para ver películas"], "FILM": ["Película"], "ACTOR": ["Trabaja en el teatro"], "DRAMA": ["Obra seria"], "RADIO": ["Se escucha en el auto", "Aparato que transmite"], "DIARIO": ["Sale todos los días"], "FOTO": ["Imagen capturada", "Imagen tomada con cámara"], "ARTE": ["Expresión creativa", "Pintura o escultura"], "OLEO": ["Pintura al aceite"], "MUSEO": ["Exhibe obras"], "ROJO": ["Color de la sangre"], "AZUL": ["Color del cielo"], "VERDE": ["Color del pasto"], "GRIS": ["Entre blanco y negro"], "NEGRO": ["Ausencia de color"], "BLANCO": ["Color de la nieve"], "CELESTE": ["Color de la bandera"], "OCRE": ["Color tierra"], "UNO": ["Primer número"], "DOS": ["Par"], "TRES": ["Número de un trío", "Uno más dos"], "CINCO": ["Dedos de la mano"], "SEIS": ["Caras de un dado"], "SIETE": ["Días de la semana"], "OCHO": ["Patas de la araña", "Dos por cuatro"], "NUEVE": ["Uno menos que diez"], "DIEZ": ["Decena"], "CIEN": ["Diez decenas"], "MIL": ["Diez centenas"], "PAR": ["Dos iguales"], "CERO": ["Nada en números", "Nada, en números"], "SUMA": ["Operación de adición"], "RESTA": ["Operación inversa a sumar"], "ESPADA": ["Arma de caballero"], "ESCUDO": ["Defiende del golpe"], "CASCO": ["Protege la cabeza"], "TRONO": ["Asiento del rey"], "CETRO": ["Bastón real"], "CORONA": ["La usa el rey"], "DUQUE": ["Título noble"], "CONDE": ["Título nobiliario"], "HADA": ["Tiene varita mágica", "Ser mágico con varita"], "OGRO": ["Gigante de cuento"], "ENANO": ["Hay siete con Blancanieves"], "MAGO": ["Hace trucos"], "BRUJA": ["Vuela en escoba"], "GENIO": ["Sale de la lámpara"], "ANGEL": ["Tiene alas y aureola"], "SANTO": ["Persona canonizada"], "MISA": ["Ceremonia religiosa"], "TEMPLO": ["Lugar de culto"], "FARO": ["Guía a los barcos"], "PUERTO": ["Llegan los barcos"], "ANCLA": ["Fija el barco"], "VELA": ["Impulsa el velero", "Se sopla en la torta"], "REMO": ["Mueve el bote", "Para mover el bote"], "BOTE": ["Barca pequeña"], "NAVE": ["Embarcación", "Barco o aeronave"], "COHETE": ["Va al espacio"], "ASTRO": ["Cuerpo celeste"], "COMETA": ["Tiene cola luminosa"], "ORBITA": ["Camino de un planeta"], "MARTE": ["Planeta rojo"], "VENUS": ["Lucero del alba"], "CIELO": ["Es celeste", "Está arriba"], "ESTRELLA": ["Brilla de noche"], "ZORRO": ["Animal astuto"], "CIERVO": ["Tiene astas"], "LIEBRE": ["Pariente del conejo"], "CONEJO": ["Sale de la galera"], "RATON": ["Le teme al gato"], "ARDILLA": ["Junta nueces"], "CEBRA": ["Tiene rayas"], "TIGRE": ["Felino rayado", "Ciudad del delta"], "LEON": ["Rey de la selva"], "OVEJA": ["Da lana"], "CABRA": ["Trepa montañas"], "CERDO": ["Chancho"], "BURRO": ["Animal de carga"], "MULA": ["Hija de burro y yegua"], "YEGUA": ["Hembra del caballo"], "POTRO": ["Caballo joven"], "CABALLO": ["Relincha"], "GALLO": ["Canta al amanecer"], "GALLINA": ["Pone huevos"], "PALOMA": ["Ave de la paz"], "AGUILA": ["Ave rapaz"], "CONDOR": ["Ave de los Andes"], "HORNERO": ["Ave nacional"], "GAVIOTA": ["Ave costera"], "PINGUINO": ["Ave que no vuela"], "BALLENA": ["Mamífero gigante"], "DELFIN": ["Mamífero inteligente"], "PULPO": ["Tiene ocho brazos"], "TIBURON": ["Pez temido"], "ATUN": ["Pez en lata"], "MERLUZA": ["Pez para filete"], "ABEJA": ["Hace miel"], "HORMIGA": ["Insecto trabajador"], "ARAÑA": ["Teje su tela"], "MOSCA": ["Insecto molesto"], "GRILLO": ["Canta de noche"], "MARIPOSA": ["Fue oruga"], "CANGURO": ["Salta con la cría"], "CAMELLO": ["Tiene jorobas"], "JIRAFA": ["Cuello largo"], "ELEFANTE": ["Tiene trompa"], "TORTUGA": ["Lleva su caparazón"], "LAGARTO": ["Reptil"], "NIDO": ["Casa del pájaro", "Casa de pájaros"], "CUEVA": ["Refugio en la roca"], "CAMPO": ["Afuera de la ciudad", "Terreno abierto"], "GRANJA": ["Tiene animales"], "ESTANCIA": ["Campo grande"], "TRACTOR": ["Ara el campo"], "ARADO": ["Abre surcos"], "COSECHA": ["Recolección"], "SILO": ["Guarda granos"], "ACERO": ["Hierro con carbono"], "HIERRO": ["Metal fuerte"], "PLATA": ["Metal blanco"], "COBRE": ["Metal rojizo"], "PLOMO": ["Metal pesado"], "CARBON": ["Combustible negro"], "PIEDRA": ["Roca"], "MARMOL": ["Piedra de estatuas"], "VIDRIO": ["Transparente y frágil"], "MADERA": ["Viene del árbol"], "TELA": ["Se cose", "Para hacer ropa"], "LANA": ["Viene de la oveja", "La da la oveja"], "SEDA": ["Tela del gusano", "Tela fina"], "HILO": ["Se pasa por la aguja", "Para coser"], "AGUJA": ["Para coser"], "BOTON": ["Abrocha la camisa"], "CAMISA": ["Prenda con cuello"], "SACO": ["Abrigo de traje", "Prenda con mangas"], "GORRO": ["Para la cabeza"], "BUFANDA": ["Abriga el cuello"], "MEDIA": ["Va en el pie"], "ZAPATO": ["Calzado"], "BOTA": ["Calzado alto"], "FALDA": ["Pollera"], "POLLERA": ["Prenda femenina"], "ANILLO": ["Va en el dedo"], "COLLAR": ["Va en el cuello"], "PERLA": ["Sale de la ostra"], "RUBI": ["Piedra roja"], "DIAMANTE": ["Piedra más dura"], "SOFA": ["Sillón grande"], "ALFOMBRA": ["Cubre el piso"], "ESPEJO": ["Refleja"], "LAMPARA": ["Ilumina"], "CORTINA": ["Tapa la ventana"], "ESTUFA": ["Da calor"], "DUCHA": ["Para bañarse"], "JABON": ["Hace espuma"], "TOALLA": ["Para secarse"], "PEINE": ["Para el pelo"], "CEPILLO": ["Para los dientes"], "ESCOBA": ["Para barrer"], "BALDE": ["Lleva agua"], "REGALO": ["Se da en cumpleaños"], "FIESTA": ["Celebración"], "GLOBO": ["Se infla"], "JUEGO": ["Diversión"], "DADO": ["Tiene seis caras"], "NAIPE": ["Carta de juego"], "TRUCO": ["Juego de cartas criollo"], "AJEDREZ": ["Tiene rey y reina"], "DAMA": ["Pieza de ajedrez"], "ALFIL": ["Mueve en diagonal"], "PEON": ["Pieza menor del ajedrez"], "LOTERIA": ["Juego de azar"], "SUERTE": ["Fortuna"], "SALUD": ["Bienestar"], "MEDICO": ["Cura enfermos"], "REMEDIO": ["Medicamento"], "FIEBRE": ["Temperatura alta"], "SUEÑO": ["Ganas de dormir"], "HAMBRE": ["Ganas de comer"], "MIEDO": ["Temor"], "ENOJO": ["Bronca"], "ALEGRIA": ["Felicidad"], "TRISTE": ["Apenado"], "FELIZ": ["Contento"], "LENTO": ["Sin prisa"], "RAPIDO": ["Veloz"], "ALTO": ["De gran estatura"], "BAJO": ["De poca altura"], "GORDO": ["Contrario de flaco"], "FLACO": ["Delgado"], "VIEJO": ["Anciano"], "NUEVO": ["Recién hecho"], "FRIO": ["Contrario de calor"], "CALOR": ["Temperatura alta"], "SECO": ["Sin agua"], "LIMPIO": ["Sin suciedad"], "LLENO": ["Sin lugar libre"], "VACIO": ["Sin nada adentro"], "LEJOS": ["Contrario de cerca"], "CERCA": ["A poca distancia"], "ARRIBA": ["Contrario de abajo"], "NUNCA": ["En ningún momento"], "SIEMPRE": ["En todo momento"], "ROMA": ["Capital de Italia"], "PARIS": ["Ciudad Luz"], "QUITO": ["Capital de Ecuador"], "CUBA": ["Isla del Caribe"], "CHILE": ["País trasandino"], "PERU": ["País de los incas"], "OSLO": ["Capital de Noruega"], "NILO": ["Río de Egipto"], "ANDES": ["Cordillera sudamericana"], "ETNA": ["Volcán de Sicilia"], "URAL": ["Montes de Rusia"], "SALTA": ["La Linda"], "JUJUY": ["Tiene la Quebrada de Humahuaca"], "TANDIL": ["Ciudad serrana bonaerense"], "PARANA": ["Río y ciudad"], "CHACO": ["Provincia del norte"], "EUROPA": ["Continente viejo"], "ASIA": ["Continente más grande"], "AFRICA": ["Continente del Sahara"], "NO": ["Negación"], "SI": ["Afirmación", "Nota musical"], "YA": ["Ahora mismo"], "TU": ["Pronombre de segunda persona"], "EL": ["Artículo masculino"], "LO": ["Artículo neutro"], "SE": ["Del verbo saber"], "OK": ["Está bien, en inglés"], "UN": ["Artículo indefinido"], "EN": ["Preposición de lugar"], "OS": ["Pronombre: a vosotros"], "VA": ["Del verbo ir"], "VE": ["Del verbo ver"], "HA": ["Del verbo haber"], "DA": ["Del verbo dar"], "ID": ["Andad, vosotros"], "OH": ["Exclamación de asombro"], "AH": ["Exclamación de sorpresa"], "EH": ["Para llamar la atención"], "LE": ["Pronombre de tercera persona"], "AL": ["A + el"], "ME": ["Pronombre de primera persona"], "TI": ["Pronombre: para..."], "NI": ["Conjunción negativa"], "PI": ["Número 3,14"], "RA": ["Dios egipcio del sol"], "AR": ["Símbolo del argón"], "OR": ["Oro, en francés"], "NA": ["Símbolo del sodio"], "CA": ["Símbolo del calcio"], "ASO": ["Del verbo asar"], "ANO": ["Final del tubo digestivo"], "ATO": ["Del verbo atar"], "ESA": ["Pronombre demostrativo femenino"], "ESO": ["Pronombre demostrativo neutro"], "ELLA": ["Pronombre femenino"], "ELLO": ["Pronombre neutro"], "ESTO": ["Lo que tengo acá"], "ARA": ["Altar"], "ERE": ["Nombre de la R suave"], "EME": ["Nombre de la M"], "ENE": ["Nombre de la N"], "ELE": ["Nombre de la L"], "EFE": ["Nombre de la F"], "ONCE": ["Diez más uno"], "DOCE": ["Una docena"], "SALA": ["Habitación grande"], "RATA": ["Roedor grande"], "TEMA": ["Asunto"], "TAPA": ["Cierra la olla"], "TOPE": ["Límite"], "RAMO": ["Conjunto de flores"], "ROCA": ["Piedra grande"], "SETA": ["Hongo"], "SODA": ["Agua con gas"], "SOLO": ["Sin compañía"], "TINA": ["Bañera"], "TIRO": ["Disparo"], "ARCA": ["La de Noé"], "AREA": ["Superficie"], "ARMA": ["Sirve para atacar"], "ASTA": ["Palo de la bandera"], "ATAR": ["Hacer un nudo"], "CANA": ["Pelo blanco"], "CAPA": ["La usa el superhéroe"], "CARO": ["Que cuesta mucho"], "COLA": ["La mueve el perro"], "COPA": ["Trofeo"], "CUNA": ["Cama del bebé"], "DATO": ["Información"], "DOMA": ["Jineteada de caballos"], "DUDA": ["Falta de certeza"], "ECO": ["Repite lo que decís"], "EDAD": ["Años cumplidos"], "ENTE": ["Ser"], "ERRAR": ["Equivocarse"], "FAMA": ["Ser muy conocido"], "FILA": ["Hilera"], "FINO": ["Delgado"], "GALA": ["Fiesta elegante"], "GOMA": ["Borra el lápiz"], "GOTA": ["De agua"], "IDEA": ["Pensamiento"], "IMAN": ["Atrae el hierro"], "IRA": ["Enojo fuerte"], "LATA": ["Envase de metal"], "LEMA": ["Frase que identifica"], "LIGA": ["Torneo"], "LINO": ["Tela de verano"], "LOMA": ["Cerro bajo"], "LOTE": ["Terreno"], "MALO": ["Contrario de bueno"], "MASA": ["Para hacer pan"], "META": ["Final de la carrera"], "MINA": ["De oro o de carbón"], "MODA": ["Lo que se usa"], "NENA": ["Niña"], "OBRA": ["Trabajo terminado"], "OLMO": ["Árbol de hojas dentadas"], "ORAL": ["De la boca"], "OREO": ["Ventilación"], "PALA": ["Para cavar"], "PATA": ["Pierna de animal"], "PENA": ["Tristeza"], "PESO": ["Moneda argentina"], "PIPA": ["Para fumar"], "POCO": ["Escaso"], "POZO": ["Agujero con agua"], "SAGA": ["Serie de historias"], "TELON": ["Cortina del teatro"], "TIPO": ["Clase, modelo"], "TOMO": ["Volumen de un libro"], "TONO": ["Altura de un sonido"], "TOSCO": ["Sin pulir"], "TRAMA": ["Argumento"], "UNIDO": ["Junto"], "USO": ["Empleo de algo"], "VAGO": ["Que no trabaja"], "VALE": ["Comprobante"], "VELO": ["Tela que cubre"], "VENA": ["Lleva la sangre"], "VERO": ["Verónica, en corto"], "VIDA": ["Contrario de muerte"], "VINO": ["Bebida de uva"], "VOTO": ["Se pone en la urna"], "ZONA": ["Región"], "ACTO": ["Hecho"], "AGRIO": ["Ácido"], "AMIGA": ["Compañera querida"], "ANCHO": ["Contrario de angosto"], "ARBOL": ["Tiene tronco y ramas"], "ASTILLA": ["Pedacito de madera"], "BOLSA": ["Para llevar cosas"], "BRISA": ["Viento suave"], "CARRO": ["Vehículo tirado por caballos"], "CLAVO": ["Se martilla"], "COSTA": ["Orilla del mar"], "CUENTO": ["Relato breve"], "DEDAL": ["Protege el dedo al coser"], "DISCO": ["Plato de música"], "ESQUINA": ["Donde se cruzan dos calles"], "FERIA": ["Mercado al aire libre"], "FLECHA": ["La lanza el arco"], "FRUTA": ["Sale del árbol"], "GOLPE": ["Choque"], "GRANO": ["Semilla de cereal"], "HUMO": ["Sale del fuego"], "JARRA": ["Para servir agua"], "JUGO": ["De naranja"], "LADO": ["Costado"], "LECHON": ["Cerdito asado"], "LETRA": ["Signo del abecedario"], "MANTA": ["Abrigo para la cama"], "MARCO": ["Rodea el cuadro"], "MOTOR": ["Mueve el auto"], "NOVELA": ["Libro largo de ficción"], "ORILLA": ["Borde del río"], "PALCO": ["Asiento especial del teatro"], "PASTO": ["Lo come la vaca"], "SABOR": ["Lo siente la lengua"], "SELLO": ["Estampilla"], "SIESTA": ["Dormir después de comer"], "SILBO": ["Sonido con la boca"], "SOMBRA": ["Contrario de luz"], "TIEMPO": ["Lo marca el reloj"], "TRENZA": ["Peinado tejido"], "TUERCA": ["Va con el tornillo"], "VELERO": ["Barco a vela"], "ZAPALLO": ["Calabaza"], "ATLETA": ["Deportista"], "BALCON": ["Saliente de la casa"], "BARRIO": ["Parte de la ciudad"], "CAMINO": ["Vía para andar"], "CANCION": ["Se canta"], "CENA": ["Comida de la noche"], "CHISTE": ["Hace reír"], "COCINA": ["Donde se prepara la comida"], "DOMINGO": ["Último día de la semana"], "ESCUELA": ["Donde se aprende"], "FUTBOL": ["Deporte del gol"], "PRIMAVERA": ["Estación de las flores"], "SABADO": ["Día antes del domingo"], "VIERNES": ["Último día hábil"], "ZAMBA": ["Danza con pañuelo"], "MARZO": ["Tercer mes"], "JUNIO": ["Sexto mes"], "AGOSTO": ["Octavo mes"], "NIÑO": ["Chico"], "ABUELA": ["Madre de la madre"], "HERMANO": ["Hijo de los mismos padres"], "SOBRINO": ["Hijo del hermano"], "SUEGRA": ["Madre del esposo"], "PADRE": ["Papá"], "CHOFER": ["Maneja el colectivo"], "PINTOR": ["Hace cuadros"], "POETA": ["Escribe versos"], "SASTRE": ["Hace trajes"], "FLAUTA": ["Instrumento de viento"], "VIOLIN": ["Se toca con arco"], "ALFAJOR": ["Golosina con dulce de leche"], "CHURRO": ["Masa frita con azúcar"], "EMPANADA": ["Masa rellena"], "MILANESA": ["Carne empanada"], "PIZARRA": ["Pizarrón"], "TOMATE": ["Rojo de la ensalada"], "LECHUGA": ["Hoja de la ensalada"], "PAPAYA": ["Fruta tropical anaranjada"], "PALTA": ["Aguacate"], "CEBOLLA": ["Hace llorar al cortarla"], "ROMERO": ["Hierba aromática"], "OREGANO": ["Va en la pizza"], "LAUREL": ["Hoja de los guisos"], "CANELA": ["Especia dulce"], "PIMIENTA": ["Pica"], "SUBTE": ["Tren bajo tierra"], "COCHE": ["Auto"], "TELEFONO": ["Para llamar"], "CAMARA": ["Saca fotos"], "PANTALLA": ["Ahí se ve la imagen"], "TECLADO": ["Tiene letras para escribir"], "MOUSE": ["Ratón de la compu"]};
  const CSS = `
.cr-wrap{position:absolute;inset:0;display:flex;align-items:stretch;justify-content:center;width:100%;height:100%;padding:12px;box-sizing:border-box;user-select:none;gap:16px}
.cr-main{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-width:0}
.cr-clue{min-height:40px;max-width:100%;display:flex;align-items:center;gap:10px;padding:8px 16px;border-radius:12px;background:#fff8dc;color:#1d2433;font-weight:700;font-size:16px;box-shadow:0 6px 18px -10px rgba(0,0,0,.6)}
.cr-clue b{display:grid;place-items:center;min-width:30px;height:26px;padding:0 6px;border-radius:8px;background:#1d2433;color:#fff;font-size:13px}
.cr-clue small{font-weight:600;color:#6a6458;font-size:12.5px}
.cr-grid{display:grid;gap:0;background:#111;padding:3px;border-radius:6px;box-shadow:0 18px 40px -18px rgba(0,0,0,.8)}
.cr-c{width:var(--s);height:var(--s);position:relative;box-sizing:border-box;border:1px solid #444}
.cr-c.x{background:#14161b;border-color:#14161b}
.cr-c.l{background:#fffdf6;display:grid;place-items:center;font-weight:800;font-size:calc(var(--s)*.55);color:#1b2433;cursor:pointer;font-family:ui-rounded,system-ui,sans-serif}
.cr-c.l i{position:absolute;top:1px;left:2px;font-style:normal;font-size:calc(var(--s)*.26);font-weight:700;color:#444;line-height:1}
.cr-c.l.hl{background:#dfeaff}.cr-c.l.cur{background:#ffe27a}
.cr-c.l.bad{color:#d62d20}.cr-c.l.rev{color:#2f6fd6}.cr-c.l.okw{background:#e3f5e6}.cr-c.l.okw.hl{background:#cdebd2}.cr-c.l.okw.cur{background:#ffe27a}
.cr-side{width:clamp(220px,26vw,340px);display:grid;grid-template-rows:auto minmax(0,1fr) auto minmax(0,1fr);gap:6px;min-height:0;color:#e9edf3}
.cr-side h4{margin:4px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
.cr-list{overflow:auto;display:grid;gap:2px;align-content:start;background:rgba(255,255,255,.05);border-radius:12px;padding:6px}
.cr-it{display:grid;grid-template-columns:28px 1fr;gap:6px;padding:5px 8px;border-radius:8px;font-size:13.5px;line-height:1.3;cursor:pointer}
.cr-it b{text-align:right;color:#9fb3cf}
.cr-it:hover{background:rgba(255,255,255,.07)}
.cr-it.on{background:#2f6fd6;color:#fff}.cr-it.on b{color:#fff}
.cr-it.ok{opacity:.45;text-decoration:line-through}
@media (max-width:900px){.cr-wrap{flex-direction:column;align-items:center}.cr-side{width:100%;grid-template-rows:auto 120px auto 120px}}
`;
  const SIZES = { chico: { n: 'Chico (11×11)', r: 11, c: 11 }, mediano: { n: 'Mediano (13×13)', r: 13, c: 13 }, grande: { n: 'Grande (15×15)', r: 15, c: 15 } };
  // ---------- generador: palabras que se cruzan, separadas por casilleros negros ----------
  function generate(R, C) {
    const words = Object.keys(PISTAS).filter(w => w.length >= 3 && w.length <= Math.min(R, C));
    const byLetter = new Map();
    for (const w of words) for (let k = 0; k < w.length; k++) { if (!byLetter.has(w[k])) byLetter.set(w[k], []); byLetter.get(w[k]).push([w, k]); }
    let best = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      const G = Array.from({ length: R }, () => new Array(C).fill(null)); // null | {ch, r?, d?}
      const used = new Set(), list = [];
      const inB = (r, c) => r >= 0 && c >= 0 && r < R && c < C;
      const L = (r, c) => inB(r, c) && G[r][c];
      function canPlace(w, r0, c0, dr, dc) {
        const dk = dr ? 'd' : 'r';
        if (L(r0 - dr, c0 - dc) || L(r0 + dr * w.length, c0 + dc * w.length)) return -1;
        let cross = 0;
        for (let i = 0; i < w.length; i++) {
          const r = r0 + dr * i, c = c0 + dc * i; if (!inB(r, c)) return -1;
          const g = G[r][c];
          if (g) { if (g.ch !== w[i] || g[dk]) return -1; cross++; continue; }
          if (L(r + dc, c + dr) || L(r - dc, c - dr)) return -1; // nada pegado de costado
        }
        return cross === w.length ? -1 : cross;
      }
      function place(w, r0, c0, dr, dc) {
        const dk = dr ? 'd' : 'r', cl = PISTAS[w];
        const it = { w, dk, cells: [], txt: cl[Math.floor(Math.random() * cl.length)] };
        for (let i = 0; i < w.length; i++) { const r = r0 + dr * i, c = c0 + dc * i; if (!G[r][c]) G[r][c] = { ch: w[i] }; G[r][c][dk] = list.length + 1; it.cells.push([r, c]); }
        used.add(w); list.push(it);
      }
      const first = words.filter(w => w.length >= C - 4 && w.length <= C);
      const fw = first[Math.floor(Math.random() * first.length)] || words[0];
      place(fw, Math.floor(R / 2), Math.floor((C - fw.length) / 2), 0, 1);
      for (let step = 0; step < 300; step++) {
        const cands = [];
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const g = G[r][c]; if (!g) continue;
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const dk = dr ? 'd' : 'r'; if (g[dk]) continue;
            const opts = byLetter.get(g.ch) || [];
            for (let n = 0; n < 60; n++) {
              const [w, k] = opts[Math.floor(Math.random() * opts.length)]; if (used.has(w)) continue;
              const r0 = r - dr * k, c0 = c - dc * k, cr = canPlace(w, r0, c0, dr, dc);
              if (cr > 0) cands.push({ w, r0, c0, dr, dc, sc: cr * 5 + w.length + Math.random() * 3 });
            }
          }
        }
        if (!cands.length) break;
        cands.sort((a, b) => b.sc - a.sc);
        const pk = cands[Math.floor(Math.random() * Math.min(4, cands.length))];
        place(pk.w, pk.r0, pk.c0, pk.dr, pk.dc);
      }
      let letters = 0; for (const row of G) for (const g of row) if (g) letters++;
      const sc = letters + list.length * 3;
      if (!best || sc > best.sc) best = { G, list, sc };
    }
    // números: de arriba a abajo y de izquierda a derecha, en el casillero donde empieza cada palabra
    const { G, list } = best; let num = 0; const nums = {};
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
      const starts = list.filter(it => it.cells[0][0] === r && it.cells[0][1] === c);
      if (starts.length) { num++; nums[r * C + c] = num; starts.forEach(it => { it.n = num; }); }
    }
    return { G, list, nums };
  }
  function crucigrama(H) {
    { const st0 = document.getElementById('st-cruci') || document.head.appendChild(h('style', { id: 'st-cruci' })); if (st0.textContent !== CSS) st0.textContent = CSS; }
    let size = SIZES[H.get().size] ? H.get().size : 'mediano', auto = !!H.get().auto;
    const root = h('div', { class: 'cr-wrap' }), gridEl = h('div', { class: 'cr-grid' }), clueEl = h('div', { class: 'cr-clue' }), side = h('div', { class: 'cr-side' });
    root.append(h('div', { class: 'cr-main' }, clueEl, gridEl), side);
    let P, R, C, ans, els, cur = null, dk = 'r', done, checked, lastSz = '', items = new Map();
    const t = timer(() => status());
    const solvedW = (it) => it.cells.every(([r, c]) => ans[r][c] === P.G[r][c].ch);
    const status = () => { if (!P) return; H.status([`${P.list.filter(solvedW).length}/${P.list.length} palabras`, fmtTime(t.secs), H.get().solved ? `Resueltos ${H.get().solved}` : '']); };
    function newGame() {
      closeOver(root); const S = SIZES[size]; R = S.r; C = S.c;
      P = generate(R, C); ans = Array.from({ length: R }, () => new Array(C).fill('')); cur = null; done = false; checked = false; t.reset();
      render(); fit(); status();
    }
    const wordAt = (r, c, d) => { const g = P.G[r][c]; return g && g[d] ? P.list[g[d] - 1] : null; };
    function render() {
      gridEl.style.gridTemplateColumns = `repeat(${C}, var(--s))`; gridEl.replaceChildren(); els = [];
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const g = P.G[r][c]; let d;
        if (!g) d = h('div', { class: 'cr-c x' });
        else { d = h('div', { class: 'cr-c l' }, P.nums[r * C + c] ? h('i', { text: String(P.nums[r * C + c]) }) : null, h('span')); d.onclick = () => select(r, c, true); }
        gridEl.append(d); els.push(d);
      }
      items.clear();
      const list = (k) => h('div', { class: 'cr-list' }, P.list.filter(it => it.dk === k).sort((a, b) => a.n - b.n).map(it => { const e = h('div', { class: 'cr-it' }, h('b', { text: String(it.n) }), h('span', { text: `${it.txt} (${it.w.length})` })); e.onclick = () => { dk = it.dk; const fc = it.cells.find(([rr, cc]) => !ans[rr][cc]) || it.cells[0]; cur = fc.slice(); paint(); }; items.set(it, e); return e; }));
      side.replaceChildren(h('h4', { text: 'Horizontales' }), list('r'), h('h4', { text: 'Verticales' }), list('d'));
      paint();
    }
    function paint() {
      const W = cur ? wordAt(cur[0], cur[1], dk) : null, inW = new Set(W ? W.cells.map(([r, c]) => r * C + c) : []);
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const g = P.G[r][c], d = els[r * C + c]; if (!g) continue;
        d.lastChild.textContent = ans[r][c];
        d.classList.toggle('hl', inW.has(r * C + c)); d.classList.toggle('cur', !!cur && cur[0] === r && cur[1] === c);
        d.classList.toggle('bad', (checked || auto) && !!ans[r][c] && ans[r][c] !== g.ch);
        d.classList.toggle('okw', [g.r, g.d].some(k => k && solvedW(P.list[k - 1])));
      }
      for (const [it, e] of items) { e.classList.toggle('on', it === W); e.classList.toggle('ok', solvedW(it)); }
      const on = W && items.get(W); if (on) on.scrollIntoView({ block: 'nearest' });
      if (W) clueEl.replaceChildren(h('b', { text: `${W.n} ${W.dk === 'r' ? '▸' : '▾'}` }), h('span', { text: W.txt }), h('small', { text: `${W.w.length} letras` }));
      else clueEl.replaceChildren(h('small', { text: done ? '¡Crucigrama completo!' : 'Tocá un casillero o una definición para empezar' }));
    }
    function select(r, c, click) {
      if (done) return; const g = P.G[r][c];
      if (click && cur && cur[0] === r && cur[1] === c && g.r && g.d) dk = dk === 'r' ? 'd' : 'r';
      else if (!g[dk]) dk = g.r ? 'r' : 'd';
      cur = [r, c]; paint();
    }
    function move(step) { const W = wordAt(cur[0], cur[1], dk); if (!W) return; const i = W.cells.findIndex(([r, c]) => r === cur[0] && c === cur[1]), j = i + step; if (j >= 0 && j < W.cells.length) cur = W.cells[j].slice(); }
    function nextWord() {
      const order = [...P.list].sort((a, b) => (a.dk === b.dk ? a.n - b.n : a.dk === 'r' ? -1 : 1));
      const W = wordAt(cur[0], cur[1], dk); const k = order.indexOf(W);
      for (let n = 1; n <= order.length; n++) { const X = order[(k + n) % order.length]; const e = X.cells.find(([r, c]) => !ans[r][c]); if (e) { dk = X.dk; cur = e.slice(); return; } }
    }
    function typeCh(ch) {
      if (!cur || done) return; if (!t.running) t.start();
      ans[cur[0]][cur[1]] = ch; checked = false; SFX('type');
      const W = wordAt(cur[0], cur[1], dk); const i = W.cells.findIndex(([r, c]) => r === cur[0] && c === cur[1]);
      let moved = false; for (let j = i + 1; j < W.cells.length; j++) { const [r, c] = W.cells[j]; if (!ans[r][c]) { cur = [r, c]; moved = true; break; } }
      if (!moved) { if (W.cells.every(([r, c]) => ans[r][c])) nextWord(); else move(1); }
      paint(); status(); checkWin();
    }
    function checkWin() {
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const g = P.G[r][c]; if (g && ans[r][c] !== g.ch) return; }
      done = true; t.stop(); cur = null; paint();
      const s = H.get(); s.solved = (s.solved || 0) + 1; s.best = s.best || {}; const rec = !s.best[size] || t.secs < s.best[size]; if (rec) s.best[size] = Math.round(t.secs); H.set(s);
      confetti(root); overlay(root, '¡Crucigrama completo!', `${fmtTime(t.secs)}${rec ? ' · ¡récord!' : ''}`, [btn('Otro', newGame, 'primary')]); status();
    }
    const check = () => { checked = true; SFX('select'); paint(); };
    function revealLetter() { if (!cur || done) return; const g = P.G[cur[0]][cur[1]]; els[cur[0] * C + cur[1]].classList.add('rev'); typeCh(g.ch); }
    function revealWord() { if (!cur || done) return; const W = wordAt(cur[0], cur[1], dk); if (!W) return; for (const [r, c] of W.cells) { if (ans[r][c] !== P.G[r][c].ch) els[r * C + c].classList.add('rev'); ans[r][c] = P.G[r][c].ch; } SFX('select'); paint(); status(); checkWin(); }
    function revealAll() { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) { const g = P.G[r][c]; if (g) { if (ans[r][c] !== g.ch) els[r * C + c].classList.add('rev'); ans[r][c] = g.ch; } } done = true; t.stop(); cur = null; paint(); status(); }
    const key = (e) => {
      if (done || e.ctrlKey || e.altKey || e.metaKey) return false;
      if (!cur) { if (/^[a-zñ]$/i.test(e.key) || e.key.startsWith('Arrow')) { const f = [...P.list].sort((a, b) => a.n - b.n)[0]; dk = f.dk; cur = f.cells[0].slice(); paint(); } else return false; }
      const A = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      if (A[e.key]) { const [a, b] = A[e.key]; let r = cur[0] + a, c = cur[1] + b; while (r >= 0 && c >= 0 && r < R && c < C) { const g = P.G[r][c]; if (g) { if (!g[dk]) dk = a ? 'd' : 'r'; if (!g[dk]) dk = g.r ? 'r' : 'd'; cur = [r, c]; break; } r += a; c += b; } paint(); return true; }
      if (e.key === ' ') { const g = P.G[cur[0]][cur[1]]; if (g.r && g.d) dk = dk === 'r' ? 'd' : 'r'; paint(); return true; }
      if (e.key === 'Backspace') { if (!ans[cur[0]][cur[1]]) move(-1); ans[cur[0]][cur[1]] = ''; paint(); status(); return true; }
      if (e.key === 'Tab' || e.key === 'Enter') { nextWord(); paint(); return true; }
      if (e.key.length === 1) { const ch = e.key.toUpperCase().normalize('NFD').replace(/[̀-̂̄-ͯ]/g, '').normalize('NFC'); if (/^[A-ZÑ]$/.test(ch)) { typeCh(ch); return true; } }
      return false;
    };
    function fit() {
      if (!R) return; const W = root.clientWidth || 900, Hh = root.clientHeight || 600, wide = W > 900;
      const s = Math.floor(Math.max(24, Math.min(54, (Hh - 76) / R, ((wide ? W - 380 : W - 20)) / C)));
      gridEl.style.setProperty('--s', s + 'px');
    }
    new ResizeObserver(() => { const k = root.clientWidth + 'x' + root.clientHeight; if (k === lastSz) return; lastSz = k; fit(); }).observe(root);
    const autoB = btn(auto ? '✔ Corrige al escribir' : 'Corregir al escribir', () => { auto = !auto; const s = H.get(); s.auto = auto; H.set(s); autoB.textContent = auto ? '✔ Corrige al escribir' : 'Corregir al escribir'; paint(); });
    const tools = [pick('Tamaño', Object.entries(SIZES).map(([k, v]) => [k, v.n]), size, (v) => { size = v; const s = H.get(); s.size = v; H.set(s); newGame(); }), autoB, btn('✔ Revisar', check), btn('Ver letra', revealLetter), btn('Ver palabra', revealWord), btn('Resolver', revealAll), btn('Nuevo', newGame)];
    root.__cr = { P: () => P, type: typeCh, sel: (r, c) => select(r, c) };
    requestAnimationFrame(newGame);
    return { el: root, tools, key, help: 'Tocá un casillero o una definición de la lista y escribí. Espacio cambia entre horizontal y vertical, Enter pasa a la próxima palabra y las flechas te mueven. Las respuestas van sin tildes.', hide: () => t.stop(), show: () => { if (!done && P && ans.some(r => r.some(Boolean))) t.start(); } };
  }
  BM.register({ id: 'crucigrama', n: 'Crucigrama', d: 'El crucigrama de siempre: grilla con números y las definiciones horizontales y verticales al costado.', c: '#1d2433', create: crucigrama,
    art: '<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="8" fill="#1d2433"/><g fill="#fffdf6"><rect x="8" y="8" width="11" height="11"/><rect x="20" y="8" width="11" height="11"/><rect x="32" y="8" width="11" height="11"/><rect x="20" y="20" width="11" height="11"/><rect x="20" y="32" width="11" height="11"/><rect x="32" y="32" width="11" height="11"/><rect x="44" y="32" width="11" height="11"/><rect x="44" y="20" width="11" height="11"/><rect x="44" y="44" width="11" height="11"/><rect x="8" y="32" width="11" height="11"/></g><g font-family="system-ui" font-size="4.5" font-weight="700" fill="#555"><text x="9" y="12.5">1</text><text x="21" y="12.5">2</text><text x="9" y="36.5">3</text><text x="45" y="24.5">4</text></g><g font-family="system-ui" font-weight="800" font-size="8" fill="#1b2433" text-anchor="middle"><text x="13.5" y="17">S</text><text x="25.5" y="17">O</text><text x="37.5" y="17">L</text></g></svg>',
    best: (s) => s.solved ? `${s.solved} resueltos` : 'Nunca jugaste' });
})();
