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

// Default needs tree — mirrors DEFAULT_NEEDS_TREE in admin-src/.../app-state.model.ts.
// Used when the admin has never saved a tree. Caregiver edits in the admin replace this.
const DEFAULT_NEEDS_TREE = [
  { id: 'scratch', label: 'Scratch', children: [
    { id: 'scratch-head', label: 'Head' },
    { id: 'scratch-back', label: 'Back' },
    { id: 'scratch-arm',  label: 'Arm' },
    { id: 'scratch-other', label: 'Other', isOther: true, locked: true },
  ]},
  { id: 'massage', label: 'Massage', children: [
    { id: 'massage-shoulder', label: 'Shoulder' },
    { id: 'massage-back', label: 'Back' },
    { id: 'massage-hand', label: 'Hand' },
    { id: 'massage-other', label: 'Other', isOther: true, locked: true },
  ]},
  { id: 'move', label: 'Move / reposition', children: [
    { id: 'move-upper', label: 'Upper body' },
    { id: 'move-lower', label: 'Lower body' },
    { id: 'move-other', label: 'Other', isOther: true, locked: true },
  ]},
  { id: 'change', label: 'Change', children: [
    { id: 'change-other', label: 'Other', isOther: true, locked: true },
  ]},
  { id: 'root-other', label: 'Other', isOther: true, locked: true },
];

// ── Admin state bridge ───────────────────────────────────────────────────
const EV_STATE_KEY = 'ev-state';

const ADMIN_DEFAULTS = {
  inputMode:        'direct',
  scanSpeedMs:      1600,
  dwellMs:          1500,
  theme:            'light',
  letterLayout:     'frequency',
  gridDensity:      'default',
  ttsVoiceName:     '',
  ttsRate:          1.0,
  ttsPitch:         1.0,
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases: true,
  showYesNo:        true,
  showNeedsMenu:    true,
  quickPhrases:     ['Please move me', 'Scratch my head', 'Thank you', 'One moment'],
  needsTree:        DEFAULT_NEEDS_TREE,
  needsRootQuestion: 'What do you need?',
};

function readAdminState() {
  try {
    const raw = localStorage.getItem(EV_STATE_KEY);
    if (!raw) return migrateFromLegacy();
    const parsed = JSON.parse(raw);
    const s = parsed.settings || {};
    const phraseObjs = parsed.quickPhrases;
    return {
      inputMode:         s.inputMode        || ADMIN_DEFAULTS.inputMode,
      scanSpeedMs:       s.scanSpeedMs      || ADMIN_DEFAULTS.scanSpeedMs,
      dwellMs:           s.dwellMs          || ADMIN_DEFAULTS.dwellMs,
      theme:             s.theme            || ADMIN_DEFAULTS.theme,
      letterLayout:      s.letterLayout     || ADMIN_DEFAULTS.letterLayout,
      gridDensity:       s.gridDensity      || ADMIN_DEFAULTS.gridDensity,
      ttsVoiceName:      s.ttsVoiceName     || ADMIN_DEFAULTS.ttsVoiceName,
      ttsRate:           s.ttsRate          != null ? s.ttsRate  : ADMIN_DEFAULTS.ttsRate,
      ttsPitch:          s.ttsPitch         != null ? s.ttsPitch : ADMIN_DEFAULTS.ttsPitch,
      showSpellingGrid:  s.showSpellingGrid  != null ? !!s.showSpellingGrid  : ADMIN_DEFAULTS.showSpellingGrid,
      showPredictionRow: s.showPredictionRow != null ? !!s.showPredictionRow : ADMIN_DEFAULTS.showPredictionRow,
      showQuickPhrases:  s.showQuickPhrases  != null ? !!s.showQuickPhrases  : ADMIN_DEFAULTS.showQuickPhrases,
      showYesNo:         s.showYesNo         != null ? !!s.showYesNo         : ADMIN_DEFAULTS.showYesNo,
      showNeedsMenu:     s.showNeedsMenu     != null ? !!s.showNeedsMenu     : ADMIN_DEFAULTS.showNeedsMenu,
      needsTree: (Array.isArray(parsed.needsTree) && parsed.needsTree.length)
        ? parsed.needsTree
        : ADMIN_DEFAULTS.needsTree,
      needsRootQuestion: parsed.needsRootQuestion || ADMIN_DEFAULTS.needsRootQuestion,
      quickPhrases: Array.isArray(phraseObjs)
        ? phraseObjs.slice(0, 4).map(p => p.text || p).filter(Boolean)
        : ADMIN_DEFAULTS.quickPhrases,
      allPhraseTexts: Array.isArray(phraseObjs)
        ? phraseObjs.map(p => p.text || p).filter(Boolean)
        : ADMIN_DEFAULTS.quickPhrases,
      personalWords: (function () {
        const ws = [];
        const add = arr => (arr || []).forEach(item => {
          const s = (typeof item === 'string' ? item : (item && item.name)) || '';
          s.trim().split(/\s+/).forEach(t => { if (t) ws.push(t); });
        });
        add(parsed.people);
        add(parsed.caregivers);
        add(parsed.pets);
        add(parsed.places);
        add(parsed.careTerms);
        return [...new Set(ws)];
      }()),
    };
  } catch {
    return { ...ADMIN_DEFAULTS };
  }
}

function migrateFromLegacy() {
  const theme   = localStorage.getItem('ev-theme');
  const layout  = localStorage.getItem('ev-layout');
  const density = localStorage.getItem('ev-density');
  return {
    ...ADMIN_DEFAULTS,
    theme:       (theme   === 'dark')                        ? 'dark'      : ADMIN_DEFAULTS.theme,
    letterLayout:(layout  === 'abc' || layout === 'frequency') ? layout    : ADMIN_DEFAULTS.letterLayout,
    gridDensity: (density === 'large')                       ? 'large'     : ADMIN_DEFAULTS.gridDensity,
  };
}

function saveSettingToAdminState(patch) {
  try {
    const raw = localStorage.getItem(EV_STATE_KEY);
    const state = raw ? JSON.parse(raw) : { schemaVersion: 1, settings: {} };
    state.settings = { ...state.settings, ...patch };
    localStorage.setItem(EV_STATE_KEY, JSON.stringify(state));
  } catch { /* storage unavailable */ }
}

// ── State ────────────────────────────────────────────────────────────────
const S = {
  message:      '',
  restoredDraft: false,
  predictions:  [],

  // Settings (populated from admin state on init and on storage events)
  theme:        'light',
  layout:       'frequency',
  density:      'default',
  inputMode:    'direct',
  scanSpeedMs:  1600,
  dwellMs:      1500,
  ttsVoiceName: '',
  ttsRate:      1.0,
  ttsPitch:     1.0,
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases:  true,
  showYesNo:    true,
  showNeedsMenu: true,
  quickPhrases: ['Please move me', 'Scratch my head', 'Thank you', 'One moment'],
  needsTree:    [],
  needsRootQuestion: 'What do you need?',

  // Needs navigation: needsOpen toggles the panel; needsPath is the stack of
  // node ids the user has drilled into (empty = root level).
  needsOpen:    false,
  needsPath:    [],

  // Scanning
  scanPhase:  'zone',
  scanZone:   0,
  scanItem:   0,
  scanTimer:  null,

  // Dwell
  dwellEl:    null,
  dwellRAF:   null,
  dwellStart: null,
};

function applyAdminSettings() {
  const a = readAdminState();
  S.theme        = a.theme;
  S.layout       = a.letterLayout;
  S.density      = a.gridDensity;
  S.inputMode    = a.inputMode;
  S.scanSpeedMs  = a.scanSpeedMs;
  S.dwellMs      = a.dwellMs;
  S.ttsVoiceName = a.ttsVoiceName;
  S.ttsRate      = a.ttsRate;
  S.ttsPitch     = a.ttsPitch;
  S.showSpellingGrid  = a.showSpellingGrid;
  S.showPredictionRow = a.showPredictionRow;
  S.showQuickPhrases  = a.showQuickPhrases;
  S.showYesNo    = a.showYesNo;
  S.showNeedsMenu     = a.showNeedsMenu;
  S.quickPhrases = a.quickPhrases;
  S.needsTree    = a.needsTree;
  S.needsRootQuestion = a.needsRootQuestion;
  if (window.Pred) Pred.setAdminData({
    personalWords: a.personalWords || [],
    phrases:       a.allPhraseTexts || a.quickPhrases,
  });
}

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

  if (msg.endsWith(' ')) {
    return ['and', 'but', 'please', 'now', 'I'].slice(0, 5);
  }

  const trimmed = msg.trimEnd();
  if (!trimmed) return PHRASE_SUGGESTIONS.slice(0, 5);

  const lastSpace = trimmed.lastIndexOf(' ');
  const partial   = lastSpace >= 0 ? trimmed.slice(lastSpace + 1) : trimmed;

  if (!partial) return ['and', 'but', 'please', 'now', 'I'].slice(0, 5);

  const prefix  = partial.toLowerCase();
  const matches = VOCAB.filter(w => w.toLowerCase().startsWith(prefix) && w.toLowerCase() !== prefix);
  return matches.slice(0, 5);
}

// ── Speech ───────────────────────────────────────────────────────────────
let _ttsVoiceCache = null;
let _ttsVoiceCacheName = null;

function speak(text) {
  if (!text || !text.trim()) return;
  if (window.Pred) Pred.commitMessage(text.trim());
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.trim());

  if (S.ttsVoiceName && S.ttsVoiceName !== _ttsVoiceCacheName) {
    _ttsVoiceCache = speechSynthesis.getVoices().find(v => v.name === S.ttsVoiceName) || null;
    _ttsVoiceCacheName = S.ttsVoiceName;
  }
  if (_ttsVoiceCache) utt.voice = _ttsVoiceCache;
  utt.rate  = S.ttsRate;
  utt.pitch = S.ttsPitch;

  window.speechSynthesis.speak(utt);
}

// ── Message mutations ────────────────────────────────────────────────────
function appendChar(char) {
  if (char === ' ') {
    if (!S.message.endsWith(' ')) {
      if (window.Pred) {
        const parts = S.message.trim().split(/\s+/).filter(Boolean);
        if (parts.length) Pred.commitWord(parts[parts.length - 2] || '', parts[parts.length - 1]);
      }
      S.message += ' ';
    }
  } else {
    S.message += char;
  }
  S.restoredDraft = false;
  afterMessageChange();
}

function appendWord(word) {
  const lastSpace = S.message.lastIndexOf(' ');
  if (lastSpace >= 0) {
    if (window.Pred) {
      const prevParts = S.message.slice(0, lastSpace).trimEnd().split(/\s+/).filter(Boolean);
      Pred.commitWord(prevParts[prevParts.length - 1] || '', word);
    }
    S.message = S.message.slice(0, lastSpace + 1) + word + ' ';
  } else {
    if (window.Pred) Pred.commitWord('', word);
    S.message = word + ' ';
  }
  S.restoredDraft = false;
  afterMessageChange();
}

function appendPhrase(phrase) {
  if (window.Pred) Pred.commitPhrase(phrase);
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
  S.predictions = window.Pred ? Pred.compute(S.message) : computePredictions(S.message);
  render();
}

// ── Scanning ─────────────────────────────────────────────────────────────
function startScan() {
  stopScan();
  S.scanPhase = 'zone';
  S.scanZone  = 0;
  S.scanItem  = 0;
  advanceZone();
  renderGrid();
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
  }, S.scanSpeedMs);
}

function advanceItem(items) {
  renderGrid();
  renderPredRow();
  const itemMs = Math.round(S.scanSpeedMs * 0.69);
  S.scanTimer = setTimeout(() => {
    S.scanItem = (S.scanItem + 1) % items.length;
    if (S.scanItem === 0) {
      S.scanPhase = 'zone';
      advanceZone();
    } else {
      advanceItem(items);
    }
  }, itemMs);
}

function onSwitch() {
  if (S.inputMode !== 'scan') return;
  if (S.scanTimer) clearTimeout(S.scanTimer);

  const zones = scanZones();
  const zone  = zones[S.scanZone];

  if (S.scanPhase === 'zone') {
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
    const prog = Math.min((ts - S.dwellStart) / S.dwellMs, 1);
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
  document.body.dataset.theme = S.theme;

  // Section visibility
  el('pred-row').classList.toggle('section-hidden', !S.showPredictionRow);
  el('yes-btn').classList.toggle('section-hidden', !S.showYesNo);
  el('no-btn').classList.toggle('section-hidden', !S.showYesNo);
  el('needs-btn').classList.toggle('section-hidden', !S.showNeedsMenu);

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
  const showGrid = S.showSpellingGrid;

  if (!S.needsOpen) {
    sgrid.classList.toggle('hidden', !showGrid);
    npanel.classList.add('hidden');
    if (showGrid) renderGrid();
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

      rowEl.appendChild(keyEl);
    });

    grid.appendChild(rowEl);
  });
}

// Needs panel — renders the admin-defined needs tree at any depth.
// A node with non-"Other" children is a category (drills deeper); a node with
// none is a leaf (speaks the full path and closes). "Other" at any level spells out.

// Resolve the list of nodes at the current S.needsPath, plus the parent's label.
function needsLevel() {
  let list = S.needsTree || [];
  let parentLabel = null;
  for (const id of (S.needsPath || [])) {
    const node = (list || []).find(n => n.id === id);
    if (node && Array.isArray(node.children)) { list = node.children; parentLabel = node.label; }
    else { list = []; break; }
  }
  return { list, parentLabel };
}

// Walk the tree along a list of ids, collecting each node's label.
function needsLabelsForPath(ids) {
  const labels = [];
  let list = S.needsTree || [];
  for (const id of ids) {
    const node = (list || []).find(n => n.id === id);
    if (!node) break;
    labels.push(node.label);
    list = node.children || [];
  }
  return labels;
}

function renderNeeds() {
  const panel = el('needs-panel');
  const { list, parentLabel } = needsLevel();
  const atRoot = (S.needsPath || []).length === 0;
  const title  = atRoot ? (S.needsRootQuestion || 'What do you need?') : (parentLabel || '');

  const tiles = (list || []).filter(n => !n.isOther);
  const tilesHTML = tiles.map(n => {
    const isLeaf = !(Array.isArray(n.children) && n.children.some(c => !c.isOther));
    return `
    <div class="needs-tile" data-id="${h(n.id)}" data-leaf="${isLeaf ? '1' : '0'}">
      <span class="tile-label">${h(n.label)}</span>
    </div>`;
  }).join('');

  panel.innerHTML = `
    <div class="needs-hdr">
      ${!atRoot ? `<button class="needs-back" id="needs-back"><span class="needs-back-gl">‹</span>Back</button>` : ''}
      <span class="needs-title">${h(title)}</span>
    </div>
    <div class="needs-tiles">${tilesHTML}</div>
    <div class="needs-other" id="needs-other">
      <span class="needs-other-label">Other</span>
      <span class="needs-other-hint">Spell it out</span>
    </div>`;

  if (!atRoot) {
    panel.querySelector('#needs-back').onclick = () => {
      S.needsPath = S.needsPath.slice(0, -1);
      render();
    };
  }
  panel.querySelectorAll('.needs-tile').forEach(t => {
    t.onclick = () => {
      const id = t.dataset.id;
      if (t.dataset.leaf === '0') {
        S.needsPath = [...S.needsPath, id];
        render();
      } else {
        speak(needsLabelsForPath([...S.needsPath, id]).join(' — '));
        S.needsOpen = false;
        S.needsPath = [];
        render();
      }
    };
  });
  panel.querySelector('#needs-other').onclick = () => {
    S.needsOpen = false;
    S.needsPath = [];
    render();
  };
}

// Rail (quick phrases, mode/settings controls)
function renderRail() {
  const qg = el('quick-group');
  const phrasesToShow = S.showQuickPhrases ? S.quickPhrases : [];

  qg.innerHTML = `
    ${S.showQuickPhrases ? `<span class="quick-label">QUICK PHRASES</span>` : ''}
    ${phrasesToShow.map((p, i) =>
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
      <a class="admin-link" href="../admin/" title="Caregiver settings">⚙ Settings</a>
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
      saveSettingToAdminState({ inputMode: mode });
      if (mode === 'scan') startScan();
      else stopScan();
      render();
    };
  });

  qg.querySelector('#btn-theme').onclick = () => {
    S.theme = S.theme === 'light' ? 'dark' : 'light';
    saveSettingToAdminState({ theme: S.theme });
    render();
  };
  qg.querySelector('#btn-layout').onclick = () => {
    S.layout = S.layout === 'abc' ? 'frequency' : 'abc';
    saveSettingToAdminState({ letterLayout: S.layout });
    render();
  };
  qg.querySelector('#btn-density').onclick = () => {
    S.density = S.density === 'default' ? 'large' : 'default';
    saveSettingToAdminState({ gridDensity: S.density });
    render();
  };
}

// ── Viewport scaling ──────────────────────────────────────────────────────
function scaleApp() {
  const app = el('app');
  const W = window.innerWidth, H = window.innerHeight;
  if (H > W) {
    const s = Math.min(H / 1180, W / 820);
    const cw = H / s, ch = W / s;
    app.style.width = `${cw}px`;
    app.style.height = `${ch}px`;
    app.style.transform =
      `translate(${W/2}px,${H/2}px) rotate(90deg) scale(${s}) translate(${-cw/2}px,${-ch/2}px)`;
  } else {
    const s = Math.min(W / 1180, H / 820);
    app.style.width = `${W / s}px`;
    app.style.height = `${H / s}px`;
    app.style.transform = `scale(${s})`;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
function init() {
  if (window.Pred) Pred.init();
  applyAdminSettings();

  // Restore draft
  const saved = localStorage.getItem('ev-draft');
  if (saved) {
    S.message = saved;
    S.restoredDraft = true;
  }
  S.predictions = window.Pred ? Pred.compute(S.message) : computePredictions(S.message);

  render();

  if (S.restoredDraft) {
    setTimeout(() => {
      if (S.restoredDraft) { S.restoredDraft = false; renderMsgBar(); }
    }, 3000);
  }

  // Static rail buttons
  el('yes-btn').onclick  = () => speak('Yes');
  el('no-btn').onclick   = () => speak('No');
  el('needs-btn').onclick = () => {
    S.needsOpen = !S.needsOpen;
    S.needsPath = [];
    render();
  };
  el('switch-btn').onclick = onSwitch;

  // Physical keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' && S.inputMode === 'scan') {
      e.preventDefault(); onSwitch(); return;
    }
    if (e.key === 'Backspace')      { e.preventDefault(); clearLast(); return; }
    if (e.key === 'Escape')         { e.preventDefault(); clearAll();  return; }
    if (e.key === 'Enter')          { e.preventDefault(); speak(S.message); return; }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && S.inputMode === 'direct') {
      appendChar(e.key);
    }
  });

  // Re-apply admin settings, handling a scan-mode start/stop transition.
  function refreshFromAdminState() {
    _ttsVoiceCache = null; // invalidate voice cache
    const wasScanning = S.inputMode === 'scan';
    applyAdminSettings();
    if (wasScanning && S.inputMode !== 'scan') stopScan();
    else if (!wasScanning && S.inputMode === 'scan') startScan();
    render();
  }

  // Cross-tab sync: admin changed ev-state in another tab/window.
  window.addEventListener('storage', e => {
    if (e.key === EV_STATE_KEY) refreshFromAdminState();
  });

  // Returning from the admin via the browser back button restores this page
  // from the bfcache without re-running init — re-read settings then.
  window.addEventListener('pageshow', e => {
    if (e.persisted) refreshFromAdminState();
  });
}

// Block iOS double-tap-to-zoom
let lastTouchEnd = 0;
document.addEventListener('touchend', e => {
  const now = Date.now();
  if (now - lastTouchEnd <= 350 && !e.target.closest('button:not([disabled])')) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

// Scale before first paint, then keep in sync
window.addEventListener('resize', scaleApp);
window.addEventListener('orientationchange', () => setTimeout(scaleApp, 100));
document.addEventListener('DOMContentLoaded', () => { scaleApp(); init(); });
