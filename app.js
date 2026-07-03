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
  ttsVoiceName: '',
  ttsRate:      1.0,
  ttsPitch:     1.0,
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases:  true,
  showYesNo:    true,
  showNeedsMenu: true,
  quickPhrases: ['Please move me', 'Scratch my head', 'Thank you', 'One moment please', 'I love you'],
  allPhrases:   ['Please move me', 'Scratch my head', 'Thank you', 'One moment please', 'I love you'],
  needsTree:    [],
  needsRootQuestion: 'What do you need?',

  // Active view: which content rows 0-4 (and the predictions row) show.
  activeView:   'spell',   // 'spell' | 'needs' | 'phrases'

  // Board navigation. needsPath is the stack of node ids drilled into for
  // the Needs tree (empty = root level); needsPage/phrasesPage paginate a
  // board level with more than 8 tiles.
  needsPath:    [],
  needsPage:    0,
  phrasesPage:  0,

  // Scanning — always on, runtime only, never persisted. scanScope controls
  // how much of the layout the sweep covers: 'actions' sweeps just the
  // bottom actions row; 'view' sweeps the active view's rows, the message
  // row, and the actions row (in that order). scanResting is true when the
  // sweep has parked after a few idle loops, waiting for the switch.
  scanScope:    'actions',
  scanPhase:    'item',   // 'row' | 'item' — 'row' only occurs in 'view' scope
  scanRowIdx:   0,
  scanItemIdx:  0,
  scanTimer:    null,
  scanResting:  false,
  scanLoops:    0,

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
  S.ttsVoiceName = a.ttsVoiceName;
  S.ttsRate      = a.ttsRate;
  S.ttsPitch     = a.ttsPitch;
  S.showSpellingGrid  = a.showSpellingGrid;
  S.showPredictionRow = a.showPredictionRow;
  S.showQuickPhrases  = a.showQuickPhrases;
  S.showYesNo    = a.showYesNo;
  S.showNeedsMenu     = a.showNeedsMenu;
  S.quickPhrases = a.quickPhrases;
  S.allPhrases   = (a.allPhraseTexts && a.allPhraseTexts.length) ? a.allPhraseTexts : a.quickPhrases;
  S.needsTree    = a.needsTree;
  S.needsRootQuestion = a.needsRootQuestion;

  if (S.activeView === 'needs' && !S.showNeedsMenu) closeToActions();
  if (S.activeView === 'phrases' && !S.showQuickPhrases) closeToActions();

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

function onNeedsTileSelect(tile) {
  if (tile.isOther) { openView('spell'); return; }
  if (tile.isLeaf) {
    speak(needsLabelsForPath([...(S.needsPath || []), tile.id]).join(' — '));
    closeToActions();
    return;
  }
  S.needsPath = [...(S.needsPath || []), tile.id];
  S.needsPage = 0;
  render();
}

// ── Phrases board ────────────────────────────────────────────────────────
// A flat tile board over the admin's full quick-phrase list, mirroring the
// Needs board's tile/pagination mechanics but with no drilling — every tile
// is a leaf except the trailing "Other" tile, which spells out.

function onPhraseTileSelect(tile) {
  if (tile.isOther) { openView('spell'); return; }
  selectQuickPhrase(tile.label);
  closeToActions();
}

// ── Board (Needs / Phrases) shared tile/pagination model ──────────────────

function boardTiles() {
  if (S.activeView === 'phrases') {
    const texts = (S.allPhrases && S.allPhrases.length) ? S.allPhrases : S.quickPhrases;
    return texts
      .map((text, i) => ({ id: `phrase-${i}`, label: text, isOther: false, isLeaf: true }))
      .concat([{ id: 'phrases-other', label: 'Other', isOther: true, isLeaf: true }]);
  }
  return needsPageTiles();
}

function boardPage() {
  return S.activeView === 'phrases' ? S.phrasesPage : S.needsPage;
}

function onBoardTileSelect(tile) {
  if (S.activeView === 'phrases') onPhraseTileSelect(tile);
  else onNeedsTileSelect(tile);
}

// Physical row 0 of the view area becomes the (non-selectable) board header;
// rows 1–4 hold up to 8 tiles, 2 per row, paginated 7-per-page + a More tile
// once a level has more than 8 entries.
function boardRowItems(rowIdx) {
  if (rowIdx === 0) return [];
  const tiles = boardTiles();
  const paginated = tiles.length > 8;
  const perPage = paginated ? 7 : tiles.length;
  const start = boardPage() * perPage;
  let pageTiles = tiles.slice(start, start + perPage);
  if (paginated) pageTiles = pageTiles.concat([{ __more: true }]);

  const slotStart = (rowIdx - 1) * 2;
  return pageTiles.slice(slotStart, slotStart + 2).map(t => {
    if (t.__more) return { type: 'tile-more' };
    const isLeaf = t.isLeaf != null
      ? t.isLeaf
      : !(Array.isArray(t.children) && t.children.some(c => !c.isOther));
    return { type: 'tile', id: t.id, label: t.label, isOther: !!t.isOther, isLeaf };
  });
}

function boardHeaderText() {
  if (S.activeView === 'phrases') return 'Quick phrases';
  const { parentLabel } = needsLevel();
  const atRoot = (S.needsPath || []).length === 0;
  return atRoot ? (S.needsRootQuestion || 'What do you need?') : (parentLabel || '');
}

// ── Row model ────────────────────────────────────────────────────────────
// Single source of truth for rendering, direct taps, and scanning. Rows 0–4
// carry the active view's content (spelling grid, or a Needs/Phrases board);
// the predictions row only appears in the Spell view; the message row and
// the actions row always appear last, in that order — this is what lets the
// actions row double as "back to actions" when a view's sweep reaches it.

function gridRowItems(rowIdx) {
  if (!S.showSpellingGrid) return [];
  return getGridRows()[rowIdx].map(k => ({ type: 'key', char: k.char, kind: k.kind, label: k.label }));
}

function predRowItems() {
  if (!S.showPredictionRow) return [];
  return (S.predictions || []).map(text => ({ type: 'pred', text }));
}

function actionsRowItems() {
  const items = [];
  if (S.showYesNo) items.push({ type: 'action', name: 'yes' }, { type: 'action', name: 'no' });
  if (S.showNeedsMenu) items.push({ type: 'action', name: 'needs' });
  if (S.showQuickPhrases) items.push({ type: 'action', name: 'phrases' });
  if (S.showSpellingGrid) items.push({ type: 'action', name: 'spell' });
  return items;
}

function getRows() {
  const rows = [];
  for (let i = 0; i <= 4; i++) {
    rows.push({
      key: `view-${i}`,
      idx: i,
      contentId: `grid-r${i}`,
      isHeader: S.activeView !== 'spell' && i === 0,
      items: S.activeView === 'spell' ? gridRowItems(i) : boardRowItems(i),
    });
  }
  if (S.activeView === 'spell') {
    rows.push({ key: 'pred', contentId: 'pred-row', items: predRowItems() });
  }
  rows.push({ key: 'msg', items: [
    { type: 'msg-backspace' },
    { type: 'msg-speak' },
    { type: 'msg-clear' },
  ] });
  rows.push({ key: 'actions', items: actionsRowItems() });
  return rows;
}

function scannableItems(row) {
  return row.items || [];
}

// Rows with nothing selectable drop out of the sweep entirely — this is what
// makes every show*/needs combination "just work" without special-casing. In
// 'actions' scope only the actions row is ever swept.
function scanRows() {
  const rows = getRows();
  if (S.scanScope === 'actions') {
    return rows.filter(r => r.key === 'actions' && scannableItems(r).length > 0);
  }
  return rows.filter(r => scannableItems(r).length > 0);
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
    case 'tile':
      onBoardTileSelect(item);
      break;
    case 'tile-more':
      if (S.activeView === 'phrases') S.phrasesPage += 1;
      else S.needsPage += 1;
      render();
      break;
    case 'msg-backspace':
      undoInsertion();
      break;
    case 'msg-speak':
      speak(S.message);
      break;
    case 'msg-clear':
      clearAll();
      break;
    case 'action':
      runAction(item.name);
      break;
  }
}

function runAction(name) {
  switch (name) {
    case 'yes': speak('Yes'); break;
    case 'no':  speak('No');  break;
    case 'needs':
      if (S.activeView !== 'needs') {
        openView('needs');
      } else if ((S.needsPath || []).length > 0) {
        S.needsPath = S.needsPath.slice(0, -1);
        S.needsPage = 0;
        S.scanPhase = 'row';
        S.scanRowIdx = 0;
        S.scanItemIdx = 0;
        resumeScan();
      } else {
        closeToActions();
      }
      break;
    case 'phrases':
      if (S.activeView !== 'phrases') openView('phrases');
      else closeToActions();
      break;
    case 'spell':
      openView('spell');
      break;
    // 'settings' navigates via its own <a href>; 'select' is handled by its
    // own click handler (onSelectPress), not through here.
  }
}

// ── Views ────────────────────────────────────────────────────────────────
// Switching views expands the scan into it; closing one collapses the scan
// back to the actions-only scope with the Spell grid showing underneath.

function openView(view) {
  S.activeView = view;
  S.needsPath = [];
  S.needsPage = 0;
  S.phrasesPage = 0;
  S.scanScope = 'view';
  S.scanResting = false;
  S.scanLoops = 0;
  S.scanPhase = 'row';
  S.scanRowIdx = 0;
  S.scanItemIdx = 0;
  resumeScan();
}

function closeToActions() {
  S.activeView = 'spell';
  S.needsPath = [];
  S.needsPage = 0;
  S.phrasesPage = 0;
  S.scanScope = 'actions';
  S.scanResting = false;
  S.scanLoops = 0;
  S.scanPhase = 'item';
  S.scanItemIdx = 0;
  resumeScan();
}

// ── Scanning ─────────────────────────────────────────────────────────────
const ITEM_SPEED_RATIO = 0.69;
// Scanning never turns off — after this many idle loops with no input it
// parks ("rests") instead. The switch (Select button / Space / Enter) wakes
// it. A "loop" is the cursor wrapping back to the top of its scope: a
// row-index wrap in 'view' scope, an item-index wrap in 'actions' scope.
const REST_AFTER_LOOPS = 2;

// (Re)starts the sweep from the top of the current scope. Used at init and
// to wake the sweep from rest.
function startScan() {
  S.scanResting = false;
  S.scanLoops = 0;
  if (S.scanScope === 'actions') {
    S.scanPhase = 'item';
    S.scanItemIdx = 0;
  } else {
    S.scanPhase = 'row';
    S.scanRowIdx = 0;
    S.scanItemIdx = 0;
  }
  resumeScan();
}

function enterRest() {
  if (S.scanTimer) { clearTimeout(S.scanTimer); S.scanTimer = null; }
  S.scanResting = true;
  render();
}

// Continues ticking from the current cursor (clamped) given S's current
// scope/phase. Always clears any pending timer first, so it's safe to call
// after any state mutation without worrying about stray duplicate timers.
function resumeScan() {
  if (S.scanTimer) { clearTimeout(S.scanTimer); S.scanTimer = null; }
  const rows = scanRows();
  if (!rows.length) { enterRest(); return; }
  if (S.scanScope === 'actions') {
    S.scanPhase = 'item';
    S.scanItemIdx = Math.min(S.scanItemIdx, rows[0].items.length - 1);
    advanceItem();
    return;
  }
  S.scanRowIdx = Math.min(S.scanRowIdx, rows.length - 1);
  if (S.scanPhase === 'item') {
    const items = scannableItems(rows[S.scanRowIdx]);
    S.scanItemIdx = Math.min(S.scanItemIdx, items.length - 1);
    advanceItem();
  } else {
    advanceRow();
  }
}

function advanceRow() {
  render();
  S.scanTimer = setTimeout(() => {
    const rows = scanRows();
    if (!rows.length) { enterRest(); return; }
    const next = S.scanRowIdx + 1;
    if (next >= rows.length) {
      S.scanRowIdx = 0;
      S.scanLoops += 1;
      if (S.scanLoops >= REST_AFTER_LOOPS) { enterRest(); return; }
    } else {
      S.scanRowIdx = next;
    }
    advanceRow();
  }, S.scanSpeedMs);
}

function advanceItem() {
  render();
  const itemMs = Math.round(S.scanSpeedMs * ITEM_SPEED_RATIO);
  S.scanTimer = setTimeout(() => {
    const rows = scanRows();
    if (!rows.length) { enterRest(); return; }

    if (S.scanScope === 'actions') {
      const items = scannableItems(rows[0]);
      const next = S.scanItemIdx + 1;
      if (next >= items.length) {
        S.scanItemIdx = 0;
        S.scanLoops += 1;
        if (S.scanLoops >= REST_AFTER_LOOPS) { enterRest(); return; }
      } else {
        S.scanItemIdx = next;
      }
      advanceItem();
      return;
    }

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
// While resting, any press just wakes the sweep (it never also selects).
function onSelectPress() {
  if (S.scanResting) { startScan(); return; }
  if (S.scanTimer) { clearTimeout(S.scanTimer); S.scanTimer = null; }
  S.scanLoops = 0;

  const rows = scanRows();
  if (!rows.length) { enterRest(); return; }

  if (S.scanScope === 'view' && S.scanPhase === 'row') {
    S.scanRowIdx = Math.min(S.scanRowIdx, rows.length - 1);
    S.scanItemIdx = 0;
    // Descend into the row so its items can be scanned one at a time — but a
    // single-item row (e.g. the lone "Other / Spell it out" tile) has nothing
    // to choose between, so select it on this same press instead of making
    // the user press once to descend and again to pick.
    if (scannableItems(rows[S.scanRowIdx]).length > 1) {
      S.scanPhase = 'item';
      advanceItem();
      return;
    }
  }

  const rowIdx = S.scanScope === 'actions' ? 0 : Math.min(S.scanRowIdx, rows.length - 1);
  const row = rows[rowIdx];
  const items = scannableItems(row);
  const item = items[Math.min(S.scanItemIdx, items.length - 1)];

  const scopeBefore = S.scanScope;
  selectItem(item);

  if (S.scanScope === scopeBefore) {
    // Selection didn't change the active view/scope (a letter, a
    // prediction, Yes/No, a needs-category drill, Backspace/Speak/Clear,
    // or a More tile) — openView()/closeToActions() already reset phase and
    // indices for the cases that do change scope, so this only needs to
    // return a 'view' sweep to row phase, or step the 'actions' sweep on.
    if (S.scanScope === 'view') {
      S.scanPhase = 'row';
    } else {
      const stillItems = scannableItems(scanRows()[0] || { items: [] });
      S.scanItemIdx = stillItems.length ? (S.scanItemIdx + 1) % stillItems.length : 0;
    }
  }

  resumeScan();
}

function isActiveScanItem(rowKey, itemIdx) {
  if (S.scanResting || S.scanPhase !== 'item') return false;
  const rows = scanRows();
  const rowIdx = S.scanScope === 'actions' ? 0 : S.scanRowIdx;
  const row = rows[rowIdx];
  return !!row && row.key === rowKey && S.scanItemIdx === itemIdx;
}

// ── Rendering ────────────────────────────────────────────────────────────
function render() {
  const app = el('app');
  app.dataset.theme   = S.theme;
  app.dataset.density = S.density;
  app.dataset.view    = S.activeView;
  document.body.dataset.theme = S.theme;

  const rows = getRows();
  const predRow = rows.find(r => r.key === 'pred');
  const actionsRow = rows.find(r => r.key === 'actions');

  renderViewRows(rows);
  renderPredRow(predRow);
  renderMsgBar();
  renderMsgRowChrome();
  renderActions(actionsRow);
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

function buildTileEl(item, isActive) {
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

function buildMoreEl(isActive) {
  const moreEl = document.createElement('div');
  moreEl.className = 'needs-tile is-more' + (isActive ? ' scan-item' : '');
  moreEl.innerHTML = `<span class="tile-label">More</span><span class="tile-sub">›</span>`;
  moreEl.addEventListener('pointerup', e => { e.preventDefault(); selectItem({ type: 'tile-more' }); });
  return moreEl;
}

function renderViewRows(rows) {
  for (let i = 0; i <= 4; i++) {
    const row = rows[i];
    const container = el(row.contentId);
    container.innerHTML = '';

    if (row.isHeader) {
      const hdr = document.createElement('div');
      hdr.className = 'needs-header';
      hdr.textContent = boardHeaderText();
      container.appendChild(hdr);
      continue;
    }

    row.items.forEach((item, k) => {
      const isActive = isActiveScanItem(row.key, k);
      if (item.type === 'key') container.appendChild(buildKeyEl(item, isActive));
      else if (item.type === 'tile') container.appendChild(buildTileEl(item, isActive));
      else if (item.type === 'tile-more') container.appendChild(buildMoreEl(isActive));
    });
  }
}

function renderPredRow(row) {
  const container = el('pred-row');
  container.innerHTML = '';
  if (!row) return;
  for (let i = 0; i < 5; i++) {
    const item = row.items[i];
    const isActive = isActiveScanItem('pred', i);
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

// The message row descends into three items when swept: Backspace, the
// message itself (select = speak), then Clear.
function renderMsgRowChrome() {
  el('btn-backspace').classList.toggle('scan-item', isActiveScanItem('msg', 0));
  el('msg-bar').classList.toggle('scan-item', isActiveScanItem('msg', 1));
  el('btn-clear').classList.toggle('scan-item', isActiveScanItem('msg', 2));
}

const ACTION_BUTTON_IDS = {
  yes: 'btn-yes', no: 'btn-no', needs: 'btn-needs', phrases: 'btn-phrases', spell: 'btn-spell',
};

function renderActions(row) {
  el('btn-yes').classList.toggle('spacer', !S.showYesNo);
  el('btn-no').classList.toggle('spacer', !S.showYesNo);
  el('btn-needs').classList.toggle('spacer', !S.showNeedsMenu);
  el('btn-phrases').classList.toggle('spacer', !S.showQuickPhrases);
  el('btn-spell').classList.toggle('spacer', !S.showSpellingGrid);

  const needsBtn = el('btn-needs');
  const needsOpen = S.activeView === 'needs';
  const drilled = (S.needsPath || []).length > 0;
  needsBtn.querySelector('.act-label').textContent = !needsOpen ? 'Needs' : (drilled ? 'Back' : 'Close');
  needsBtn.querySelector('.act-glyph').textContent = !needsOpen ? '▶' : (drilled ? '‹' : '✕');

  const phrasesBtn = el('btn-phrases');
  const phrasesOpen = S.activeView === 'phrases';
  phrasesBtn.querySelector('.act-label').textContent = phrasesOpen ? 'Close' : 'Phrases';
  phrasesBtn.querySelector('.act-glyph').textContent = phrasesOpen ? '✕' : '❝';

  const selectBtn = el('btn-select');
  const active = !S.scanResting;
  selectBtn.classList.toggle('live', active);
  selectBtn.querySelector('.act-glyph').textContent = active ? '●' : '▶';
  selectBtn.querySelector('.act-label').textContent = active ? 'Select' : 'Scan';

  const items = row ? row.items : [];
  items.forEach((item, k) => {
    if (item.type !== 'action') return;
    const btn = el(ACTION_BUTTON_IDS[item.name]);
    if (!btn) return;
    btn.classList.toggle('scan-item', isActiveScanItem('actions', k));
  });
}

function rowElementId(row) {
  if (row.key === 'pred') return 'row-pred';
  if (row.key === 'msg') return 'row-msg';
  if (row.key === 'actions') return 'row-actions';
  return `row-${row.idx}`;
}

function renderScanHighlights() {
  document.querySelectorAll('.scan-row-active').forEach(rowEl => rowEl.classList.remove('scan-row-active'));
  if (S.scanResting || S.scanPhase !== 'row' || S.scanScope !== 'view') return;
  const rows = scanRows();
  const active = rows[S.scanRowIdx];
  if (!active) return;
  el(rowElementId(active)).classList.add('scan-row-active');
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
      if (S.restoredDraft) { S.restoredDraft = false; renderMsgBar(); renderMsgRowChrome(); }
    }, 3000);
  }

  // Static action buttons
  el('btn-backspace').onclick = () => undoInsertion();
  el('btn-clear').onclick     = () => clearAll();
  el('btn-yes').onclick       = () => runAction('yes');
  el('btn-no').onclick        = () => runAction('no');
  el('btn-needs').onclick     = () => runAction('needs');
  el('btn-phrases').onclick   = () => runAction('phrases');
  el('btn-spell').onclick     = () => runAction('spell');
  el('btn-select').onclick    = () => onSelectPress();
  // btn-settings is a plain <a href="./admin/"> — no handler needed.

  // Physical keyboard. Space/Enter are the switch actuator (scanning is
  // always on), so a physical space bar no longer inserts a literal space —
  // the on-screen space key is unaffected.
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSelectPress(); return; }
    if (e.key === 'Escape')    { e.preventDefault(); clearAll();  return; }
    if (e.key === 'Backspace') { e.preventDefault(); clearLast(); return; }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) appendChar(e.key);
  });

  function refreshFromAdminState() {
    _ttsVoiceCache = null; // invalidate voice cache
    applyAdminSettings();
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

  startScan();
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
