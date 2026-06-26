'use strict';

// ── Constants ──────────────────────────────────────────────────────────────
const FLIP_MAP = { A:'B', B:'A', C:'D', D:'C', E:'F', F:'E', G:'H', H:'G' };
const THRESHOLDS = { 2:10, 3:9, 4:8, 5:7 };  // scored-card count to trigger endgame
const MAX_HAND = 4;
const SKIP_MAX_HAND = 6;
const SOLO_STRIKES_TO_LOSE = 4;
const SOLO_DECK_TARGET = 16;

// ── RNG ────────────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed | 0;
  return () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffleCopy(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Board ──────────────────────────────────────────────────────────────────
function makeBoard(rng) {
  const tiles = [
    rng() < 0.5 ? 'A' : 'B',   // ×1 tile
    rng() < 0.5 ? 'C' : 'D',   // ×2 tiles
    rng() < 0.5 ? 'C' : 'D',
    rng() < 0.5 ? 'E' : 'F',   // ×3 tiles
    rng() < 0.5 ? 'E' : 'F',
    rng() < 0.5 ? 'E' : 'F',
    rng() < 0.5 ? 'G' : 'H',   // ×3 tiles
    rng() < 0.5 ? 'G' : 'H',
    rng() < 0.5 ? 'G' : 'H',
  ];
  return shuffleCopy(tiles, rng);
}

function boardToGrid(board) {
  return [
    [board[0], board[1], board[2]],
    [board[3], board[4], board[5]],
    [board[6], board[7], board[8]],
  ];
}

// ── Adjacency ──────────────────────────────────────────────────────────────
function isAdjacent(i, j) {
  const ri = Math.floor(i / 3), ci = i % 3;
  const rj = Math.floor(j / 3), cj = j % 3;
  return (ri === rj && Math.abs(ci - cj) === 1) ||
         (ci === cj && Math.abs(ri - rj) === 1);
}

// ── Drawing ────────────────────────────────────────────────────────────────
// Draw up to `n` cards for `playerIdx`, capped at `maxHand`.
// Reshuffles the discard pile into the deck when the deck runs out.
function drawCards(state, playerIdx, n, maxHand = MAX_HAND) {
  let deck    = [...state.deck];
  let discard = [...state.discard];
  const player = { ...state.players[playerIdx], hand: [...state.players[playerIdx].hand] };

  let toDraw = Math.min(n, maxHand - player.hand.length);

  while (toDraw > 0) {
    if (deck.length === 0) {
      if (discard.length === 0) break;
      deck = shuffleCopy(discard, seededRng(Date.now() ^ (Math.random() * 0xFFFF | 0)));
      discard = [];
    }
    player.hand.push(deck.shift());
    toDraw--;
  }

  const players = state.players.map((p, i) => i === playerIdx ? player : p);
  return { ...state, deck, discard, players };
}

// ── Queries ────────────────────────────────────────────────────────────────

// Returns array of hand indices whose patterns currently match the board.
function getScorable(hand, board) {
  const grid = boardToGrid(board);
  return hand.reduce((acc, card, idx) => {
    if (patternMatchesBoard(card.pattern, grid)) acc.push(idx);
    return acc;
  }, []);
}

function canSkip(state) {
  const p = state.players[state.currentPlayerIndex];
  return !state.turnActed
    && !p.skippedLastTurn
    && p.hand.length < SKIP_MAX_HAND
    && (state.deck.length > 0 || state.discard.length > 0);
}

function canEndTurn(state) {
  if (state.turnActed) return true;
  // Edge case: hand is empty and no cards can be drawn or skipped — player must be able to end
  const p = state.players[state.currentPlayerIndex];
  return p.hand.length === 0 && !canSkip(state);
}

// ── Game initialisation ────────────────────────────────────────────────────

function initGame(settings) {
  // settings: { mode: 'multi'|'solo', players: [{name, isAI}], threshold?: number }
  const threshold = (settings.threshold != null)
    ? settings.threshold
    : settings.mode === 'solo' ? SOLO_DECK_TARGET : (THRESHOLDS[settings.players.length] || 10);
  const rng = seededRng(Date.now() & 0x7FFFFFFF);

  const sourceDeck = settings.mode === 'solo'
    ? shuffleCopy([...SOLO_DECK], rng)
    : shuffleCopy([...FULL_DECK], rng);

  const players = settings.players.map(p => ({
    name:            p.name,
    isAI:            p.isAI || false,
    hand:            [],
    scored:          [],
    score:           0,
    skippedLastTurn: false,
  }));

  let state = {
    mode:               settings.mode,
    board:              makeBoard(rng),
    deck:               sourceDeck,
    discard:            [],
    players,
    currentPlayerIndex: 0,
    phase:              'play',
    turnActed:          false,
    scoredThisTurn:     false,
    endgameTriggered:   false,
    endgameTurnsLeft:   0,
    strikes:            0,
    threshold,
  };

  // Deal MAX_HAND cards to each player
  for (let i = 0; i < players.length; i++) {
    state = drawCards(state, i, MAX_HAND);
  }

  return state;
}

// ── Actions ────────────────────────────────────────────────────────────────
// All actions return a new state object, or null if the action is invalid.

function doShift(state, discardCardIdx, tileIdx1, tileIdx2) {
  if (!isAdjacent(tileIdx1, tileIdx2)) return null;

  const player = state.players[state.currentPlayerIndex];
  if (discardCardIdx < 0 || discardCardIdx >= player.hand.length) return null;

  const discarded = player.hand[discardCardIdx];
  const newHand   = player.hand.filter((_, i) => i !== discardCardIdx);
  const newBoard  = [...state.board];
  [newBoard[tileIdx1], newBoard[tileIdx2]] = [newBoard[tileIdx2], newBoard[tileIdx1]];

  const players = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  return {
    ...state,
    board:      newBoard,
    discard:    [...state.discard, discarded],
    players,
    turnActed:  true,
  };
}

function doFlip(state, discardCardIdx, tileIdx) {
  const player = state.players[state.currentPlayerIndex];
  if (discardCardIdx < 0 || discardCardIdx >= player.hand.length) return null;

  const discarded = player.hand[discardCardIdx];
  const newHand   = player.hand.filter((_, i) => i !== discardCardIdx);
  const newBoard  = [...state.board];
  newBoard[tileIdx] = FLIP_MAP[newBoard[tileIdx]];

  const players = state.players.map((p, i) =>
    i === state.currentPlayerIndex ? { ...p, hand: newHand } : p
  );

  return {
    ...state,
    board:     newBoard,
    discard:   [...state.discard, discarded],
    players,
    turnActed: true,
  };
}

function doScore(state, cardIdx) {
  const player = state.players[state.currentPlayerIndex];
  if (cardIdx < 0 || cardIdx >= player.hand.length) return null;

  const card = player.hand[cardIdx];

  // Guard: verify match (UI should prevent invalid calls, but be safe)
  if (!patternMatchesBoard(card.pattern, boardToGrid(state.board))) return null;

  const newHand   = player.hand.filter((_, i) => i !== cardIdx);
  const newScored = [...player.scored, card];
  const newScore  = newScored.reduce((sum, c) => sum + c.points, 0);

  const players = state.players.map((p, i) =>
    i === state.currentPlayerIndex
      ? { ...p, hand: newHand, scored: newScored, score: newScore }
      : p
  );

  // Check multiplayer endgame trigger
  let endgameTriggered = state.endgameTriggered;
  let endgameTurnsLeft = state.endgameTurnsLeft;
  if (state.mode === 'multi' && !endgameTriggered) {
    if (newScored.length >= state.threshold) {
      endgameTriggered = true;
      // Players remaining in this round after the current player
      endgameTurnsLeft = state.players.length - 1 - state.currentPlayerIndex;
    }
  }

  // Check solo win (scoring all 16 cards)
  let phase = state.phase;
  if (state.mode === 'solo' && newScored.length >= state.threshold) {
    phase = 'end';
  }

  return {
    ...state,
    players,
    turnActed:       true,
    scoredThisTurn:  true,
    endgameTriggered,
    endgameTurnsLeft,
    phase,
  };
}

function doSkip(state) {
  if (!canSkip(state)) return null;

  const idx = state.currentPlayerIndex;
  const canDraw = SKIP_MAX_HAND - state.players[idx].hand.length;
  let next = drawCards(state, idx, Math.min(2, canDraw), SKIP_MAX_HAND);

  next = {
    ...next,
    players: next.players.map((p, i) =>
      i === idx ? { ...p, skippedLastTurn: true } : p
    ),
    turnActed:      true,
    scoredThisTurn: false,
  };

  return _advanceTurn(next, true);
}

function doEndTurn(state) {
  if (!canEndTurn(state)) return null;

  const idx = state.currentPlayerIndex;
  let next = { ...state };

  // Solo: award a strike if the player didn't score this turn
  if (state.mode === 'solo' && !state.scoredThisTurn) {
    next = { ...next, strikes: next.strikes + 1 };
  }

  // Clear the skipped flag for this player
  next = {
    ...next,
    players: next.players.map((p, i) =>
      i === idx ? { ...p, skippedLastTurn: false } : p
    ),
  };

  return _advanceTurn(next, false);
}

// ── Internal: advance to the next turn ────────────────────────────────────
function _advanceTurn(state, fromSkip) {
  const idx = state.currentPlayerIndex;

  // Draw back to MAX_HAND unless this was a skip (skip already drew cards)
  let next = fromSkip ? state : drawCards(state, idx, MAX_HAND, MAX_HAND);

  // Evaluate end conditions
  let phase = next.phase;

  if (next.mode === 'solo') {
    if (next.strikes >= SOLO_STRIKES_TO_LOSE)              phase = 'end';
    if (next.players[0].scored.length >= next.threshold)   phase = 'end';
  }

  if (next.mode === 'multi' && next.endgameTriggered && next.endgameTurnsLeft <= 0) {
    phase = 'end';
  }

  if (phase === 'end') {
    return { ...next, phase: 'end' };
  }

  // Decrement endgame countdown and advance player index
  const endgameTurnsLeft = next.endgameTriggered
    ? next.endgameTurnsLeft - 1
    : next.endgameTurnsLeft;

  const nextIdx = (idx + 1) % next.players.length;

  return {
    ...next,
    currentPlayerIndex: nextIdx,
    turnActed:          false,
    scoredThisTurn:     false,
    phase,
    endgameTurnsLeft,
  };
}

// ── Results ────────────────────────────────────────────────────────────────

function getResults(state) {
  if (state.mode === 'solo') {
    const player = state.players[0];
    return {
      mode:    'solo',
      player,
      won:     player.scored.length >= state.threshold,
      strikes: state.strikes,
    };
  }

  // Multiplayer: apply +3 bonus to player with the most 1-pt cards (no ties)
  const players = state.players.map(p => ({ ...p }));
  const onePtCounts = players.map(p => p.scored.filter(c => c.points === 1).length);
  const maxOnePt = Math.max(...onePtCounts);

  if (maxOnePt > 0) {
    const bonusCount = onePtCounts.filter(n => n === maxOnePt).length;
    if (bonusCount === 1) {
      const i = onePtCounts.indexOf(maxOnePt);
      players[i] = { ...players[i], score: players[i].score + 3, bonusWinner: true };
    }
  }

  const ranked = [...players].sort((a, b) => b.score - a.score);
  return { mode: 'multi', players: ranked };
}
