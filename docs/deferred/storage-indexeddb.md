# Architecture note: localStorage instead of IndexedDB

Phase B1 specified IndexedDB for persistence. We use shared `localStorage` instead.

**Why:**
- The comm view (`beta/`) is vanilla JS — synchronous `localStorage` reads are the simplest correct integration boundary.
- Both apps share one origin (GitHub Pages), so one `localStorage` key (`ev-state`) is readable and writable by both without CORS or postMessage plumbing.
- The `AppState` payload is small text (a few KB at most); localStorage's ~5 MB limit is ample.
- Cross-tab live updates are free via the native `storage` event.

**Trade-offs:**
- iOS can evict web storage under memory pressure. The export feature (Pass 3) doubles as backup against this.
- If payload grows very large (unlikely for this use case), migrate to IndexedDB at that point.
