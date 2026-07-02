export const SCHEMA_VERSION = 2;

export interface Person {
  name: string;
  relationship: string;
}

export interface NeedsNode {
  id: string;
  label: string;
  children?: NeedsNode[];
  isOther?: boolean;
  locked?: boolean;
}

export interface QuickPhrase {
  id: string;
  text: string;
}

export interface UsageEntry {
  text: string;
  count: number;
  lastUsed: number;
}

export interface DeviceHistory {
  deviceId: string;
  entries: Record<string, UsageEntry>;
}

export interface Settings {
  scanAutoStart: boolean;
  scanSpeedMs: number;
  gridDensity: 'default' | 'large';
  theme: 'light' | 'dark';
  letterLayout: 'abc' | 'frequency';
  ttsVoiceName: string;
  ttsRate: number;
  ttsPitch: number;
  pinEnabled: boolean;
  pin: string;
  showSpellingGrid: boolean;
  showPredictionRow: boolean;
  showQuickPhrases: boolean;
  showYesNo: boolean;
  showNeedsMenu: boolean;
  llmEnabled: boolean;
}

export interface AppState {
  schemaVersion: number;
  settings: Settings;
  people: Person[];
  caregivers: Person[];
  pets: string[];
  places: string[];
  careTerms: string[];
  contextNotes: string;
  quickPhrases: QuickPhrase[];
  needsTree: NeedsNode[];
  needsRootQuestion: string;
  deviceHistory: DeviceHistory[];
}

export const DEFAULT_NEEDS_TREE: NeedsNode[] = [
  {
    id: 'scratch', label: 'Scratch',
    children: [
      { id: 'scratch-head', label: 'Head' },
      { id: 'scratch-back', label: 'Back' },
      { id: 'scratch-arm', label: 'Arm' },
      { id: 'scratch-other', label: 'Other', isOther: true, locked: true },
    ]
  },
  {
    id: 'massage', label: 'Massage',
    children: [
      { id: 'massage-shoulder', label: 'Shoulder' },
      { id: 'massage-back', label: 'Back' },
      { id: 'massage-hand', label: 'Hand' },
      { id: 'massage-other', label: 'Other', isOther: true, locked: true },
    ]
  },
  {
    id: 'move', label: 'Move / reposition',
    children: [
      { id: 'move-upper', label: 'Upper body' },
      { id: 'move-lower', label: 'Lower body' },
      { id: 'move-other', label: 'Other', isOther: true, locked: true },
    ]
  },
  {
    id: 'change', label: 'Change',
    children: [
      { id: 'change-other', label: 'Other', isOther: true, locked: true },
    ]
  },
  { id: 'root-other', label: 'Other', isOther: true, locked: true },
];

export const DEFAULT_QUICK_PHRASES: QuickPhrase[] = [
  { id: 'qp-1', text: 'Please move me' },
  { id: 'qp-2', text: 'Scratch my head' },
  { id: 'qp-3', text: 'Thank you' },
  { id: 'qp-4', text: 'One moment please' },
  { id: 'qp-5', text: 'I love you' },
  { id: 'qp-6', text: "I'm in pain" },
  { id: 'qp-7', text: "I'm comfortable" },
  { id: 'qp-8', text: 'Please call the nurse' },
  { id: 'qp-9', text: 'I need water please' },
];

export const DEFAULT_SETTINGS: Settings = {
  scanAutoStart: false,
  scanSpeedMs: 1600,
  gridDensity: 'default',
  theme: 'light',
  letterLayout: 'abc',
  ttsVoiceName: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  pinEnabled: false,
  pin: '',
  showSpellingGrid: true,
  showPredictionRow: true,
  showQuickPhrases: true,
  showYesNo: true,
  showNeedsMenu: true,
  llmEnabled: false,
};

export const DEFAULT_STATE: AppState = {
  schemaVersion: SCHEMA_VERSION,
  settings: { ...DEFAULT_SETTINGS },
  people: [],
  caregivers: [],
  pets: [],
  places: [],
  careTerms: [],
  contextNotes: '',
  quickPhrases: [...DEFAULT_QUICK_PHRASES],
  needsTree: DEFAULT_NEEDS_TREE,
  needsRootQuestion: 'What do you need?',
  deviceHistory: [],
};

export function migrateState(raw: unknown): AppState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_STATE };
  const r = raw as Record<string, unknown>;
  const v = r['schemaVersion'];

  if (!v || v === 1 || v === 2) {
    // Copy so the old inputMode/dwellMs/targetSize fields (schemaVersion 1)
    // can be read for the scanAutoStart fallback, then dropped — they must
    // not survive into the migrated settings object.
    const rawSettings: Record<string, unknown> = { ...((r['settings'] as Record<string, unknown>) ?? {}) };
    const scanAutoStart = rawSettings['scanAutoStart'] != null
      ? !!rawSettings['scanAutoStart']
      : rawSettings['inputMode'] === 'scan';
    delete rawSettings['inputMode'];
    delete rawSettings['dwellMs'];
    delete rawSettings['targetSize'];

    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...(rawSettings as Partial<Settings>),
      scanAutoStart,
    };

    return {
      ...DEFAULT_STATE,
      ...(r as Partial<AppState>),
      settings,
      schemaVersion: SCHEMA_VERSION,
    };
  }

  return { ...DEFAULT_STATE };
}
