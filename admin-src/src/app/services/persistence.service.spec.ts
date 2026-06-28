import { TestBed } from '@angular/core/testing';
import { PersistenceService } from './persistence.service';

function flushEffects() {
  const tb = TestBed as unknown as { tick?: () => void; flushEffects?: () => void };
  if (typeof tb.tick === 'function') tb.tick();
  else if (typeof tb.flushEffects === 'function') tb.flushEffects();
}

describe('PersistenceService integration', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('writes settings changes to the ev-state localStorage key', async () => {
    const svc = TestBed.inject(PersistenceService);
    svc.updateSettings({ theme: 'dark', showSpellingGrid: false, inputMode: 'scan' });
    flushEffects();
    await new Promise(r => setTimeout(r, 400)); // wait out the 300ms debounce

    const raw = localStorage.getItem('ev-state');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.settings.theme).toBe('dark');
    expect(parsed.settings.showSpellingGrid).toBe(false);
    expect(parsed.settings.inputMode).toBe('scan');
  });
});
