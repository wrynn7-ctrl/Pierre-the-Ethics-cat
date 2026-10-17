# Pierre the Ethical Cat — build spec

A joke web app. Pierre, a pompous French philosopher cat, answers ethical questions with semi-ridiculous advice. It is clearly labelled as not real and not actual ethical advice. Works in any modern browser (Chrome, Safari, Firefox, Edge; desktop and phone). No build step, no frameworks, no npm dependencies.

## File layout

```
public/
  index.html          page shell, disclaimer dialog, chat UI
  css/style.css
  js/jokes.js         offline joke engine  -> window.PierreJokes
  js/avatar.js        mouth / blink / bob animation -> window.PierreAvatar
  js/voice.js         speech synthesis + mute -> window.PierreVoice
  js/app.js           wires everything, chooses brain (jokes vs AI)
  img/pierre.jpg      900x1200 portrait (already in place, EXIF stripped)
server.js             zero-dependency Node 18+ server: static files + /api
pierre.config.json    {"mode": "jokes"}  <- the behind-the-scenes switch
.env.example          ANTHROPIC_API_KEY=, PIERRE_MODE=, PIERRE_MODEL=, PORT=
README.md
```

## The behind-the-scenes switch

- `pierre.config.json` → `{"mode": "jokes"}` or `{"mode": "ai"}`. Env var `PIERRE_MODE` overrides it. The server re-reads the file on every `/api/config` request so it can be flipped without restart.
- If mode is `ai` but `ANTHROPIC_API_KEY` is missing, server reports `jokes`.
- Visitors never see or control the switch.
- If the site is hosted statically (no server, e.g. GitHub Pages), `/api/config` fails and the app silently uses jokes mode.

## API contract (server.js)

- `GET /api/config` → `200 {"mode":"jokes"|"ai"}`
- `POST /api/ask` body `{"question": string, "history": [{"role":"user"|"assistant","content":string}]}`
  - question trimmed, 1–500 chars, else 400 `{"error": "..."}`. History: keep last 10 items, each content ≤ 1000 chars, roles validated.
  - In jokes mode → 409 `{"error":"ai disabled"}`.
  - In ai mode → calls Anthropic Messages API (`https://api.anthropic.com/v1/messages`, headers `x-api-key`, `anthropic-version: 2023-06-01`, `content-type: application/json`) with model `PIERRE_MODEL` (default `claude-haiku-5-5`), `max_tokens` 350, the system prompt below, and history + question. Returns `200 {"answer": string}`. On upstream error → 502 `{"error":"..."}` (never leak the key or raw upstream body).
  - Body size limit 16 KB. Simple per-IP rate limit: 20 requests / minute → 429.
- Static: serve `public/` with correct content types, `index.html` at `/`, block path traversal, 404 otherwise. `PORT` env, default 3000. Loads `.env` file if present (simple KEY=VALUE parser, no dependency). Never serve `.env`, config, or server files.

## AI system prompt (server.js)

Pierre: a pompous French philosopher cat. Answers any ethical question in 2–4 short sentences, confidently and absurdly, through a cat's priorities (naps, tuna, sunbeams, knocking things off tables, disdain for dogs, the red dot, 3 a.m. zoomies). Cites made-up thinkers who are mostly cats (e.g. "Immanuel Cant", "Jean-Paw Sartre", "Socatz", "Meowchiavelli", "Simone de Beauvoir's cat"). Sprinkles light French ("mon ami", "bof", "zut alors", "non non non"). Plain text, no markdown, no emojis. Never gives genuinely harmful instructions. Keeps it playful for everyone. Safety: if the user seems to be in real distress, mentions self-harm, suicide, abuse, or a medical/legal emergency, Pierre drops the act for that reply and kindly says he is just a cat in a joke app and they should reach a real person — in the US call or text 988, or local emergency services — then may offer a gentle, warm line. Never claims to be a real advisor.

## Joke engine (public/js/jokes.js)

`window.PierreJokes = { greeting(): string, answer(question: string): string }` — synchronous, pure, no network.

- Detect topic by keywords (at least ~12 topics: lying/honesty, stealing/money, food/eating/diet, work/job/boss, relationships/dating/love/partner, friends, family/parents/kids, pets/dogs, environment/recycling, technology/phones/AI, sleep/laziness, cheating/games, revenge/anger, gifts/birthdays, neighbors/noise, plus a generic fallback).
- Build each answer from parts: opening ("Ah, mon ami…"), topic-specific verdict, a fake cat-philosopher citation, and a sign-off ("Now leave me, I must nap."). Varied lengths, 2–4 sentences. Large pools so repeats are rare; avoid repeating the same verdict twice in a row.
- Yes/no questions ("should I", "is it ok", "can I") get a decisive absurd ruling sometimes.
- Safety: if the question contains crisis words (suicide, kill myself, self harm, hurt myself, abuse, overdose, emergency, etc.), return a kind, out-of-character message instead: Pierre is only a joke cat, please talk to a real person — in the US call or text 988, or contact local emergency services. No jokes in that reply.
- Empty / gibberish input gets a snooty "Speak clearly, human."-style line.

## Page (index.html + style.css + app.js)

- On every page load, a modal dialog (accessible `<dialog>` or role="dialog", focus trapped, Escape does not dismiss) says roughly: "Pierre is a cat. This is a joke app for entertainment only. Pierre is not real and nothing here is actual ethical, legal, medical, financial, or life advice. If you need real help, talk to a real person." Button: "I understand, let me ask the cat". The chat is inert until accepted.
- Small persistent footer: "Entertainment only. Not real advice. Pierre is a cat."
- Layout: Pierre's portrait (stage) on top on phones, left on wide screens; chat on the other side. Title "Pierre the Ethical Cat", subtitle like "Philosophe. Gourmand. Cat."
- Chat: message list (user bubbles right, Pierre left), text input (maxlength 500) + "Ask Pierre" button, Enter sends. Pierre's greeting appears after the disclaimer is accepted. While waiting: "Pierre is pondering…" with a little animation. Input disabled while Pierre answers. Pierre's text types out letter by letter while he talks.
- Mute toggle button with accessible label and pressed state; preference saved in localStorage inside try/catch.
- Warm, slightly fancy look (Parisian café: cream, deep burgundy, serif headings from Google Fonts e.g. "Playfair Display" + system body font). Respect `prefers-reduced-motion` (no bob; mouth can still open/close). Works at 360px width without horizontal scroll. Accessible labels on all controls, 44px touch targets, aria-live on the message list.
- Brain choice (app.js): on load `fetch('/api/config')`; mode `ai` → POST `/api/ask` with question + history; any failure → fall back to `PierreJokes.answer`. Mode `jokes` or fetch failure → `PierreJokes.answer` after a short fake "pondering" delay (700–1400 ms).

## Avatar (avatar.js)

`window.PierreAvatar = { init(stageEl), startTalking(), stopTalking(), setMouth(openness 0..1), blink() }`

- Stage: container with `aspect-ratio: 3/4`, image fills it exactly (900x1200 image), so overlay positions in % line up. Overlays are absolutely positioned SVG/divs using these measured points (percent of image width/height):
  - Mouth center: x 58.0%, y 46.1%. Mouth closed width ≈ 5.5% of image width. Open mouth: dark maroon (#3a1418) rounded shape with a pink tongue (#e88a9a), grows downward up to ~4.5% of image height; at openness 0 it is invisible (photo's real mouth shows).
  - Left eye center: x 48.9%, y 36.3%; right eye: x 64.2%, y 35.7%; each ≈ 5.5% wide × 3% tall. Blink = eyelid shapes in fur color (~#c9c4c9, slight gradient) that close then reopen in ~150 ms. Random blink every 2.5–6 s.
- Talking: mouth openness driven by voice word-boundary events when available plus a randomized flap loop (~8–12 Hz with variation) so it looks like speech; slight head bob/tilt (a few px / 1–2°) on the stage while talking; gentle idle "breathing" scale when not. Stop cleanly.

## Voice (voice.js)

`window.PierreVoice = { supported, isMuted(), setMuted(bool), speak(text, {onstart, onboundary, onend}) , cancel() }`

- Uses `speechSynthesis`. Prefer a French voice (lang starts with "fr") reading the English text for a comedic accent; fall back to any English voice; rate ~0.95, pitch ~1.15. Handle voices loading async (`voiceschanged`). Chrome bug: long utterances can stall — keep it robust (cancel before speak; resume workaround).
- If muted or unsupported: speak() calls onstart, then calls onend after a duration estimated from text length (~70 ms per character, capped) so the mouth still animates in sync with the typewriter text.
- Mute button cancels speech immediately.

## Done means

- `node server.js` serves the app; opening it in a browser shows the disclaimer, then chat works in jokes mode with no API key.
- Flipping `pierre.config.json` to `ai` with a key set switches to Claude without restart.
- Opening `public/index.html` from any static host still works (jokes mode).
- No console errors. README explains running, the switch, hosting options.
