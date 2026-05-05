// ===== UI MANAGER =====
const UI = (() => {
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    if (screen) screen.classList.add('active');
    AudioEngine.click();
  }

  function showOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('show');
  }

  function hideOverlay(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  }

  function toast(text, color = '#43A047') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    t.style.background = color;
    container.appendChild(t);
    setTimeout(() => { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  }

  function buildPlayerPanels(names, colors, count) {
    const container = document.getElementById('player-panels');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const pp = document.createElement('div');
      pp.className = 'pp';
      pp.id = `pp-${i}`;
      pp.innerHTML = `
        <span class="pp-dot" style="background:${Board.COLORS[colors[i]].main}"></span>
        <span class="pp-name">${names[i]}</span>
        <span class="pp-home" id="pp-home-${i}">🏠 0/4</span>
      `;
      container.appendChild(pp);
    }
  }

  function updatePlayerPanels(currentPlayer, tokens, count) {
    for (let i = 0; i < count; i++) {
      const pp = document.getElementById(`pp-${i}`);
      if (pp) pp.classList.toggle('current', i === currentPlayer);
      const home = document.getElementById(`pp-home-${i}`);
      if (home) {
        const finished = Board.getHomeCount(tokens, i);
        home.textContent = `🏠 ${finished}/4`;
      }
    }
  }

  function updateDiceUI(rolled, canMove, isHuman) {
    const btnRoll = document.getElementById('btn-roll');
    const diceBox = document.getElementById('dice-box');
    const diceLabel = document.getElementById('dice-label');
    if (btnRoll) btnRoll.disabled = rolled || !isHuman;
    if (diceBox) diceBox.classList.toggle('disabled', (rolled && !canMove) || !isHuman);
    if (diceLabel) diceLabel.textContent = isHuman ? (rolled ? '' : 'Tap to roll') : '';
  }

  // Position dice near current player's corner
  function positionDice(currentPlayer, playerCount) {
    const dc = document.getElementById('dice-container');
    if (!dc) return;
    // Position dice at center-right of board by default
    const positions = {
      0: { bottom: '15%', right: '8%', top: 'auto', left: 'auto' },   // red - bottom right
      1: { bottom: '15%', right: 'auto', top: 'auto', left: '8%' },   // green - bottom left
      2: { bottom: 'auto', right: 'auto', top: '15%', left: '8%' },   // yellow - top left
      3: { bottom: 'auto', right: '8%', top: '15%', left: 'auto' },   // blue - top right
    };
    const pos = positions[currentPlayer] || positions[0];
    dc.style.top = pos.top;
    dc.style.bottom = pos.bottom;
    dc.style.left = pos.left;
    dc.style.right = pos.right;
  }

  function showWin(name, color) {
    const title = document.getElementById('win-title');
    const sub = document.getElementById('win-subtitle');
    if (title) {
      title.textContent = `🎉 ${name} Wins!`;
      title.style.setProperty('--win-color', Board.COLORS[color]?.main || '#FDD835');
    }
    if (sub) sub.textContent = 'What an amazing game!';
    showOverlay('overlay-win');
    // Confetti effect
    createConfetti();
  }

  function createConfetti() {
    const container = document.getElementById('win-confetti');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#E53935','#1E88E5','#43A047','#FDD835','#FF6F00','#AB47BC','#fff'];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position:absolute;width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
        background:${colors[Math.floor(Math.random()*colors.length)]};
        left:${Math.random()*100}%;top:${-10-Math.random()*20}%;
        border-radius:${Math.random()>0.5?'50%':'2px'};
        animation:confettiFall ${1.5+Math.random()*2}s ease-in forwards;
        animation-delay:${Math.random()*0.5}s;opacity:0.9;
      `;
      container.appendChild(c);
    }
    // Add confetti keyframes if not present
    if (!document.getElementById('confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(400px) rotate(${360+Math.random()*360}deg); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  return {
    showScreen, showOverlay, hideOverlay, toast,
    buildPlayerPanels, updatePlayerPanels, updateDiceUI,
    positionDice, showWin
  };
})();
