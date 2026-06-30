'use strict';

// ── Core action animations ─────────────────────────────────────────────────

// Flip a board tile with a rotateY — swaps the tile image at the midpoint.
function animateFlip(tileEl, fromSide, toSide, toImg) {
  return new Promise(resolve => {
    // Remove pending class so its CSS animation doesn't fight our inline transform
    tileEl.classList.remove('tile-pending', 'tile-interactive');
    // Lock in explicit starting state before transitioning (prevents snap)
    tileEl.style.transition = 'none';
    tileEl.style.transform  = 'perspective(400px) rotateY(0deg)';
    void tileEl.offsetWidth; // force reflow

    // Phase 1: rotate to 90° (tile face disappears)
    tileEl.style.transition = 'transform 0.15s ease-in';
    tileEl.style.transform  = 'perspective(400px) rotateY(90deg)';

    setTimeout(() => {
      // Swap class and inline background-image, then jump to -90° for continuous reveal
      tileEl.classList.remove('tile-' + fromSide);
      tileEl.classList.add('tile-'    + toSide);
      if (toImg) tileEl.style.backgroundImage = `url('images/${toImg}')`;
      tileEl.style.transition = 'none';
      tileEl.style.transform  = 'perspective(400px) rotateY(-90deg)';
      void tileEl.offsetWidth;

      // Phase 2: rotate back to 0° (new face revealed)
      tileEl.style.transition = 'transform 0.15s ease-out';
      tileEl.style.transform  = 'perspective(400px) rotateY(0deg)';

      setTimeout(() => {
        tileEl.style.transition = '';
        tileEl.style.transform  = '';
        resolve();
      }, 160);
    }, 155);
  });
}

// Slide two board tiles toward each other and land in their swapped positions.
function animateShift(tileEl1, tileEl2) {
  return new Promise(resolve => {
    // Remove pending class (and its scale transform) before measuring positions
    // so getBoundingClientRect reflects the natural unscaled grid position
    tileEl1.classList.remove('tile-pending', 'tile-interactive');
    tileEl2.classList.remove('tile-interactive');

    const r1 = tileEl1.getBoundingClientRect();
    const r2 = tileEl2.getBoundingClientRect();
    const dx = r2.left - r1.left;
    const dy = r2.top  - r1.top;

    // Commit translate(0,0) as the starting state before transitioning
    // (no position/z-index changes — those cause layout reflow mid-animation)
    [tileEl1, tileEl2].forEach(el => {
      el.style.transition = 'none';
      el.style.transform  = 'translate(0px, 0px)';
    });
    void tileEl1.offsetWidth;

    tileEl1.style.transition = 'transform 0.24s ease-in-out';
    tileEl1.style.transform  = `translate(${dx}px, ${dy}px)`;
    tileEl2.style.transition = 'transform 0.24s ease-in-out';
    tileEl2.style.transform  = `translate(${-dx}px, ${-dy}px)`;

    setTimeout(() => {
      [tileEl1, tileEl2].forEach(el => {
        el.style.transition = '';
        el.style.transform  = '';
      });
      resolve();
    }, 260);
  });
}

// Shrink-fade the scored card out of the hand and float a +N pts label.
function animateScore(cardEl, points) {
  return new Promise(resolve => {
    const rect = cardEl.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;

    const pop = document.createElement('div');
    pop.className = 'score-pop';
    pop.textContent = `+${points}`;
    pop.style.left = cx + 'px';
    pop.style.top  = cy + 'px';
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add('score-pop-go'));

    cardEl.style.transition = 'transform 0.28s ease-in, opacity 0.28s ease-in';
    cardEl.style.transform  = 'scale(0.6) translateY(-18px)';
    cardEl.style.opacity    = '0';

    setTimeout(() => {
      pop.remove();
      cardEl.style.transition = '';
      cardEl.style.transform  = '';
      cardEl.style.opacity    = '';
      resolve();
    }, 500);
  });
}

// ── Turn-flow animations ───────────────────────────────────────────────────

// Stagger-slide all hand cards into view (call after renderGame).
function animateHandDraw() {
  document.querySelectorAll('.pcard').forEach((el, i) => {
    el.style.animationDelay = `${i * 60}ms`;
    el.classList.add('card-draw-in');
  });
}

// Flash the lit strike pips red (solo mode only, call after renderGame).
function animateStrikeFlash() {
  document.querySelectorAll('.strike-pip.on').forEach((pip, i) => {
    pip.classList.remove('strike-flash');
    void pip.offsetWidth; // force reflow so the animation restarts
    pip.style.animationDelay = `${i * 60}ms`;
    pip.classList.add('strike-flash');
  });
}

// ── Results-screen animations ──────────────────────────────────────────────

// Stagger in the winner block then cascade the score rows.
function animateResults() {
  const headerEls = [
    document.getElementById('results-trophy'),
    document.getElementById('results-crown-label'),
    document.getElementById('results-winner-name'),
    document.getElementById('results-winner-sub'),
    document.getElementById('results-bonus'),
  ];

  headerEls.forEach((el, i) => {
    if (!el || el.style.display === 'none') return;
    el.classList.remove('result-reveal');
    void el.offsetWidth;
    el.style.animationDelay = `${i * 80}ms`;
    el.classList.add('result-reveal');
  });

  document.querySelectorAll('#results-tbody tr').forEach((row, i) => {
    row.classList.remove('result-reveal');
    void row.offsetWidth;
    row.style.animationDelay = `${320 + i * 110}ms`;
    row.classList.add('result-reveal');
  });
}
