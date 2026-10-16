/* ===== Map Challenge: a real OpenStreetMap map (Leaflet), no labels, with a photo of each target ===== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const L10 = (en, es) => tr({ en, es });
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };
  if (!$("#mg-map")) return;

  // Targets: photo + real coordinates
  const fromPlace = (id) => { const p = PLACES.find((x) => x.id === id); return { id, img: p.img, name: p.name, lon: p.lon, lat: p.lat }; };
  const TARGETS = [
    fromPlace("colonial"), fromPlace("limon"), fromPlace("pico"), fromPlace("puntacana"), fromPlace("altos"),
    fromPlace("haitises"), fromPlace("damajagua"), fromPlace("rincon"), fromPlace("casa"), fromPlace("valle"),
    { id: "higuey", img: "higuey", name: { en: "Basílica de Higüey", es: "Basílica de Higüey" }, lon: -68.70, lat: 18.617 },
    { id: "morro", img: "morro", name: { en: "El Morro, Monte Cristi", es: "El Morro, Monte Cristi" }, lon: -71.67, lat: 19.88 },
    { id: "aguilas", img: "aguilas", name: { en: "Bahía de las Águilas", es: "Bahía de las Águilas" }, lon: -71.65, lat: 17.80 },
    { id: "enriquillo", img: "enriquillo", name: { en: "Lake Enriquillo", es: "Lago Enriquillo" }, lon: -71.58, lat: 18.50 },
    { id: "jimenoa", img: "jimenoa", name: { en: "Salto Jimenoa, Jarabacoa", es: "Salto Jimenoa, Jarabacoa" }, lon: -70.65, lat: 19.10 },
    { id: "cabarete", img: "cabarete", name: { en: "Cabarete", es: "Cabarete" }, lon: -70.41, lat: 19.75 },
    { id: "saona", img: "saona", name: { en: "Saona Island", es: "Isla Saona" }, lon: -68.72, lat: 18.15 },
    { id: "santiago", img: "santiago", name: { en: "Monument in Santiago", es: "Monumento en Santiago" }, lon: -70.69, lat: 19.45 },
    { id: "macoris", img: "macoris", name: { en: "Tetelo Vargas Stadium, San Pedro de Macorís", es: "Estadio Tetelo Vargas, San Pedro de Macorís" }, lon: -69.31, lat: 18.45 },
    { id: "puertoplata", img: "puertoplata", name: { en: "Puerto Plata", es: "Puerto Plata" }, lon: -70.69, lat: 19.79 },
    { id: "bocachica", img: "bocachica", name: { en: "Boca Chica", es: "Boca Chica" }, lon: -69.61, lat: 18.45 },
    { id: "whales", img: "whales", name: { en: "Samaná Bay", es: "Bahía de Samaná" }, lon: -69.30, lat: 19.12 },
    { id: "terrenas", img: "terrenas", name: { en: "Las Terrenas", es: "Las Terrenas" }, lon: -69.54, lat: 19.32 }
  ];

  const DR_BOUNDS = [[17.55, -71.85], [19.98, -68.25]];
  let map = null, guessMarker = null, layer = null, tiles = null;
  let queue = [], round = 0, score = 0, current = null, guess = null, answered = true, playing = false;
  let best = Number(store.get("dr-best-map", 0));
  $("#m-best").textContent = best;

  const km = (a, b) => MAP.km({ lat: a[0], lon: a[1] }, { lat: b[0], lon: b[1] });
  const pin = (cls) => L.divIcon({ className: "", html: `<div class="mg-pin ${cls}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11] });
  const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
  const grayUrl = () => `${ESRI}Canvas/World_${document.documentElement.dataset.theme === "dark" ? "Dark" : "Light"}_Gray_Base/MapServer/tile/{z}/{y}/{x}`;

  function ensureMap() {
    if (map) return true;
    if (!window.L) { $("#mg-offline").hidden = false; return false; }
    map = L.map("mg-map", { center: [18.95, -70.45], zoom: 8, minZoom: 6, maxZoom: 13, maxBounds: [[16.9, -72.9], [20.5, -67.6]], zoomControl: true, attributionControl: true });
    // Two real map styles with no place names: a clean base map and satellite imagery
    tiles = L.tileLayer(grayUrl(), { maxNativeZoom: 12, attribution: "Tiles &copy; Esri, DeLorme, NAVTEQ" }).addTo(map);
    const sat = L.tileLayer(`${ESRI}World_Imagery/MapServer/tile/{z}/{y}/{x}`, { attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics" });
    L.control.layers({ [L10("Map", "Mapa")]: tiles, [L10("Satellite", "Satélite")]: sat }, null, { position: "topright" }).addTo(map);
    layer = L.layerGroup().addTo(map);
    map.fitBounds(DR_BOUNDS, { padding: [10, 10] });
    map.on("click", (e) => {
      if (answered || !playing) return;
      guess = [e.latlng.lat, e.latlng.lng];
      if (guessMarker) guessMarker.setLatLng(e.latlng); else guessMarker = L.marker(e.latlng, { icon: pin("you") }).addTo(layer);
      $("#m-guess").disabled = false;
      $("#m-feedback").textContent = L10("Happy with this spot? Lock in your guess.", "¿Te convence este punto? Confirma tu respuesta.");
    });
    new MutationObserver(() => tiles.setUrl(grayUrl())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return true;
  }

  function show() { if (ensureMap()) setTimeout(() => map.invalidateSize(), 60); }

  function setCard() {
    $("#mg-name").textContent = current ? tr(current.name) : "—";
    if (current) { $("#mg-img").src = `images/${current.img}.jpg`; $("#mg-img").alt = tr(current.name); }
  }

  function next() {
    if (!ensureMap()) return;
    if (!playing) { queue = TARGETS.slice().sort(() => Math.random() - 0.5).slice(0, 10); round = 0; score = 0; playing = true; }
    if (round >= 10) return end();
    layer.clearLayers(); guessMarker = null; guess = null; answered = false;
    map.fitBounds(DR_BOUNDS, { padding: [10, 10] });
    current = queue[round++];
    $("#m-round").textContent = round; $("#m-score").textContent = score;
    setCard();
    $("#m-feedback").textContent = L10("Click the map to place your guess.", "Haz clic en el mapa para marcar tu respuesta.");
    $("#m-guess").disabled = true; $("#m-guess").hidden = false;
    $("#m-next").hidden = true;
  }

  function lockIn() {
    if (answered || !guess) return;
    answered = true;
    const target = [current.lat, current.lon];
    const d = km(guess, target);
    const pts = Math.round(100 * Math.exp(-d / 50));
    score += pts;
    L.marker(target, { icon: pin("answer") }).addTo(layer).bindTooltip(tr(current.name), { permanent: true, direction: "top", offset: [0, -12], className: "mg-tip" });
    L.polyline([guess, target], { color: "#ce1126", weight: 3, dashArray: "8 8" }).addTo(layer);
    map.fitBounds([guess, target], { padding: [60, 60], maxZoom: 11 });
    $("#m-score").textContent = score;
    $("#m-feedback").textContent = L10(`${Math.round(d)} km away. +${pts} points`, `A ${Math.round(d)} km. +${pts} puntos`);
    $("#m-guess").hidden = true;
    $("#m-next").hidden = false;
    $("#m-next").textContent = round >= 10 ? L10("See result", "Ver resultado") : L10("Next", "Siguiente");
  }

  function end() {
    playing = false; answered = true; current = null;
    if (score > best) { best = score; store.set("dr-best-map", best); $("#m-best").textContent = best; }
    $("#mg-name").textContent = "—";
    $("#m-feedback").textContent = L10(`You finished with ${score} out of 1000 points.`, `Terminaste con ${score} de 1000 puntos.`);
    $("#m-guess").hidden = true;
    $("#m-next").hidden = false;
    $("#m-next").textContent = L10("Play again", "Jugar otra vez");
  }

  $("#m-next").addEventListener("click", () => { if (answered && playing && round >= 10) return end(); next(); });
  $("#m-guess").addEventListener("click", lockIn);
  $("#m-guess").hidden = true;
  document.addEventListener("langchange", () => { if (current) setCard(); });
  window.MapGame = { show };
  if (location.hash === "#map") show();
})();
