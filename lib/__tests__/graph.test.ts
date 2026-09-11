import { describe, it, expect } from "vitest";
import { buildGraph, simulateGraph, hitTest } from "../graph";
import type { GraphData } from "../graph";

const data: GraphData = {
  nodes: [
    { id: "a", label: "Incident", type: "incident" },
    { id: "b", label: "Location", type: "location" },
    { id: "c", label: "Agency", type: "agency" },
  ],
  edges: [
    { source: "a", target: "b", label: "at" },
    { source: "c", target: "a", label: "responds" },
  ],
};

describe("buildGraph", () => {
  it("returns same number of nodes as input", () => {
    const nodes = buildGraph(data);
    expect(nodes).toHaveLength(3);
  });

  it("every node has finite numeric x and y", () => {
    const nodes = buildGraph(data);
    for (const n of nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it("preserves node ids", () => {
    const nodes = buildGraph(data);
    expect(nodes.map((n) => n.id)).toEqual(["a", "b", "c"]);
  });
});

describe("simulateGraph", () => {
  it("returns correct number of nodes", () => {
    const nodes = simulateGraph(data, 300, 300);
    expect(nodes).toHaveLength(3);
  });

  it("all node coordinates stay within bounds [0, 300]", () => {
    const nodes = simulateGraph(data, 300, 300);
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(300);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(300);
    }
  });

  it("every coordinate is finite after simulation", () => {
    const nodes = simulateGraph(data, 300, 300);
    for (const n of nodes) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });
});

describe("hitTest", () => {
  const nodes = [
    { id: "p", label: "P", type: "person" as const, x: 100, y: 100, vx: 0, vy: 0 },
  ];

  it("returns node id when coordinates match", () => {
    expect(hitTest(nodes, 100, 100)).toBe("p");
  });

  it("returns null when coordinates are far away", () => {
    expect(hitTest(nodes, 500, 500)).toBeNull();
  });
});
