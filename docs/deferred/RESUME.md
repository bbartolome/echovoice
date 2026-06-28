# Resume instructions — EchoVoice Admin View

## What shipped in this pass (Phase A2 — first increment)

- **Angular admin app** (`admin-src/`) building to `admin/` (served at `/echovoice/admin/`)
  - Admin Home: 7 section navigation cards
  - Input & accessibility settings: selection mode (direct/scan/dwell), scan speed, dwell time, letter layout, key size, theme, TTS voice/rate/pitch with live test
  - Visible sections: toggle spelling grid, prediction row, quick phrases, Yes/No, needs menu with mini live preview
  - Optional PIN gate (off by default): turn on in the Home screen's PIN row
- **Vanilla comm view** (`beta/`) integrated with admin:
  - Reads `ev-state` from localStorage on load and on cross-tab `storage` events
  - Honors all admin settings: theme, layout, density, input mode, scan/dwell timing, TTS voice, section visibility, quick phrases from admin
  - Rail toggle buttons write back to `ev-state` (comm view + admin stay in sync)
  - Gear ⚙ Settings link in the rail navigates to the admin
- **GitHub Actions workflow** builds the Angular admin before Pages upload

## What to build next

### Pass 2 — Content editors (no backend needed)
1. **Personal vocabulary & context** (`admin-src/` → `/vocab` route): people + relationships, caregivers, pets, places, care terms, free-text context notes — all feeding predictions
2. **Quick phrases manager** (`/phrases`): add/edit/delete/reorder; top 4 appear on the comm screen; drag-to-reorder with a dashed cut-line
3. **Needs-tree editor** (`/needs`): add/edit/remove levels and options at any depth; "Other" locked at every level; uses the needs-tree data structure already in `AppState`

### Pass 3 — Backup & sharing (local, no backend)
- Full export/import with merge summary ("N new phrases, M vocabulary words — Apply?")
- QR-code / link share for the config bundle (vocabulary + phrases + settings, not history)
- Per-device history tracking and idempotent re-import (`mergeState` logic from the B1 plan)

### Pass 4 — PWA / offline + iPad hardening (B8)
- Add `@angular/pwa` service worker after the app is stable
- iPad Safari suppression (callout, zoom, dwell-safe touch events)
- Screen Wake Lock API

### Backend-gated (deferred indefinitely)
- Smart predictions / LLM integration (`/llm`) — requires a network endpoint
- Cloud sync / shared folder — requires a backend

## How to resume this work

Open a new Claude Code session in `/Users/bbartolome/workspace/echovoice` and say:

> "Continue from docs/deferred/RESUME.md — build Pass 2: Personal vocabulary & context, Quick phrases manager, and Needs-tree editor in the Angular admin (`admin-src/`)."

The plan file is at: `/Users/bbartolome/.claude/plans/use-the-claude-design-mcp-jiggly-gadget.md`
The design reference is in the Claude Design project `21d042a0-fe8c-486b-a17b-b6933f13fb74` — relevant files: `AdminVocab.dc.html`, `AdminPhrases.dc.html`, `AdminNeedsTree.dc.html`.
