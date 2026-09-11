"use client";

import { useEffect, useState } from "react";

interface TickerIncident {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  text: string;
  time: string;
}

const INCIDENTS: TickerIncident[] = [
  { id: "H-7824", severity: "CRITICAL", text: "Building fire detected — 3rd floor, smoke reported", time: "Just now" },
  { id: "H-7823", severity: "HIGH", text: "Multi-vehicle pileup on Highway 101 — injuries reported", time: "2m ago" },
  { id: "H-7822", severity: "CRITICAL", text: "Flash flood warning — River Rd pumping station offline", time: "5m ago" },
  { id: "H-7821", severity: "MEDIUM", text: "Power outage affecting 12 blocks — substation fault", time: "8m ago" },
  { id: "H-7820", severity: "HIGH", text: "Gas leak detected — residential zone evacuated", time: "12m ago" },
  { id: "H-7819", severity: "CRITICAL", text: "Bridge structural failure — road closed both directions", time: "15m ago" },
  { id: "H-7818", severity: "LOW", text: "Traffic signal malfunction — manual control activated", time: "18m ago" },
  { id: "H-7817", severity: "HIGH", text: "Chemical spill on industrial corridor — Hazmat en route", time: "22m ago" },
  { id: "H-7816", severity: "MEDIUM", text: "Water main break — 4th Avenue flooded, detour active", time: "25m ago" },
  { id: "H-7815", severity: "CRITICAL", text: "Collapsed structure — search and rescue deployed", time: "30m ago" },
];

export default function LiveTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState<TickerIncident[]>(INCIDENTS.slice(0, 6));

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((prev) => {
        const next = (prev + 1) % INCIDENTS.length;
        const newIncident = { ...INCIDENTS[next], time: "Just now" };
        setVisible((vis) => {
          const updated = [newIncident, ...vis.map((v, i) => ({
            ...v,
            time: i === 0 ? "Just now" : v.time === "Just now" ? "2m ago" : v.time,
          }))];
          return updated.slice(0, 6);
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-ticker">
      <div className="ticker-header">
        <span className="ticker-pulse" />
        <span className="ticker-title">Live Incident Feed</span>
        <span className="ticker-count">{visible.length} active</span>
      </div>
      <div className="ticker-feed">
        {visible.map((inc, i) => (
          <div
            className={`ticker-item ticker-enter`}
            key={`${inc.id}-${i}`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className={`ticker-sev ${inc.severity}`} />
            <div className="ticker-body">
              <div className="ticker-meta">
                <span className="ticker-id">{inc.id}</span>
                <span className={`sev ${inc.severity}`} style={{ fontSize: "0.6rem", padding: "2px 6px" }}>
                  {inc.severity}
                </span>
                <span className="ticker-time">{inc.time}</span>
              </div>
              <div className="ticker-text">{inc.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
