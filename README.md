# HERALD — Emergency Intelligence Platform

> **The gap between what we know and what first responders do is measured in minutes. HERALD closes that gap in seconds.**

## What It Is

- **Problem:** In emergencies, critical details are buried in messy, unstructured inputs — photos, voice notes, text messages. First responders lose precious minutes piecing together what happened.
- **Bridge:** HERALD uses Google Gemini to extract structured, verified emergency actions from any input in seconds.
- **Intelligence layer:** Beyond a single translation, HERALD reveals **how everything connects** — an entity relationship graph, an incident timeline, a location map, and an AI co-pilot to interrogate any incident.

## ⭐ Standout Features

1. **🔴 Live Incident Feed** — An auto-cycling operations feed of simulated incidents arriving across the network the moment you land, with severity-coded bars and slide-in animation. HERALD *feels* alive.
2. **🕸️ Entity Relationship Graph** — A force-directed graph (pure Canvas, zero dependencies) showing how incidents, people, locations, infrastructure, agencies, and vehicles are connected — built by Gemini in real time.
3. **🗺️ Google Maps View** — The incident location, as extracted by Gemini, rendered on a keyless Google Maps embed. Location + context in one glance.
4. **📊 Incident Timeline** — The full incident lifecycle: detection → report → HERALD intake → dispatch → resolution.
5. **🤖 HERALD Co-Pilot** — Ask follow-up questions about any incident ("What's the biggest risk?", "Who should I contact first?"). Powered by Gemini, with quick-prompt chips.
6. **⚙️ Animated "How It Works" Pipeline** — A lit-up 5-stage pipeline (Messy Input → Gemini Extraction → Schema Validation → Safety Gate → Verified Action) that plays itself on repeat.
7. **▶️ Auto-run Demo** — 750 ms after you land, HERALD starts analyzing a real flood incident by itself — no clicks required.
8. **📈 Live Ops Dashboard** — Incident counters, critical severity tracking, average confidence, dispatched count, active agencies.
9. **🎭 Scenario Picker** — Four rich demo scenarios (flood, fire, pileup, gas leak) that run fully offline.

## How It Works

1. **Intake** — Upload a photo, record a voice note, or type a message describing the emergency.
2. **Extraction** — Gemini analyzes the input and extracts a structured Action object with confidence scores, citations, an entity graph, a timeline, and a location.
3. **Verify** — Each action is validated against a Zod schema and enriched with verification metadata and a safety gate (cross-source corroboration boosts trust; high-severity low-confidence actions are held for human review).
4. **Human Review** — Approve, Edit, or Reject each action. You are always in the loop.
5. **Output** — Approved actions are read aloud via TTS, shown on a live map, and exported as JSON for downstream systems.

## Demo Mode

HERALD ships with a built-in demo mode. Set no API key and the app runs entirely offline with synthetic data. Paste a Gemini API key into `.env.local` to enable live analysis and co-pilot chat.

## Tech Stack

- **Next.js 15** (App Router, TypeScript strict)
- **@google/genai** — Gemini API client with model fallback chain
- **Google Maps** — keyless embed for incident location
- **Zod** — Schema validation and type safety
- **Custom Canvas engine** — Force-directed entity graph (zero dependencies, hover-stable simulation)
- **Web Speech API** — Text-to-speech read-aloud
- **Custom CSS** — Lightweight, accessible styling
- **Vitest** — Unit testing (51 tests)

## Security

- API keys are server-side only — never exposed to the client bundle
- **CSP** with `base-uri`, `frame-ancestors 'none'`, restricted `frame-src` (only Google Maps)
- **HSTS**, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Referrer-Policy`
- **Permissions-Policy** — mic self-only, no camera/geolocation
- File uploads enforced with size caps and MIME type validation
- Rate limiting on intake endpoints (in-memory sliding window)
- All inputs validated at boundaries via Zod schemas
- Crash-proof demo fallback — no route can 500 on bad input
- Server-side request validation, no client trust

## Accessibility

- Full keyboard-only navigation
- `aria-live` regions for dynamic content
- **Tab semantics** (`role="tablist"` / `aria-selected`), `aria-pressed` on scenario cards
- **Screen-reader alternative for the graph** — role + aria-label + visual text list of relationships
- Semantic roles and labels throughout
- Sufficient color contrast ratios (AA)
- `prefers-reduced-motion` support
- TTS read-aloud for action summaries

## Project Structure

```
app/
  page.tsx                  # Main UI (Action / Graph / Timeline / Map / Co-Pilot views)
  api/intake/route.ts       # Intake API endpoint
  api/chat/route.ts         # Co-Pilot chat endpoint
components/
  LiveTicker.tsx            # Live incident feed
  HowItWorks.tsx            # Animated pipeline
  CoPilotChat.tsx           # AI co-pilot chat interface
  StatsBar.tsx              # Ops dashboard metrics
lib/
  gemini.ts                 # Gemini API integration (fallback chain + JSON parsing)
  schema.ts                 # Zod action schemas (+ graph, timeline)
  graph.ts                  # Force-directed graph engine (simulate once, cheap hover redraw)
  verify.ts                 # Verification + safety gate logic
  demo.ts                   # Demo mode scenarios (4 rich scenarios)
  limits.ts                 # Rate limiting & size caps
  tts.ts                    # Text-to-speech wrapper
  store.ts                  # Client-side state
  __tests__/                # Vitest unit tests (51)
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npm run typecheck

# Run tests
npm run test

# Production build
npm run build
```
## Deploy (Vercel)

**Recommended — import the GitHub repo** (auto-deploys on every push):

1. Push this repo to GitHub.
2. In the Vercel dashboard: **Add New → Project → Import Git Repository** → pick `herald-emergency`.
3. Framework preset auto-detects **Next.js**. Deploy.

**Or deploy from CLI:**
```bash
vercel login
vercel deploy --prod --yes
```

## Deploy (Cloud Run) — alternative

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud builds submit --pack image=gcr.io/YOUR_PROJECT_ID/herald .
gcloud run deploy herald \
  --image gcr.io/YOUR_PROJECT_ID/herald \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi
```

## Hackathon: Techverse PromptWars

**Challenge:** *Build a Gemini-powered app that solves societal benefit by acting as a universal bridge between human intent and complex systems.*

HERALD directly answers this: unstructured real-world input (voice, traffic, weather, news, photos, messy medical history) → structured, verified, life-saving actions. The live feed, entity graph, timeline, Google Maps view, and co-pilot make it a genuine intelligence layer — not just a wrapper.
