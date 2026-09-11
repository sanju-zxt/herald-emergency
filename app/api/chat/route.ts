import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const maxDuration = 30;

let _client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

const COPILOT_SYSTEM = `You are HERALD Co-Pilot, an emergency intelligence assistant embedded in the HERALD platform.
You help operators understand, contextualize, and act on emergency incidents.

You have access to the current incident's structured data. Answer questions about it concisely.
Be professional, terse, and action-oriented — like a real emergency dispatcher.
Never invent facts not in the incident data. If uncertain, say so.
Keep responses under 3 sentences unless the user asks for detail.
You can suggest additional actions, clarify risks, or explain entity relationships.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.message || typeof body.message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const message = body.message.trim().slice(0, 2000);
    const incidentContext = body.incident ? JSON.stringify(body.incident, null, 0) : "No incident data available.";

    // Demo mode fallback
    if (!process.env.GEMINI_API_KEY) {
      const demoResponses: Record<string, string> = {
        default: "Based on the incident data, I recommend prioritizing immediate safety measures. The entities involved suggest a coordinated response across multiple agencies.",
      };
      const key = Object.keys(demoResponses).find((k) => message.toLowerCase().includes(k)) ?? "default";
      return NextResponse.json({ reply: demoResponses[key] });
    }

    const genai = getClient();
    const res = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [
          { text: COPILOT_SYSTEM },
          { text: `Current incident context: ${incidentContext}` },
          { text: `Operator question: ${message}` },
        ]},
      ],
      config: { temperature: 0.3, maxOutputTokens: 300 },
    });

    const reply = (res.text ?? "").trim() || "I couldn't analyze that. Please rephrase.";
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat failed.";
    console.error("[herald] chat error:", msg);
    return NextResponse.json({ reply: "Co-pilot unavailable in demo mode. The incident data is still valid for review." });
  }
}
