// ===== BOARD RENDERER =====
const Board = (() => {
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const S = 660, C = S / 15;

  const COLORS = {
    yellow: { main:'#FDD835', light:'#FFF9C4', dark:'#F9A825', fill:'#FDD835', home:'#FFFDE7' },
    blue:   { main:'#1E88E5', light:'#BBDEFB', dark:'#1565C0', fill:'#1E88E5', home:'#E3F2FD' },
    green:  { main:'#43A047', light:'#C8E6C9', dark:'#2E7D32', fill:'#43A047', home:'#E8F5E9' },
    red:    { main:'#E53935', light:'#FFCDD2', dark:'#C62828', fill:'#E53935', home:'#FFEBEE' },
  };

  const MAIN_PATH = [
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],[0,8],
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],[8,14],
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],[14,6],
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0]
  ];

  const START_POS = { red:27, green:40, yellow:1, blue:14 };
  const HOME_COL = {
    yellow:[[7,1],[7,2],[7,3],[7,4],[7,5]],
    blue:  [[1,7],[2,7],[3,7],[4,7],[5,7]],
    red:   [[7,13],[7,12],[7,11],[7,10],[7,9]],
    green: [[13,7],[12,7],[11,7],[10,7],[9,7]],
  };
  const HOME_BASE = {
    yellow:[[1.5,1.5],[1.5,3.5],[3.5,1.5],[3.5,3.5]],
    blue:  [[1.5,10.5],[1.5,12.5],[3.5,10.5],[3.5,12.5]],
    green: [[10.5,1.5],[10.5,3.5],[12.5,1.5],[12.5,3.5]],
    red:   [[10.5,10.5],[10.5,12.5],[12.5,10.5],[12.5,12.5]],
  };
  const SAFE_POS = new Set([1,9,14,22,27,35,40,48]);
  const PNAMES = ['red','green','yellow','blue'];

  const COLOR_CELLS = {};
  for (const [col, si] of Object.entries(START_POS)) COLOR_CELLS[si] = col;

  // Token style from selection
  let tokenStyle = 'classic';

  function getTokenCoords(pIdx, tIdx, tokens) {
    const prog = tokens[pIdx][tIdx], color = PNAMES[pIdx];
    if (prog === -1) { const [r,c] = HOME_BASE[color][tIdx]; return [c*C, r*C]; }
    if (prog >= 56) return [7*C+C/2, 7*C+C/2];
    if (prog >= 51) { const [r,c] = HOME_COL[color][prog-51]; return [c*C+C/2, r*C+C/2]; }
    const absPos = (START_POS[color]+prog) % 52;
    const [r,c] = MAIN_PATH[absPos];
    return [c*C+C/2, r*C+C/2];
  }

  function getCellFromClick(x, y, currentPlayer, tokens) {
    const hits = [];
    for (let t = 0; t < 4; t++) {
      const [tx, ty] = getTokenCoords(currentPlayer, t, tokens);
      if (tokens[currentPlayer][t] === -1) {
        const [r,c] = HOME_BASE[PNAMES[currentPlayer]][t];
        const cx2 = c*C, cy2 = r*C;
        if (x >= cx2-C/2 && x <= cx2+C/2 && y >= cy2-C/2 && y <= cy2+C/2) hits.push(t);
      } else if (Math.hypot(x-tx, y-ty) < C*0.6) hits.push(t);
    }
    return hits;
  }

  function drawStar(x, y, size, color) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (i*4*Math.PI)/5 - Math.PI/2;
      ctx[i===0?'moveTo':'lineTo'](x+size*Math.cos(a), y+size*Math.sin(a));
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }

  function drawHomeBase(y, x, color) {
    const col = COLORS[color], pad = 2;
    ctx.fillStyle = col.fill;
    ctx.beginPath(); ctx.roundRect(x+pad, y+pad, 6*C-pad*2, 6*C-pad*2, 8); ctx.fill();
    ctx.strokeStyle = col.dark; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    const margin = C * 0.8;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.roundRect(x+margin, y+margin, 6*C-margin*2, 6*C-margin*2, 6); ctx.fill();
    ctx.strokeStyle = col.dark + '40'; ctx.stroke();
    HOME_BASE[color].forEach(([sr,sc]) => {
      ctx.beginPath(); ctx.arc(sc*C, sr*C, C*0.38, 0, Math.PI*2);
      ctx.fillStyle = col.fill + '30'; ctx.fill();
      ctx.strokeStyle = col.fill + '60'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;
    });
  }

  function drawCenter() {
    const cx2 = 7*C+C/2, cy2 = 7*C+C/2;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(6*C, 6*C, 3*C, 3*C);
    const tris = [
      { color: COLORS.blue.fill, pts:[[6*C,6*C],[9*C,6*C],[cx2,cy2]] },
      { color: COLORS.red.fill, pts:[[9*C,6*C],[9*C,9*C],[cx2,cy2]] },
      { color: COLORS.green.fill, pts:[[9*C,9*C],[6*C,9*C],[cx2,cy2]] },
      { color: COLORS.yellow.fill, pts:[[6*C,9*C],[6*C,6*C],[cx2,cy2]] },
    ];
    tris.forEach(({color, pts}) => {
      ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]); ctx.lineTo(pts[1][0],pts[1][1]); ctx.lineTo(pts[2][0],pts[2][1]);
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    });
    ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 1;
    ctx.strokeRect(6*C, 6*C, 3*C, 3*C);
  }

  function drawToken(x, y, color, glow) {
    const col = COLORS[color], r = C*0.35;
    ctx.beginPath(); ctx.arc(x+1, y+3, r, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill();
    if (glow) {
      ctx.beginPath(); ctx.arc(x, y, r+6, 0, Math.PI*2);
      ctx.fillStyle = col.main+'50'; ctx.fill();
      ctx.strokeStyle = col.main+'80'; ctx.lineWidth = 2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1;
    }
    ctx.beginPath(); ctx.arc(x, y, r+2, 0, Math.PI*2);
    ctx.fillStyle = '#FFFFFF'; ctx.fill();
    ctx.strokeStyle = col.dark; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 1;
    const g = ctx.createRadialGradient(x-2, y-3, 0, x, y, r);
    g.addColorStop(0, col.light); g.addColorStop(0.4, col.main); g.addColorStop(1, col.dark);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fillStyle = g; ctx.fill();
    // Token icon based on style
    const icons = { classic: null, crown: '👑', star: '⭐', diamond: '💎', fire: '🔥', rocket: '🚀' };
    const icon = icons[tokenStyle];
    if (icon) {
      ctx.font = `${r*0.8}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(icon, x, y+1);
    } else {
      ctx.beginPath(); ctx.arc(x, y, r*0.35, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x-r*0.2, y-r*0.25, r*0.18, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  }

  function stackOffsets(n) {
    if (n===1) return [[0,0]];
    if (n===2) return [[-7,0],[7,0]];
    if (n===3) return [[-7,-5],[7,-5],[0,7]];
    return [[-7,-7],[7,-7],[-7,7],[7,7]];
  }

  function draw(tokens, playerCount, currentPlayer, canMove, rolled, getMovable) {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = '#F5F5F5';
    ctx.beginPath(); ctx.roundRect(0,0,S,S,10); ctx.fill();
    ctx.strokeStyle = '#BDBDBD'; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 1;

    drawHomeBase(0, 0, 'yellow');
    drawHomeBase(0, 9*C, 'blue');
    drawHomeBase(9*C, 0, 'green');
    drawHomeBase(9*C, 9*C, 'red');

    for (let i = 0; i < 52; i++) {
      const [r,c] = MAIN_PATH[i];
      const x = c*C, y = r*C;
      let fillColor = '#FFFFFF';
      if (COLOR_CELLS[i]) fillColor = COLORS[COLOR_CELLS[i]].fill;
      else if (SAFE_POS.has(i)) fillColor = '#F5F5F5';
      ctx.fillStyle = fillColor;
      ctx.fillRect(x+0.5, y+0.5, C-1, C-1);
      ctx.strokeStyle = '#E0E0E0';
      ctx.strokeRect(x+0.5, y+0.5, C-1, C-1);
      if (SAFE_POS.has(i) && !COLOR_CELLS[i]) drawStar(x+C/2, y+C/2, 8, '#BDBDBD');
      if (COLOR_CELLS[i]) drawStar(x+C/2, y+C/2, 8, '#FFFFFF');
    }

    for (const [col, cells] of Object.entries(HOME_COL)) {
      cells.forEach(([r,c]) => {
        ctx.fillStyle = COLORS[col].fill;
        ctx.fillRect(c*C+0.5, r*C+0.5, C-1, C-1);
        ctx.strokeStyle = COLORS[col].dark + '60';
        ctx.strokeRect(c*C+0.5, r*C+0.5, C-1, C-1);
      });
    }

    // Direction arrows
    const arrows = [
      { pos:[6,0], text:'→', col:'#FDD835' },
      { pos:[0,8], text:'↓', col:'#1E88E5' },
      { pos:[8,14], text:'←', col:'#E53935' },
      { pos:[14,6], text:'↑', col:'#43A047' }
    ];
    ctx.font = 'bold 16px Outfit'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    arrows.forEach(a => {
      const [r,c] = a.pos;
      ctx.fillStyle = a.col;
      ctx.fillText(a.text, c*C+C/2, r*C+C/2);
    });

    drawCenter();

    // Draw tokens
    const posMap = {};
    for (let p = 0; p < playerCount; p++) {
      for (let t = 0; t < 4; t++) {
        if (tokens[p][t] >= 56) continue;
        const [x,y] = getTokenCoords(p, t, tokens);
        const key = `${Math.round(x)},${Math.round(y)}`;
        if (!posMap[key]) posMap[key] = [];
        posMap[key].push({p,t,x,y});
      }
    }
    const movable = (canMove && rolled) ? getMovable() : [];
    for (const key of Object.keys(posMap)) {
      const group = posMap[key];
      const offsets = stackOffsets(group.length);
      group.forEach((item, i) => {
        const isGlow = item.p === currentPlayer && canMove && movable.includes(item.t);
        drawToken(item.x+offsets[i][0], item.y+offsets[i][1], PNAMES[item.p], isGlow);
      });
    }

    // Animate highlight for movable tokens
    if (canMove && rolled && movable.length > 0) {
      requestAnimationFrame(() => draw(tokens, playerCount, currentPlayer, canMove, rolled, getMovable));
    }
  }

  // Count finished tokens per player
  function getHomeCount(tokens, pIdx) {
    return tokens[pIdx].filter(p => p >= 56).length;
  }

  return {
    draw, getTokenCoords, getCellFromClick,
    MAIN_PATH, START_POS, HOME_COL, HOME_BASE, SAFE_POS, PNAMES, COLORS, COLOR_CELLS,
    S, C, canvas, ctx, getHomeCount,
    setTokenStyle(s) { tokenStyle = s; }
  };
})();
