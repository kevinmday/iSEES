// ============================================================
// GraphView.tsx — INTERACTIVE (TRUE 1:1 CLICK + RESPONSIVE)
// ============================================================

import React, { useEffect, useRef } from "react";

export default function GraphView({ graph, onNodeClick }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodePositions = useRef<any>({});

  useEffect(() => {
    if (!graph || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🔥 CRITICAL: match canvas to actual display size EVERY DRAW
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const nodes = graph.nodes || [];
    const edges = graph.edges || [];

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const positioned: any = {};
    nodePositions.current = {};

    // --- layout ---
    nodes.forEach((n: any, i: number) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      positioned[n.id] = { ...n, x, y };
      nodePositions.current[n.id] = { x, y };
    });

    // --- edges ---
    ctx.strokeStyle = "#444";

    edges.forEach((e: any) => {
      const from = positioned[e.from];
      const to = positioned[e.to];
      if (!from || !to) return;

      ctx.lineWidth = Math.max(1, e.weight || 1);

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
    });

    // --- nodes ---
    nodes.forEach((n: any) => {
      const p = positioned[n.id];
      if (!p) return;

      let color = "#888";
      if (n.type === "signal") color = "#00d4ff";
      if (n.type === "relation") color = "#ffcc00";
      if (n.type === "target") color = "#00ff88";

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.fillText(n.label, p.x + 12, p.y + 4);
    });

  }, [graph]);

  // 🔥 TRUE CLICK (NO SCALING NEEDED NOW)
  const handleClick = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const id in nodePositions.current) {
      const p = nodePositions.current[id];

      const dx = x - p.x;
      const dy = y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 14) {
        console.log("CLICKED:", id);
        onNodeClick?.(id);
        break;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        width: "100%",
        height: "600px",
        background: "#0a0a0a",
        border: "1px solid #222",
        cursor: "pointer"
      }}
    />
  );
}