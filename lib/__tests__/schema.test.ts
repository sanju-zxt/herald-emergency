import { describe, it, expect } from "vitest";
import { parseAction, parseActionSafe, ActionSchema } from "../schema";

describe("ActionSchema", () => {
  const validAction = {
    schemaVersion: "1.0",
    id: "H-1042",
    domain: "EMERGENCY",
    scenario: "Street flooding",
    summary: "Water rising on River Rd",
    severity: "CRITICAL",
    status: "DRAFT",
    confidence: 0.89,
    entities: [],
    location: { label: "River Rd" },
    sources: [{ type: "photo" as const, label: "Photo", cited: true }],
    briefing: "Residential block flooding.",
    recommendedActions: [],
    safetyGate: { passed: true, reasons: [] },
    graphData: { nodes: [], edges: [] },
    timeline: [],
    createdAt: new Date().toISOString(),
  };

  it("accepts a valid action", () => {
    const result = ActionSchema.safeParse(validAction);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const incomplete = { schemaVersion: "1.0", id: "H-1042" };
    const result = ActionSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity", () => {
    const bad = { ...validAction, severity: "EXTREME" };
    const result = ActionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects invalid domain", () => {
    const bad = { ...validAction, domain: "MILITARY" };
    const result = ActionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects confidence out of range", () => {
    const bad = { ...validAction, confidence: 1.5 };
    const result = ActionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("defaults missing optional fields", () => {
    const minimal = {
      schemaVersion: "1.0" as const,
      id: "H-9999",
      scenario: "Test",
      summary: "Test summary",
      confidence: 0.5,
      sources: [{ type: "text" as const, label: "Test", cited: false }],
      briefing: "Test briefing",
      createdAt: new Date().toISOString(),
    };
    const result = ActionSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.severity).toBe("UNKNOWN");
      expect(result.data.status).toBe("DRAFT");
      expect(result.data.domain).toBe("EMERGENCY");
    }
  });
});

describe("parseAction", () => {
  it("returns parsed action on valid input", () => {
    const action = parseAction({
      schemaVersion: "1.0",
      id: "H-1234",
      scenario: "Fire",
      summary: "Building fire",
      confidence: 0.8,
      sources: [{ type: "photo", label: "Photo", cited: true }],
      briefing: "Fire in building",
      createdAt: new Date().toISOString(),
    });
    expect(action.id).toBe("H-1234");
    expect(action.severity).toBe("UNKNOWN");
  });

  it("throws on invalid input", () => {
    expect(() => parseAction({})).toThrow();
  });
});

describe("parseActionSafe", () => {
  it("returns ok: true on valid input", () => {
    const result = parseActionSafe({
      schemaVersion: "1.0",
      id: "H-5678",
      scenario: "Flood",
      summary: "Water rising",
      confidence: 0.7,
      sources: [{ type: "text", label: "Report", cited: true }],
      briefing: "Flood briefing",
      createdAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });

  it("returns ok: false with error on invalid input", () => {
    const result = parseActionSafe({ scenario: "nope" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Required");
    }
  });
});
