/* ===== Quisqueya: site-wide interactivity ===== */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ }
    }
  };

  /* ---------- Language (English / Español) ---------- */
  window.LANG = store.get("dr-lang", (navigator.language || "en").startsWith("es") ? "es" : "en");
  window.tr = (obj) => (obj && (obj[window.LANG] || obj.en)) || "";

  function applyLang() {
    document.documentElement.lang = window.LANG;
    $$("[data-es]").forEach((el) => {
      if (el.dataset.en === undefined) el.dataset.en = el.innerHTML;
      el.innerHTML = window.LANG === "es" ? el.dataset.es : el.dataset.en;
    });
    $$("[data-es-placeholder]").forEach((el) => {
      if (el.dataset.enPlaceholder === undefined) el.dataset.enPlaceholder = el.placeholder;
      el.placeholder = window.LANG === "es" ? el.dataset.esPlaceholder : el.dataset.enPlaceholder;
    });
    $$("[data-es-alt]").forEach((el) => {
      if (el.dataset.enAlt === undefined) el.dataset.enAlt = el.alt;
      el.alt = window.LANG === "es" ? el.dataset.esAlt : el.dataset.enAlt;
    });
    const btn = $("#lang-toggle");
    if (btn) { btn.textContent = window.LANG === "es" ? "EN" : "ES"; btn.setAttribute("aria-label", window.LANG === "es" ? "Switch to English" : "Cambiar a español"); }
    document.dispatchEvent(new CustomEvent("langchange"));
  }

  /* ---------- Theme (light / dark) ---------- */
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = $("#theme-toggle");
    if (btn) { btn.textContent = theme === "dark" ? "☀" : "☾"; btn.setAttribute("aria-pressed", theme === "dark"); }
  }
  const prefersDark = window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(store.get("dr-theme", prefersDark ? "dark" : "light"));

  document.addEventListener("DOMContentLoaded", () => {
    $("#theme-toggle")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      store.set("dr-theme", next);
      applyTheme(next);
    });
    $("#lang-toggle")?.addEventListener("click", () => {
      window.LANG = window.LANG === "es" ? "en" : "es";
      store.set("dr-lang", window.LANG);
      applyLang();
    });
    applyTheme(document.documentElement.dataset.theme);

    /* ---------- Nav: current page + mobile menu ---------- */
    const here = location.pathname.split("/").pop() || "index.html";
    $$(".nav a").forEach((a) => { if (a.getAttribute("href") === here) a.setAttribute("aria-current", "page"); });
    const toggle = $(".nav-toggle"), nav = $("#nav");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open);
    });

    initReveal();
    initCounters();
    initFactBox();
    initPlaces();
    initTimeline();
    initGlossary();
    initTrueFalse();
    applyLang();
  });

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach((e) => io.observe(e));
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    const nums = $$("[data-count]");
    if (!nums.length) return;
    const run = (el) => {
      const end = Number(el.dataset.count), dur = 1200, t0 = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }

  /* ---------- Random fact button ---------- */
  function initFactBox() {
    const text = $("#fact-text"), btn = $("#fact-btn");
    if (!text || !btn) return;
    let i = Math.floor(Math.random() * FACTS.length);
    const show = () => { text.textContent = tr(FACTS[i]); };
    btn.addEventListener("click", () => {
      let n; do { n = Math.floor(Math.random() * FACTS.length); } while (n === i);
      i = n; show();
    });
    document.addEventListener("langchange", show);
    show();
  }

  /* ---------- Places: filter, search, modal, map ---------- */
  function initPlaces() {
    const grid = $("#places-grid");
    const mapSvg = $("#places-map");
    if (!grid && !mapSvg) return;
    let cat = "all", query = "";
    const catNames = { beach: { en: "Beach", es: "Playa" }, city: { en: "City", es: "Ciudad" }, nature: { en: "Nature", es: "Naturaleza" }, history: { en: "History", es: "Historia" } };

    function renderGrid() {
      if (!grid) return;
      const q = query.trim().toLowerCase();
      const list = PLACES.filter((p) => (cat === "all" || p.cat === cat) &&
        (!q || (tr(p.name) + " " + tr(p.short) + " " + tr(p.where)).toLowerCase().includes(q)));
      grid.innerHTML = "";
      if (!list.length) {
        grid.innerHTML = `<p class="empty">${tr({ en: "No places match your search.", es: "Ningún lugar coincide con tu búsqueda." })}</p>`;
        return;
      }
      list.forEach((p) => {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = `<img src="images/${p.img}.jpg" alt="${tr(p.name)}" loading="lazy">
          <div class="card-body"><span class="tag ${p.cat}">${tr(catNames[p.cat])}</span>
          <h3>${tr(p.name)}</h3><p>${tr(p.short)}</p>
          <button class="btn small alt" type="button">${tr({ en: "Learn more", es: "Ver más" })}</button></div>`;
        $("button", card).addEventListener("click", () => openModal(p));
        grid.appendChild(card);
      });
    }

    function openModal(p) {
      const back = $("#modal");
      $("#modal-img").src = `images/${p.img}.jpg`;
      $("#modal-img").alt = tr(p.name);
      $("#modal-tag").className = "tag " + p.cat;
      $("#modal-tag").textContent = tr(catNames[p.cat]);
      $("#modal-title").textContent = tr(p.name);
      $("#modal-text").textContent = tr(p.long);
      $("#modal-where").textContent = tr(p.where);
      $("#modal-best").textContent = tr(p.best);
      const links = $("#modal-links"); links.innerHTML = "";
      placeLinks(p).forEach((l) => {
        const a = document.createElement("a");
        a.href = l.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.className = "btn small " + (l.kind === "book" ? "" : l.kind === "official" ? "alt" : "ghost");
        a.textContent = l.label + " ↗";
        links.appendChild(a);
      });
      back.classList.add("open");
      $("#modal-close").focus();
      back.dataset.current = p.id;
    }
    function closeModal() { $("#modal")?.classList.remove("open"); }
    $("#modal-close")?.addEventListener("click", closeModal);
    $("#modal")?.addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

    $$(".chip[data-cat]").forEach((chip) => chip.addEventListener("click", () => {
      cat = chip.dataset.cat;
      $$(".chip[data-cat]").forEach((c) => c.setAttribute("aria-pressed", c === chip));
      renderGrid();
    }));
    $("#place-search")?.addEventListener("input", (e) => { query = e.target.value; renderGrid(); });

    // Island map with clickable pins
    if (mapSvg) {
      const pts = MAP.outline.map(([lo, la]) => { const p = MAP.project(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
      let pins = "";
      PLACES.forEach((p) => {
        const { x, y } = MAP.project(p.lon, p.lat);
        pins += `<g class="pin" tabindex="0" role="button" data-id="${p.id}" aria-label="${tr(p.name)}">
          <circle cx="${x}" cy="${y}" r="10"></circle>
          <text x="${x > 680 ? x - 16 : x + 16}" y="${y + 5}" text-anchor="${x > 680 ? "end" : "start"}">${tr(p.name).split(",")[0]}</text></g>`;
      });
      mapSvg.innerHTML = `<rect class="sea" width="${MAP.w}" height="${MAP.h}" rx="12"></rect>
        <polygon class="land" points="${pts}"></polygon>${pins}`;
      const open = (g) => { const p = PLACES.find((x) => x.id === g.dataset.id); if (p) openModal(p); };
      $$(".pin", mapSvg).forEach((g) => {
        g.addEventListener("click", () => open(g));
        g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(g); } });
      });
    }

    document.addEventListener("langchange", () => {
      renderGrid();
      if (mapSvg) { $$(".pin", mapSvg).forEach((g) => { const p = PLACES.find((x) => x.id === g.dataset.id); g.setAttribute("aria-label", tr(p.name)); $("text", g).textContent = tr(p.name).split(",")[0]; }); }
      const back = $("#modal");
      if (back?.classList.contains("open")) openModal(PLACES.find((x) => x.id === back.dataset.current));
    });
    renderGrid();
  }

  /* ---------- Timeline slider ---------- */
  function initTimeline() {
    const range = $("#time-range");
    if (!range) return;
    const year = $("#time-year"), text = $("#time-text");
    range.max = TIMELINE.length - 1;
    const show = () => {
      const ev = TIMELINE[Number(range.value)];
      year.textContent = ev.year;
      text.textContent = tr(ev.t);
    };
    range.addEventListener("input", show);
    document.addEventListener("langchange", show);
    show();
  }

  /* ---------- Slang glossary accordion ---------- */
  function initGlossary() {
    const box = $("#glossary");
    if (!box) return;
    const render = () => {
      box.innerHTML = "";
      SLANG.forEach((s, i) => {
        const item = document.createElement("div");
        item.className = "acc-item";
        item.innerHTML = `<button type="button" aria-expanded="false" aria-controls="gl-${i}">${s.w}</button>
          <div class="acc-panel" id="gl-${i}">${tr(s.m)}</div>`;
        const b = $("button", item), panel = $(".acc-panel", item);
        b.addEventListener("click", () => {
          const open = panel.classList.toggle("open");
          b.setAttribute("aria-expanded", open);
        });
        box.appendChild(item);
      });
    };
    document.addEventListener("langchange", render);
    render();
  }

  /* ---------- True / False fact check ---------- */
  function initTrueFalse() {
    const q = $("#tf-question");
    if (!q) return;
    const res = $("#tf-result"), score = $("#tf-score");
    let order = [], idx = 0, right = 0, answered = false;
    const shuffle = () => { order = TRUE_FALSE.map((_, i) => i).sort(() => Math.random() - 0.5); idx = 0; right = 0; };
    const show = () => {
      const item = TRUE_FALSE[order[idx]];
      q.textContent = tr(item.q);
      answered = false;
      score.textContent = `${right} / ${TRUE_FALSE.length}`;
    };
    const answer = (val) => {
      if (answered) return;
      answered = true;
      const item = TRUE_FALSE[order[idx]];
      const ok = item.a === val;
      if (ok) right++;
      res.className = "tf-result " + (ok ? "good" : "bad");
      res.textContent = (ok ? tr({ en: "Correct! ", es: "¡Correcto! " }) : tr({ en: "Not quite. ", es: "No exactamente. " })) + tr(item.why);
      score.textContent = `${right} / ${TRUE_FALSE.length}`;
      setTimeout(() => {
        idx++;
        if (idx >= order.length) {
          q.textContent = tr({ en: `You got ${right} of ${TRUE_FALSE.length}. Play again?`, es: `Acertaste ${right} de ${TRUE_FALSE.length}. ¿Jugar de nuevo?` });
          res.textContent = "";
          answered = true;
          setTimeout(() => { shuffle(); show(); res.textContent = ""; }, 3200);
        } else { show(); res.textContent = ""; }
      }, 1700);
    };
    $("#tf-true").addEventListener("click", () => answer(true));
    $("#tf-false").addEventListener("click", () => answer(false));
    document.addEventListener("langchange", () => { if (!answered) show(); });
    shuffle(); show();
  }
})();
