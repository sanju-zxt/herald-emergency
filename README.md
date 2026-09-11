# HERALD — Emergency Intelligence Platform

> **The gap between what we know and what first responders do is measured in minutes. HERALD closes that gap in seconds.**

## What It Is

- **Problem:** In emergencies, critical details are buried in messy, unstructured inputs — photos, voice notes, text messages. First responders lose precious minutes piecing together what happened.
- **Bridge:** HERALD uses Google Gemini to extract structured, verified emergency actions from any input in seconds.
- **Intelligence layer:** Beyond a single translation, HERALD reveals **how everything connects** — an entity relationship graph, an incident timeline, and an AI co-pilot to interrogate any incident.

## ⭐ Standout Features

1. **🕸️ Entity Relationship Graph** — A force-directed graph (pure Canvas, zero dependencies) showing how incidents, people, locations, infrastructure, agencies, and vehicles are connected. Built from Gemini-extracted data in real time.
2. **📊 Incident Timeline** — The full incident lifecycle: detection → report → HERALD intake → dispatch → resolution.
3. **🤖 HERALD Co-Pilot** — Ask follow-up questions about any incident ("What's the biggest risk?", "Who should I contact first?"). Powered by Gemini, with quick-prompt chips.
4. **📈 Live Ops Dashboard** — Incident counters, critical severity tracking, average confidence, dispatched count, active agencies.
5. **🎭 Scenario Picker** — Four rich demo scenarios (flood, fire, pileup, gas leak) that run fully offline.
6. **🖥️ Ops View** — Fullscreen presentation mode for demonstrations.

## How It Works

1. **Intake** — Upload a photo, record a voice note, or type a message describing the emergency.
2. **Extraction** — Gemini analyzes the input and extracts a structured Action object with confidence scores, citations, an entity graph, and a timeline.
3. **Verify** — Each action is validated against a Zod schema and enriched with verification metadata and a safety gate.
4. **Human Review** — Approve, Edit, or Reject each action. You are always in the loop.
5. **Output** — Approved actions are read aloud via TTS and exported as JSON for downstream systems.

## Demo Mode

HERALD ships with a built-in demo mode. Set no API key and the app runs entirely offline with synthetic data. Paste a Gemini API key into `.env.local` to enable live analysis and co-pilot chat.

## Tech Stack

- **Next.js 15** (App Router, TypeScript strict)
- **@google/genai** — Gemini API client with model fallback chain
- **Zod** — Schema validation and type safety
- **Web Speech API** — Text-to-speech read-aloud
- **Custom Canvas** — Force-directed entity graph (zero dependencies)
- **Custom CSS** — Lightweight, accessible styling
- **Vitest** — Unit testing (33 tests)

## Security

- API keys are server-side only — never exposed to the client bundle
- File uploads enforced with size caps and MIME type validation
- Rate limiting on intake endpoints (in-memory sliding window)
- Content Security Policy (CSP) headers configured
- All inputs validated at boundaries via Zod schemas
- Output is sanitized before rendering
- Server-side request validation, no client trust

## Accessibility

- Full keyboard-only navigation
- `aria-live` regions for dynamic content
- Semantic roles and labels throughout
- Sufficient color contrast ratios (AA)
- `prefers-reduced-motion` support
- TTS read-aloud for action summaries

## Project Structure

```
app/
  page.tsx                  # Main UI (Action / Graph / Timeline / Co-Pilot views)
  api/intake/route.ts       # Intake API endpoint
  api/chat/route.ts         # Co-Pilot chat endpoint
lib/
  gemini.ts                 # Gemini API integration (fallback chain)
  schema.ts                 # Zod action schemas (+ graph, timeline)
  graph.ts                  # Force-directed graph engine (Canvas)
  verify.ts                 # Verification + safety gate logic
  demo.ts                   # Demo mode scenarios (4 rich scenarios)
  limits.ts                 # Rate limiting & size caps
  tts.ts                    # Text-to-speech wrapper
  store.ts                  # Client-side state
  __tests__/                # Vitest unit tests
components/
  CoPilotChat.tsx           # AI co-pilot chat interface
  StatsBar.tsx              # Ops dashboard metrics
```

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# (Optional) Enable live Gemini analysis
echo "GEMINI_API_KEY=your-key-here" > .env.local

# Type-check
npm run typecheck

# Run tests
npm run test

# Production build
npm run build
```

## Deploy to Cloud Run

**Prerequisites:** `gcloud` CLI installed with billing enabled. Enable Cloud Run and Artifact Registry APIs.

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build the container image
gcloud builds submit --pack image=gcr.io/YOUR_PROJECT_ID/herald .

# Deploy to Cloud Run
gcloud run deploy herald \
  --image gcr.io/YOUR_PROJECT_ID/herald \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 512Mi
```

## Hackathon: Techverse PromptWars

**Challenge:** *Build a Gemini-powered app that solves societal benefit by acting as a universal bridge between human intent and complex systems.*

HERALD directly answers this: unstructured real-world input (voice, traffic, weather, news, photos, messy medical history) → structured, verified, life-saving actions. The entity graph and co-pilot make it a genuine intelligence layer, not just a wrapper.