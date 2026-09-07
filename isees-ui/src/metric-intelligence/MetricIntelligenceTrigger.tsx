import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { MetricSignificanceBriefing } from "./MetricIntelligenceTypes";
import "./MetricIntelligence.css";

export interface MetricIntelligenceTriggerProps {
  readonly briefing: MetricSignificanceBriefing;
  readonly collected: boolean;
  readonly onCollect: () => void;
}

export function MetricIntelligenceTrigger({ briefing, collected, onCollect }: MetricIntelligenceTriggerProps) {
  const [tooltip, setTooltip] = useState(false);
  const [open, setOpen] = useState(false);
  const [basis, setBasis] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const clickTimer = useRef<number | undefined>(undefined);
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltipElement = useRef<HTMLSpanElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState<CSSProperties>();
  const collectOnce = () => { if (!collected) onCollect(); };
  const clearHover = () => { if (hoverTimer.current) window.clearTimeout(hoverTimer.current); hoverTimer.current = undefined; };
  const showLater = () => { clearHover(); hoverTimer.current = window.setTimeout(() => setTooltip(true), 280); };
  const hideLater = () => { clearHover(); hoverTimer.current = window.setTimeout(() => setTooltip(false), 120); };
  const close = () => { setOpen(false); setBasis(false); window.setTimeout(() => trigger.current?.focus(), 0); };
  const handleClick = (event: MouseEvent) => { if (event.detail > 1) return; if (clickTimer.current) window.clearTimeout(clickTimer.current); clickTimer.current = window.setTimeout(() => { setOpen(true); setTooltip(false); }, 210); };
  const handleDoubleClick = (event: MouseEvent) => { event.preventDefault(); if (clickTimer.current) window.clearTimeout(clickTimer.current); clickTimer.current = undefined; collectOnce(); };
  const handleKey = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpen(true); setTooltip(false); } };
  useEffect(() => () => { clearHover(); if (clickTimer.current) window.clearTimeout(clickTimer.current); }, []);
  useLayoutEffect(() => {
    if (!tooltip) return;
    const positionTooltip = () => {
      const triggerRect = trigger.current?.getBoundingClientRect();
      const tooltipRect = tooltipElement.current?.getBoundingClientRect();
      if (!triggerRect || !tooltipRect) return;
      const margin = 8;
      const gap = 8;
      const maxLeft = Math.max(margin, window.innerWidth - tooltipRect.width - margin);
      const left = Math.min(maxLeft, Math.max(margin, triggerRect.right - tooltipRect.width));
      const roomAbove = triggerRect.top - margin;
      const roomBelow = window.innerHeight - triggerRect.bottom - margin;
      const openAbove = roomAbove >= tooltipRect.height + gap || roomAbove >= roomBelow;
      const idealTop = openAbove
        ? triggerRect.top - tooltipRect.height - gap
        : triggerRect.bottom + gap;
      const maxTop = Math.max(margin, window.innerHeight - tooltipRect.height - margin);
      setTooltipPosition({ left, top: Math.min(maxTop, Math.max(margin, idealTop)) });
    };
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
    return () => {
      window.removeEventListener("resize", positionTooltip);
      window.removeEventListener("scroll", positionTooltip, true);
    };
  }, [tooltip]);
  useEffect(() => {
    if (!open) return;
    dialog.current?.focus();
    const escape = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); close(); } };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return <span className="metric-intelligence">
    <button ref={trigger} type="button" className="metric-intelligence__trigger" aria-label={`${briefing.displayValue} topology similarity. Open metric explanation.`} aria-describedby={tooltip ? `${briefing.findingId}-tip` : undefined} onPointerEnter={showLater} onPointerLeave={hideLater} onFocus={() => setTooltip(true)} onBlur={() => setTooltip(false)} onClick={handleClick} onDoubleClick={handleDoubleClick} onKeyDown={handleKey}>{briefing.displayValue}<span aria-hidden="true"> ⓘ</span></button>
    {collected && <span className="metric-intelligence__saved" aria-label="Collected in Research Inbox">SAVED</span>}
    {tooltip && createPortal(<span ref={tooltipElement} id={`${briefing.findingId}-tip`} role="tooltip" className="metric-intelligence__tooltip" style={tooltipPosition} onPointerEnter={clearHover} onPointerLeave={hideLater}>{briefing.microBriefing}</span>, document.body)}
    {open && <div className="metric-intelligence__backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialog} className="metric-intelligence__dialog" role="dialog" aria-modal="true" aria-labelledby={`${briefing.findingId}-title`} tabIndex={-1}>
        <header><div><span>WHY IT MATTERS</span><h2 id={`${briefing.findingId}-title`}>{briefing.metricLabel} · {briefing.displayValue}</h2><p>{briefing.pairDisplay}</p></div><button type="button" onClick={close} aria-label="Close metric explanation">×</button></header>
        <div className="metric-intelligence__conversation">
          {briefing.whyItMatters.split("\n\n").map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <h3>Research question</h3><p className="metric-intelligence__question">{briefing.researchQuestion}</p>
          <h3>Plausible explanations</h3><ul>{briefing.plausibleExplanations.map(item => <li key={item}>{item}</li>)}</ul>
          <h3>Limits of this finding</h3><ul>{briefing.limitations.map(item => <li key={item}>{item}</li>)}</ul>
          <strong className="metric-intelligence__classification">{briefing.epistemicClassification}</strong>
        </div>
        <div className="metric-intelligence__actions"><button type="button" aria-expanded={basis} onClick={() => setBasis(value => !value)}>Show deterministic basis</button><button type="button" disabled={collected} onClick={collectOnce}>{collected ? "Added to Research Inbox" : "Add to Research Inbox"}</button></div>
        {basis && <DeterministicBasis briefing={briefing}/>}
      </div>
    </div>}
  </span>;
}

function DeterministicBasis({ briefing }: { briefing: MetricSignificanceBriefing }) {
  const s = briefing.source;
  return <section className="metric-intelligence__basis" aria-label="Deterministic basis"><h3>Deterministic basis</h3><dl><dt>Metric identity</dt><dd>{briefing.metricId}</dd><dt>Exact value / unit</dt><dd>{briefing.value} / PERCENT ({briefing.displayValue})</dd><dt>Case A</dt><dd>{s.endpoints[0].subjectIdentity} · {s.endpoints[0].knowledgeObjectId}</dd><dt>Case B</dt><dd>{s.endpoints[1].subjectIdentity} · {s.endpoints[1].knowledgeObjectId}</dd><dt>Evaluator</dt><dd>{s.evaluator.key}@{s.evaluator.version}</dd><dt>Normalization</dt><dd>{s.normalization.key}@{s.normalization.version}</dd><dt>Configured / participating weight</dt><dd>{s.canonicalConfiguredWeight} / {s.participatingNormalizedWeight}</dd><dt>Execution / input</dt><dd>{s.executionId} · {s.inputProjectionId}</dd><dt>Endpoint snapshots</dt><dd>{s.endpoints[0].snapshotId}<br/>{s.endpoints[1].snapshotId}</dd><dt>Briefing template</dt><dd>{briefing.templateId}/{briefing.templateVersion}</dd><dt>Epistemic classification</dt><dd>{briefing.epistemicClassification}</dd></dl>
    {s.endpoints.map(endpoint => <div key={endpoint.role}><h4>{endpoint.role} frozen topology components</h4>{endpoint.components.map(component => <p key={component.identity}><b>{component.identity}</b> {component.value}<br/><small>Sources: {component.sourceReferences.join(" · ") || "immutable endpoint projection"}</small></p>)}</div>)}
    {s.componentSimilarities && <div><h4>Retained component similarities</h4>{Object.entries(s.componentSimilarities).map(([key,value]) => <p key={key}>{key}: {value}</p>)}</div>}
    <details><summary>Raw immutable basis</summary><pre>{JSON.stringify(s, null, 2)}</pre></details>
  </section>;
}
