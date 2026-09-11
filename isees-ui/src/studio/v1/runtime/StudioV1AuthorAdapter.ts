import type { ComputationalAuthorDocument } from "../../../author/model/AuthorDocument.ts";
import { AuthorNodeTypes, type AuthorNode, type ReferenceNode } from "../../../author/model/AuthorNodeTypes.ts";
import type { FrozenResearchSourceSnapshot, SemanticDocument, SemanticNode } from "../../contracts/StudioV1Contract.ts";
import { canonicalSerialize, canonicalSha256, validateSemanticDocument, validateSnapshot } from "../../contracts/StudioCanonicalSerialization.ts";

export class StudioV1AdaptationError extends Error {}
export interface AdaptationIdentity { readonly snapshotId: string; readonly capturedAt: string }
export interface StudioV1Adaptation { readonly semanticContent: SemanticDocument; readonly snapshots: readonly FrozenResearchSourceSnapshot[] }
const nodeText = (node: AuthorNode): string | undefined => "text" in node && typeof node.text === "string" ? node.text.trim() : undefined;

export function adaptAuthorDocument(document: ComputationalAuthorDocument, investigationId: string, identity: AdaptationIdentity): StudioV1Adaptation {
  const title = document.metadata.title.trim();
  if (!title) throw new StudioV1AdaptationError("A document title is required before saving.");
  const references = document.nodes.filter((node): node is ReferenceNode => node.type === AuthorNodeTypes.REFERENCE && Boolean((node as ReferenceNode).researchSource));
  for (const reference of references) if (reference.researchSource!.sourceInvestigationId !== investigationId) throw new StudioV1AdaptationError("This draft contains a source from another Investigation and cannot be saved.");
  const anchorIds = references.map(node => node.researchSource!.anchorId);
  if (new Set(anchorIds).size !== anchorIds.length) throw new StudioV1AdaptationError("The draft contains duplicate source identities.");
  const nodes = document.nodes.flatMap<SemanticNode>(node => {
    const value = nodeText(node);
    if ((node.type === AuthorNodeTypes.HEADING || node.type === AuthorNodeTypes.PARAGRAPH || node.type === AuthorNodeTypes.OBSERVATION || node.type === AuthorNodeTypes.QUOTE) && !value) return [];
    if (node.type === AuthorNodeTypes.HEADING && value) return [{ id: node.id, type: "HEADING", level: Math.max(1, Math.min(6, Number((node as AuthorNode & { level?: number }).level) || 1)), text: value } satisfies SemanticNode];
    if (node.type === AuthorNodeTypes.PARAGRAPH && value) return [{ id: node.id, type: "PARAGRAPH", text: value } satisfies SemanticNode];
    if (node.type === AuthorNodeTypes.OBSERVATION && value) {
      const related = (node as AuthorNode & { relatedReferences?: string[] }).relatedReferences ?? [];
      const sourceSnapshotIds = references.some(ref => related.includes(ref.targetId) || related.includes(ref.id)) ? [identity.snapshotId] : [];
      return [{ id: node.id, type: "CLAIM", text: value, sourceSnapshotIds, supportState: sourceSnapshotIds.length ? "SUPPORTED" : "UNSUPPORTED" } satisfies SemanticNode];
    }
    if (node.type === AuthorNodeTypes.QUOTE && value) return [{ id: node.id, type: "RESEARCHER_NOTE", text: `Quotation (citation metadata incomplete): ${value}` } satisfies SemanticNode];
    if (node.type === AuthorNodeTypes.REFERENCE) { const ref=node as ReferenceNode; return [{ id: node.id, type: "RESEARCHER_NOTE", text: [ref.title,ref.summary].filter(Boolean).join(" — ") || ref.targetId } satisfies SemanticNode]; }
    throw new StudioV1AdaptationError(`The ${node.type} block “${node.id}” is not yet supported by the live Investigation Report saver.`);
  });
  if (!nodes.length) throw new StudioV1AdaptationError("Add at least one authored or source-backed block before saving.");
  const semanticContent: SemanticDocument = Object.freeze({ documentId: document.identity.id, schemaVersion: "studio-author-semantic/v1", title, nodeOrder: Object.freeze(nodes.map(node => node.id)), nodes: Object.freeze(nodes), citations: Object.freeze([]), citationStyle: Object.freeze({ style: "APA", styleVersion: "studio-v1-apa/1", locale: "en-US" }) });
  validateSemanticDocument(semanticContent);
  const snapshots: FrozenResearchSourceSnapshot[]=[];
  if(references.length){const sources=references.map(reference=>{const source=reference.researchSource!;const content=canonicalSerialize(source.capturedRepresentation);const sourceClassification=source.classification==="CANONICAL"?"CANONICAL" as const:source.classification==="RESEARCHER_GENERATED"?"CANDIDATE" as const:"EXTERNAL" as const;return Object.freeze({anchorId:source.anchorId,classification:sourceClassification,availability:"AVAILABLE" as const,provenance:`${source.sourceWorkspace}:${source.sourceKind}:${source.sourceIdentity}`,sensitivity:Object.freeze({includeInAnalysis:true,includeInArtifact:true,citePublicly:false,anonymize:false,restrictedAppendix:false,excludeFromAiProcessing:true}),representations:Object.freeze([{representationId:`${source.anchorId}:representation`,mediaType:"application/json",schemaVersion:"research-anchor-capture/v1",content,contentHash:canonicalSha256(content)}])})});const domain={snapshotId:identity.snapshotId,investigationId,capturedAt:identity.capturedAt,selectionScope:"EXPLICIT_SELECTION" as const,selectedAnchorIds:sources.map(s=>s.anchorId),inboxMembershipBasis:"EXPLICIT_STABLE_IDENTITIES" as const,sources,immutableStatus:"FROZEN" as const};const snapshot=Object.freeze({...domain,snapshotHash:canonicalSha256(domain)});validateSnapshot(snapshot);snapshots.push(snapshot)}
  return Object.freeze({semanticContent,snapshots:Object.freeze(snapshots)});
}

/** V1 has no presentation section field. Analysis is the editor's deterministic neutral placement. */
export function restoreAuthorDocument(semantic:SemanticDocument,createdAt:string):ComputationalAuthorDocument{return {identity:{id:semantic.documentId,createdAt:new Date(createdAt)},metadata:{title:semantic.title,description:"Authoritative Studio V1 revision",author:"",modifiedAt:new Date(createdAt),version:1},type:"DOCUMENT",status:"SAVED",nodes:semantic.nodeOrder.map(nodeId=>{const node=semantic.nodes.find(candidate=>candidate.id===nodeId);if(!node)throw new StudioV1AdaptationError(`Saved semantic node ${nodeId} is missing.`);if(node.type==="HEADING")return{id:node.id,type:AuthorNodeTypes.HEADING,level:node.level,text:node.text,section:"Analysis"};if(node.type==="CLAIM"){if(node.sourceSnapshotIds.length)throw new StudioV1AdaptationError(`Source-backed claim ${node.id} cannot be restored without its frozen source representation.`);return{id:node.id,type:AuthorNodeTypes.OBSERVATION,text:node.text,source:"AUTHOR",relatedReferences:[],createdAt:new Date(createdAt)}}if(node.type==="PARAGRAPH")return{id:node.id,type:AuthorNodeTypes.PARAGRAPH,text:node.text,section:"Analysis"};throw new StudioV1AdaptationError(`Saved semantic node ${node.type} is read-only and cannot be opened in the current editor.`)})};}
