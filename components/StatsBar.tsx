"use client";

import { useMemo } from "react";
import type { Action } from "@/lib/schema";

interface StatsBarProps {
  board: Action[];
  currentAction: Action | null;
}

export function StatsBar({ board, currentAction }: StatsBarProps) {
  const stats = useMemo(() => {
    const all = currentAction ? [currentAction, ...board.filter((b) => b.id !== currentAction.id)] : board;
    const total = all.length;
    const critical = all.filter((a) => a.severity === "CRITICAL").length;
    const high = all.filter((a) => a.severity === "HIGH").length;
    const avgConf = total > 0 ? Math.round((all.reduce((s, a) => s + a.confidence, 0) / total) * 100) : 0;
    const acted = all.filter((a) => a.status === "ACTED").length;
    const agencies = new Set(
      all.flatMap((a) => a.recommendedActions.map((r) => r.target).filter(Boolean))
    ).size;

    return { total, critical, high, avgConf, acted, agencies };
  }, [board, currentAction]);

  return (
    <div className="stats-bar">
      <div className="stat-tile">
        <span className="stat-num">{stats.total}</span>
        <span className="stat-label">Incidents</span>
      </div>
      <div className="stat-tile critical">
        <span className="stat-num">{stats.critical}</span>
        <span className="stat-label">Critical</span>
      </div>
      <div className="stat-tile high">
        <span className="stat-num">{stats.high}</span>
        <span className="stat-label">High</span>
      </div>
      <div className="stat-tile">
        <span className="stat-num">{stats.avgConf}%</span>
        <span className="stat-label">Avg Confidence</span>
      </div>
      <div className="stat-tile">
        <span className="stat-num">{stats.acted}</span>
        <span className="stat-label">Dispatched</span>
      </div>
      <div className="stat-tile">
        <span className="stat-num">{stats.agencies}</span>
        <span className="stat-label">Agencies</span>
      </div>
    </div>
  );
}
