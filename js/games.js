/* ===== Quisqueya games: rhythm, map challenge, slang quiz, dominoes ===== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    }
  };
  const L = (en, es) => tr({ en, es });
  window.GameSound = window.GameSound || { on: true };

  /* ---------- Tabs ---------- */
  function showGame(name) {
    $$(".game-panel").forEach((p) => p.classList.toggle("active", p.id === "game-" + name));
    $$(".chip[data-game]").forEach((c) => c.setAttribute("aria-pressed", c.dataset.game === name));
    if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
    if (name === "map" && window.MapGame) window.MapGame.show();
  }
  $$(".chip[data-game]").forEach((c) => c.addEventListener("click", () => { window.RhythmGame && window.RhythmGame.stop(); showGame(c.dataset.game); }));
  $("#sound-toggle").addEventListener("click", (e) => {
    window.GameSound.on = !window.GameSound.on;
    e.currentTarget.setAttribute("aria-pressed", window.GameSound.on);
  });
  const initial = location.hash.slice(1);
  if (["rhythm", "map", "slang", "dominoes"].includes(initial)) showGame(initial);

  /* =====================================================
     3. SLANG QUIZ
     ===================================================== */
  (function () {
    const TIME = 10;
    let order = [], qi = 0, score = 0, streak = 0, bestStreak = 0, locked = true, timer = 0, t0 = 0, correct = 0;
    let best = Number(store.get("dr-best-slang", 0));
    $("#s-best").textContent = best;

    function start() {
      order = SLANG.slice().sort(() => Math.random() - 0.5).slice(0, 10);
      qi = 0; score = 0; streak = 0; bestStreak = 0; correct = 0;
      $("#s-start").hidden = true; $("#s-share").hidden = true;
      ask();
    }
    function ask() {
      if (qi >= order.length) { finish(); return; }
      locked = false;
      const item = order[qi];
      $("#s-q").textContent = qi + 1; $("#s-score").textContent = score; $("#s-streak").textContent = streak;
      $("#s-word").innerHTML = `${item.w}<small>${L("What does it mean?", "¿Qué significa?")}</small>`;
      $("#s-feedback").textContent = "";
      const wrong = SLANG.filter((s) => s !== item).sort(() => Math.random() - 0.5).slice(0, 3);
      const opts = [item, ...wrong].sort(() => Math.random() - 0.5);
      const box = $("#s-options"); box.innerHTML = "";
      opts.forEach((o) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt"; b.textContent = tr(o.m);
        b.addEventListener("click", () => choose(b, o === item, item));
        box.appendChild(b);
      });
      t0 = performance.now();
      cancelAnimationFrame(timer);
      const tick = () => {
        const left = Math.max(0, 1 - (performance.now() - t0) / (TIME * 1000));
        $("#s-timer").style.transform = `scaleX(${left})`;
        $("#s-timer").style.background = left < 0.3 ? "var(--red)" : "var(--green)";
        if (left <= 0 && !locked) { choose(null, false, item); return; }
        if (!locked) timer = requestAnimationFrame(tick);
      };
      timer = requestAnimationFrame(tick);
    }
    function choose(btn, ok, item) {
      if (locked) return;
      locked = true; cancelAnimationFrame(timer);
      const left = Math.max(0, TIME - (performance.now() - t0) / 1000);
      $$(".opt", $("#s-options")).forEach((b) => {
        b.disabled = true;
        if (b.textContent === tr(item.m)) b.classList.add("correct");
      });
      if (ok) {
        streak++; correct++; bestStreak = Math.max(bestStreak, streak);
        const pts = 10 + Math.round(left) + Math.min(streak, 5) * 2;
        score += pts;
        $("#s-feedback").textContent = L(`Correct! +${pts}`, `¡Correcto! +${pts}`);
      } else {
        streak = 0;
        if (btn) btn.classList.add("wrong");
        $("#s-feedback").textContent = btn ? L("Not quite. That was not it.", "Casi. Esa no era.") : L("Time is up.", "Se acabó el tiempo.");
      }
      $("#s-score").textContent = score; $("#s-streak").textContent = streak;
      setTimeout(() => { qi++; ask(); }, 1300);
    }
    function finish() {
      locked = true;
      if (score > best) { best = score; store.set("dr-best-slang", best); $("#s-best").textContent = best; }
      $("#s-word").innerHTML = `${L("All done!", "¡Terminaste!")}<small>${correct}/10 · ${L("best streak", "racha máxima")} ${bestStreak} · ${score}</small>`;
      $("#s-options").innerHTML = "";
      $("#s-timer").style.transform = "scaleX(0)";
      $("#s-start").hidden = false; $("#s-start").textContent = window.LANG === "es" ? "Jugar otra vez" : "Play again";
      $("#s-share").hidden = false;
    }
    $("#s-start").addEventListener("click", start);
    $("#s-share").addEventListener("click", async (e) => {
      const msg = window.LANG === "es"
        ? `Saqué ${score} puntos y ${correct}/10 en el Quiz de Jerga Dominicana de Quisqueya.`
        : `I scored ${score} points and ${correct}/10 on the Dominican Slang Quiz at Quisqueya.`;
      try { await navigator.clipboard.writeText(msg); e.target.textContent = window.LANG === "es" ? "¡Copiado!" : "Copied!"; }
      catch (err) { e.target.textContent = msg; }
    });
  })();

})();
