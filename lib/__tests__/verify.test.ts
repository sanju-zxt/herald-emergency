import { describe, it, expect } from "vitest";
import { verifyAndGate, corroborationBoost, clampConfidence } from "../verify";

const PRESENTS = {
  photo: false,
  voice: false,
  text: false,
  live: false,
};

describe("verifyAndGate", () => {
  it("adds corroboration bonus for multiple sources", () => {
    expect(corroborationBoost({ ...PRESENTS, photo: true, voice: true })).toBe(0.07);
    expect(corroborationBoost({ ...PRESENTS, photo: true })).toBe(0.02);
    expect(corroborationBoost({ ...PRESENTS })).toBe(0);
  });

  it("caps unverified confidence at 39%", () => {
    const result = verifyAndGate({ confidence: 0.85, severity: "HIGH", sources: [] }, PRESENTS);
    expect(result.confidence).toBeLessThanOrEqual(0.39);
    expect(result.passed).toBe(false);
  });

  it("holds CRITICAL severity without 85% confidence", () => {
    const result = verifyAndGate(
      { confidence: 0.8, severity: "CRITICAL", sources: [{ type: "photo", label: "x", cited: true }] },
      { ...PRESENTS, photo: true }
    );
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes("CRITICAL"))).toBe(true);
  });

  it("passes when evidence is corroborated and confidence is high", () => {
    const result = verifyAndGate(
      { confidence: 0.9, severity: "HIGH", sources: [{ type: "photo", label: "x", cited: true }] },
      { ...PRESENTS, photo: true, voice: true }
    );
    expect(result.passed).toBe(true);
  });

  it("flags low confidence below 40%", () => {
    const result = verifyAndGate(
      { confidence: 0.2, severity: "LOW", sources: [{ type: "text", label: "x", cited: true }] },
      { ...PRESENTS, text: true }
    );
    expect(result.confidence).toBeLessThan(0.4);
    expect(result.passed).toBe(false);
  });

  it("clamps out-of-range inputs", () => {
    expect(clampConfidence(1.5)).toBe(1);
    expect(clampConfidence(-0.5)).toBe(0);
    expect(clampConfidence(undefined)).toBe(0.5);
  });
});