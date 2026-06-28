# Deferred: PWA / offline caching (B8)

**Why deferred:** service workers are added last, once the app is stable (per the phase plan). Adding SW caching during development complicates cache invalidation and masks bugs.

**When to implement (Pass 4):**
1. `cd admin-src && ng add @angular/pwa` — adds service worker + manifest for the Angular admin
2. Configure `ngsw-config.json` for offline-first: cache the app shell, all assets, fonts
3. For the vanilla comm view (`beta/`): add a minimal `sw.js` that caches `index.html`, `app.js`, `app.css` and serves them offline
4. iPad hardening: suppress long-press/callout/zoom on dwell targets; Screen Wake Lock API; verify TTS still works after first gesture on iOS

**Note:** the app already works offline for its core loop (spelling, TTS, needs menu, quick phrases) — it just won't cache on first load without a SW. The Google Fonts request fails offline; self-host Atkinson Hyperlegible as a future improvement.
