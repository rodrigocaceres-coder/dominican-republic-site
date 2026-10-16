/* ===== Merengue Rhythm =====
   A full merengue band (tambora, güira, bass, accordion and sax hits) is synthesized live in the browser
   and plays by itself. You tap along on top of it. Three difficulty levels. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const L = (en, es) => tr({ en, es });
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  const canvas = $("#rhythm-canvas");
  if (!canvas) return;
  window.GameSound = window.GameSound || { on: true };

  const W = 560, H = 600, HIT_Y = 500;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const g2 = canvas.getContext("2d"); g2.scale(dpr, dpr);

  /* ---------- Difficulty settings ---------- */
  const LANE_INFO = {
    tambora: { en: "Tambora", es: "Tambora", color: "#6ea0ff" },
    guira: { en: "Güira", es: "Güira", color: "#ff5a6b" },
    bass: { en: "Bass", es: "Bajo", color: "#4fc98a" },
    accordion: { en: "Accordion", es: "Acordeón", color: "#e8a317" }
  };
  const LEVELS = {
    easy: { bpm: 100, bars: 20, lanes: ["tambora", "accordion"], keys: ["f", "j"], win: [0.12, 0.2, 0.32], forgiving: true },
    medium: { bpm: 114, bars: 24, lanes: ["tambora", "guira", "accordion"], keys: ["d", "f", "j"], win: [0.09, 0.15, 0.23], forgiving: false },
    hard: { bpm: 128, bars: 28, lanes: ["tambora", "guira", "bass", "accordion"], keys: ["d", "f", "j", "k"], win: [0.07, 0.12, 0.17], forgiving: false }
  };
  let level = store.get("dr-rhythm-level", "easy");
  if (!LEVELS[level]) level = "easy";
  let cfg = LEVELS[level];

  /* ---------- Music theory: key of C, 8 bar loop ---------- */
  const CHORDS = [
    { root: 48, name: "C" }, { root: 48, name: "C" }, { root: 43, name: "G" }, { root: 43, name: "G" },
    { root: 41, name: "F" }, { root: 41, name: "F" }, { root: 43, name: "G" }, { root: 48, name: "C" }
  ];
  const MAJOR = [0, 4, 7];
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const chordAt = (bar) => CHORDS[bar % CHORDS.length];
  const RIFFS = [[0, 1, 2, 1, 0, 1, 2, 3], [2, 3, 2, 1, 2, 1, 0, null], [0, 1, 2, 1, 0, 1, 2, 3], [3, 2, 1, 0, 1, 2, 3, 3]];

  /* ---------- Audio engine ---------- */
  let ctx = null, master = null, wet = null, comp = null, conv = null;
  function ensureAudio() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.connect(ctx.destination);
      conv = ctx.createConvolver(); const len = Math.floor(ctx.sampleRate * 0.9), imp = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = imp.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5); }
      conv.buffer = imp; wet = ctx.createGain(); wet.gain.value = 0.22; wet.connect(conv);
      newBus();
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }
  // A fresh output bus per run, so anything still scheduled from the last run goes silent
  function newBus() {
    if (master) { try { master.disconnect(); } catch (e) { /* ignore */ } }
    try { conv.disconnect(); } catch (e) { /* ignore */ }
    master = ctx.createGain(); master.connect(comp); conv.connect(master);
  }
  function noise(t, dur, vol, type, freq, q) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur)), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 0.7;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(t);
  }
  function tone(t, type, f0, f1, dur, vol, lp, bus) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    f.type = "lowpass"; f.frequency.value = lp || 5000;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(bus || master); o.start(t); o.stop(t + dur + 0.03);
  }
  // Reed voice used for the accordion and (darker) for the sax hits
  function reed(t, freq, dur, vol, opts) {
    const o = opts || {};
    const g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = "lowpass"; f.frequency.value = o.lp || 3200; f.Q.value = o.q || 1.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + (o.attack || 0.012));
    g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.02, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = o.vib || 5.5; lg.gain.value = o.vibDepth || 7; lfo.connect(lg);
    [[-6, "sawtooth", 1], [6, "sawtooth", 1], [0, "square", 0.45]].forEach(([det, type, amp]) => {
      const osc = ctx.createOscillator(), a = ctx.createGain();
      osc.type = type; osc.frequency.value = freq; osc.detune.value = det; a.gain.value = amp;
      lg.connect(osc.detune); osc.connect(a); a.connect(f); osc.start(t); osc.stop(t + dur + 0.08);
    });
    lfo.start(t); lfo.stop(t + dur + 0.08);
    f.connect(g); g.connect(master); const send = ctx.createGain(); send.gain.value = 0.5; g.connect(send); send.connect(wet);
  }
  const voices = {
    tambora(t, kind, v) {
      if (kind === "low") { tone(t, "sine", 150, 70, 0.2, 0.7 * v, 700); noise(t, 0.03, 0.18 * v, "bandpass", 1200, 1); }
      else if (kind === "slap") { noise(t, 0.07, 0.45 * v, "bandpass", 2200, 1.4); tone(t, "triangle", 260, 190, 0.07, 0.25 * v, 3000); }
      else { tone(t, "square", 1100, 900, 0.03, 0.12 * v, 4000); noise(t, 0.02, 0.15 * v, "highpass", 4000); }
    },
    guira(t, v) { noise(t, 0.045, 0.3 * v, "bandpass", 7500, 0.9); noise(t + 0.012, 0.03, 0.14 * v, "highpass", 9000); },
    bass(t, midi, dur, v) { const f = hz(midi); tone(t, "sine", f, f * 0.98, dur, 0.75 * v, 600); tone(t, "triangle", f * 2, f * 2, dur * 0.5, 0.18 * v, 1200); },
    chord(t, root, dur, v) { MAJOR.forEach((i) => reed(t, hz(root + 12 + i), dur, 0.055 * v, { lp: 2400, q: 0.8, vibDepth: 3 })); },
    lead(t, midi, dur, v) { reed(t, hz(midi), dur, 0.1 * v, { lp: 3600, q: 1.4, vibDepth: 9 }); },
    sax(t, root, dur, v) { [0, 4, 7].forEach((i) => reed(t, hz(root + 24 + i), dur, 0.045 * v, { lp: 1700, q: 2.2, attack: 0.03, vib: 5, vibDepth: 12 })); }
  };

  /* ---------- Band arrangement (one call per eighth note) ---------- */
  function scheduleStep(s, t, stepDur, totalBars) {
    const bar = Math.floor(s / 8), pos = s % 8, ch = chordAt(bar), nxt = chordAt(bar + 1);
    const end = bar >= totalBars + 1;
    if (end) { if (s === (totalBars + 1) * 8) { voices.tambora(t, "low", 1); voices.bass(t, ch.root - 12, 1.2, 1); voices.chord(t, ch.root, 1.2, 1.4); voices.sax(t, ch.root, 1.2, 1); } return; }
    // tambora: low on the beat, rim and slap in between, fill at the end of every 4th bar
    const tamb = ["low", "rim", "low", "slap", "low", "rim", "low", "slap"][pos];
    voices.tambora(t, tamb, tamb === "low" ? (pos % 4 === 0 ? 1 : 0.7) : 0.8);
    if (bar % 4 === 3 && pos >= 6) voices.tambora(t + stepDur / 2, "slap", 0.6);
    // güira: constant scraping, accented on the off-beats
    voices.guira(t, pos % 2 ? 0.95 : 0.6); voices.guira(t + stepDur / 2, 0.4);
    // bass: marching root and fifth
    if (pos % 2 === 0) voices.bass(t, pos % 4 === 0 ? ch.root - 12 : ch.root - 5, stepDur * 1.8, pos === 0 ? 1 : 0.8);
    else if (pos === 7 && nxt.root !== ch.root) voices.bass(t, nxt.root - 12, stepDur, 0.5);
    // accordion chord stabs on the off-beats (after the intro bar)
    if (bar >= 1 && pos % 2 === 1) voices.chord(t, ch.root, stepDur * 0.7, 1);
    // accordion lead riff
    if (bar >= 2) {
      const riff = RIFFS[bar % 4][pos];
      if (riff !== null) { const tones = [ch.root + 24, ch.root + 28, ch.root + 31, ch.root + 36]; voices.lead(t, tones[riff], stepDur * 0.95, 1); }
    }
    // sax hits at the end of every other bar from bar 4
    if (bar >= 4 && bar % 2 === 1 && (pos === 6 || pos === 7)) voices.sax(t, ch.root, stepDur * 0.6, 1);
  }

  /* ---------- Chart: what the player taps ---------- */
  function buildChart() {
    const out = [], lanes = cfg.lanes;
    const lane = (name) => lanes.indexOf(name);
    for (let b = 1; b <= cfg.bars; b++) {
      const add = (pos, name, extra) => { const l = lane(name); if (l >= 0) out.push({ bar: b, pos, lane: l, hit: false, missed: false, ...extra }); };
      if (level === "easy") {
        add(0, "tambora"); add(4, "accordion");
        if (b % 4 === 0 && b > 3) add(6, "accordion");
      } else if (level === "medium") {
        add(0, "tambora"); add(2, "guira"); add(4, "tambora");
        if (b % 4 === 0) { add(5, "accordion"); add(7, "accordion"); } else add(6, "accordion");
      } else {
        add(0, "tambora"); add(4, "tambora");
        [1, 3, 5, 7].forEach((p) => { if (b < 3 || Math.random() < 0.8) add(p, "guira"); });
        if (b > 3) add(6, "bass"); if (b > 5 && Math.random() < 0.6) add(2, "bass");
        if (b > 7) add(Math.random() < 0.5 ? 2 : 6, "accordion");
      }
    }
    const seen = new Set();
    return out.filter((n) => { const k = n.bar * 8 + n.pos + ":" + n.lane; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => a.bar * 8 + a.pos - (b.bar * 8 + b.pos));
  }

  /* ---------- Game state ---------- */
  let notes = [], running = false, raf = 0, sched = 0;
  let perfStart = 0, audioStart = 0, stepDur = 0.3, travel = 2.4, nextStep = 0;
  let score = 0, combo = 0, flash = [], best = 0, judgeTimer = 0, finished = false, resultMsg = "";
  const clock = () => performance.now() / 1000;
  const laneCount = () => cfg.lanes.length;
  const laneW = () => Math.min(150, W / laneCount());
  const laneX = (i) => (W - laneW() * laneCount()) / 2 + i * laneW();
  const noteTime = (n) => perfStart + (n.bar * 8 + n.pos) * stepDur;

  function loadBest() { best = Number(store.get("dr-best-rhythm-" + level, 0)); $("#r-best").textContent = best; }

  function start() {
    stop();
    const audioOk = ensureAudio();
    cfg = LEVELS[level];
    stepDur = 60 / cfg.bpm / 2; travel = Math.min(stepDur * 8, 2.6);
    notes = buildChart(); score = 0; combo = 0; finished = false; flash = cfg.lanes.map(() => 0); nextStep = 0;
    updateHud(); $("#r-judge").textContent = "";
    perfStart = clock() + 0.4;
    if (audioOk) {
      newBus(); audioStart = ctx.currentTime + 0.4;
      master.gain.value = window.GameSound.on ? 1 : 0;
      sched = setInterval(() => {
        master.gain.value = window.GameSound.on ? 1 : 0;
        const endStep = (cfg.bars + 2) * 8;
        while (nextStep <= endStep && audioStart + nextStep * stepDur < ctx.currentTime + 1.2) {
          scheduleStep(nextStep, audioStart + nextStep * stepDur, stepDur, cfg.bars); nextStep++;
        }
      }, 100);
    }
    running = true;
    $("#r-start").textContent = window.LANG === "es" ? "Reiniciar" : "Restart";
    loop();
  }
  function stop() {
    running = false; cancelAnimationFrame(raf); clearInterval(sched);
    if (master && ctx) { try { master.disconnect(); } catch (e) { /* ignore */ } }
  }

  function playerSound(laneName, bar) {
    if (!ctx || !window.GameSound.on) return;
    const t = ctx.currentTime, ch = chordAt(bar);
    if (laneName === "tambora") voices.tambora(t, "low", 1.3);
    else if (laneName === "guira") { voices.guira(t, 1.6); voices.guira(t + 0.03, 1.2); }
    else if (laneName === "bass") voices.bass(t, ch.root - 12 + 7, 0.3, 1.3);
    else voices.lead(t, ch.root + 24 + [0, 4, 7, 12][Math.floor(Math.random() * 4)], 0.28, 1.6);
  }

  function press(l) {
    if (!running || l < 0 || l >= laneCount()) return;
    flash[l] = 1;
    const now = clock(), win = cfg.win;
    let target = null, bestD = 9;
    for (const n of notes) {
      if (n.lane !== l || n.hit || n.missed) continue;
      const d = Math.abs(noteTime(n) - now);
      if (d < bestD) { bestD = d; target = n; }
    }
    const curBar = Math.max(0, Math.floor((now - perfStart) / (stepDur * 8)));
    if (target && bestD <= win[2]) {
      target.hit = true; combo++;
      const pts = bestD <= win[0] ? 100 : bestD <= win[1] ? 70 : 40;
      score += pts + Math.min(combo, 20) * 2;
      showJudge(pts === 100 ? L("Perfect!", "¡Perfecto!") : pts === 70 ? L("Good!", "¡Bien!") : L("Almost!", "¡Casi!"), pts === 100 ? "#4fc98a" : pts === 70 ? "#e8a317" : "#aeb8d0");
      playerSound(cfg.lanes[l], target.bar);
    } else {
      if (!cfg.forgiving) { combo = 0; showJudge(L("Off the beat", "Fuera de ritmo"), "#ff5a6b"); }
      playerSound(cfg.lanes[l], curBar);
    }
    updateHud();
  }
  function showJudge(text, color) {
    const j = $("#r-judge"); j.textContent = text; j.style.color = color;
    clearTimeout(judgeTimer); judgeTimer = setTimeout(() => { j.textContent = ""; }, 550);
  }
  function updateHud() { $("#r-score").textContent = score; $("#r-combo").textContent = combo; }

  function finish() {
    stop(); finished = true;
    const hits = notes.filter((n) => n.hit).length, acc = notes.length ? hits / notes.length : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    if (score > best) { best = score; store.set("dr-best-rhythm-" + level, best); $("#r-best").textContent = best; }
    resultMsg = { hits, total: notes.length, stars };
    draw();
    $("#r-start").textContent = window.LANG === "es" ? "Jugar otra vez" : "Play again";
  }

  function loop() {
    if (!running) return;
    const now = clock();
    notes.forEach((n) => { if (!n.hit && !n.missed && now - noteTime(n) > cfg.win[2]) { n.missed = true; combo = 0; updateHud(); } });
    draw();
    const last = notes[notes.length - 1];
    if (last && now - noteTime(last) > 1.2) { finish(); return; }
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    const c = g2, now = clock(), n = laneCount(), lw = laneW();
    c.clearRect(0, 0, W, H);
    const phase = running ? (((now - perfStart) / (stepDur * 2)) % 1 + 1) % 1 : 1, pulse = running ? Math.max(0, 1 - phase * 3) : 0;
    for (let i = 0; i < n; i++) {
      const x = laneX(i), col = LANE_INFO[cfg.lanes[i]].color;
      c.fillStyle = i % 2 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.09)"; c.fillRect(x, 0, lw, H);
      if (flash[i] > 0) { c.fillStyle = col + "55"; c.fillRect(x, HIT_Y - 70, lw, 140); flash[i] = Math.max(0, flash[i] - 0.07); }
    }
    c.fillStyle = "rgba(255,255,255,0.9)"; c.fillRect(laneX(0), HIT_Y - 2, lw * n, 4);
    c.textAlign = "center";
    for (let i = 0; i < n; i++) {
      const x = laneX(i) + lw / 2, col = LANE_INFO[cfg.lanes[i]].color;
      c.beginPath(); c.arc(x, HIT_Y, 30 + pulse * 5, 0, Math.PI * 2); c.lineWidth = 4; c.strokeStyle = col; c.stroke();
      c.fillStyle = "#fff"; c.font = "800 20px system-ui, sans-serif"; c.fillText(cfg.keys[i].toUpperCase(), x, HIT_Y + 7);
      c.fillStyle = "#c9d4ee"; c.font = "700 14px system-ui, sans-serif"; c.fillText(tr(LANE_INFO[cfg.lanes[i]]), x, H - 22);
    }
    if (running || finished) {
      notes.forEach((nt) => {
        if (nt.hit) return;
        const t = noteTime(nt) - now, y = HIT_Y - (t / travel) * HIT_Y;
        if (y < -40 || y > H + 40) return;
        const x = laneX(nt.lane) + lw / 2, col = LANE_INFO[cfg.lanes[nt.lane]].color;
        c.globalAlpha = nt.missed ? 0.25 : 1;
        c.fillStyle = col; c.beginPath(); c.arc(x, y, 26, 0, Math.PI * 2); c.fill();
        c.lineWidth = 4; c.strokeStyle = "#fff"; c.stroke();
        c.fillStyle = "#0b1d44"; c.font = "800 20px system-ui, sans-serif"; c.fillText(cfg.keys[nt.lane].toUpperCase(), x, y + 7);
        c.globalAlpha = 1;
      });
    }
    if (running && now < perfStart + stepDur * 8 * 0.9) {
      c.fillStyle = "rgba(11,29,68,0.7)"; c.fillRect(0, 150, W, 70);
      c.fillStyle = "#fff"; c.font = "800 26px Georgia, serif";
      c.fillText(window.LANG === "es" ? "Escucha el ritmo..." : "Listen to the groove...", W / 2, 195);
    }
    if (!running && !finished) {
      c.fillStyle = "rgba(11,29,68,0.78)"; c.fillRect(0, 200, W, 190);
      c.fillStyle = "#fff"; c.font = "800 28px Georgia, serif";
      c.fillText(window.LANG === "es" ? "Listo para bailar" : "Ready to dance", W / 2, 262);
      c.font = "600 17px system-ui, sans-serif"; c.fillStyle = "#c9d4ee";
      c.fillText(window.LANG === "es" ? "Toca la tecla cuando la nota llegue al círculo." : "Press the key when a note reaches the circle.", W / 2, 302);
      c.fillText(window.LANG === "es" ? "La banda toca sola. Tú pones el ritmo encima." : "The band plays on its own. You add rhythm on top.", W / 2, 332);
    }
    if (finished && resultMsg) {
      c.fillStyle = "rgba(11,29,68,0.88)"; c.fillRect(0, 180, W, 230);
      c.fillStyle = "#fff"; c.font = "800 30px Georgia, serif";
      c.fillText(window.LANG === "es" ? "¡Terminó la canción!" : "Song finished!", W / 2, 240);
      c.fillStyle = "#e8a317"; c.font = "40px system-ui, sans-serif"; c.fillText("★".repeat(resultMsg.stars) + "☆".repeat(3 - resultMsg.stars), W / 2, 295);
      c.fillStyle = "#fff"; c.font = "700 20px system-ui, sans-serif";
      c.fillText(`${resultMsg.hits}/${resultMsg.total} ${window.LANG === "es" ? "notas" : "notes"} · ${score} ${window.LANG === "es" ? "puntos" : "points"}`, W / 2, 345);
    }
  }

  /* ---------- Controls ---------- */
  document.addEventListener("keydown", (e) => {
    if (!$("#game-rhythm").classList.contains("active") || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    const i = cfg.keys.indexOf(e.key.toLowerCase());
    if (i >= 0) { e.preventDefault(); press(i); }
  });
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    press(Math.max(0, Math.min(laneCount() - 1, Math.floor((x - laneX(0)) / laneW()))));
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden && running) { stop(); finished = false; draw(); $("#r-start").textContent = window.LANG === "es" ? "Empezar" : "Start"; } });
  $("#r-start").addEventListener("click", start);
  function setLevel(l) {
    level = l; cfg = LEVELS[l]; store.set("dr-rhythm-level", l);
    $$(".chip[data-level]").forEach((c) => c.setAttribute("aria-pressed", c.dataset.level === l));
    stop(); finished = false; notes = []; flash = cfg.lanes.map(() => 0); score = 0; combo = 0; updateHud(); loadBest();
    $("#r-start").textContent = window.LANG === "es" ? "Empezar" : "Start";
    $("#r-keys").textContent = cfg.keys.map((k) => k.toUpperCase()).join("  ");
    draw();
  }
  $$(".chip[data-level]").forEach((c) => c.addEventListener("click", () => setLevel(c.dataset.level)));
  document.addEventListener("langchange", () => { if (!running) draw(); });
  window.RhythmGame = { stop: () => { stop(); } };
  setLevel(level);
})();
