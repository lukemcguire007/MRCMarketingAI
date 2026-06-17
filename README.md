# Mosaic Content Crew

An AI marketing content generator for **Mosaic Roofing Company LLC** (Dallas–Fort Worth).
Six "crew members" (blog, social, Google Business Profile, email, ads, canvassing) each
write on-brand copy via Claude. Your Anthropic API key stays **on the server** — never in
the browser.

## How it's wired

```
Browser (React)  ──POST /api/generate──▶  Serverless function  ──▶  api.anthropic.com
   src/App.jsx                               api/generate.js          (key injected here)
```

The frontend never sees your key. It only calls your own `/api/generate` endpoint.

## Files

| Path                 | What it is                                                        |
|----------------------|------------------------------------------------------------------|
| `src/App.jsx`        | The whole UI + crew definitions + prompt building                |
| `src/main.jsx`       | React entry point                                                 |
| `index.html`         | HTML shell                                                        |
| `api/generate.js`    | Serverless proxy (Vercel/Netlify). Holds the key, calls Claude.  |
| `server.js`          | Optional all-in-one Node server (no Vercel needed)               |
| `vite.config.js`     | Vite + React build config                                         |
| `vercel.json`        | Vercel build settings                                             |
| `.env.example`       | Template for your key (copy to `.env` for local dev)             |

## Quick start (local)

```bash
npm install
cp .env.example .env        # then paste your real key into .env
npm run dev                 # frontend on http://localhost:5173
```

For local dev the frontend calls `/api/generate`. Run it one of two ways:

**Option A — Vercel CLI (recommended, runs the serverless fn locally):**
```bash
npm i -g vercel
vercel dev                  # serves both the app AND /api/generate
```

**Option B — the bundled all-in-one server:**
```bash
npm run build
ANTHROPIC_API_KEY=sk-ant-... node server.js   # http://localhost:3000
```

## Deploy

### Vercel (easiest)
1. Push this folder to a GitHub repo.
2. Import it in Vercel.
3. In **Settings → Environment Variables**, add `ANTHROPIC_API_KEY`.
4. Deploy. `api/generate.js` becomes `https://your-app.vercel.app/api/generate` automatically.

### Netlify
1. Move `api/generate.js` to `netlify/functions/generate.js` and change the last line from
   `export default async function handler(req, res)` to Netlify's
   `export async function handler(event)` signature (parse `event.body`, return
   `{ statusCode, body }`). 
2. Set `ANTHROPIC_API_KEY` in Site settings → Environment variables.
3. Point the frontend at it by setting `VITE_API_URL=/.netlify/functions/generate`.

### Any Node host (Render, Railway, a VPS)
```bash
npm run build
ANTHROPIC_API_KEY=sk-ant-... PORT=3000 node server.js
```

## Connecting it to an existing web app

You have two clean options:

1. **Embed the built widget.** Run `npm run build` and drop the contents of `dist/`
   into your site. It mounts on any `<div id="root"></div>`. You still need the
   `/api/generate` endpoint reachable (same origin, or set `VITE_API_URL` to its full URL
   before building).

2. **Reuse just the backend.** If you already have a frontend, copy `api/generate.js`
   into your stack and POST it `{ system, message, max_tokens }`. It returns `{ text }`.

## Customizing

- **Brand voice / company facts:** edit `BRAND_BASE` near the top of `src/App.jsx`.
- **Crew members, fields, output formats:** edit the `CREW` array in `src/App.jsx`.
- **Standing instructions at runtime:** use the in-app "Crew briefing" drawer (top right) —
  no code change needed.
- **Model or token caps:** `api/generate.js` (and `server.js`) — currently
  `claude-sonnet-4-6`, max_tokens clamped to 256–8000.

## Security notes

- The key is read from `process.env.ANTHROPIC_API_KEY` server-side only. Don't commit `.env`.
- `api/generate.js` currently allows CORS from `*` for convenience. For production,
  lock `Access-Control-Allow-Origin` to your domain.
- Consider adding rate limiting / a simple shared secret if the endpoint is public, so
  others can't run up your API bill.
