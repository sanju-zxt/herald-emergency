import { describe, expect, it } from "vitest";
import { corroborationBoost, verifyAndGate } from "./verify";
import { ActionSchema, parseActionSafe } from "./schema";

describe("corroborationBoost", () => {
  it("rewards multiple independent channels", () => {
    expect(corroborationBoost({ photo: true, voice: true, text: true, live: true })).toBe(0.12);
    expect(corroborationBoost({ photo: true, voice: true, text: false, live: false })).toBe(0.07);
    expect(corroborationBoost({ photo: true, voice: false, text: false, live: false })).toBe(0.02);
    expect(corroborationBoost({ photo: false, voice: false, text: false, live: false })).toBe(0);
  });
});

describe("verifyAndGate", () => {
  it("holds a low-confidence CRITICAL action for human review", () => {
    const r = verifyAndGate(
      { confidence: 0.4, severity: "CRITICAL", sources: [{ type: "text", label: "t", cited: true }] },
      { photo: false, voice: false, text: true, live: false }
    );
    expect(r.passed).toBe(false);
    expect(r.confidence).toBeGreaterThanOrEqual(0.4);
    expect(r.reasons.join(" ")).toMatch(/human review/i);
  });

  it("passes a well-corroborated HIGH action", () => {
    const r = verifyAndGate(
      { confidence: 0.8, severity: "HIGH", sources: [{ type: "photo", label: "p", cited: true }] },
      { photo: true, voice: true, text: false, live: false }
    );
    expect(r.passed).toBe(true);
    expect(r.confidence).toBe(0.87);
  });

  it("blocks garbage confidence", () => {
    const r = verifyAndGate({ sources: [] }, { photo: false, voice: false, text: false, live: false });
    expect(r.passed).toBe(false);
    expect(r.confidence).toBeLessThan(0.4);
  });
});

describe("ActionSchema", () => {
  it("accepts a valid action", () => {
    const r = parseActionSafe({
      schemaVersion: "1.0",
      id: "H-9999",
      domain: "EMERGENCY",
      scenario: "test",
      summary: "s",
      severity: "HIGH",
      status: "DRAFT",
      confidence: 0.8,
      entities: [],
      location: {},
      sources: [{ type: "text", label: "l", cited: true }],
      briefing: "b",
      recommendedActions: [],
      safetyGate: { passed: true, reasons: [] },
      createdAt: "2026-09-11T00:00:00Z",
    });
    expect(r.ok).toBe(true);
  });

  it("rejects a malformed action", () => {
    const r = parseActionSafe({ scenario: "missing fields" });
    expect(r.ok).toBe(false);
  });

  it("rejects invalid severity values", () => {
    const raw = {
      schemaVersion: "1.0",
      id: "H-1",
      domain: "EMERGENCY",
      severity: "PANIC",
    };
    expect(() => ActionSchema.parse(raw)).toThrow();
  });
});