'use strict';

/**
 * state.js — Central state container and undo history.
 *
 * State shape:
 *   mode:                'multi' | 'solo'
 *   board:               string[9]   side letter at each position (row-major)
 *   deck:                Card[]      remaining draw pile
 *   discard:             Card[]      cards discarded via shift/flip
 *   players:             Player[]
 *   currentPlayerIndex:  number
 *   phase:               'play' | 'end'
 *   turnActed:           boolean     any action taken this turn
 *   scoredThisTurn:      boolean     scoring action taken this turn (solo strike check)
 *   endgameTriggered:    boolean     multi only: threshold reached
 *   endgameTurnsLeft:    number      multi only: turns remaining after trigger
 *   strikes:             number      solo only
 *
 * Player shape:
 *   name:             string
 *   isAI:             boolean
 *   hand:             Card[]
 *   scored:           Card[]    successfully scored cards (kept for tallying)
 *   score:            number    running point total
 *   skippedLastTurn:  boolean   prevents consecutive skips
 */

let _state = null;
const _history = [];

function getState()        { return _state; }
function setState(s)       { _state = s; }
function canUndo()         { return _history.length > 0; }
function clearHistory()    { _history.length = 0; }

function pushHistory() {
  _history.push(JSON.stringify(_state));
}

function popHistory() {
  if (_history.length === 0) return false;
  _state = JSON.parse(_history.pop());
  return true;
}
