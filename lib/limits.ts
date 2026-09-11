export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_TEXT_CHARS = 4000;

const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/avif"]);
const ALLOWED_AUDIO_MIME = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"]);

export interface PortedFile {
  kind: "image" | "audio";
  mime: string;
  bytes: number;
}

export function classifyPort({ mime, bytes }: { mime: string; bytes: number }): PortedFile {
  const base = mime.split(";")[0].trim().toLowerCase();
  if (ALLOWED_IMAGE_MIME.has(base)) {
    if (bytes > MAX_IMAGE_BYTES) throw new Error("Image exceeds 5 MB limit.");
    return { kind: "image", mime: base, bytes };
  }
  if (ALLOWED_AUDIO_MIME.has(base)) {
    if (bytes > MAX_AUDIO_BYTES) throw new Error("Audio exceeds 10 MB limit.");
    return { kind: "audio", mime: base, bytes };
  }
  throw new Error("Unsupported file type. Upload an image (JPG/PNG/WebP) or audio recording.");
}

export interface RateBucket {
  count: number;
  resetAt: number;
}

/** Sliding-window rate limit per IP. Cheap in-memory store — fine for a single-instance demo deploy. */
const buckets = new Map<string, RateBucket>();
const WINDOW_MS = 60_000;
const MAX_CALLS = 20;

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  b.count += 1;
  if (b.count > MAX_CALLS) {
    return { allowed: false, retryAfterMs: b.resetAt - now };
  }
  return { allowed: true };
}