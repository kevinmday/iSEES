import type { GuestDiscoveryPreview } from "../../evidence/candidates/GuestDiscoveryPreview";
import type { GraphNode } from "../graphTypes";

export function guestDiscoveryOverlayPosition(preview: GuestDiscoveryPreview, nodes: readonly GraphNode[]) {
  const target = nodes.find(node => node.id === preview.target.id);
  if (!target) return undefined;
  const targetX = target.x ?? 0;
  const targetY = target.y ?? 0;
  const candidates = [{ dx: 96, dy: -72 }, { dx: -96, dy: -72 }, { dx: 96, dy: 72 }, { dx: -96, dy: 72 }];
  const bounds = nodes.reduce((value, node) => ({ minX: Math.min(value.minX, node.x ?? 0), maxX: Math.max(value.maxX, node.x ?? 0), minY: Math.min(value.minY, node.y ?? 0), maxY: Math.max(value.maxY, node.y ?? 0) }), { minX: targetX, maxX: targetX, minY: targetY, maxY: targetY });
  const score = ({ dx, dy }: { dx: number; dy: number }) => {
    const x = targetX + dx, y = targetY + dy;
    const nearest = Math.min(...nodes.filter(node => node.id !== target.id).map(node => Math.hypot(x - (node.x ?? 0), y - (node.y ?? 0))), 240);
    const overflow = Math.max(0, bounds.minX - 105 - x) + Math.max(0, x - bounds.maxX - 105) + Math.max(0, bounds.minY - 105 - y) + Math.max(0, y - bounds.maxY - 105);
    return nearest - overflow * 4;
  };
  const offset = candidates.reduce((best, candidate) => score(candidate) > score(best) ? candidate : best);
  return { target, x: targetX + offset.dx, y: targetY + offset.dy };
}

export default function GuestDiscoveryManifoldOverlay({ preview, nodes, selection, onSelect }: { readonly preview: GuestDiscoveryPreview; readonly nodes: readonly GraphNode[]; readonly selection?: "NODE" | "EDGE"; readonly onSelect: (kind: "NODE" | "EDGE") => void }) {
  const position = guestDiscoveryOverlayPosition(preview, nodes);
  if (!position) return null;
  return <g data-testid="guest-discovery-manifold-overlay" aria-label="Provisional Guest discovery overlay">
    <g role="button" tabIndex={0} aria-label={`PROVISIONAL CONNECTION ${preview.relationship} to ${preview.target.label}`} onClick={event => { event.stopPropagation(); onSelect("EDGE"); }}>
      <title>{`PROVISIONAL CONNECTION — ${preview.relationship}. Proposed by ${preview.proposedBy}. No governed graph effect.`}</title>
      <line x1={position.x} y1={position.y} x2={position.target.x ?? 0} y2={position.target.y ?? 0} stroke={selection === "EDGE" ? "#fde68a" : "#f59e0b"} strokeWidth={selection === "EDGE" ? 4 : 2.5} strokeDasharray="9 7" />
      <text data-testid="guest-discovery-connection-label" x={(position.x + (position.target.x ?? 0)) / 2} y={(position.y + (position.target.y ?? 0)) / 2 - 12} fill="#fbbf24" stroke="#1c1203" strokeWidth="3" paintOrder="stroke" fontSize="10" textAnchor="middle">PROPOSED · {preview.relationship}</text>
    </g>
    <g role="button" tabIndex={0} aria-label={`PROVISIONAL METADATA REFERENCE ${preview.lead.result.title}`} transform={`translate(${position.x}, ${position.y})`} onClick={event => { event.stopPropagation(); onSelect("NODE"); }}>
      <title>{`PROVISIONAL METADATA REFERENCE — ${preview.lead.result.title}. Page not acquired or inspected.`}</title>
      <circle r={selection === "NODE" ? 24 : 20} fill="rgba(120,53,15,.94)" stroke="#fbbf24" strokeWidth={selection === "NODE" ? 4 : 2} strokeDasharray="5 4" />
      <text y="4" fill="#fef3c7" fontSize="15" fontWeight="700" textAnchor="middle">?</text>
      <text data-testid="guest-discovery-node-label" y="38" fill="#fde68a" stroke="#1c1203" strokeWidth="3" paintOrder="stroke" fontSize="10" fontWeight="700" textAnchor="middle">GUEST · PROVISIONAL</text>
      <text y="52" fill="#fbbf24" stroke="#1c1203" strokeWidth="3" paintOrder="stroke" fontSize="9" textAnchor="middle">METADATA REFERENCE</text>
    </g>
  </g>;
}

export function GuestDiscoverySelectionDetail({ preview, selection }: { readonly preview: GuestDiscoveryPreview; readonly selection: "NODE" | "EDGE" }) {
  return <aside aria-label="Provisional Guest discovery selection detail" style={{ position:"absolute", right:12, bottom:12, zIndex:30, width:330, padding:12, border:"2px dashed #f59e0b", borderRadius:8, background:"rgba(30,20,5,.96)", color:"#fef3c7", pointerEvents:"auto", fontSize:11 }}>
    <strong style={{ display:"block", color:"#fbbf24", letterSpacing:".08em" }}>{selection === "NODE" ? "PROVISIONAL METADATA REFERENCE" : "PROPOSED CONNECTION"}</strong>
    <dl style={{ display:"grid", gridTemplateColumns:"88px 1fr", gap:5, overflowWrap:"anywhere" }}><dt>Proposed by</dt><dd>{preview.proposedBy}</dd><dt>Connection</dt><dd>{preview.relationship} → {preview.target.label}</dd><dt>Query</dt><dd>{preview.lead.query}</dd><dt>Source</dt><dd>{preview.lead.provider} · {preview.lead.result.attribution}</dd><dt>Locator</dt><dd>{preview.lead.result.providerReturnedUrl}</dd><dt>Acquisition</dt><dd>PAGE NOT ACQUIRED OR INSPECTED</dd><dt>Authority</dt><dd>DISPOSABLE GUEST OVERLAY · GOVERNED GRAPH EFFECT NONE</dd></dl>
  </aside>;
}
