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
  let soundOn = true;

  /* ---------- Tabs ---------- */
  function showGame(name) {
    $$(".game-panel").forEach((p) => p.classList.toggle("active", p.id === "game-" + name));
    $$(".chip[data-game]").forEach((c) => c.setAttribute("aria-pressed", c.dataset.game === name));
    if (location.hash.slice(1) !== name) history.replaceState(null, "", "#" + name);
  }
  $$(".chip[data-game]").forEach((c) => c.addEventListener("click", () => { RhythmGame.stop(); showGame(c.dataset.game); }));
  $("#sound-toggle").addEventListener("click", (e) => {
    soundOn = !soundOn;
    e.currentTarget.setAttribute("aria-pressed", soundOn);
  });
  const initial = location.hash.slice(1);
  if (["rhythm", "map", "slang", "dominoes"].includes(initial)) showGame(initial);

  /* =====================================================
     1. MERENGUE RHYTHM
     ===================================================== */
  const RhythmGame = (function () {
    const canvas = $("#rhythm-canvas"), ctx2d = canvas.getContext("2d");
    const W = 560, H = 600, HIT_Y = 500, TRAVEL = 1.8, STEP = 0.25, LANES = 4;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr; ctx2d.scale(dpr, dpr);
    const colors = ["#6ea0ff", "#ff5a6b", "#4fc98a", "#e8a317"];
    const names = ["Tambora", "Güira", "Conga", "Acordeón"];
    const keys = ["d", "f", "j", "k"];
    const scale = [293.66, 329.63, 369.99, 440, 493.88, 587.33];
    let audio = null, notes = [], startAt = 0, running = false, raf = 0;
    let score = 0, combo = 0, best = Number(store.get("dr-best-rhythm", 0)), flash = [0, 0, 0, 0], judgeTimer = 0;
    $("#r-best").textContent = best;

    function ensureAudio() {
      if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; } }
      if (audio && audio.state === "suspended") audio.resume();
      return audio;
    }
    function noiseBurst(t, dur, gain, hp) {
      const len = Math.max(1, Math.floor(audio.sampleRate * dur));
      const buf = audio.createBuffer(1, len, audio.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = audio.createBufferSource(); src.buffer = buf;
      const f = audio.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
      const g = audio.createGain(); g.gain.value = gain;
      src.connect(f); f.connect(g); g.connect(audio.destination); src.start(t);
    }
    function tone(t, type, f0, f1, dur, gain, lp) {
      const o = audio.createOscillator(), g = audio.createGain(), flt = audio.createBiquadFilter();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      flt.type = "lowpass"; flt.frequency.value = lp || 4000;
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(flt); flt.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + dur + 0.02);
    }
    function play(lane, t, loud, idx) {
      if (!audio || !soundOn) return;
      const v = loud ? 1 : 0.35;
      if (lane === 0) tone(t, "sine", 140, 60, 0.22, 0.6 * v, 600);
      else if (lane === 1) noiseBurst(t, 0.09, 0.35 * v, 5000);
      else if (lane === 2) tone(t, "triangle", 260, 170, 0.14, 0.45 * v, 1500);
      else tone(t, "sawtooth", scale[(idx || 0) % scale.length], 0, 0.22, 0.18 * v, 1800);
    }

    function buildChart() {
      const out = [];
      const measures = 24;
      for (let m = 0; m < measures; m++) {
        const base = m * 8;
        const add = (s, lane) => out.push({ step: base + s, lane, hit: false, missed: false, idx: (m + s) % 6 });
        add(0, 0); add(4, 0);
        if (m > 1) { [1, 3, 5, 7].forEach((s) => { if (m < 4 || Math.random() < 0.75) add(s, 1); }); }
        if (m > 3 && Math.random() < 0.8) add(6, 2);
        if (m > 5 && Math.random() < 0.7) add(2, 2);
        if (m > 7) { const s = [0, 2, 4, 6][Math.floor(Math.random() * 4)]; if (Math.random() < 0.6) add(s === 0 || s === 4 ? s + 1 : s, 3); }
        if (m > 14 && Math.random() < 0.5) add(7, 3);
      }
      // unique per step/lane
      const seen = new Set();
      return out.filter((n) => { const k = n.step + ":" + n.lane; if (seen.has(k)) return false; seen.add(k); return true; })
        .sort((a, b) => a.step - b.step);
    }

    function start() {
      if (!ensureAudio()) { /* silent mode still works */ }
      stop();
      notes = buildChart();
      score = 0; combo = 0; flash = [0, 0, 0, 0];
      updateHud();
      startAt = clock() + 0.4;
      // pre-schedule a quiet backing groove
      if (audio && soundOn) {
        const total = 24 * 8;
        for (let s = 0; s < total; s++) {
          const t = audio.currentTime + 0.4 + TRAVEL + s * STEP;
          if (s % 8 === 0 || s % 8 === 4) play(0, t, false);
          if (s % 2 === 1) play(1, t, false);
        }
      }
      running = true;
      $("#r-start").textContent = window.LANG === "es" ? "Reiniciar" : "Restart";
      $("#r-judge").textContent = "";
      loop();
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function clock() { return performance.now() / 1000; }
    const noteTime = (n) => startAt + TRAVEL + n.step * STEP;

    function press(lane) {
      if (!running) return;
      flash[lane] = 1;
      const now = clock();
      let target = null, bestD = 1;
      for (const n of notes) {
        if (n.lane !== lane || n.hit || n.missed) continue;
        const d = Math.abs(noteTime(n) - now);
        if (d < bestD) { bestD = d; target = n; }
      }
      if (target && bestD <= 0.16) {
        target.hit = true;
        const pts = bestD < 0.06 ? 100 : bestD < 0.11 ? 60 : 30;
        combo++;
        score += pts + Math.min(combo, 20) * 2;
        showJudge(pts === 100 ? L("¡Perfecto!", "¡Perfecto!") : pts === 60 ? L("Bien", "Bien") : L("Casi", "Casi"), pts === 100 ? "#4fc98a" : pts === 60 ? "#e8a317" : "#aeb8d0");
        play(lane, audio ? audio.currentTime : 0, true, target.idx);
      } else {
        combo = 0;
        showJudge(L("Fuera de ritmo", "Fuera de ritmo"), "#ff5a6b");
        play(lane, audio ? audio.currentTime : 0, true, 0);
      }
      updateHud();
    }
    function showJudge(text, color) {
      const j = $("#r-judge"); j.textContent = text; j.style.color = color;
      clearTimeout(judgeTimer); judgeTimer = setTimeout(() => { j.textContent = ""; }, 500);
    }
    function updateHud() {
      $("#r-score").textContent = score; $("#r-combo").textContent = combo;
    }

    function finish() {
      stop();
      if (score > best) { best = score; store.set("dr-best-rhythm", best); $("#r-best").textContent = best; }
      const hits = notes.filter((n) => n.hit).length;
      draw(true, L(`¡Terminó! ${hits}/${notes.length} notas`, `¡Terminó! ${hits}/${notes.length} notas`));
      $("#r-start").textContent = window.LANG === "es" ? "Jugar otra vez" : "Play again";
    }

    function loop() {
      if (!running) return;
      const now = clock();
      notes.forEach((n) => { if (!n.hit && !n.missed && now - noteTime(n) > 0.16) { n.missed = true; combo = 0; updateHud(); } });
      draw(false);
      const last = notes[notes.length - 1];
      if (last && now - noteTime(last) > 1) { finish(); return; }
      raf = requestAnimationFrame(loop);
    }

    function draw(done, msg) {
      const c = ctx2d, now = clock();
      c.clearRect(0, 0, W, H);
      const lw = W / LANES;
      for (let i = 0; i < LANES; i++) {
        c.fillStyle = i % 2 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)";
        c.fillRect(i * lw, 0, lw, H);
        if (flash[i] > 0) { c.fillStyle = colors[i] + "55"; c.fillRect(i * lw, HIT_Y - 60, lw, 120); flash[i] = Math.max(0, flash[i] - 0.08); }
      }
      c.fillStyle = "#fff"; c.fillRect(0, HIT_Y - 2, W, 4);
      c.font = "700 14px system-ui, sans-serif"; c.textAlign = "center";
      for (let i = 0; i < LANES; i++) {
        c.fillStyle = colors[i];
        c.beginPath(); c.arc(i * lw + lw / 2, HIT_Y, 26, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = colors[i]; c.stroke();
        c.fillStyle = "#fff"; c.fillText(keys[i].toUpperCase(), i * lw + lw / 2, HIT_Y + 5);
        c.fillStyle = "#c9d4ee"; c.fillText(names[i], i * lw + lw / 2, H - 18);
      }
      if (!done) {
        notes.forEach((n) => {
          if (n.hit) return;
          const t = noteTime(n) - now, y = HIT_Y - (t / TRAVEL) * HIT_Y;
          if (y < -30 || y > H + 30) return;
          c.globalAlpha = n.missed ? 0.25 : 1;
          c.fillStyle = colors[n.lane];
          c.beginPath(); c.arc(n.lane * lw + lw / 2, y, 22, 0, Math.PI * 2); c.fill();
          c.strokeStyle = "#fff"; c.lineWidth = 3; c.stroke();
          c.globalAlpha = 1;
        });
      } else {
        c.fillStyle = "rgba(11,29,68,0.85)"; c.fillRect(0, 200, W, 180);
        c.fillStyle = "#fff"; c.font = "800 28px Georgia, serif"; c.fillText(msg, W / 2, 270);
        c.font = "700 22px system-ui, sans-serif"; c.fillText((window.LANG === "es" ? "Puntos: " : "Score: ") + score, W / 2, 320);
      }
    }

    // Controls
    document.addEventListener("keydown", (e) => {
      if (!$("#game-rhythm").classList.contains("active")) return;
      const i = keys.indexOf(e.key.toLowerCase());
      if (i >= 0 && !e.repeat) { e.preventDefault(); press(i); }
    });
    canvas.addEventListener("pointerdown", (e) => {
      const r = canvas.getBoundingClientRect();
      press(Math.min(LANES - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * LANES))));
    });
    $("#r-start").addEventListener("click", start);
    draw(true, L("Listo para bailar", "Listo para bailar"));
    return { stop };
  })();

  /* =====================================================
     2. MAP CHALLENGE
     ===================================================== */
  (function () {
    const svg = $("#challenge-svg");
    const pts = MAP.outline.map(([lo, la]) => { const p = MAP.project(lo, la); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
    svg.innerHTML = `<rect class="sea" width="${MAP.w}" height="${MAP.h}" rx="12"></rect><polygon class="land" points="${pts}"></polygon><g id="m-layer"></g>`;
    const layer = $("#m-layer", svg);
    let queue = [], round = 0, score = 0, current = null, answered = true, playing = false;
    let best = Number(store.get("dr-best-map", 0));
    $("#m-best").textContent = best;

    function next() {
      if (!playing) { queue = CITIES.slice().sort(() => Math.random() - 0.5).slice(0, 10); round = 0; score = 0; playing = true; }
      if (round >= 10) { end(); return; }
      layer.innerHTML = ""; answered = false;
      current = queue[round++];
      $("#m-round").textContent = round; $("#m-score").textContent = score;
      $("#m-target").textContent = current.n;
      $("#m-feedback").textContent = "";
      $("#m-next").hidden = true;
    }
    function end() {
      playing = false;
      if (score > best) { best = score; store.set("dr-best-map", best); $("#m-best").textContent = best; }
      $("#m-target").textContent = "—";
      $("#m-feedback").textContent = L(`Terminaste con ${score} de 1000 puntos.`, `Terminaste con ${score} de 1000 puntos.`);
      $("#m-next").hidden = false;
      $("#m-next").textContent = window.LANG === "es" ? "Jugar otra vez" : "Play again";
    }
    svg.addEventListener("click", (e) => {
      if (answered || !playing) return;
      answered = true;
      const r = svg.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * MAP.w, y = ((e.clientY - r.top) / r.height) * MAP.h;
      const guess = MAP.unproject(x, y);
      const km = MAP.km(guess, current);
      const pts = Math.max(0, Math.round(100 * (1 - km / 150)));
      score += pts;
      const t = MAP.project(current.lon, current.lat);
      layer.innerHTML = `<line x1="${x}" y1="${y}" x2="${t.x}" y2="${t.y}" stroke="#ce1126" stroke-width="3" stroke-dasharray="8 6"></line>
        <circle cx="${x}" cy="${y}" r="9" fill="#0b3c8c" stroke="#fff" stroke-width="3"></circle>
        <circle cx="${t.x}" cy="${t.y}" r="11" fill="#1e7b4f" stroke="#fff" stroke-width="3"></circle>`;
      $("#m-score").textContent = score;
      $("#m-feedback").textContent = window.LANG === "es"
        ? `${current.n}: a ${Math.round(km)} km. +${pts} puntos`
        : `${current.n}: ${Math.round(km)} km away. +${pts} points`;
      $("#m-next").hidden = false;
      $("#m-next").textContent = round >= 10 ? (window.LANG === "es" ? "Ver resultado" : "See result") : (window.LANG === "es" ? "Siguiente" : "Next");
    });
    $("#m-next").addEventListener("click", () => {
      if (answered && playing && round >= 10) { end(); return; }
      next();
    });
  })();

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
      $("#s-word").innerHTML = `${item.w}<small>${L("¿Qué significa?", "¿Qué significa?")}</small>`;
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
        $("#s-feedback").textContent = L(`¡Correcto! +${pts}`, `¡Correcto! +${pts}`);
      } else {
        streak = 0;
        if (btn) btn.classList.add("wrong");
        $("#s-feedback").textContent = btn ? L("Casi. Esa no era.", "Casi. Esa no era.") : L("Se acabó el tiempo.", "Se acabó el tiempo.");
      }
      $("#s-score").textContent = score; $("#s-streak").textContent = streak;
      setTimeout(() => { qi++; ask(); }, 1300);
    }
    function finish() {
      locked = true;
      if (score > best) { best = score; store.set("dr-best-slang", best); $("#s-best").textContent = best; }
      $("#s-word").innerHTML = `${L("¡Terminaste!", "¡Terminaste!")}<small>${correct}/10 · ${L("racha máxima", "racha máxima")} ${bestStreak} · ${score}</small>`;
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

  /* =====================================================
     4. DOMINOES (you vs the computer)
     ===================================================== */
  (function () {
    const PIPS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    let yard, mine, theirs, board, turn, over, picked, passes;
    let wins = Number(store.get("dr-dom-wins", 0)), losses = Number(store.get("dr-dom-losses", 0));
    const status = (en, es) => { $("#d-status").textContent = L(en, es); };
    $("#d-wins").textContent = wins; $("#d-losses").textContent = losses;

    function tileEl(t, cls) {
      const el = document.createElement("div");
      el.className = "tile " + (cls || "");
      [t.a, t.b].forEach((v) => {
        const h = document.createElement("div"); h.className = "half";
        for (let i = 0; i < 9; i++) {
          const cell = document.createElement("span");
          if (PIPS[v].includes(i)) cell.className = "pip";
          h.appendChild(cell);
        }
        el.appendChild(h);
      });
      return el;
    }
    const ends = () => ({ l: board[0].a, r: board[board.length - 1].b });
    const fits = (t) => { if (!board.length) return true; const e = ends(); return t.a === e.l || t.b === e.l || t.a === e.r || t.b === e.r; };
    const pipSum = (h) => h.reduce((s, t) => s + t.a + t.b, 0);

    function newGame() {
      const all = [];
      for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push({ a, b });
      all.sort(() => Math.random() - 0.5);
      mine = all.splice(0, 7); theirs = all.splice(0, 7); yard = all;
      board = []; over = false; picked = null; passes = 0;
      // highest double starts, otherwise highest tile
      const key = (t) => (t.a === t.b ? 100 + t.a : t.a + t.b);
      const mTop = mine.reduce((m, t) => (key(t) > key(m) ? t : m)), tTop = theirs.reduce((m, t) => (key(t) > key(m) ? t : m));
      if (key(mTop) >= key(tTop)) {
        mine.splice(mine.indexOf(mTop), 1); board.push({ a: mTop.a, b: mTop.b });
        status("You start with your highest tile. Rival's turn.", "Empiezas con tu ficha más alta. Turno del rival.");
        turn = "cpu"; render(); setTimeout(cpuTurn, 900);
      } else {
        theirs.splice(theirs.indexOf(tTop), 1); board.push({ a: tTop.a, b: tTop.b });
        turn = "me"; render();
        status("Your turn. Pick a glowing tile.", "Tu turno. Elige una ficha resaltada.");
      }
    }

    function render() {
      $("#d-yard").textContent = yard.length;
      const b = $("#d-board"); b.innerHTML = "";
      board.forEach((t) => b.appendChild(tileEl(t)));
      const opp = $("#d-opp"); opp.innerHTML = "";
      theirs.forEach(() => opp.appendChild(tileEl({ a: 0, b: 0 }, "back")));
      const hand = $("#d-hand"); hand.innerHTML = "";
      mine.forEach((t) => {
        const ok = turn === "me" && !over && fits(t);
        const el = tileEl(t, "hand" + (ok ? " playable" : "") + (picked === t ? " picked" : ""));
        el.setAttribute("role", "button"); el.tabIndex = 0;
        el.setAttribute("aria-label", `${t.a}-${t.b}`);
        const go = () => selectTile(t);
        el.addEventListener("click", go);
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
        hand.appendChild(el);
      });
      const canPlay = mine.some(fits);
      $("#d-draw").disabled = !(turn === "me" && !over && !canPlay && yard.length > 0);
      $("#d-pass").disabled = !(turn === "me" && !over && !canPlay && yard.length === 0);
      $("#d-pick").hidden = true;
    }

    function place(t, side) {
      const e = ends();
      if (side === "l") board.unshift(t.b === e.l ? { a: t.a, b: t.b } : { a: t.b, b: t.a });
      else board.push(t.a === e.r ? { a: t.a, b: t.b } : { a: t.b, b: t.a });
    }
    function sides(t) {
      const e = ends(), r = [];
      if (t.a === e.l || t.b === e.l) r.push("l");
      if (t.a === e.r || t.b === e.r) r.push("r");
      return r;
    }
    function selectTile(t) {
      if (turn !== "me" || over || !fits(t)) return;
      const s = sides(t), e = ends();
      if (s.length === 1 || e.l === e.r) { playMine(t, s[0]); return; }
      picked = t; render();
      $("#d-pick").hidden = false;
      status("Which end?", "¿En qué extremo?");
      $("#d-left").onclick = () => playMine(t, "l");
      $("#d-right").onclick = () => playMine(t, "r");
    }
    function playMine(t, side) {
      mine.splice(mine.indexOf(t), 1); place(t, side); picked = null; passes = 0;
      if (!mine.length) { return finish("me"); }
      turn = "cpu"; render();
      status("Rival is thinking...", "El rival está pensando...");
      setTimeout(cpuTurn, 900);
    }

    function cpuTurn() {
      if (over) return;
      while (!theirs.some(fits) && yard.length) theirs.push(yard.pop());
      const options = theirs.filter(fits);
      if (!options.length) {
        passes++;
        status("Rival passes. Your turn.", "El rival pasa. Es tu turno.");
        turn = "me"; render();
        if (passes >= 2 || (!mine.some(fits) && !yard.length)) { if (passes >= 2) return blocked(); }
        return;
      }
      options.sort((x, y) => (y.a + y.b + (y.a === y.b ? 3 : 0)) - (x.a + x.b + (x.a === x.b ? 3 : 0)));
      const t = options[0], s = sides(t);
      theirs.splice(theirs.indexOf(t), 1); place(t, s[Math.floor(Math.random() * s.length)]); passes = 0;
      if (!theirs.length) return finish("cpu");
      turn = "me"; render();
      status(mine.some(fits) ? "Your turn." : (yard.length ? "No match. Draw from the boneyard." : "No match. You must pass."),
        mine.some(fits) ? "Tu turno." : (yard.length ? "No tienes. Roba del pozo." : "No tienes. Debes pasar."));
    }

    function blocked() {
      const m = pipSum(mine), c = pipSum(theirs);
      finish(m < c ? "me" : c < m ? "cpu" : "tie", true);
    }
    function finish(who, wasBlocked) {
      over = true; turn = "none"; render();
      if (who === "me") { wins++; store.set("dr-dom-wins", wins); }
      if (who === "cpu") { losses++; store.set("dr-dom-losses", losses); }
      $("#d-wins").textContent = wins; $("#d-losses").textContent = losses;
      const lock = wasBlocked ? " (tranque)" : "";
      if (who === "me") status("You win!" + (wasBlocked ? " (locked game, lowest total)" : ""), "¡Ganaste!" + lock);
      else if (who === "cpu") status("Rival wins." + (wasBlocked ? " (locked game, lowest total)" : ""), "Gana el rival." + lock);
      else status("Draw. Same pip total.", "Empate. Mismos puntos.");
    }

    $("#d-new").addEventListener("click", newGame);
    $("#d-draw").addEventListener("click", () => {
      if (turn !== "me" || !yard.length) return;
      mine.push(yard.pop()); render();
      if (!mine.some(fits) && !yard.length) status("No match. You must pass.", "No tienes. Debes pasar.");
      else if (mine.some(fits)) status("Your turn.", "Tu turno.");
    });
    $("#d-pass").addEventListener("click", () => {
      if (turn !== "me") return;
      passes++;
      if (passes >= 2) return blocked();
      turn = "cpu"; render();
      status("You pass. Rival's turn.", "Pasas. Turno del rival.");
      setTimeout(cpuTurn, 900);
    });
    newGame();
  })();
})();
