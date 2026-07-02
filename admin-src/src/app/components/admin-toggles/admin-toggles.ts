import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';
import { Settings } from '../../models/app-state.model';

interface Toggle {
  key: keyof Settings;
  label: string;
  desc: string;
  locked?: boolean;
}

@Component({
  selector: 'app-admin-toggles',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <a class="back-link" routerLink="/home">‹ Settings</a>
        <h1 class="page-title">Visible sections</h1>
        <p class="page-sub">Show or hide whole parts of David's communication screen. Changes take effect immediately.</p>
      </div>

      <div class="toggles-layout">
        <section class="card">
          @for (t of toggles; track t.key) {
            <div class="toggle-row" [class.locked]="t.locked">
              <div class="toggle-info">
                <div class="toggle-label">{{ t.label }}</div>
                <div class="toggle-desc">{{ t.desc }}</div>
              </div>
              @if (t.locked) {
                <span class="locked-badge">Always on</span>
              } @else {
                <button
                  class="toggle-btn"
                  [class.on]="!!settings()[t.key]"
                  (click)="toggle(t.key)"
                  [attr.aria-pressed]="!!settings()[t.key]"
                  [attr.aria-label]="t.label + ' ' + (settings()[t.key] ? 'on' : 'off')"
                >
                  <div class="toggle-thumb"></div>
                </button>
              }
            </div>
          }
        </section>

        <!-- Mini preview -->
        <div class="preview-panel">
          <div class="preview-label">PREVIEW</div>
          <div class="mini-screen" [attr.data-theme]="settings().theme">
            <div class="mini-msgbar">Message area</div>
            @if (settings().showPredictionRow) {
              <div class="mini-pred">Predictions</div>
            }
            <div class="mini-middle">
              @if (settings().showSpellingGrid) {
                <div class="mini-grid">
                  <div class="mini-key-row">
                    @for (l of 'ETAOI'.split(''); track l) {
                      <div class="mini-key">{{ l }}</div>
                    }
                  </div>
                  <div class="mini-key-row">
                    @for (l of 'NRSHL'.split(''); track l) {
                      <div class="mini-key">{{ l }}</div>
                    }
                  </div>
                  <div class="mini-key-row">
                    @for (l of 'DCUMF'.split(''); track l) {
                      <div class="mini-key">{{ l }}</div>
                    }
                  </div>
                </div>
              } @else if (settings().showNeedsMenu) {
                <div class="mini-needs">What do you need?</div>
              } @else {
                <div class="mini-empty">—</div>
              }

              @if (settings().showYesNo || settings().showQuickPhrases || settings().showNeedsMenu) {
                <div class="mini-rail">
                  @if (settings().showYesNo) {
                    <div class="mini-yes">Yes</div>
                    <div class="mini-no">No</div>
                  }
                  @if (settings().showQuickPhrases) {
                    <div class="mini-quick">Quick<br>phrases</div>
                  }
                  @if (settings().showNeedsMenu && settings().showSpellingGrid) {
                    <div class="mini-needs-btn">Needs</div>
                  }
                </div>
              }
            </div>
          </div>
          <p class="preview-note">This is a rough representation of how the communication screen will look.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 1060px;
      margin: 0 auto;
      padding: 28px 40px 60px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header { display: flex; flex-direction: column; gap: 8px; }
    .back-link {
      display: inline-flex;
      align-items: center;
      min-height: 44px;
      padding: 0 4px;
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
      max-width: 700px;
    }
    .toggles-layout {
      display: flex;
      gap: 28px;
      align-items: flex-start;
    }
    .card {
      flex: 1;
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 20px;
      overflow: hidden;
    }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 18px 24px;
      border-bottom: 1px solid var(--hair);
    }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-row.locked { opacity: 0.65; }
    .toggle-info { flex: 1; }
    .toggle-label {
      font-weight: 700;
      font-size: 19px;
      color: var(--ink);
    }
    .toggle-desc {
      font-size: 15px;
      color: var(--ink2);
      margin-top: 3px;
    }
    .toggle-btn {
      flex-shrink: 0;
      width: 58px;
      height: 32px;
      border-radius: 999px;
      background: var(--track);
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.2s;
    }
    .toggle-btn.on { background: var(--accent); }
    .toggle-thumb {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.25);
      transition: transform 0.2s;
    }
    .toggle-btn.on .toggle-thumb { transform: translateX(26px); }
    .locked-badge {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 11px;
      letter-spacing: 1px;
      font-weight: 700;
      color: var(--mono);
      background: var(--empty-bg);
      border: 1px solid var(--hair);
      border-radius: 6px;
      padding: 4px 9px;
      white-space: nowrap;
    }

    /* Mini preview */
    .preview-panel {
      width: 260px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .preview-label {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 11px;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: var(--mono);
    }
    .mini-screen {
      background: #EEF1F5;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid var(--hair);
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .mini-screen[data-theme="dark"] { background: #0E1216; }
    .mini-msgbar {
      height: 32px;
      background: var(--surface);
      border: 1px solid var(--hair);
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      color: var(--ink2);
      font-weight: 600;
    }
    .mini-pred {
      height: 16px;
      background: var(--surface);
      border: 1px solid var(--hair);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: var(--ink2);
    }
    .mini-middle {
      display: flex;
      gap: 6px;
      min-height: 80px;
    }
    .mini-grid {
      flex: 1;
      background: transparent;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mini-key-row {
      display: flex;
      gap: 3px;
      flex: 1;
    }
    .mini-key {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--key-bdr);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      font-weight: 700;
      color: var(--ink);
    }
    .mini-needs {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--hair);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: var(--ink);
      font-weight: 700;
      text-align: center;
      padding: 4px;
    }
    .mini-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: var(--ink2);
    }
    .mini-rail {
      width: 44px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mini-yes, .mini-no, .mini-quick, .mini-needs-btn {
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 7px;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
    }
    .mini-yes { background: #2F7A52; color: #fff; height: 22px; }
    .mini-no { background: #B23B3B; color: #fff; height: 22px; }
    .mini-quick { background: var(--surface); border: 1px solid var(--hair); color: var(--ink2); flex: 1; }
    .mini-needs-btn { background: var(--acc-tint); border: 1px solid var(--acc-bdr); color: var(--accent); height: 18px; }
    .preview-note {
      font-size: 13px;
      color: var(--ink2);
      line-height: 1.4;
      margin: 0;
    }
  `]
})
export class AdminTogglesComponent {
  private svc = inject(PersistenceService);
  settings = computed(() => this.svc.state().settings);

  readonly toggles: Toggle[] = [
    { key: 'showSpellingGrid', label: 'Spelling grid', desc: 'The A–Z keyboard for typing letters.' },
    { key: 'showPredictionRow', label: 'Prediction row', desc: 'Word and phrase suggestions above the grid.' },
    { key: 'showQuickPhrases', label: 'Quick phrases', desc: 'His most-used phrases in the side rail.' },
    { key: 'showYesNo', label: 'Yes / No buttons', desc: 'Large Yes and No buttons in the side rail.' },
    { key: 'showNeedsMenu', label: 'Needs menu', desc: 'The guided "What do you need?" menu.' },
  ];

  toggle(key: keyof Settings): void {
    this.svc.updateSettings({ [key]: !this.settings()[key] });
  }
}
