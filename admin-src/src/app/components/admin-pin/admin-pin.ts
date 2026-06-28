import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';

@Component({
  selector: 'app-admin-pin',
  standalone: true,
  template: `
    <div class="pin-wrap" [attr.data-theme]="theme()">
      <div class="pin-col">
        <div class="chip">
          <span class="chip-lock" aria-hidden="true">&#128274;</span>
          <span>Caregiver settings</span>
        </div>
        <h1 class="pin-title">Enter PIN</h1>
        <p class="pin-sub">This just keeps settings from being changed by accident.</p>

        <!-- Dots -->
        <div class="dots-row" aria-label="PIN progress">
          @for (d of dots(); track $index) {
            <div class="dot" [class.filled]="d"></div>
          }
        </div>

        <!-- Error -->
        @if (error()) {
          <div class="pin-error" role="alert">Incorrect PIN — try again</div>
        }

        <!-- Numpad -->
        <div class="numpad" role="group" aria-label="PIN keypad">
          @for (k of keys; track k.label) {
            <button
              class="numpad-key"
              [class.invisible]="k.invisible"
              [disabled]="k.invisible"
              (click)="onKey(k.label)"
              [attr.aria-label]="k.ariaLabel"
            >{{ k.label }}</button>
          }
        </div>

        <footer class="pin-foot">
          <p class="pin-note">Not a security lock — ask any family member if you forget it.</p>
          <a class="return-btn" href="../">
            <span aria-hidden="true">‹</span> Back to communication
          </a>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .pin-wrap {
      min-height: 100vh;
      background: var(--app-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .pin-col {
      width: 520px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 9px 18px 9px 15px;
      border-radius: 999px;
      background: var(--acc-tint);
      color: var(--accent);
      border: 1px solid var(--acc-bdr);
      font-weight: 700;
      font-size: 17px;
      margin-bottom: 28px;
    }
    .chip-lock { font-size: 16px; }
    .pin-title {
      font-weight: 700;
      font-size: 50px;
      color: var(--ink);
      margin: 0 0 12px;
      line-height: 1;
    }
    .pin-sub {
      font-size: 21px;
      color: var(--ink2);
      text-align: center;
      line-height: 1.4;
      max-width: 420px;
      margin: 0;
    }
    .dots-row {
      display: flex;
      gap: 22px;
      margin: 36px 0 10px;
    }
    .dot {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid var(--field-bdr);
      background: transparent;
      transition: all 0.15s;
    }
    .dot.filled {
      background: var(--accent);
      border-color: var(--accent);
    }
    .pin-error {
      font-size: 16px;
      color: var(--no);
      font-weight: 700;
      margin-bottom: 6px;
      min-height: 22px;
    }
    .numpad {
      display: grid;
      grid-template-columns: repeat(3, 148px);
      gap: 18px;
      margin-top: 24px;
    }
    .numpad-key {
      height: 96px;
      border-radius: 16px;
      background: var(--surface);
      border: 2px solid var(--key-bdr);
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 44px;
      cursor: pointer;
      transition: background 0.1s;
    }
    .numpad-key:hover:not([disabled]) { background: var(--empty-bg); }
    .numpad-key:active:not([disabled]) { background: var(--acc-tint); }
    .numpad-key.invisible { visibility: hidden; }
    .pin-foot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 18px;
      margin-top: 32px;
    }
    .pin-note {
      font-size: 16px;
      color: var(--ink2);
      text-align: center;
      max-width: 380px;
      line-height: 1.4;
      margin: 0;
    }
    .return-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 22px;
      border-radius: 13px;
      background: var(--surface);
      border: 2px solid var(--hair);
      color: var(--ink);
      font-weight: 700;
      font-size: 18px;
      text-decoration: none;
    }
    .return-btn:hover { background: var(--empty-bg); }
  `]
})
export class AdminPinComponent {
  private svc = inject(PersistenceService);
  private router = inject(Router);

  theme = computed(() => this.svc.state().settings.theme);
  entered = signal<string>('');
  error = signal(false);

  dots = computed(() => [0, 1, 2, 3].map(i => i < this.entered().length));

  readonly keys = [
    { label: '1', ariaLabel: '1', invisible: false },
    { label: '2', ariaLabel: '2', invisible: false },
    { label: '3', ariaLabel: '3', invisible: false },
    { label: '4', ariaLabel: '4', invisible: false },
    { label: '5', ariaLabel: '5', invisible: false },
    { label: '6', ariaLabel: '6', invisible: false },
    { label: '7', ariaLabel: '7', invisible: false },
    { label: '8', ariaLabel: '8', invisible: false },
    { label: '9', ariaLabel: '9', invisible: false },
    { label: '', ariaLabel: '', invisible: true },
    { label: '0', ariaLabel: '0', invisible: false },
    { label: '⌫', ariaLabel: 'Delete', invisible: false },
  ];

  onKey(label: string): void {
    if (!label) return;
    this.error.set(false);

    if (label === '⌫') {
      this.entered.update(v => v.slice(0, -1));
      return;
    }

    if (this.entered().length >= 4) return;
    const next = this.entered() + label;
    this.entered.set(next);

    if (next.length === 4) {
      const correctPin = this.svc.state().settings.pin;
      if (next === correctPin) {
        sessionStorage.setItem('ev-pin-unlocked', '1');
        this.router.navigate(['/home']);
      } else {
        this.error.set(true);
        this.entered.set('');
      }
    }
  }
}
