import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';

interface NavCard {
  id: string;
  glyph: string;
  title: string;
  desc: string;
  route: string;
  badge?: string;
  live: boolean;
}

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [],
  template: `
    <div class="home-body">
      <div class="home-head">
        <h1 class="home-h1">Settings</h1>
        <p class="home-sub">Set up and adjust how David communicates. Every change saves on its own — there is no "save" button to remember.</p>
      </div>

      <div class="cards-grid">
        @for (card of cards; track card.id) {
          <button class="nav-card" (click)="navigate(card)">
            <div class="card-icon">
              <span class="card-glyph">{{ card.glyph }}</span>
            </div>
            <div class="card-text">
              <div class="card-title-row">
                <span class="card-title">{{ card.title }}</span>
                @if (card.badge) {
                  <span class="card-badge">{{ card.badge }}</span>
                }
                @if (!card.live) {
                  <span class="card-badge coming">COMING SOON</span>
                }
              </div>
              <div class="card-desc">{{ card.desc }}</div>
            </div>
            <span class="card-chev" aria-hidden="true">›</span>
          </button>
        }
      </div>

      <!-- PIN setting row -->
      <div class="pin-section">
        <div class="pin-row">
          <div class="pin-text">
            <div class="pin-label">Require a PIN to open settings</div>
            <div class="pin-hint">Prevents accidental changes — not a security feature.</div>
          </div>
          <button class="toggle-btn" [class.on]="pinEnabled()" (click)="togglePin()" [attr.aria-pressed]="pinEnabled()">
            <div class="toggle-thumb"></div>
          </button>
        </div>

        @if (pinEnabled()) {
          <div class="pin-set-row">
            <label class="pin-set-label" for="pin-input">PIN (4 digits)</label>
            <input
              id="pin-input"
              class="pin-input"
              type="password"
              inputmode="numeric"
              maxlength="4"
              pattern="[0-9]{4}"
              placeholder="••••"
              [value]="pin()"
              (input)="onPinInput($event)"
            />
            @if (pinSaved()) {
              <span class="pin-saved">Saved</span>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .home-body {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 40px 60px;
    }
    .home-head {
      margin-bottom: 28px;
    }
    .home-h1 {
      font-weight: 700;
      font-size: 44px;
      color: var(--ink);
      line-height: 1;
      margin: 0 0 10px;
    }
    .home-sub {
      font-size: 20px;
      color: var(--ink2);
      line-height: 1.4;
      max-width: 820px;
      margin: 0;
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .nav-card {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 20px;
      padding: 18px 22px;
      min-height: 106px;
      cursor: pointer;
      font-family: inherit;
      text-align: left;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .nav-card:hover { border-color: var(--accent); box-shadow: 0 2px 12px rgba(46,107,230,0.12); }
    .card-icon {
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: var(--acc-tint);
      border: 1px solid var(--acc-bdr);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card-glyph {
      font-size: 32px;
      color: var(--accent);
      line-height: 1;
    }
    .card-text { flex: 1; min-width: 0; }
    .card-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 6px;
    }
    .card-title {
      font-weight: 700;
      font-size: 24px;
      color: var(--ink);
      line-height: 1.1;
    }
    .card-badge {
      font-family: ui-monospace, Menlo, monospace;
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 1.2px;
      color: var(--off-ink);
      background: var(--off-face);
      border: 1px solid var(--off-bdr);
      border-radius: 6px;
      padding: 3px 8px;
    }
    .card-badge.coming {
      color: var(--mono);
      background: var(--empty-bg);
      border-color: var(--hair);
    }
    .card-desc {
      font-size: 18px;
      color: var(--ink2);
      line-height: 1.35;
    }
    .card-chev {
      flex-shrink: 0;
      font-size: 36px;
      color: var(--ink2);
      opacity: 0.5;
      line-height: 1;
    }

    /* PIN section */
    .pin-section {
      margin-top: 32px;
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 18px;
      padding: 20px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .pin-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
    }
    .pin-label {
      font-weight: 700;
      font-size: 19px;
      color: var(--ink);
    }
    .pin-hint {
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
    .pin-set-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .pin-set-label {
      font-weight: 700;
      font-size: 16px;
      color: var(--ink2);
    }
    .pin-input {
      width: 120px;
      height: 48px;
      padding: 0 16px;
      border-radius: 11px;
      border: 2px solid var(--field-bdr);
      background: var(--field-bg);
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 20px;
      letter-spacing: 4px;
    }
    .pin-input:focus { outline: 2px solid var(--accent); border-color: var(--accent); }
    .pin-saved {
      font-size: 15px;
      color: var(--yes);
      font-weight: 700;
    }
  `]
})
export class AdminHomeComponent {
  private svc = inject(PersistenceService);
  private router = inject(Router);

  pinEnabled = computed(() => this.svc.state().settings.pinEnabled);
  pin = computed(() => this.svc.state().settings.pin);
  pinSaved = signal(false);
  private pinSavedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly cards: NavCard[] = [
    {
      id: 'vocab',
      glyph: 'Aa',
      title: 'Personal vocabulary & context',
      desc: 'Names, people, places and topics that make his predictions better.',
      route: '/vocab',
      live: false,
    },
    {
      id: 'phrases',
      glyph: '★',
      title: 'Quick phrases & favourites',
      desc: 'Add, edit and reorder the phrases he reaches for most.',
      route: '/phrases',
      live: false,
    },
    {
      id: 'needs',
      glyph: '☰',
      title: 'Needs menu',
      desc: 'Edit the guided "What do you need?" menu and its options.',
      route: '/needs',
      live: false,
    },
    {
      id: 'input',
      glyph: '⚙',
      title: 'Input & accessibility',
      desc: 'Selection method, speed, text size, contrast and voice.',
      route: '/input',
      live: true,
    },
    {
      id: 'toggles',
      glyph: '▪',
      title: 'Visible sections',
      desc: 'Show or hide whole parts of his communication screen.',
      route: '/toggles',
      live: true,
    },
    {
      id: 'llm',
      glyph: '✦',
      title: 'Smart predictions',
      desc: 'Optional online help with wording. Off until you turn it on.',
      route: '/llm',
      badge: 'OFF',
      live: false,
    },
    {
      id: 'backup',
      glyph: '⇅',
      title: 'Backup & sharing',
      desc: 'Export a copy, bring settings in, or sync to another iPad.',
      route: '/backup',
      live: false,
    },
  ];

  navigate(card: NavCard): void {
    this.router.navigate([card.route]);
  }

  togglePin(): void {
    this.svc.updateSettings({ pinEnabled: !this.pinEnabled() });
  }

  onPinInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 4);
    (event.target as HTMLInputElement).value = val;
    this.svc.updateSettings({ pin: val });
    if (this.pinSavedTimer) clearTimeout(this.pinSavedTimer);
    this.pinSaved.set(true);
    this.pinSavedTimer = setTimeout(() => this.pinSaved.set(false), 1500);
  }
}
