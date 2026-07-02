'use strict';

const _STATS_KEY = 'galapagos_solo_stats';

function _loadAllStats() {
  try { return JSON.parse(localStorage.getItem(_STATS_KEY) || '{}'); } catch (e) { return {}; }
}

function _saveAllStats(all) {
  try { localStorage.setItem(_STATS_KEY, JSON.stringify(all)); } catch (e) {}
}

// Record one completed solo game for a player (cards = number scored, 0–16).
function recordSoloGame(name, cards) {
  const all = _loadAllStats();
  if (!all[name]) all[name] = new Array(17).fill(0);
  const idx = Math.min(Math.max(Math.floor(cards), 0), 16);
  all[name][idx]++;
  _saveAllStats(all);
}

// Returns an array of length 17 where index = cards scored, value = game count.
function getSoloStats(name) {
  const all = _loadAllStats();
  const raw = all[name];
  if (!Array.isArray(raw)) return new Array(17).fill(0);
  // Pad/trim to exactly 17 entries
  const out = new Array(17).fill(0);
  for (let i = 0; i < 17; i++) out[i] = raw[i] || 0;
  return out;
}

// Wipe a single player's history.
function resetSoloStats(name) {
  const all = _loadAllStats();
  delete all[name];
  _saveAllStats(all);
}
