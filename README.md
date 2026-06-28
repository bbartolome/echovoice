# EchoVoice

*For my dad.*

ALS took his voice. This gives it back.

He points with a straw at a paper alphabet sheet, and we guess where he's going. It works, and it's ours, but it's slow — and it gets harder as his arm does. This is the better version: a calm, fast, always-ready tool that fits an iPad and meets him where he is today, and wherever he goes next.

The design is built around one principle: zero wasted effort. Every tap moves something forward. Nothing flickers, nothing jumps, nothing asks him to try again.

---

## What it does

**Compose and speak** — tap letters to build a message, tap **Speak** to read it aloud in his own rhythm. The message stays on screen until he's ready. Backspace removes the last letter; ✕ clears everything.

**Word predictions** — five suggestions update as he types, matched to a vocabulary that includes the words that come up most in his life. Tapping a suggestion completes the word he's spelling, saving the rest of the keystrokes.

**Quick phrases** — four one-tap messages in the right rail. Common things that shouldn't require spelling every time.

**Yes and No** — always visible, always reachable, speak instantly. No composing required.

**What do you need?** — a guided menu for the most common requests. Pick an action, pick a location, done. No spelling at all.

---

## Input modes

The app has three, switchable at any time. This matters: ALS is progressive and variable, and the right mode today may not be the right mode in six months.

**Direct** — tap a key, it types. Works with touch or a physical keyboard. This is where we start.

**Scanning** — a SWITCH button appears (or press spacebar on a keyboard). Press once to select a row; press again to select the key within it. The scan sweeps the prediction row, then each keyboard row in order. Good when pointing gets harder and a single reliable input is easier than precise targeting.

**Dwell** — hold a pointer over a key. A teal ring fills over 1.5 seconds, then selects — no tap, no click, just sustained attention. Good for eye-gaze or head-tracking hardware.

---

## Settings

Small controls in the right rail:

| | |
|---|---|
| 🌙 / ☀️ | Light theme or true dark — for different lighting, different times of day |
| A–Z / Freq | Alphabetical keyboard or frequency-ordered (E T A O I N S…) — the frequent layout puts the most-used letters closest |
| Larger / Smaller | Bigger keys with more spacing, or default density — for when targeting needs to be coarser |

Everything persists. The message in progress survives a reload — if the page closes mid-sentence, it comes back.

---

## Design

Built for calm, legibility, and long sessions. No animation except the dwell ring. No color that isn't earning its place.

- **Typeface:** Atkinson Hyperlegible — drawn by the Braille Institute for people with low vision. Serious, warm, and unmistakable at any size.
- **Light:** `#EEF1F5` background · `#161B22` ink · `#2E6BE6` accent
- **Dark:** `#0E1216` background · `#F1F4F7` ink · `#3D78EA` accent
- **Yes:** `#2F7A52` · **No:** `#B23B3B` · **Scanning:** `#D9870B` · **Dwell:** `#0E9384`
- Minimum tap target: 88 × 88 px. Every interactive surface defines focus, pressed, and disabled states.

---

## Files

```
index.html   — structure
app.css      — design tokens, layout, all visual states
app.js       — state, rendering, speech, scanning, dwell, predictions
```

---

## What comes next

- **Vocabulary** — the prediction list in `app.js` is a starting point. It'll grow to reflect the words and phrases that actually matter to him.
- **Quick phrases** — currently hardcoded. An editing interface is planned so the family can update them without touching code.
- **Dwell timing** — `DWELL_MS = 1500` in `app.js`. Adjustable as his needs change.
- **Two-switch scanning** — one switch to advance, one to select. A natural next step if a single reliable movement becomes easier than two taps on the same input.
