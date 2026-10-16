/* ===== Shared content for the whole site. Every text is { en, es }. ===== */

// Map projection used by the Explore map and the Map Challenge game.
// Simplified outline of the Dominican Republic, drawn by hand from lon/lat.
const MAP = {
  lon0: -71.95, lat0: 20.05, kx: 245, ky: 260, w: 900, h: 680,
  project(lon, lat) { return { x: (lon - this.lon0) * this.kx, y: (this.lat0 - lat) * this.ky }; },
  unproject(x, y) { return { lon: x / this.kx + this.lon0, lat: this.lat0 - y / this.ky }; },
  km(a, b) { // haversine distance between {lon,lat} points
    const r = (d) => (d * Math.PI) / 180;
    const dLat = r(b.lat - a.lat), dLon = r(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  },
  outline: [
    [-71.70, 19.88], [-71.35, 19.90], [-71.0, 19.93], [-70.7, 19.82], [-70.3, 19.80], [-69.95, 19.67],
    [-69.85, 19.40], [-69.7, 19.38], [-69.5, 19.33], [-69.3, 19.35], [-69.19, 19.32], [-69.1, 19.28],
    [-69.15, 19.2], [-69.3, 19.17], [-69.5, 19.2], [-69.6, 19.22], [-69.5, 19.08], [-69.35, 19.06],
    [-69.15, 19.02], [-69.0, 18.98], [-68.7, 18.88], [-68.45, 18.75], [-68.33, 18.62], [-68.4, 18.5],
    [-68.7, 18.38], [-68.95, 18.37], [-69.3, 18.38], [-69.6, 18.40], [-69.9, 18.43], [-70.2, 18.38],
    [-70.45, 18.2], [-70.9, 18.2], [-71.1, 18.15], [-71.17, 17.99], [-71.35, 17.7], [-71.42, 17.6],
    [-71.65, 17.75], [-71.75, 17.93], [-71.75, 18.03], [-71.72, 18.3], [-71.85, 18.6], [-71.75, 18.95],
    [-71.65, 19.2], [-71.75, 19.5], [-71.75, 19.7]
  ]
};

const PLACES = [
  {
    id: "colonial", cat: "history", img: "colonial", lon: -69.885, lat: 18.473,
    name: { en: "Colonial Zone, Santo Domingo", es: "Zona Colonial, Santo Domingo" },
    short: { en: "The first European city in the Americas, packed with 500-year-old streets.", es: "La primera ciudad europea de América, con calles de hace más de 500 años." },
    long: { en: "Founded in the 1490s, Santo Domingo's old quarter holds the first cathedral, first fortress and first paved street of the New World. It became a UNESCO World Heritage Site in 1990.", es: "Fundada en la década de 1490, la zona antigua de Santo Domingo guarda la primera catedral, la primera fortaleza y la primera calle pavimentada del Nuevo Mundo. Es Patrimonio de la Humanidad de la UNESCO desde 1990." },
    best: { en: "Walk it at sunset, then eat dinner on a plaza.", es: "Recórrela al atardecer y cena en una plaza." },
    where: { en: "Santo Domingo", es: "Santo Domingo" }
  },
  {
    id: "limon", cat: "nature", img: "salto-limon", lon: -69.38, lat: 19.17,
    name: { en: "Salto El Limón", es: "Salto El Limón" },
    short: { en: "A 50 meter waterfall in the jungle, reached on horseback.", es: "Una cascada de 50 metros en la selva, a la que se llega a caballo." },
    long: { en: "Hidden in the hills of the Samaná peninsula, the falls drop into a natural pool you can swim in. The trail passes coffee, cacao and banana plants.", es: "Escondida en las montañas de la península de Samaná, la cascada cae en una poza natural donde puedes nadar. El sendero pasa entre café, cacao y plátanos." },
    best: { en: "Go early, wear shoes that can get wet.", es: "Ve temprano y lleva zapatos que se puedan mojar." },
    where: { en: "Samaná", es: "Samaná" }
  },
  {
    id: "pico", cat: "nature", img: "pico-duarte", lon: -70.99, lat: 19.03,
    name: { en: "Pico Duarte", es: "Pico Duarte" },
    short: { en: "3,098 m: the highest peak in the whole Caribbean.", es: "3,098 m: el pico más alto de todo el Caribe." },
    long: { en: "Named after founding father Juan Pablo Duarte, the peak sits in the Central Mountain Range. Most hikers take two or three days with a guide, and nights can be near freezing.", es: "Lleva el nombre del patricio Juan Pablo Duarte y está en la Cordillera Central. La mayoría lo sube en dos o tres días con guía, y las noches pueden ser casi heladas." },
    best: { en: "Dry season, December to April.", es: "Época seca, de diciembre a abril." },
    where: { en: "Cordillera Central", es: "Cordillera Central" }
  },
  {
    id: "puntacana", cat: "beach", img: "punta-cana", lon: -68.4, lat: 18.58,
    name: { en: "Punta Cana", es: "Punta Cana" },
    short: { en: "Palm-lined white sand on the eastern tip of the island.", es: "Arena blanca y palmeras en la punta oriental de la isla." },
    long: { en: "More than 30 miles of beaches face the Caribbean on one side and a coral reef on the other. Calm, shallow water makes it great for families and snorkeling.", es: "Más de 30 millas de playas miran al Caribe, protegidas por un arrecife de coral. El agua tranquila y poco profunda es ideal para familias y snorkel." },
    best: { en: "Snorkel in the morning before the wind picks up.", es: "Haz snorkel por la mañana, antes de que suba el viento." },
    where: { en: "La Altagracia", es: "La Altagracia" }
  },
  {
    id: "altos", cat: "history", img: "altos-chavon", lon: -68.83, lat: 18.43,
    name: { en: "Altos de Chavón", es: "Altos de Chavón" },
    short: { en: "A Mediterranean-style village built above the Chavón River.", es: "Un pueblo de estilo mediterráneo sobre el río Chavón." },
    long: { en: "Built in the 1970s from stone and clay, it looks centuries old. It has an art school, galleries and a 5,000-seat amphitheater opened with a Frank Sinatra concert in 1982.", es: "Construido en los años 70 con piedra y barro, parece tener siglos. Tiene escuela de arte, galerías y un anfiteatro para 5,000 personas inaugurado con un concierto de Frank Sinatra en 1982." },
    best: { en: "Late afternoon, when the stone turns golden.", es: "Al final de la tarde, cuando la piedra se vuelve dorada." },
    where: { en: "La Romana", es: "La Romana" }
  },
  {
    id: "haitises", cat: "nature", img: "haitises", lon: -69.5, lat: 19.0,
    name: { en: "Los Haitises National Park", es: "Parque Nacional Los Haitises" },
    short: { en: "Mangroves, limestone islets and caves with Taíno rock art.", es: "Manglares, islotes de caliza y cuevas con arte rupestre taíno." },
    long: { en: "Boat tours weave through rock islands covered in forest. Many caves hold drawings and carvings made by the Taíno, the island's first people.", es: "Los paseos en bote cruzan islotes cubiertos de bosque. Muchas cuevas guardan dibujos y tallados de los taínos, los primeros habitantes de la isla." },
    best: { en: "Take a morning boat from Sabana de la Mar.", es: "Toma un bote por la mañana desde Sabana de la Mar." },
    where: { en: "Samaná Bay", es: "Bahía de Samaná" }
  },
  {
    id: "damajagua", cat: "nature", img: "damajagua", lon: -70.8, lat: 19.75,
    name: { en: "27 Waterfalls of Damajagua", es: "27 Charcos de Damajagua" },
    short: { en: "Slide, jump and swim down a river canyon.", es: "Deslízate, salta y nada por un cañón de río." },
    long: { en: "A guided adventure where you climb up a canyon and then jump and slide back down a chain of natural pools and waterfalls. Helmet and life jacket included.", es: "Una aventura guiada donde subes un cañón y luego bajas saltando y deslizándote por una cadena de pozas y cascadas. Casco y chaleco incluidos." },
    best: { en: "Bring a waterproof phone case.", es: "Lleva una funda impermeable para el teléfono." },
    where: { en: "Puerto Plata", es: "Puerto Plata" }
  },
  {
    id: "rincon", cat: "beach", img: "rincon", lon: -69.23, lat: 19.28,
    name: { en: "Playa Rincón", es: "Playa Rincón" },
    short: { en: "A quiet beach where a river meets the sea.", es: "Una playa tranquila donde un río se encuentra con el mar." },
    long: { en: "Often ranked among the best beaches in the Caribbean. There are no big resorts here, just palms, turquoise water and small stands selling fresh fish and coconut.", es: "Suele estar entre las mejores playas del Caribe. No hay grandes hoteles, solo palmeras, agua turquesa y puestos pequeños que venden pescado fresco y coco." },
    best: { en: "Try the fried fish with tostones.", es: "Prueba el pescado frito con tostones." },
    where: { en: "Samaná", es: "Samaná" }
  }
];

// Two more places, then outbound links for every place (info, map, tours, official site when one exists)
PLACES.push(
  {
    id: "casa", cat: "beach", img: "casa", lon: -68.93, lat: 18.41,
    name: { en: "Casa de Campo and Punta Minitas", es: "Casa de Campo y Punta Minitas" },
    short: { en: "A seaside resort community with beaches, a marina and world-famous golf.", es: "Una comunidad turística frente al mar con playas, marina y golf de fama mundial." },
    long: { en: "Near La Romana on the southeast coast, Casa de Campo is a huge resort community. Punta Minitas is its oceanfront area of villas beside Minitas Beach and Bahía Minitas. The property also has a marina, polo and horseback centers, and the Pete Dye designed Teeth of the Dog golf course. Altos de Chavón is just inside it.", es: "Cerca de La Romana, en la costa sureste, Casa de Campo es una enorme comunidad turística. Punta Minitas es su zona frente al mar, con villas junto a la playa y la bahía de Minitas. También tiene marina, centros de polo y equitación, y el campo de golf Teeth of the Dog, diseñado por Pete Dye. Altos de Chavón está dentro de la propiedad." },
    best: { en: "Most facilities are for guests and residents, so check access before you go.", es: "La mayoría de las instalaciones son para huéspedes y residentes, confirma el acceso antes de ir." },
    where: { en: "La Romana", es: "La Romana" }
  },
  {
    id: "valle", cat: "nature", img: "valle", lon: -70.65, lat: 18.75,
    name: { en: "Valle Nuevo National Park", es: "Parque Nacional Valle Nuevo" },
    short: { en: "A cold, misty highland of pine forest where frost can appear.", es: "Una meseta fría y neblinosa de bosque de pinos donde puede aparecer la escarcha." },
    long: { en: "A high plateau in the Cordillera Central with Hispaniolan pine forest, cloud forest and open grasslands. It is one of the coldest places in the country: winter nights can drop below freezing and cover the grass in frost. Rivers start here, and waterfalls like Aguas Blancas are nearby.", es: "Una meseta alta en la Cordillera Central con bosque de pino de La Española, bosque nublado y praderas abiertas. Es de los lugares más fríos del país: las noches de invierno pueden bajar de cero y cubrir la hierba de escarcha. Aquí nacen ríos y hay cascadas cercanas como Aguas Blancas." },
    best: { en: "Bring warm layers, even if you start from the beach, and go with a guide.", es: "Lleva ropa abrigada, aunque salgas de la playa, y ve con un guía." },
    where: { en: "Constanza, Cordillera Central", es: "Constanza, Cordillera Central" }
  }
);
const PLACE_LINKS = {
  colonial: { q: "Colonial Zone Santo Domingo", official: { url: "https://whc.unesco.org/en/list/526/", en: "UNESCO World Heritage page", es: "Página de la UNESCO" } },
  limon: { q: "Salto El Limón" },
  pico: { q: "Pico Duarte" },
  puntacana: { q: "Punta Cana", official: { url: "https://www.puntacana.com/", en: "Punta Cana official site", es: "Sitio oficial de Punta Cana" } },
  altos: { q: "Altos de Chavón", official: { url: "https://www.casadecampo.com.do/", en: "Casa de Campo official site", es: "Sitio oficial de Casa de Campo" } },
  haitises: { q: "Los Haitises National Park" },
  damajagua: { q: "27 Charcos de Damajagua" },
  rincon: { q: "Playa Rincón Samaná" },
  casa: { q: "Casa de Campo La Romana", official: { url: "https://www.casadecampo.com.do/", en: "Casa de Campo official site", es: "Sitio oficial de Casa de Campo" } },
  valle: { q: "Valle Nuevo National Park", official: { url: "https://www.godominicanrepublic.com/things-to-do/valle-nuevo-national-park", en: "Official tourism page", es: "Página oficial de turismo" } }
};
PLACES.forEach((p) => Object.assign(p, PLACE_LINKS[p.id]));
// Builds the outbound links for a place, in the current language
function placeLinks(p) {
  const q = encodeURIComponent(p.q);
  const es = window.LANG === "es";
  const out = [
    { url: `https://${es ? "es" : "en"}.wikipedia.org/wiki/Special:Search?search=${q}&go=Go`, label: es ? "Más información" : "More info", kind: "info" },
    { url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.q + " Dominican Republic")}`, label: es ? "Ver en el mapa" : "Open in Maps", kind: "map" },
    { url: `https://www.getyourguide.com/s/?q=${q}`, label: es ? "Tours y entradas" : "Tours and tickets", kind: "book" }
  ];
  if (p.official) out.unshift({ url: p.official.url, label: es ? p.official.es : p.official.en, kind: "official" });
  return out;
}

const FACTS = [
  { en: "Santo Domingo is the oldest continuously inhabited European settlement in the Americas.", es: "Santo Domingo es el asentamiento europeo habitado de forma continua más antiguo de las Américas." },
  { en: "Pico Duarte, at 3,098 m (10,164 ft), is the highest mountain in the Caribbean.", es: "El Pico Duarte, con 3,098 m (10,164 pies), es la montaña más alta del Caribe." },
  { en: "Lake Enriquillo sits about 40 m below sea level and is home to American crocodiles.", es: "El Lago Enriquillo está a unos 40 m bajo el nivel del mar y es hogar de cocodrilos americanos." },
  { en: "Larimar, a sky-blue gemstone, is found only in the Dominican Republic.", es: "La larimar, una piedra azul cielo, solo se encuentra en la República Dominicana." },
  { en: "Merengue was added to UNESCO's list of intangible cultural heritage in 2016, and bachata in 2019.", es: "El merengue fue inscrito por la UNESCO como patrimonio cultural inmaterial en 2016, y la bachata en 2019." },
  { en: "Every winter, thousands of humpback whales come to Samaná Bay to mate and give birth.", es: "Cada invierno, miles de ballenas jorobadas llegan a la bahía de Samaná para aparearse y parir." },
  { en: "The Dominican flag is one of the very few that shows a Bible on its coat of arms.", es: "La bandera dominicana es de las pocas que muestran una Biblia en su escudo." },
  { en: "Calle Las Damas in Santo Domingo is considered the first street of the New World.", es: "La calle Las Damas, en Santo Domingo, se considera la primera calle del Nuevo Mundo." },
  { en: "The country shares the island of Hispaniola with Haiti.", es: "El país comparte la isla de La Española con Haití." },
  { en: "Dominican amber is famous for holding perfectly preserved prehistoric insects.", es: "El ámbar dominicano es famoso por contener insectos prehistóricos perfectamente conservados." },
  { en: "Independence was declared on February 27, 1844, led by Duarte, Sánchez and Mella.", es: "La independencia se proclamó el 27 de febrero de 1844, liderada por Duarte, Sánchez y Mella." },
  { en: "The name Quisqueya is commonly said to come from a Taíno phrase meaning 'mother of all lands'.", es: "Se dice que el nombre Quisqueya viene de una frase taína que significa 'madre de todas las tierras'." },
  { en: "The Catedral Primada de América, built in the early 1500s, is the oldest cathedral in the Americas.", es: "La Catedral Primada de América, construida a inicios del siglo XVI, es la catedral más antigua de las Américas." },
  { en: "Baseball is more than a sport here: dozens of Major League players come from the country every year.", es: "El béisbol es más que un deporte aquí: decenas de jugadores de las Grandes Ligas salen del país cada año." }
];

const TRUE_FALSE = [
  { q: { en: "Pico Duarte is the highest mountain in the Caribbean.", es: "El Pico Duarte es la montaña más alta del Caribe." }, a: true, why: { en: "Yes: 3,098 m.", es: "Sí: 3,098 m." } },
  { q: { en: "The official language is Portuguese.", es: "El idioma oficial es el portugués." }, a: false, why: { en: "It is Spanish.", es: "Es el español." } },
  { q: { en: "Larimar is found only in the Dominican Republic.", es: "La larimar solo se encuentra en la República Dominicana." }, a: true, why: { en: "Mined near Barahona.", es: "Se extrae cerca de Barahona." } },
  { q: { en: "The capital city is Santiago.", es: "La capital es Santiago." }, a: false, why: { en: "It is Santo Domingo.", es: "Es Santo Domingo." } },
  { q: { en: "Merengue is recognized by UNESCO as cultural heritage.", es: "El merengue es reconocido por la UNESCO como patrimonio cultural." }, a: true, why: { en: "Inscribed in 2016.", es: "Inscrito en 2016." } },
  { q: { en: "Lake Enriquillo is above sea level.", es: "El Lago Enriquillo está sobre el nivel del mar." }, a: false, why: { en: "It is about 40 m below.", es: "Está unos 40 m por debajo." } },
  { q: { en: "The Dominican Republic shares an island with Cuba.", es: "La República Dominicana comparte una isla con Cuba." }, a: false, why: { en: "It shares Hispaniola with Haiti.", es: "Comparte La Española con Haití." } }
];

const TIMELINE = [
  { year: 1492, t: { en: "Columbus lands on the island he names La Española.", es: "Colón llega a la isla y la llama La Española." } },
  { year: 1496, t: { en: "Santo Domingo is founded, the first permanent European city in the Americas.", es: "Se funda Santo Domingo, la primera ciudad europea permanente de las Américas." } },
  { year: 1697, t: { en: "Spain cedes the western third of the island to France. It later becomes Haiti.", es: "España cede a Francia el tercio occidental de la isla. Más tarde será Haití." } },
  { year: 1844, t: { en: "Independence on February 27. The Dominican Republic is born.", es: "Independencia el 27 de febrero. Nace la República Dominicana." } },
  { year: 1865, t: { en: "The War of Restoration ends Spain's return and restores the republic.", es: "La Guerra de la Restauración termina el regreso de España y restablece la república." } },
  { year: 1916, t: { en: "The United States occupies the country until 1924.", es: "Estados Unidos ocupa el país hasta 1924." } },
  { year: 1961, t: { en: "Dictator Rafael Trujillo is assassinated, ending 30 years of rule.", es: "Es asesinado el dictador Rafael Trujillo, tras 30 años de gobierno." } },
  { year: 2016, t: { en: "Merengue joins UNESCO's intangible heritage list.", es: "El merengue entra en la lista de patrimonio inmaterial de la UNESCO." } }
];

const SLANG = [
  { w: "Vaina", m: { en: "A thing, a situation, whatever", es: "Una cosa, una situación, lo que sea" } },
  { w: "Guagua", m: { en: "A bus", es: "Un autobús" } },
  { w: "Un chin", m: { en: "A little bit", es: "Un poquito" } },
  { w: "Jevi", m: { en: "Cool, great", es: "Genial, chévere" } },
  { w: "Tiguere", m: { en: "A street-smart, clever person", es: "Una persona astuta y callejera" } },
  { w: "Colmado", m: { en: "The corner store that sells everything", es: "La tienda de la esquina que vende de todo" } },
  { w: "Motoconcho", m: { en: "A motorbike taxi", es: "Un mototaxi" } },
  { w: "Zafacón", m: { en: "A trash can", es: "Un cubo de basura" } },
  { w: "Yipeta", m: { en: "An SUV", es: "Una camioneta SUV" } },
  { w: "Ñapa", m: { en: "A small extra gift with a purchase", es: "Un pequeño extra que te regalan al comprar" } },
  { w: "Chercha", m: { en: "Lively chatter, a good time", es: "Conversación animada, buen ambiente" } },
  { w: "¿Qué lo qué?", m: { en: "What's up?", es: "¿Qué tal?" } }
];

// Cities and landmarks for the Map Challenge
const CITIES = [
  { n: "Santo Domingo", lon: -69.93, lat: 18.47 }, { n: "Santiago", lon: -70.69, lat: 19.45 },
  { n: "Puerto Plata", lon: -70.69, lat: 19.79 }, { n: "Punta Cana", lon: -68.4, lat: 18.58 },
  { n: "La Romana", lon: -68.97, lat: 18.43 }, { n: "Samaná", lon: -69.33, lat: 19.2 },
  { n: "Barahona", lon: -71.1, lat: 18.2 }, { n: "Jarabacoa", lon: -70.63, lat: 19.12 },
  { n: "Monte Cristi", lon: -71.65, lat: 19.85 }, { n: "Pedernales", lon: -71.74, lat: 18.03 },
  { n: "Higüey", lon: -68.7, lat: 18.62 }, { n: "San Juan de la Maguana", lon: -71.23, lat: 18.81 },
  { n: "Constanza", lon: -70.74, lat: 18.91 }, { n: "Pico Duarte", lon: -70.99, lat: 19.03 },
  { n: "Lago Enriquillo", lon: -71.58, lat: 18.5 }, { n: "Cabarete", lon: -70.41, lat: 19.75 },
  { n: "Bayahibe", lon: -68.84, lat: 18.37 }, { n: "Baní", lon: -70.33, lat: 18.28 },
  { n: "Cabo Engaño", lon: -68.33, lat: 18.62 }, { n: "San Pedro de Macorís", lon: -69.3, lat: 18.45 }
];
