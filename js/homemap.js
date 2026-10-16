/* ===== Home page: interactive island explorer ===== */
(function () {
  "use strict";
  const svg = document.getElementById("home-map");
  if (!svg) return;
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

    { id: "whales", cat: "nature", emoji: "🐋", lon: -69.3, lat: 19.12, months: [1, 2, 3],
      name: { en: "Samaná Bay Whale Watching", es: "Avistamiento de ballenas en Samaná" },
      text: { en: "From January to March, thousands of humpback whales arrive in Samaná Bay to mate and give birth. Boats take you close enough to watch them breach.", es: "De enero a marzo, miles de ballenas jorobadas llegan a la bahía de Samaná para aparearse y parir. Los botes te acercan lo suficiente para verlas saltar." },
      fact: { en: "A humpback can weigh as much as 30 tons and still leap out of the water.", es: "Una jorobada puede pesar unas 30 toneladas y aun así saltar fuera del agua." },
      ev: { en: "Humpback whale season in Samaná", es: "Temporada de ballenas jorobadas en Samaná" } },
    { id: "terrenas", cat: "food", emoji: "🐟", lon: -69.54, lat: 19.32,
      name: { en: "Las Terrenas", es: "Las Terrenas" },
      text: { en: "A beach town on the Samaná peninsula, famous for pescado con coco: fresh fish simmered in creamy coconut sauce, served with tostones.", es: "Un pueblo de playa en la península de Samaná, famoso por el pescado con coco: pescado fresco en cremosa salsa de coco, con tostones." },
      fact: { en: "Coconut palms here were once so common that the coast was nicknamed after them.", es: "Los cocoteros eran tan comunes aquí que la costa ganó fama por ellos." } },
    { id: "santiago", cat: "music", emoji: "🪗", lon: -70.69, lat: 19.45,
      name: { en: "Santiago and the Cibao", es: "Santiago y el Cibao" },
      text: { en: "The second city sits in the fertile Cibao valley, heartland of accordion merengue and a world center for hand-rolled cigars.", es: "La segunda ciudad está en el fértil valle del Cibao, cuna del merengue típico con acordeón y centro mundial del tabaco hecho a mano." },
      fact: { en: "Merengue típico is built on just three instruments: accordion, tambora and güira.", es: "El merengue típico se construye con solo tres instrumentos: acordeón, tambora y güira." } },
    { id: "lavega", cat: "music", emoji: "🎭", lon: -70.53, lat: 19.22, months: [2],
      name: { en: "La Vega Carnival", es: "Carnaval de La Vega" },
      text: { en: "Every February, dancers in huge, colorful horned masks called diablos cojuelos fill the streets with whips, noise and joy.", es: "Cada febrero, bailarines con enormes máscaras de cuernos llamadas diablos cojuelos llenan las calles de látigos, ruido y alegría." },
      fact: { en: "Each mask is handmade and no two are alike.", es: "Cada máscara es hecha a mano y no hay dos iguales." },
      ev: { en: "Carnival in La Vega", es: "Carnaval en La Vega" } },
    { id: "macoris", cat: "sport", emoji: "⚾", lon: -69.3, lat: 18.45, months: [11, 12, 1],
      name: { en: "San Pedro de Macorís", es: "San Pedro de Macorís" },
      text: { en: "The baseball capital of the country. This small city has sent so many shortstops to the Major Leagues that it is known for them.", es: "La capital del béisbol. Esta pequeña ciudad ha enviado tantos paracortos a las Grandes Ligas que es famosa por ellos." },
      fact: { en: "The winter league plays from late October to January, with packed, noisy stadiums.", es: "La liga de invierno se juega de finales de octubre a enero, con estadios llenos y ruidosos." },
      ev: { en: "Winter baseball season", es: "Temporada de béisbol invernal" } },
    { id: "barahona", cat: "nature", emoji: "💎", lon: -71.1, lat: 18.2,
      name: { en: "Barahona and Larimar", es: "Barahona y la larimar" },
      text: { en: "The southwest coast is where larimar is mined, a sky-blue gemstone found only in the Dominican Republic. It is also coffee country.", es: "La costa suroeste es donde se extrae la larimar, una piedra azul cielo que solo existe en la República Dominicana. También es tierra de café." },
      fact: { en: "Larimar's color looks like Caribbean water frozen in stone.", es: "El color de la larimar parece agua del Caribe congelada en piedra." } },
    { id: "enriquillo", cat: "nature", emoji: "🐊", lon: -71.58, lat: 18.5,
      name: { en: "Lake Enriquillo", es: "Lago Enriquillo" },
      text: { en: "A saltwater lake about 40 meters below sea level, the lowest point in the Caribbean. Its islands are home to American crocodiles and rhinoceros iguanas.", es: "Un lago salado a unos 40 metros bajo el nivel del mar, el punto más bajo del Caribe. Sus islas albergan cocodrilos americanos e iguanas rinocerontes." },
      fact: { en: "It is a former arm of the sea that got cut off millions of years ago.", es: "Antes fue un brazo del mar que quedó aislado hace millones de años." } },
    { id: "jarabacoa", cat: "sport", emoji: "🚣", lon: -70.63, lat: 19.12,
      name: { en: "Jarabacoa", es: "Jarabacoa" },
      text: { en: "Nicknamed the land of eternal spring. Cool mountain air, river rafting, canyoning and waterfalls like Salto Jimenoa.", es: "Apodada la tierra de la eterna primavera. Aire fresco de montaña, rafting, descenso de cañones y cascadas como el Salto Jimenoa." },
      fact: { en: "It sits more than 500 meters above sea level, so it is cooler than the coast.", es: "Está a más de 500 metros sobre el nivel del mar, por eso es más fresca que la costa." } },
    { id: "cabarete", cat: "sport", emoji: "🏄", lon: -70.41, lat: 19.75,
      name: { en: "Cabarete", es: "Cabarete" },
      text: { en: "A world-known beach for kitesurfing and windsurfing, with steady winds, warm water and a lively beach-bar scene at night.", es: "Una playa conocida mundialmente para kitesurf y windsurf, con vientos constantes, agua cálida y mucho ambiente en los bares de playa." },
      fact: { en: "Beginners and pros share the same bay, in different zones.", es: "Principiantes y expertos comparten la misma bahía, en zonas distintas." } },
    { id: "saona", cat: "beach", emoji: "⭐", lon: -68.72, lat: 18.15,
      name: { en: "Saona Island", es: "Isla Saona" },
      text: { en: "A protected island off the southeast coast with palm-lined beaches and a shallow natural pool where starfish rest on the sand.", es: "Una isla protegida frente a la costa sureste con playas de palmeras y una piscina natural poco profunda donde descansan estrellas de mar." },
      fact: { en: "You reach it by boat from Bayahibe, and it is part of a national park.", es: "Se llega en bote desde Bayahibe y forma parte de un parque nacional." } },
    { id: "higuey", cat: "history", emoji: "⛪", lon: -68.7, lat: 18.62, months: [1],
      name: { en: "Basílica de Higüey", es: "Basílica de Higüey" },
      text: { en: "A huge modern basilica with a tall concrete arch, built to honor Our Lady of Altagracia, the country's patron saint.", es: "Una enorme basílica moderna con un alto arco de concreto, construida para honrar a Nuestra Señora de la Altagracia, patrona del país." },
      fact: { en: "Pilgrims travel here on January 21 for the feast day.", es: "Los peregrinos viajan aquí el 21 de enero para la fiesta." },
      ev: { en: "Altagracia pilgrimage (January 21)", es: "Peregrinación de la Altagracia (21 de enero)" } },
    { id: "constanza", cat: "food", emoji: "🍓", lon: -70.74, lat: 18.91,
      name: { en: "Constanza", es: "Constanza" },
      text: { en: "A high mountain valley with cool nights, known for strawberries, flowers and fresh vegetables you can buy at roadside stands.", es: "Un valle de alta montaña con noches frías, conocido por sus fresas, flores y vegetales frescos que se venden al borde del camino." },
      fact: { en: "It can get cold enough here for a light frost.", es: "Aquí puede hacer suficiente frío para una ligera escarcha." } },
    { id: "aguilas", cat: "beach", emoji: "🦅", lon: -71.65, lat: 17.8,
      name: { en: "Bahía de las Águilas", es: "Bahía de las Águilas" },
      text: { en: "A long, wild, empty beach in the far southwest. No hotels, no stands, just pale sand and clear water inside a national park.", es: "Una playa larga, salvaje y vacía en el extremo suroeste. Sin hoteles ni puestos, solo arena clara y agua cristalina dentro de un parque nacional." },
      fact: { en: "Bring water and shade: there is nothing to buy on the sand.", es: "Lleva agua y sombra: no hay nada que comprar en la arena." } },
    { id: "montecristi", cat: "history", emoji: "🏔", lon: -71.65, lat: 19.85,
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
  const byId = (id) => SPOTS.find((s) => s.id === id);
  const SD = byId("colonial");
  const ROUTE = ["colonial", "altos", "saona", "puntacana", "haitises", "limon", "rincon", "cabarete", "damajagua", "santiago", "jarabacoa", "pico"];
  const pos = (s) => MAP.project(s.lon, s.lat);

  let filter = "all", month = new Date().getMonth() + 1, current = null;
  let tripToken = 0, tripping = false, tripIdx = -1;
  const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Draw the map ---------- */
  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  }
  const outline = MAP.outline.map(([lo, la]) => { const p = MAP.project(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
  svg.setAttribute("viewBox", "-20 -50 940 780");
  svg.innerHTML = `
    <defs>
      <clipPath id="sea-clip"><rect x="-20" y="-50" width="940" height="780" rx="14"></rect></clipPath>
      <filter id="land-shadow" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-opacity="0.25"></feDropShadow></filter>
    </defs>
    <rect class="sea" x="-20" y="-50" width="940" height="780" rx="14"></rect>
    <g clip-path="url(#sea-clip)"><g class="waves" id="waves"></g></g>
    <text class="sea-label" x="450" y="-14" text-anchor="middle">ATLANTIC OCEAN</text>
    <text class="sea-label" x="470" y="700" text-anchor="middle">CARIBBEAN SEA</text>
    <text class="sea-label" x="14" y="330" text-anchor="middle" transform="rotate(-90 14 330)">HAITI</text>
    <polygon class="land" points="${outline}" filter="url(#land-shadow)"></polygon>
    <g id="terrain"></g>
    <polyline id="route" class="route" points=""></polyline>
    <g id="spots"></g>
    <g id="traveler" class="traveler" visibility="hidden"><circle r="20"></circle><text text-anchor="middle" dy="7">🚗</text></g>
    <g class="compass" transform="translate(820 600)"><circle r="34"></circle><path d="M0 -26 L7 0 L0 26 L-7 0 Z"></path><text y="-38" text-anchor="middle">N</text></g>`;

  // Animated waves
  const waves = $("#waves", svg);
  for (let r = -3; r < 24; r++) {
    for (let c = -1; c < 24; c++) {
      el("path", { d: "M0 0 q9 -6 18 0 t18 0", class: "wave", transform: `translate(${c * 54 + (r % 2) * 27} ${r * 34})` }, waves);
    }
  }
  // Terrain: Cordillera Central ridge and Lake Enriquillo
  const terrain = $("#terrain", svg);
  [[-71.3, 19.15], [-71.15, 19.05], [-70.85, 18.95], [-70.95, 18.85], [-70.7, 18.8], [-70.5, 18.85], [-70.35, 19.0], [-71.05, 18.75], [-70.55, 19.0]].forEach(([lo, la]) => {
    const p = MAP.project(lo, la); el("text", { x: p.x, y: p.y, class: "peak", "text-anchor": "middle" }, terrain).textContent = "▲";
  });
  const lk = MAP.project(-71.58, 18.5);
  el("ellipse", { cx: lk.x, cy: lk.y + 8, rx: 44, ry: 10, class: "lake" }, terrain);

  /* ---------- Pins ---------- */
  const layer = $("#spots", svg);
  SPOTS.forEach((s) => {
    const { x, y } = pos(s), c = CATS[s.cat];
    const g = el("g", { class: "spot", tabindex: 0, role: "button", "data-id": s.id, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, layer);
    el("circle", { class: "halo", r: 20 }, g);
    el("circle", { class: "dot", r: 16, fill: c.color }, g);
    el("text", { class: "emo", "text-anchor": "middle", dy: 6 }, g).textContent = s.emoji;
    el("text", { class: "lab", "text-anchor": "middle", y: -26 }, g);
    g.addEventListener("click", () => { stopTrip(); select(s.id); });
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stopTrip(); select(s.id); } });
    g.addEventListener("mouseenter", () => layer.appendChild(g));
    g.addEventListener("focus", () => layer.appendChild(g));
    s.node = g;
  });

  /* ---------- Controls ---------- */
  const chipBox = $("#map-chips");
  function renderChips() {
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
      s.node.classList.toggle("dim", !on);
      s.node.classList.toggle("live", on && liveNow(s));
      s.node.classList.toggle("active", !!current && current.id === s.id);
      s.node.setAttribute("aria-label", tr(s.name) + (liveNow(s) ? " (" + L("happening now", "ocurre ahora") + ")" : ""));
      $(".lab", s.node).textContent = tr(s.name).split(":")[0].split(",")[0];
    });
  }

  const monthRange = $("#month-range");
  function renderMonth() {
    $("#month-name").textContent = MONTHS[window.LANG][month - 1];
    const box = $("#month-events");
    box.innerHTML = "";
    const evs = SPOTS.filter((s) => s.ev && liveNow(s));
    if (!evs.length) {
      box.innerHTML = `<span class="muted">${L("No big events this month. A good time to wander off the map.", "Sin grandes eventos este mes. Buen momento para pasear sin prisa.")}</span>`;
    }
    evs.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "event-pill"; b.textContent = s.emoji + " " + tr(s.ev);
      b.addEventListener("click", () => { stopTrip(); select(s.id); });
      box.appendChild(b);
    });
  }
  monthRange.value = month;
  monthRange.addEventListener("input", () => { month = Number(monthRange.value); renderMonth(); applyView(); if (current) renderPanel(); });

  /* ---------- Info panel ---------- */
  function visible() { return SPOTS.filter((s) => filter === "all" || s.cat === filter); }
  function renderPanel() {
    const s = current;
    const panel = $("#spot-panel");
    if (!s) return;
    panel.classList.add("has-spot");
    const c = CATS[s.cat];
    const photo = $("#sp-photo");
    if (s.img) { photo.style.background = ""; photo.innerHTML = `<img src="images/${s.img}.jpg" alt="${tr(s.name)}">`; }
    else { photo.innerHTML = `<span class="big-emoji" aria-hidden="true">${s.emoji}</span>`; photo.style.background = `linear-gradient(135deg, ${c.color}, color-mix(in srgb, ${c.color} 55%, #0b1d44))`; }
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
  function select(id) {
    current = byId(id);
    $("#spot-panel").classList.add("has-spot");
    $("#sp-welcome").hidden = true; $("#sp-detail").hidden = false;
    renderPanel(); applyView();
    layer.appendChild(current.node);
    const p = $("#spot-panel");
    p.classList.remove("pop"); void p.offsetWidth; p.classList.add("pop");
    if (window.innerWidth < 900 && !tripping) p.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
  }
  function step(dir) {
    const list = visible(); if (!list.length) return;
    let i = current ? list.indexOf(current) : -1;
    i = (i + dir + list.length) % list.length;
    stopTrip(); select(list[i].id);
  }
  $("#sp-prev").addEventListener("click", () => step(-1));
  $("#sp-next").addEventListener("click", () => step(1));
  $("#sp-random").addEventListener("click", () => { const l = visible(); stopTrip(); select(l[Math.floor(Math.random() * l.length)].id); });
  $("#sp-random-2").addEventListener("click", () => $("#sp-random").click());

  /* ---------- Road trip ---------- */
  const traveler = $("#traveler", svg), route = $("#route", svg), tripBtn = $("#trip-btn");
  function setTripLabel() { tripBtn.textContent = tripping ? L("■ Stop trip", "■ Detener viaje") : L("🚗 Start road trip", "🚗 Iniciar viaje"); }
  function stopTrip() {
    if (!tripping) return;
    tripping = false; tripToken++; traveler.setAttribute("visibility", "hidden");
    svg.classList.remove("tripping"); setTripLabel();
  }
  function startTrip() {
    stopTrip();
    tripping = true; tripIdx = -1; const my = ++tripToken;
    filter = "all"; renderChips();
    route.setAttribute("points", ""); svg.classList.add("tripping"); setTripLabel();
    $("#map-stage").scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    const first = pos(byId(ROUTE[0]));
    traveler.setAttribute("visibility", "visible");
    traveler.setAttribute("transform", `translate(${first.x} ${first.y})`);
    arrive(0, my);
  }
  function arrive(i, my) {
    if (my !== tripToken) return;
    const s = byId(ROUTE[i]), p = pos(s);
    route.setAttribute("points", ROUTE.slice(0, i + 1).map((id) => { const q = pos(byId(id)); return `${q.x.toFixed(1)},${q.y.toFixed(1)}`; }).join(" "));
    traveler.setAttribute("transform", `translate(${p.x} ${p.y})`);
    tripping = true; select(s.id); tripping = true;
    setTimeout(() => {
      if (my !== tripToken) return;
      if (i + 1 >= ROUTE.length) { stopTrip(); return; }
      drive(i, i + 1, my);
    }, 4200);
  }
  function drive(a, b, my) {
    const A = pos(byId(ROUTE[a])), B = pos(byId(ROUTE[b]));
    const dur = reduced ? 1 : 1500, t0 = performance.now();
    const tick = (t) => {
      if (my !== tripToken) return;
      const k = Math.min(1, (t - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      traveler.setAttribute("transform", `translate(${A.x + (B.x - A.x) * e} ${A.y + (B.y - A.y) * e})`);
      if (k < 1) requestAnimationFrame(tick); else arrive(b, my);
    };
    requestAnimationFrame(tick);
  }
  tripBtn.addEventListener("click", () => (tripping ? stopTrip() : startTrip()));

  /* ---------- Language ---------- */
  document.addEventListener("langchange", () => { renderChips(); renderMonth(); applyView(); if (current) renderPanel(); setTripLabel(); });
  renderChips(); renderMonth(); applyView(); setTripLabel();
})();
