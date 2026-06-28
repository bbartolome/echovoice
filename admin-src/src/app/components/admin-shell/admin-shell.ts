import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="shell" [attr.data-theme]="theme()">
      <!-- Top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <span class="lock-icon" aria-hidden="true">&#128274;</span>
          <span class="topbar-title">Caregiver settings</span>
        </div>
        <div class="topbar-right">
          @if (pinEnabled()) {
            <button class="lock-btn" (click)="lock()">
              <span class="lock-icon-sm" aria-hidden="true">&#128274;</span>
              Lock
            </button>
          }
          <a class="back-btn" href="../">← Back to communication</a>
        </div>
      </header>

      <!-- Scrollable body -->
      <main class="shell-body">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      min-height: 100vh;
      background: var(--app-bg);
      display: flex;
      flex-direction: column;
    }
    .topbar {
      flex-shrink: 0;
      min-height: 68px;
      background: var(--surface);
      border-bottom: 2px solid var(--hair);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 32px;
      position: sticky;
      top: 0;
      z-index: 100;
      flex-wrap: wrap;
    }
    @media (max-width: 500px) {
      .topbar { padding: 10px 16px; }
      .topbar-title { font-size: 17px; }
      .back-btn, .lock-btn { font-size: 14px; padding: 8px 12px; }
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .lock-icon {
      font-size: 20px;
      color: var(--accent);
    }
    .topbar-title {
      font-weight: 700;
      font-size: 20px;
      color: var(--ink);
    }
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .lock-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 12px;
      background: var(--app-bg);
      border: 2px solid var(--hair);
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
    }
    .lock-btn:hover { background: var(--empty-bg); }
    .lock-icon-sm { font-size: 15px; }
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 12px;
      background: var(--app-bg);
      border: 2px solid var(--hair);
      color: var(--ink);
      font-weight: 700;
      font-size: 16px;
      text-decoration: none;
    }
    .back-btn:hover { background: var(--empty-bg); }
    .shell-body {
      flex: 1;
      overflow-y: auto;
    }
  `]
})
export class AdminShellComponent {
  private svc = inject(PersistenceService);

  theme = computed(() => this.svc.state().settings.theme);
  pinEnabled = computed(() => this.svc.state().settings.pinEnabled);

  lock(): void {
    sessionStorage.removeItem('ev-pin-unlocked');
    window.location.hash = '#/pin';
  }
}
