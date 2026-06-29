import { Component, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PersistenceService } from '../../services/persistence.service';
import { NeedsNode } from '../../models/app-state.model';

@Component({
  selector: 'app-admin-needs',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <div class="page">
      <div class="topbar">
        <a class="back-link" routerLink="/home"><span class="back-gl">‹</span> Settings</a>
        <span class="saved"><span class="saved-dot"></span> All changes saved</span>
      </div>

      <div class="page-header">
        <h1 class="page-title">Needs menu</h1>
        <p class="page-sub">
          This is the guided menu behind the "What do you need?" button. Tap a row's pencil to
          rename it, use <span class="chev-inline">›</span> to open what's inside, and add or
          remove options at any level. <b>Other</b> is always kept at every level so he can
          spell something out.
        </p>
      </div>

      <div class="name-card">
        <span class="name-label">Question on the entry button</span>
        <div class="name-field">
          <input
            class="name-input"
            [value]="rootQuestion()"
            (input)="setRootQuestion($event)"
            aria-label="Question on the entry button"
          />
          <span class="name-edit" aria-hidden="true">✎</span>
        </div>
      </div>

      <div class="tree-card">
        <div class="tree-head">
          <span class="tree-head-title">Menu options</span>
          <span class="tree-head-hint">First level</span>
        </div>
        <div class="tree">
          <ng-container
            *ngTemplateOutlet="levelTpl; context: { list: tree(), parentId: null, label: null }"
          ></ng-container>
        </div>
      </div>
    </div>

    <ng-template #levelTpl let-list="list" let-parentId="parentId" let-label="label">
      @for (n of realNodes(list); track n.id) {
        <div class="node-row" [class.expanded]="isExpanded(n.id)">
          <div class="grip"></div>
          <button class="chev" (click)="toggle(n.id)" [attr.aria-expanded]="isExpanded(n.id)" aria-label="Expand">
            {{ isExpanded(n.id) ? '▾' : '›' }}
          </button>
          @if (editingId() === n.id) {
            <input
              class="edit-input"
              [value]="n.label"
              (keydown.enter)="commit(n, $event)"
              (keydown.escape)="cancelEdit(n)"
              (blur)="commit(n, $event)"
              #ed
              autofocus
            />
          } @else {
            <span class="node-label">{{ n.label }}</span>
            @if (!isExpanded(n.id) && realCount(n) > 0) {
              <span class="count-pill">{{ realCount(n) }} inside</span>
            }
            <button class="icon-btn" (click)="startEdit(n.id)" aria-label="Rename">✎</button>
          }
          <button class="icon-btn" (click)="remove(n.id)" aria-label="Delete">✕</button>
        </div>

        @if (isExpanded(n.id)) {
          <div class="child-wrap">
            @if (n.children) {
              <ng-container
                *ngTemplateOutlet="levelTpl; context: { list: n.children, parentId: n.id, label: n.label }"
              ></ng-container>
            } @else {
              <div class="add-row" (click)="add(n.id)">
                <span class="add-gl">+</span> Add option inside "{{ n.label }}"
              </div>
            }
          </div>
        }
      }

      @if (otherOf(list)) {
        <div class="other-row">
          <span class="lock" aria-hidden="true">🔒</span>
          <span class="other-label">Other</span>
          <span class="other-hint">Always here · spells it out</span>
        </div>
      }

      @if (parentId === null) {
        <div class="add-row root-add" (click)="add(null)"><span class="add-gl">+</span> Add a menu option</div>
      } @else {
        <div class="add-row" (click)="add(parentId)">
          <span class="add-gl">+</span> Add option inside "{{ label }}"
        </div>
      }
    </ng-template>
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
    .topbar { display: flex; align-items: center; justify-content: space-between; }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--accent); font-weight: 700; font-size: 17px; text-decoration: none;
    }
    .back-link:hover { text-decoration: underline; }
    .back-gl { font-size: 22px; line-height: 1; }
    .saved { display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 15px; color: var(--ink2); }
    .saved-dot { width: 9px; height: 9px; border-radius: 999px; background: var(--yes); }
    .page-header { display: flex; flex-direction: column; gap: 8px; }
    .page-title { font-weight: 700; font-size: 42px; color: var(--ink); margin: 0; line-height: 1; }
    .page-sub { font-size: 19px; color: var(--ink2); line-height: 1.5; margin: 0; max-width: 880px; }
    .page-sub b { color: var(--ink); }
    .chev-inline { font-weight: 700; color: var(--accent); }

    .name-card {
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 18px;
      padding: 18px 22px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .name-label { font-weight: 700; font-size: 15px; color: var(--ink2); }
    .name-field {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--field-bg);
      border: 2px solid var(--field-bdr);
      border-radius: 12px;
      padding: 0 16px;
      min-height: 58px;
    }
    .name-input {
      flex: 1 1 auto;
      border: none;
      background: transparent;
      color: var(--ink);
      font-family: inherit;
      font-weight: 700;
      font-size: 22px;
    }
    .name-input:focus { outline: none; }
    .name-edit { color: var(--ink2); font-size: 17px; }

    .tree-card {
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 20px;
      padding: 22px 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .tree-head { display: flex; align-items: baseline; justify-content: space-between; }
    .tree-head-title { font-weight: 700; font-size: 23px; color: var(--ink); }
    .tree-head-hint {
      font-family: ui-monospace, Menlo, monospace;
      font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--mono);
    }
    .tree { display: flex; flex-direction: column; gap: 11px; }

    .node-row {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface);
      border: 2px solid var(--hair);
      border-radius: 13px;
      padding: 10px 14px;
      min-height: 60px;
      box-sizing: border-box;
    }
    .node-row.expanded { border-color: var(--acc-bdr); }
    .grip {
      flex: 0 0 auto;
      width: 16px; height: 28px;
      color: var(--ink2); opacity: 0.45;
      background-image: radial-gradient(currentColor 1.6px, transparent 1.8px);
      background-size: 8px 8px; background-position: center;
    }
    .chev {
      flex: 0 0 auto;
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: transparent;
      color: var(--ink); font-size: 24px; line-height: 1;
      cursor: pointer; border-radius: 10px;
    }
    .chev:hover { background: var(--acc-tint); }
    .node-label { flex: 1 1 auto; min-width: 0; font-weight: 700; font-size: 22px; color: var(--ink); }
    .count-pill {
      flex: 0 0 auto;
      display: inline-flex; align-items: center;
      padding: 6px 13px; border-radius: 999px;
      background: var(--field-bg); border: 2px solid var(--field-bdr);
      color: var(--ink2); font-weight: 700; font-size: 15px; white-space: nowrap;
    }
    .edit-input {
      flex: 1 1 auto; min-width: 0;
      height: 44px; padding: 0 14px;
      border-radius: 11px; border: 2px solid var(--accent);
      background: var(--field-bg); color: var(--ink);
      font-family: inherit; font-weight: 700; font-size: 21px;
    }
    .edit-input:focus { outline: none; }
    .icon-btn {
      flex: 0 0 auto;
      width: 50px; height: 50px;
      border-radius: 11px; border: 2px solid var(--hair);
      background: transparent; color: var(--ink2);
      font-size: 18px; cursor: pointer;
    }
    .icon-btn:hover { border-color: var(--accent); color: var(--accent); }

    .child-wrap {
      margin-left: 19px;
      border-left: 2px solid var(--hair);
      padding-left: 26px;
      display: flex; flex-direction: column; gap: 10px;
      margin-top: 10px; margin-bottom: 2px;
    }

    .other-row {
      display: flex; align-items: center; gap: 14px;
      background: var(--empty-bg);
      border: 2px dashed var(--field-bdr);
      border-radius: 13px;
      padding: 12px 16px; min-height: 56px; box-sizing: border-box;
    }
    .lock { font-size: 18px; opacity: 0.7; }
    .other-label { font-weight: 700; font-size: 21px; color: var(--ink2); }
    .other-hint { font-weight: 400; font-size: 16px; color: var(--ink2); opacity: 0.85; }

    .add-row {
      display: inline-flex; align-items: center; gap: 9px;
      align-self: flex-start;
      padding: 11px 20px;
      border-radius: 12px;
      background: transparent;
      border: 2px dashed var(--acc-bdr);
      color: var(--accent);
      font-weight: 700; font-size: 18px; cursor: pointer;
    }
    .add-row:hover { background: var(--acc-tint); }
    .add-gl { font-size: 22px; line-height: 1; margin-top: -2px; }

    @media (max-width: 700px) {
      .page { padding: 16px 16px 48px; gap: 14px; }
      .page-title { font-size: 30px; }
      .page-sub { font-size: 16px; }
      .name-card { padding: 14px 16px; }
      .name-input { font-size: 18px; }
      .name-field { min-height: 50px; }
      .tree-card { padding: 14px 14px; gap: 12px; }
      .tree-head-title { font-size: 19px; }
      .node-row { min-height: 50px; padding: 8px 10px; gap: 8px; }
      .grip { width: 12px; }
      .chev { width: 32px; height: 32px; font-size: 20px; }
      .node-label { font-size: 17px; }
      .count-pill { font-size: 12px; padding: 4px 8px; }
      .icon-btn { width: 38px; height: 38px; font-size: 15px; border-radius: 9px; }
      .edit-input { height: 38px; font-size: 17px; }
      .child-wrap { margin-left: 8px; padding-left: 14px; gap: 8px; }
      .other-row { padding: 9px 12px; min-height: 46px; gap: 10px; }
      .other-label { font-size: 17px; }
      .other-hint { display: none; }
      .add-row { font-size: 15px; padding: 9px 14px; }
      .add-gl { font-size: 18px; }
    }
  `]
})
export class AdminNeedsComponent {
  private svc = inject(PersistenceService);

  tree = computed(() => this.svc.state().needsTree);
  rootQuestion = computed(() => this.svc.state().needsRootQuestion);

  private expanded = signal<Set<string>>(new Set());
  editingId = signal<string | null>(null);

  // ── Template helpers ────────────────────────────────────────────────────
  realNodes(list: NeedsNode[] | undefined): NeedsNode[] {
    return (list ?? []).filter(n => !n.isOther);
  }
  otherOf(list: NeedsNode[] | undefined): NeedsNode | undefined {
    return (list ?? []).find(n => n.isOther);
  }
  realCount(n: NeedsNode): number {
    return this.realNodes(n.children).length;
  }
  isExpanded(id: string): boolean {
    return this.expanded().has(id);
  }
  toggle(id: string): void {
    this.expanded.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Root question ───────────────────────────────────────────────────────
  setRootQuestion(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.svc.updateState({ needsRootQuestion: value });
  }

  // ── Editing labels ──────────────────────────────────────────────────────
  startEdit(id: string): void {
    this.editingId.set(id);
  }
  commit(node: NeedsNode, event: Event): void {
    if (this.editingId() !== node.id) return;
    const text = (event.target as HTMLInputElement).value.trim();
    this.editingId.set(null);
    if (!text) {
      if (!node.label) this.remove(node.id); // brand-new, abandoned
      return;
    }
    if (text === node.label) return;
    this.rename(node.id, text);
  }
  cancelEdit(node: NeedsNode): void {
    this.editingId.set(null);
    if (!node.label) this.remove(node.id);
  }

  // ── Mutations ───────────────────────────────────────────────────────────
  add(parentId: string | null): void {
    const tree = this.clone();
    const blank: NeedsNode = { id: this.newId(), label: '' };
    if (parentId === null) {
      this.insertBeforeOther(tree, blank);
    } else {
      const parent = this.find(tree, parentId);
      if (!parent) return;
      if (!parent.children) parent.children = [this.makeOther(parentId)];
      this.insertBeforeOther(parent.children, blank);
      this.expanded.update(s => new Set(s).add(parentId));
    }
    this.persist(tree);
    this.editingId.set(blank.id);
  }

  rename(id: string, label: string): void {
    const tree = this.clone();
    const node = this.find(tree, id);
    if (!node) return;
    node.label = label;
    this.persist(tree);
  }

  remove(id: string): void {
    const tree = this.clone();
    if (this.removeById(tree, id)) this.persist(tree);
  }

  // ── Tree utilities ──────────────────────────────────────────────────────
  private insertBeforeOther(list: NeedsNode[], node: NeedsNode): void {
    const idx = list.findIndex(n => n.isOther);
    if (idx === -1) list.push(node);
    else list.splice(idx, 0, node);
  }
  private find(list: NeedsNode[], id: string): NeedsNode | undefined {
    for (const n of list) {
      if (n.id === id) return n;
      if (n.children) {
        const hit = this.find(n.children, id);
        if (hit) return hit;
      }
    }
    return undefined;
  }
  private removeById(list: NeedsNode[], id: string): boolean {
    const idx = list.findIndex(n => n.id === id && !n.isOther && !n.locked);
    if (idx !== -1) {
      list.splice(idx, 1);
      return true;
    }
    for (const n of list) {
      if (n.children && this.removeById(n.children, id)) return true;
    }
    return false;
  }
  private makeOther(prefix: string): NeedsNode {
    return { id: prefix + '-other-' + this.shortId(), label: 'Other', isOther: true, locked: true };
  }
  private clone(): NeedsNode[] {
    return structuredClone(this.tree());
  }
  private persist(tree: NeedsNode[]): void {
    this.svc.updateState({ needsTree: tree });
  }
  private newId(): string {
    return 'n-' + this.shortId();
  }
  private shortId(): string {
    return crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
}
