/* ===== Home page: interactive island explorer ===== */
(function () {
  "use strict";
  const svg = document.getElementById("home-map") || document.getElementById("places-map");
  if (!svg) return;
  const EXPLORE = svg.id === "places-map";   // on the Explore page, pins open the place modal instead of the side card
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const L = (en, es) => tr({ en, es });
  const NS = "http://www.w3.org/2000/svg";

  const CATS = {
    beach: { emoji: "🏖", color: "#0a8fb3", en: "Beaches", es: "Playas" },
    nature: { emoji: "🌿", color: "#1e7b4f", en: "Nature", es: "Naturaleza" },
    history: { emoji: "🏛", color: "#8a5a14", en: "History", es: "Historia" },
    food: { emoji: "🍽", color: "#c2541b", en: "Food", es: "Comida" },
    music: { emoji: "🎶", color: "#8e44ad", en: "Music & fiesta", es: "Música y fiesta" },
    sport: { emoji: "⚾", color: "#ce1126", en: "Sport & thrills", es: "Deporte y aventura" }
  };
  const MONTHS = {
    en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    es: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
  };
  const place = (id) => PLACES.find((p) => p.id === id);

  // Each spot: where it is, what it is, a surprising fact, and (optionally) the months when something is happening.
  const SPOTS = [
    { id: "colonial", cat: "history", emoji: "🏛", from: "colonial", months: [7, 8],
      fact: { en: "Calle Las Damas is called the first street of the New World. Every summer the city also hosts a big merengue festival.", es: "A la calle Las Damas se le llama la primera calle del Nuevo Mundo. Cada verano la ciudad también celebra un gran festival de merengue." },
      ev: { en: "Santo Domingo Merengue Festival", es: "Festival de Merengue de Santo Domingo" } },
    { id: "limon", cat: "nature", emoji: "💦", from: "limon",
      fact: { en: "The trail to the falls runs through coffee, cacao and banana plants.", es: "El sendero a la cascada pasa entre plantas de café, cacao y plátano." } },
    { id: "pico", cat: "nature", emoji: "⛰", from: "pico", months: [12, 1, 2, 3, 4],
      fact: { en: "At the summit, nights can drop to freezing, even in the tropics.", es: "En la cima, las noches pueden llegar a congelar, incluso en el trópico." },
      ev: { en: "Dry season: best window to hike Pico Duarte", es: "Época seca: la mejor ventana para subir el Pico Duarte" } },
    { id: "puntacana", cat: "beach", emoji: "🏝", from: "puntacana",
      fact: { en: "A coral reef shelters the shore, so the water stays calm and shallow.", es: "Un arrecife de coral protege la costa, por eso el agua es tranquila y poco profunda." } },
    { id: "altos", cat: "history", emoji: "🎭", from: "altos",
      fact: { en: "It looks 500 years old but was built in the 1970s, stone by stone.", es: "Parece tener 500 años, pero se construyó en los años 70, piedra por piedra." } },
    { id: "haitises", cat: "nature", emoji: "🛶", from: "haitises",
      fact: { en: "Taíno rock drawings are still visible inside the caves.", es: "Los dibujos rupestres taínos todavía se ven dentro de las cuevas." } },
    { id: "damajagua", cat: "sport", emoji: "🧗", from: "damajagua",
      fact: { en: "You climb up the canyon first, then jump and slide back down 27 pools.", es: "Primero subes el cañón, luego bajas saltando y deslizándote por 27 pozas." } },
    { id: "rincon", cat: "beach", emoji: "🌴", from: "rincon",
      fact: { en: "A river meets the sea at one end of this beach.", es: "Un río se junta con el mar en un extremo de esta playa." } },

    { id: "casa", cat: "beach", emoji: "⛳", from: "casa",
      fact: { en: "Altos de Chavón sits inside the same property, so you can visit a stone village and play a famous golf course in one day.", es: "Altos de Chavón está dentro de la misma propiedad, así que puedes visitar un pueblo de piedra y jugar en un campo de golf famoso el mismo día." } },
    { id: "valle", cat: "nature", emoji: "❄", from: "valle", months: [12, 1, 2],
      fact: { en: "Frost on the grass is common on winter mornings, which surprises many visitors in a tropical country.", es: "La escarcha sobre la hierba es común en las mañanas de invierno, lo que sorprende a muchos visitantes en un país tropical." },
      ev: { en: "Frost season in Valle Nuevo", es: "Temporada de escarcha en Valle Nuevo" } },
    { id: "whales", img: "whales", cat: "nature", emoji: "🐋", lon: -69.3, lat: 19.12, months: [1, 2, 3],
      name: { en: "Samaná Bay Whale Watching", es: "Avistamiento de ballenas en Samaná" },
      text: { en: "From January to March, thousands of humpback whales arrive in Samaná Bay to mate and give birth. Boats take you close enough to watch them breach.", es: "De enero a marzo, miles de ballenas jorobadas llegan a la bahía de Samaná para aparearse y parir. Los botes te acercan lo suficiente para verlas saltar." },
      fact: { en: "A humpback can weigh as much as 30 tons and still leap out of the water.", es: "Una jorobada puede pesar unas 30 toneladas y aun así saltar fuera del agua." },
      ev: { en: "Humpback whale season in Samaná", es: "Temporada de ballenas jorobadas en Samaná" } },
    { id: "terrenas", img: "terrenas", cat: "food", emoji: "🐟", lon: -69.54, lat: 19.32,
      name: { en: "Las Terrenas", es: "Las Terrenas" },
      text: { en: "A beach town on the Samaná peninsula, famous for pescado con coco: fresh fish simmered in creamy coconut sauce, served with tostones.", es: "Un pueblo de playa en la península de Samaná, famoso por el pescado con coco: pescado fresco en cremosa salsa de coco, con tostones." },
      fact: { en: "Coconut palms here were once so common that the coast was nicknamed after them.", es: "Los cocoteros eran tan comunes aquí que la costa ganó fama por ellos." } },
    { id: "santiago", img: "santiago", cat: "music", emoji: "🪗", lon: -70.69, lat: 19.45,
      name: { en: "Santiago and the Cibao", es: "Santiago y el Cibao" },
      text: { en: "The second city sits in the fertile Cibao valley, heartland of accordion merengue and a world center for hand-rolled cigars.", es: "La segunda ciudad está en el fértil valle del Cibao, cuna del merengue típico con acordeón y centro mundial del tabaco hecho a mano." },
      fact: { en: "Merengue típico is built on just three instruments: accordion, tambora and güira.", es: "El merengue típico se construye con solo tres instrumentos: acordeón, tambora y güira." } },
    { id: "lavega", img: "carnaval", cat: "music", emoji: "🎭", lon: -70.53, lat: 19.22, months: [2],
      name: { en: "La Vega Carnival", es: "Carnaval de La Vega" },
      text: { en: "Every February, dancers in huge, colorful horned masks called diablos cojuelos fill the streets with whips, noise and joy.", es: "Cada febrero, bailarines con enormes máscaras de cuernos llamadas diablos cojuelos llenan las calles de látigos, ruido y alegría." },
      fact: { en: "Each mask is handmade and no two are alike.", es: "Cada máscara es hecha a mano y no hay dos iguales." },
      ev: { en: "Carnival in La Vega", es: "Carnaval en La Vega" } },
    { id: "macoris", img: "macoris", cat: "sport", emoji: "⚾", lon: -69.3, lat: 18.45, months: [11, 12, 1],
      name: { en: "San Pedro de Macorís", es: "San Pedro de Macorís" },
      text: { en: "The baseball capital of the country. This small city has sent so many shortstops to the Major Leagues that it is known for them.", es: "La capital del béisbol. Esta pequeña ciudad ha enviado tantos paracortos a las Grandes Ligas que es famosa por ellos." },
      fact: { en: "The winter league plays from late October to January, with packed, noisy stadiums.", es: "La liga de invierno se juega de finales de octubre a enero, con estadios llenos y ruidosos." },
      ev: { en: "Winter baseball season", es: "Temporada de béisbol invernal" } },
    { id: "barahona", cat: "nature", emoji: "💎", lon: -71.1, lat: 18.2,
      name: { en: "Barahona and Larimar", es: "Barahona y la larimar" },
      text: { en: "The southwest coast is where larimar is mined, a sky-blue gemstone found only in the Dominican Republic. It is also coffee country.", es: "La costa suroeste es donde se extrae la larimar, una piedra azul cielo que solo existe en la República Dominicana. También es tierra de café." },
      fact: { en: "Larimar's color looks like Caribbean water frozen in stone.", es: "El color de la larimar parece agua del Caribe congelada en piedra." } },
    { id: "enriquillo", img: "enriquillo", cat: "nature", emoji: "🐊", lon: -71.58, lat: 18.5,
      name: { en: "Lake Enriquillo", es: "Lago Enriquillo" },
      text: { en: "A saltwater lake about 40 meters below sea level, the lowest point in the Caribbean. Its islands are home to American crocodiles and rhinoceros iguanas.", es: "Un lago salado a unos 40 metros bajo el nivel del mar, el punto más bajo del Caribe. Sus islas albergan cocodrilos americanos e iguanas rinocerontes." },
      fact: { en: "It is a former arm of the sea that got cut off millions of years ago.", es: "Antes fue un brazo del mar que quedó aislado hace millones de años." } },
    { id: "jarabacoa", img: "jimenoa", cat: "sport", emoji: "🚣", lon: -70.63, lat: 19.12,
      name: { en: "Jarabacoa", es: "Jarabacoa" },
      text: { en: "Nicknamed the land of eternal spring. Cool mountain air, river rafting, canyoning and waterfalls like Salto Jimenoa.", es: "Apodada la tierra de la eterna primavera. Aire fresco de montaña, rafting, descenso de cañones y cascadas como el Salto Jimenoa." },
      fact: { en: "It sits more than 500 meters above sea level, so it is cooler than the coast.", es: "Está a más de 500 metros sobre el nivel del mar, por eso es más fresca que la costa." } },
    { id: "cabarete", img: "cabarete", cat: "sport", emoji: "🏄", lon: -70.41, lat: 19.75,
      name: { en: "Cabarete", es: "Cabarete" },
      text: { en: "A world-known beach for kitesurfing and windsurfing, with steady winds, warm water and a lively beach-bar scene at night.", es: "Una playa conocida mundialmente para kitesurf y windsurf, con vientos constantes, agua cálida y mucho ambiente en los bares de playa." },
      fact: { en: "Beginners and pros share the same bay, in different zones.", es: "Principiantes y expertos comparten la misma bahía, en zonas distintas." } },
    { id: "saona", img: "saona", cat: "beach", emoji: "⭐", lon: -68.72, lat: 18.15,
      name: { en: "Saona Island", es: "Isla Saona" },
      text: { en: "A protected island off the southeast coast with palm-lined beaches and a shallow natural pool where starfish rest on the sand.", es: "Una isla protegida frente a la costa sureste con playas de palmeras y una piscina natural poco profunda donde descansan estrellas de mar." },
      fact: { en: "You reach it by boat from Bayahibe, and it is part of a national park.", es: "Se llega en bote desde Bayahibe y forma parte de un parque nacional." } },
    { id: "higuey", img: "higuey", cat: "history", emoji: "⛪", lon: -68.7, lat: 18.62, months: [1],
      name: { en: "Basílica de Higüey", es: "Basílica de Higüey" },
      text: { en: "A huge modern basilica with a tall concrete arch, built to honor Our Lady of Altagracia, the country's patron saint.", es: "Una enorme basílica moderna con un alto arco de concreto, construida para honrar a Nuestra Señora de la Altagracia, patrona del país." },
      fact: { en: "Pilgrims travel here on January 21 for the feast day.", es: "Los peregrinos viajan aquí el 21 de enero para la fiesta." },
      ev: { en: "Altagracia pilgrimage (January 21)", es: "Peregrinación de la Altagracia (21 de enero)" } },
    { id: "constanza", cat: "food", emoji: "🍓", lon: -70.74, lat: 18.91,
      name: { en: "Constanza", es: "Constanza" },
      text: { en: "A high mountain valley with cool nights, known for strawberries, flowers and fresh vegetables you can buy at roadside stands.", es: "Un valle de alta montaña con noches frías, conocido por sus fresas, flores y vegetales frescos que se venden al borde del camino." },
      fact: { en: "It can get cold enough here for a light frost.", es: "Aquí puede hacer suficiente frío para una ligera escarcha." } },
    { id: "aguilas", img: "aguilas", cat: "beach", emoji: "🦅", lon: -71.65, lat: 17.8,
      name: { en: "Bahía de las Águilas", es: "Bahía de las Águilas" },
      text: { en: "A long, wild, empty beach in the far southwest. No hotels, no stands, just pale sand and clear water inside a national park.", es: "Una playa larga, salvaje y vacía en el extremo suroeste. Sin hoteles ni puestos, solo arena clara y agua cristalina dentro de un parque nacional." },
      fact: { en: "Bring water and shade: there is nothing to buy on the sand.", es: "Lleva agua y sombra: no hay nada que comprar en la arena." } },
    { id: "montecristi", img: "morro", cat: "history", emoji: "🏔", lon: -71.65, lat: 19.85,
      name: { en: "Monte Cristi", es: "Monte Cristi" },
      text: { en: "A dry, quiet northwest corner dominated by El Morro, a flat-topped hill that rises straight from the sea. Great for sunsets and salt flats.", es: "Una esquina seca y tranquila en el noroeste dominada por El Morro, una colina de cima plana que se eleva desde el mar. Ideal para atardeceres y salinas." },
      fact: { en: "The nearby salt flats have been worked for centuries.", es: "Las salinas cercanas se trabajan desde hace siglos." } }
  ];
  SPOTS.forEach((s) => {
    if (s.from) {
      const p = place(s.from);
      s.name = s.id === "colonial" ? { en: "Santo Domingo: Colonial Zone", es: "Santo Domingo: Zona Colonial" } : p.name;
      s.text = p.long; s.img = p.img; s.lon = p.lon; s.lat = p.lat;
    }
  });
  if (EXPLORE) SPOTS.splice(0, SPOTS.length, ...SPOTS.filter((s) => s.from));
  const byId = (id) => SPOTS.find((s) => s.id === id);
  const SD = SPOTS.find((s) => s.id === "colonial");
  const ROUTE = ["colonial", "altos", "saona", "puntacana", "haitises", "limon", "rincon", "cabarete", "damajagua", "santiago", "jarabacoa", "pico"];
  const pos = (s) => MAP.project(s.lon, s.lat);

  let filter = "all", month = new Date().getMonth() + 1, current = null, hovered = null;
  let tripToken = 0, tripping = false;
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

  /* ---------- Draw the map ---------- */
  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  }
  const BASE = { x: -20, y: -50, w: 940, h: 780 };
  const outline = MAP.outline.map(([lo, la]) => { const p = MAP.project(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
  svg.setAttribute("viewBox", `${BASE.x} ${BASE.y} ${BASE.w} ${BASE.h}`);
  svg.innerHTML = `
    <defs>
      <clipPath id="sea-clip"><rect x="${BASE.x}" y="${BASE.y}" width="${BASE.w}" height="${BASE.h}" rx="14"></rect></clipPath>
      <filter id="land-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25"></feDropShadow></filter>
      <linearGradient id="land-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--land-a)"></stop><stop offset="1" stop-color="var(--land-b)"></stop></linearGradient>
    </defs>
    <rect class="sea" x="${BASE.x}" y="${BASE.y}" width="${BASE.w}" height="${BASE.h}" rx="14"></rect>
    <g clip-path="url(#sea-clip)"><g class="waves" id="waves"></g></g>
    <text class="sea-label" x="450" y="-14" text-anchor="middle">ATLANTIC OCEAN</text>
    <text class="sea-label" x="470" y="700" text-anchor="middle">CARIBBEAN SEA</text>
    <text class="sea-label" x="14" y="330" text-anchor="middle" transform="rotate(-90 14 330)">HAITI</text>
    <polygon class="land" points="${outline}" filter="url(#land-shadow)"></polygon>
    <g id="terrain"></g>
    <polyline id="route" class="route" points=""></polyline>
    <g id="spots"></g>
    <g id="tip" class="tip" visibility="hidden"><g class="tip-s"><rect rx="10"></rect><text text-anchor="middle"></text></g></g>
    <g id="traveler" class="traveler" visibility="hidden"><g class="pin-s"><circle r="20"></circle><text class="car" text-anchor="middle" dy="7">🚗</text></g></g>`;

  const waves = $("#waves", svg);
  for (let r = -3; r < 24; r++) for (let c = -1; c < 24; c++) el("path", { d: "M0 0 q9 -6 18 0 t18 0", class: "wave", transform: `translate(${c * 54 + (r % 2) * 27} ${r * 34})` }, waves);
  const terrain = $("#terrain", svg);
  [[-71.3, 19.15], [-71.15, 19.05], [-70.85, 18.95], [-70.95, 18.85], [-70.7, 18.8], [-70.5, 18.85], [-70.35, 19.0], [-71.05, 18.75], [-70.55, 19.0]].forEach(([lo, la]) => {
    const p = MAP.project(lo, la); el("text", { x: p.x, y: p.y, class: "peak", "text-anchor": "middle" }, terrain).textContent = "▲";
  });
  const lk = MAP.project(-71.58, 18.5);
  el("ellipse", { cx: lk.x, cy: lk.y + 8, rx: 44, ry: 10, class: "lake" }, terrain);

  /* ---------- Pins (teardrop markers, constant size on screen) ---------- */
  const layer = $("#spots", svg), tip = $("#tip", svg), route = $("#route", svg), traveler = $("#traveler", svg);
  const PIN_PATH = "M0 0 C-9 -12 -19 -20 -19 -33 a19 19 0 1 1 38 0 C19 -20 9 -12 0 0Z";
  SPOTS.slice().sort((a, b) => b.lat - a.lat).forEach((s, i) => {
    const { x, y } = pos(s), c = CATS[s.cat];
    const g = el("g", { class: "spot", tabindex: 0, role: "button", "data-id": s.id, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, layer);
    const sc = el("g", { class: "pin-s" }, g);
    el("circle", { class: "hit", r: 30, cy: -22 }, sc);
    el("ellipse", { class: "halo", rx: 20, ry: 8 }, sc);
    el("ellipse", { class: "shadow", rx: 9, ry: 3.5, cy: 1 }, sc);
    const a = el("g", { class: "pin-a", style: `animation-delay:${(i * 45)}ms` }, sc);
    el("path", { class: "body", d: PIN_PATH, fill: c.color }, a);
    el("circle", { class: "bubble", cy: -33, r: 14 }, a);
    el("text", { class: "emo", "text-anchor": "middle", y: -27 }, a).textContent = s.emoji;
    g.addEventListener("click", () => { stopTrip(); select(s.id, true); });
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stopTrip(); select(s.id, true); } });
    g.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovered = s; showTip(s); } });
    g.addEventListener("pointerleave", () => { if (hovered === s) { hovered = null; showTip(current); } });
    g.addEventListener("focus", () => showTip(s));
    g.addEventListener("blur", () => showTip(current));
    s.node = g;
  });

  /* ---------- Camera: zoom, pan and fly-to by driving the viewBox ---------- */
  let cam = { cx: BASE.x + BASE.w / 2, cy: BASE.y + BASE.h / 2, k: 1 }, flyToken = 0;
  function setCam(cx, cy, k) {
    k = clamp(k, 1, 7);
    const vw = BASE.w / k, vh = BASE.h / k;
    cx = clamp(cx, BASE.x + vw / 2, BASE.x + BASE.w - vw / 2); cy = clamp(cy, BASE.y + vh / 2, BASE.y + BASE.h - vh / 2);
    cam = { cx, cy, k };
    svg.setAttribute("viewBox", `${(cx - vw / 2).toFixed(2)} ${(cy - vh / 2).toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`);
    updatePinScale();
  }
  function updatePinScale() {
    const rw = svg.getBoundingClientRect().width || 600, pxPerUnit = rw / (BASE.w / cam.k);
    const target = rw < 480 ? 34 : 40;            // pin height in screen pixels
    svg.style.setProperty("--pin", (target / 52 / pxPerUnit).toFixed(4));
    svg.classList.toggle("zoomed", cam.k > 1.02);
    svg.style.touchAction = cam.k > 1.02 ? "none" : "pan-y";
    $("#z-in").disabled = cam.k >= 7; $("#z-out").disabled = cam.k <= 1.02; $("#z-reset").hidden = cam.k <= 1.02;
  }
  function flyTo(cx, cy, k, dur) {
    const my = ++flyToken, from = { ...cam };
    if (reduced || !dur) { setCam(cx, cy, k); return; }
    const t0 = performance.now();
    const tick = (t) => {
      if (my !== flyToken) return;
      const p = ease(Math.min(1, (t - t0) / dur));
      // zoom in log space so it feels even
      const kk = Math.exp(Math.log(from.k) + (Math.log(k) - Math.log(from.k)) * p);
      setCam(from.cx + (cx - from.cx) * p, from.cy + (cy - from.cy) * p, kk);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const resetView = () => flyTo(BASE.x + BASE.w / 2, BASE.y + BASE.h / 2, 1, 700);
  function zoomAt(px, py, factor) {
    flyToken++;
    const r = svg.getBoundingClientRect(), vw = BASE.w / cam.k, vh = BASE.h / cam.k;
    const sx = cam.cx + (px / r.width - 0.5) * vw, sy = cam.cy + (py / r.height - 0.5) * vh;
    const k = clamp(cam.k * factor, 1, 7), nvw = BASE.w / k, nvh = BASE.h / k;
    setCam(sx - (px / r.width - 0.5) * nvw, sy - (py / r.height - 0.5) * nvh, k);
  }
  const zoomCenter = (f) => { const r = svg.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, f); };
  $("#z-in").addEventListener("click", () => { stopTrip(); zoomCenter(1.6); });
  $("#z-out").addEventListener("click", () => { stopTrip(); zoomCenter(1 / 1.6); });
  $("#z-reset").addEventListener("click", () => { stopTrip(); resetView(); });
  window.addEventListener("resize", updatePinScale);

  // Wheel zoom only with Ctrl/Cmd (or a trackpad pinch), so normal scrolling still moves the page
  svg.addEventListener("wheel", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault(); stopTrip();
    const r = svg.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.01));
  }, { passive: false });
  svg.addEventListener("dblclick", (e) => {
    if (e.target.closest(".spot")) return;
    stopTrip(); const r = svg.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, 2);
  });

  // Drag to pan, pinch to zoom
  const pointers = new Map(); let panStart = null, moved = false, suppressClick = false, pinchD = 0;
  svg.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false; suppressClick = false;
    if (pointers.size === 1) panStart = { x: e.clientX, y: e.clientY, cx: cam.cx, cy: cam.cy };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinchD = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  svg.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = svg.getBoundingClientRect();
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchD) { stopTrip(); zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinchD); moved = true; }
      pinchD = d; return;
    }
    if (!panStart || cam.k <= 1.02) return;
    const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    if (!moved) { moved = true; stopTrip(); flyToken++; try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } svg.classList.add("panning"); hideTip(); }
    const vw = BASE.w / cam.k, vh = BASE.h / cam.k;
    setCam(panStart.cx - (dx / r.width) * vw, panStart.cy - (dy / r.height) * vh, cam.k);
  });
  const endPointer = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchD = 0;
    if (moved) suppressClick = true;
    if (!pointers.size) { panStart = null; svg.classList.remove("panning"); setTimeout(() => { suppressClick = false; }, 0); }
  };
  svg.addEventListener("pointerup", endPointer); svg.addEventListener("pointercancel", endPointer);
  svg.addEventListener("click", (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);

  /* ---------- Tooltip label (its own layer, so pins never move in the DOM) ---------- */
  function hideTip() { tip.setAttribute("visibility", "hidden"); }
  function showTip(s) {
    if (!s) { hideTip(); return; }
    const { x, y } = pos(s), t = $("text", tip), r = $("rect", tip);
    t.textContent = tr(s.name).split(":")[0].split(",")[0];
    tip.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    tip.setAttribute("visibility", "visible");
    const bb = t.getBBox();
    t.setAttribute("y", -62);
    r.setAttribute("x", bb.x - 10); r.setAttribute("width", bb.width + 20); r.setAttribute("height", bb.height + 10); r.setAttribute("y", -62 - bb.height * 0.78 - 4);
  }

  /* ---------- Filters and month ---------- */
  const chipBox = $("#map-chips");
  function renderChips() {
    if (!chipBox) return;
    chipBox.innerHTML = "";
    const mk = (key, label) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.dataset.cat = key; b.setAttribute("aria-pressed", filter === key);
      b.textContent = label;
      b.addEventListener("click", () => { filter = key; applyView(); renderChips(); });
      chipBox.appendChild(b);
    };
    mk("all", L("All", "Todo"));
    Object.keys(CATS).forEach((k) => mk(k, CATS[k].emoji + " " + tr(CATS[k])));
  }
  function liveNow(s) { return !!(s.months && s.months.includes(month)); }
  function applyView() {
    SPOTS.forEach((s) => {
      const on = filter === "all" || s.cat === filter;
      if (!EXPLORE) s.node.classList.toggle("dim", !on);
      s.node.classList.toggle("live", on && liveNow(s));
      s.node.classList.toggle("active", !!current && current.id === s.id);
      s.node.setAttribute("aria-label", tr(s.name) + (liveNow(s) ? " (" + L("happening now", "ocurre ahora") + ")" : ""));
    });
    showTip(hovered || current);
  }
  const monthRange = $("#month-range");
  function renderMonth() {
    if (!monthRange) return;
    $("#month-name").textContent = MONTHS[window.LANG][month - 1];
    const box = $("#month-events");
    box.innerHTML = "";
    const evs = SPOTS.filter((s) => s.ev && liveNow(s));
    if (!evs.length) box.innerHTML = `<span class="muted">${L("No big events this month. A good time to wander off the map.", "Sin grandes eventos este mes. Buen momento para pasear sin prisa.")}</span>`;
    evs.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "event-pill"; b.textContent = s.emoji + " " + tr(s.ev);
      b.addEventListener("click", () => { stopTrip(); select(s.id, true); });
      box.appendChild(b);
    });
  }
  if (monthRange) monthRange.value = month;
  monthRange?.addEventListener("input", () => { month = Number(monthRange.value); renderMonth(); applyView(); if (current) renderPanel(false); });

  /* ---------- Info panel ---------- */
  const visible = () => SPOTS.filter((s) => filter === "all" || s.cat === filter);
  function renderPanel(animate) {
    const s = current;
    if (!s || EXPLORE) return;
    const c = CATS[s.cat], photo = $("#sp-photo");
    const body = $(".spot-body");
    if (animate) { body.classList.remove("swap"); photo.classList.remove("swap"); void body.offsetWidth; body.classList.add("swap"); photo.classList.add("swap"); }
    if (s.img) {
      photo.style.background = "";
      const img = new Image(); img.alt = tr(s.name); img.src = `images/${s.img}.jpg`;
      photo.innerHTML = ""; photo.appendChild(img);
    } else {
      photo.innerHTML = `<span class="big-emoji" aria-hidden="true">${s.emoji}</span>`;
      photo.style.background = `linear-gradient(135deg, ${c.color}, color-mix(in srgb, ${c.color} 55%, #0b1d44))`;
    }
    const tag = $("#sp-cat"); tag.textContent = c.emoji + " " + tr(c); tag.style.background = c.color;
    $("#sp-now").hidden = !liveNow(s);
    $("#sp-now").textContent = "● " + L("Happening in " + MONTHS.en[month - 1], "Ocurre en " + MONTHS.es[month - 1].toLowerCase());
    $("#sp-name").textContent = tr(s.name);
    $("#sp-text").textContent = tr(s.text);
    $("#sp-fact").textContent = tr(s.fact);
    const km = Math.round(MAP.km(s, SD));
    $("#sp-dist").textContent = s.id === "colonial" ? L("You are in the capital.", "Estás en la capital.")
      : L(`About ${km} km from Santo Domingo in a straight line.`, `A unos ${km} km de Santo Domingo en línea recta.`);
  }
  function select(id, fly) {
    current = byId(id);
    if (EXPLORE) { applyView(); const pl = PLACES.find((p) => p.id === current.from); if (pl && window.openPlaceModal) window.openPlaceModal(pl); return; }
    $("#sp-welcome").hidden = true; $("#sp-detail").hidden = false;
    renderPanel(true); applyView();
    if (fly) { const p = pos(current); flyTo(p.x, p.y - 22, Math.max(cam.k, 2.3), 800); }
    const panel = $("#spot-panel");
    if (window.innerWidth < 900 && !tripping) {
      const r = panel.getBoundingClientRect();
      // bring the card into view but keep the lower half of the map visible above it
      if (r.top > window.innerHeight * 0.7) window.scrollBy({ top: r.top - window.innerHeight * 0.5, behavior: reduced ? "auto" : "smooth" });
    }
  }
  function step(dir) {
    const list = visible(); if (!list.length) return;
    let i = current ? list.indexOf(current) : -1;
    i = (i + dir + list.length) % list.length;
    stopTrip(); select(list[i].id, true);
  }
  $("#sp-prev")?.addEventListener("click", () => step(-1));
  $("#sp-next")?.addEventListener("click", () => step(1));
  $("#sp-random")?.addEventListener("click", () => { const l = visible(); stopTrip(); select(l[Math.floor(Math.random() * l.length)].id, true); });
  $("#sp-random-2")?.addEventListener("click", () => $("#sp-random").click());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && cam.k > 1.02 && svg.contains(document.activeElement)) resetView(); });

  /* ---------- Road trip: the camera follows the car ---------- */
  const tripBtn = $("#trip-btn"), TRIP_K = 2;
  function setTripLabel() { if (tripBtn) tripBtn.textContent = tripping ? L("■ Stop trip", "■ Detener viaje") : L("🚗 Start road trip", "🚗 Iniciar viaje"); }
  function stopTrip() {
    if (!tripping) return;
    tripping = false; tripToken++; traveler.setAttribute("visibility", "hidden");
    svg.classList.remove("tripping"); setTripLabel();
  }
  function startTrip() {
    stopTrip();
    tripping = true; const my = ++tripToken;
    filter = "all"; renderChips(); applyView();
    route.setAttribute("points", ""); svg.classList.add("tripping"); setTripLabel();
    $("#map-stage").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    const first = pos(byId(ROUTE[0]));
    traveler.setAttribute("visibility", "visible");
    traveler.setAttribute("transform", `translate(${first.x} ${first.y})`);
    flyTo(first.x, first.y, TRIP_K, 900);
    setTimeout(() => arrive(0, my), reduced ? 0 : 900);
  }
  function routePoints(upto, extra) {
    const pts = ROUTE.slice(0, upto + 1).map((id) => pos(byId(id)));
    if (extra) pts.push(extra);
    return pts.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  }
  function arrive(i, my) {
    if (my !== tripToken) return;
    const s = byId(ROUTE[i]), p = pos(s);
    route.setAttribute("points", routePoints(i));
    traveler.setAttribute("transform", `translate(${p.x} ${p.y})`);
    select(s.id, false);
    setTimeout(() => {
      if (my !== tripToken) return;
      if (i + 1 >= ROUTE.length) { stopTrip(); resetView(); return; }
      drive(i, i + 1, my);
    }, 4000);
  }
  function drive(a, b, my) {
    const A = pos(byId(ROUTE[a])), B = pos(byId(ROUTE[b]));
    $(".car", traveler).setAttribute("transform", B.x < A.x ? "scale(-1 1)" : "");
    const dur = reduced ? 1 : 1800, t0 = performance.now();
    const tick = (t) => {
      if (my !== tripToken) return;
      const k = Math.min(1, (t - t0) / dur), e = ease(k);
      const x = A.x + (B.x - A.x) * e, y = A.y + (B.y - A.y) * e;
      traveler.setAttribute("transform", `translate(${x} ${y})`);
      route.setAttribute("points", routePoints(a, { x, y }));
      setCam(x, y, TRIP_K);
      if (k < 1) requestAnimationFrame(tick); else arrive(b, my);
    };
    requestAnimationFrame(tick);
  }
  tripBtn?.addEventListener("click", () => (tripping ? stopTrip() : startTrip()));

  /* ---------- Language ---------- */
  // Explore page: the card filters and search also filter the pins, and closing the modal clears the selection
  document.addEventListener("placesfilter", (e) => {
    if (!EXPLORE) return;
    SPOTS.forEach((s) => s.node.classList.toggle("dim", !e.detail.ids.includes(s.from)));
    showTip(hovered || current);
  });
  document.addEventListener("placeclosed", () => { if (EXPLORE) { current = null; applyView(); } });
  document.addEventListener("langchange", () => { renderChips(); renderMonth(); applyView(); if (current) renderPanel(false); setTripLabel(); });
  renderChips(); renderMonth(); applyView(); setTripLabel(); setCam(cam.cx, cam.cy, 1);
  new ResizeObserver(updatePinScale).observe(svg);
})();
