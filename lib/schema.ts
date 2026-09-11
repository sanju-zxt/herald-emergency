import { z } from "zod";

export const DOMAINS = ["EMERGENCY", "HEALTH", "CIVIC"] as const;
export type Domain = (typeof DOMAINS)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SOURCE_TYPES = ["photo", "voice", "text", "live"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const EntitySchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  value: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

export const SourceSchema = z.object({
  type: z.enum(SOURCE_TYPES),
  label: z.string(),
  detail: z.string().optional(),
  cited: z.boolean().default(false),
});
export type Source = z.infer<typeof SourceSchema>;

/* ── Graph entities & edges ── */
export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["incident", "person", "location", "infrastructure", "agency", "vehicle", "condition"]),
  size: z.number().optional(),
  color: z.string().optional(),
});
export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  weight: z.number().optional(),
});
export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

/* ── Timeline entries ── */
export const TimelineEntrySchema = z.object({
  time: z.string(),
  label: z.string(),
  detail: z.string().optional(),
  status: z.enum(["pending", "active", "done"]).default("pending"),
});
export type TimelineEntry = z.infer<typeof TimelineEntrySchema>;

export const RecommendedActionSchema = z.object({
  title: z.string().min(1),
  target: z.string().optional(),
  priority: z.enum(["IMMEDIATE", "SOON", "ROUTINE"]).default("SOON"),
});
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

export const ActionSchema = z.object({
  schemaVersion: z.literal("1.0"),
  id: z.string().regex(/^H-\d{4,}$/),
  domain: z.enum(DOMAINS).default("EMERGENCY"),
  scenario: z.string().min(1),
  summary: z.string().min(1),
  severity: z.enum(SEVERITIES).default("UNKNOWN"),
  status: z.enum(["DRAFT", "REVIEWED", "ACTED", "DISMISSED"]).default("DRAFT"),
  confidence: z.number().min(0).max(1),
  entities: z.array(EntitySchema).default([]),
  location: z
    .object({
      label: z.string().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      source: z.string().optional(),
    })
    .default({}),
  sources: z.array(SourceSchema).min(1),
  briefing: z.string().min(1),
  recommendedActions: z.array(RecommendedActionSchema).default([]),
  safetyGate: z
    .object({
      passed: z.boolean(),
      reasons: z.array(z.string()).default([]),
    })
    .default({ passed: false, reasons: ["Awaiting verification."] }),
  graphData: z.object({
    nodes: z.array(GraphNodeSchema).default([]),
    edges: z.array(GraphEdgeSchema).default([]),
  }).default({ nodes: [], edges: [] }),
  timeline: z.array(TimelineEntrySchema).default([]),
  createdAt: z.string(),
});
export type Action = z.infer<typeof ActionSchema>;

/** Coerce a loose model/API value into a strict Action. Throws with readable message on failure. */
export function parseAction(raw: unknown): Action {
  return ActionSchema.parse(raw);
}

/** Non-throwing variant for safe use. */
export function parseActionSafe(raw: unknown): { ok: true; value: Action } | { ok: false; error: string } {
  const res = ActionSchema.safeParse(raw);
  return res.success ? { ok: true, value: res.data } : { ok: false, error: res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}