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
  scanAutoStart:    false,
  scanSpeedMs:      1600,
  theme:            'light',
  letterLayout:     'abc',
  gridDensity:      'default',
  ttsVoiceName:     '',
  ttsRate:          1.0,
  ttsPitch:         1.0,
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases: true,
  showYesNo:        true,
  showNeedsMenu:    true,
  quickPhrases:     ['Please move me', 'Scratch my head', 'Thank you', 'One moment please', 'I love you'],
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
      // scanAutoStart is new in schemaVersion 2. Fall back to the old
      // inputMode==='scan' setting so a v1 blob still autostarts correctly.
      scanAutoStart:     s.scanAutoStart      != null ? !!s.scanAutoStart : s.inputMode === 'scan',
      scanSpeedMs:       s.scanSpeedMs       || ADMIN_DEFAULTS.scanSpeedMs,
      theme:             s.theme             || ADMIN_DEFAULTS.theme,
      letterLayout:      s.letterLayout      || ADMIN_DEFAULTS.letterLayout,
      gridDensity:       s.gridDensity       || ADMIN_DEFAULTS.gridDensity,
      ttsVoiceName:      s.ttsVoiceName      || ADMIN_DEFAULTS.ttsVoiceName,
      ttsRate:           s.ttsRate           != null ? s.ttsRate  : ADMIN_DEFAULTS.ttsRate,
      ttsPitch:          s.ttsPitch          != null ? s.ttsPitch : ADMIN_DEFAULTS.ttsPitch,
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
        ? phraseObjs.slice(0, 5).map(p => p.text || p).filter(Boolean)
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

// ── State ────────────────────────────────────────────────────────────────
const S = {
  message:      '',
  restoredDraft: false,
  predictions:  [],

  // Settings (populated from admin state on init and on storage events)
  theme:        'light',
  layout:       'abc',
  density:      'default',
  scanSpeedMs:  1600,
  scanAutoStart: false,
  ttsVoiceName: '',
  ttsRate:      1.0,
  ttsPitch:     1.0,
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases:  true,
  showYesNo:    true,
  showNeedsMenu: true,
  quickPhrases: ['Please move me', 'Scratch my head', 'Thank you', 'One moment please', 'I love you'],
  needsTree:    [],
  needsRootQuestion: 'What do you need?',

  // Needs navigation: needsOpen toggles the board; needsPath is the stack of
  // node ids drilled into (empty = root level); needsPage paginates a level
  // with more than 8 tiles.
  needsOpen:    false,
  needsPath:    [],
  needsPage:    0,

  // Scanning — runtime only, never persisted. scanAutoStart (above) is the
  // only thing that survives to ev-state.
  scanning:     false,
  scanPhase:    'row',   // 'row' | 'item'
  scanRowIdx:   0,
  scanItemIdx:  0,
  scanTimer:    null,

  // Undo: message snapshots taken immediately before each insertion, so the
  // Backspace action button can undo a whole letter/word/phrase insertion
  // in one press instead of one character at a time.
  undoStack:    [],
};

function applyAdminSettings() {
  const a = readAdminState();
  S.theme        = a.theme;
  S.layout       = a.letterLayout;
  S.density      = a.gridDensity;
  S.scanSpeedMs  = a.scanSpeedMs;
  S.scanAutoStart = a.scanAutoStart;
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
  if (!S.showNeedsMenu && S.needsOpen) {
    S.needsOpen = false;
    S.needsPath = [];
    S.needsPage = 0;
  }
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

// Grid rows as arrays of key descriptors — 5 rows: four of 6 letters, then a
// tail row of the 2 leftover letters + space (+ punctuation unless large density).
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

// ── Undo stack ───────────────────────────────────────────────────────────
function pushUndo() {
  S.undoStack.push(S.message);
  if (S.undoStack.length > 100) S.undoStack.shift();
}

// Backspace action: undo the last insertion as a whole (a letter, a selected
// word, or a selected phrase), falling back to a single-char delete once the
// stack is empty (e.g. right after a draft restore).
function undoInsertion() {
  while (S.undoStack.length) {
    const prev = S.undoStack.pop();
    if (prev !== S.message) {
      S.message = prev;
      S.restoredDraft = false;
      afterMessageChange();
      return;
    }
  }
  clearLast();
}

// ── Message mutations ────────────────────────────────────────────────────
function appendChar(char) {
  const isNoOpSpace = char === ' ' && S.message.endsWith(' ');
  if (!isNoOpSpace) {
    pushUndo();
    if (char === ' ') {
      if (window.Pred) {
        const parts = S.message.trim().split(/\s+/).filter(Boolean);
        if (parts.length) Pred.commitWord(parts[parts.length - 2] || '', parts[parts.length - 1]);
      }
      S.message += ' ';
    } else {
      S.message += char;
    }
  }
  S.restoredDraft = false;
  afterMessageChange();
}

function appendWord(word) {
  pushUndo();
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
  pushUndo();
  if (window.Pred) Pred.commitPhrase(phrase);
  S.message = phrase + ' ';
  S.restoredDraft = false;
  afterMessageChange();
}

// Quick phrase: replaces the message outright (not an append) and speaks
// immediately, same as tapping Yes/No.
function selectQuickPhrase(phrase) {
  pushUndo();
  S.message = phrase;
  speak(phrase);
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
  S.undoStack = [];
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

// ── Needs board ──────────────────────────────────────────────────────────
// Renders the admin-defined needs tree at any depth. A node with non-"Other"
// children is a category (drills deeper); a node with none is a leaf (speaks
// the full path and closes). "Other" at any level spells out.

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

function needsPageTiles() {
  const { list } = needsLevel();
  const nonOther = (list || []).filter(n => !n.isOther);
  const other = (list || []).find(n => n.isOther);
  return other ? [...nonOther, other] : nonOther.slice();
}

// Physical row 0 of the grid area becomes the (non-selectable) level header;
// rows 1–4 hold up to 8 tiles, 2 per row, paginated 7-per-page + a More tile
// once a level has more than 8 entries.
function needsRowItems(rowIdx) {
  if (rowIdx === 0) return [];
  const tiles = needsPageTiles();
  const paginated = tiles.length > 8;
  const perPage = paginated ? 7 : tiles.length;
  const start = S.needsPage * perPage;
  let pageTiles = tiles.slice(start, start + perPage);
  if (paginated) pageTiles = pageTiles.concat([{ __more: true }]);

  const slotStart = (rowIdx - 1) * 2;
  return pageTiles.slice(slotStart, slotStart + 2).map(t => {
    if (t.__more) return { type: 'needs-more' };
    const isLeaf = !(Array.isArray(t.children) && t.children.some(c => !c.isOther));
    return { type: 'needs-tile', id: t.id, label: t.label, isOther: !!t.isOther, isLeaf };
  });
}

function onNeedsTileSelect(tile) {
  if (tile.isOther) {
    S.needsOpen = false; S.needsPath = []; S.needsPage = 0;
    render();
    return;
  }
  if (tile.isLeaf) {
    speak(needsLabelsForPath([...(S.needsPath || []), tile.id]).join(' — '));
    S.needsOpen = false; S.needsPath = []; S.needsPage = 0;
    render();
    return;
  }
  S.needsPath = [...(S.needsPath || []), tile.id];
  S.needsPage = 0;
  render();
}

function toggleNeeds() {
  if (!S.needsOpen) {
    S.needsOpen = true; S.needsPath = []; S.needsPage = 0;
  } else if ((S.needsPath || []).length > 0) {
    S.needsPath = S.needsPath.slice(0, -1); S.needsPage = 0;
  } else {
    S.needsOpen = false; S.needsPath = []; S.needsPage = 0;
  }
  render();
}

// ── Row model ────────────────────────────────────────────────────────────
// Single source of truth for rendering, direct taps, and scanning. Rows 0–4
// carry the spelling grid (or, while the needs board is open, the needs
// header/tiles); row 5 carries predictions/quick phrases; row 6 is the
// message bar. Every row but the message bar pairs its content with a
// trailing action button.

function gridRowItems(rowIdx) {
  if (!S.showSpellingGrid) return [];
  return getGridRows()[rowIdx].map(k => ({ type: 'key', char: k.char, kind: k.kind, label: k.label }));
}

function predRowItems() {
  if (!S.showPredictionRow) return [];
  const hasMsg = S.message.length > 0;
  if (!hasMsg && S.showQuickPhrases && S.quickPhrases.length) {
    return S.quickPhrases.slice(0, 5).map(text => ({ type: 'quick', text }));
  }
  return (S.predictions || []).map(text => ({ type: 'pred', text }));
}

function getRows() {
  const actions = ['settings', 'clear', 'yes', 'no', 'scan'];
  const rows = [];
  for (let i = 0; i <= 4; i++) {
    rows.push({
      idx: i,
      contentId: `grid-r${i}`,
      isHeader: S.needsOpen && i === 0,
      items: S.needsOpen ? needsRowItems(i) : gridRowItems(i),
      action: actions[i],
    });
  }
  rows.push({ idx: 5, contentId: 'pred-row', items: predRowItems(), action: 'needs' });
  rows.push({ idx: 6, contentId: 'msg-bar', items: [], action: 'select', speakStop: true });
  return rows;
}

function actionVisible(name) {
  if (name === 'yes' || name === 'no') return S.showYesNo;
  if (name === 'needs') return S.showNeedsMenu;
  return true; // settings, clear, scan, select
}

// Settings is direct-tap only (a caregiver control); Select is the scan
// actuator itself. Neither is ever a scannable target.
function actionScannable(name) {
  return name !== 'settings' && name !== 'select' && actionVisible(name);
}

function scannableItems(row) {
  const list = (row.items || []).slice();
  if (row.action && actionScannable(row.action)) list.push({ type: 'action', name: row.action });
  return list;
}

// Rows with nothing selectable drop out of the sweep entirely — this is what
// makes every show*/needs combination "just work" without special-casing.
function scanRows() {
  return getRows().filter(row => row.speakStop || scannableItems(row).length > 0);
}

// ── Selection dispatch ──────────────────────────────────────────────────
// Single dispatcher for both scan-selection and direct taps.
function selectItem(item) {
  if (!item) return;
  switch (item.type) {
    case 'key':
      appendChar(item.char);
      break;
    case 'pred':
      if (item.text.includes(' ')) appendPhrase(item.text);
      else appendWord(item.text);
      break;
    case 'quick':
      selectQuickPhrase(item.text);
      break;
    case 'needs-tile':
      onNeedsTileSelect(item);
      break;
    case 'needs-more':
      S.needsPage += 1;
      render();
      break;
    case 'action':
      runAction(item.name);
      break;
  }
}

function runAction(name) {
  switch (name) {
    case 'clear': clearAll(); break;
    case 'yes':   speak('Yes'); break;
    case 'no':    speak('No'); break;
    case 'scan':  if (S.scanning) stopScan(); else startScan(); break;
    case 'needs': toggleNeeds(); break;
    // 'settings' navigates via its own <a href>; 'select' is handled by its
    // own click handler (onSelectPress or undoInsertion), not through here.
  }
}

// ── Scanning ─────────────────────────────────────────────────────────────
const ITEM_SPEED_RATIO = 0.69;

function startScan() {
  if (S.scanTimer) clearTimeout(S.scanTimer);
  S.scanning = true;
  S.scanPhase = 'row';
  S.scanRowIdx = 0;
  S.scanItemIdx = 0;
  advanceRow();
}

function stopScan() {
  if (S.scanTimer) clearTimeout(S.scanTimer);
  S.scanTimer = null;
  S.scanning = false;
  S.scanPhase = 'row';
  render();
}

function advanceRow() {
  render();
  S.scanTimer = setTimeout(() => {
    const rows = scanRows();
    S.scanRowIdx = (S.scanRowIdx + 1) % rows.length;
    advanceRow();
  }, S.scanSpeedMs);
}

function advanceItem() {
  render();
  const itemMs = Math.round(S.scanSpeedMs * ITEM_SPEED_RATIO);
  S.scanTimer = setTimeout(() => {
    const rows = scanRows();
    const row = rows[Math.min(S.scanRowIdx, rows.length - 1)];
    const items = scannableItems(row);
    S.scanItemIdx += 1;
    if (S.scanItemIdx >= items.length) {
      S.scanItemIdx = 0;
      S.scanPhase = 'row';
      advanceRow();
    } else {
      advanceItem();
    }
  }, itemMs);
}

// The scan actuator — fired by the Select button, physical Space, or Enter.
function onSelectPress() {
  if (!S.scanning) return;
  if (S.scanTimer) clearTimeout(S.scanTimer);

  const rows = scanRows();
  S.scanRowIdx = Math.min(S.scanRowIdx, rows.length - 1);
  const row = rows[S.scanRowIdx];

  if (row.speakStop) {
    speak(S.message);
    S.scanPhase = 'row';
    advanceRow();
    return;
  }

  if (S.scanPhase === 'row') {
    S.scanPhase = 'item';
    S.scanItemIdx = 0;
    advanceItem();
  } else {
    const items = scannableItems(row);
    const item = items[S.scanItemIdx];
    selectItem(item);
    if (!S.scanning) return; // Pause was selected — stopScan() already ran
    S.scanPhase = 'row';
    const freshRows = scanRows();
    S.scanRowIdx = Math.min(S.scanRowIdx, freshRows.length - 1);
    advanceRow();
  }
}

function isActiveScanItem(rowIdx, itemIdx) {
  if (!S.scanning || S.scanPhase !== 'item') return false;
  const rows = scanRows();
  const row = rows[S.scanRowIdx];
  return !!row && row.idx === rowIdx && S.scanItemIdx === itemIdx;
}

// ── Rendering ────────────────────────────────────────────────────────────
function render() {
  const app = el('app');
  app.dataset.theme   = S.theme;
  app.dataset.density = S.density;
  document.body.dataset.theme = S.theme;

  const rows = getRows();

  renderGridRows(rows);
  renderPredRow(rows[5]);
  renderMsgBar();
  renderActions(rows);
  renderScanHighlights();
}

function buildKeyEl(item, isActive) {
  const keyEl = document.createElement('div');
  const label = item.label || item.char;
  let cls = 'key';
  if (item.kind === 'space') cls += ' key-space';
  if (item.kind === 'punct') cls += ' key-punct';
  if (isActive) cls += ' scan-item';
  keyEl.className = cls;
  keyEl.innerHTML = `<span class="key-label">${h(label)}</span>`;

  keyEl.addEventListener('pointerdown', e => { e.preventDefault(); keyEl.classList.add('pressed'); });
  keyEl.addEventListener('pointerup', e => {
    e.preventDefault();
    keyEl.classList.remove('pressed');
    selectItem(item);
  });
  keyEl.addEventListener('pointerleave', () => keyEl.classList.remove('pressed'));
  keyEl.addEventListener('pointercancel', () => keyEl.classList.remove('pressed'));
  return keyEl;
}

function buildNeedsTileEl(item, isActive) {
  const tileEl = document.createElement('div');
  let cls = 'needs-tile';
  if (item.isOther) cls += ' is-other';
  if (isActive) cls += ' scan-item';
  tileEl.className = cls;
  tileEl.innerHTML = item.isOther
    ? `<span class="tile-label">Other</span><span class="tile-sub">Spell it out</span>`
    : `<span class="tile-label">${h(item.label)}</span>`;
  tileEl.addEventListener('pointerup', e => { e.preventDefault(); selectItem(item); });
  return tileEl;
}

function buildNeedsMoreEl(isActive) {
  const moreEl = document.createElement('div');
  moreEl.className = 'needs-tile is-more' + (isActive ? ' scan-item' : '');
  moreEl.innerHTML = `<span class="tile-label">More</span><span class="tile-sub">›</span>`;
  moreEl.addEventListener('pointerup', e => { e.preventDefault(); selectItem({ type: 'needs-more' }); });
  return moreEl;
}

function renderGridRows(rows) {
  for (let i = 0; i <= 4; i++) {
    const row = rows[i];
    const container = el(row.contentId);
    container.innerHTML = '';

    if (row.isHeader) {
      const hdr = document.createElement('div');
      hdr.className = 'needs-header';
      const { parentLabel } = needsLevel();
      const atRoot = (S.needsPath || []).length === 0;
      hdr.textContent = atRoot ? (S.needsRootQuestion || 'What do you need?') : (parentLabel || '');
      container.appendChild(hdr);
      continue;
    }

    row.items.forEach((item, k) => {
      const isActive = isActiveScanItem(row.idx, k);
      if (item.type === 'key') container.appendChild(buildKeyEl(item, isActive));
      else if (item.type === 'needs-tile') container.appendChild(buildNeedsTileEl(item, isActive));
      else if (item.type === 'needs-more') container.appendChild(buildNeedsMoreEl(isActive));
    });
  }
}

function renderPredRow(row) {
  const container = el('pred-row');
  container.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const item = row.items[i];
    const isActive = isActiveScanItem(row.idx, i);
    const slot = document.createElement('div');
    const filled = !!item;
    let cls = `pred-slot ${filled ? 'filled' : 'empty'}`;
    if (isActive) cls += ' scan-item';
    slot.className = cls;

    if (filled) {
      const isPhrase = item.text.includes(' ');
      slot.innerHTML = `<span class="pred-text${isPhrase ? ' phrase' : ''}">${h(item.text)}</span>`;
      slot.addEventListener('pointerup', e => { e.preventDefault(); selectItem(item); });
    }
    container.appendChild(slot);
  }
}

function renderMsgBar() {
  const bar     = el('msg-bar');
  const msg     = S.message;
  const hasText = msg.length > 0;
  const overflow = msg.length > 55;

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
    <button class="speak-btn" id="btn-speak">
      <span class="speak-glyph">▶</span>Speak
    </button>`;

  el('btn-speak').onclick = () => speak(S.message);
}

const ACTION_BUTTON_IDS = {
  settings: 'btn-settings', clear: 'btn-clear', yes: 'btn-yes',
  no: 'btn-no', scan: 'btn-scan', needs: 'btn-needs',
};

function renderActions(rows) {
  el('btn-yes').classList.toggle('spacer', !S.showYesNo);
  el('btn-no').classList.toggle('spacer', !S.showYesNo);
  el('btn-needs').classList.toggle('spacer', !S.showNeedsMenu);

  const scanBtn = el('btn-scan');
  scanBtn.classList.toggle('scanning', S.scanning);
  scanBtn.querySelector('.act-label').textContent = S.scanning ? 'Pause' : 'Scan';

  const needsBtn = el('btn-needs');
  const drilled = (S.needsPath || []).length > 0;
  needsBtn.querySelector('.act-label').textContent = !S.needsOpen ? 'Needs' : (drilled ? 'Back' : 'Close');
  needsBtn.querySelector('.act-glyph').textContent = !S.needsOpen ? '▶' : (drilled ? '‹' : '✕');

  const selectBtn = el('btn-select');
  selectBtn.classList.toggle('live', S.scanning);
  selectBtn.querySelector('.act-glyph').textContent = S.scanning ? '●' : '⌫';
  selectBtn.querySelector('.act-label').textContent = S.scanning ? 'Select' : 'Backspace';

  // An action button is the active scan item exactly when the item-phase
  // index has walked past all of the row's content items — it's always
  // appended last in scannableItems().
  rows.forEach(row => {
    if (!row.action || row.speakStop) return;
    const btn = el(ACTION_BUTTON_IDS[row.action]);
    if (!btn) return;
    btn.classList.toggle('scan-item', isActiveScanItem(row.idx, row.items.length));
  });
}

function renderScanHighlights() {
  document.querySelectorAll('.scan-row-active').forEach(rowEl => rowEl.classList.remove('scan-row-active'));
  if (!S.scanning || S.scanPhase !== 'row') return;
  const rows = scanRows();
  const active = rows[S.scanRowIdx];
  if (!active) return;
  if (active.speakStop) el('msg-bar').classList.add('scan-row-active');
  else el(`row-${active.idx}`).classList.add('scan-row-active');
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

  // Static action buttons
  el('btn-clear').onclick  = () => runAction('clear');
  el('btn-yes').onclick    = () => runAction('yes');
  el('btn-no').onclick     = () => runAction('no');
  el('btn-scan').onclick   = () => runAction('scan');
  el('btn-needs').onclick  = () => runAction('needs');
  el('btn-select').onclick = () => { if (S.scanning) onSelectPress(); else undoInsertion(); };
  // btn-settings is a plain <a href="./admin/"> — no handler needed.

  // Physical keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (S.scanning) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelectPress(); }
      else if (e.key === 'Escape') { e.preventDefault(); clearAll(); }
      return;
    }
    if (e.key === 'Backspace')      { e.preventDefault(); clearLast(); return; }
    if (e.key === 'Escape')         { e.preventDefault(); clearAll();  return; }
    if (e.key === 'Enter')          { e.preventDefault(); speak(S.message); return; }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) appendChar(e.key);
  });

  // Re-apply admin settings. Scanning only auto-starts on a false→true
  // scanAutoStart transition, so an unrelated admin edit (e.g. TTS pitch)
  // never restarts a scan the user deliberately paused.
  function refreshFromAdminState() {
    _ttsVoiceCache = null; // invalidate voice cache
    const hadAutoStart = S.scanAutoStart;
    applyAdminSettings();
    if (!hadAutoStart && S.scanAutoStart && !S.scanning) startScan();
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

  if (S.scanAutoStart) startScan();
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
