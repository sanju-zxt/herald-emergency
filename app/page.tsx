"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Action, GraphNode, GraphEdge } from "@/lib/schema";
import { loadBoard, saveToBoard, updateBoardStatus, downloadJson } from "@/lib/store";
import { tts } from "@/lib/tts";
import { renderLayout, simulateGraph, hitTest, type GNode } from "@/lib/graph";
import { CoPilotChat } from "@/components/CoPilotChat";
import { StatsBar } from "@/components/StatsBar";
import LiveTicker from "@/components/LiveTicker";
import HowItWorks from "@/components/HowItWorks";

type Phase = "idle" | "working" | "done" | "error";

interface Resp {
  mode: "gemini" | "demo";
  action: Action;
  error?: string;
}

interface ScenarioInfo {
  id: string;
  scenario: string;
  severity: string;
  domain: string;
}

const STAGES = [
  "Reading your inputs…",
  "Analyzing evidence…",
  "Building entity graph…",
  "Cross-verifying…",
  "Composing action…",
] as const;

const DEMO_SCENARIOS: ScenarioInfo[] = [
  { id: "1", scenario: "Localized street flooding", severity: "CRITICAL", domain: "EMERGENCY" },
  { id: "2", scenario: "Building fire — apartment", severity: "CRITICAL", domain: "EMERGENCY" },
  { id: "3", scenario: "Multi-vehicle pileup", severity: "HIGH", domain: "HEALTH" },
  { id: "4", scenario: "Gas leak — residential", severity: "HIGH", domain: "CIVIC" },
];

function makeId(): string {
  return `H-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function Home() {
  const [photo, setPhoto] = useState<{ name: string; file: File; url: string } | null>(null);
  const [text, setText] = useState("");

  const [rec, setRec] = useState<{ blob: Blob; url: string } | null>(null);
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action | null>(null);
  const [resultMode, setResultMode] = useState<"gemini" | "demo">("demo");
  const [board, setBoard] = useState<Action[]>([]);
  const [editing, setEditing] = useState(false);
  const [editBrief, setEditBrief] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [drag, setDrag] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<"card" | "graph" | "timeline" | "map" | "copilot">("card");
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    setBoard(loadBoard());
  }, []);

  // Auto-run the flagship flood demo so the page is never a static landing —
  // judges see HERALD already analyzing an incident the moment they arrive.
  useEffect(() => {
    const t = setTimeout(() => {
      if (phase === "idle") runDemo(1);
    }, 750);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      tts.stop();
    };
  }, []);

  const addPhoto = useCallback((file: File) => {
    if (!/^image\//.test(file.type)) {
      setError("That file isn't an image (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is over 5 MB — try a smaller one.");
      return;
    }
    setPhoto({ name: file.name, file, url: URL.createObjectURL(file) });
  }, []);

  async function startRec() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        setRec({ blob, url: URL.createObjectURL(blob) });
      };
      mr.start();
      setRecording(true);
      setRecSec(0);
      timerRef.current = setInterval(() => setRecSec((s) => s + 1), 1000);
    } catch {
      setError("Microphone blocked — paste a text description instead.");
    }
  }

  function stopRec() {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function dropPhoto(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) addPhoto(f);
  }

  function kickStepper() {
    setStage(0);
    const timer = setInterval(() => {
      setStage((s) => (s < STAGES.length - 1 ? s + 1 : s));
    }, 620);
    return () => clearInterval(timer);
  }

  async function runAnalyze(scenarioId?: number) {
    setError("");
    if (!photo && !rec && !text.trim() && scenarioId === undefined) {
      setError("Add a photo, a voice note, or write something — the bridge needs an input to cross.");
      return;
    }
    setPhase("working");
    setStage(0);
    const stopStepper = kickStepper();
    setAction(null);

    const fd = new FormData();
    if (photo) fd.append("files", photo.file);
    if (rec) fd.append("files", new File([rec.blob], "voice.webm", { type: rec.blob.type || "audio/webm" }));
    if (text.trim()) fd.append("text", text.trim());

    try {
      const demoParam = scenarioId !== undefined ? `?demo=1&scenario=${scenarioId}` : "";
      const res = await fetch(`/api/intake${demoParam}`, { method: "POST", body: fd });
      const data = (await res.json()) as Partial<Resp> & { error?: string; mode?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong on our end.");
        setPhase("error");
        return;
      }
      const act = data.action;
      if (!act) {
        setError("No action returned.");
        setPhase("error");
        return;
      }
      setResultMode(data.mode === "gemini" ? "gemini" : "demo");
      setAction(act);
      setPhase("done");
    } catch {
      setError("Network hiccup — try a demo scenario to keep going.");
      setPhase("error");
    } finally {
      stopStepper();
    }
  }

  function runDemo(scenarioId: number) {
    setError("");
    if (phase === "working") return;
    setSelectedDemo(scenarioId);
    setPhase("working");
    setStage(0);
    const stopStepper = kickStepper();
    setAction(null);
    void fetch(`/api/intake?demo=1&scenario=${scenarioId}`, { method: "POST" })
      .then((res) => res.json())
      .then((data: Partial<Resp>) => {
        if (data.action) {
          setResultMode("demo");
          setAction(data.action);
          setPhase("done");
        } else {
          setError(data.error ?? "Demo failed.");
          setPhase("error");
        }
      })
      .catch(() => {
        setError("Demo failed to load.");
        setPhase("error");
      })
      .finally(stopStepper);
  }

  function approve(status: Action["status"]) {
    if (!action) return;
    const next = { ...action, status, id: action.id || makeId() };
    setAction(next);
    setBoard(saveToBoard(next));
    cancelEdit();
  }

  function startEdit() {
    if (!action) return;
    setEditBrief(action.briefing);
    setEditSummary(action.summary);
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
    setEditBrief("");
    setEditSummary("");
  }
  function saveEdit() {
    if (!action) return;
    const next = { ...action, briefing: editBrief.trim() || action.briefing, summary: editSummary.trim() || action.summary };
    setAction(next);
    setBoard(saveToBoard(next));
    setEditing(false);
  }
  function reject() {
    approve("DISMISSED");
  }
  function chopBoard(id: string) {
    const next = board.filter((a) => a.id !== id);
    setBoard(next);
    window.localStorage.setItem("herald.incidents.v1", JSON.stringify(next));
  }

  const hasInputs = useMemo(() => Boolean(photo || rec || text.trim()), [photo, rec, text]);

  return (
    <main className={fullscreen ? "ops-mode" : ""}>
      <a className="skip-link" href="#bridge">
        Skip to the bridge
      </a>

      <header className="site-header">
        <div className="wrap">
          <a className="brand" href="#top">
            <img className="brand-mark" src="/logo.svg" alt="" width={28} height={28} />
            HERALD
          </a>
          <div className="header-right">
            <span className="pill-live">
              <span className="dot" aria-hidden="true" /> {phase === "working" ? "PROCESSING" : phase === "done" ? "ACTIVE" : "STANDBY"}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={() => setFullscreen(!fullscreen)} title="Toggle ops view">
              {fullscreen ? "✕ Exit Ops" : "🖥️ Ops View"}
            </button>
          </div>
        </div>
      </header>

      <section className="hero" id="top">
        <span className="eyebrow">Emergency Intelligence Platform</span>
        <h1>
          The gap between what we know and what first responders do is measured in minutes.
          <br />
          <span className="grad">HERALD closes it in seconds.</span>
        </h1>
        <p className="claim">Every life-saving fact sits in a messy, unverified place — a voice note, a photo, a text.</p>
        <p className="sub">
          HERALD is the bridge: it takes unstructured, real-world input and turns it into a
          <strong> structured, verified, life-saving action</strong> — with an entity graph showing how everything connects.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="#bridge">
            Open the bridge ↑
          </a>
          <a className="btn btn-ghost" href="#future">
            Beyond emergencies
          </a>
        </div>
      </section>

      {/* Live Incident Ticker */}
      <div className="wrap">
        <LiveTicker />
      </div>

      {/* Stats Dashboard */}
      <div className="wrap">
        <StatsBar board={board} currentAction={action} />
      </div>

      <div className="wrap">
        <div className="beats" aria-label="Why HERALD">
          <div className="beat">
            <span className="n">01 · THE PROBLEM</span>
            <h3>Information sits stranded.</h3>
            <p>
              A blocked road, a fallen tree, a failing pump — captured in photos and voice notes that
              never reach the people who can act.
            </p>
          </div>
          <div className="beat">
            <span className="n">02 · THE BRIDGE</span>
            <h3>Messy in. Action out.</h3>
            <p>
              One photo, one voice note, one text. HERALD converts them into a structured, verified
              briefing — plus a live entity graph showing how everything connects.
            </p>
          </div>
          <div className="beat">
            <span className="n">03 · THE FUTURE</span>
            <h3>Beyond emergency.</h3>
            <p>
              The same bridge carries health and civic systems — a messy medical history into a
              structured care plan, a complaint into a routed response.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works Pipeline */}
      <div className="wrap">
        <HowItWorks />
      </div>

      <section className="bridge" id="bridge">
        <div className="wrap">
          <div className="section-title">
            <h2>Cross the bridge.</h2>
            <p>Photo · Voice · Text → a verified action with entity graph visualization.</p>
          </div>

          {/* Scenario Picker */}
          <div className="scenario-picker">
            <p className="step-label">Quick demo — pick a scenario</p>
            <div className="scenario-grid">
              {DEMO_SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  aria-pressed={selectedDemo === parseInt(s.id)}
                  className={`scenario-card ${selectedDemo === parseInt(s.id) ? "active" : ""}`}
                  onClick={() => runDemo(parseInt(s.id))}
                  disabled={phase === "working"}
                >
                  <span className={`sev ${s.severity}`}>{s.severity}</span>
                  <span className="sc-domain">{s.domain}</span>
                  <span className="sc-title">{s.scenario}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-grid">
              {/* ----- intake ----- */}
              <div className="Intake" aria-label="Input">
                <p className="step-label">Bring the messy input</p>

                {photo ? (
                  <div className="photo-preview">
                    <img src={photo.url} alt="Photo you uploaded of the incident" />
                    <button className="remove" onClick={() => setPhoto(null)}>
                      Remove ✕
                    </button>
                  </div>
                ) : (
                  <label
                    className={drag ? "dropzone drag" : "dropzone"}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={dropPhoto}
                  >
                    <span className="dz-icon" aria-hidden="true">📷</span>
                    <span>Drop a photo, or click to choose</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) addPhoto(f);
                      }}
                    />
                  </label>
                )}

                <div>
                  {!recording ? (
                    <button className="voice-btn" onClick={startRec}>
                      🎙  Record a voice note
                    </button>
                  ) : null}
                  {recording && (
                    <button className="voice-btn rec" onClick={stopRec}>
                      ■  Stop recording <span className="voice-timer" style={{ display: "inline" }}>({recSec}s)</span>
                    </button>
                  )}
                  {!recording && rec && (
                    <div className="voice-timer">
                      <audio src={rec.url} controls style={{ width: "100%" }} />
                      <p>
                        Voice attached · <button className="demo-chip" onClick={() => setRec(null)}>Remove</button>
                      </p>
                    </div>
                  )}
                </div>

                <label className="step-label" htmlFor="herald-text">
                  Or type it
                </label>
                <textarea
                  id="herald-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={'"The pump on River Rd stopped and the water is rising fast…"'}
                  maxLength={4000}
                />

                <div className="analyze-row">
                  <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => runAnalyze()} disabled={phase === "working"}>
                    {phase === "working" ? "Analyzing…" : "Convert to verified action"}
                  </button>
                </div>
              </div>

              {/* ----- output ----- */}
              <div className="Output" aria-label="Verified action" aria-live="polite">
                {phase === "idle" && (
                  <div className="stepper" aria-hidden="true">
                    {STAGES.map((s, i) => (
                      <div className="step" key={s}>
                        <span className="idx">{i + 1}</span>
                        <span>{s}</span>
                        <span className="bar" />
                      </div>
                    ))}
                    <p className="fineprint" style={{ marginTop: 14 }}>
                      Pick a demo scenario above or bring your own input.
                    </p>
                  </div>
                )}

                {phase === "working" && (
                  <div className="stepper">
                    {STAGES.map((s, i) => (
                      <div className={`step ${i === stage ? "on" : i < stage ? "done" : ""}`} key={s}>
                        <span className="idx">{i < stage ? "✓" : i + 1}</span>
                        <span>{s}</span>
                        <span className="bar" />
                      </div>
                    ))}
                    <div className="fineprint" style={{ marginTop: 10 }} aria-live="assertive">
                      Coordinating evidence…
                    </div>
                  </div>
                )}

                {phase === "error" && <div className="alert-err" role="alert">{error}</div>}

                {phase === "done" && action && (
                  <>
                    {/* View tabs */}
                    <div className="view-tabs" role="tablist" aria-label="Incident views">
                      <button
                        role="tab"
                        aria-selected={activeView === "card"}
                        className={`tab ${activeView === "card" ? "active" : ""}`}
                        onClick={() => setActiveView("card")}
                      >
                        📋 Action
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeView === "graph"}
                        className={`tab ${activeView === "graph" ? "active" : ""}`}
                        onClick={() => setActiveView("graph")}
                      >
                        🕸️ Graph
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeView === "timeline"}
                        className={`tab ${activeView === "timeline" ? "active" : ""}`}
                        onClick={() => setActiveView("timeline")}
                      >
                        📊 Timeline
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeView === "map"}
                        className={`tab ${activeView === "map" ? "active" : ""}`}
                        onClick={() => setActiveView("map")}
                      >
                        🗺️ Map
                      </button>
                      <button
                        role="tab"
                        aria-selected={activeView === "copilot"}
                        className={`tab ${activeView === "copilot" ? "active" : ""}`}
                        onClick={() => setActiveView("copilot")}
                      >
                        🤖 Co-Pilot
                      </button>
                    </div>
                    {activeView === "card" && <ActionCard action={action} mode={resultMode} />}
                    {activeView === "graph" && <GraphView action={action} />}
                    {activeView === "timeline" && <TimelineView action={action} />}
                    {activeView === "map" && <MapView action={action} />}
                    {activeView === "copilot" && <CoPilotChat action={action} />}
                  </>
                )}
              </div>
            </div>
          </div>

          {phase === "done" && action && (
            <div className="card-actions" style={{ maxWidth: 860, margin: "18px auto 0", justifyContent: "center" }}>
              {editing ? (
                <>
                  <button className="btn btn-appr" onClick={saveEdit}>
                    Save &amp; Approve
                  </button>
                  <button className="btn btn-ghost" onClick={cancelEdit}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-appr" onClick={() => approve("ACTED")}>
                    ✓ Approve &amp; dispatch
                  </button>
                  <button className="btn btn-edit" onClick={startEdit}>
                    ✎ Edit before dispatch
                  </button>
                  <button className="btn btn-rej" onClick={reject}>
                    ✕ Reject
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {board.length > 0 && (
        <section className="board" style={{ paddingBottom: 60 }}>
          <div className="wrap">
            <h2>Dispatched board</h2>
            <div className="board-list">
              {board.map((a) => (
                <div className="board-item" key={a.id}>
                  <span className={`sev ${a.severity}`}>{a.severity}</span>
                  <div className="info">
                    <div className="t">{a.scenario}</div>
                    <div className="m">
                      {a.id} · {a.status} · {Math.round(a.confidence * 100)}% confidence
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => downloadJson(a)}>
                    JSON
                  </button>
                  <button className="btn btn-rej btn-sm" onClick={() => chopBoard(a.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="wrap">
          <div className="future" id="future">
            <div className="f">
              <h4>🏥 Health</h4>
              <p>Garbled records and typed symptoms become a structured care plan a clinician can review.</p>
            </div>
            <div className="f">
              <h4>🏙 Civic</h4>
              <p>A complaint about streetlight outage becomes a routed, geofenced maintenance ticket.</p>
            </div>
            <div className="f">
              <h4>🌊 Climate</h4>
              <p>Weather signals and community reports fuse into early, defensible local warnings.</p>
            </div>
          </div>
          <p className="fineprint">
            HERALD is an AI-first triage layer: it proposes, a human verifies. Every action carries a confidence score,
            source citations, entity graph, and an operator approval gate — because life-saving decisions stay human.
          </p>
        </div>
      </footer>
    </main>
  );
}

/* ── Graph Visualization ── */
function GraphView({ action }: { action: Action }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Simulated layout is cached: the physics run once per data change; hover only re-applies the draw pass.
  const nodesRef = useRef<GNode[]>([]);
  const dimsRef = useRef({ width: 0, height: 0 });
  const edgesRef = useRef<GraphEdge[]>(action.graphData?.edges ?? []);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const graphData = action.graphData ?? { nodes: [], edges: [] };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = Math.max(400, rect.height);

    canvas.width = width * (window.devicePixelRatio || 1);
    canvas.height = height * (window.devicePixelRatio || 1);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Expensive pass — only when the incident data changes.
    dimsRef.current = { width, height };
    edgesRef.current = graphData.edges;
    nodesRef.current = simulateGraph(graphData, width, height);
    renderLayout(ctx, nodesRef.current, graphData.edges, width, height, hoveredNode);
  }, [graphData]);

  // Cheap pass — hover just re-draws the cached layout, no re-simulation.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { width, height } = dimsRef.current;
    renderLayout(ctx, nodesRef.current, edgesRef.current, width, height, hoveredNode);
  }, [hoveredNode]);

  function handleMouse(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(nodesRef.current, mx, my);
    setHoveredNode(hit);
    canvas.style.cursor = hit ? "pointer" : "default";
  }

  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;
  const relText = graphData.edges
    .map((e) => `${graphData.nodes.find((n) => n.id === e.source)?.label ?? e.source} ${e.label ?? "is related to"} ${graphData.nodes.find((n) => n.id === e.target)?.label ?? e.target}`)
    .join(". ");

  return (
    <div className="graph-view">
      <div className="graph-header">
        <span className="graph-stat">{nodeCount} entities</span>
        <span className="graph-stat">{edgeCount} relationships</span>
      </div>
      <div className="graph-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Relationship graph of ${action.scenario}. ${nodeCount} entities and ${edgeCount} relationships.`}
          aria-description={relText || "No relationships extracted."}
          tabIndex={0}
          onMouseMove={handleMouse}
          onMouseLeave={() => setHoveredNode(null)}
        />
        <p className="sr-only">
          Entities in this incident: {graphData.nodes.map((n) => n.label).join(", ") || "none"}. {relText}
        </p>
      </div>
      <div className="graph-legend">
        {[
          { type: "incident", label: "Incident", color: "#ff5c6c" },
          { type: "location", label: "Location", color: "#3ddc97" },
          { type: "infrastructure", label: "Infrastructure", color: "#ffb454" },
          { type: "agency", label: "Agency", color: "#7f6bff" },
          { type: "person", label: "People", color: "#3cc2ff" },
          { type: "vehicle", label: "Vehicle", color: "#f472b6" },
          { type: "condition", label: "Condition", color: "#facc15" },
        ].map((l) => (
          <span className="legend-item" key={l.type}>
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Timeline View ── */
function TimelineView({ action }: { action: Action }) {
  const timeline = action.timeline ?? [];
  if (timeline.length === 0) {
    return <div className="empty-timeline">No timeline data available for this incident.</div>;
  }

  return (
    <div className="timeline-view">
      <div className="timeline-track">
        {timeline.map((entry, i) => (
          <div className={`tl-entry ${entry.status}`} key={i}>
            <div className="tl-marker">
              <div className="tl-dot" />
              {i < timeline.length - 1 && <div className="tl-line" />}
            </div>
            <div className="tl-content">
              <div className="tl-time">{entry.time}</div>
              <div className="tl-label">{entry.label}</div>
              {entry.detail && <div className="tl-detail">{entry.detail}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Map View (Google Maps embed — keyless) ── */
function MapView({ action }: { action: Action }) {
  const location = action.location?.label ?? action.scenario;
  const q = encodeURIComponent(location);
  return (
    <div className="map-view">
      <div className="map-header">
        <span className="graph-stat">📍 {location}</span>
      </div>
      <div className="map-embed">
        <iframe
          title={`Map showing the incident location: ${location}`}
          src={`https://maps.google.com/maps?q=${q}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="map-note">Location extracted by Gemini from the input sources. Visualized with Google Maps.</p>
    </div>
  );
}

/* ── Action Card (existing, kept) ── */
function ActionCard({ action, mode }: { action: Action; mode: "gemini" | "demo" }) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (speaking) {
      tts.stop();
      setSpeaking(false);
    } else {
      tts.speak(`${action.scenario}. ${action.briefing} Confidence ${Math.round(action.confidence * 100)} percent.`);
      setSpeaking(true);
      window.speechSynthesis.addEventListener("end", () => setSpeaking(false), { once: true });
    }
  }

  const pct = Math.round(action.confidence * 100);
  const maxReco = Math.max(...action.recommendedActions.map((r) => (r.priority === "IMMEDIATE" ? 2 : r.priority === "SOON" ? 1 : 0)), 0);

  return (
    <div>
      <span className="mode-tag">
        <span className="dot" aria-hidden="true" />
        {mode === "gemini" ? "Live Gemini analysis" : "Demo scenario"}
      </span>
      <div className="card-head">
        <div>
          <div className="card-id">{action.id}</div>
          <div className="card-scenario">{action.scenario}</div>
        </div>
        <span className={`sev ${action.severity}`}>{action.severity}</span>
      </div>

      <p className="card-summary">{action.summary}</p>

      <div className="confbar-wrap">
        <div className="confbar-label">
          <span>Verification confidence</span>
          <span>{pct}%</span>
        </div>
        <div className={pct >= 70 ? "confbar okhot" : "confbar warnhot"} aria-hidden="true">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="sources">
        {action.sources.map((s, i) => (
          <span className="src-chip" key={i}>
            <span className="tick" aria-hidden="true">✓</span>
            {s.label}
          </span>
        ))}
        {action.location?.label && (
          <span className="src-chip" style={{ width: "100%", justifyContent: "flex-start" }}>
            📍 {action.location.label}
          </span>
        )}
      </div>

      <div className="briefing">{action.briefing}</div>

      {action.recommendedActions.length > 0 && (
        <ul className="reco">
          {action.recommendedActions.map((r, i) => (
            <li key={i}>
              <span className="k">{i + 1}</span>
              <span>
                {r.title}
                {r.target ? <span style={{ color: "var(--text-faint)" }}> — {r.target}</span> : null}
              </span>
              <span className="pri">{r.priority}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={`gate ${action.safetyGate.passed ? "pass" : "hold"}`} role="status">
        <div className="row">
          {action.safetyGate.passed ? "✓ SAFETY GATE PASSED" : "⏸ HELD FOR OPERATOR"}
          <span style={{ marginLeft: 6, color: "var(--text-faint)" }}>{action.status}</span>
        </div>
        {action.safetyGate.reasons.length > 0 && (
          <ul>
            {action.safetyGate.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
            {maxReco >= 2 && <li>Contains IMMEDIATE-priority actions — lock before dispatch.</li>}
          </ul>
        )}
      </div>

      <div className="card-actions">
        <button className="btn btn-ghost btn-sm" onClick={speak}>
          {speaking ? "⏹ Stop reading" : "🔊 Read briefing aloud"}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => downloadJson(action)}>
          ⤓ Export JSON
        </button>
      </div>
    </div>
  );
}
