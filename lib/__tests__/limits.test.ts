import { describe, it, expect } from "vitest";
import { classifyPort, checkRateLimit, MAX_IMAGE_BYTES, MAX_AUDIO_BYTES, MAX_TEXT_CHARS } from "../limits";

describe("classifyPort", () => {
  it("accepts valid images", () => {
    expect(classifyPort({ mime: "image/jpeg", bytes: 1024 }).kind).toBe("image");
    expect(classifyPort({ mime: "image/png", bytes: 1024 }).kind).toBe("image");
    expect(classifyPort({ mime: "image/webp", bytes: 1024 }).kind).toBe("image");
  });

  it("accepts valid audio", () => {
    expect(classifyPort({ mime: "audio/webm", bytes: 1024 }).kind).toBe("audio");
    expect(classifyPort({ mime: "audio/mpeg", bytes: 1024 }).kind).toBe("audio");
    expect(classifyPort({ mime: "audio/wav", bytes: 1024 }).kind).toBe("audio");
  });

  it("rejects oversized images", () => {
    expect(() => classifyPort({ mime: "image/jpeg", bytes: MAX_IMAGE_BYTES + 1 })).toThrow(/5 MB/);
  });

  it("rejects oversized audio", () => {
    expect(() => classifyPort({ mime: "audio/webm", bytes: MAX_AUDIO_BYTES + 1 })).toThrow(/10 MB/);
  });

  it("rejects unsupported file types", () => {
    expect(() => classifyPort({ mime: "text/plain", bytes: 10 })).toThrow(/Unsupported/);
    expect(() => classifyPort({ mime: "application/pdf", bytes: 10 })).toThrow(/Unsupported/);
  });

  it("normalizes mime type with parameters", () => {
    const result = classifyPort({ mime: "image/jpeg; charset=binary", bytes: 10 });
    expect(result.mime).toBe("image/jpeg");
  });
});

describe("checkRateLimit", () => {
  it("allows first request", () => {
    expect(checkRateLimit("test-ip-1").allowed).toBe(true);
  });

  it("blocks excessive requests within window", () => {
    const ip = "test-ip-2";
    for (let i = 0; i < 20; i++) {
      expect(checkRateLimit(ip).allowed).toBe(true);
    }
    const result = checkRateLimit(ip);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeTypeOf("number");
  });

  it("treats different IPs independently", () => {
    const a = "test-ip-a";
    const b = "test-ip-b";
    for (let i = 0; i < 25; i++) checkRateLimit(a);
    expect(checkRateLimit(b).allowed).toBe(true);
  });
});

describe("constants", () => {
  it("exposes sane limits", () => {
    expect(MAX_TEXT_CHARS).toBe(4000);
    expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_AUDIO_BYTES).toBe(10 * 1024 * 1024);
  });
});