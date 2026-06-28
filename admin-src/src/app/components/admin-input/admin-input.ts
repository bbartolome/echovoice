import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';
import { Settings } from '../../models/app-state.model';

interface VoiceOption {
  name: string;
  lang: string;
}

@Component({
  selector: 'app-admin-input',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <a class="back-link" routerLink="/home">‹ Settings</a>
        <h1 class="page-title">Input &amp; accessibility</h1>
        <p class="page-sub">The settings family adjust most as his movement changes. Changes take effect immediately on his communication screen.</p>
      </div>

      <!-- Selection mode -->
      <section class="card">
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Selection mode</div>
            <div class="setting-desc">How he makes selections on the communication screen.</div>
          </div>
          <div class="seg-ctrl" role="group" aria-label="Selection mode">
            @for (m of inputModes; track m.value) {
              <button
                class="seg-btn"
                [class.active]="settings().inputMode === m.value"
                (click)="set('inputMode', m.value)"
              >{{ m.label }}</button>
            }
          </div>
        </div>

        @if (settings().inputMode === 'scan') {
          <div class="setting-row sub-row">
            <div class="setting-info">
              <div class="setting-label">Scan speed</div>
              <div class="setting-desc">How long each row or item is highlighted before moving on.</div>
            </div>
            <div class="slider-wrap">
              <input type="range" class="slider" min="600" max="3000" step="100"
                [value]="settings().scanSpeedMs"
                (input)="onRange($event, 'scanSpeedMs')" />
              <span class="slider-val">{{ (settings().scanSpeedMs / 1000).toFixed(1) }}s</span>
            </div>
          </div>
        }

        @if (settings().inputMode === 'dwell') {
          <div class="setting-row sub-row">
            <div class="setting-info">
              <div class="setting-label">Dwell time</div>
              <div class="setting-desc">How long he must hold a target to select it.</div>
            </div>
            <div class="slider-wrap">
              <input type="range" class="slider" min="500" max="4000" step="100"
                [value]="settings().dwellMs"
                (input)="onRange($event, 'dwellMs')" />
              <span class="slider-val">{{ (settings().dwellMs / 1000).toFixed(1) }}s</span>
            </div>
          </div>
        }
      </section>

      <!-- Layout -->
      <section class="card">
        <h2 class="card-title">Layout &amp; appearance</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Letter layout</div>
            <div class="setting-desc">A–Z order or most-frequent letters first.</div>
          </div>
          <div class="seg-ctrl" role="group" aria-label="Letter layout">
            @for (l of letterLayouts; track l.value) {
              <button
                class="seg-btn"
                [class.active]="settings().letterLayout === l.value"
                (click)="set('letterLayout', l.value)"
              >{{ l.label }}</button>
            }
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Key size</div>
            <div class="setting-desc">Larger keys for easier tapping.</div>
          </div>
          <div class="seg-ctrl" role="group" aria-label="Key size">
            @for (d of densities; track d.value) {
              <button
                class="seg-btn"
                [class.active]="settings().gridDensity === d.value"
                (click)="set('gridDensity', d.value)"
              >{{ d.label }}</button>
            }
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Theme</div>
            <div class="setting-desc">Light or dark display.</div>
          </div>
          <div class="seg-ctrl" role="group" aria-label="Theme">
            <button class="seg-btn" [class.active]="settings().theme === 'light'" (click)="set('theme', 'light')">Light</button>
            <button class="seg-btn" [class.active]="settings().theme === 'dark'" (click)="set('theme', 'dark')">Dark</button>
          </div>
        </div>
      </section>

      <!-- Voice -->
      <section class="card">
        <h2 class="card-title">Text-to-speech</h2>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Voice</div>
            <div class="setting-desc">The voice used to speak messages aloud.</div>
          </div>
          <select class="picker" [value]="settings().ttsVoiceName" (change)="onVoiceChange($event)">
            <option value="">System default</option>
            @for (v of voices(); track v.name) {
              <option [value]="v.name">{{ v.name }} ({{ v.lang }})</option>
            }
          </select>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Speed</div>
            <div class="setting-desc">How fast the voice speaks.</div>
          </div>
          <div class="slider-wrap">
            <input type="range" class="slider" min="0.5" max="2" step="0.05"
              [value]="settings().ttsRate"
              (input)="onRangeFloat($event, 'ttsRate')" />
            <span class="slider-val">{{ settings().ttsRate.toFixed(2) }}×</span>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Pitch</div>
            <div class="setting-desc">Higher or lower pitch for the voice.</div>
          </div>
          <div class="slider-wrap">
            <input type="range" class="slider" min="0.5" max="2" step="0.05"
              [value]="settings().ttsPitch"
              (input)="onRangeFloat($event, 'ttsPitch')" />
            <span class="slider-val">{{ settings().ttsPitch.toFixed(2) }}</span>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Test voice</div>
            <div class="setting-desc">Hear a sample with the current settings.</div>
          </div>
          <button class="test-btn" (click)="testVoice()">▶ Play sample</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 28px 40px 60px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header { display: flex; flex-direction: column; gap: 8px; }
    .back-link {
      color: var(--accent);
      font-weight: 700;
      font-size: 17px;
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
    .page-title {
      font-weight: 700;
      font-size: 42px;
      color: var(--ink);
      margin: 0;
      line-height: 1;
    }
    .page-sub {
      font-size: 19px;
      color: var(--ink2);
      line-height: 1.4;
      margin: 0;
      max-width: 740px;
    }
    .card {
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 20px;
      padding: 0;
      overflow: hidden;
    }
    .card-title {
      font-weight: 700;
      font-size: 20px;
      color: var(--ink);
      margin: 0;
      padding: 18px 24px 0;
    }
    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--hair);
    }
    .setting-row:last-child { border-bottom: none; }
    .sub-row { padding-left: 40px; background: var(--app-bg); }
    .setting-info { flex: 1; min-width: 0; }
    .setting-label {
      font-weight: 700;
      font-size: 19px;
      color: var(--ink);
    }
    .setting-desc {
      font-size: 15px;
      color: var(--ink2);
      margin-top: 3px;
    }
    .seg-ctrl {
      display: flex;
      gap: 5px;
      background: var(--empty-bg);
      border: 2px solid var(--hair);
      border-radius: 11px;
      padding: 4px;
      flex-shrink: 0;
    }
    .seg-btn {
      padding: 9px 16px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--ink2);
      font-family: inherit;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      white-space: nowrap;
    }
    .seg-btn.active {
      background: var(--surface);
      border: 2px solid var(--accent);
      color: var(--accent);
    }
    .slider-wrap {
      display: flex;
      align-items: center;
      gap: 14px;
      flex-shrink: 0;
      min-width: 220px;
    }
    .slider {
      flex: 1;
      height: 8px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--track);
      border-radius: 999px;
      outline: none;
      cursor: pointer;
    }
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--surface);
      border: 3px solid var(--accent);
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    .slider-val {
      font-weight: 700;
      font-size: 14px;
      color: var(--accent);
      background: var(--acc-tint);
      border: 1px solid var(--acc-bdr);
      border-radius: 999px;
      padding: 4px 10px;
      white-space: nowrap;
      min-width: 52px;
      text-align: center;
    }
    .picker {
      height: 46px;
      padding: 0 14px;
      border-radius: 10px;
      border: 2px solid var(--field-bdr);
      background: var(--field-bg);
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 15px;
      flex-shrink: 0;
      min-width: 200px;
      cursor: pointer;
    }
    .test-btn {
      padding: 12px 22px;
      border-radius: 12px;
      border: 2px solid var(--accent);
      background: var(--acc-tint);
      color: var(--accent);
      font-family: inherit;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      flex-shrink: 0;
    }
    .test-btn:hover { background: var(--acc-bdr); }
  `]
})
export class AdminInputComponent implements OnInit {
  private svc = inject(PersistenceService);

  settings = computed(() => this.svc.state().settings);
  voices = signal<VoiceOption[]>([]);

  readonly inputModes = [
    { label: 'Direct', value: 'direct' as const },
    { label: 'Scan', value: 'scan' as const },
    { label: 'Dwell', value: 'dwell' as const },
  ];

  readonly letterLayouts = [
    { label: 'A–Z', value: 'abc' as const },
    { label: 'Frequency', value: 'frequency' as const },
  ];

  readonly densities = [
    { label: 'Default', value: 'default' as const },
    { label: 'Large', value: 'large' as const },
  ];

  ngOnInit(): void {
    this.loadVoices();
    if ('speechSynthesis' in window) {
      speechSynthesis.addEventListener('voiceschanged', () => this.loadVoices());
    }
  }

  private loadVoices(): void {
    if (!('speechSynthesis' in window)) return;
    const list = speechSynthesis.getVoices();
    this.voices.set(list.map(v => ({ name: v.name, lang: v.lang })));
  }

  set(key: keyof Settings, value: Settings[keyof Settings]): void {
    this.svc.updateSettings({ [key]: value });
  }

  onRange(event: Event, key: 'scanSpeedMs' | 'dwellMs'): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.svc.updateSettings({ [key]: val });
  }

  onRangeFloat(event: Event, key: 'ttsRate' | 'ttsPitch'): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.svc.updateSettings({ [key]: val });
  }

  onVoiceChange(event: Event): void {
    this.svc.updateSettings({ ttsVoiceName: (event.target as HTMLSelectElement).value });
  }

  testVoice(): void {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance('Hello, this is a voice test.');
    const { ttsVoiceName, ttsRate, ttsPitch } = this.settings();
    if (ttsVoiceName) {
      const match = speechSynthesis.getVoices().find(v => v.name === ttsVoiceName);
      if (match) utt.voice = match;
    }
    utt.rate = ttsRate;
    utt.pitch = ttsPitch;
    speechSynthesis.speak(utt);
  }
}
