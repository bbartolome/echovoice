# EchoVoice

An AAC (Augmentative and Alternative Communication) app. The **communication view** is vanilla HTML/CSS/JS (no build step). The **admin/caregiver view** is Angular + Tailwind, built to static files.

## Live site

Deployed automatically via GitHub Pages on every push to `main`. The deploy workflow also builds the Angular admin before uploading.

## Project structure

```
beta/              ← staging comm view (vanilla JS); all comm-view changes go here first
  index.html
  app.css
  app.js
admin-src/         ← Angular admin app source (TypeScript + Tailwind)
  src/app/
    models/        ← AppState interfaces + migration
    services/      ← PersistenceService (reads/writes ev-state in localStorage)
    components/    ← admin-shell, admin-home, admin-pin, admin-input, admin-toggles, coming-soon
  angular.json     ← outputPath: ../admin, base-href: ./
admin/             ← Angular build output (gitignored; built by CI or `npm run build`)
docs/deferred/     ← deferred feature notes + resume instructions
index.html         ← production comm view (promoted from beta/)
app.css
app.js
design/            ← reference mockups only, not served
.github/
  workflows/
    static.yml     ← builds admin-src/ → admin/, then deploys Pages
    promote.yml    ← manually promote beta/ → root
```

## Development workflow

### Communication view (beta/)
1. **Edit in `beta/`** — all comm-view changes go here first.
2. **Test locally** with `npx http-server .` from the repo root (same origin as admin).
3. **Promote to production** via the "Promote beta to production" GitHub Actions workflow.

Never edit the root `index.html`, `app.css`, or `app.js` directly.

### Admin view (admin-src/)
1. **Edit in `admin-src/src/`**.
2. **Build**: `cd admin-src && npm run build` → outputs to `admin/`.
3. **Test**: serve the repo root with `npx http-server .`; open `http://localhost:8080/admin/`.
4. **Integration test**: open `/beta/` in the same browser — settings changes in admin propagate live via `localStorage` storage events.

The admin build output (`admin/`) is gitignored; the GitHub Actions workflow (`static.yml`) builds it fresh on every push to `main`.

## Shared state contract

The vanilla comm view and the Angular admin share settings via a single `localStorage` key: **`ev-state`** (JSON, `AppState` shape, versioned with `schemaVersion`).

- The admin is the **only** writer via `PersistenceService` — the comm view is read-only on `ev-state`.
- The comm view reads on init and listens for `storage` events to live-update.
- Current shape is `schemaVersion: 2`. `settings.scanAutoStart` (bool) replaced the old `inputMode`/`dwellMs`/`targetSize` fields; `migrateState()` in `app-state.model.ts` maps a v1 `inputMode === 'scan'` to `scanAutoStart: true` and drops the rest.
- The draft message uses a separate `ev-draft` key (owned by the comm view).

## Architecture: comm view (beta/)

- **Fixed canvas**: `#app` is always 1180 × 820 px (landscape).
- **8-row scan layout**: rows 1–5 are the spelling grid, row 6 is predictions/quick phrases, row 7 is the message bar, row 8 is a static footer. Rows 1–6 each pair their content with a trailing action button (Settings, Clear, Yes, No, Scan/Pause, Needs) so every action is reachable by row-column scanning; the column is a fixed width so the six buttons line up vertically. Row 7's trailing button is Select while scanning / Backspace when idle, and is never itself a scan target — it's the switch actuator. Row 8 is never scanned.
- **Access mode**: Direct and Scan are merged — direct taps always work, and scanning (`S.scanning`) is a runtime toggle started from the Scan button or `settings.scanAutoStart`, never persisted mid-session. Dwell mode has been removed.
- **Needs board**: opening it swaps rows 1–5's *content* for a header + tiles (via the same row model, `needsRowItems()`); the whole trailing action column mirrors to the left edge (`#app.needs-open`) while open.
- **Scaling**: `scaleApp()` transforms the canvas to fit any viewport.
- **Theme**: `data-theme` on `#app` and `<body>` drives light/dark tokens.
- **Touch guard**: a global `touchend` listener prevents iOS double-tap zoom.
- **State**: all mutable state lives in the `S` object in `app.js`. `render()` is called after every mutation. `getRows()` is the single source of truth for rendering, direct taps, and the scan sweep.
- **Admin settings** loaded on init via `applyAdminSettings()` → `readAdminState()`.

## Architecture: admin (admin-src/)

- Angular 22, standalone components, signals. No NgRx.
- Tailwind CSS v4 (PostCSS plugin) with the same design tokens as `beta/app.css`.
- Hash-based routing (`withHashLocation()`) — no server config needed for GitHub Pages.
- Lazy-loaded routes per screen. `PersistenceService` debounces writes to `ev-state`.
- Optional PIN gate via `pinGuard` + `sessionStorage`.

## Key CSS variables

All colours are CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Don't hard-code colours — always use the tokens (e.g. `var(--ink)`, `var(--accent)`). The same token names are defined in both `beta/app.css` and `admin-src/src/styles.css`.

## What's deferred

See `docs/deferred/` for:
- `RESUME.md` — what's next and how to resume
- `backup-and-sharing.md`, `merge-state.md`, `smart-predictions-llm.md`
- `pwa-offline.md`, `storage-indexeddb.md`, `admin-usage-guide.md`
