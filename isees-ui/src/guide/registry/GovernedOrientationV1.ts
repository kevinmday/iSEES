import { WorkspaceMode } from "../../workspace/runtime/WorkspaceRuntimeTypes.ts";
import {
  GUIDED_ORIENTATION_SCHEMA_ID,
  GUIDED_ORIENTATION_SCHEMA_VERSION,
  GuideSemanticTargetIds,
  type GuidedOrientationChapter,
  type GuidedOrientationDefinition,
} from "../contracts/index.ts";

type ChapterInput = Omit<GuidedOrientationChapter, "spokenTranscript" | "previousChapterId" | "nextChapterId" | "permitsAuthoritativeMutation">;

/** Audible content is a deterministic plain-language projection of the visible governed transcript. */
export function formatOrientationSpokenTranscript(paragraphs: readonly string[]): string {
  return paragraphs.join(" ").replace(/\.author/g, "dot author").replace(/iSEES/g, "eye sees");
}

const inputs: readonly ChapterInput[] = [
  {
    chapterId: "welcome-to-isees",
    title: "Welcome to iSEES",
    summary: "Learn what iSEES is, what makes its analysis reproducible, and where researcher judgment remains decisive.",
    visibleTranscript: [
      "iSEES is an advanced research environment based on deterministic mathematics and manifold concepts. It is designed to reveal and evaluate relationships among events, evidence, people, organizations, facilities, locations, documents, narratives, and hypotheses.",
      "Conventional search helps you find material, and inferential AI may suggest possible connections. iSEES serves a different purpose: it creates a reproducible, governed analytical structure in which objects, relationships, evidence, computations, and research products retain explicit identities and lineage.",
      "iSEES does not automatically decide what is true. Computation can expose correspondence and structure, but the researcher remains responsible for interpretation and for every explicit decision to accept knowledge or authority.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.OVERVIEW,
  },
  {
    chapterId: "how-an-investigation-works",
    title: "How an Investigation Works",
    summary: "Understand the investigation as the governed boundary shared by every analytical workspace.",
    visibleTranscript: [
      "An investigation is the governed boundary of the research. It contains the focused subject, evidence, entities, relationships, timelines, comparisons, analytical layers, and research products that belong to that inquiry.",
      "Every workspace is a different projection of the same investigation. Overview summarizes its state; other modes expose topology, comparisons, narrative, evidence, time, layers, intention, or composition.",
      "Changing workspaces does not create a disconnected copy of the investigation. The view and available controls change, while the investigation identity and its governed state remain coherent across the research environment.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.OVERVIEW,
  },
  {
    chapterId: "understanding-the-manifold",
    title: "Understanding the Manifold",
    summary: "Read the investigation as governed objects, explicit relationships, and deterministic projections.",
    visibleTranscript: [
      "In the Manifold, nodes represent governed objects and edges represent explicit relationships. Together, their topology is the structured shape of the investigation—not merely a decorative network picture.",
      "Selecting a node or edge opens Selection Intelligence, where you can inspect identity, meaning, provenance, and available actions. Resolve operates within governed deterministic rules to compute qualified structure; the Guide never runs it for you.",
      "Projections may change how the investigation is viewed without silently changing underlying authority. A visual correspondence, computed candidate, or alternate projection is not automatically an accepted fact or canonical relationship.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.MANIFOLD,
  },
  {
    chapterId: "analytical-workspaces",
    title: "The Analytical Workspaces",
    summary: "See how the nine modes form a research loop rather than a mandatory wizard.",
    visibleTranscript: [
      "OVERVIEW is the front door for understanding state and opening or beginning an investigation. MANIFOLD exposes governed topology. COMPARE inspects deterministic correspondence. NARRATIVE presents the investigation's narrative projection. EVIDENCE separates governed evidence from candidate material.",
      "TIMELINE organizes temporal records and correspondences. LAYERS tests explicit analytical contributions. INTENTION exposes deterministic intention projections, hypotheses, assumptions, and lineage. STUDIO—represented by the authoritative RESEARCH workspace mode—is where Research Inbox sources and researcher-authored material become .author research products.",
      "These modes form a research loop, not a mandatory linear wizard. You may revisit evidence after comparison, return to the Manifold after timeline inspection, or refine a research product as the investigation develops. The bottom mode bar remains the authoritative navigation control.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_MODES,
    recommendedMode: WorkspaceMode.OVERVIEW,
  },
  {
    chapterId: "evidence-and-authority",
    title: "Evidence and Authority",
    summary: "Keep discovery, provenance, mathematical correspondence, and epistemic acceptance distinct.",
    visibleTranscript: [
      "Tavily and Web Discovery locate candidate material. Web results remain Candidate Evidence, and uploaded material is not automatically accepted as truth. Source identity, acquisition context, and provenance must remain attached throughout review.",
      "Mathematical correspondence is not automatic epistemic acceptance. Only explicit, governed researcher actions may admit or accept knowledge. Finding a pattern, capturing a source, or computing a relationship does not silently promote it into System Canon.",
      "When required information is unavailable, it must remain unavailable rather than being guessed or inferred into existence. This boundary keeps uncertainty inspectable and preserves the difference between evidence, interpretation, and authority.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.EVIDENCE,
  },
  {
    chapterId: "research-inbox",
    title: "The Research Inbox",
    summary: "Use the Inbox as a governed bridge from analytical inspection to research composition.",
    visibleTranscript: [
      "The Research Inbox is not merely a bookmark list. It carries qualified research outputs across workspaces so that a result inspected in the Manifold, Compare, Evidence, Timeline, Layers, or Intention can remain available for deliberate composition.",
      "Every inserted source retains its identity, provenance, and citation context. That continuity connects analytical inspection to research composition without flattening source-backed material into unattributed prose.",
      "Adding an item to the Research Inbox does not rewrite System Canon. It records a qualified research reference for further use, while the authority and lifecycle of the underlying object remain governed by their existing owners.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.RESEARCH,
  },
  {
    chapterId: "author-research-product",
    title: "The `.author` Research Product",
    summary: "Understand the authoritative research document and its derived export projections.",
    visibleTranscript: [
      ".author is the researcher's evolving composition node. A manifold may contain multiple .author nodes, and each has its own identity, revision lineage, sources, notes, and projections.",
      "Research Inbox material can be inserted as source-backed content, while researcher-authored notes remain distinguishable from sourced material. AI assistance belongs here only within governed boundaries: it may help organize material and draft prose, but it may not fabricate evidence, citations, or authority.",
      "PDF, DOCX, and HTML are projections of .author, not replacements for its authoritative source. Returning developed knowledge to the Manifold is a separate governed operation; writing or exporting a draft does not silently change investigation knowledge or System Canon.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_REGION,
    recommendedMode: WorkspaceMode.RESEARCH,
  },
  {
    chapterId: "first-research-mission",
    title: "Your First Research Mission",
    summary: "Follow one concrete path from investigation inspection to a source-backed draft export.",
    visibleTranscript: [
      "Your first mission is: 1. Open or begin an investigation. 2. Enter Manifold. 3. Select a node and inspect Selection Intelligence. 4. Open Compare and inspect one relationship. 5. Send a qualified result to Research.",
      "Then: 6. Open Studio. 7. Create a .author document. 8. Insert the Research Inbox source. 9. Add a researcher note. 10. Export a current-draft PDF or DOCX.",
      "You remain in control at every step. Begin First Investigation takes you to the existing starting workspace only. It does not run Resolve, select evidence, accept relationships, publish research, or mutate System Canon.",
    ],
    interfaceTargetId: GuideSemanticTargetIds.WORKSPACE_MODES,
    recommendedMode: WorkspaceMode.OVERVIEW,
  },
] as const;

const chapters = inputs.map((input, index): GuidedOrientationChapter => Object.freeze({
  ...input,
  visibleTranscript: Object.freeze([...input.visibleTranscript]),
  spokenTranscript: formatOrientationSpokenTranscript(input.visibleTranscript),
  previousChapterId: index > 0 ? inputs[index - 1].chapterId : undefined,
  nextChapterId: index < inputs.length - 1 ? inputs[index + 1].chapterId : undefined,
  permitsAuthoritativeMutation: false,
}));

export const GOVERNED_ORIENTATION_V1: GuidedOrientationDefinition = Object.freeze({
  schemaId: GUIDED_ORIENTATION_SCHEMA_ID,
  schemaVersion: GUIDED_ORIENTATION_SCHEMA_VERSION,
  orientationId: "isees-guided-orientation-v1",
  definitionVersion: "1.0.0",
  title: "iSEES Guided Orientation",
  purpose: "Explain the complete governed iSEES research system and the path from investigation evidence to a research product.",
  authorityBoundary: "Only explicit governed researcher actions may admit evidence, accept relationships, publish research, or change authoritative investigation knowledge.",
  advisoryBoundary: "Orientation explains and highlights. It never executes research commands, activates highlighted controls, or modifies System Canon.",
  chapters: Object.freeze(chapters),
});

/** The registry is intentionally singular for v1. */
export const GOVERNED_ORIENTATIONS = Object.freeze([GOVERNED_ORIENTATION_V1]);
