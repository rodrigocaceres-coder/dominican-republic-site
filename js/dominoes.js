/* ===== Dominoes: you vs the computer, on a square table ===== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const L = (en, es) => tr({ en, es });
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  if (!$("#d-board")) return;

  const PIPS = { 0: [], 1: [4], 2: [2, 6], 3: [2, 4, 6], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  // Layout constants, in percent of the square table
  const TW = 9, STEP = 9.4, LEFT = 2.5, ROW = 5.4, CY = 40, CENTER_X = 45.5, PER_SIDE = 4, PER_ROW = 10;

  let yard, mine, theirs, board, start, turn, over, picked, passes, lastTile, statusKey, fresh = null;
  let wins = Number(store.get("dr-dom-wins", 0)), losses = Number(store.get("dr-dom-losses", 0));
  let cpuTimer = 0;

  const key = (t) => (t.a === t.b ? 100 + t.a : t.a + t.b);
  const pipSum = (h) => h.reduce((s, t) => s + t.a + t.b, 0);
  const ends = () => ({ l: board[0].a, r: board[board.length - 1].b });
  const fits = (t) => { if (!board.length) return true; const e = ends(); return t.a === e.l || t.b === e.l || t.a === e.r || t.b === e.r; };
  const sidesOf = (t) => { const e = ends(), r = []; if (t.a === e.l || t.b === e.l) r.push("l"); if (t.a === e.r || t.b === e.r) r.push("r"); return r; };

  function setStatus(en, es) { statusKey = [en, es]; $("#d-status").textContent = L(en, es); }

  function tileEl(t, cls, flip) {
    const el = document.createElement("div");
    el.className = "tile " + (cls || "");
    const halves = flip ? [t.b, t.a] : [t.a, t.b];
    halves.forEach((v) => {
      const h = document.createElement("div"); h.className = "half";
      for (let i = 0; i < 9; i++) {
        const c = document.createElement("span");
        if (PIPS[v].includes(i)) c.className = "pip";
        h.appendChild(c);
      }
      el.appendChild(h);
    });
    return el;
  }

  /* Chain layout: the first tile sits in the middle. The right arm runs right,
     then drops a row and comes back left. The left arm runs left, then climbs a row and goes right. */
  function slot(arm, k) {
    if (k <= PER_SIDE) return { x: arm === "r" ? CENTER_X + k * STEP : CENTER_X - k * STEP, y: CY, flip: false };
    const m = k - PER_SIDE - 1, row = Math.floor(m / PER_ROW) + 1, c = m % PER_ROW;
    if (arm === "r") return { x: LEFT + (PER_ROW - 1 - c) * STEP, y: CY + row * ROW, flip: true };
    return { x: LEFT + c * STEP, y: CY - row * ROW, flip: true };
  }

  function render() {
    $("#d-wins").textContent = wins; $("#d-losses").textContent = losses; $("#d-yard").textContent = yard.length;
    const b = $("#d-board"); b.innerHTML = "";
    board.forEach((t, i) => {
      let pos;
      if (i === start) pos = { x: CENTER_X, y: CY, flip: false };
      else if (i > start) pos = slot("r", i - start);
      else pos = slot("l", start - i);
      const el = tileEl(t, "laid" + (t === lastTile ? " last" : "") + (t === fresh ? " fresh" : ""), pos.flip);
      el.style.left = pos.x + "%"; el.style.top = pos.y + "%";
      b.appendChild(el);
    });
    fresh = null;
    if (board.length) {
      const e = ends();
      $("#d-ends").innerHTML = `<span>${L("Open ends", "Extremos")}</span><b>${e.l}</b><b>${e.r}</b>`;
    } else $("#d-ends").innerHTML = "";

    $("#d-opp-count").textContent = theirs.length;
    const opp = $("#d-opp-tiles"); opp.innerHTML = "";
    theirs.forEach(() => opp.appendChild(tileEl({ a: 0, b: 0 }, "back mini")));

    const hand = $("#d-hand"); hand.innerHTML = "";
    const myTurn = turn === "me" && !over;
    mine.slice().sort((x, y) => key(y) - key(x)).forEach((t) => {
      const ok = myTurn && fits(t);
      const el = tileEl(t, "hand" + (ok ? " playable" : myTurn ? " blocked" : "") + (picked === t ? " picked" : ""));
      el.tabIndex = 0; el.setAttribute("role", "button");
      el.setAttribute("aria-label", `${t.a}-${t.b}` + (ok ? "" : ""));
      const go = () => selectTile(t);
      el.addEventListener("click", go);
      el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      hand.appendChild(el);
    });
    const canPlay = mine.some(fits);
    $("#d-draw").disabled = !(myTurn && !canPlay && yard.length > 0);
    $("#d-pass").disabled = !(myTurn && !canPlay && yard.length === 0);
    $("#d-draw").classList.toggle("pulse", !$("#d-draw").disabled);
    $("#d-pass").classList.toggle("pulse", !$("#d-pass").disabled);
    $("#d-pick").hidden = true;
  }

  function place(t, side) {
    const e = ends();
    let placed;
    if (side === "l") { placed = t.b === e.l ? { a: t.a, b: t.b } : { a: t.b, b: t.a }; board.unshift(placed); start++; }
    else { placed = t.a === e.r ? { a: t.a, b: t.b } : { a: t.b, b: t.a }; board.push(placed); }
    lastTile = placed; fresh = placed;
  }

  function newGame() {
    clearTimeout(cpuTimer);
    const all = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push({ a, b });
    all.sort(() => Math.random() - 0.5);
    mine = all.splice(0, 7); theirs = all.splice(0, 7); yard = all;
    board = []; start = 0; over = false; picked = null; passes = 0; lastTile = null;
    $("#d-over").hidden = true;
    const top = (h) => h.reduce((m, t) => (key(t) > key(m) ? t : m));
    const mTop = top(mine), tTop = top(theirs);
    if (key(mTop) >= key(tTop)) {
      mine.splice(mine.indexOf(mTop), 1); board.push({ a: mTop.a, b: mTop.b }); lastTile = board[0];
      turn = "cpu"; render();
      setStatus("You opened with your highest tile.", "Abriste con tu ficha más alta.");
      cpuTimer = setTimeout(cpuTurn, 1100);
    } else {
      theirs.splice(theirs.indexOf(tTop), 1); board.push({ a: tTop.a, b: tTop.b }); lastTile = board[0];
      turn = "me"; render();
      setStatus("Rival opened. Your turn: pick a glowing tile.", "El rival abrió. Tu turno: elige una ficha resaltada.");
    }
  }

  function selectTile(t) {
    if (turn !== "me" || over || !fits(t)) return;
    const s = sidesOf(t), e = ends();
    if (s.length === 1 || e.l === e.r) { playMine(t, s[0]); return; }
    picked = t; render();
    $("#d-pick").hidden = false;
    $("#d-pick-l").textContent = `← ${e.l}`; $("#d-pick-r").textContent = `${e.r} →`;
    setStatus("Which end?", "¿En qué extremo?");
    $("#d-pick-l").onclick = () => playMine(t, "l");
    $("#d-pick-r").onclick = () => playMine(t, "r");
  }
  function playMine(t, side) {
    mine.splice(mine.indexOf(t), 1); place(t, side); picked = null; passes = 0;
    if (!mine.length) { render(); return finish("me"); }
    turn = "cpu"; render();
    setStatus("Rival is thinking...", "El rival está pensando...");
    cpuTimer = setTimeout(cpuTurn, 1100);
  }

  function cpuTurn() {
    if (over) return;
    let drew = 0;
    while (!theirs.some(fits) && yard.length) { theirs.push(yard.pop()); drew++; }
    const options = theirs.filter(fits);
    if (!options.length) {
      passes++;
      turn = "me"; render();
      if (passes >= 2) return blocked();
      setStatus("Rival cannot play and passes. Your turn.", "El rival no puede jugar y pasa. Tu turno.");
      return;
    }
    options.sort((x, y) => (key(y) + (y.a === y.b ? 5 : 0)) - (key(x) + (x.a === x.b ? 5 : 0)));
    const t = options[0], s = sidesOf(t);
    // choose the end that leaves a number the rival still holds
    const held = (n) => theirs.filter((o) => o !== t && (o.a === n || o.b === n)).length;
    const score = (side) => { const e = ends(); const open = side === "l" ? e.l : e.r; const next = t.a === open ? t.b : t.a; return held(next); };
    s.sort((p, q) => score(q) - score(p));
    theirs.splice(theirs.indexOf(t), 1); place(t, s[0]); passes = 0;
    if (!theirs.length) { turn = "none"; render(); return finish("cpu"); }
    turn = "me"; render();
    const can = mine.some(fits);
    if (can) setStatus("Your turn." + (drew ? ` Rival drew ${drew} from the boneyard.` : ""), "Tu turno." + (drew ? ` El rival robó ${drew} del pozo.` : ""));
    else if (yard.length) setStatus("No match for you. Draw from the boneyard.", "No tienes ficha. Roba del pozo.");
    else setStatus("No match and the boneyard is empty. Pass.", "No tienes ficha y el pozo está vacío. Pasa.");
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
    const t = $("#d-over-title"), sub = $("#d-over-sub");
    const lock = wasBlocked ? L("The game locked. Lowest pip total wins.", "El juego se tranca. Gana quien tenga menos puntos.") : "";
    if (who === "me") { t.textContent = L("You win!", "¡Ganaste!"); sub.textContent = wasBlocked ? lock : L("You emptied your hand first.", "Te quedaste sin fichas primero."); }
    else if (who === "cpu") { t.textContent = L("Rival wins", "Gana el rival"); sub.textContent = wasBlocked ? lock : L("The rival emptied their hand first.", "El rival se quedó sin fichas primero."); }
    else { t.textContent = L("Draw", "Empate"); sub.textContent = L("Same pip total.", "Mismo total de puntos."); }
    $("#d-over").dataset.who = who;
    $("#d-over").hidden = false;
    setStatus("Game over.", "Fin del juego.");
  }

  $("#d-new").addEventListener("click", newGame);
  $("#d-again").addEventListener("click", newGame);
  $("#d-draw").addEventListener("click", () => {
    if (turn !== "me" || !yard.length) return;
    mine.push(yard.pop()); render();
    if (mine.some(fits)) setStatus("You drew a playable tile.", "Robaste una ficha que puedes jugar.");
    else if (yard.length) setStatus("Still no match. Draw again.", "Todavía no hay ficha. Roba otra.");
    else setStatus("No match and the boneyard is empty. Pass.", "No tienes ficha y el pozo está vacío. Pasa.");
  });
  $("#d-pass").addEventListener("click", () => {
    if (turn !== "me") return;
    passes++;
    if (passes >= 2) return blocked();
    turn = "cpu"; render();
    setStatus("You pass. Rival's turn.", "Pasas. Turno del rival.");
    cpuTimer = setTimeout(cpuTurn, 1100);
  });
  document.addEventListener("langchange", () => { if (statusKey) $("#d-status").textContent = L(statusKey[0], statusKey[1]); if (board) render(); });
  newGame();
  window.Dominoes = { newGame };
})();
