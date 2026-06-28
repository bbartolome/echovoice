# Deferred: mergeState + idempotent import

**Why deferred:** no import UI exists yet. Implement alongside the Backup & sharing screen (Pass 3).

**Contract (from Phase B1 spec):**
- **Lists** (phrases, vocabulary, needs-tree options): union, de-duplicated by content
- **Settings**: per-field, most-recently-edited wins (store a per-field `updatedAt`)
- **Usage history**: track each device's contribution under a stable `deviceId`; sum across distinct devices; re-importing the same device's export is idempotent (never double-counts)
- Returns a **change summary** for the import-confirmation UI: `{ newPhrases: N, newVocab: M, historyMerged: true }`

**Where to implement:** `admin-src/src/app/models/app-state.model.ts` — add `mergeState(local: AppState, incoming: AppState): { merged: AppState; summary: MergeSummary }`. Add unit tests in `app-state.model.spec.ts`.
