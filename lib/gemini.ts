import { GoogleGenAI, type Content } from "@google/genai";

let _client: GoogleGenAI | null = null;

function client(): GoogleGenAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set.");
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

export const MAIN_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite-preview",
] as const;

export interface InferenceInput {
  text?: string;
  image?: { mime: string; b64: string };
  audio?: { mime: string; b64: string };
  domainHint?: string;
}

const SYSTEM_BLOCK = `You are HERALD, an emergency-intelligence extraction engine.
You convert messy, unstructured real-world inputs (photo, voice transcript, free text) into a
single strict JSON object that a first responder can act on. If audio or image is present, analyze it.
You must respond with ONLY valid JSON matching this shape (no markdown, no commentary):

{
  "schemaVersion": "1.0",
  "id": "",
  "domain": "EMERGENCY",
  "scenario": "short title of the situation, <=8 words",
  "summary": "2-3 sentence plain-language assessment of what is happening",
  "severity": "LOW|MEDIUM|HIGH|CRITICAL|UNKNOWN",
  "confidence": 0.0,
  "entities": [{"type":"person|place|vehicle|infrastructure|weather|condition","name":"...","value":"optional","confidence":0.0}],
  "location": {"label":"best-effort human label, e.g. 'River Rd, ~2km N of central market'","lat":0,"lng":0,"source":"photo|voice|text|estimate"},
  "sources": [{"type":"photo|voice|text","label":"e.g. 'Uploaded photo — flooded roadway'","detail":"short note on what it shows","cited":true}],
  "briefing": "a 4-6 sentence dispatcher-ready briefing written for a professional operator. No fluff. State facts, location, hazard, who may be affected, and immediate risk. Flag any uncertainty explicitly.",
  "recommendedActions": [{"title":"imperative action, e.g. 'Dispatch crew with sandbags','Verify pump status','Alert traffic ops'","target":"who a dispatch should go to, e.g. 'City Roads Dept'","priority":"IMMEDIATE|SOON|ROUTINE"}],
  "graphData": {
    "nodes": [{"id":"unique-id","label":"short name","type":"incident|person|location|infrastructure|agency|vehicle|condition"}],
    "edges": [{"source":"node-id","target":"node-id","label":"relationship"}]
  },
  "timeline": [{"time":"ISO timestamp or 'Now'","label":"event title","detail":"optional detail","status":"pending|active|done"}]
}

Rules:
- "id" must be "" — the system assigns the final ID.
- Never invent facts you cannot support from the inputs. Where uncertain, say so in the briefing and lower "confidence".
- "confidence" is your honest 0-1 estimate that the core claim is true.
- Be terse and professional. This output feeds a human operator's approval screen.
- graphData must have at least 3 nodes and 2 edges connecting entities. The incident itself should be a node.
- timeline should have 3-5 entries showing the incident lifecycle from detection to resolution.`;

export function buildParts(input: InferenceInput): Content[] {
  const parts: Content["parts"] = [{ text: SYSTEM_BLOCK }];
  if (input.image) {
    parts.push({ inlineData: { mimeType: input.image.mime, data: input.image.b64 } });
  }
  if (input.audio) {
    parts.push({
      inlineData: { mimeType: input.audio.mime, data: input.audio.b64 },
      text: input.audio ? undefined : undefined,
    });
    parts.push({ text: "The audio above is a voice report. Transcribe it mentally and treat its contents as a primary source." });
  }
  if (input.text) {
    parts.push({ text: input.text });
  }
  parts.push({
    text: 'Produce the strict JSON action object for the input above. Ensure "sources" lists exactly the channels you actually used, and "safetyGate" is NOT part of your output.',
  });
  return [{ role: "user", parts }];
}

function stripJsonFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fenced) return fenced[1].trim();
  const braceStart = trimmed.indexOf("{");
  if (braceStart > 0) return trimmed.slice(braceStart);
  return trimmed;
}

function tryParse(raw: string): unknown {
  const clean = stripJsonFences(raw);
  try {
    return JSON.parse(clean);
  } catch {
    // last resort: grab the first balanced object
    const start = clean.indexOf("{");
    if (start === -1) throw new Error("Model did not return JSON.");
    let depth = 0;
    for (let i = start; i < clean.length; i++) {
      if (clean[i] === "{") depth += 1;
      else if (clean[i] === "}") {
        depth -= 1;
        if (depth === 0) return JSON.parse(clean.slice(start, i + 1));
      }
    }
    throw new Error("Could not parse model JSON response.");
  }
}

/** Run inference with an automatic model fallback chain and a retry that drops audio if it chokes. */
export async function infer(input: InferenceInput): Promise<unknown> {
  const genai = client();
  const models = MAIN_MODELS;

  const callModel = async (model: string) => {
    const res = await genai.models.generateContent({
      model,
      contents: buildParts(input),
      config: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 2048 },
    });
    const text = res.text;
    if (!text) throw new Error(`${model} returned an empty response.`);
    return tryParse(text);
  };

  const callModels = async (withAudio: boolean): Promise<unknown> => {
    const localInput = withAudio ? input : { ...input, audio: undefined };
    let lastErr: unknown = new Error("no model usable");
    for (const m of models) {
      try {
        return await callModel(m);
      } catch (e) {
        lastErr = e;
        // don't sink time retrying every model if the key is bad
        if (e instanceof Error && /api.?key|invalid/i.test(e.message)) throw e;
      }
    }
    throw lastErr instanceof Error ? new Error(`All Gemini models failed. Last: ${lastErr.message}`) : lastErr;
  };

  // Primary path: single multimodal call with everything inline (fastest — "instant").
  // If it fails, retry once with audio dropped so a webm codec rejection can't sink the demo.
  try {
    return await callModels(true);
  } catch (e) {
    if (input.audio && !input.image) {
      const withoutAudio = await callModels(false);
      return withoutAudio;
    }
    throw e;
  }
}

export async function transcribeAudio(audio: { mime: string; b64: string }): Promise<string> {
  const genai = client();
  const res = await genai.models.generateContent({
    model: "gemini-3.5-transcribe",
    contents: [{ role: "user", parts: [{ inlineData: { mimeType: audio.mime, data: audio.b64 }, text: undefined }] }],
  });
  return (res.text ?? "").trim();
}