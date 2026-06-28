# EchoVoice

A single-page AAC (Augmentative and Alternative Communication) app built with vanilla HTML, CSS, and JavaScript — no build step.

## Live site

`https://about.bbartolo.me/echovoice/` — deployed automatically via GitHub Pages on every push to `main`.

## Project structure

```
beta/           ← staging area; all changes go here first
  index.html
  app.css
  app.js
index.html      ← production (promoted from beta/)
app.css
app.js
design/         ← reference mockups only, not served
.github/
  workflows/
    static.yml  ← auto-deploy Pages on push to main
    promote.yml ← manually promote beta/ → root
```

## Development workflow

1. **Edit in `beta/`** — all changes are made inside `beta/` first.
2. **Test at** `about.bbartolo.me/echovoice/beta/` before promoting.
3. **Promote to production** via the "Promote beta to production" workflow in the GitHub Actions tab. It auto-increments the `?v=N` cache-buster and commits the result.

Never edit the root `index.html`, `app.css`, or `app.js` directly — those are only updated by the promote workflow.

## Cache busting

`index.html` loads assets with a `?v=N` query string (e.g. `app.js?v=4`). The promote workflow increments `N` automatically. If you ever need to force a cache-bust manually, bump the number in `beta/index.html` before promoting.

## Architecture

- **Fixed canvas**: `#app` is always 1180 × 820 px (landscape).
- **Scaling**: `scaleApp()` in `app.js` transforms the canvas to fit any viewport.
  - Landscape: `translate(x,y) scale(s)` centered in the viewport.
  - Portrait: `rotate(90deg)` so the landscape canvas fills a portrait phone.
- **Theme**: `data-theme` on `#app` and `<body>` drives light/dark tokens. Light → white letterbox background; dark → black.
- **Touch guard**: a global `touchend` listener prevents iOS double-tap zoom (Safari ignores `user-scalable=no`).
- **State**: all mutable state lives in the `S` object in `app.js`. `render()` is called after every mutation — no virtual DOM.
- **Predictions**: prefix-matched against `VOCAB` array; updated on every keystroke.
- **Persistence**: draft message saved to `localStorage` under `ev-draft`.

## Key CSS variables

All colours are CSS custom properties on `:root` (light) and `[data-theme="dark"]`. Don't hard-code colours — always use the tokens (e.g. `var(--ink)`, `var(--accent)`).
