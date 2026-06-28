import { SCHEMA_VERSION, migrateState, DEFAULT_SETTINGS, DEFAULT_STATE } from './app-state.model';

describe('migrateState', () => {
  it('returns default state for null/undefined', () => {
    const s = migrateState(null);
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.settings.letterLayout).toBe('frequency');
    expect(s.settings.pinEnabled).toBe(false);
  });

  it('returns default state for non-object', () => {
    expect(migrateState('bad').schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('merges partial settings over defaults', () => {
    const raw = { schemaVersion: 1, settings: { theme: 'dark', letterLayout: 'abc' } };
    const s = migrateState(raw);
    expect(s.settings.theme).toBe('dark');
    expect(s.settings.letterLayout).toBe('abc');
    expect(s.settings.inputMode).toBe('direct');
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

  it('default letterLayout is frequency', () => {
    expect(DEFAULT_SETTINGS.letterLayout).toBe('frequency');
  });

  it('default pinEnabled is false', () => {
    expect(DEFAULT_SETTINGS.pinEnabled).toBe(false);
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
});
