'use strict';

// ── UI state ───────────────────────────────────────────────────────────────
let _selectedCardIdx = null;   // hand index of selected card, or null
let _shiftSourceIdx  = null;   // tile index of primed tile, or null
let _animating       = false;  // blocks input during animations

// ── Utilities ──────────────────────────────────────────────────────────────
function _el(id)  { return document.getElementById(id); }
function _esc(s)  {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Initialise UI (called once per game start) ─────────────────────────────
function initUI(mode) {
  _selectedCardIdx = null;
  _shiftSourceIdx  = null;

  const p = mode === 'solo' ? 'solo-' : '';

  // Action buttons
  _el(p + 'btn-skip').addEventListener('click', _onSkip);
  _el(p + 'btn-undo').addEventListener('click', _onUndo);
  _el(p + 'btn-end').addEventListener('click',  _onEndTurn);

  // Board (event delegation — bound once, survives re-renders)
  const boardEl = _el(p + 'board');
  boardEl.addEventListener('click', e => {
    const tile = e.target.closest('[data-tile-idx]');
    if (tile) _handleTileClick(tile);
  });

  // Hands (event delegation)
  [p + 'hand', p + 'hand-mobile'].forEach(id => {
    const el = _el(id);
    if (el) el.addEventListener('click', _handleHandClick);
  });

  // Scores modal close (multiplayer only)
  if (mode === 'multi') {
    const closeBtn = document.querySelector('.scores-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    const modal = _el('scores-modal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  }
}

// ── Full render ────────────────────────────────────────────────────────────
function renderGame(state) {
  _renderBoard(state);
  _renderHand(state);
  _renderTopbar(state);
  _renderActionButtons(state);
  if (state.mode === 'multi') _renderScoresModal(state);
}

// ── Board ──────────────────────────────────────────────────────────────────
function _renderBoard(state) {
  const boardEl = _el((state.mode === 'solo' ? 'solo-' : '') + 'board');
  boardEl.innerHTML = state.board.map((side, i) => {
    const pending = i === _shiftSourceIdx ? ' tile-pending' : '';
    return `<div class="tile tile-${side}${pending}" data-tile-idx="${i}"></div>`;
  }).join('');
}

// ── Hand ───────────────────────────────────────────────────────────────────
function _renderHand(state) {
  const player   = state.players[state.currentPlayerIndex];
  const scorable = new Set(getScorable(player.hand, state.board));
  const p        = state.mode === 'solo' ? 'solo-' : '';

  const html = player.hand.map((card, idx) =>
    _cardHTML(card, idx, scorable.has(idx), idx === _selectedCardIdx)
  ).join('');

  [p + 'hand', p + 'hand-mobile'].forEach(id => {
    const el = _el(id);
    if (el) el.innerHTML = html;
  });

  const labelEl = _el(p + 'hand-label');
  if (labelEl) labelEl.textContent = `${player.name}'s Hand`;
}

function _cardHTML(card, idx, isScorableCard, isSelected) {
  const rows = card.pattern.split(',');
  const cols = rows[0].length;
  const cells = rows.flatMap(r => r.split('')).map(ch =>
    ch === '-'
      ? '<div class="pcell wc"></div>'
      : `<div class="pcell pc-${ch}"></div>`
  ).join('');

  const cls = ['pcard', isScorableCard && 'scorable', isSelected && 'selected']
    .filter(Boolean).join(' ');

  return `<div class="${cls}" data-card-idx="${idx}">
    <div class="pcard-top">
      <span class="pcard-pts">${card.points}</span>
      <button class="pcard-score-btn" data-score-idx="${idx}">SCORE</button>
    </div>
    <div class="pgrid" style="grid-template-columns:repeat(${cols},20px)">${cells}</div>
  </div>`;
}

// ── Topbar / info bar ──────────────────────────────────────────────────────
function _renderTopbar(state) {
  const player = state.players[state.currentPlayerIndex];

  if (state.mode === 'solo') {
    _el('solo-cp-name').textContent      = player.name;
    _el('solo-pb-name').textContent      = player.name;
    _el('solo-pb-progress').textContent  = `${player.scored.length} / ${state.threshold}`;
    _el('solo-pb-pts').textContent       = `${player.score} pts`;
    _el('solo-mib-player').textContent   = player.name;
    _el('solo-mib-fraction').textContent = `${player.scored.length} / ${state.threshold}`;
    _renderStrikes(state.strikes);
  } else {
    const threshold = state.threshold;
    _el('cp-name').textContent      = player.name;
    _el('mib-mode').textContent     = `${state.players.length}-Player`;
    _el('mib-player').textContent   = player.name;
    _el('mib-fraction').textContent = `${player.scored.length} / ${threshold}`;
    _renderPlayerBlocks(state);
  }
}

function _renderPlayerBlocks(state) {
  const threshold = state.threshold;
  _el('player-blocks').innerHTML = state.players.map((p, i) => `
    <div class="player-block${i === state.currentPlayerIndex ? ' active' : ''}">
      <div class="pb-name">${_esc(p.name)}</div>
      <div class="pb-progress">${p.scored.length} / ${threshold}</div>
      <div class="pb-pts">${p.score} pts</div>
    </div>`).join('');
}

function _renderStrikes(n) {
  // Desktop topbar pips
  for (let i = 1; i <= 4; i++) {
    const pip = _el(`spip${i}`);
    if (pip) pip.classList.toggle('on', i <= n);
  }
  // Mobile info bar pips
  const mibStrikes = _el('solo-mib-strikes');
  if (mibStrikes) {
    mibStrikes.querySelectorAll('.strike-pip').forEach((pip, i) => {
      pip.classList.toggle('on', i < n);
    });
  }
}

function _renderScoresModal(state) {
  const threshold = state.threshold;
  const inner = document.querySelector('.scores-modal-inner');
  // Preserve header markup, replace player rows
  const header = inner.querySelector('.scores-modal-header');
  while (inner.lastChild !== header) inner.removeChild(inner.lastChild);
  inner.insertAdjacentHTML('beforeend',
    state.players.map((p, i) => `
      <div class="player-block${i === state.currentPlayerIndex ? ' active' : ''}">
        <div>
          <div class="pb-name">${_esc(p.name)}</div>
          <div class="pb-progress">${p.scored.length} / ${threshold}</div>
          <div class="pb-pts">${p.score} pts</div>
        </div>
      </div>`).join('')
  );
}

// ── Action buttons ─────────────────────────────────────────────────────────
function _renderActionButtons(state) {
  const p = state.mode === 'solo' ? 'solo-' : '';
  _el(p + 'btn-skip').disabled = !canSkip(state);
  _el(p + 'btn-undo').disabled = !canUndo();
  _el(p + 'btn-end').disabled  = !canEndTurn(state);
  _el(p + 'btn-hint').disabled = true;
}

// ── Results screen ─────────────────────────────────────────────────────────
function renderResults(results) {
  if (results.mode === 'solo') {
    _el('results-trophy').textContent      = results.won ? '🏆' : '💀';
    _el('results-crown-label').textContent = results.won ? 'Winner' : 'Eliminated';
    _el('results-winner-name').textContent = results.player.name;
    _el('results-winner-sub').textContent  = results.won
      ? `${results.player.score} pts · ${results.player.scored.length} cards scored`
      : `${results.strikes} strikes · game over`;
    _el('results-bonus').style.display = 'none';
    _el('results-tbody').innerHTML = `
      <tr${results.won ? ' class="row-winner"' : ''}>
        <td><span class="rank-badge${results.won ? ' r1' : ''}">${results.won ? 1 : '–'}</span></td>
        <td>${_esc(results.player.name)}</td>
        <td>${results.player.score} pts</td>
        <td>${results.player.scored.length}</td>
      </tr>`;
  } else {
    const winner = results.players[0];
    _el('results-trophy').textContent      = '🏆';
    _el('results-crown-label').textContent = 'Winner';
    _el('results-winner-name').textContent = winner.name;
    _el('results-winner-sub').textContent  = `${winner.score} pts · ${winner.scored.length} cards`;

    const bonusWinner = results.players.find(p => p.bonusWinner);
    const bonusEl = _el('results-bonus');
    if (bonusWinner) {
      bonusEl.textContent   = `${_esc(bonusWinner.name)} earns the +3 bonus for most 1-point cards.`;
      bonusEl.style.display = '';
    } else {
      bonusEl.style.display = 'none';
    }

    const rankCls = ['r1', 'r2'];
    _el('results-tbody').innerHTML = results.players.map((p, i) => `
      <tr${i === 0 ? ' class="row-winner"' : ''}>
        <td><span class="rank-badge ${rankCls[i] || ''}">${i + 1}</span></td>
        <td>${_esc(p.name)}${p.bonusWinner ? ' ★' : ''}</td>
        <td>${p.score} pts</td>
        <td>${p.scored.length}</td>
      </tr>`).join('');
  }
}

// ── Pass-and-play overlay ──────────────────────────────────────────────────
function showPassOverlay(playerName, onReady) {
  const overlay = document.createElement('div');
  overlay.id = 'pass-overlay';
  overlay.innerHTML = `
    <div class="pass-overlay-inner">
      <div class="pass-overlay-label">Pass to</div>
      <div class="pass-overlay-name">${_esc(playerName)}</div>
      <button class="pass-overlay-btn">I'm ready</button>
    </div>`;
  document.body.appendChild(overlay);

  // Fade in (double rAF ensures transition picks up from opacity:0)
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('pass-overlay-in')));

  overlay.querySelector('.pass-overlay-btn').addEventListener('click', () => {
    overlay.classList.remove('pass-overlay-in');
    setTimeout(() => { overlay.remove(); onReady(); }, 290);
  });
}

// ── Action handlers ────────────────────────────────────────────────────────
function _onSkip() {
  const s = getState();
  pushHistory();
  const next = doSkip(s);
  if (!next) { popHistory(); return; }
  _clearInteraction();
  setState(next);
  _afterAction(next);
  if (next.mode === 'solo' && next.strikes > s.strikes) animateStrikeFlash();
}

function _onEndTurn() {
  const s = getState();
  pushHistory();
  try {
    const next = doEndTurn(s);
    if (!next) { popHistory(); return; }
    _clearInteraction();
    setState(next);
    _afterAction(next);
    if (next.mode === 'solo' && next.strikes > s.strikes) animateStrikeFlash();
  } catch(e) {
    console.error('[_onEndTurn]', e);
    popHistory();
  }
}

function _onUndo() {
  if (!popHistory()) return;
  _clearInteraction();
  renderGame(getState());
}

function _onScore(cardIdx) {
  if (_animating) return;
  const s = getState();
  pushHistory();
  const next = doScore(s, cardIdx);
  if (!next) { popHistory(); return; }

  const cardEl = document.querySelector(`[data-card-idx="${cardIdx}"]`);
  const pts    = s.players[s.currentPlayerIndex].hand[cardIdx].points;

  if (_selectedCardIdx === cardIdx) {
    _selectedCardIdx = null;
  } else if (_selectedCardIdx !== null && _selectedCardIdx > cardIdx) {
    _selectedCardIdx--;  // hand shifted down; track new index of selected card
  }
  _shiftSourceIdx = null;

  _animating = true;
  (cardEl ? animateScore(cardEl, pts) : Promise.resolve()).then(() => {
    _animating = false;
    setState(next);
    renderGame(next);
    if (next.phase === 'end') _triggerEndGame(next);
  });
}

// After any turn-ending action (skip / end turn)
function _afterAction(state) {
  if (state.phase === 'end') {
    _triggerEndGame(state);
    return;
  }
  // Undo only valid within the current turn — clear history on turn change
  clearHistory();
  if (state.mode === 'multi') {
    const nextPlayer = state.players[state.currentPlayerIndex];
    showPassOverlay(nextPlayer.name, () => { renderGame(state); animateHandDraw(); });
  } else {
    renderGame(state);
    animateHandDraw();
  }
}

function _triggerEndGame(state) {
  try {
    const results = getResults(state);
    renderResults(results);
    showScreen('results');
    animateResults();
  } catch(e) {
    console.error('[_triggerEndGame]', e);
  }
}

// ── Tile interaction ───────────────────────────────────────────────────────
function _handleTileClick(tileEl) {
  if (_animating || _selectedCardIdx === null) return;

  const tileIdx = parseInt(tileEl.dataset.tileIdx, 10);
  const s = getState();

  if (_shiftSourceIdx === null) {
    // First tap: prime this tile
    _shiftSourceIdx = tileIdx;
    _refreshTiles();
    return;
  }

  if (_shiftSourceIdx === tileIdx) {
    // Tapped same tile again → FLIP
    pushHistory();
    const next = doFlip(s, _selectedCardIdx, tileIdx);
    if (!next) { popHistory(); return; }

    _animating = true;
    _clearInteraction();
    animateFlip(tileEl, s.board[tileIdx], next.board[tileIdx]).then(() => {
      _animating = false;
      setState(next);
      renderGame(next);
      if (next.phase === 'end') _triggerEndGame(next);
    });
    return;
  }

  // Tapped a different tile → attempt SHIFT
  pushHistory();
  const srcIdx = _shiftSourceIdx;
  const next = doShift(s, _selectedCardIdx, srcIdx, tileIdx);
  if (!next) {
    // Not adjacent: re-prime the newly tapped tile
    popHistory();
    _shiftSourceIdx = tileIdx;
    _refreshTiles();
    return;
  }

  const boardEl  = _el((s.mode === 'solo' ? 'solo-' : '') + 'board');
  const srcEl    = boardEl.querySelector(`[data-tile-idx="${srcIdx}"]`);

  _animating = true;
  _clearInteraction();
  animateShift(srcEl, tileEl).then(() => {
    _animating = false;
    setState(next);
    renderGame(next);
    if (next.phase === 'end') _triggerEndGame(next);
  });
}

// ── Hand interaction ───────────────────────────────────────────────────────
function _handleHandClick(e) {
  if (_animating) return;
  const scoreBtn = e.target.closest('[data-score-idx]');
  if (scoreBtn) {
    _onScore(parseInt(scoreBtn.dataset.scoreIdx, 10));
    return;
  }
  const card = e.target.closest('[data-card-idx]');
  if (card) {
    const idx = parseInt(card.dataset.cardIdx, 10);
    _selectedCardIdx = (_selectedCardIdx === idx) ? null : idx;
    _shiftSourceIdx  = null;
    _refreshCards();
    _refreshTiles();
  }
}

// ── Visual refresh helpers ─────────────────────────────────────────────────
function _refreshCards() {
  document.querySelectorAll('[data-card-idx]').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.cardIdx, 10) === _selectedCardIdx);
  });
}

function _refreshTiles() {
  document.querySelectorAll('[data-tile-idx]').forEach(el => {
    const i = parseInt(el.dataset.tileIdx, 10);
    el.classList.toggle('tile-interactive', _selectedCardIdx !== null);
    el.classList.toggle('tile-pending',     i === _shiftSourceIdx);
  });
}

function _clearInteraction() {
  _selectedCardIdx = null;
  _shiftSourceIdx  = null;
}
