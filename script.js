/* ═══════════════════════════════════════════════════════════
   SOS GAME  —  Fixed Logic + Kids-Friendly Edition
   ═══════════════════════════════════════════════════════════

   KEY RULES:
   - Score ONLY when an exact S-O-S sequence appears in a line
     (horizontal, vertical, or diagonal).
   - A player who scores gets ONE extra turn immediately.
   - Game ends when the board is full; highest score wins.
   ═══════════════════════════════════════════════════════════ */

/* ── DOM refs ── */
const boardEl        = document.getElementById("board");
const boardSizeEl    = document.getElementById("boardSize");
const playerScoreEl  = document.getElementById("playerScore");
const aiScoreEl      = document.getElementById("aiScore");
const turnLabelEl    = document.getElementById("turnLabel");
const statusTextEl   = document.getElementById("statusText");
const historyEl      = document.getElementById("history");
const resultBannerEl = document.getElementById("resultBanner");
const extraTurnBadge = document.getElementById("extraTurnBadge");
const scoreToast     = document.getElementById("scoreToast");
const themeToggle    = document.getElementById("themeToggle");
const tokenButtons   = Array.from(document.querySelectorAll(".token-option"));
const startBtn       = document.getElementById("startGame");
const computerFirstBtn = document.getElementById("computerFirst");
const resetSameBtn   = document.getElementById("resetSame");

/* ── State ── */
let selectedToken = "S";
let game = null;
let theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

/* ═══════════════════════════════════════
   THEME
════════════════════════════════════════ */
function updateThemeIcon() {
  themeToggle.innerHTML = theme === "dark"
    ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <circle cx="12" cy="12" r="5"/>
         <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
       </svg>`
    : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
         <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
       </svg>`;
  themeToggle.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  document.documentElement.setAttribute("data-theme", theme);
}

updateThemeIcon();

themeToggle.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  updateThemeIcon();
});

/* ═══════════════════════════════════════
   GAME STATE
════════════════════════════════════════ */
function createGame(size) {
  return {
    size,
    board: Array.from({ length: size }, () => Array(size).fill(null)),
    playerScore: 0,
    aiScore: 0,
    currentTurn: "player",
    over: false,
    moveNumber: 0,
    lastMove: null,
    history: [],
    sosSequences: [],   // array of { cells: [{r,c},...], owner } for highlighting
  };
}

/* ═══════════════════════════════════════
   SOS DETECTION  (FIXED & CLEAN)
════════════════════════════════════════

  We scan ALL triplets that pass through (row,col) in 4 directions.
  For each direction we check two cases:
    Case A — (row,col) is the FIRST  S: pattern S-O-S → check (r+dr, c+dc) = O,
                                                              (r+2dr, c+2dc) = S
    Case B — (row,col) is the MIDDLE O: placed "O" → check (r-dr, c-dc) = S,
                                                              (r+dr, c+dc) = S
    Case C — (row,col) is the LAST   S: pattern S-O-S → check (r-2dr, c-2dc) = S,
                                                              (r-dr,  c-dc)  = O

  Returns an array of SOS sequences found (each is an array of 3 {r,c} cells).
════════════════════════════════════════ */
const DIRS = [
  [0, 1],   // horizontal →
  [1, 0],   // vertical ↓
  [1, 1],   // diagonal ↘
  [1, -1],  // diagonal ↙
];

function inBounds(r, c, size) {
  return r >= 0 && r < size && c >= 0 && c < size;
}

function getVal(board, r, c) {
  return board[r][c]?.value ?? null;
}

/**
 * After placing a letter at (row,col), find every NEW SOS sequence
 * that contains this cell.
 * Returns an array of sequences; each sequence = [{r,c},{r,c},{r,c}].
 */
function findNewSOS(board, row, col) {
  const size  = board.length;
  const found = [];
  const letter = getVal(board, row, col);

  for (const [dr, dc] of DIRS) {
    if (letter === "S") {
      // Case A: this S is the START of an SOS
      const r1 = row + dr, c1 = col + dc;
      const r2 = row + 2 * dr, c2 = col + 2 * dc;
      if (inBounds(r1, c1, size) && inBounds(r2, c2, size)) {
        if (getVal(board, r1, c1) === "O" && getVal(board, r2, c2) === "S") {
          found.push([{ r: row, c: col }, { r: r1, c: c1 }, { r: r2, c: c2 }]);
        }
      }

      // Case C: this S is the END of an SOS
      const r3 = row - 2 * dr, c3 = col - 2 * dc;
      const r4 = row - dr,     c4 = col - dc;
      if (inBounds(r3, c3, size) && inBounds(r4, c4, size)) {
        if (getVal(board, r3, c3) === "S" && getVal(board, r4, c4) === "O") {
          found.push([{ r: r3, c: c3 }, { r: r4, c: c4 }, { r: row, c: col }]);
        }
      }
    }

    if (letter === "O") {
      // Case B: this O is the MIDDLE of an SOS
      const r1 = row - dr, c1 = col - dc;
      const r2 = row + dr, c2 = col + dc;
      if (inBounds(r1, c1, size) && inBounds(r2, c2, size)) {
        if (getVal(board, r1, c1) === "S" && getVal(board, r2, c2) === "S") {
          found.push([{ r: r1, c: c1 }, { r: row, c: col }, { r: r2, c: c2 }]);
        }
      }
    }
  }

  return found;
}

function boardIsFull(board) {
  return board.every(row => row.every(cell => cell !== null));
}

function cloneBoard(board) {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

/* ═══════════════════════════════════════
   PLACE MOVE
════════════════════════════════════════ */
function placeMove(state, row, col, value, owner) {
  if (state.board[row][col] !== null) return null;  // cell taken

  // Place the letter
  state.board[row][col] = { value, owner };

  // Find new SOS sequences created by this move
  const newSequences = findNewSOS(state.board, row, col);
  const gained = newSequences.length;

  // Credit points
  if (owner === "player") state.playerScore += gained;
  else                    state.aiScore    += gained;

  // Track sequences for highlighting
  if (gained > 0) {
    newSequences.forEach(seq => {
      state.sosSequences.push({ cells: seq, owner });
    });
  }

  state.moveNumber += 1;
  state.lastMove   = { row, col, value, owner, gained };

  // Build history entry
  const who = owner === "player" ? "😊 You" : "🤖 Robot";
  const msg = gained > 0
    ? `${who} placed ${value} at (${row + 1},${col + 1}) → +${gained} SOS! ⭐`
    : `${who} placed ${value} at (${row + 1},${col + 1})`;
  state.history.unshift({ text: msg, scored: gained > 0 });
  if (state.history.length > 20) state.history.pop();

  // Determine who plays next
  if (boardIsFull(state.board)) {
    state.over = true;
  } else if (gained === 0) {
    // No SOS → switch turns
    state.currentTurn = owner === "player" ? "ai" : "player";
  } else {
    // Scored → same player gets an extra turn
    state.currentTurn = owner;
  }

  return gained;
}

/* ═══════════════════════════════════════
   AI  —  choose the best move
════════════════════════════════════════ */
function emptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++)
    for (let c = 0; c < board[r].length; c++)
      if (!board[r][c]) cells.push({ row: r, col: c });
  return cells;
}

/** Count how many SOS sequences a hypothetical move would create */
function simGained(board, row, col, value, owner) {
  const sim = cloneBoard(board);
  sim[row][col] = { value, owner };
  return findNewSOS(sim, row, col).length;
}

/** Heuristic: how many SOS patterns does a board position allow for `owner` */
function potentialScore(board, owner) {
  const size = board.length;
  let score = 0;
  for (const [dr, dc] of DIRS) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cells = [];
        for (let i = 0; i < 3; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (!inBounds(nr, nc, size)) break;
          cells.push(board[nr][nc]);
        }
        if (cells.length < 3) continue;
        const vals   = cells.map(x => x?.value  ?? null);
        const owners = cells.map(x => x?.owner  ?? null);
        const foe    = owner === "ai" ? "player" : "ai";
        // Pattern S?O?S
        if ((vals[0] === "S" || vals[0] === null) &&
            (vals[1] === "O" || vals[1] === null) &&
            (vals[2] === "S" || vals[2] === null)) {
          if (!owners.includes(foe)) score += 3 + owners.filter(o => o === owner).length;
          else if (!owners.includes(owner)) score -= 2;
        }
      }
    }
  }
  return score;
}

function centrality(row, col, size) {
  const mid = (size - 1) / 2;
  return size - (Math.abs(row - mid) + Math.abs(col - mid));
}

function chooseAiMove(state) {
  const cells = emptyCells(state.board);
  if (!cells.length) return null;

  let best = null, bestScore = -Infinity;

  // Priority 1: scoring moves
  for (const { row, col } of cells) {
    for (const value of ["S", "O"]) {
      const g = simGained(state.board, row, col, value, "ai");
      if (g > 0) {
        const s = 10000 + g * 500 + centrality(row, col, state.size);
        if (s > bestScore) { bestScore = s; best = { row, col, value, reason: "score" }; }
      }
    }
  }
  if (best) return best;

  // Priority 2: block player from scoring
  for (const { row, col } of cells) {
    for (const value of ["S", "O"]) {
      const g = simGained(state.board, row, col, value, "player");
      if (g > 0) {
        const s = 5000 + g * 300 + centrality(row, col, state.size);
        if (s > bestScore) { bestScore = s; best = { row, col, value, reason: "block" }; }
      }
    }
  }
  if (best) return best;

  // Priority 3: heuristic (build potential)
  for (const { row, col } of cells) {
    for (const value of ["S", "O"]) {
      const sim = cloneBoard(state.board);
      sim[row][col] = { value, owner: "ai" };
      const s = potentialScore(sim, "ai")
              - potentialScore(sim, "player")
              + centrality(row, col, state.size) * 0.5;
      if (s > bestScore) { bestScore = s; best = { row, col, value, reason: "setup" }; }
    }
  }

  return best || { row: cells[0].row, col: cells[0].col, value: "S", reason: "fallback" };
}

/* ═══════════════════════════════════════
   RENDERING
════════════════════════════════════════ */
function getCellClass(owner, value) {
  if (!owner) return "";
  if (owner === "player") return value === "S" ? "player-s" : "player-o";
  return value === "S" ? "ai-s" : "ai-o";
}

function renderBoard() {
  boardEl.innerHTML = "";
  const size = game.size;
  const cellSize = size >= 7 ? "minmax(38px,1fr)"
                 : size >= 5 ? "minmax(50px,1fr)"
                             : "minmax(62px,1fr)";
  boardEl.style.gridTemplateColumns = `repeat(${size}, ${cellSize})`;

  // Build a set of SOS-highlighted cells
  const highlightSet = new Set();
  game.sosSequences.forEach(seq => {
    seq.cells.forEach(({ r, c }) => highlightSet.add(`${r}-${c}`));
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = "cell";
      btn.dataset.row = r;
      btn.dataset.col = c;
      btn.setAttribute("role", "gridcell");
      btn.setAttribute("aria-label", `Row ${r + 1} column ${c + 1}`);

      const cell = game.board[r][c];
      if (cell) {
        btn.textContent = cell.value;
        btn.classList.add("filled", getCellClass(cell.owner, cell.value));
        btn.disabled = true;
      } else if (game.over || game.currentTurn !== "player") {
        btn.disabled = true;
      }

      // Last move glow
      if (game.lastMove && game.lastMove.row === r && game.lastMove.col === c) {
        btn.classList.add("last-move", "just-placed");
      }

      // SOS highlight
      if (highlightSet.has(`${r}-${c}`)) {
        btn.classList.add("sos-highlight");
      }

      boardEl.appendChild(btn);
    }
  }
}

function renderHistory() {
  historyEl.innerHTML = "";
  if (!game.history.length) {
    const el = document.createElement("div");
    el.className = "history-item";
    el.textContent = "No moves yet. Pick a letter and tap a cell! 🎮";
    historyEl.appendChild(el);
    return;
  }
  game.history.forEach(({ text, scored }) => {
    const el = document.createElement("div");
    el.className = `history-item${scored ? " scored" : ""}`;
    el.textContent = text;
    historyEl.appendChild(el);
  });
}

function renderStatus() {
  playerScoreEl.textContent = game.playerScore;
  aiScoreEl.textContent     = game.aiScore;

  if (game.over) {
    turnLabelEl.textContent = "Game Over!";
    turnLabelEl.className   = "turn-badge";
    extraTurnBadge.classList.remove("visible");

    let emoji = "🤝";
    let msg;
    if (game.playerScore > game.aiScore) {
      msg = `🎉 YOU WIN! ${game.playerScore} – ${game.aiScore} 🏆`;
      emoji = "🏆";
    } else if (game.aiScore > game.playerScore) {
      msg = `🤖 Robot wins! ${game.aiScore} – ${game.playerScore}`;
      emoji = "😅";
    } else {
      msg = `🤝 It's a draw! ${game.playerScore} – ${game.aiScore}`;
    }

    statusTextEl.textContent = `Final scores are in! ${emoji}`;
    resultBannerEl.textContent = msg;
    resultBannerEl.classList.add("show");

    if (game.playerScore >= game.aiScore) launchConfetti();
  } else {
    resultBannerEl.classList.remove("show");
    const isPlayer = game.currentTurn === "player";

    turnLabelEl.textContent = isPlayer ? "Your Turn! 😊" : "Robot's Turn! 🤖";
    turnLabelEl.className = `turn-badge${isPlayer ? "" : " ai-turn"}`;

    if (game.lastMove?.gained > 0) {
      extraTurnBadge.classList.add("visible");
      if (isPlayer) {
        statusTextEl.textContent = `🌟 You scored ${game.lastMove.gained} SOS! Play again!`;
      } else {
        statusTextEl.textContent = `🤖 Robot scored ${game.lastMove.gained} SOS! It goes again...`;
      }
    } else {
      extraTurnBadge.classList.remove("visible");
      if (isPlayer) {
        statusTextEl.textContent = `Pick letter ${selectedToken} and tap an empty cell!`;
      } else {
        statusTextEl.textContent = "Robot is thinking... 🤔";
      }
    }
  }

  renderHistory();
  renderBoard();
}

function syncTokenButtons() {
  tokenButtons.forEach(btn => {
    const active = btn.dataset.token === selectedToken;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });
  if (game && !game.over && game.currentTurn === "player") {
    statusTextEl.textContent = `Pick letter ${selectedToken} and tap an empty cell!`;
  }
}

/* ═══════════════════════════════════════
   TOAST POPUP
════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  scoreToast.textContent = msg;
  scoreToast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => scoreToast.classList.remove("show"), 2000);
}

/* ── Score pop animation on score cards ── */
function animateScoreCard(owner) {
  const card = document.querySelector(`.score-card.${owner}`);
  if (!card) return;
  card.classList.remove("scoring");
  // Force reflow
  void card.offsetWidth;
  card.classList.add("scoring");
  card.addEventListener("animationend", () => card.classList.remove("scoring"), { once: true });
}

/* ═══════════════════════════════════════
   CONFETTI
════════════════════════════════════════ */
const canvas  = document.getElementById("confettiCanvas");
const ctx2d   = canvas.getContext("2d");
let confettiParticles = [];
let confettiFrame = null;

function launchConfetti() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#6c63ff","#ff6b6b","#f9c74f","#2ecc71","#00b4d8","#e040fb","#ff9f1c"];
  confettiParticles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height * 0.3,
    r: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    alpha: 1,
    rot: Math.random() * Math.PI * 2,
    rotV: (Math.random() - 0.5) * 0.15,
  }));

  cancelAnimationFrame(confettiFrame);
  animateConfetti();
}

function animateConfetti() {
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  for (const p of confettiParticles) {
    p.x   += p.vx;
    p.y   += p.vy;
    p.vy  += 0.06;
    p.rot += p.rotV;
    if (p.y > canvas.height * 0.9) p.alpha -= 0.025;
    if (p.alpha > 0) {
      alive = true;
      ctx2d.save();
      ctx2d.globalAlpha = Math.max(0, p.alpha);
      ctx2d.translate(p.x, p.y);
      ctx2d.rotate(p.rot);
      ctx2d.fillStyle = p.color;
      ctx2d.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.5);
      ctx2d.restore();
    }
  }
  if (alive) confettiFrame = requestAnimationFrame(animateConfetti);
  else ctx2d.clearRect(0, 0, canvas.width, canvas.height);
}

/* ═══════════════════════════════════════
   GAME FLOW
════════════════════════════════════════ */
function startGame(computerStarts = false) {
  game = createGame(Number(boardSizeEl.value));
  game.currentTurn = computerStarts ? "ai" : "player";
  cancelAnimationFrame(confettiFrame);
  ctx2d.clearRect(0, 0, canvas.width, canvas.height);
  renderStatus();
  if (computerStarts) setTimeout(aiTurn, 500);
}

function aiTurn() {
  if (!game || game.over || game.currentTurn !== "ai") return;

  const move = chooseAiMove(game);
  if (!move) return;

  const gained = placeMove(game, move.row, move.col, move.value, "ai");
  if (gained > 0) {
    animateScoreCard("ai");
    showToast(`🤖 Robot scored ${gained} SOS!`);
  }

  renderStatus();

  // If AI still has the turn (scored), go again after a short delay
  if (!game.over && game.currentTurn === "ai") {
    setTimeout(aiTurn, 600);
  }
}

function handleBoardClick(event) {
  const target = event.target.closest(".cell");
  if (!target || !game || game.over || game.currentTurn !== "player") return;

  const row = Number(target.dataset.row);
  const col = Number(target.dataset.col);
  if (game.board[row][col]) return;   // already filled

  const gained = placeMove(game, row, col, selectedToken, "player");
  if (gained > 0) {
    animateScoreCard("player");
    showToast(`🌟 YOU scored ${gained} SOS! Bonus turn! ⭐`);
  }

  renderStatus();
  if (game.over) return;

  // If player scored, they keep the turn — wait for their next click
  if (game.currentTurn === "player") return;

  // Otherwise, it's the AI's turn
  setTimeout(aiTurn, 500);
}

/* ═══════════════════════════════════════
   EVENT LISTENERS
════════════════════════════════════════ */
tokenButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedToken = btn.dataset.token;
    syncTokenButtons();
  });
});

boardEl.addEventListener("click", handleBoardClick);
startBtn.addEventListener("click",        () => startGame(false));
computerFirstBtn.addEventListener("click",() => startGame(true));
resetSameBtn.addEventListener("click",    () => startGame(false));
boardSizeEl.addEventListener("change",    () => startGame(false));

window.addEventListener("resize", () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

/* ── Boot ── */
startGame(false);
syncTokenButtons();
