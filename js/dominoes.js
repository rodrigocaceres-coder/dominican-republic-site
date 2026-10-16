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
  // Board geometry: a grid of square cells on the square table. A tile covers two cells.
  const CELL = 4.2, COLS = 22, ROWS = 12, PAD_X = (100 - COLS * CELL) / 2, TOP = 17, CENTER_ROW = 5;
  const CENTER_COL = COLS / 2 - 1;          // the first tile covers CENTER_COL and CENTER_COL + 1

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

  /* Chain layout: the first tile sits in the middle. Each arm runs straight until it reaches the edge,
     then takes a perpendicular turn (a tile laid at 90 degrees), steps over and carries on the other way.
     The right arm turns clockwise: right, down, left, up. The left arm mirrors it: left, up, right, down. */
  const add = (c, v) => ({ x: c.x + v.x, y: c.y + v.y });
  const mul = (v, n) => ({ x: v.x * n, y: v.y * n });
  const cw = (v) => ({ x: -v.y, y: v.x });
  const ccw = (v) => ({ x: v.y, y: -v.x });
  const ck = (c) => c.x + "," + c.y;
  const inBounds = (c) => c.x >= 0 && c.x < COLS && c.y >= 0 && c.y < ROWS;

  function walkArm(count, head, dir, occupied) {
    const out = [];
    let turning = false;
    const free = (c) => inBounds(c) && !occupied.has(ck(c));
    for (let i = 0; i < count; i++) {
      let cells = null;
      if (!turning && free(add(head, dir)) && free(add(head, mul(dir, 2))) && inBounds(add(head, mul(dir, 3)))) {
        cells = [add(head, dir), add(head, mul(dir, 2))]; head = cells[1];
      } else {
        // perpendicular turn: a tile laid sideways, starting right after the last cell
        for (const rot of [cw, ccw]) {
          const d2 = rot(dir), c1 = add(head, dir), c2 = add(c1, d2);
          if (free(c1) && free(c2)) { cells = [c1, c2]; head = c2; dir = d2; turning = !turning; break; }
        }
        if (!cells) { cells = [add(head, dir), add(head, mul(dir, 2))]; head = cells[1]; turning = false; }   // last resort
      }
      cells.forEach((c) => occupied.add(ck(c)));
      out.push({ cells, dir: { x: cells[1].x - cells[0].x, y: cells[1].y - cells[0].y } });
    }
    return out;
  }
  function layoutBoard() {
    const first = [{ x: CENTER_COL, y: CENTER_ROW }, { x: CENTER_COL + 1, y: CENTER_ROW }];
    const occupied = new Set(first.map(ck));
    const left = walkArm(start, first[0], { x: -1, y: 0 }, occupied);
    const right = walkArm(board.length - 1 - start, first[1], { x: 1, y: 0 }, occupied);
    return { first, left, right };
  }

  function render() {
    $("#d-wins").textContent = wins; $("#d-losses").textContent = losses; $("#d-yard").textContent = yard.length;
    const b = $("#d-board"); b.innerHTML = "";
    const lay = layoutBoard();
    const put = (t, p, arm, i) => {
      const [c1, c2] = p.cells, vertical = p.dir.y !== 0;
      const positive = p.dir.x > 0 || p.dir.y > 0;      // reading order of the two cells
      // right arm: near cell shows a, far cell shows b. Left arm: the other way round.
      const flip = arm === "r" ? !positive : positive;
      const el = tileEl(t, "laid board-tile" + (vertical ? " v" : "") + (t === lastTile ? " last" : "") + (t === fresh ? " fresh" : ""), arm === "c" ? false : flip);
      el.style.left = (PAD_X + Math.min(c1.x, c2.x) * CELL) + "%";
      el.style.top = (TOP + Math.min(c1.y, c2.y) * CELL) + "%";
      b.appendChild(el);
    };
    put(board[start], { cells: lay.first, dir: { x: 1, y: 0 } }, "c");
    lay.left.forEach((p, i) => put(board[start - 1 - i], p, "l"));
    lay.right.forEach((p, i) => put(board[start + 1 + i], p, "r"));
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
