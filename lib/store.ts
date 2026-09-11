"use client";

import type { Action } from "./schema";

const KEY = "herald.incidents.v1";

export function loadBoard(): Action[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveToBoard(action: Action): Action[] {
  const board = loadBoard();
  const next = [action, ...board.filter((a) => a.id !== action.id)];
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full / private mode — board is best-effort, never break the app
  }
  return next;
}

export function updateBoardStatus(id: string, status: Action["status"]): Action[] {
  const board = loadBoard();
  const next = board.map((a) => (a.id === id ? { ...a, status } : a));
  window.localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function downloadJson(action: Action): void {
  const blob = new Blob([JSON.stringify(action, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `herald-${action.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}