// ===== UI MANAGER =====
const UI = (() => {
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
    if (window.AudioEngine) AudioEngine.click();
  }

  function showOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  }

  function hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  function toast(text, color = 'var(--blue-l)') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    t.style.background = color;
    t.style.color = '#fff';
    container.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  // Mapping Game player indices to HTML container IDs
  // Game.js PNAMES order: ['red', 'green', 'yellow', 'blue']
  // red:0 (BR), green:1 (BL), yellow:2 (TL), blue:3 (TR)
  const BOX_MAP = {
    0: 'player-box-1', // red -> Bottom Right
    1: 'player-box-0', // green -> Bottom Left
    2: 'player-box-2', // yellow -> Top Left
    3: 'player-box-3', // blue -> Top Right
  };

  function buildPlayerPanels(names, colors, count) {
    // Clear all boxes first
    for (let i = 0; i < 4; i++) {
        const container = document.getElementById(`player-box-${i}`);
        if (container) {
            container.innerHTML = '';
            container.style.visibility = 'hidden';
        }
    }

    for (let i = 0; i < count; i++) {
      const boxId = BOX_MAP[i];
      const container = document.getElementById(boxId);
      if (!container) continue;
      container.style.visibility = 'visible';

      const colorName = colors[i];
      const col = Board.COLORS[colorName];

      container.innerHTML = `
        <div class="player-box" id="box-${i}">
          <div class="player-info-side" style="background:${col.main}">
            <div class="player-icon-mini">📍</div>
          </div>
          <div class="player-dice-side">
            <div class="dice-box-mini" id="dice-box-${i}">
              <div class="dot-container" id="dot-container-${i}"></div>
            </div>
          </div>
          <div class="player-name-tag">${names[i]}</div>
          <div class="pp-home" id="pp-home-${i}" style="position:absolute; top:2px; right:5px; font-size:10px; color:rgba(255,255,255,0.7)">0/4</div>
        </div>
      `;

      // Wire click for the player's dice box
      const diceBox = document.getElementById(`dice-box-${i}`);
      diceBox.addEventListener('click', () => {
          if (i === Game.currentPlayer) Game.rollDice();
      });
    }
  }

  function updatePlayerPanels(currentPlayer, tokens, count) {
    for (let i = 0; i < count; i++) {
      const box = document.getElementById(`box-${i}`);
      if (box) box.classList.toggle('active', i === currentPlayer);
      
      const home = document.getElementById(`pp-home-${i}`);
      if (home) {
        const finished = Board.getHomeCount(tokens, i);
        home.textContent = `${finished}/4`;
      }
    }
  }

  function updateDiceUI(rolled, canMove, isHuman) {
    // We update all dice boxes, but only the current one matters
    for (let i = 0; i < 4; i++) {
        const diceBox = document.getElementById(`dice-box-${i}`);
        if (!diceBox) continue;
        
        const isCurrent = (i === Game.currentPlayer);
        diceBox.style.opacity = isCurrent ? '1' : '0.3';
        diceBox.style.pointerEvents = (isCurrent && isHuman && !rolled) ? 'all' : 'none';
        
        if (isCurrent) {
            diceBox.classList.toggle('pulse-dice', isHuman && !rolled);
        } else {
            diceBox.classList.remove('pulse-dice');
        }
    }
  }

  function showWin(name, color) {
    const title = document.getElementById('win-title');
    if (title) {
      title.textContent = `${name} Wins!`;
      title.style.color = Board.COLORS[color]?.main || 'var(--gold)';
    }
    showOverlay('overlay-win');
    createConfetti();
  }

  function createConfetti() {
    const container = document.getElementById('win-confetti');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#E53935', '#1E88E5', '#43A047', '#FDD835', '#fff'];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position:absolute;width:${6 + Math.random() * 8}px;height:${6 + Math.random() * 8}px;
        background:${colors[Math.floor(Math.random() * colors.length)]};
        left:${Math.random() * 100}%;top:${-10 - Math.random() * 20}%;
        border-radius:50%;
        animation:confettiFall ${2 + Math.random() * 2}s ease-in forwards;
        animation-delay:${Math.random() * 0.5}s;
      `;
      container.appendChild(c);
    }
  }

  return {
    showScreen, showOverlay, hideOverlay, toast,
    buildPlayerPanels, updatePlayerPanels, updateDiceUI,
    showWin
  };
})();
