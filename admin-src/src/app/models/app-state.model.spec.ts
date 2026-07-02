import { SCHEMA_VERSION, migrateState, DEFAULT_SETTINGS, DEFAULT_STATE } from './app-state.model';

describe('migrateState', () => {
  it('returns default state for null/undefined', () => {
    const s = migrateState(null);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.settings.letterLayout).toBe('abc');
    expect(s.settings.pinEnabled).toBe(false);
  });

  it('returns default state for non-object', () => {
    expect(migrateState('bad').schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('merges partial settings over defaults', () => {
    const raw = { schemaVersion: 1, settings: { theme: 'dark', letterLayout: 'frequency' } };
    const s = migrateState(raw);
    expect(s.settings.theme).toBe('dark');
    expect(s.settings.letterLayout).toBe('frequency');
    expect(s.settings.scanAutoStart).toBe(false);
  });

  it('preserves lists from raw state', () => {
    const raw = {
      schemaVersion: 1,
      settings: {},
      people: [{ name: 'Alice', relationship: 'wife' }],
    };
    const s = migrateState(raw);
    expect(s.people[0].name).toBe('Alice');
  });

  it('default letterLayout is abc', () => {
    expect(DEFAULT_SETTINGS.letterLayout).toBe('abc');
  });

  it('default pinEnabled is false', () => {
    expect(DEFAULT_SETTINGS.pinEnabled).toBe(false);
  });

  it('default scanAutoStart is false', () => {
    expect(DEFAULT_SETTINGS.scanAutoStart).toBe(false);
  });

  it('default state has quickPhrases', () => {
    expect(DEFAULT_STATE.quickPhrases.length).toBeGreaterThan(0);
  });

  it('default needsRootQuestion is "What do you need?"', () => {
    expect(DEFAULT_STATE.needsRootQuestion).toBe('What do you need?');
  });

  it('supplies needsRootQuestion default for legacy state that lacks it', () => {
    const raw = { schemaVersion: 1, settings: {}, needsTree: [] };
    const s = migrateState(raw);
    expect(s.needsRootQuestion).toBe('What do you need?');
  });

  it('preserves a custom needsRootQuestion from raw state', () => {
    const raw = { schemaVersion: 1, settings: {}, needsRootQuestion: 'How can I help?' };
    expect(migrateState(raw).needsRootQuestion).toBe('How can I help?');
  });

  it('migrates a v1 inputMode of "scan" to scanAutoStart true', () => {
    const raw = { schemaVersion: 1, settings: { inputMode: 'scan' } };
    expect(migrateState(raw).settings.scanAutoStart).toBe(true);
  });

  it('migrates a v1 inputMode of "direct" or "dwell" to scanAutoStart false', () => {
    expect(migrateState({ schemaVersion: 1, settings: { inputMode: 'direct' } }).settings.scanAutoStart).toBe(false);
    expect(migrateState({ schemaVersion: 1, settings: { inputMode: 'dwell' } }).settings.scanAutoStart).toBe(false);
  });

  it('strips the removed inputMode/dwellMs/targetSize keys from settings', () => {
    const raw = { schemaVersion: 1, settings: { inputMode: 'scan', dwellMs: 900, targetSize: 'large' } };
    const s = migrateState(raw);
    expect('inputMode' in s.settings).toBe(false);
    expect('dwellMs' in s.settings).toBe(false);
    expect('targetSize' in s.settings).toBe(false);
  });

  it('preserves an explicit scanAutoStart on a v2 blob', () => {
    const raw = { schemaVersion: 2, settings: { scanAutoStart: true } };
    expect(migrateState(raw).settings.scanAutoStart).toBe(true);
  });

  it('stamps the current schemaVersion after migrating', () => {
    expect(migrateState({ schemaVersion: 1, settings: {} }).schemaVersion).toBe(2);
  });
});
