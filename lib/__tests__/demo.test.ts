import { describe, it, expect } from "vitest";
import { demoAction, getAllScenarios } from "../demo";
import { parseActionSafe } from "../schema";

describe("demoAction", () => {
  it("all 4 demo scenarios pass strict ActionSchema validation", () => {
    for (let seed = 1; seed <= 4; seed++) {
      const action = demoAction(seed);
      const result = parseActionSafe(action);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.graphData.nodes.length).toBeGreaterThanOrEqual(3);
        expect(result.value.timeline.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("wraps the scenario list safely (out-of-range seeds never crash)", () => {
    expect(demoAction(0)).toBeDefined();
    expect(demoAction(0).scenario).toBeTypeOf("string");
    expect(demoAction(0).scenario.length).toBeGreaterThan(0);

    expect(demoAction(5)).toBeDefined();
    expect(demoAction(5).scenario).toBeTypeOf("string");
    expect(demoAction(5).scenario.length).toBeGreaterThan(0);

    expect(demoAction(Number.NaN)).toBeDefined();
    expect(demoAction(Number.NaN).scenario).toBeTypeOf("string");

    expect(demoAction(-3)).toBeDefined();
    expect(demoAction(-3).scenario).toBeTypeOf("string");
  });
});

describe("getAllScenarios", () => {
  it("returns 4 entries with required fields", () => {
    const scenarios = getAllScenarios();
    expect(scenarios).toHaveLength(4);
    for (const s of scenarios) {
      expect(typeof s.id).toBe("string");
      expect(s.id.length).toBeGreaterThan(0);
      expect(typeof s.scenario).toBe("string");
      expect(s.scenario.length).toBeGreaterThan(0);
      expect(typeof s.severity).toBe("string");
      expect(s.severity.length).toBeGreaterThan(0);
      expect(typeof s.domain).toBe("string");
      expect(s.domain.length).toBeGreaterThan(0);
    }
  });
});
