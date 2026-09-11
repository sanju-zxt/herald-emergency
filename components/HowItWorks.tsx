"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "📥", label: "Messy Input", desc: "Photo, voice, or text" },
  { icon: "🧠", label: "Gemini Extraction", desc: "AI understands context" },
  { icon: "✅", label: "Schema Validation", desc: "Zod enforces structure" },
  { icon: "🔒", label: "Safety Gate", desc: "Confidence verified" },
  { icon: "🚨", label: "Verified Action", desc: "Ready to dispatch" },
];

export default function HowItWorks() {
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    let mounted = true;
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;

    const stepThrough = () => {
      if (!mounted) return;
      setLit(-1);
      let s = 0;
      const tick = (): void => {
        if (!mounted) return;
        setLit(s);
        s++;
        if (s < STEPS.length) {
          t1 = setTimeout(tick, 500);
        } else {
          t2 = setTimeout(stepThrough, 2500);
        }
      };
      t1 = setTimeout(tick, 500);
    };
    stepThrough();

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="how-it-works">
      <div className="hiw-header">
        <span className="eyebrow" style={{ fontSize: "0.7rem" }}>THE PIPELINE</span>
        <h2>How HERALD works</h2>
        <p>Messy input becomes a verified, dispatchable action — in seconds.</p>
      </div>
      <div className="hiw-pipeline">
        {STEPS.map((step, i) => (
          <div key={i} className="hiw-step-wrap">
            <div className={`hiw-step ${i <= lit ? "active" : ""} ${i < lit ? "done" : ""}`}>
              <div className="hiw-icon">{i < lit ? "✓" : step.icon}</div>
              <div className="hiw-label">{step.label}</div>
              <div className="hiw-desc">{step.desc}</div>
            </div>
            {i < STEPS.length - 1 && <div className={`hiw-connector ${i < lit ? "on" : ""}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}
