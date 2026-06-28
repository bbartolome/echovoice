import {
  Component,
  Directive,
  ElementRef,
  computed,
  inject,
  signal,
  AfterViewInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { PersistenceService } from '../../services/persistence.service';
import { QuickPhrase } from '../../models/app-state.model';

/** Focuses the host element once when it enters the DOM (used for inline edit fields). */
@Directive({ selector: '[appAutofocus]', standalone: true })
export class AutofocusDirective implements AfterViewInit {
  private host = inject(ElementRef<HTMLElement>);
  ngAfterViewInit(): void {
    queueMicrotask(() => this.host.nativeElement.focus());
  }
}

@Component({
  selector: 'app-admin-phrases',
  standalone: true,
  imports: [RouterLink, CdkDropList, CdkDrag, CdkDragHandle, CdkDragPlaceholder, AutofocusDirective],
  template: `
    <div class="page">
      <div class="topbar">
        <a class="back-link" routerLink="/home"><span class="back-gl">‹</span> Settings</a>
        <span class="saved"><span class="saved-dot"></span> All changes saved</span>
      </div>

      <div class="page-header">
        <h1 class="page-title">Quick phrases &amp; favourites</h1>
        <p class="page-sub">
          Drag the <span class="grip-inline"></span> handle to reorder. The top four show on
          David's communication screen — drag a phrase above the line to put it there.
        </p>
      </div>

      <div class="add-row">
        <button class="add-btn" (click)="add()"><span class="add-gl">+</span> Add a phrase</button>
        <span class="count">{{ phrases().length }} phrases</span>
      </div>

      <div class="group-label"><span class="group-dot"></span> On his screen · top 4</div>

      <div class="list" cdkDropList (cdkDropListDropped)="drop($event)">
        @for (p of phrases(); track p.id; let i = $index) {
          @if (i === 4) {
            <div class="divider">
              <span class="divider-line"></span>
              <span class="divider-label">Below the line · not on his screen</span>
              <span class="divider-line"></span>
            </div>
          }
          <div class="row" cdkDrag>
            <div class="drag-placeholder" *cdkDragPlaceholder></div>
            <div class="grip" cdkDragHandle></div>
            @if (editingId() === p.id) {
              <input
                class="edit-input"
                appAutofocus
                [value]="p.text"
                (keydown.enter)="commit(p, $event)"
                (keydown.escape)="cancelEdit()"
                (blur)="commit(p, $event)"
              />
            } @else {
              <span class="text">{{ p.text }}</span>
              <button class="icon-btn" (click)="startEdit(p.id)" aria-label="Edit phrase">✎</button>
            }
            <button class="icon-btn" (click)="remove(p.id)" aria-label="Delete phrase">✕</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 1060px;
      margin: 0 auto;
      padding: 24px 40px 60px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent);
      font-weight: 700;
      font-size: 17px;
      text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
    .back-gl { font-size: 22px; line-height: 1; }
    .saved {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 15px;
      color: var(--ink2);
    }
    .saved-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--yes); }
    .page-header { display: flex; flex-direction: column; gap: 8px; }
    .page-title { font-weight: 700; font-size: 42px; color: var(--ink); margin: 0; line-height: 1; }
    .page-sub { font-size: 19px; color: var(--ink2); line-height: 1.45; margin: 0; max-width: 820px; }
    .grip-inline {
      display: inline-block;
      width: 14px;
      height: 16px;
      vertical-align: -3px;
      color: var(--ink2);
      opacity: 0.7;
      background-image: radial-gradient(currentColor 1.4px, transparent 1.6px);
      background-size: 7px 7px;
    }

    .add-row { display: flex; align-items: center; justify-content: space-between; }
    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 13px 24px;
      border-radius: 13px;
      border: none;
      background: var(--accent);
      color: var(--acc-ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 19px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(46,107,230,0.24);
    }
    .add-btn:hover { background: var(--acc-dk); }
    .add-gl { font-size: 24px; line-height: 1; margin-top: -2px; }
    .count { font-weight: 700; font-size: 16px; color: var(--ink2); }

    .group-label {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      font-weight: 700;
      font-size: 15px;
      color: var(--ink2);
    }
    .group-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--accent); }

    .list { display: flex; flex-direction: column; gap: 12px; }
    .row {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 15px;
      padding: 12px 16px;
      min-height: 70px;
      box-sizing: border-box;
      box-shadow: 0 1px 2px rgba(16,24,40,0.04);
    }
    .row.cdk-drag-preview {
      border-color: var(--accent);
      box-shadow: 0 12px 28px rgba(16,24,40,0.20);
    }
    .row.cdk-drag-placeholder { opacity: 0; }
    .drag-placeholder {
      height: 14px;
      border-radius: 8px;
      border: 2px dashed var(--acc-bdr);
      background: var(--acc-tint);
    }
    .cdk-drag-animating { transition: transform 200ms cubic-bezier(0,0,0.2,1); }
    .grip {
      flex: 0 0 auto;
      width: 18px;
      height: 30px;
      color: var(--ink2);
      opacity: 0.5;
      background-image: radial-gradient(currentColor 1.6px, transparent 1.8px);
      background-size: 9px 9px;
      background-position: center;
      cursor: grab;
    }
    .grip:active { cursor: grabbing; }
    .text {
      flex: 1 1 auto;
      min-width: 0;
      font-weight: 700;
      font-size: 22px;
      color: var(--ink);
      line-height: 1.2;
    }
    .edit-input {
      flex: 1 1 auto;
      min-width: 0;
      height: 46px;
      padding: 0 14px;
      border-radius: 11px;
      border: 2px solid var(--accent);
      background: var(--field-bg);
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 21px;
    }
    .edit-input:focus { outline: none; }
    .icon-btn {
      flex: 0 0 auto;
      width: 52px;
      height: 52px;
      border-radius: 12px;
      border: 2px solid var(--hair);
      background: transparent;
      color: var(--ink2);
      font-size: 18px;
      cursor: pointer;
    }
    .icon-btn:hover { border-color: var(--accent); color: var(--accent); }

    .divider { display: flex; align-items: center; gap: 16px; margin: 4px 0; }
    .divider-line { flex: 1 1 0; height: 0; border-top: 2px dashed var(--acc-bdr); }
    .divider-label { font-weight: 700; font-size: 15px; color: var(--accent); white-space: nowrap; }
  `]
})
export class AdminPhrasesComponent {
  private svc = inject(PersistenceService);

  phrases = computed(() => this.svc.state().quickPhrases);
  editingId = signal<string | null>(null);

  add(): void {
    const id = this.newId();
    this.svc.updateState({ quickPhrases: [...this.phrases(), { id, text: '' }] });
    this.editingId.set(id);
  }

  startEdit(id: string): void {
    this.editingId.set(id);
  }

  commit(phrase: QuickPhrase, event: Event): void {
    if (this.editingId() !== phrase.id) return;
    const text = (event.target as HTMLInputElement).value.trim();
    this.editingId.set(null);
    if (!text) {
      // Empty phrase: drop it (covers an Add the user backed out of).
      this.remove(phrase.id);
      return;
    }
    if (text === phrase.text) return;
    this.svc.updateState({
      quickPhrases: this.phrases().map(p => (p.id === phrase.id ? { ...p, text } : p)),
    });
  }

  cancelEdit(): void {
    const id = this.editingId();
    this.editingId.set(null);
    // Discard a brand-new empty phrase that was never given text.
    if (id) {
      const p = this.phrases().find(x => x.id === id);
      if (p && !p.text.trim()) this.remove(id);
    }
  }

  remove(id: string): void {
    this.svc.updateState({ quickPhrases: this.phrases().filter(p => p.id !== id) });
  }

  drop(event: CdkDragDrop<QuickPhrase[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const arr = [...this.phrases()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.svc.updateState({ quickPhrases: arr });
  }

  private newId(): string {
    return 'qp-' + (crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));
  }
}
