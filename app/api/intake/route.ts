import { NextRequest, NextResponse } from "next/server";
import { demoAction, demoActionVariant, getAllScenarios } from "@/lib/demo";
import { infer } from "@/lib/gemini";
import { MAX_TEXT_CHARS, checkRateLimit, classifyPort } from "@/lib/limits";
import { parseActionSafe } from "@/lib/schema";
import { verifyAndGate } from "@/lib/verify";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  return NextResponse.json({ scenarios: getAllScenarios() });
}

interface InputBundle {
  text?: string;
  image?: { mime: string; b64: string };
  audio?: { mime: string; b64: string };
  sources: { photo: boolean; voice: boolean; text: boolean; live: boolean };
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again shortly.", retryAfterMs: rl.retryAfterMs },
        { status: 429 }
      );
    }

    const url = new URL(req.url);
    const forceDemo = url.searchParams.get("demo") === "1";
    const form = await req.formData().catch(() => null);

    const bundle: InputBundle = { sources: { photo: false, voice: false, text: false, live: false } };

    if (form) {
      const textField = form.get("text");
      if (typeof textField === "string" && textField.trim()) {
        if (textField.length > MAX_TEXT_CHARS) {
          return NextResponse.json({ error: "Text input exceeds 4000 characters." }, { status: 413 });
        }
        bundle.text = textField.trim().slice(0, MAX_TEXT_CHARS);
        bundle.sources.text = true;
      }

      const rawFiles = form.getAll("files");
      for (const f of rawFiles) {
        if (!(f instanceof File)) continue;
        const { kind } = classifyPort({ mime: f.type, bytes: f.size });
        const b64 = Buffer.from(await f.arrayBuffer()).toString("base64");
        if (kind === "image") {
          bundle.image = { mime: f.type.split(";")[0], b64 };
          bundle.sources.photo = true;
        } else {
          bundle.audio = { mime: f.type.split(";")[0], b64 };
          bundle.sources.voice = true;
        }
      }
    }

    const hasInputs = bundle.text || bundle.image || bundle.audio;
    if (!hasInputs && !forceDemo) {
      return NextResponse.json({ error: "Attach a photo, a voice note, or some text — the bridge needs something to cross." }, { status: 400 });
    }

    let parsed;
    let mode: "gemini" | "demo" = "gemini";

    if (!forceDemo && process.env.GEMINI_API_KEY) {
      try {
        const raw = await infer({
          text: bundle.text,
          image: bundle.image,
          audio: bundle.audio,
        });
        parsed = parseActionSafe(raw);
        if (!parsed.ok) {
          return NextResponse.json({ error: `Model output failed validation: ${parsed.error}` }, { status: 422 });
        }
      } catch (err) {
        // Fall back to demo on pipeline failure so the live link never hard-fails.
        const msg = err instanceof Error ? err.message : "inference failed";
        console.error("[herald] inference failed, falling back to demo:", msg);
        return NextResponse.json(
          {
            error: "Live analysis unavailable (demo output used).",
            mode: "demo",
            detail: msg,
          },
          { status: 200 }
        );
      }
    } else {
      const scenarioId = url.searchParams.get("scenario");
      const scenarioIdx = scenarioId ? parseInt(scenarioId, 10) : (forceDemo ? 1 : 0);
      parsed = { ok: true as const, value: forceDemo ? demoActionVariant(scenarioIdx) : demoAction(scenarioIdx) };
      mode = "demo";
    }

    const present = bundle.sources;
    const gate = verifyAndGate(parsed.value, present);
    const finalAction = {
      ...parsed.value,
      id: `H-${Math.floor(1000 + Math.random() * 9000)}`,
      confidence: gate.confidence,
      safetyGate: {
        passed: gate.passed,
        reasons: gate.reasons,
      },
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ mode, action: finalAction }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected server error.";
    console.error("[herald] route error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}