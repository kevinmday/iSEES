// ============================================================
// src/author/ingestion/AuthorKnowledgeCompiler.ts
// P56
// AUTHOR KNOWLEDGE COMPILER
//
// Canonical compiler from validated iSEES Author artifacts
// into Computational Knowledge Object Model (KOM) inputs.
//
// PURPOSE
//
//     ParsedAuthorArtifact
//              ↓
//     AuthorKnowledgeCompiler
//              ↓
//       ┌──────┴──────┐
//       ↓             ↓
// EXISTING        NEW AUTHORIAL
// REFERENCES        CONTENT
//       ↓             ↓
// preserve         OBSERVATION
// identity         KnowledgeObject
//       └──────┬──────┘
//              ↓
//             KOM
//
// CRITICAL INVARIANT
//
// Existing computational references MUST NOT be converted into
// duplicate Knowledge Objects.
//
// Example:
//
//   REFERENCE
//   targetType: NODE
//   targetId: facility:RAF Bentwaters
//
// means:
//
//   "this document references the already-known Bentwaters
//    computational object"
//
// NOT:
//
//   "create another RAF Bentwaters entity"
//
// New authorial content initially enters KOM as OBSERVATION.
//
// This is deliberately conservative.
//
// Authored prose does NOT automatically become:
//
//   • FACT
//   • EVIDENCE
//   • ENTITY
//   • RELATIONSHIP
//   • HYPOTHESIS
//   • graph topology
//
// Those transformations belong to later computational
// reconstruction / REX stages.
//
// DOES NOT
//
// • Parse raw JSON.
// • Mutate Knowledge Runtime.
// • Invoke Resolve.
// • Invoke REX.
// • Create graph topology.
// • Resolve entities.
// • Infer relationships.
// • Perform AI inference.
// • Persist artifacts.
// • Perform UI work.
//
// ============================================================

import type {
  KnowledgeObject,
} from "../../knowledge/model/KnowledgeObject";

import {
  KnowledgeObjectType,
  KnowledgeObjectStatus,
  type KnowledgeExportCapabilities,
  type KnowledgeGraphReference,
  type KnowledgeLifecycle,
  type KnowledgeProvenance,
  type KnowledgeRevision,
} from "../../knowledge/model/KnowledgeObjectTypes";

import type {
  IngestibleAuthorNode,
  ParsedAuthorArtifact,
  SerializedAuthorNode,
  SerializedReferenceNode,
} from "./AuthorArtifactTypes";

import {
  AuthorIngestionClassifications,
  isSerializedReferenceNode,
} from "./AuthorArtifactTypes";

// ============================================================
// COMPILER CONTRACT VERSION
// ============================================================
//
// The compiler version participates in the identity of the
// transformation contract.
//
// It does NOT represent the Author Document version.
//
// ============================================================

export const AUTHOR_KNOWLEDGE_COMPILER_VERSION =
  "P56-1" as const;

// ============================================================
// PRESERVED REFERENCE
// ============================================================
//
// Existing references do not become new Knowledge Objects.
//
// They survive compilation as explicit bindings to canonical
// computational identities already present in the
// investigation.
//
// Future integration may resolve these bindings against:
//
//   • Knowledge Runtime
//   • Investigation Graph
//   • Corpus Runtime
//   • Artifact Runtime
//   • Author Document Runtime
//
// ============================================================

export interface AuthorKnowledgeReferenceBinding {

  readonly authorNodeId:
    string;

  readonly documentId:
    string;

  readonly documentVersion:
    number;

  readonly targetType:
    SerializedReferenceNode["targetType"];

  readonly targetId:
    string;

  readonly title:
    string;

  readonly source:
    string;

  readonly corpusId:
    string;

}

// ============================================================
// COMPILER RESULT
// ============================================================

export interface AuthorKnowledgeCompileResult {

  // ----------------------------------------------------------
  // Newly created computational knowledge.
  // ----------------------------------------------------------

  readonly knowledgeObjects:
    readonly KnowledgeObject[];

  // ----------------------------------------------------------
  // Existing computational identities preserved by the
  // document.
  // ----------------------------------------------------------

  readonly references:
    readonly AuthorKnowledgeReferenceBinding[];

  // ----------------------------------------------------------
  // Source document identity.
  // ----------------------------------------------------------

  readonly documentId:
    string;

  readonly documentVersion:
    number;

  // ----------------------------------------------------------
  // Compiler contract identity.
  // ----------------------------------------------------------

  readonly compilerVersion:
    typeof AUTHOR_KNOWLEDGE_COMPILER_VERSION;

}

// ============================================================
// STRING COMPARATOR
// ============================================================
//
// Explicit lexical ordering.
//
// We deliberately avoid localeCompare() so compiler output does
// not depend on host locale.
//
// ============================================================

function compareCanonicalStrings(
  left: string,
  right: string,
): number {

  if (
    left < right
  ) {

    return -1;

  }

  if (
    left > right
  ) {

    return 1;

  }

  return 0;

}

// ============================================================
// CANONICAL HASH
// ============================================================
//
// P56 needs deterministic Knowledge Object identities.
//
// KnowledgeObjectFactory.create() currently generates UUIDs and
// timestamps, which is appropriate for interactive promotion
// but inappropriate inside this compiler because equivalent
// canonical .author input should compile to equivalent
// computational identities.
//
// This small deterministic hash is NOT cryptographic.
//
// Its purpose is stable identity derivation.
//
// ============================================================

function deterministicHash(
  value: string,
): string {

  let hash =
    2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {

    hash ^=
      value.charCodeAt(
        index,
      );

    hash =
      Math.imul(
        hash,
        16777619,
      );

  }

  return (
    hash >>> 0
  )
    .toString(16)
    .padStart(
      8,
      "0",
    );

}

// ============================================================
// KNOWLEDGE IDENTITY
// ============================================================
//
// Identity is derived entirely from canonical source identity:
//
//   Author Document ID
//   +
//   Author Document version
//   +
//   Author node ID
//
// Re-ingesting the same document revision therefore produces
// the same Knowledge Object identity.
//
// ============================================================

function createKnowledgeObjectId(
  documentId: string,
  documentVersion: number,
  nodeId: string,
): string {

  const canonicalSource =
    [
      documentId,
      documentVersion.toString(),
      nodeId,
      AUTHOR_KNOWLEDGE_COMPILER_VERSION,
    ].join(
      "|",
    );

  return [
    "knowledge",
    "author",
    deterministicHash(
      canonicalSource,
    ),
  ].join(
    ":",
  );

}

// ============================================================
// NODE TITLE
// ============================================================
//
// Extract a human-readable title without pretending to perform
// semantic interpretation.
//
// ============================================================

function getNodeTitle(
  node: SerializedAuthorNode,
): string {

  const title =
    node["title"];

  if (
    typeof title === "string" &&
    title.trim().length > 0
  ) {

    return title;

  }

  const text =
    node["text"];

  if (
    typeof text === "string" &&
    text.trim().length > 0
  ) {

    const normalized =
      text
        .trim()
        .replace(
          /\s+/g,
          " ",
        );

    if (
      normalized.length <= 80
    ) {

      return normalized;

    }

    return (
      `${normalized.slice(0, 77)}...`
    );

  }

  return (
    `Author ${node.type}`
  );

}

// ============================================================
// NODE DESCRIPTION
// ============================================================
//
// Preserve authored text when the node has textual content.
//
// This is NOT semantic extraction.
//
// ============================================================

function getNodeDescription(
  node: SerializedAuthorNode,
): string | undefined {

  const text =
    node["text"];

  if (
    typeof text === "string"
  ) {

    return text;

  }

  const citation =
    node["citation"];

  if (
    typeof citation === "string"
  ) {

    return citation;

  }

  return undefined;

}

// ============================================================
// GRAPH REFERENCES
// ============================================================
//
// New authorial content does not automatically establish graph
// topology.
//
// Therefore P56 emits no graph references from ordinary prose.
//
// Existing REFERENCE nodes are handled separately as preserved
// reference bindings.
//
// ============================================================

function createGraphReferences():
  KnowledgeGraphReference[] {

  return [];

}

// ============================================================
// PROVENANCE
// ============================================================
//
// Author artifact timestamps are already canonical source
// timestamps.
//
// No wall-clock time is introduced here.
//
// This makes compilation replayable.
//
// ============================================================

function createKnowledgeProvenance(
  source: IngestibleAuthorNode,
): KnowledgeProvenance {

  return {

    sourceId:
      source.documentId,

    sourceType:
      source.provenance.sourceType,

    sourceRevision:
      source.documentVersion,

    observedAt:
      source.provenance.modifiedAt,

    createdAt:
      source.provenance.createdAt,

    updatedAt:
      source.provenance.modifiedAt,

  };

}

// ============================================================
// LIFECYCLE
// ============================================================

function createKnowledgeLifecycle():
  KnowledgeLifecycle {

  return {

    status:
      KnowledgeObjectStatus.OBSERVED,

    revision:
      1,

  };

}

// ============================================================
// REVISION
// ============================================================

function createKnowledgeRevision(
  source: IngestibleAuthorNode,
): KnowledgeRevision {

  return {

    revision:
      1,

    timestamp:
      source.provenance.modifiedAt,

  };

}

// ============================================================
// CAPABILITIES
// ============================================================

function createKnowledgeCapabilities():
  KnowledgeExportCapabilities {

  return {

    projectable:
      true,

    publishable:
      false,

    editable:
      true,

  };

}

// ============================================================
// OBSERVATION PAYLOAD
// ============================================================
//
// The payload preserves the authored computational source.
//
// It deliberately does not claim semantic truth.
//
// ============================================================

function createObservationPayload(
  source: IngestibleAuthorNode,
): unknown {

  return {

    source:
      "AUTHOR_DOCUMENT",

    compilerVersion:
      AUTHOR_KNOWLEDGE_COMPILER_VERSION,

    documentId:
      source.documentId,

    documentVersion:
      source.documentVersion,

    authorNodeId:
      source.node.id,

    authorNodeType:
      source.node.type,

    content:
      source.node,

  };

}

// ============================================================
// COMPILE AUTHORIAL NODE → OBSERVATION
// ============================================================
//
// This is the conservative P56 ingress rule:
//
//     NEW_AUTHORIAL_CONTENT
//              ↓
//         OBSERVATION
//
// No stronger epistemic claim is made.
//
// ============================================================

function compileAuthorialNode(
  source: IngestibleAuthorNode,
  artifact: ParsedAuthorArtifact,
): KnowledgeObject {

  const knowledgeId =
    createKnowledgeObjectId(
      source.documentId,
      source.documentVersion,
      source.node.id,
    );

  const provenance =
    createKnowledgeProvenance(
      source,
    );

  const lifecycle =
    createKnowledgeLifecycle();

  const revision =
    createKnowledgeRevision(
      source,
    );

  const capabilities =
    createKnowledgeCapabilities();

  const graph =
    createGraphReferences();

  return {

    identity: {

      id:
        knowledgeId,

      createdAt:
        source.provenance.modifiedAt,

    },

    metadata: {

      title:
        getNodeTitle(
          source.node,
        ),

      description:
        getNodeDescription(
          source.node,
        ),

      author:
        artifact.document.metadata.author,

      version:
        `${source.documentVersion}.0.0`,

    },

    lifecycle,

    type:
      KnowledgeObjectType.OBSERVATION,

    status:
      KnowledgeObjectStatus.OBSERVED,

    confidence: {

      // ------------------------------------------------------
      // OBSERVATION ≠ truth.
      //
      // Zero here means no epistemic confidence has yet been
      // assigned by evidence / reconstruction machinery.
      // ------------------------------------------------------

      value:
        0,

      rationale:
        "Authored computational observation; not yet evaluated.",

    },

    provenance,

    revision,

    graph,

    relationships:
      [],

    tags:
      [],

    capabilities,

    payload:
      createObservationPayload(
        source,
      ),

  };

}

// ============================================================
// COMPILE EXISTING REFERENCE
// ============================================================

function compileReference(
  source: IngestibleAuthorNode,
): AuthorKnowledgeReferenceBinding {

  if (
    !isSerializedReferenceNode(
      source.node,
    )
  ) {

    throw new Error(
      "Author Knowledge Compiler expected a serialized REFERENCE node.",
    );

  }

  return {

    authorNodeId:
      source.node.id,

    documentId:
      source.documentId,

    documentVersion:
      source.documentVersion,

    targetType:
      source.node.targetType,

    targetId:
      source.node.targetId,

    title:
      source.node.title,

    source:
      source.node.source,

    corpusId:
      source.node.corpusId,

  };

}

// ============================================================
// COMPILE PARSED AUTHOR ARTIFACT
// ============================================================
//
// Pure transformation.
//
// Equivalent ParsedAuthorArtifact input produces equivalent
// compiler output.
//
// No clocks.
// No UUIDs.
// No external state.
// No mutation.
//
// ============================================================

export function compileAuthorArtifactToKnowledge(
  artifact: ParsedAuthorArtifact,
): AuthorKnowledgeCompileResult {

  const knowledgeObjects:
    KnowledgeObject[] = [];
const references:
  AuthorKnowledgeReferenceBinding[] = [];

for (
  const source
  of artifact.nodes
) {

  switch (
    source.classification
  ) {

    // ------------------------------------------------------
    // EXISTING COMPUTATIONAL REFERENCE
    // ------------------------------------------------------

    case (
      AuthorIngestionClassifications
        .EXISTING_REFERENCE
    ): {

      references.push(
        compileReference(
          source,
        ),
      );

      break;

    }

    // ------------------------------------------------------
    // NEW AUTHORIAL COMPUTATIONAL CONTENT
    // ------------------------------------------------------

    case (
      AuthorIngestionClassifications
        .NEW_AUTHORIAL_CONTENT
    ): {

      knowledgeObjects.push(
        compileAuthorialNode(
          source,
          artifact,
        ),
      );

      break;

    }

    // ------------------------------------------------------
    // NON-COMPUTATIONAL AUTHOR CONTENT
    // ------------------------------------------------------
    //
    // Narrative/document structure remains canonical Author
    // content but does not automatically enter KOM.
    //
    // Future REX semantic expansion may inspect this content
    // and propose computational candidates.
    //
    // At this ingestion boundary:
    //
    //   C(N) = ∅
    //
    // ------------------------------------------------------

    case (
      AuthorIngestionClassifications
        .NON_COMPUTATIONAL_CONTENT
    ): {

      // Intentionally no Knowledge Object creation.
      // Intentionally no reference binding creation.

      break;

    }

  }

}
  // ----------------------------------------------------------
  // CANONICAL OUTPUT ORDER
  // ----------------------------------------------------------
  //
  // Author document order is meaningful inside the document,
  // but KOM compilation output must not depend upon traversal
  // order when consumed as a set of computational objects.
  //
  // Resolve performs its own canonicalization as well.
  //
  // ----------------------------------------------------------

  knowledgeObjects.sort(
    (
      left,
      right,
    ) =>
      compareCanonicalStrings(
        left.identity.id,
        right.identity.id,
      ),
  );

  references.sort(
    (
      left,
      right,
    ) => {

      const targetComparison =
        compareCanonicalStrings(
          left.targetId,
          right.targetId,
        );

      if (
        targetComparison !== 0
      ) {

        return targetComparison;

      }

      return compareCanonicalStrings(
        left.authorNodeId,
        right.authorNodeId,
      );

    },
  );

  return {

    knowledgeObjects,

    references,

    documentId:
      artifact.document.identity.id,

    documentVersion:
      artifact.document.metadata.version,

    compilerVersion:
      AUTHOR_KNOWLEDGE_COMPILER_VERSION,

  };

}

// ============================================================
// COMPILER FACADE
// ============================================================

export class AuthorKnowledgeCompiler {

  public static compile(
    artifact:
      ParsedAuthorArtifact,
  ): AuthorKnowledgeCompileResult {

    return compileAuthorArtifactToKnowledge(
      artifact,
    );

  }

}

// ============================================================
// END
// ============================================================