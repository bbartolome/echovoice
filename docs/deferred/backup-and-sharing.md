# Deferred: Backup & sharing

The Admin Backup screen (`/backup` route) is stubbed as "Coming soon".

**What's local (no backend, implement in Pass 3):**
- Full export: entire `ev-state` as a versioned JSON file (download via `<a download>` blob URL)
- Import with merge summary: parse file, show "N new phrases, M vocabulary words — Apply?", never silently overwrite
- QR-code / link share for the config bundle (vocab + phrases + settings, not history) — use a QR library + `location.origin` for the link; gracefully fall back if bundle is too large for a QR

**What needs a backend (indefinitely deferred):**
- Shared cloud location / semi-automatic pull-push sync

**`mergeState` logic** (also deferred to Pass 3): union-by-content for lists, per-field newest-wins for settings, per-device idempotent history. See `docs/deferred/merge-state.md`.
