import { Injectable, signal, effect } from '@angular/core';
import { AppState, DEFAULT_STATE, migrateState } from '../models/app-state.model';

const STORAGE_KEY = 'ev-state';
const DEBOUNCE_MS = 300;

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  readonly state = signal<AppState>(this.load());

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const current = this.state();
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.persist(current), DEBOUNCE_MS);
    });
  }

  updateSettings(patch: Partial<AppState['settings']>): void {
    this.state.update(s => ({
      ...s,
      settings: { ...s.settings, ...patch },
    }));
  }

  updateState(patch: Partial<Omit<AppState, 'settings' | 'schemaVersion'>>): void {
    this.state.update(s => ({ ...s, ...patch }));
  }

  private load(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.importLegacy();
      return migrateState(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_STATE };
    }
  }

  /** One-time migration of old standalone ev-theme / ev-layout / ev-density keys */
  private importLegacy(): AppState {
    const state = { ...DEFAULT_STATE };
    const theme = localStorage.getItem('ev-theme');
    const layout = localStorage.getItem('ev-layout');
    const density = localStorage.getItem('ev-density');
    if (theme === 'light' || theme === 'dark') state.settings.theme = theme;
    if (layout === 'abc' || layout === 'frequency') state.settings.letterLayout = layout;
    if (density === 'default' || density === 'large') state.settings.gridDensity = density;
    return state;
  }

  private persist(s: AppState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable */
    }
  }
}
