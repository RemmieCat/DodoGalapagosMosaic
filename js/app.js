'use strict';

/* ─────────────────────────────────────────────
   SCREEN ROUTING
   ───────────────────────────────────────────── */
const SCREENS = ['splash', 'settings', 'game', 'game-solo', 'results'];

/* ─────────────────────────────────────────────
   GAME START
   ───────────────────────────────────────────── */
function startGame() {
  // Read player count
  const activeCountBtn = document.querySelector('#count-row .count-btn.active');
  const playerCount = activeCountBtn ? parseInt(activeCountBtn.textContent, 10) : 2;

  // Read player names and types
  const players = [];
  for (let i = 1; i <= playerCount; i++) {
    const row    = document.getElementById('prow' + i);
    const name   = row.querySelector('.player-name-input').value.trim() || `Player ${i}`;
    const toggle = row.querySelector('.type-toggle');
    const isAI   = toggle ? toggle.classList.contains('ai') : false;
    players.push({ name, isAI });
  }

  const mode = playerCount === 1 ? 'solo' : 'multi';
  const customThreshold = _getThresholdSetting(playerCount);
  const state = initGame({ mode, players, threshold: customThreshold });

  setState(state);
  clearHistory();
  initUI(mode);
  renderGame(state);

  showScreen(mode === 'solo' ? 'game-solo' : 'game');
}

function showScreen(id) {
  SCREENS.forEach(s => {
    const el = document.getElementById(s);
    if (el) el.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  initMobileTabs();
}

/* ─────────────────────────────────────────────
   SETTINGS — PLAYER COUNT
   ───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   LOCAL STORAGE — SETTINGS PERSISTENCE
   ───────────────────────────────────────────── */
const SETTINGS_KEY = 'galapagos_settings';

function saveSettings() {
  const activeCountBtn = document.querySelector('#count-row .count-btn.active');
  const playerCount = activeCountBtn ? parseInt(activeCountBtn.textContent, 10) : 2;

  const players = [];
  for (let i = 1; i <= 5; i++) {
    const row = document.getElementById('prow' + i);
    if (!row) continue;
    const name   = row.querySelector('.player-name-input').value;
    const toggle = row.querySelector('.type-toggle');
    players.push({ name, isAI: toggle ? toggle.classList.contains('ai') : false });
  }

  const isCustom = document.getElementById('thresh-custom-btn').classList.contains('active');
  const thresholdValue = parseInt(document.getElementById('threshold-slider').value, 10);

  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ playerCount, players, thresholdMode: isCustom ? 'custom' : 'default', thresholdValue }));
}

function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) return;
  try {
    const s = JSON.parse(raw);
    if (s.playerCount) setPlayerCount(s.playerCount);
    if (s.players) {
      s.players.forEach((p, i) => {
        const row = document.getElementById('prow' + (i + 1));
        if (!row) return;
        const nameInput = row.querySelector('.player-name-input');
        if (nameInput) nameInput.value = p.name;
        const toggle = row.querySelector('.type-toggle');
        if (toggle) {
          toggle.classList.toggle('ai', p.isAI);
          toggle.textContent = p.isAI ? '🤖 AI' : '👤 Human';
        }
      });
    }
    if (s.thresholdMode === 'custom') {
      const customBtn = document.getElementById('thresh-custom-btn');
      if (customBtn) setThresholdMode('custom', customBtn);
    }
    if (s.thresholdValue) {
      const slider = document.getElementById('threshold-slider');
      if (slider) { slider.value = s.thresholdValue; onThresholdSlider(slider); }
    }
  } catch (e) {
    console.warn('Failed to load settings:', e);
  }
}

function clearLocalData() {
  localStorage.removeItem(SETTINGS_KEY);
  location.reload();
}

function setPlayerCount(n) {
  document.getElementById('count-row').querySelectorAll('.count-btn')
    .forEach((b, i) => b.classList.toggle('active', i + 1 === n));

  for (let i = 2; i <= 5; i++) {
    const row = document.getElementById('prow' + i);
    if (row) row.style.display = (i <= n) ? 'flex' : 'none';
  }

  // Solo mode: player 1 has no type-toggle; hide threshold section (solo uses fixed 16-card deck)
  const p1toggle = document.querySelector('#prow1 .type-toggle');
  if (p1toggle) p1toggle.style.display = (n === 1) ? 'none' : '';

  // Update default label
  const defaults = { 1: 16, 2: 10, 3: 9, 4: 8, 5: 7 };
  const descEl = document.getElementById('threshold-default-desc');
  if (descEl) descEl.textContent = `(Default: ${defaults[n]} cards)`;

  saveSettings();
}

function setThresholdMode(mode, btn) {
  document.querySelectorAll('.threshold-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('threshold-custom-row').style.display = mode === 'custom' ? 'flex' : 'none';
  saveSettings();
}

function onThresholdSlider(input) {
  document.getElementById('threshold-value-label').textContent = input.value + ' cards';
  saveSettings();
}

function _getThresholdSetting(playerCount) {
  if (document.getElementById('thresh-custom-btn').classList.contains('active')) {
    return parseInt(document.getElementById('threshold-slider').value, 10);
  }
  return null; // null = use default per player count
}

function togglePlayerType(btn) {
  const isHuman = !btn.classList.contains('ai');
  btn.classList.toggle('ai', isHuman);
  btn.textContent = isHuman ? '🤖 AI' : '👤 Human';
  saveSettings();
}

/* ─────────────────────────────────────────────
   SETTINGS — TABS
   ───────────────────────────────────────────── */
function switchSettingsTab(btn, paneId) {
  const bar  = btn.closest('.tab-bar');
  const body = btn.closest('.settings-right');
  bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  body.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(paneId).classList.add('active');
}

/* ─────────────────────────────────────────────
   GUIDE PANEL — TABS
   ───────────────────────────────────────────── */
function switchGuideTab(btn, paneId) {
  const panel = btn.closest('.guide-panel');
  panel.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
  panel.querySelectorAll('.guide-pane').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const pane = document.getElementById(paneId);
  if (pane) pane.classList.add('active');
}

/* ─────────────────────────────────────────────
   SCORES MODAL
   ───────────────────────────────────────────── */
function openModal()  { document.getElementById('scores-modal').classList.add('open'); }
function closeModal() { document.getElementById('scores-modal').classList.remove('open'); }

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('scores-modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  loadSettings();
});

/* ─────────────────────────────────────────────
   MOBILE TABS — reset to Hand tab on screen entry
   ───────────────────────────────────────────── */
function initMobileTabs() {
  const isLandscapeMobile = window.matchMedia('(orientation: landscape) and (max-width: 899px)').matches;
  const isPortraitMobile  = window.matchMedia('(orientation: portrait) and (max-width: 599px)').matches;
  const isMobile = isLandscapeMobile || isPortraitMobile;

  document.querySelectorAll('.guide-panel').forEach(panel => {
    const handBtn  = panel.querySelector('.mobile-hand-tab');
    const handPane = panel.querySelector('.mobile-hand-pane');
    if (!handBtn || !handPane) return;

    if (isMobile) {
      panel.querySelectorAll('.guide-tab-btn').forEach(b => b.classList.remove('active'));
      panel.querySelectorAll('.guide-pane').forEach(p => p.classList.remove('active'));
      handBtn.classList.add('active');
      handPane.classList.add('active');
    }
  });
}

window.addEventListener('load', initMobileTabs);
window.addEventListener('resize', initMobileTabs);
