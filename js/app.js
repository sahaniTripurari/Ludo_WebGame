// ===== APP CONTROLLER =====
(() => {
  // State
  let selectedMode = 'vs-computer';
  let vsOpponents = 3;
  let pnpPlayers = 2;
  let selectedToken = 'classic';
  let selectedDifficulty = 'easy';
  let playerName = 'Player';

  // ===== INIT =====
  Particles.init();

  // Load saved name
  try { playerName = localStorage.getItem('ludo_name') || 'Player'; } catch(e) {}
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = playerName;
  const settingsName = document.getElementById('settings-name');
  if (settingsName) settingsName.value = playerName;

  // ===== HOME SCREEN =====
  document.getElementById('btn-vs-computer').addEventListener('click', () => {
    selectedMode = 'vs-computer';
    UI.showScreen('screen-vs-computer');
    // Default selection
    document.querySelector('.vs-card[data-opponents="3"]').classList.add('selected');
  });

  document.getElementById('btn-pass-n-play').addEventListener('click', () => {
    selectedMode = 'pass-n-play';
    UI.showScreen('screen-pass-n-play');
  });

  // ===== VS COMPUTER SCREEN =====
  document.querySelectorAll('.vs-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.vs-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      vsOpponents = parseInt(card.dataset.opponents);
      AudioEngine.click();
    });
  });

  document.querySelectorAll('.difficulty-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.difficulty-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDifficulty = btn.dataset.difficulty;
      AudioEngine.click();
    });
  });

  document.getElementById('btn-next-vs').addEventListener('click', () => {
    AI.setDifficulty(selectedDifficulty);
    UI.showScreen('screen-tokens');
  });

  document.getElementById('btn-back-vs').addEventListener('click', () => UI.showScreen('screen-home'));

  // ===== PASS N PLAY SCREEN =====
  document.querySelectorAll('.player-count-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.player-count-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      pnpPlayers = parseInt(btn.dataset.players);
      AudioEngine.click();
    });
  });

  document.getElementById('btn-next-pnp').addEventListener('click', () => UI.showScreen('screen-tokens'));
  document.getElementById('btn-back-pnp').addEventListener('click', () => UI.showScreen('screen-home'));

  // ===== TOKEN SELECTION =====
  document.querySelectorAll('.token-option').forEach(opt => {
    opt.addEventListener('click', () => {
      if (opt.classList.contains('locked')) {
        UI.toast('🔒 Unlock this token by earning more coins!', '#E53935');
        return;
      }
      document.querySelectorAll('.token-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedToken = opt.dataset.token;
      AudioEngine.click();
    });
  });

  document.getElementById('btn-next-tokens').addEventListener('click', () => {
    Board.setTokenStyle(selectedToken);
    buildPlayerSetup();
    UI.showScreen('screen-players');
  });

  document.getElementById('btn-back-tokens').addEventListener('click', () => {
    UI.showScreen(selectedMode === 'vs-computer' ? 'screen-vs-computer' : 'screen-pass-n-play');
  });

  // ===== PLAYER SETUP =====
  const colorOptions = ['red', 'green', 'yellow', 'blue'];
  const colorLabels = { red: '🔴', green: '🟢', yellow: '🟡', blue: '🔵' };

  function buildPlayerSetup() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    const count = selectedMode === 'vs-computer' ? vsOpponents + 1 : pnpPlayers;

    for (let i = 0; i < count; i++) {
      const isHuman = selectedMode === 'pass-n-play' || i === 0;
      const color = colorOptions[i];
      const defaultName = isHuman
        ? (i === 0 ? playerName : `Player ${i + 1}`)
        : `Computer ${i}`;

      const card = document.createElement('div');
      card.className = 'player-card';
      card.dataset.index = i;
      card.innerHTML = `
        <div class="player-color-dot" style="background:${Board.COLORS[color].main}"></div>
        <div class="player-card-info">
          <input type="text" class="input-name player-name-input" value="${defaultName}" maxlength="12" data-index="${i}" ${!isHuman ? 'disabled' : ''}>
          <div class="player-card-type">${isHuman ? '👤 Human' : '🤖 AI'}</div>
        </div>
      `;
      list.appendChild(card);
    }
  }

  document.getElementById('btn-start-game').addEventListener('click', () => startGame());
  document.getElementById('btn-back-players').addEventListener('click', () => UI.showScreen('screen-tokens'));

  // ===== START GAME =====
  function startGame() {
    const count = selectedMode === 'vs-computer' ? vsOpponents + 1 : pnpPlayers;
    const names = [];
    const humans = [];

    document.querySelectorAll('.player-name-input').forEach((input, i) => {
      names.push(input.value.trim() || `Player ${i+1}`);
      if (selectedMode === 'pass-n-play' || i === 0) humans.push(i);
    });

    const colors = colorOptions.slice(0, count);

    Game.setup({
      mode: selectedMode,
      playerCount: count,
      humanPlayers: humans,
      names: names,
      colors: colors
    });

    // Build game UI
    UI.buildPlayerPanels(names, colors, count);
    UI.showScreen('screen-game');

    // Wire callbacks
    Game.onStateChange = () => {
      UI.updatePlayerPanels(Game.currentPlayer, Game.tokens, Game.playerCount);
      UI.updateDiceUI(Game.rolled, Game.canMove, Game.isHuman(Game.currentPlayer));
      UI.positionDice(Game.currentPlayer, Game.playerCount);
    };
    Game.onWin = (pIdx, name, color) => UI.showWin(name, color);
    Game.onToast = (text, color) => UI.toast(text, color);

    // Init game
    Game.init();
    UI.updatePlayerPanels(0, Game.tokens, count);
    UI.updateDiceUI(false, false, Game.isHuman(0));
    UI.positionDice(0, count);

    AudioEngine.startMusic();
  }

  // ===== GAME EVENT LISTENERS =====
  Board.canvas.addEventListener('click', (e) => Game.handleBoardClick(e));
  document.getElementById('dice-box').addEventListener('click', () => Game.rollDice());
  document.getElementById('btn-roll').addEventListener('click', () => Game.rollDice());

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); Game.rollDice(); }
    if (e.key >= '1' && e.key <= '4' && Game.canMove) {
      // Simulate token click by index
      Game.handleBoardClick({ clientX: -1, clientY: -1 }); // fallback
    }
  });

  // ===== IN-GAME MENU =====
  document.getElementById('btn-menu-toggle').addEventListener('click', () => UI.showOverlay('overlay-menu'));
  document.getElementById('btn-close-menu').addEventListener('click', () => UI.hideOverlay('overlay-menu'));

  document.getElementById('btn-restart-game').addEventListener('click', () => {
    UI.hideOverlay('overlay-menu');
    Game.init();
    UI.updatePlayerPanels(0, Game.tokens, Game.playerCount);
    UI.toast('Game restarted!', '#FF6F00');
  });

  document.getElementById('btn-exit-game').addEventListener('click', () => {
    UI.hideOverlay('overlay-menu');
    AudioEngine.stopMusic();
    UI.showScreen('screen-home');
  });

  // Bottom bar buttons
  document.getElementById('btn-remove-player')?.addEventListener('click', () => {
    UI.toast('Remove Player: Coming soon!', '#E53935');
  });
  document.getElementById('btn-exit-ingame')?.addEventListener('click', () => {
    AudioEngine.stopMusic();
    UI.showScreen('screen-home');
  });
  document.getElementById('btn-menu-bottom')?.addEventListener('click', () => {
    UI.showOverlay('overlay-menu');
  });

  // ===== WIN OVERLAY =====
  document.getElementById('btn-play-again').addEventListener('click', () => {
    UI.hideOverlay('overlay-win');
    Game.init();
    UI.updatePlayerPanels(0, Game.tokens, Game.playerCount);
  });

  document.getElementById('btn-go-home').addEventListener('click', () => {
    UI.hideOverlay('overlay-win');
    AudioEngine.stopMusic();
    UI.showScreen('screen-home');
  });

  // ===== SETTINGS =====
  document.getElementById('btn-settings').addEventListener('click', () => UI.showOverlay('overlay-settings'));
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    UI.hideOverlay('overlay-settings');
    // Save name
    const name = document.getElementById('settings-name').value.trim() || 'Player';
    playerName = name;
    try { localStorage.setItem('ludo_name', name); } catch(e) {}
    const pn = document.getElementById('profile-name');
    if (pn) pn.textContent = name;
    const av = document.querySelector('.avatar-letter');
    if (av) av.textContent = name.charAt(0).toUpperCase();
  });

  // Settings toggles
  document.getElementById('toggle-music').addEventListener('change', (e) => AudioEngine.toggleMusic(e.target.checked));
  document.getElementById('toggle-sfx').addEventListener('change', (e) => AudioEngine.toggleSfx(e.target.checked));

  // ===== SOUND BUTTONS =====
  function updateSoundIcons() {
    const on = AudioEngine.musicOn && AudioEngine.sfxOn;
    document.getElementById('sound-on-icon').style.display = on ? '' : 'none';
    document.getElementById('sound-off-icon').style.display = on ? 'none' : '';
    const gOn = document.getElementById('sound-game-on');
    const gOff = document.getElementById('sound-game-off');
    if (gOn) gOn.style.display = on ? '' : 'none';
    if (gOff) gOff.style.display = on ? 'none' : '';
  }

  document.getElementById('btn-sound').addEventListener('click', () => {
    const mute = AudioEngine.musicOn;
    AudioEngine.toggleMusic(!mute);
    AudioEngine.toggleSfx(!mute);
    document.getElementById('toggle-music').checked = !mute;
    document.getElementById('toggle-sfx').checked = !mute;
    updateSoundIcons();
  });

  const btnSoundGame = document.getElementById('btn-sound-game');
  if (btnSoundGame) {
    btnSoundGame.addEventListener('click', () => {
      const mute = AudioEngine.musicOn;
      AudioEngine.toggleMusic(!mute);
      AudioEngine.toggleSfx(!mute);
      updateSoundIcons();
    });
  }

  // Avatar letter
  const av = document.querySelector('.avatar-letter');
  if (av) av.textContent = playerName.charAt(0).toUpperCase();

})();
