'use strict';

// ── Vocabulary (prefix-matched for predictions) ──────────────────────────
const VOCAB = [
  // High-frequency first
  'I','a','the','to','and','is','are','was','be','been','have','has','had',
  'will','would','can','could','should','need','want','like','feel','think',
  'know','see','look','get','go','do','come','say','tell','ask','help','try',
  'put','give','sit','lay','rest','sleep','eat','drink','move','turn','call',
  // Pronouns / articles
  'it','he','she','we','you','they','my','your','his','her','me','him','us',
  'them','our','this','that','these','those',
  // Prepositions / conjunctions
  'of','in','on','at','for','with','by','from','as','up','out','about','into',
  'through','before','after','over','between','not','no','yes','okay','so',
  'if','or','but','an','what','when','where','who','how','why','which',
  // Common descriptors
  'good','fine','better','worse','more','less','very','too','now','please',
  'thank','thanks','sorry','little','much','some','any','all','every','just',
  'hot','cold','warm','cool','comfortable','uncomfortable','tired','awake',
  'sleepy','ready','sure','right','wrong','here','there','today','tomorrow',
  'yesterday','morning','afternoon','evening','night','time','moment','minute',
  'happy','sad','worried','frustrated','grateful','wonderful','difficult',
  // Care / medical context
  'water','nurse','doctor','family','love','pain','ache','hurt','medication',
  'medicine','repositioned','position','pillow','blanket','temperature',
  'window','light','dark','quiet','loud','phone','tablet','television','music',
  'book','glasses','straw','scratch','massage','fan','suction','itchy',
  'hungry','thirsty','nauseous','dizzy','anxious','bored','something',
  'nothing','everything','anything','someone','everyone','maybe','actually',
  'really','another',
];

// Whole-phrase suggestions (shown when message is empty or after a space with little context)
const PHRASE_SUGGESTIONS = [
  'I need to be repositioned',
  'Please turn me a little',
  'I am comfortable now',
  'I need water please',
  'Thank you',
  'I love you',
  'One moment please',
  'Please call the nurse',
];

// ── Layout definitions ───────────────────────────────────────────────────
const LAYOUTS = {
  abc:       'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  frequency: 'ETAOINSRHLDCUMFPGWYBVKJXQZ',
};

const NEEDS_L1 = ['Scratch', 'Massage', 'Move', 'Change'];
const NEEDS_L2 = [
  { label: 'Upper body', sub: 'head · face', wide: false },
  { label: 'Lower body', sub: null,          wide: false },
  { label: 'Inside the body', sub: null,     wide: true  },
];

// ── Timing constants ─────────────────────────────────────────────────────
const SCAN_ZONE_MS = 1600;   // ms per top-level zone (pred row or grid row)
const SCAN_ITEM_MS = 1100;   // ms per item inside a zone
const DWELL_MS     = 1500;   // ms to hold for dwell selection

// ── State ────────────────────────────────────────────────────────────────
const S = {
  message:      '',
  theme:        localStorage.getItem('ev-theme')   || 'light',
  layout:       localStorage.getItem('ev-layout')  || 'abc',
  density:      localStorage.getItem('ev-density') || 'default',
  inputMode:    'direct',    // 'direct' | 'scan' | 'dwell'
  needsMode:    'none',      // 'none' | 'l1' | 'l2'
  needsL1Sel:   null,        // label chosen at L1 (for speak)
  restoredDraft: false,
  predictions:  [],
  quickPhrases: ['Please move me', 'Scratch my head', 'Thank you', 'One moment'],

  // Scanning
  scanPhase:  'zone',   // 'zone' | 'item'
  scanZone:   0,        // index into scanZones()
  scanItem:   0,        // index within current zone
  scanTimer:  null,

  // Dwell
  dwellEl:    null,
  dwellRAF:   null,
  dwellStart: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────
function h(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function el(id) { return document.getElementById(id); }

// Grid rows as arrays of key descriptors
function getGridRows() {
  const seq   = LAYOUTS[S.layout].split('');
  const large = S.density === 'large';
  const rows  = [];
  for (let r = 0; r < 4; r++) {
    rows.push(seq.slice(r * 6, r * 6 + 6).map(ch => ({ char: ch, kind: 'letter' })));
  }
  const last = seq.slice(24).map(ch => ({ char: ch, kind: 'letter' }));
  last.push({ char: ' ', label: 'space', kind: 'space' });
  if (!large) {
    last.push({ char: ',', kind: 'punct' });
    last.push({ char: '.', kind: 'punct' });
    last.push({ char: '?', kind: 'punct' });
  }
  rows.push(last);
  return rows;
}

// Scan zones: 0 = prediction row, 1..N = grid rows
function scanZones() {
  return [{ type: 'pred' }, ...getGridRows().map((_, i) => ({ type: 'row', rowIdx: i }))];
}

// ── Predictions ──────────────────────────────────────────────────────────
function computePredictions(msg) {
  if (!msg) return PHRASE_SUGGESTIONS.slice(0, 5);

  // Trailing space means the last word was just completed — suggest next words
  if (msg.endsWith(' ')) {
    return ['and', 'but', 'please', 'now', 'I'].slice(0, 5);
  }

  const trimmed = msg.trimEnd();
  if (!trimmed) return PHRASE_SUGGESTIONS.slice(0, 5);

  // Find the current partial word (characters since the last space)
  const lastSpace = trimmed.lastIndexOf(' ');
  const partial   = lastSpace >= 0 ? trimmed.slice(lastSpace + 1) : trimmed;

  if (!partial) return ['and', 'but', 'please', 'now', 'I'].slice(0, 5);

  const prefix  = partial.toLowerCase();
  const matches = VOCAB.filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== prefix);
  return matches.slice(0, 5);
}

// ── Speech ───────────────────────────────────────────────────────────────
function speak(text) {
  if (!text || !text.trim()) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.trim()));
}

// ── Message mutations ────────────────────────────────────────────────────
function appendChar(char) {
  if (char === ' ') {
    if (!S.message.endsWith(' ')) S.message += ' ';
  } else {
    S.message += char;
  }
  S.restoredDraft = false;
  afterMessageChange();
}

function appendWord(word) {
  const lastSpace = S.message.lastIndexOf(' ');
  if (lastSpace >= 0) {
    S.message = S.message.slice(0, lastSpace + 1) + word + ' ';
  } else {
    S.message = word + ' ';
  }
  S.restoredDraft = false;
  afterMessageChange();
}

function appendPhrase(phrase) {
  S.message = phrase + ' ';
  S.restoredDraft = false;
  afterMessageChange();
}

function clearLast() {
  if (!S.message) return;
  S.message = S.message.slice(0, -1);
  S.restoredDraft = false;
  afterMessageChange();
}

function clearAll() {
  if (!S.message) return;
  S.message = '';
  S.restoredDraft = false;
  afterMessageChange();
}

function afterMessageChange() {
  localStorage.setItem('ev-draft', S.message);
  S.predictions = computePredictions(S.message);
  render();
}

// ── Scanning ─────────────────────────────────────────────────────────────
function startScan() {
  stopScan();
  S.scanPhase = 'zone';
  S.scanZone  = 0;
  S.scanItem  = 0;
  advanceZone();
  renderGrid();   // show switch button
}

function stopScan() {
  if (S.scanTimer) clearTimeout(S.scanTimer);
  S.scanTimer = null;
  S.scanPhase = 'zone';
  S.scanZone  = -1;
  S.scanItem  = -1;
}

function advanceZone() {
  renderGrid();
  renderPredRow();
  S.scanTimer = setTimeout(() => {
    const zones = scanZones();
    S.scanZone = (S.scanZone + 1) % zones.length;
    advanceZone();
  }, SCAN_ZONE_MS);
}

function advanceItem(items) {
  renderGrid();
  renderPredRow();
  S.scanTimer = setTimeout(() => {
    S.scanItem = (S.scanItem + 1) % items.length;
    // After one full cycle with no press → back to zone scan
    if (S.scanItem === 0) {
      S.scanPhase = 'zone';
      advanceZone();
    } else {
      advanceItem(items);
    }
  }, SCAN_ITEM_MS);
}

function onSwitch() {
  if (S.inputMode !== 'scan') return;
  if (S.scanTimer) clearTimeout(S.scanTimer);

  const zones = scanZones();
  const zone  = zones[S.scanZone];

  if (S.scanPhase === 'zone') {
    // Enter item scan for this zone
    S.scanPhase = 'item';
    S.scanItem  = 0;
    if (zone.type === 'pred') {
      const predCount = S.predictions.length;
      if (predCount === 0) { S.scanPhase = 'zone'; advanceZone(); return; }
      advanceItem(Array(Math.min(predCount, 5)).fill(0));
    } else {
      const rows = getGridRows();
      advanceItem(rows[zone.rowIdx]);
    }
  } else {
    // Select current item
    if (zone.type === 'pred') {
      const pred = S.predictions[S.scanItem];
      if (pred) {
        if (pred.includes(' ')) appendPhrase(pred);
        else appendWord(pred);
      }
    } else {
      const rows = getGridRows();
      const key  = rows[zone.rowIdx][S.scanItem];
      if (key) appendChar(key.char);
    }
    S.scanPhase = 'zone';
    advanceZone();
  }
}

// ── Dwell ────────────────────────────────────────────────────────────────
function startDwell(keyEl, char) {
  stopDwell();
  S.dwellEl    = keyEl;
  S.dwellStart = performance.now();
  keyEl.classList.add('dwelling');

  function tick(ts) {
    if (S.dwellEl !== keyEl) return;
    const prog = Math.min((ts - S.dwellStart) / DWELL_MS, 1);
    keyEl.style.setProperty('--dp', prog);
    if (prog < 1) {
      S.dwellRAF = requestAnimationFrame(tick);
    } else {
      stopDwell();
      appendChar(char);
    }
  }
  S.dwellRAF = requestAnimationFrame(tick);
}

function stopDwell() {
  if (S.dwellRAF) cancelAnimationFrame(S.dwellRAF);
  S.dwellRAF = null;
  if (S.dwellEl) {
    S.dwellEl.classList.remove('dwelling');
    S.dwellEl.style.removeProperty('--dp');
    S.dwellEl = null;
  }
}

// ── Rendering ────────────────────────────────────────────────────────────
function render() {
  const app = el('app');
  app.dataset.theme   = S.theme;
  app.dataset.density = S.density;
  renderMsgBar();
  renderPredRow();
  renderGridArea();
  renderRail();
  el('switch-btn').classList.toggle('visible', S.inputMode === 'scan');
}

// Message bar
function renderMsgBar() {
  const bar     = el('msg-bar');
  const msg     = S.message;
  const hasText = msg.length > 0;
  const overflow = msg.length > 38;

  const textHTML = hasText
    ? `<span class="msg-text">${h(msg)}</span><span class="msg-caret"></span>`
    : `<span class="msg-ph">Your message will appear here</span>`;

  bar.innerHTML = `
    <div class="msg-text-col">
      ${S.restoredDraft ? `<div class="draft-chip"><span class="draft-dot"></span>Draft restored</div>` : ''}
      <div class="msg-textbox${overflow ? ' overflow' : ''}">
        ${overflow ? `<div class="msg-fade"></div>` : ''}
        <div class="msg-row">${textHTML}</div>
      </div>
    </div>
    <div class="msg-controls">
      <button class="ctrl-btn" id="btn-clear-letter" ${hasText ? '' : 'disabled'}>
        <span class="ctrl-glyph">⌫</span>
        <span class="ctrl-label">Letter</span>
      </button>
      <button class="ctrl-btn" id="btn-clear-all" ${hasText ? '' : 'disabled'}>
        <span class="ctrl-glyph">✕</span>
        <span class="ctrl-label">Clear</span>
      </button>
      <button class="speak-btn" id="btn-speak" ${hasText ? '' : 'disabled'}>
        <span class="speak-glyph">▶</span>Speak
      </button>
    </div>`;

  if (hasText) {
    el('btn-clear-letter').onclick = clearLast;
    el('btn-clear-all').onclick    = clearAll;
    el('btn-speak').onclick        = () => speak(S.message);
  }
}

// Prediction row
function renderPredRow() {
  const row = el('pred-row');
  const isZone = S.inputMode === 'scan' && S.scanPhase === 'zone' && S.scanZone === 0;
  row.classList.toggle('scan-zone-active', isZone);

  row.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const text   = S.predictions[i] || '';
    const filled = !!text;
    const slot   = document.createElement('div');
    const isPhrase = text.includes(' ');
    const isScanItem = S.inputMode === 'scan' && S.scanPhase === 'item' &&
                       scanZones()[S.scanZone]?.type === 'pred' && S.scanItem === i;

    slot.className = `pred-slot ${filled ? 'filled' : 'empty'}`;
    if (isScanItem) slot.style.outline = `3px solid var(--scan)`;

    if (filled) {
      slot.innerHTML = `<span class="pred-text${isPhrase ? ' phrase' : ''}">${h(text)}</span>`;
      slot.addEventListener('pointerdown', e => {
        e.preventDefault();
        if (isPhrase) appendPhrase(text);
        else appendWord(text);
      });
    }
    row.appendChild(slot);
  }
}

// Grid area: spelling grid or needs panel
function renderGridArea() {
  const sgrid  = el('spelling-grid');
  const npanel = el('needs-panel');

  if (S.needsMode === 'none') {
    sgrid.classList.remove('hidden');
    npanel.classList.add('hidden');
    renderGrid();
  } else {
    sgrid.classList.add('hidden');
    npanel.classList.remove('hidden');
    renderNeeds();
  }
}

// Spelling grid
function renderGrid() {
  const grid  = el('spelling-grid');
  const rows  = getGridRows();
  const zones = scanZones();

  grid.innerHTML = '';

  rows.forEach((keys, ri) => {
    const zone = zones[ri + 1]; // zone 0 is pred row
    const isZoneHighlight = S.inputMode === 'scan' && S.scanPhase === 'zone' &&
                            S.scanZone === ri + 1;
    const isItemRow = S.inputMode === 'scan' && S.scanPhase === 'item' &&
                      S.scanZone === ri + 1;

    const rowEl = document.createElement('div');
    rowEl.className = 'key-row';

    if (isZoneHighlight || isItemRow) {
      const band = document.createElement('div');
      band.className = 'scan-band';
      rowEl.appendChild(band);
    }

    keys.forEach((k, ki) => {
      const keyEl = document.createElement('div');
      const label  = k.label || k.char;
      let cls = 'key';
      if (k.kind === 'space')  cls += ' key-space';
      if (k.kind === 'punct')  cls += ' key-punct';

      const isScanItem = S.inputMode === 'scan' && S.scanPhase === 'item' &&
                         S.scanZone === ri + 1 && S.scanItem === ki;
      if (isScanItem) cls += ' scan-item';

      keyEl.className = cls;
      keyEl.innerHTML = `<span class="key-label">${h(label)}</span>`;

      if (S.inputMode === 'direct') {
        keyEl.addEventListener('pointerdown', e => {
          e.preventDefault();
          keyEl.classList.add('pressed');
        });
        keyEl.addEventListener('pointerup', e => {
          e.preventDefault();
          keyEl.classList.remove('pressed');
          appendChar(k.char);
        });
        keyEl.addEventListener('pointerleave', () => keyEl.classList.remove('pressed'));
        keyEl.addEventListener('pointercancel', () => keyEl.classList.remove('pressed'));
      } else if (S.inputMode === 'dwell') {
        keyEl.addEventListener('pointerenter', () => startDwell(keyEl, k.char));
        keyEl.addEventListener('pointerleave', stopDwell);
        keyEl.addEventListener('pointercancel', stopDwell);
      }
      // Scan mode: keys are not directly interactive (switch button drives selection)

      rowEl.appendChild(keyEl);
    });

    grid.appendChild(rowEl);
  });
}

// Needs panel
function renderNeeds() {
  const panel = el('needs-panel');
  const isL2  = S.needsMode === 'l2';
  const tiles = isL2 ? NEEDS_L2 : NEEDS_L1.map(l => ({ label: l, sub: null, wide: false }));
  const title = isL2 ? 'Where?' : 'What do you need?';

  const tilesHTML = tiles.map(t => `
    <div class="needs-tile${t.wide ? ' wide' : ''}" data-label="${h(t.label)}">
      <span class="tile-label">${h(t.label)}</span>
      ${t.sub ? `<span class="tile-sub">${h(t.sub)}</span>` : ''}
    </div>`).join('');

  panel.innerHTML = `
    <div class="needs-hdr">
      ${isL2 ? `<button class="needs-back" id="needs-back"><span class="needs-back-gl">‹</span>Back</button>` : ''}
      <span class="needs-title">${h(title)}</span>
    </div>
    <div class="needs-tiles">${tilesHTML}</div>
    <div class="needs-other" id="needs-other">
      <span class="needs-other-label">Other</span>
      <span class="needs-other-hint">Spell it out</span>
    </div>`;

  if (isL2) {
    panel.querySelector('#needs-back').onclick = () => { S.needsMode = 'l1'; render(); };
  }
  panel.querySelectorAll('.needs-tile').forEach(t => {
    t.onclick = () => {
      if (!isL2) {
        S.needsL1Sel = t.dataset.label;
        S.needsMode = 'l2';
        render();
      } else {
        speak(`${S.needsL1Sel || ''} — ${t.dataset.label}`);
        S.needsMode = 'none';
        render();
      }
    };
  });
  panel.querySelector('#needs-other').onclick = () => { S.needsMode = 'none'; render(); };
}

// Rail (quick phrases, mode/settings controls)
function renderRail() {
  const qg = el('quick-group');
  qg.innerHTML = `
    <span class="quick-label">QUICK PHRASES</span>
    ${S.quickPhrases.map((p, i) =>
      `<button class="quick-btn" data-i="${i}">${h(p)}</button>`
    ).join('')}
    <div class="rail-controls">
      <div class="mode-row">
        <button class="mode-btn${S.inputMode === 'direct' ? ' active' : ''}" data-mode="direct">Direct</button>
        <button class="mode-btn${S.inputMode === 'scan'   ? ' active' : ''}" data-mode="scan">Scan</button>
        <button class="mode-btn${S.inputMode === 'dwell'  ? ' active' : ''}" data-mode="dwell">Dwell</button>
      </div>
      <div class="settings-row">
        <button class="set-btn" id="btn-theme">${S.theme === 'light' ? '🌙 Dark' : '☀️ Light'}</button>
        <button class="set-btn" id="btn-layout">${S.layout === 'abc' ? 'A–Z' : 'Freq'}</button>
        <button class="set-btn" id="btn-density">${S.density === 'default' ? 'Larger' : 'Smaller'}</button>
      </div>
    </div>`;

  qg.querySelectorAll('.quick-btn').forEach(btn => {
    btn.onclick = () => {
      const phrase = S.quickPhrases[+btn.dataset.i];
      S.message = phrase;
      speak(phrase);
      S.restoredDraft = false;
      afterMessageChange();
    };
  });

  qg.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      const mode = btn.dataset.mode;
      if (mode === S.inputMode) return;
      stopDwell();
      S.inputMode = mode;
      if (mode === 'scan') startScan();
      else stopScan();
      render();
    };
  });

  qg.querySelector('#btn-theme').onclick = () => {
    S.theme = S.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('ev-theme', S.theme);
    render();
  };
  qg.querySelector('#btn-layout').onclick = () => {
    S.layout = S.layout === 'abc' ? 'frequency' : 'abc';
    localStorage.setItem('ev-layout', S.layout);
    render();
  };
  qg.querySelector('#btn-density').onclick = () => {
    S.density = S.density === 'default' ? 'large' : 'default';
    localStorage.setItem('ev-density', S.density);
    render();
  };
}

// ── Viewport scaling ──────────────────────────────────────────────────────
function scaleApp() {
  const s = Math.min(window.innerWidth / 1180, window.innerHeight / 820);
  el('app').style.transform = `scale(${s})`;
}

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  // Restore draft
  const saved = localStorage.getItem('ev-draft');
  if (saved) {
    S.message = saved;
    S.restoredDraft = true;
  }
  S.predictions = computePredictions(S.message);

  render();

  // Dismiss draft chip after 3s or on first input
  if (S.restoredDraft) {
    setTimeout(() => {
      if (S.restoredDraft) {
        S.restoredDraft = false;
        renderMsgBar();
      }
    }, 3000);
  }

  // Static rail buttons
  el('yes-btn').onclick  = () => speak('Yes');
  el('no-btn').onclick   = () => speak('No');
  el('needs-btn').onclick = () => {
    S.needsMode = S.needsMode === 'none' ? 'l1' : 'none';
    render();
  };
  el('switch-btn').onclick = onSwitch;

  // Physical keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === ' ' && S.inputMode === 'scan') {
      e.preventDefault();
      onSwitch();
      return;
    }
    if (e.key === 'Backspace')      { e.preventDefault(); clearLast(); return; }
    if (e.key === 'Escape')         { e.preventDefault(); clearAll();  return; }
    if (e.key === 'Enter')          { e.preventDefault(); speak(S.message); return; }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && S.inputMode === 'direct') {
      appendChar(e.key);
    }
  });

}

// Scale before first paint, then keep in sync
window.addEventListener('resize', scaleApp);
document.addEventListener('DOMContentLoaded', () => { scaleApp(); init(); });
