/**
 * cards.js — Pattern card generator for Galápagos Mosaic
 *
 * Pattern encoding: comma-separated row strings.
 *   "A-C,-B-,--H"  →  3×3 grid, row by row
 *   "CE"           →  1×2 horizontal
 *   "C,E"          →  2×1 vertical
 *   '-'            →  wildcard (any tile side matches)
 *
 * Tile constraints (a pattern must be achievable on the board):
 *   Type 1 (×1):  sides A, B  — never both; max 1 of each
 *   Type 2 (×2):  sides C, D  — max 2 total (C+D ≤ 2)
 *   Type 3 (×3):  sides E, F  — max 3 total (E+F ≤ 3)
 *   Type 4 (×3):  sides G, H  — max 3 total (G+H ≤ 3)
 */

/* ─────────────────────────────────────────────
   CONSTRAINT VALIDATION
   ───────────────────────────────────────────── */

/**
 * Return the non-wildcard letters from a pattern string.
 */
function patternSides(pattern) {
  return pattern.replace(/[^A-H]/g, '').split('');
}

/**
 * True if the combination of sides can exist simultaneously on the 3×3 board.
 */
function isValidPattern(pattern) {
  const sides = patternSides(pattern);
  const count = s => sides.filter(x => x === s).length;

  if (count('A') > 1) return false;              // only 1 A/B tile
  if (count('B') > 1) return false;
  if (count('A') > 0 && count('B') > 0) return false;   // same physical tile
  if (count('C') + count('D') > 2) return false; // 2 C/D tiles
  if (count('E') + count('F') > 3) return false; // 3 E/F tiles
  if (count('G') + count('H') > 3) return false; // 3 G/H tiles
  return true;
}

/* ─────────────────────────────────────────────
   POINT VALUE RULES
   ───────────────────────────────────────────── */

const RARE  = new Set(['A', 'B']);          // type-1 sides (only 1 tile)
const SCARCE = new Set(['C', 'D']);         // type-2 sides (2 tiles)

function hasRare(sides)   { return sides.some(s => RARE.has(s)); }
function scarceCount(sides) { return sides.filter(s => SCARCE.has(s)).length; }

/**
 * Assign point value given the layout category and its specific tile count.
 * Category keys match the layout type strings used in generation below.
 */
function pointValue(category, sides) {
  const r = hasRare(sides);
  const sc = scarceCount(sides);

  switch (category) {
    // ── 1×2 / 2×1 (always 2 filled) ──
    case '1x2': case '2x1':
      return r ? 2 : 1;

    // ── 2×2, 2-tile (opposing corners) ──
    case '2x2_2tile':
      return (r || sc === 2) ? 2 : 1;

    // ── 2×2, 3-tile (all-same OR two-opposing-corners + diff) ──
    case '2x2_3tile':
      return (r || sc === 2) ? 3 : 2;

    // ── 1×3 / 3×1, 1-tile ──
    case '1x3_1tile': case '3x1_1tile':
      return r ? 2 : 1;

    // ── 1×3 / 3×1, 2-tile ──
    case '1x3_2tile': case '3x1_2tile':
      return sides.every(s => RARE.has(s) || SCARCE.has(s)) ? 3 : 2;

    // ── 1×3 / 3×1, 3-tile ──
    case '1x3_3tile': case '3x1_3tile': {
      const rareScarce = sides.filter(s => RARE.has(s) || SCARCE.has(s)).length;
      return rareScarce >= 2 ? 5 : 3;
    }

    // ── 3×3, 1-tile ──
    case '3x3_1tile':
      return r ? 2 : 1;

    // ── 3×3, 2-tile (diagonal corner pair) ──
    case '3x3_2tile':
      return (r || sc === 2) ? 3 : 2;

    // ── 3×3, 3-tile (3-of-4-corners, arrow, diagonal) ──
    case '3x3_3tile':
      return (r || sc === 2) ? 5 : 3;

    // ── 3×3, 4-tile (X corners or + mid-edges) ──
    case '3x3_4tile':
      return 5;

    default: return 1;
  }
}

/* ─────────────────────────────────────────────
   PATTERN BUILDERS
   Each function returns an array of { pattern, category } objects.
   ───────────────────────────────────────────── */

const SIDES = ['A','B','C','D','E','F','G','H'];

/** All valid 2-cell combinations for fully-filled linear patterns. */
function pairs() {
  const out = [];
  for (const a of SIDES)
    for (const b of SIDES)
      out.push([a, b]);
  return out.filter(([a,b]) => isValidPattern(a + b));
}

// ── 1×2  "AB" ──
function gen_1x2() {
  return pairs().map(([a,b]) => ({ pattern: `${a}${b}`, category: '1x2' }));
}

// ── 2×1  "A,B" ──
function gen_2x1() {
  return pairs().map(([a,b]) => ({ pattern: `${a},${b}`, category: '2x1' }));
}

// ── 2×2, 2-tile: opposing corners (4 positions) ──
function gen_2x2_2tile() {
  const out = [];
  for (const a of SIDES)
    for (const b of SIDES) {
      const p1 = isValidPattern(a + b);
      if (!p1) continue;
      // main diagonal: (0,0) and (1,1)
      out.push({ pattern: `${a}-,-${b}`, category: '2x2_2tile' });
      // anti-diagonal: (0,1) and (1,0)
      out.push({ pattern: `-${a},${b}-`, category: '2x2_2tile' });
    }
  return out;
}

// ── 2×2, 3-tile sub-layout (a): all three cells same side ──
function gen_2x2_3tile_allsame() {
  const out = [];
  const layouts = [
    (x) => `${x}${x},${x}-`,   // TL TR BL
    (x) => `${x}${x},-${x}`,   // TL TR BR
    (x) => `${x}-,${x}${x}`,   // TL BL BR
    (x) => `-${x},${x}${x}`,   // TR BL BR
  ];
  for (const x of SIDES)
    for (const fn of layouts)
      out.push({ pattern: fn(x), category: '2x2_3tile' });
  return out;
}

// ── 2×2, 3-tile sub-layout (b): two opposing corners = X, one adjacent corner = Y ──
function gen_2x2_3tile_corners() {
  const out = [];
  for (const x of SIDES)
    for (const y of SIDES) {
      if (x === y) continue;
      if (!isValidPattern(x + x + y)) continue;
      // Main-diagonal pair X at (0,0)+(1,1), Y at (0,1) or (1,0)
      out.push({ pattern: `${x}${y},-${x}`, category: '2x2_3tile' }); // Y at TR
      out.push({ pattern: `${x}-,${y}${x}`, category: '2x2_3tile' }); // Y at BL
      // Anti-diagonal pair X at (0,1)+(1,0), Y at (0,0) or (1,1)
      out.push({ pattern: `${y}${x},${x}-`, category: '2x2_3tile' }); // Y at TL
      out.push({ pattern: `-${x},${x}${y}`, category: '2x2_3tile' }); // Y at BR
    }
  return out;
}

// ── 1×3, 1-tile: single cell in any of 3 positions ──
function gen_1x3_1tile() {
  const out = [];
  for (const s of SIDES) {
    out.push({ pattern: `${s}--`, category: '1x3_1tile' });
    out.push({ pattern: `-${s}-`, category: '1x3_1tile' });
    out.push({ pattern: `--${s}`, category: '1x3_1tile' });
  }
  return out;
}

// ── 3×1, 1-tile ──
function gen_3x1_1tile() {
  const out = [];
  for (const s of SIDES) {
    out.push({ pattern: `${s},-,-`, category: '3x1_1tile' });
    out.push({ pattern: `-,${s},-`, category: '3x1_1tile' });
    out.push({ pattern: `-,-,${s}`, category: '3x1_1tile' });
  }
  return out;
}

// ── 1×3, 2-tile: any 2 of 3 positions filled ──
function gen_1x3_2tile() {
  const positions = [[0,1],[0,2],[1,2]]; // which two cols are filled
  const out = [];
  for (const [p1, p2] of positions)
    for (const a of SIDES)
      for (const b of SIDES) {
        if (!isValidPattern(a + b)) continue;
        const row = ['-','-','-'];
        row[p1] = a; row[p2] = b;
        out.push({ pattern: row.join(''), category: '1x3_2tile' });
      }
  return out;
}

// ── 3×1, 2-tile ──
function gen_3x1_2tile() {
  const positions = [[0,1],[0,2],[1,2]];
  const out = [];
  for (const [p1, p2] of positions)
    for (const a of SIDES)
      for (const b of SIDES) {
        if (!isValidPattern(a + b)) continue;
        const col = ['-','-','-'];
        col[p1] = a; col[p2] = b;
        out.push({ pattern: col.join(','), category: '3x1_2tile' });
      }
  return out;
}

// ── 1×3, 3-tile: all 3 cells filled ──
function gen_1x3_3tile() {
  const out = [];
  for (const a of SIDES)
    for (const b of SIDES)
      for (const c of SIDES) {
        if (!isValidPattern(a+b+c)) continue;
        out.push({ pattern: `${a}${b}${c}`, category: '1x3_3tile' });
      }
  return out;
}

// ── 3×1, 3-tile ──
function gen_3x1_3tile() {
  const out = [];
  for (const a of SIDES)
    for (const b of SIDES)
      for (const c of SIDES) {
        if (!isValidPattern(a+b+c)) continue;
        out.push({ pattern: `${a},${b},${c}`, category: '3x1_3tile' });
      }
  return out;
}

// ── 3×3, 1-tile: single cell in any of 9 positions ──
function gen_3x3_1tile() {
  const out = [];
  for (const s of SIDES)
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        const rows = ['---','---','---'].map(x => x.split(''));
        rows[r][c] = s;
        out.push({ pattern: rows.map(r => r.join('')).join(','), category: '3x3_1tile' });
      }
  return out;
}

// ── 3×3, 2-tile: diagonally-opposing corner pairs ──
// Pairs: (TL,BR) and (TR,BL)
function gen_3x3_2tile() {
  const out = [];
  const cornerPairs = [
    ([a,b]) => `${a}--,---,--${b}`,   // TL + BR
    ([a,b]) => `--${a},---,${b}--`,   // TR + BL
  ];
  for (const a of SIDES)
    for (const b of SIDES) {
      if (!isValidPattern(a+b)) continue;
      for (const fn of cornerPairs)
        out.push({ pattern: fn([a,b]), category: '3x3_2tile' });
    }
  return out;
}

// ── 3×3, 3-tile (a): 3 of 4 corners (any side combination) ──
// Four choices for which corner is absent
function gen_3x3_3corners() {
  const out = [];
  // Corners: TL=(0,0), TR=(0,2), BL=(2,0), BR=(2,2)
  const layouts = [
    // missing TR:  TL, BL, BR
    ([a,b,c]) => `${a}--,---,${b}-${c}`,
    // missing TL:  TR, BL, BR
    ([a,b,c]) => `--${a},---,${b}-${c}`,
    // missing BL:  TL, TR, BR
    ([a,b,c]) => `${a}-${b},---,--${c}`,
    // missing BR:  TL, TR, BL
    ([a,b,c]) => `${a}-${b},---,${c}--`,
  ];
  for (const a of SIDES)
    for (const b of SIDES)
      for (const c of SIDES) {
        if (!isValidPattern(a+b+c)) continue;
        for (const fn of layouts)
          out.push({ pattern: fn([a,b,c]), category: '3x3_3tile' });
      }
  return out;
}

// ── 3×3, 3-tile (b): arrow — 2 same-edge corners (X) + opposing mid-edge (Y) ──
// Symmetry rule: the two corners must be the same side (X); tip can differ (Y)
function gen_3x3_arrow() {
  const out = [];
  const arrowLayouts = [
    (x,y) => `${x}-${x},---,-${y}-`,   // ▼  top-left + top-right → bottom-mid
    (x,y) => `-${y}-,---,${x}-${x}`,   // ▲  bottom-left + bottom-right → top-mid
    (x,y) => `${x}--,-${y}-,${x}--`,   // ▶  top-left + bottom-left → right-mid
    (x,y) => `--${x},${y}--,--${x}`,   // ◀  top-right + bottom-right → left-mid
  ];
  for (const x of SIDES)
    for (const y of SIDES) {
      if (x === y) continue;
      if (!isValidPattern(x+x+y)) continue;
      for (const fn of arrowLayouts)
        out.push({ pattern: fn(x,y), category: '3x3_3tile' });
    }
  return out;
}

// ── 3×3, 3-tile (c): diagonal — matching corners (X) + different middle (Y) ──
// Main diagonal: TL + BR = X, center = Y
// Anti-diagonal: TR + BL = X, center = Y
function gen_3x3_diagonal() {
  const out = [];
  for (const x of SIDES)
    for (const y of SIDES) {
      if (x === y) continue;
      if (!isValidPattern(x+x+y)) continue;
      // main diagonal
      out.push({ pattern: `${x}--,-${y}-,--${x}`, category: '3x3_3tile' });
      // anti-diagonal
      out.push({ pattern: `--${x},-${y}-,${x}--`, category: '3x3_3tile' });
    }
  return out;
}

// ── 3×3, 4-tile (a): X — all 4 corners ──
function gen_3x3_X() {
  const out = [];
  for (const a of SIDES)
    for (const b of SIDES)
      for (const c of SIDES)
        for (const d of SIDES) {
          if (!isValidPattern(a+b+c+d)) continue;
          out.push({ pattern: `${a}-${b},---,${c}-${d}`, category: '3x3_4tile' });
        }
  return out;
}

// ── 3×3, 4-tile (b): + — all 4 mid-edges ──
function gen_3x3_plus() {
  const out = [];
  // mid-edges: top=(0,1), left=(1,0), right=(1,2), bottom=(2,1)
  for (const a of SIDES)       // top
    for (const b of SIDES)     // left
      for (const c of SIDES)   // right
        for (const d of SIDES) { // bottom
          if (!isValidPattern(a+b+c+d)) continue;
          out.push({ pattern: `-${a}-,${b}-${c},-${d}-`, category: '3x3_4tile' });
        }
  return out;
}

/* ─────────────────────────────────────────────
   DEDUPLICATION
   ───────────────────────────────────────────── */
function dedupe(cards) {
  const seen = new Set();
  return cards.filter(({ pattern }) => {
    if (seen.has(pattern)) return false;
    seen.add(pattern);
    return true;
  });
}

/* ─────────────────────────────────────────────
   POOL ASSEMBLY & SAMPLING
   ───────────────────────────────────────────── */

/**
 * Seeded pseudo-random shuffle (Mulberry32) so the deck is reproducible
 * across environments without a fixed hand-authored list.
 */
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a pool of all valid, deduplicated cards, tag each with its point
 * value, then sample to the target distribution.
 *
 * Target (72 cards): 22×1pt, 25×2pt, 18×3pt, 7×5pt
 */
function buildDeck(seed = 42) {
  const rng = mulberry32(seed);

  // ── Assemble raw pool ──
  const raw = [
    ...gen_1x2(),
    ...gen_2x1(),
    ...gen_2x2_2tile(),
    ...gen_2x2_3tile_allsame(),
    ...gen_2x2_3tile_corners(),
    ...gen_1x3_1tile(),
    ...gen_3x1_1tile(),
    ...gen_1x3_2tile(),
    ...gen_3x1_2tile(),
    ...gen_1x3_3tile(),
    ...gen_3x1_3tile(),
    ...gen_3x3_1tile(),
    ...gen_3x3_2tile(),
    ...gen_3x3_3corners(),
    ...gen_3x3_arrow(),
    ...gen_3x3_diagonal(),
    ...gen_3x3_X(),
    ...gen_3x3_plus(),
  ];

  // ── Deduplicate & tag points ──
  const pool = dedupe(raw).map(({ pattern, category }) => ({
    pattern,
    points: pointValue(category, patternSides(pattern)),
    category,
  }));

  // ── Bucket by point value ──
  const buckets = { 1: [], 2: [], 3: [], 5: [] };
  for (const card of pool) buckets[card.points].push(card);

  // Shuffle each bucket reproducibly
  for (const k of Object.keys(buckets))
    buckets[k] = shuffle(buckets[k], rng);

  // ── Sample to targets ──
  const targets = { 1: 22, 2: 25, 3: 18, 5: 7 };
  const deck = [];
  for (const [pts, n] of Object.entries(targets)) {
    const bucket = buckets[pts];
    if (bucket.length < n) {
      console.warn(`cards.js: only ${bucket.length} valid ${pts}-pt patterns (need ${n})`);
    }
    deck.push(...bucket.slice(0, n));
  }

  // Return in a stable shuffled order (what gets dealt each game is
  // determined by the game-session shuffle, not this order)
  return shuffle(deck, rng);
}

/* ─────────────────────────────────────────────
   SOLO DECK  (16-card curated subset)
   8×1pt, 4×2pt, 3×3pt, 1×5pt
   Built deterministically from the same pool.
   ───────────────────────────────────────────── */
function buildSoloDeck(fullDeck) {
  const buckets = { 1: [], 2: [], 3: [], 5: [] };
  for (const card of fullDeck) buckets[card.points].push(card);
  const targets = { 1: 8, 2: 4, 3: 3, 5: 1 };
  const deck = [];
  for (const [pts, n] of Object.entries(targets)) {
    // Shuffle the bucket so each game draws a different subset
    const b = [...buckets[pts]];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    deck.push(...b.slice(0, n));
  }
  return deck;
}

/* ─────────────────────────────────────────────
   PATTERN MATCHING  (used by game logic)
   Returns true if `pattern` matches the board at any valid offset.
   `board` is a 3×3 array of side letters, e.g. board[row][col] = 'A'
   ───────────────────────────────────────────── */
function patternMatchesBoard(pattern, board) {
  const rows = pattern.split(',');
  const ph = rows.length;
  const pw = rows[0].length;

  for (let sr = 0; sr <= 3 - ph; sr++) {
    for (let sc = 0; sc <= 3 - pw; sc++) {
      let match = true;
      outer: for (let r = 0; r < ph; r++) {
        for (let c = 0; c < pw; c++) {
          const cell = rows[r][c];
          if (cell === '-') continue;
          if (board[sr + r][sc + c] !== cell) { match = false; break outer; }
        }
      }
      if (match) return true;
    }
  }
  return false;
}

/* ─────────────────────────────────────────────
   EXPORTS
   ───────────────────────────────────────────── */
const FULL_DECK = buildDeck(42);
const SOLO_DECK = buildSoloDeck(FULL_DECK);

// Quick sanity log (remove before shipping)
(function sanityCheck() {
  const counts = { 1: 0, 2: 0, 3: 0, 5: 0 };
  for (const c of FULL_DECK) counts[c.points]++;
  console.log('Deck built:', FULL_DECK.length, 'cards', counts);
  console.log('Solo deck:', SOLO_DECK.length, 'cards');
  const dupe = new Set(FULL_DECK.map(c => c.pattern));
  if (dupe.size !== FULL_DECK.length)
    console.error('DUPLICATE PATTERNS IN DECK');
})();
