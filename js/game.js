// ===== GAME ENGINE =====
const Game = (() => {
  let playerCount = 4, currentPlayer = 0, diceVal = 0;
  let rolled = false, canMove = false, sixCount = 0, gameOver = false;
  let tokens = [], animating = false;
  let gameMode = 'vs-computer'; // 'vs-computer' or 'pass-n-play'
  let humanPlayers = [0]; // indices of human players
  let playerNames = ['You', 'Computer 2', 'Computer 3', 'Computer 4'];
  let playerColors = ['red', 'green', 'yellow', 'blue'];
  let onStateChange = null, onWin = null, onToast = null;

  function setup(config) {
    gameMode = config.mode || 'vs-computer';
    playerCount = config.playerCount || 4;
    humanPlayers = config.humanPlayers || [0];
    playerNames = config.names || ['You', 'Computer 2', 'Computer 3', 'Computer 4'];
    playerColors = config.colors || Board.PNAMES.slice(0, playerCount);
  }

  function init() {
    tokens = [];
    for (let p = 0; p < playerCount; p++) tokens.push([-1, -1, -1, -1]);
    currentPlayer = 0; diceVal = 0; rolled = false;
    canMove = false; sixCount = 0; gameOver = false; animating = false;
    redraw();
    renderDice(0);
    updateTurn();
    if (!isHuman(currentPlayer)) {
      setTimeout(() => rollDice(), 800);
    }
  }

  function isHuman(pIdx) { return humanPlayers.includes(pIdx); }

  function getMovableTokens() {
    const movable = [];
    for (let t = 0; t < 4; t++) {
      const p = tokens[currentPlayer][t];
      if (p === -1) { if (diceVal === 6) movable.push(t); }
      else if (p < 56 && p + diceVal <= 56) movable.push(t);
    }
    return movable;
  }

  function rollDice() {
    if (rolled || gameOver || animating) return;
    diceVal = Math.floor(Math.random() * 6) + 1;
    rolled = true;
    AudioEngine.diceRoll();

    const diceBox = document.getElementById('dice-box');
    diceBox.classList.remove('pulse-dice');
    diceBox.classList.add('rolling');

    let count = 0;
    const interval = setInterval(() => {
      renderDice(Math.floor(Math.random()*6)+1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        diceBox.classList.remove('rolling');
        renderDice(diceVal);
        afterRoll();
      }
    }, 60);
  }

  function afterRoll() {
    if (diceVal === 6) sixCount++; else sixCount = 0;
    if (sixCount >= 3) {
      showTurn("Three 6's! Turn forfeited.");
      sixCount = 0;
      setTimeout(() => nextTurn(), 1200);
      return;
    }
    const moves = getMovableTokens();
    if (moves.length === 0) {
      showTurn(diceVal === 6 ? "No moves. Roll again!" : "No valid moves.");
      setTimeout(() => {
        if (diceVal === 6) {
          rolled = false; renderDice(0); pulseDice();
          if (onStateChange) onStateChange();
          if (!isHuman(currentPlayer)) setTimeout(() => rollDice(), 800);
        } else nextTurn();
      }, 900);
      return;
    }
    if (!isHuman(currentPlayer)) {
      setTimeout(() => aiMove(moves), 600);
      return;
    }
    if (moves.length === 1) { moveToken(moves[0]); return; }
    canMove = true;
    showTurn("Select a token to move!");
    redraw();
  }

  function aiMove(moves) {
    const best = AI.pickMove(moves, tokens, currentPlayer, playerCount, diceVal);
    moveToken(best);
  }

  function moveToken(tIdx) {
    canMove = false; animating = true;
    const pIdx = currentPlayer, color = Board.PNAMES[pIdx], prog = tokens[pIdx][tIdx];

    if (prog === -1 && diceVal === 6) {
      tokens[pIdx][tIdx] = 0;
      checkCapture(pIdx, tIdx); redraw();
      AudioEngine.tokenEnter();
      animating = false; rolled = false;
      showTurn(isHuman(pIdx) ? "Token entered! 🎲 Roll again!" : `${playerNames[pIdx]} enters!`);
      renderDice(0);
      if (onStateChange) onStateChange();
      if (isHuman(pIdx)) pulseDice();
      if (!isHuman(pIdx)) setTimeout(() => rollDice(), 800);
      return;
    }

    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      tokens[pIdx][tIdx] = prog + step;
      AudioEngine.tokenMove();
      redraw();
      if (step >= diceVal) {
        clearInterval(stepInterval);
        const newProg = tokens[pIdx][tIdx];

        if (newProg === 56) {
          AudioEngine.tokenHome();
          if (onToast) onToast(`${playerNames[pIdx]} token finished!`, Board.COLORS[color].main);
          if (checkWin(pIdx)) { animating = false; return; }
          animating = false; rolled = false;
          showTurn(isHuman(pIdx) ? "Token home! 🎉 Roll again!" : `${playerNames[pIdx]} token home!`);
          renderDice(0); redraw();
          if (onStateChange) onStateChange();
          if (isHuman(pIdx)) pulseDice();
          if (!isHuman(pIdx)) setTimeout(() => rollDice(), 800);
          return;
        }

        const captured = checkCapture(pIdx, tIdx);
        redraw(); animating = false;

        if (diceVal === 6 || captured) {
          rolled = false;
          const msg = diceVal === 6 ? "Rolled 6" : "Captured";
          showTurn(isHuman(pIdx) ? `${msg}! 🎲 Roll again!` : `${msg} — bonus turn!`);
          renderDice(0);
          if (onStateChange) onStateChange();
          if (isHuman(pIdx)) pulseDice();
          if (!isHuman(pIdx)) setTimeout(() => rollDice(), 800);
        } else {
          setTimeout(() => nextTurn(), 400);
        }
      }
    }, 110);
  }

  function checkCapture(pIdx, tIdx) {
    const prog = tokens[pIdx][tIdx];
    if (prog < 0 || prog >= 51) return false;
    const color = Board.PNAMES[pIdx], absPos = (Board.START_POS[color]+prog) % 52;
    if (Board.SAFE_POS.has(absPos)) return false;
    let captured = false;
    for (let op = 0; op < playerCount; op++) {
      if (op === pIdx) continue;
      for (let ot = 0; ot < 4; ot++) {
        const oP = tokens[op][ot];
        if (oP < 0 || oP >= 51) continue;
        if ((Board.START_POS[Board.PNAMES[op]]+oP)%52 === absPos) {
          tokens[op][ot] = -1; captured = true;
          AudioEngine.capture();
          if (onToast) onToast(`${playerNames[pIdx]} captured ${playerNames[op]}!`, Board.COLORS[color].main);
        }
      }
    }
    return captured;
  }

  function checkWin(pIdx) {
    if (tokens[pIdx].every(p => p === 56)) {
      gameOver = true;
      AudioEngine.win();
      if (onWin) onWin(pIdx, playerNames[pIdx], Board.PNAMES[pIdx]);
      return true;
    }
    return false;
  }

  function nextTurn() {
    currentPlayer = (currentPlayer + 1) % playerCount;
    rolled = false; canMove = false; sixCount = 0; diceVal = 0;
    renderDice(0);
    updateTurn();
    if (onStateChange) onStateChange();
    redraw();
    if (!isHuman(currentPlayer)) setTimeout(() => rollDice(), 700);
  }

  function updateTurn() {
    const name = playerNames[currentPlayer];
    const msg = isHuman(currentPlayer)
      ? (gameMode === 'pass-n-play' ? `${name}'s turn — Roll!` : "Your turn — Roll the dice!")
      : `${name}'s turn...`;
    showTurn(msg);
    if (isHuman(currentPlayer) && !rolled) pulseDice();
  }

  function showTurn(text) {
    const el = document.getElementById('hud-turn-text');
    if (el) el.textContent = text;
    const dot = document.getElementById('hud-turn-dot');
    if (dot) {
      const col = Board.COLORS[Board.PNAMES[currentPlayer]];
      dot.style.background = col.main;
      dot.style.boxShadow = `0 0 10px ${col.main}`;
    }
  }

  function redraw() {
    Board.draw(tokens, playerCount, currentPlayer, canMove, rolled, getMovableTokens);
  }

  function renderDice(val) {
    const container = document.getElementById('dot-container');
    if (!container) return;
    container.innerHTML = '';
    container.className = 'dot-container';
    if (val < 1 || val > 6) {
      container.textContent = '?';
      container.style.cssText = 'font-size:1.5rem;font-weight:800;color:#999;display:flex;align-items:center;justify-content:center;';
      return;
    }
    container.style.cssText = '';
    container.classList.add('dots-' + val);
    for (let i = 0; i < val; i++) { const d = document.createElement('div'); d.className = 'dice-dot'; container.appendChild(d); }
  }

  function pulseDice() {
    const diceBox = document.getElementById('dice-box');
    if (!diceBox) return;
    diceBox.classList.remove('pulse-dice');
    void diceBox.offsetWidth;
    diceBox.classList.add('pulse-dice');
  }

  function handleBoardClick(e) {
    if (!canMove || !rolled || gameOver || animating) return;
    const rect = Board.canvas.getBoundingClientRect();
    const scaleX = Board.S/rect.width, scaleY = Board.S/rect.height;
    const mx = (e.clientX-rect.left)*scaleX, my = (e.clientY-rect.top)*scaleY;
    const hits = Board.getCellFromClick(mx, my, currentPlayer, tokens);
    const movable = getMovableTokens();
    const valid = hits.filter(t => movable.includes(t));
    if (valid.length > 0) moveToken(valid[0]);
  }

  return {
    setup, init, rollDice, handleBoardClick, redraw,
    get currentPlayer() { return currentPlayer; },
    get playerCount() { return playerCount; },
    get tokens() { return tokens; },
    get rolled() { return rolled; },
    get canMove() { return canMove; },
    get gameOver() { return gameOver; },
    get diceVal() { return diceVal; },
    get playerNames() { return playerNames; },
    get gameMode() { return gameMode; },
    isHuman,
    set onStateChange(fn) { onStateChange = fn; },
    set onWin(fn) { onWin = fn; },
    set onToast(fn) { onToast = fn; },
  };
})();
