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

        <!-- Mini preview — mirrors the 8-row scan layout: each row pairs its
             content with the same trailing action button as the real screen. -->
        <div class="preview-panel">
          <div class="preview-label">PREVIEW</div>
          <div class="mini-screen" [attr.data-theme]="settings().theme">
            <div class="mini-comm-row">
              <div class="mini-content">
                @if (settings().showSpellingGrid) {
                  @for (l of ['A','B','C','D','E','F']; track l) { <div class="mini-key">{{ l }}</div> }
                }
              </div>
              <div class="mini-chip mini-chip-muted">Settings</div>
            </div>
            <div class="mini-comm-row">
              <div class="mini-content">
                @if (settings().showSpellingGrid) {
                  @for (l of ['G','H','I','J','K','L']; track l) { <div class="mini-key">{{ l }}</div> }
                }
              </div>
              <div class="mini-chip">Clear</div>
            </div>
            <div class="mini-comm-row">
              <div class="mini-content">
                @if (settings().showSpellingGrid) {
                  @for (l of ['M','N','O','P','Q','R']; track l) { <div class="mini-key">{{ l }}</div> }
                }
              </div>
              <div class="mini-chip mini-yes" [class.mini-blank]="!settings().showYesNo">Yes</div>
            </div>
            <div class="mini-comm-row">
              <div class="mini-content">
                @if (settings().showSpellingGrid) {
                  @for (l of ['S','T','U','V','W','X']; track l) { <div class="mini-key">{{ l }}</div> }
                }
              </div>
              <div class="mini-chip mini-no" [class.mini-blank]="!settings().showYesNo">No</div>
            </div>
            <div class="mini-comm-row">
              <div class="mini-content">
                @if (settings().showSpellingGrid) {
                  @for (l of ['Y','Z','·',',','.','?']; track l) { <div class="mini-key">{{ l }}</div> }
                }
              </div>
              <div class="mini-chip">Scan</div>
            </div>
            <div class="mini-comm-row mini-pred-row">
              <div class="mini-content">
                @if (settings().showPredictionRow) {
                  <div class="mini-pred">{{ settings().showQuickPhrases ? 'Quick phrases' : 'Predictions' }}</div>
                }
              </div>
              <div class="mini-chip mini-needs" [class.mini-blank]="!settings().showNeedsMenu">Needs</div>
            </div>
            <div class="mini-comm-row mini-msg-row">
              <div class="mini-content">
                <div class="mini-msgbar">Message · Speak</div>
              </div>
              <div class="mini-chip">Select</div>
            </div>
            <div class="mini-footer">© EchoVoice</div>
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

    /* Mini preview — a thin vertical stack mirroring the 8 real screen rows */
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
      gap: 4px;
    }
    .mini-screen[data-theme="dark"] { background: #0E1216; }
    .mini-comm-row { display: flex; gap: 4px; height: 16px; }
    .mini-pred-row, .mini-msg-row { height: 20px; }
    .mini-content { flex: 1; display: flex; gap: 2px; min-width: 0; }
    .mini-key {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--key-bdr);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6px;
      font-weight: 700;
      color: var(--ink);
    }
    .mini-pred, .mini-msgbar {
      flex: 1;
      background: var(--surface);
      border: 1px solid var(--hair);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6px;
      color: var(--ink2);
      font-weight: 600;
    }
    .mini-chip {
      width: 30px;
      flex-shrink: 0;
      border-radius: 4px;
      background: var(--surface);
      border: 1px solid var(--hair);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6px;
      font-weight: 700;
      color: var(--ink2);
      text-align: center;
    }
    .mini-chip-muted { opacity: 0.7; }
    .mini-chip.mini-yes { background: #2F7A52; color: #fff; border-color: #2F7A52; }
    .mini-chip.mini-no { background: #B23B3B; color: #fff; border-color: #B23B3B; }
    .mini-chip.mini-needs { background: var(--acc-tint); border-color: var(--acc-bdr); color: var(--accent); }
    .mini-chip.mini-blank { visibility: hidden; }
    .mini-footer {
      height: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6px;
      color: var(--ink2);
      opacity: 0.7;
    }
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
    { key: 'showPredictionRow', label: 'Prediction row', desc: 'Word and phrase suggestions below the spelling grid.' },
    { key: 'showQuickPhrases', label: 'Quick phrases', desc: 'Shown in the suggestion row when his message is empty.' },
    { key: 'showYesNo', label: 'Yes / No buttons', desc: 'Yes and No buttons on the right edge of his screen.' },
    { key: 'showNeedsMenu', label: 'Needs menu', desc: 'The guided "What do you need?" menu.' },
  ];

  toggle(key: keyof Settings): void {
    this.svc.updateSettings({ [key]: !this.settings()[key] });
  }
}
