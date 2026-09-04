import { useEffect, useMemo, useRef, useState } from "react";
import { authorDocumentRuntime } from "../../author/runtime/AuthorDocumentRuntime";
import { useResearchBridge, useResearchDesk } from "../../research/ResearchBridgeContext";
import type { ResearchAnchor, ResearchAnchorKind, ResearchSourceWorkspace } from "../../research/researchBridgeTypes";
import { createAuthorReferenceFromResearchAnchor } from "../sources/ResearchAnchorAuthorInsertion";
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import "./StudioResearchInbox.css";

const GROUPS: readonly { title: string; kinds: readonly ResearchAnchorKind[] }[] = [
  { title: "Event / graph nodes and edges", kinds: ["GRAPH"] },
  { title: "Evidence", kinds: ["EVIDENCE_RECORD"] },
  { title: "Media", kinds: ["MEDIA"] },
  { title: "Narrative passages", kinds: ["NARRATIVE_PASSAGE"] },
  { title: "Timeline moments / correspondence", kinds: ["TIMELINE_MOMENT", "TIMELINE_CORRESPONDENCE"] },
  { title: "Compare candidates", kinds: ["COMPARE_CANDIDATE"] },
  { title: "Layers experiments", kinds: ["LAYERS_EXPERIMENT"] },
  { title: "Intention derivations / hypotheses", kinds: ["INTENTION_DERIVATION", "INTENTION_HYPOTHESIS"] },
];

const WORKSPACES: readonly ResearchSourceWorkspace[] = ["MANIFOLD", "COMPARE", "LAYERS", "EVIDENCE", "MEDIA", "NARRATIVE", "TIMELINE", "INTENTION"];
const KINDS = GROUPS.flatMap(group => group.kinds);

function warningFor(anchor: ResearchAnchor): string | undefined {
  if (anchor.kind === "COMPARE_CANDIDATE") return "Candidate source — noncanonical and inspection only.";
  if (anchor.kind === "LAYERS_EXPERIMENT") return "Experimental source — no canonical relationship was created.";
  if (anchor.insertability.state === "INSPECTION_ONLY") return anchor.insertability.reason;
  const text = `${anchor.display.title} ${anchor.display.summary}`.toLocaleLowerCase();
  if (text.includes("unavailable")) return "Source includes unavailable material.";
  if (text.includes("theoretical")) return "Theoretical source.";
  return undefined;
}

export default function StudioResearchInbox() {
  const runtime = useResearchBridge();
  useResearchDesk();
  const investigation = useActiveInvestigation();
  const investigationId = investigation?.id;
  const previousInvestigationId = useRef(investigationId);
  const [selectedAnchorId, setSelectedAnchorId] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceWorkspace, setSourceWorkspace] = useState<ResearchSourceWorkspace>();
  const [sourceKind, setSourceKind] = useState<ResearchAnchorKind>();
  const [insertableOnly, setInsertableOnly] = useState(false);
  const [pinnedFirst, setPinnedFirst] = useState(true);
  const [notice, setNotice] = useState<string>();

  useEffect(() => {
    if (previousInvestigationId.current !== investigationId) {
      setSelectedAnchorId(undefined);
      setNotice(undefined);
      previousInvestigationId.current = investigationId;
    }
  }, [investigationId]);

  const projection = runtime.projectInvestigation({ investigationId, selectedAnchorId, searchQuery, sourceWorkspace, sourceKind, insertableOnly, pinnedFirst });
  const unfiltered = runtime.projectInvestigation({ investigationId });
  const selected = projection.entries.find(entry => entry.anchor.anchorId === projection.selectedAnchorId)?.anchor;
  const filtersActive = Boolean(searchQuery.trim() || sourceWorkspace || sourceKind || insertableOnly || !pinnedFirst);
  const grouped = useMemo(() => GROUPS.map(group => ({ ...group, entries: projection.entries.filter(entry => group.kinds.includes(entry.anchor.kind)) })).filter(group => group.entries.length), [projection.entries]);

  function clearFilters() {
    setSearchQuery(""); setSourceWorkspace(undefined); setSourceKind(undefined); setInsertableOnly(false); setPinnedFirst(true);
  }

  function removeSelected() {
    if (!selected || selected.investigationId !== investigationId) return;
    runtime.removeAnchor(selected.anchorId);
    setSelectedAnchorId(undefined);
    setNotice("Selected source removed from this Investigation’s Research Inbox. Canonical source material was not deleted.");
  }

  function insertSelected() {
    if (!selected || selected.investigationId !== investigationId || selected.insertability.state !== "INSERTABLE") return;
    const result = authorDocumentRuntime.insertNode(createAuthorReferenceFromResearchAnchor(selected, `research-reference:${selected.anchorId}`));
    if (result === "INSERTED") setNotice(`Inserted “${selected.display.title}” into the draft with its exact source provenance.`);
    else if (result === "DUPLICATE") setNotice(`“${selected.display.title}” is already in this draft. The existing source-backed block was selected.`);
    else if (result === "NO_ACTIVE_DOCUMENT") setNotice("Create or open a draft before inserting this source.");
    else setNotice("Insertion blocked because the source belongs to another active Investigation.");
  }

  return <aside className="studio-research-inbox" aria-label="STUDIO Research Inbox" data-permanent="true">
    <header className="studio-research-inbox__header">
      <div><span className="studio-research-inbox__eyebrow">STUDIO</span><h2>Research Inbox</h2></div>
      <span className="studio-research-inbox__count">{unfiltered.entries.length}</span>
    </header>

    <div className="studio-research-inbox__controls">
      <label className="studio-research-inbox__search"><span>Search sources</span><input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Title, summary, identity, workspace or kind" /></label>
      <div className="studio-research-inbox__filter-row">
        <select aria-label="Source workspace" value={sourceWorkspace ?? ""} onChange={event => setSourceWorkspace((event.target.value || undefined) as ResearchSourceWorkspace | undefined)}><option value="">All workspaces</option>{WORKSPACES.map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Source kind" value={sourceKind ?? ""} onChange={event => setSourceKind((event.target.value || undefined) as ResearchAnchorKind | undefined)}><option value="">All kinds</option>{KINDS.map(value => <option key={value}>{value}</option>)}</select>
      </div>
      <div className="studio-research-inbox__toggles">
        <label><input type="checkbox" checked={insertableOnly} onChange={event => setInsertableOnly(event.target.checked)} /> Insertable only</label>
        <label><input type="checkbox" checked={pinnedFirst} onChange={event => setPinnedFirst(event.target.checked)} /> Pinned first</label>
        <button type="button" onClick={clearFilters} disabled={!filtersActive}>Clear</button>
      </div>
    </div>

    {notice && <div className="studio-research-inbox__notice" role="status">{notice}</div>}

    <div className="studio-research-inbox__list">
      {projection.status === "NO_ACTIVE_INVESTIGATION" && <div className="studio-research-inbox__empty"><strong>No active Investigation.</strong><span>Select or create an Investigation to view its collected research.</span></div>}
      {projection.status === "AVAILABLE" && unfiltered.entries.length === 0 && <div className="studio-research-inbox__empty"><strong>No collected sources.</strong><span>This Investigation’s Research Inbox is ready for sources.</span></div>}
      {projection.status === "AVAILABLE" && unfiltered.entries.length > 0 && projection.entries.length === 0 && <div className="studio-research-inbox__empty"><strong>No matching sources.</strong><span>Clear or adjust the current search and filters.</span></div>}
      {grouped.map(group => <section key={group.title} className="studio-research-inbox__group"><h3>{group.title}<span>{group.entries.length}</span></h3>{group.entries.map(({ anchor }) => {
        const selectedCard = anchor.anchorId === projection.selectedAnchorId;
        const warning = warningFor(anchor);
        return <article key={anchor.anchorId} className={`studio-research-card${selectedCard ? " studio-research-card--selected" : ""}`}>
          <button className="studio-research-card__select" type="button" aria-pressed={selectedCard} aria-label={`Select ${anchor.display.title}`} onClick={() => { setSelectedAnchorId(anchor.anchorId); setNotice(undefined); }}>
            <span className="studio-research-card__meta">{anchor.sourceWorkspace} · {anchor.kind.replaceAll("_", " ")}</span>
            <strong>{anchor.display.title}</strong><span>{anchor.display.summary}</span>
            <span className="studio-research-card__identity">{anchor.sourceIdentity}</span>
          </button>
          <div className="studio-research-card__badges"><span>{anchor.classification.replaceAll("_", " ")}</span><span className={anchor.insertability.state === "INSERTABLE" ? "is-insertable" : "is-inspection"}>{anchor.insertability.state === "INSERTABLE" ? "INSERTABLE" : "INSPECTION ONLY"}</span>{anchor.pinned && <span>PINNED</span>}</div>
          {warning && <div className="studio-research-card__warning">{warning}</div>}
        </article>;
      })}</section>)}
    </div>

    <footer className="studio-research-inbox__detail">
      {selected ? <>
        <div className="studio-research-inbox__selected"><span>Selected source</span><strong>{selected.display.title}</strong></div>
        {selected.insertability.state === "INSPECTION_ONLY" && <div className="studio-research-inbox__disabled-reason">Inspection only: {selected.insertability.reason}</div>}
        <div className="studio-research-inbox__actions"><button type="button" onClick={() => runtime.pinAnchor(selected.anchorId, !selected.pinned)}>{selected.pinned ? "Unpin" : "Pin"}</button><button className="studio-research-inbox__remove" type="button" aria-label={`Remove ${selected.display.title} from this Investigation's Research Inbox`} onClick={removeSelected}>Remove source</button></div>
      </> : <div className="studio-research-inbox__selected-empty">Select one source to inspect or insert.</div>}
      <button className="studio-research-inbox__insert" type="button" disabled={!selected || selected.insertability.state !== "INSERTABLE"} aria-describedby="studio-insert-reason" onClick={insertSelected}>Insert into Draft</button>
      {(!selected || selected.insertability.state !== "INSERTABLE") && <div id="studio-insert-reason" className="studio-research-inbox__disabled-reason">{selected ? `Insertion unavailable: ${selected.insertability.reason}` : "Insertion unavailable: select a source first."}</div>}
    </footer>
  </aside>;
}
