"use client";

/**
 * HERALD Force-Directed Graph Engine
 * Zero external dependencies — pure Canvas rendering.
 * Renders entity relationships for emergency incidents.
 */

export interface GNode {
  id: string;
  label: string;
  type: string;
  size?: number;
  color?: string;
  /** computed by simulation */
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

export interface GEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface GraphData {
  nodes: { id: string; label: string; type: string; size?: number; color?: string }[];
  edges: GEdge[];
}

const TYPE_COLORS: Record<string, string> = {
  incident: "#ff5c6c",
  person: "#3cc2ff",
  location: "#3ddc97",
  infrastructure: "#ffb454",
  agency: "#7f6bff",
  vehicle: "#f472b6",
  condition: "#facc15",
};

const TYPE_SIZES: Record<string, number> = {
  incident: 28,
  person: 18,
  location: 22,
  infrastructure: 20,
  agency: 20,
  vehicle: 16,
  condition: 16,
};

export function buildGraph(data: GraphData): GNode[] {
  const cx = 300;
  const cy = 220;
  return data.nodes.map((n, i) => {
    const angle = (i / data.nodes.length) * Math.PI * 2;
    const r = 100 + Math.random() * 60;
    return {
      ...n,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
  });
}

function tick(nodes: GNode[], edges: GEdge[], width: number, height: number) {
  const alpha = 0.3;
  const repulsion = 3200;
  const attraction = 0.006;
  const centerPull = 0.01;
  const damping = 0.85;
  const cx = width / 2;
  const cy = height / 2;

  // Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      let force = (repulsion * alpha) / (dist * dist);
      let fx = (dx / dist) * force;
      let fy = (dy / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Attraction along edges
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const s = nodeMap.get(e.source);
    const t = nodeMap.get(e.target);
    if (!s || !t) continue;
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const w = (e.weight ?? 1) * attraction * alpha;
    s.vx += dx * w;
    s.vy += dy * w;
    t.vx -= dx * w;
    t.vy -= dy * w;
  }

  // Center gravity
  for (const n of nodes) {
    n.vx += (cx - n.x) * centerPull * alpha;
    n.vy += (cy - n.y) * centerPull * alpha;
  }

  // Apply velocity
  const pad = 40;
  for (const n of nodes) {
    if (n.fx !== undefined) { n.x = n.fx; n.vx = 0; }
    else {
      n.vx *= damping;
      n.vy *= damping;
      n.x += n.vx;
      n.y += n.vy;
    }
    n.x = Math.max(pad, Math.min(width - pad, n.x));
    n.y = Math.max(pad, Math.min(height - pad, n.y));
  }
}

export function renderGraph(
  ctx: CanvasRenderingContext2D,
  data: GraphData,
  width: number,
  height: number,
  hover: string | null
) {
  const nodes = buildGraph(data);

  // Run simulation
  for (let i = 0; i < 120; i++) {
    tick(nodes, data.edges, width, height);
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const dpr = window.devicePixelRatio || 1;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Draw edges
  ctx.lineWidth = 1.5;
  for (const e of data.edges) {
    const s = nodeMap.get(e.source);
    const t = nodeMap.get(e.target);
    if (!s || !t) continue;

    const isHovered = hover === e.source || hover === e.target;

    ctx.strokeStyle = isHovered ? "rgba(60,194,255,0.7)" : "rgba(60,194,255,0.2)";
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();

    // Edge label
    if (e.label) {
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      ctx.fillStyle = isHovered ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)";
      ctx.font = "600 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(e.label, mx, my - 8);
    }
  }

  // Draw nodes
  for (const n of nodes) {
    const sz = n.size ?? TYPE_SIZES[n.type] ?? 18;
    const col = n.color ?? TYPE_COLORS[n.type] ?? "#6b7c96";
    const isHover = hover === n.id;
    const r = isHover ? sz + 4 : sz;

    // Glow
    if (isHover) {
      ctx.shadowColor = col;
      ctx.shadowBlur = 18;
    }

    // Circle
    ctx.beginPath();
    ctx.arc(n.x, n.y, r / 2, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.globalAlpha = isHover ? 1 : 0.85;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Border
    ctx.strokeStyle = isHover ? "#fff" : "rgba(255,255,255,0.2)";
    ctx.lineWidth = isHover ? 2 : 1;
    ctx.stroke();

    // Label
    ctx.fillStyle = isHover ? "#fff" : "rgba(255,255,255,0.7)";
    ctx.font = `${isHover ? "700" : "600"} ${isHover ? 12 : 10}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const labelY = n.y + r / 2 + 6;
    ctx.fillText(n.label, n.x, labelY);
  }

  ctx.restore();
}

export function hitTest(
  nodes: GNode[],
  mx: number,
  my: number
): string | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    const sz = (n.size ?? TYPE_SIZES[n.type] ?? 18) / 2 + 6;
    const dx = mx - n.x;
    const dy = my - n.y;
    if (dx * dx + dy * dy < sz * sz) return n.id;
  }
  return null;
}
