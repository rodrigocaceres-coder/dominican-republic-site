/* ===== Legends: baseball Hall of Fame, athletes, musicians, artists ===== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const L = (en, es) => tr({ en, es });
  if (!$("#legend-grid")) return;

  const CATS = {
    hof: { en: "Hall of Fame", es: "Salón de la Fama", color: "#8a5a14", emoji: "🏆" },
    baseball: { en: "Baseball stars", es: "Estrellas del béisbol", color: "#ce1126", emoji: "⚾" },
    sport: { en: "Other sports", es: "Otros deportes", color: "#0a8fb3", emoji: "🏅" },
    music: { en: "Music", es: "Música", color: "#8e44ad", emoji: "🎶" },
    arts: { en: "Arts and letters", es: "Artes y letras", color: "#1e7b4f", emoji: "🎨" }
  };

  // Every entry sticks to widely documented facts. Stats are career totals.
  const PEOPLE = [
    { id: "marichal", cat: "hof", year: 1983, name: "Juan Marichal", init: "JM",
      role: { en: "Pitcher, the \"Dominican Dandy\"", es: "Lanzador, el \"Dandy Dominicano\"" },
      from: { en: "Laguna Verde, Monte Cristi", es: "Laguna Verde, Monte Cristi" },
      stats: [["243", { en: "wins", es: "victorias" }], ["2,303", { en: "strikeouts", es: "ponches" }]],
      bio: { en: "Marichal won over 240 games with his famous high leg kick. In 1983 he became the first Dominican ever elected to the Baseball Hall of Fame in Cooperstown.", es: "Marichal ganó más de 240 juegos con su famosa patada alta. En 1983 se convirtió en el primer dominicano elegido al Salón de la Fama del Béisbol en Cooperstown." },
      fact: { en: "He opened the door: every Dominican Hall of Famer since followed his path.", es: "Abrió la puerta: todo dominicano en el Salón de la Fama desde entonces siguió su camino." } },
    { id: "pedro", cat: "hof", year: 2015, name: "Pedro Martínez", init: "PM",
      role: { en: "Pitcher", es: "Lanzador" },
      from: { en: "Manoguayabo, Santo Domingo", es: "Manoguayabo, Santo Domingo" },
      stats: [["3", { en: "Cy Young Awards", es: "premios Cy Young" }], ["3,154", { en: "strikeouts", es: "ponches" }]],
      bio: { en: "One of the most dominant pitchers ever, Pedro won three Cy Young Awards and helped the Boston Red Sox win the 2004 World Series. He was elected on his first ballot.", es: "Uno de los lanzadores más dominantes de la historia. Pedro ganó tres premios Cy Young y ayudó a los Medias Rojas de Boston a ganar la Serie Mundial de 2004. Fue elegido en su primera votación." },
      fact: { en: "His 1999 and 2000 seasons are often called the best pitching years of the modern era.", es: "Sus temporadas de 1999 y 2000 se consideran de las mejores de lanzadores en la era moderna." } },
    { id: "vladimir", cat: "hof", year: 2018, name: "Vladimir Guerrero", init: "VG",
      role: { en: "Outfielder", es: "Jardinero" },
      from: { en: "Don Gregorio, Nizao", es: "Don Gregorio, Nizao" },
      stats: [["449", { en: "home runs", es: "jonrones" }], [".318", { en: "career average", es: "promedio" }]],
      bio: { en: "Vladimir could hit almost any pitch, even ones bouncing in the dirt, and throw runners out from deep in the outfield. He was inducted in 2018.", es: "Vladimir podía conectar casi cualquier lanzamiento, incluso los que picaban en la tierra, y sacar corredores desde lo profundo del jardín. Fue exaltado en 2018." },
      fact: { en: "His son, Vladimir Guerrero Jr., is also a star in the Major Leagues.", es: "Su hijo, Vladimir Guerrero Jr., también es una estrella en las Grandes Ligas." } },
    { id: "ortiz", cat: "hof", year: 2022, name: "David Ortiz", init: "DO",
      role: { en: "Designated hitter, \"Big Papi\"", es: "Bateador designado, \"Big Papi\"" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["541", { en: "home runs", es: "jonrones" }], ["3", { en: "World Series titles", es: "Series Mundiales" }]],
      bio: { en: "Big Papi became a Boston legend for his clutch hits and big smile. He won World Series titles in 2004, 2007 and 2013, and was the 2013 Series MVP. He was inducted in 2022.", es: "Big Papi se volvió leyenda en Boston por sus batazos decisivos y su gran sonrisa. Ganó la Serie Mundial en 2004, 2007 y 2013, y fue el MVP de la Serie de 2013. Fue exaltado en 2022." },
      fact: { en: "He was elected on his first year on the ballot.", es: "Fue elegido en su primer año en la votación." } },
    { id: "beltre", cat: "hof", year: 2024, name: "Adrián Beltré", init: "AB",
      role: { en: "Third baseman", es: "Tercera base" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["3,166", { en: "hits", es: "hits" }], ["5", { en: "Gold Gloves", es: "Guantes de Oro" }]],
      bio: { en: "Beltré combined power at the plate with brilliant defense at third base over a 21-year career. In 2024 he became the fifth Dominican in Cooperstown, elected on his first ballot.", es: "Beltré combinó poder al bate con una defensa brillante en la tercera base durante 21 años. En 2024 se convirtió en el quinto dominicano en Cooperstown, elegido en su primera votación." },
      fact: { en: "He famously hated anyone touching his head, and teammates loved to try.", es: "Era famoso por detestar que le tocaran la cabeza, y a sus compañeros les encantaba intentarlo." } },

    { id: "sosa", cat: "baseball", name: "Sammy Sosa", init: "SS",
      role: { en: "Outfielder", es: "Jardinero" },
      from: { en: "San Pedro de Macorís", es: "San Pedro de Macorís" },
      stats: [["609", { en: "home runs", es: "jonrones" }], ["66", { en: "HR in 1998", es: "jonrones en 1998" }]],
      bio: { en: "Sosa starred for the Chicago Cubs and shared the famous 1998 home run chase with Mark McGwire, winning the National League MVP that year.", es: "Sosa brilló con los Cachorros de Chicago y compartió la famosa carrera de jonrones de 1998 con Mark McGwire, ganando el MVP de la Liga Nacional ese año." },
      fact: { en: "He is the only player with three seasons of 60 or more home runs.", es: "Es el único jugador con tres temporadas de 60 o más jonrones." } },
    { id: "pujols", cat: "baseball", name: "Albert Pujols", init: "AP",
      role: { en: "First baseman", es: "Primera base" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["703", { en: "home runs", es: "jonrones" }], ["3", { en: "MVP awards", es: "premios MVP" }]],
      bio: { en: "Pujols won two World Series with the St. Louis Cardinals and retired in 2022 with more than 700 home runs. He is expected to reach Cooperstown after he becomes eligible.", es: "Pujols ganó dos Series Mundiales con los Cardenales de San Luis y se retiró en 2022 con más de 700 jonrones. Se espera que llegue a Cooperstown cuando sea elegible." },
      fact: { en: "He is one of very few players in history to hit 700 home runs.", es: "Es de los poquísimos jugadores en la historia con 700 jonrones." } },
    { id: "soto", cat: "baseball", name: "Juan Soto", init: "JS",
      role: { en: "Outfielder", es: "Jardinero" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["2019", { en: "World Series champion", es: "campeón de la Serie Mundial" }]],
      bio: { en: "Soto reached the Major Leagues as a teenager and is known for an elite batting eye and patience at the plate. He won the 2019 World Series with the Washington Nationals.", es: "Soto llegó a las Grandes Ligas siendo adolescente y es conocido por su ojo élite y su paciencia al bate. Ganó la Serie Mundial de 2019 con los Nacionales de Washington." },
      fact: { en: "His routine of shuffling in the batter's box became a trademark.", es: "Su rutina de arrastrar los pies en la caja de bateo se volvió su sello." } },
    { id: "tatis", cat: "baseball", name: "Fernando Tatis Jr.", init: "FT",
      role: { en: "Shortstop and outfielder", es: "Campocorto y jardinero" },
      from: { en: "San Pedro de Macorís", es: "San Pedro de Macorís" },
      stats: [["SPM", { en: "the cradle of shortstops", es: "cuna de campocortos" }]],
      bio: { en: "A flashy star for the San Diego Padres, Tatis Jr. comes from San Pedro de Macorís, the city known for producing big league shortstops.", es: "Una estrella llamativa de los Padres de San Diego. Tatis Jr. viene de San Pedro de Macorís, la ciudad conocida por producir campocortos de Grandes Ligas." },
      fact: { en: "His father, Fernando Tatis Sr., also played in the Major Leagues.", es: "Su padre, Fernando Tatis Sr., también jugó en Grandes Ligas." } },

    { id: "felix", cat: "sport", name: "Félix Sánchez", init: "FS",
      role: { en: "400 m hurdler", es: "Vallista de 400 m" },
      from: { en: "Dominican-American, raised in the US", es: "Dominicano-estadounidense" },
      stats: [["2", { en: "Olympic golds", es: "oros olímpicos" }]],
      bio: { en: "Sánchez won the Olympic 400 m hurdles in Athens 2004, the first Olympic gold for the Dominican Republic, and won again in London 2012.", es: "Sánchez ganó los 400 m con vallas en Atenas 2004, el primer oro olímpico de la República Dominicana, y volvió a ganar en Londres 2012." },
      fact: { en: "In 2012 he cried while the Dominican national anthem played.", es: "En 2012 lloró mientras sonaba el himno nacional dominicano." } },
    { id: "marileidy", cat: "sport", name: "Marileidy Paulino", init: "MP",
      role: { en: "400 m sprinter", es: "Velocista de 400 m" },
      from: { en: "Dominican Republic", es: "República Dominicana" },
      stats: [["48.17", { en: "Olympic record, Paris 2024", es: "récord olímpico, París 2024" }]],
      bio: { en: "Paulino won the women's 400 m at the Paris 2024 Olympics in an Olympic record time of 48.17 seconds.", es: "Paulino ganó los 400 m femeninos en los Juegos Olímpicos de París 2024 con récord olímpico de 48.17 segundos." },
      fact: { en: "She had already won Olympic silver medals in Tokyo 2020.", es: "Ya había ganado medallas de plata olímpicas en Tokio 2020." } },
    { id: "horford", cat: "sport", name: "Al Horford", init: "AH",
      role: { en: "Basketball center", es: "Centro de baloncesto" },
      from: { en: "Puerto Plata", es: "Puerto Plata" },
      stats: [["2024", { en: "NBA champion", es: "campeón de la NBA" }]],
      bio: { en: "Born in Puerto Plata, Horford became a multiple-time NBA All-Star and won the 2024 NBA championship with the Boston Celtics. He also plays for the Dominican national team.", es: "Nacido en Puerto Plata, Horford fue varias veces All-Star de la NBA y ganó el campeonato de 2024 con los Celtics de Boston. También juega con la selección dominicana." },
      fact: { en: "Known for his calm leadership and for stretching the floor with three-pointers.", es: "Conocido por su liderazgo tranquilo y por abrir la cancha con triples." } },

    { id: "juanluis", cat: "music", name: "Juan Luis Guerra", init: "JLG",
      role: { en: "Singer and songwriter", es: "Cantautor" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["Grammy", { en: "and Latin Grammy winner", es: "y Latin Grammy" }]],
      bio: { en: "Juan Luis Guerra brought merengue and bachata to the whole world with poetic lyrics. His album Bachata Rosa is a classic. He has won many Grammy and Latin Grammy awards.", es: "Juan Luis Guerra llevó el merengue y la bachata a todo el mundo con letras poéticas. Su álbum Bachata Rosa es un clásico. Ha ganado muchos premios Grammy y Latin Grammy." },
      fact: { en: "His song Ojalá que llueva café is known across Latin America.", es: "Su canción Ojalá que llueva café es conocida en toda América Latina." } },
    { id: "ventura", cat: "music", name: "Johnny Ventura", init: "JV",
      role: { en: "Merengue star", es: "Estrella del merengue" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["El Caballo Mayor", { en: "his nickname", es: "su apodo" }]],
      bio: { en: "Ventura modernized merengue with energetic stage shows and a big band sound, and later served in public office, including as mayor of Santo Domingo.", es: "Ventura modernizó el merengue con shows enérgicos y un sonido de orquesta, y luego tuvo cargos públicos, incluyendo alcalde de Santo Domingo." },
      fact: { en: "He was called \"El Caballo Mayor\", the top horse.", es: "Lo llamaban \"El Caballo Mayor\"." } },
    { id: "milly", cat: "music", name: "Milly Quezada", init: "MQ",
      role: { en: "Merengue singer", es: "Cantante de merengue" },
      from: { en: "Dominican Republic", es: "República Dominicana" },
      stats: [["La Reina", { en: "Queen of Merengue", es: "del Merengue" }]],
      bio: { en: "Known as the Queen of Merengue, Milly Quezada has recorded for decades and earned many honors in tropical music.", es: "Conocida como la Reina del Merengue, Milly Quezada ha grabado durante décadas y ha recibido muchos reconocimientos en la música tropical." },
      fact: { en: "Her voice is one of the most recognized in tropical music.", es: "Su voz es de las más reconocidas de la música tropical." } },
    { id: "romeo", cat: "music", name: "Romeo Santos", init: "RS",
      role: { en: "Bachata singer", es: "Cantante de bachata" },
      from: { en: "Dominican-American, born in the Bronx", es: "Dominicano-estadounidense, nacido en el Bronx" },
      stats: [["Aventura", { en: "former lead singer", es: "excantante principal" }]],
      bio: { en: "As the voice of Aventura and later as a solo artist, Romeo Santos made modern bachata a global sound and fills stadiums.", es: "Como voz de Aventura y luego como solista, Romeo Santos convirtió la bachata moderna en un sonido global y llena estadios." },
      fact: { en: "His parents are Dominican and he grew up in New York.", es: "Sus padres son dominicanos y creció en Nueva York." } },
    { id: "alfa", cat: "music", name: "El Alfa", init: "EA",
      role: { en: "Dembow artist", es: "Artista de dembow" },
      from: { en: "Dominican Republic", es: "República Dominicana" },
      stats: [["Dembow", { en: "street rhythm", es: "ritmo urbano" }]],
      bio: { en: "El Alfa \"El Jefe\" is a leading voice of dembow, a fast Dominican street rhythm that dominates parties and playlists worldwide.", es: "El Alfa \"El Jefe\" es una voz líder del dembow, un rápido ritmo urbano dominicano que domina fiestas y listas de reproducción en el mundo." },
      fact: { en: "Dembow grew from Dominican neighborhoods into a global sound.", es: "El dembow pasó de los barrios dominicanos a ser un sonido global." } },

    { id: "junot", cat: "arts", name: "Junot Díaz", init: "JD",
      role: { en: "Writer", es: "Escritor" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["2008", { en: "Pulitzer Prize", es: "premio Pulitzer" }]],
      bio: { en: "Born in Santo Domingo, Díaz won the Pulitzer Prize for his novel The Brief Wondrous Life of Oscar Wao, a story of a Dominican family and its history.", es: "Nacido en Santo Domingo, Díaz ganó el premio Pulitzer por su novela La breve y maravillosa vida de Óscar Wao, la historia de una familia dominicana y su historia." },
      fact: { en: "The book mixes English, Spanish and comic book references.", es: "El libro mezcla inglés, español y referencias a los cómics." } },
    { id: "julia", cat: "arts", name: "Julia Álvarez", init: "JA",
      role: { en: "Writer and poet", es: "Escritora y poeta" },
      from: { en: "Dominican-American", es: "Dominicano-estadounidense" },
      stats: [["1991", { en: "How the García Girls Lost Their Accents", es: "De cómo las muchachas García perdieron el acento" }]],
      bio: { en: "Álvarez writes about Dominican families, exile and memory. Her novel In the Time of the Butterflies honors the Mirabal sisters, who opposed the Trujillo dictatorship.", es: "Álvarez escribe sobre familias dominicanas, exilio y memoria. Su novela En el tiempo de las mariposas honra a las hermanas Mirabal, que se opusieron a la dictadura de Trujillo." },
      fact: { en: "November 25 is the international day against violence toward women, chosen to honor the Mirabal sisters.", es: "El 25 de noviembre, día internacional contra la violencia hacia las mujeres, se eligió en honor a las hermanas Mirabal." } },
    { id: "oscar", cat: "arts", name: "Oscar de la Renta", init: "OR",
      role: { en: "Fashion designer", es: "Diseñador de moda" },
      from: { en: "Santo Domingo", es: "Santo Domingo" },
      stats: [["1932", { en: "born in Santo Domingo", es: "nació en Santo Domingo" }]],
      bio: { en: "Born in Santo Domingo, de la Renta became one of the most famous designers in the world, dressing first ladies, movie stars and brides.", es: "Nacido en Santo Domingo, de la Renta se convirtió en uno de los diseñadores más famosos del mundo y vistió a primeras damas, estrellas de cine y novias." },
      fact: { en: "He dressed several American first ladies.", es: "Vistió a varias primeras damas de Estados Unidos." } },
    { id: "zoe", cat: "arts", name: "Zoe Saldaña", init: "ZS",
      role: { en: "Actress", es: "Actriz" },
      from: { en: "Dominican-American", es: "Dominicano-estadounidense" },
      stats: [["Avatar", { en: "and Guardians of the Galaxy", es: "y Guardianes de la Galaxia" }]],
      bio: { en: "Zoe Saldaña has Dominican and Puerto Rican roots and spent part of her childhood in the Dominican Republic. She stars in some of the biggest films ever made and won an Oscar in 2025.", es: "Zoe Saldaña tiene raíces dominicanas y puertorriqueñas y pasó parte de su infancia en la República Dominicana. Protagoniza algunas de las películas más taquilleras y ganó un Óscar en 2025." },
      fact: { en: "She speaks Spanish and often talks about her Dominican heritage.", es: "Habla español y suele hablar de su herencia dominicana." } }
  ];

  let cat = "all", query = "", current = null;
  const grid = $("#legend-grid");

  function avatar(p) {
    const c = CATS[p.cat].color;
    return `<div class="avatar" style="background: linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 50%, #0b1d44))" aria-hidden="true">${p.init}</div>`;
  }
  function statChips(p) {
    return p.stats.map(([v, l]) => `<span class="stat-chip"><b>${v}</b> ${tr(l)}</span>`).join("");
  }

  /* Hall of Fame wall: the five Dominicans in Cooperstown, shown as bronze plaques */
  function renderHof() {
    const wall = $("#hof-wall");
    wall.innerHTML = "";
    PEOPLE.filter((p) => p.cat === "hof").forEach((p) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "plaque reveal in";
      b.setAttribute("aria-label", `${p.name}, ${L("inducted", "exaltado")} ${p.year}`);
      b.innerHTML = `<span class="plaque-year">${p.year}</span>${avatar(p)}<strong>${p.name}</strong><span class="plaque-role">${tr(p.role)}</span>`;
      b.addEventListener("click", () => openModal(p));
      wall.appendChild(b);
    });
  }

  function renderGrid() {
    const q = query.trim().toLowerCase();
    const list = PEOPLE.filter((p) => (cat === "all" || p.cat === cat) && (!q || (p.name + " " + tr(p.role) + " " + tr(p.from)).toLowerCase().includes(q)));
    grid.innerHTML = "";
    if (!list.length) { grid.innerHTML = `<p class="empty">${L("No one matches your search.", "Nadie coincide con tu búsqueda.")}</p>`; return; }
    list.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card legend-card";
      card.innerHTML = `<div class="legend-head">${avatar(p)}<div><span class="tag" style="background:${CATS[p.cat].color}">${CATS[p.cat].emoji} ${tr(CATS[p.cat])}</span><h3>${p.name}</h3></div></div>
        <p class="legend-role">${tr(p.role)} · <span class="muted">${tr(p.from)}</span></p>
        <div class="stat-chips">${statChips(p)}</div>
        <button class="btn small alt" type="button">${L("Read story", "Leer historia")}</button>`;
      $("button", card).addEventListener("click", () => openModal(p));
      grid.appendChild(card);
    });
  }

  /* Modal */
  function openModal(p) {
    current = p;
    $("#lg-avatar").innerHTML = avatar(p);
    $("#lg-tag").textContent = CATS[p.cat].emoji + " " + tr(CATS[p.cat]);
    $("#lg-tag").style.background = CATS[p.cat].color;
    $("#lg-name").textContent = p.name;
    $("#lg-role").textContent = tr(p.role) + " · " + tr(p.from);
    $("#lg-year").hidden = !p.year;
    $("#lg-year").textContent = p.year ? L(`Inducted into the Baseball Hall of Fame in ${p.year}`, `Exaltado al Salón de la Fama del Béisbol en ${p.year}`) : "";
    $("#lg-bio").textContent = tr(p.bio);
    $("#lg-fact").textContent = tr(p.fact);
    $("#lg-stats").innerHTML = statChips(p);
    $("#lg-modal").classList.add("open");
    $("#lg-close").focus();
  }
  const closeModal = () => { $("#lg-modal").classList.remove("open"); current = null; };
  $("#lg-close").addEventListener("click", closeModal);
  $("#lg-modal").addEventListener("click", (e) => { if (e.target.id === "lg-modal") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* Filters */
  function renderChips() {
    const box = $("#legend-chips"); box.innerHTML = "";
    const mk = (k, label) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", cat === k); b.textContent = label;
      b.addEventListener("click", () => { cat = k; renderChips(); renderGrid(); });
      box.appendChild(b);
    };
    mk("all", L("Everyone", "Todos"));
    Object.keys(CATS).forEach((k) => mk(k, CATS[k].emoji + " " + tr(CATS[k])));
  }
  $("#legend-search").addEventListener("input", (e) => { query = e.target.value; renderGrid(); });

  /* ---------- Who am I? quiz ---------- */
  const CLUES = [
    { id: "marichal", en: "I was the first Dominican elected to Cooperstown, in 1983, and I was famous for a high leg kick.", es: "Fui el primer dominicano elegido a Cooperstown, en 1983, y era famoso por mi patada alta." },
    { id: "pedro", en: "I won three Cy Young Awards and helped Boston win the 2004 World Series.", es: "Gané tres premios Cy Young y ayudé a Boston a ganar la Serie Mundial de 2004." },
    { id: "ortiz", en: "They called me Big Papi and I won three World Series with the Red Sox.", es: "Me llamaban Big Papi y gané tres Series Mundiales con los Medias Rojas." },
    { id: "beltre", en: "I collected 3,166 hits and was the fifth Dominican inducted in Cooperstown, in 2024.", es: "Conseguí 3,166 hits y fui el quinto dominicano exaltado en Cooperstown, en 2024." },
    { id: "sosa", en: "In 1998 I hit 66 home runs and chased a record with Mark McGwire.", es: "En 1998 pegué 66 jonrones y perseguí un récord junto a Mark McGwire." },
    { id: "felix", en: "I won the 400 m hurdles at the 2004 Olympics, the first Olympic gold for my country.", es: "Gané los 400 m con vallas en los Juegos de 2004, el primer oro olímpico de mi país." },
    { id: "juanluis", en: "I sing Bachata Rosa and Ojalá que llueva café.", es: "Canto Bachata Rosa y Ojalá que llueva café." },
    { id: "junot", en: "I won a Pulitzer Prize for a novel about a boy called Oscar Wao.", es: "Gané un Pulitzer por una novela sobre un muchacho llamado Óscar Wao." },
    { id: "marileidy", en: "I set an Olympic record of 48.17 seconds in the 400 m in Paris 2024.", es: "Marqué récord olímpico de 48.17 segundos en los 400 m en París 2024." },
    { id: "alfa", en: "They call me El Jefe and I am a leading voice of dembow.", es: "Me llaman El Jefe y soy una voz líder del dembow." }
  ];
  let qs = [], qi = 0, qscore = 0, locked = true;
  const best = () => { try { return Number(localStorage.getItem("dr-best-legends") || 0); } catch (e) { return 0; } };
  $("#wq-best").textContent = best();
  function wqStart() {
    qs = CLUES.slice().sort(() => Math.random() - 0.5).slice(0, 6); qi = 0; qscore = 0;
    $("#wq-start").hidden = true; wqAsk();
  }
  function wqAsk() {
    if (qi >= qs.length) {
      const b = best(); if (qscore > b) { try { localStorage.setItem("dr-best-legends", qscore); } catch (e) { /* ignore */ } $("#wq-best").textContent = qscore; }
      $("#wq-clue").textContent = L(`You got ${qscore} out of ${qs.length}.`, `Acertaste ${qscore} de ${qs.length}.`);
      $("#wq-options").innerHTML = ""; $("#wq-start").hidden = false; $("#wq-start").textContent = L("Play again", "Jugar otra vez"); return;
    }
    locked = false;
    const item = qs[qi];
    $("#wq-n").textContent = qi + 1; $("#wq-score").textContent = qscore;
    $("#wq-clue").textContent = `"${L(item.en, item.es)}"`;
    $("#wq-feedback").textContent = "";
    const right = PEOPLE.find((p) => p.id === item.id);
    const wrong = PEOPLE.filter((p) => p.cat === right.cat || Math.random() < 0.3).filter((p) => p !== right).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [right, ...wrong].sort(() => Math.random() - 0.5);
    const box = $("#wq-options"); box.innerHTML = "";
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "opt"; b.textContent = o.name;
      b.addEventListener("click", () => {
        if (locked) return; locked = true;
        const ok = o === right; if (ok) qscore++;
        $$(".opt", box).forEach((x) => { x.disabled = true; if (x.textContent === right.name) x.classList.add("correct"); });
        if (!ok) b.classList.add("wrong");
        $("#wq-score").textContent = qscore;
        $("#wq-feedback").textContent = ok ? L("Correct!", "¡Correcto!") : L(`It was ${right.name}.`, `Era ${right.name}.`);
        setTimeout(() => { qi++; wqAsk(); }, 1500);
      });
      box.appendChild(b);
    });
  }
  $("#wq-start").addEventListener("click", wqStart);

  document.addEventListener("langchange", () => { renderHof(); renderChips(); renderGrid(); if (current) openModal(current); });
  renderHof(); renderChips(); renderGrid();
})();
