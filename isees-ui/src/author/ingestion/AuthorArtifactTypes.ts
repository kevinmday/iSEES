// ============================================================
// src/author/ingestion/AuthorArtifactTypes.ts
// P56
// AUTHOR ARTIFACT INGESTION TYPES
//
// Canonical contracts for re-ingesting an iSEES computational
// Author Document (.author) into the computational system.
//
// PURPOSE
//
// The .author artifact is NOT a presentation document.
//
// It is a canonical machine-readable computational artifact
// capable of preserving:
//
//   • computational object identity
//   • node / edge references
//   • authorial content
//   • explicit authored observations
//   • provenance
//   • document lineage
//
// This module defines ONLY the artifact ingestion boundary.
//
// It performs:
//
//   • no parsing
//   • no Knowledge Object creation
//   • no Resolve computation
//   • no REX expansion
//   • no graph mutation
//   • no persistence
//   • no UI work
//
// CANONICAL RETURN PATH
//
//   MANIFOLD
//      ↓
//   RESEARCH INBOX
//      ↓
//   STUDIO
//      ↓
//   .author
//      ↓
//   AUTHOR ARTIFACT INGESTION
//      ↓
//   KOM
//      ↓
//   CANONICAL COMPUTATIONAL UNIVERSE
//      ↓
//   RESOLVE
//      ↓
//                 M = g(L,T,S)
//
// ============================================================

import type {
  AuthorDocument,
} from "../model/AuthorDocumentTypes";

import type {
  AuthorNodeType,
} from "../model/AuthorNodeTypes";

// ============================================================
// ARTIFACT CONSTANTS
// ============================================================

export const AUTHOR_ARTIFACT_TYPE =
  "ISEES_AUTHOR" as const;

export const AUTHOR_ARTIFACT_SCHEMA_VERSION =
  1 as const;

// ============================================================
// ARTIFACT TYPE
// ============================================================

export type AuthorArtifactType =
  typeof AUTHOR_ARTIFACT_TYPE;

export type AuthorArtifactSchemaVersion =
  typeof AUTHOR_ARTIFACT_SCHEMA_VERSION;

// ============================================================
// SERIALIZED DOCUMENT IDENTITY
// ============================================================
//
// Runtime AuthorDocument identity contains Date values.
//
// JSON serialization converts Date values to ISO strings.
//
// The ingestion boundary therefore owns an explicit serialized
// representation.
//
// ============================================================

export interface SerializedAuthorDocumentIdentity {

  readonly id:
    string;

  readonly createdAt:
    string;

}

// ============================================================
// SERIALIZED DOCUMENT METADATA
// ============================================================

export interface SerializedAuthorDocumentMetadata {

  readonly title:
    string;

  readonly description:
    string;

  readonly author:
    string;

  readonly modifiedAt:
    string;

  readonly version:
    number;

}

// ============================================================
// SERIALIZED AUTHOR NODE
// ============================================================
//
// Canonical serialized base contract.
//
// Runtime AuthorNode implementations may contain Date values
// and other runtime-native representations.
//
// At the .author boundary those values are JSON-compatible.
//
// Specific node contracts are introduced whenever ingestion
// semantics require stronger validation.
//
// ============================================================

export interface SerializedAuthorNode {

  readonly id:
    string;

  readonly type:
    AuthorNodeType;

  readonly [key: string]:
    unknown;

}

// ============================================================
// SERIALIZED REFERENCE NODE
// ============================================================
//
// Explicit representation of the ReferenceNode emitted by
// Studio.
//
// This is the critical P56 round-trip object:
//
//   MANIFOLD object
//        ↓
//   Research Bridge
//        ↓
//   ReferenceNode
//        ↓
//   .author
//        ↓
//   SerializedReferenceNode
//
// Existing references preserve identity.
//
// They MUST NOT automatically manufacture duplicate entities.
//
// ============================================================

export interface SerializedReferenceNode
extends SerializedAuthorNode {

  readonly type:
    "REFERENCE";

  readonly targetType:
    "NODE"
    | "EDGE"
    | "ARTIFACT"
    | "DOCUMENT";

  readonly targetId:
    string;

  readonly title:
    string;

  readonly source:
    string;

  readonly corpusId:
    string;

  readonly connections?:
    number;

  readonly confidence?:
    number;

  readonly summary?:
    string;

  readonly insertedAt:
    string;

}

// ============================================================
// SERIALIZED OBSERVATION NODE
// ============================================================
//
// Explicit serialized representation of an ObservationNode.
//
// This contract establishes a critical semantic distinction:
//
//   PARAGRAPH
//      = narrative authored text
//
//   OBSERVATION
//      = explicit researcher assertion intended to enter
//        the computational knowledge pipeline
//
// Merely writing prose in Studio therefore does NOT mean that
// the prose has been asserted as computational knowledge.
//
// OBSERVATION is the deliberate ingress boundary.
//
// ============================================================

export interface SerializedObservationNode
extends SerializedAuthorNode {

  readonly type:
    "OBSERVATION";

  /**
   * Canonical natural-language assertion supplied
   * by the researcher.
   *
   * The source assertion is preserved rather than
   * replaced by downstream interpretation.
   */
  readonly text:
    string;

  /**
   * Declared origin of the observation.
   *
   * P56 initially expects authored observations to
   * use AUTHOR, while retaining string extensibility.
   */
  readonly source:
    string;

  /**
   * Existing computational identities explicitly
   * associated with this observation by the author.
   *
   * These relations are declared, not inferred.
   *
   * Example:
   *
   * [
   *   "facility:RAF Woodbridge"
   * ]
   */
  readonly relatedReferences:
    readonly string[];

  /**
   * Canonical serialized creation timestamp.
   */
  readonly createdAt:
    string;

}

// ============================================================
// SERIALIZED AUTHOR DOCUMENT
// ============================================================
//
// Mirrors the canonical document stored inside .author.
//
// The parser validates this structure before anything crosses
// into the Knowledge Object Model.
//
// ============================================================

export interface SerializedAuthorDocument {

  readonly identity:
    SerializedAuthorDocumentIdentity;

  readonly metadata:
    SerializedAuthorDocumentMetadata;

  readonly type:
    AuthorDocument["type"];

  readonly status:
    AuthorDocument["status"];

  readonly nodes:
    readonly SerializedAuthorNode[];

}

// ============================================================
// CANONICAL AUTHOR ARTIFACT
// ============================================================
//
// Native iSEES .author envelope.
//
// {
//   "artifactType": "ISEES_AUTHOR",
//   "schemaVersion": 1,
//   "document": {
//     ...
//   }
// }
//
// ============================================================

export interface AuthorArtifact {

  readonly artifactType:
    AuthorArtifactType;

  readonly schemaVersion:
    AuthorArtifactSchemaVersion;

  readonly document:
    SerializedAuthorDocument;

}

// ============================================================
// INGESTION SOURCE
// ============================================================

export const AUTHOR_ARTIFACT_SOURCE_TYPE =
  "AUTHOR_DOCUMENT" as const;

export type AuthorArtifactSourceType =
  typeof AUTHOR_ARTIFACT_SOURCE_TYPE;

// ============================================================
// AUTHOR ARTIFACT PROVENANCE
// ============================================================
//
// Provenance extracted directly from the artifact.
//
// This is intentionally separate from KnowledgeProvenance.
//
// AuthorKnowledgeCompiler translates this boundary contract
// into the canonical KOM provenance representation.
//
// ============================================================

export interface AuthorArtifactProvenance {

  readonly sourceId:
    string;

  readonly sourceType:
    AuthorArtifactSourceType;

  readonly sourceRevision:
    number;

  readonly createdAt:
    string;

  readonly modifiedAt:
    string;

}

// ============================================================
// INGESTION CLASSIFICATION
// ============================================================
//
// EXISTING_REFERENCE
//
//   A computational reference to an object already known
//   to iSEES.
//
//   Identity is preserved.
//
//   No duplicate entity is created.
//
// NEW_AUTHORIAL_CONTENT
//
//   Content explicitly declared by the Author model as
//   computational knowledge entering the inbound pipeline.
//
//   P56:
//       OBSERVATION → NEW_AUTHORIAL_CONTENT
//
//   The compiler initially translates this class into a
//   KOM OBSERVATION.
//
// NON_COMPUTATIONAL_CONTENT
//
//   Author document structure that remains meaningful to the
//   document but does NOT automatically enter KOM.
//
//   Examples:
//
//       PARAGRAPH
//       HEADING
//       QUOTE
//       LIST
//       CODE
//       TABLE
//       IMAGE
//       CITATION
//       DIVIDER
//       CUSTOM
//
//   These nodes remain canonical Author content.
//
//   Future semantic / REX processing MAY inspect them and
//   propose computational candidates, but ingestion does not
//   silently promote them.
//
// ============================================================

export const AuthorIngestionClassifications = {

  EXISTING_REFERENCE:
    "EXISTING_REFERENCE",

  NEW_AUTHORIAL_CONTENT:
    "NEW_AUTHORIAL_CONTENT",

  NON_COMPUTATIONAL_CONTENT:
    "NON_COMPUTATIONAL_CONTENT",

} as const;

export type AuthorIngestionClassification =
  typeof AuthorIngestionClassifications[
    keyof typeof AuthorIngestionClassifications
  ];

// ============================================================
// INGESTIBLE AUTHOR NODE
// ============================================================
//
// Intermediate representation:
//
//   raw JSON
//      ↓
//   validated .author
//      ↓
//   classified Author node
//      ↓
//   AuthorKnowledgeCompiler
//      ↓
//   KOM
//
// Parser and compiler remain separate.
//
// ============================================================

export interface IngestibleAuthorNode {

  readonly node:
    SerializedAuthorNode;

  readonly classification:
    AuthorIngestionClassification;

  readonly documentId:
    string;

  readonly documentVersion:
    number;

  readonly provenance:
    AuthorArtifactProvenance;

}

// ============================================================
// PARSED AUTHOR ARTIFACT
// ============================================================
//
// Successful parser product.
//
// At this boundary:
//
//   • artifact type is validated
//   • schema version is validated
//   • document identity is validated
//   • document metadata is validated
//   • node collection is structurally validated
//   • REFERENCE nodes are explicitly validated
//   • OBSERVATION nodes are explicitly validated
//   • nodes are classified
//
// No Knowledge Objects have been created.
//
// ============================================================

export interface ParsedAuthorArtifact {

  readonly artifact:
    AuthorArtifact;

  readonly document:
    SerializedAuthorDocument;

  readonly provenance:
    AuthorArtifactProvenance;

  readonly nodes:
    readonly IngestibleAuthorNode[];

}

// ============================================================
// PARSE RESULT
// ============================================================

export interface AuthorArtifactParseSuccess {

  readonly ok:
    true;

  readonly value:
    ParsedAuthorArtifact;

}

export interface AuthorArtifactParseFailure {

  readonly ok:
    false;

  readonly error:
    string;

}

export type AuthorArtifactParseResult =
  | AuthorArtifactParseSuccess
  | AuthorArtifactParseFailure;

// ============================================================
// TOP-LEVEL TYPE GUARD
// ============================================================
//
// Lightweight artifact identification only.
//
// Full structural validation belongs to:
//
//   AuthorArtifactParser.ts
//
// ============================================================

export function isAuthorArtifact(
  value: unknown,
): value is AuthorArtifact {

  if (
    typeof value !== "object" ||
    value === null
  ) {

    return false;

  }

  const candidate =
    value as {
      artifactType?: unknown;
      schemaVersion?: unknown;
      document?: unknown;
    };

  return (
    candidate.artifactType ===
      AUTHOR_ARTIFACT_TYPE &&
    candidate.schemaVersion ===
      AUTHOR_ARTIFACT_SCHEMA_VERSION &&
    typeof candidate.document ===
      "object" &&
    candidate.document !==
      null
  );

}

// ============================================================
// REFERENCE NODE TYPE GUARD
// ============================================================

export function isSerializedReferenceNode(
  node: SerializedAuthorNode,
): node is SerializedReferenceNode {

  return (
    node.type ===
    "REFERENCE"
  );

}

// ============================================================
// OBSERVATION NODE TYPE GUARD
// ============================================================
//
// Structural validation remains the parser's responsibility.
//
// This guard establishes only that the serialized node declares
// OBSERVATION semantics.
//
// ============================================================

export function isSerializedObservationNode(
  node: SerializedAuthorNode,
): node is SerializedObservationNode {

  return (
    node.type ===
    "OBSERVATION"
  );

}

// ============================================================
// END
// ============================================================