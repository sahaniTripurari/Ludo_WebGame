// ===== AI ENGINE =====
const AI = (() => {
  let difficulty = 'easy'; // easy, medium, hard

  function setDifficulty(d) { difficulty = d; }

  function pickMove(moves, tokens, currentPlayer, playerCount, diceVal) {
    if (moves.length === 1) return moves[0];
    // Random factor based on difficulty
    if (difficulty === 'easy' && Math.random() < 0.35) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    const pIdx = currentPlayer;
    const color = Board.PNAMES[pIdx];
    let best = moves[0], bestScore = -Infinity;

    for (const t of moves) {
      let score = 0;
      const prog = tokens[pIdx][t];

      if (prog === -1) {
        // Leaving home base
        score = difficulty === 'hard' ? 15 : 10;
      } else {
        const newProg = prog + diceVal;

        if (newProg === 56) {
          // Reaching final home - highest priority
          score = 200;
        } else if (newProg > 50 && newProg < 56) {
          // In home column - safe, good progress
          score = 60 + newProg;
        } else if (newProg <= 50) {
          const absPos = (Board.START_POS[color] + newProg) % 52;

          // Check for capture opportunity
          for (let op = 0; op < playerCount; op++) {
            if (op === pIdx) continue;
            for (let ot = 0; ot < 4; ot++) {
              const oP = tokens[op][ot];
              if (oP < 0 || oP >= 51) continue;
              const oppAbs = (Board.START_POS[Board.PNAMES[op]] + oP) % 52;

              if (oppAbs === absPos && !Board.SAFE_POS.has(absPos)) {
                // Capture!
                score += difficulty === 'hard' ? 100 : 80;
                // Extra bonus for capturing advanced tokens
                if (difficulty === 'hard') score += oP;
              }
            }
          }

          // Check if we're in danger at current position (hard mode)
          if (difficulty === 'hard' || difficulty === 'medium') {
            const curAbs = (Board.START_POS[color] + prog) % 52;
            let inDanger = false;
            for (let op = 0; op < playerCount; op++) {
              if (op === pIdx) continue;
              for (let ot = 0; ot < 4; ot++) {
                const oP = tokens[op][ot];
                if (oP < 0 || oP >= 51) continue;
                const oppAbs = (Board.START_POS[Board.PNAMES[op]] + oP) % 52;
                // Check if opponent can reach us in 1-6 moves
                for (let d = 1; d <= 6; d++) {
                  if ((oppAbs + d) % 52 === curAbs) { inDanger = true; break; }
                }
              }
              if (inDanger) break;
            }
            if (inDanger) score += 25; // Incentive to move away from danger
          }

          // Landing on safe spot bonus
          if (Board.SAFE_POS.has(absPos)) score += difficulty === 'hard' ? 12 : 5;

          // Progress bonus
          score += newProg * (difficulty === 'hard' ? 1.2 : 1);

          // Check if destination is dangerous (hard mode penalty)
          if (difficulty === 'hard') {
            const destDanger = checkDanger(absPos, pIdx, tokens, playerCount);
            if (destDanger && !Board.SAFE_POS.has(absPos)) score -= 15;
          }
        }
      }

      if (score > bestScore) { bestScore = score; best = t; }
    }
    return best;
  }

  function checkDanger(absPos, pIdx, tokens, playerCount) {
    for (let op = 0; op < playerCount; op++) {
      if (op === pIdx) continue;
      for (let ot = 0; ot < 4; ot++) {
        const oP = tokens[op][ot];
        if (oP < 0 || oP >= 51) continue;
        const oppAbs = (Board.START_POS[Board.PNAMES[op]] + oP) % 52;
        for (let d = 1; d <= 6; d++) {
          if ((oppAbs + d) % 52 === absPos) return true;
        }
      }
    }
    return false;
  }

  return { pickMove, setDifficulty, get difficulty() { return difficulty; } };
})();
