import { useEffect, useRef, useState } from "react";
import { AuthorNodeTypes, type AuthorNode, type HeadingNode, type ObservationNode, type ReferenceNode } from "../model/AuthorNodeTypes";
import { useAuthorDocument, useAuthorDocumentRevision, useAuthorDocumentRuntime } from "../runtime/AuthorDocumentRuntimeContext";
import { useActiveInvestigation } from "../../workspace/runtime/WorkspaceRuntimeContext";
import "./AuthorEditorSurface.css";

const SECTIONS = ["Abstract", "Research Question", "Hypothesis / H0 / H1", "Method", "Evidence", "Analysis", "Figures / Tables", "Conclusion", "References / Footnotes"] as const;
function nodeKind(node: AuthorNode): string {
  if (node.type === AuthorNodeTypes.REFERENCE) return "SOURCE-BACKED EVIDENCE";
  if (node.type === AuthorNodeTypes.IMAGE) return "FIGURE";
  if (node.type === AuthorNodeTypes.TABLE) return "TABLE";
  if (node.type === AuthorNodeTypes.CITATION) return "PROVENANCE CITATION";
  if (node.type === AuthorNodeTypes.CUSTOM) return "EQUATION";
  if (node.type === AuthorNodeTypes.OBSERVATION) return "AUTHORED OBSERVATION";
  return "AUTHORED NARRATIVE";
}
function sectionFor(node: AuthorNode): typeof SECTIONS[number] {
  if (node.type === AuthorNodeTypes.PARAGRAPH && "section" in node && SECTIONS.includes(node.section as typeof SECTIONS[number])) return node.section as typeof SECTIONS[number];
  if (node.type === AuthorNodeTypes.REFERENCE) return "Evidence";
  if (node.type === AuthorNodeTypes.IMAGE || node.type === AuthorNodeTypes.TABLE || node.type === AuthorNodeTypes.CUSTOM) return "Figures / Tables";
  if (node.type === AuthorNodeTypes.CITATION) return "References / Footnotes";
  return "Analysis";
}
function textOf(node: AuthorNode): string | undefined { return "text" in node && typeof node.text === "string" ? node.text : undefined; }
function createId(prefix: string): string { return `${prefix}:${typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now()}`; }

export default function AuthorEditorSurface() {
  const document = useAuthorDocument();
  const runtime = useAuthorDocumentRuntime();
  const revision = useAuthorDocumentRevision();
  const investigation = useActiveInvestigation();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [newSection, setNewSection] = useState<typeof SECTIONS[number]>("Analysis");
  const [newText, setNewText] = useState("");
  const selectedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const inserted = runtime.getLastInsertedNodeId();
    if (inserted && document?.nodes.some(node => node.id === inserted)) setSelectedNodeId(inserted);
  }, [document, revision, runtime]);
  useEffect(() => { selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [selectedNodeId]);

  if (!investigation) return <div className="author-canvas-state"><strong>No active Investigation</strong><span>Select or create an Investigation to open its isolated authoring canvas.</span></div>;
  if (!document) return <div className="author-canvas-state"><strong>No active draft</strong><span>Create or open a document from the toolbar. No sample content is shown as live research.</span></div>;

  function addSection() {
    const text = newText.trim();
    if (!text) return;
    runtime.insertNode({ id: createId("author-paragraph"), type: AuthorNodeTypes.PARAGRAPH, text, section: newSection } as AuthorNode);
    setNewText("");
  }

  return <div className="author-canvas" aria-label="Authoring Canvas">
    <div className="author-canvas__rail"><span>AUTHORING CANVAS</span><strong>{document.nodes.length} structured blocks</strong></div>
    <article className="author-paper">
      <header className="author-paper__header"><span>INVESTIGATION DRAFT · {investigation.id}</span><input aria-label="Document title" defaultValue={document.metadata.title} onBlur={event => runtime.updateDocumentTitle(event.currentTarget.value)} /><p>{document.metadata.description || "Structured research document · provenance remains attached to source-backed blocks."}</p></header>
      {SECTIONS.map(section => {
        const nodes = document.nodes.filter(node => sectionFor(node) === section && !(node.type === AuthorNodeTypes.HEADING && (node as HeadingNode).text !== section));
        return <section className="author-section" key={section} aria-label={section}>
          <div className="author-section__label"><span>{String(SECTIONS.indexOf(section) + 1).padStart(2, "0")}</span><h2>{section}</h2><small>{nodes.length ? `${nodes.length} block${nodes.length === 1 ? "" : "s"}` : "Ready"}</small></div>
          {nodes.length === 0 && <div className="author-section__empty">No authored material in this section.</div>}
          {nodes.map(node => {
            const selected = selectedNodeId === node.id;
            const reference = node.type === AuthorNodeTypes.REFERENCE ? node as ReferenceNode : undefined;
            const research = reference?.researchSource;
            const editableText = textOf(node);
            return <article ref={selected ? selectedRef : undefined} tabIndex={0} aria-selected={selected} key={node.id} className={`author-block author-block--${reference ? "source" : "authored"}${selected ? " is-selected" : ""}`} onClick={() => setSelectedNodeId(node.id)}>
              <div className="author-block__topline"><span>{nodeKind(node)}</span><code>{node.id}</code></div>
              {reference && <><h3>{reference.title}</h3>{reference.summary && <p>{reference.summary}</p>}</>}
              {editableText !== undefined && <textarea aria-label={`Edit ${nodeKind(node).toLowerCase()}`} value={editableText} onChange={event => runtime.updateNodeText(node.id, event.target.value)} />}
              {node.type === AuthorNodeTypes.OBSERVATION && <div className="author-block__relations">Related references: {(node as ObservationNode).relatedReferences.length}</div>}
              {node.type === AuthorNodeTypes.IMAGE && <div className="author-block__placeholder">Figure · {String((node as AuthorNode & { source: string }).source)}</div>}
              {node.type === AuthorNodeTypes.TABLE && <div className="author-block__placeholder">Table · {(node as AuthorNode & { rows: number }).rows} rows</div>}
              {research && <details className="author-provenance"><summary>Inspect exact provenance</summary><dl><dt>Source identity</dt><dd>{research.sourceIdentity}</dd><dt>Workspace / kind</dt><dd>{research.sourceWorkspace} · {research.sourceKind}</dd><dt>Investigation</dt><dd>{research.sourceInvestigationId}</dd><dt>Projection</dt><dd>{research.sourceProjectionId ?? "Not supplied"}</dd><dt>Classification</dt><dd>{research.classification}</dd><dt>Insertability</dt><dd>{research.insertability.state} · {research.insertability.reason}</dd><dt>Captured representation</dt><dd><pre>{JSON.stringify(research.capturedRepresentation, null, 2)}</pre></dd></dl></details>}
              {selected && <div className="author-block__actions"><button disabled={document.nodes.indexOf(node) === 0} onClick={() => runtime.moveNode(node.id, "UP")}>Move up</button><button disabled={document.nodes.indexOf(node) === document.nodes.length - 1} onClick={() => runtime.moveNode(node.id, "DOWN")}>Move down</button><button className="is-remove" onClick={() => { runtime.removeNode(node.id); setSelectedNodeId(undefined); }}>Remove from draft</button></div>}
            </article>;
          })}
        </section>;
      })}
      {document.nodes.length === 0 && <div className="author-paper__empty"><strong>Empty draft</strong><span>Add an authored section below or insert a qualified source from the Research Inbox.</span></div>}
      <section className="author-composer" aria-label="New authored text section"><div><span>NEW AUTHORED SECTION</span><h2>Extend the draft</h2></div><select value={newSection} onChange={event => setNewSection(event.target.value as typeof newSection)}>{SECTIONS.map(section => <option key={section}>{section}</option>)}</select><textarea value={newText} onChange={event => setNewText(event.target.value)} placeholder="Write researcher-authored narrative…" /><button disabled={!newText.trim()} onClick={addSection}>Insert section</button></section>
      <footer className="author-paper__inspector-boundary">Artifact Inspector reserved for the next production cycle.</footer>
    </article>
  </div>;
}
