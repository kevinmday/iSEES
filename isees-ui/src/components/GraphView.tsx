// ============================================================
// GraphView.tsx — INTERACTIVE + PATH HIGHLIGHTING (Phase 6A)
// TS STRICT MODE FIXED
// FULL DROP-IN REPLACEMENT
// ============================================================

import { useEffect, useRef, useState } from "react";

export default function GraphView({
  graph,
  onNodeClick,
}: any) {

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const nodePositions =
    useRef<any>({});

  const [
    activeNode,
    setActiveNode,
  ] =
    useState<string | null>(
      null
    );

  useEffect(() => {

    if (
      !graph ||
      !canvasRef.current
    ) {
      return;
    }

    const canvas =
      canvasRef.current;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // ========================================================
    // MATCH DISPLAY SIZE
    // ========================================================

    const rect =
      canvas.getBoundingClientRect();

    canvas.width =
      rect.width;

    canvas.height =
      rect.height;

    const width =
      canvas.width;

    const height =
      canvas.height;

    ctx.clearRect(
      0,
      0,
      width,
      height
    );

    const nodes =
      graph.nodes || [];

    const edges =
      graph.edges || [];

    const centerX =
      width / 2;

    const centerY =
      height / 2;

    const radius =
      Math.min(
        width,
        height
      ) / 3;

    const positioned: any = {};

    nodePositions.current = {};

    // ========================================================
    // LAYOUT
    // ========================================================

    nodes.forEach(
      (
        n: any,
        i: number
      ) => {

        const angle =
          (i / nodes.length)
          *
          Math.PI
          *
          2;

        const x =
          centerX
          +
          Math.cos(angle)
          *
          radius;

        const y =
          centerY
          +
          Math.sin(angle)
          *
          radius;

        positioned[n.id] = {
          ...n,
          x,
          y,
        };

        nodePositions.current[n.id] = {
          x,
          y,
        };
      }
    );

    // ========================================================
    // CONNECTION SET
    // ========================================================

    const connected =
      new Set<string>();

    if (activeNode) {

      connected.add(
        activeNode
      );

      edges.forEach(
        (e: any) => {

          const src =
            e.from || e.source;

          const tgt =
            e.to || e.target;

          if (
            src === activeNode ||
            tgt === activeNode
          ) {

            connected.add(src);

            connected.add(tgt);
          }
        }
      );
    }

    // ========================================================
    // EDGES
    // ========================================================

    edges.forEach(
      (e: any) => {

        const src =
          e.from || e.source;

        const tgt =
          e.to || e.target;

        const from =
          positioned[src];

        const to =
          positioned[tgt];

        if (!from || !to) {
          return;
        }

        const isActive =
          !activeNode ||
          (
            connected.has(src)
            &&
            connected.has(tgt)
          );

        ctx.globalAlpha =
          isActive
            ? 1
            : 0.08;

        ctx.lineWidth =
          isActive
            ? Math.max(
                2,
                e.weight || 1
              )
            : 1;

        ctx.strokeStyle =
          isActive
            ? "#7fb3ff"
            : "#333";

        ctx.beginPath();

        ctx.moveTo(
          from.x,
          from.y
        );

        ctx.lineTo(
          to.x,
          to.y
        );

        ctx.stroke();
      }
    );

    // ========================================================
    // NODES
    // ========================================================

    nodes.forEach(
      (n: any) => {

        const p =
          positioned[n.id];

        if (!p) {
          return;
        }

        const isActive =
          !activeNode ||
          connected.has(n.id);

        ctx.globalAlpha =
          isActive
            ? 1
            : 0.15;

        let color = "#888";

        if (
          n.type === "signal"
        ) {
          color = "#00d4ff";
        }

        if (
          n.type === "relation"
        ) {
          color = "#ffcc00";
        }

        if (
          n.type === "target"
        ) {
          color = "#00ff88";
        }

        // ====================================================
        // ACTIVE NODE
        // ====================================================

        if (
          n.id === activeNode
        ) {
          color = "#00ffd0";
        }

        ctx.fillStyle = color;

        ctx.beginPath();

        ctx.arc(
          p.x,
          p.y,
          10,
          0,
          2 * Math.PI
        );

        ctx.fill();

        ctx.fillStyle =
          "#ffffff";

        ctx.font =
          "12px sans-serif";

        ctx.fillText(
          n.label,
          p.x + 12,
          p.y + 4
        );
      }
    );

    ctx.globalAlpha = 1;

  }, [
    graph,
    activeNode,
  ]);

  // ==========================================================
  // CLICK HANDLER
  // ==========================================================

  const handleClick = (
    e: React.MouseEvent<HTMLCanvasElement>
  ) => {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const rect =
      canvas.getBoundingClientRect();

    const x =
      e.clientX - rect.left;

    const y =
      e.clientY - rect.top;

    for (const id in nodePositions.current) {

      const p =
        nodePositions.current[id];

      const dx =
        x - p.x;

      const dy =
        y - p.y;

      const dist =
        Math.sqrt(
          dx * dx + dy * dy
        );

      if (dist < 14) {

        console.log(
          "CLICKED:",
          id
        );

        setActiveNode(id);

        onNodeClick?.(id);

        return;
      }
    }

    // ========================================================
    // RESET
    // ========================================================

    setActiveNode(null);
  };

  return (

    <canvas
      ref={canvasRef}

      onClick={handleClick}

      style={{

        width: "100%",

        height: "600px",

        background: "#0a0a0a",

        border:
          "1px solid #222",

        cursor: "pointer",
      }}
    />
  );
}