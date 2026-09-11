import { useEffect, useRef, useState } from "react";
import { AuthorNodeTypes, type AuthorNode, type ObservationNode, type ReferenceNode } from "../model/AuthorNodeTypes";
import { useAuthorDocument, useAuthorDocumentRuntime } from "../runtime/AuthorDocumentRuntimeContext";
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
  if ((node.type === AuthorNodeTypes.PARAGRAPH || node.type === AuthorNodeTypes.HEADING) && "section" in node && SECTIONS.includes(node.section as typeof SECTIONS[number])) return node.section as typeof SECTIONS[number];
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
  const investigation = useActiveInvestigation();
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [editingSection, setEditingSection] = useState<typeof SECTIONS[number]>();
  const [newKind, setNewKind] = useState<"HEADING" | "PARAGRAPH">("PARAGRAPH");
  const [newTextBySection, setNewTextBySection] = useState<Partial<Record<typeof SECTIONS[number], string>>>({});
  const selectedRef = useRef<HTMLElement | null>(null);

  useEffect(() => { selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [selectedNodeId]);

  if (!investigation) return <div className="author-canvas-state"><strong>No active Investigation</strong><span>Select or create an Investigation to open its isolated authoring canvas.</span></div>;
  if (!document) return <div className="author-canvas-state"><strong>No active draft</strong><span>Create or open a document from the toolbar. No sample content is shown as live research.</span></div>;

  function beginAdding(section: typeof SECTIONS[number], kind: "HEADING" | "PARAGRAPH") {
    setEditingSection(section);
    setNewKind(kind);
  }

  function addBlock(section: typeof SECTIONS[number]) {
    const text = (newTextBySection[section] ?? "").trim();
    if (!text) return;
    const node = newKind === "HEADING"
      ? { id: createId("author-heading"), type: AuthorNodeTypes.HEADING, level: 3, text, section }
      : { id: createId("author-paragraph"), type: AuthorNodeTypes.PARAGRAPH, text, section };
    runtime.insertNode(node as AuthorNode);
    setSelectedNodeId(node.id);
    setNewTextBySection(current => ({ ...current, [section]: "" }));
    setEditingSection(undefined);
  }

  return <div className="author-canvas" aria-label="Authoring Canvas">
    <div className="author-canvas__rail"><span>AUTHORING CANVAS</span><strong>{document.nodes.length} structured blocks</strong></div>
    <article className="author-paper" aria-labelledby="studio-authoring-heading">
      <header className="author-paper__header"><span>INVESTIGATION DRAFT · {investigation.id}</span><input aria-label="Document title" defaultValue={document.metadata.title} onBlur={event => runtime.updateDocumentTitle(event.currentTarget.value)} /><p>{document.metadata.description || "Structured research document · provenance remains attached to source-backed blocks."}</p></header>
      {SECTIONS.map(section => {
        const nodes = document.nodes.filter(node => sectionFor(node) === section);
        return <section className="author-section" key={section} aria-label={section}>
          <div className="author-section__label"><span>{String(SECTIONS.indexOf(section) + 1).padStart(2, "0")}</span><h2 id={section === "Abstract" ? "studio-authoring-heading" : undefined}>{section}</h2><small>{nodes.length ? `${nodes.length} block${nodes.length === 1 ? "" : "s"}` : "Ready"}</small></div>
          <div className="author-section__controls" aria-label={`Add content to ${section}`}><button type="button" onClick={() => beginAdding(section, "HEADING")}>Add heading</button><button type="button" onClick={() => beginAdding(section, "PARAGRAPH")}>Add paragraph</button></div>
          {nodes.length === 0 && editingSection !== section && <button type="button" className="author-section__empty" onClick={() => beginAdding(section, "PARAGRAPH")}>Click to begin writing</button>}
          {nodes.map(node => {
            const selected = (selectedNodeId ?? runtime.getLastInsertedNodeId()) === node.id;
            const reference = node.type === AuthorNodeTypes.REFERENCE ? node as ReferenceNode : undefined;
            const research = reference?.researchSource;
            const editableText = textOf(node);
            return <article ref={selected ? selectedRef : undefined} key={node.id} className={`author-block author-block--${reference ? "source" : "authored"}${selected ? " is-selected" : ""}`}>
              <div className="author-block__topline"><span>{nodeKind(node)}</span><code>{node.id}</code></div>
              {reference && <><h3>{reference.title}</h3>{reference.summary && <p>{reference.summary}</p>}</>}
              {editableText !== undefined && <label className="author-block__editor"><span>Edit {nodeKind(node).toLowerCase()}</span><textarea aria-label={`Edit ${nodeKind(node).toLowerCase()}`} value={editableText} onFocus={() => setSelectedNodeId(node.id)} onChange={event => runtime.updateNodeText(node.id, event.target.value)} /></label>}
              {node.type === AuthorNodeTypes.OBSERVATION && <div className="author-block__relations">Related references: {(node as ObservationNode).relatedReferences.length}</div>}
              {node.type === AuthorNodeTypes.IMAGE && <div className="author-block__placeholder">Figure · {String((node as AuthorNode & { source: string }).source)}</div>}
              {node.type === AuthorNodeTypes.TABLE && <div className="author-block__placeholder">Table · {(node as AuthorNode & { rows: number }).rows} rows</div>}
              {research && <details className="author-provenance"><summary>Inspect exact provenance</summary><dl><dt>Source identity</dt><dd>{research.sourceIdentity}</dd><dt>Workspace / kind</dt><dd>{research.sourceWorkspace} · {research.sourceKind}</dd><dt>Investigation</dt><dd>{research.sourceInvestigationId}</dd><dt>Projection</dt><dd>{research.sourceProjectionId ?? "Not supplied"}</dd><dt>Classification</dt><dd>{research.classification}</dd><dt>Insertability</dt><dd>{research.insertability.state} · {research.insertability.reason}</dd><dt>Captured representation</dt><dd><pre>{JSON.stringify(research.capturedRepresentation, null, 2)}</pre></dd></dl></details>}
              <div className="author-block__actions"><button disabled={document.nodes.indexOf(node) === 0} aria-label={`Move ${node.id} up`} onClick={() => runtime.moveNode(node.id, "UP")}>Move up</button><button disabled={document.nodes.indexOf(node) === document.nodes.length - 1} aria-label={`Move ${node.id} down`} onClick={() => runtime.moveNode(node.id, "DOWN")}>Move down</button><button className="is-remove" aria-label={`Remove ${node.id} from draft`} onClick={() => { runtime.removeNode(node.id); setSelectedNodeId(undefined); }}>Remove from draft</button></div>
            </article>;
          })}
          {editingSection === section && <form className="author-section__composer" onSubmit={event => { event.preventDefault(); addBlock(section); }}><label><span>{newKind === "HEADING" ? "Heading text" : "Paragraph text"}</span><textarea autoFocus value={newTextBySection[section] ?? ""} onChange={event => setNewTextBySection(current => ({ ...current, [section]: event.target.value }))} placeholder={newKind === "HEADING" ? "Enter a researcher-authored heading" : "Enter researcher-authored text"} /></label><div><button type="submit" disabled={!(newTextBySection[section] ?? "").trim()}>Add {newKind.toLowerCase()}</button><button type="button" onClick={() => setEditingSection(undefined)}>Cancel</button></div></form>}
        </section>;
      })}
      {document.nodes.length === 0 && <div className="author-paper__empty"><strong>Empty draft</strong><span>Add an authored section below or insert a qualified source from the Research Inbox.</span></div>}
      <footer className="author-paper__inspector-boundary">Draft content is owned by the canonical Author runtime. Artifact lifecycle and output status appear in the permanent inspector.</footer>
    </article>
  </div>;
}
