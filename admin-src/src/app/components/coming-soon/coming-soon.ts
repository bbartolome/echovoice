import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="cs-wrap">
      <a class="back-link" routerLink="/home">‹ Settings</a>
      <div class="cs-card">
        <div class="cs-icon">🚧</div>
        <h1 class="cs-title">{{ title() }}</h1>
        <p class="cs-desc">This section is coming in the next update. Check back soon.</p>
        <a class="cs-btn" routerLink="/home">Back to settings</a>
      </div>
    </div>
  `,
  styles: [`
    .cs-wrap {
      max-width: 700px;
      margin: 0 auto;
      padding: 28px 40px 60px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
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
    .cs-card {
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 20px;
      padding: 48px 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }
    .cs-icon { font-size: 48px; }
    .cs-title { font-weight: 700; font-size: 32px; color: var(--ink); margin: 0; }
    .cs-desc { font-size: 19px; color: var(--ink2); margin: 0; line-height: 1.4; max-width: 480px; }
    .cs-btn {
      display: inline-block;
      margin-top: 8px;
      padding: 14px 28px;
      border-radius: 14px;
      background: var(--accent);
      color: var(--acc-ink);
      font-weight: 700;
      font-size: 18px;
      text-decoration: none;
    }
    .cs-btn:hover { background: var(--acc-dk); }
  `]
})
export class ComingSoonComponent implements OnInit {
  private route = inject(ActivatedRoute);
  title = signal('Coming soon');

  ngOnInit(): void {
    const t = this.route.snapshot.data['title'];
    if (t) this.title.set(t);
  }
}
