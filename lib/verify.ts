import type { Action, Severity, Source } from "./schema";

/** Clamp model-reported confidence into a trustworthy value. */
export function clampConfidence(value: number | undefined): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0.5;
  return Math.min(1, Math.max(0, n));
}

/** Cross-source corroboration bonus: the more independent channels agree, the higher trust. */
export function corroborationBoost(present: { photo: boolean; voice: boolean; text: boolean; live: boolean }): number {
  const count = [present.photo, present.voice, present.text, present.live].filter(Boolean).length;
  if (count >= 3) return 0.12;
  if (count === 2) return 0.07;
  if (count === 1) return 0.02;
  return 0;
}

const SEV_RANK: Record<Severity, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3, UNKNOWN: 1 };

export interface GateResult {
  confidence: number;
  passed: boolean;
  reasons: string[];
}

/**
 * Safety gate: high-impact (HIGH/CRITICAL) actions require high confidence,
 * otherwise the system suspends auto-approval and demands human review.
 * Pure function — unit-tested.
 */
export function verifyAndGate(
  modelAction: {
    confidence?: number;
    severity?: Severity;
    sources?: Source[];
  },
  present: { photo: boolean; voice: boolean; text: boolean; live: boolean }
): GateResult {
  const corroborated = corroborationBoost(present);
  const base = clampConfidence(modelAction.confidence);
  const hasEvidence =
    (modelAction.sources ?? []).some((s) => s.cited) || present.photo || present.voice || present.text || present.live;
  // No verifiable evidence → confidence cannot honestly exceed 39% (unverified baseline).
  const unscaled = hasEvidence ? base + corroborated : Math.min(base, 0.39);
  const confidence = Math.round(Math.min(1, unscaled) * 100) / 100;

  const severity: Severity = modelAction.severity ?? "UNKNOWN";
  const reasons: string[] = [];
  const sources = modelAction.sources ?? [];

  reasons.push(`Confidence ${Math.round(confidence * 100)}% (model ${Math.round(base * 100)}% + ${Math.round(corroborated * 100)}% cross-source corroboration).`);

  if (!hasEvidence) reasons.push("No attached evidence source was verifiable.");

  let passed = true;
  if (!hasEvidence) passed = false;
  if (SEV_RANK[severity] >= 2 && confidence < 0.7) {
    passed = false;
    reasons.push(`Severity ${severity} with confidence below 70% — requires human review before dispatch.`);
  }
  if (SEV_RANK[severity] >= 3 && confidence < 0.85) {
    passed = false;
    reasons.push(`CRITICAL action held pending explicit operator approval.`);
  }
  if (confidence < 0.4) {
    passed = false;
    reasons.push("Low overall confidence — flagged as unverified." );
  }
  if (SEV_RANK[severity] === 0 && confidence >= 0.5) {
    reasons.push("Low-severity, routine channel.");
  }

  return { confidence, passed, reasons: reasons.slice(0, 4) };
}