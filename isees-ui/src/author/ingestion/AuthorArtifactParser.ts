// ============================================================
// src/author/ingestion/AuthorArtifactParser.ts
// P56
// AUTHOR ARTIFACT PARSER
//
// Canonical parser for native iSEES .author artifacts.
//
// PURPOSE
//
// Transform untrusted serialized input:
//
//     raw JSON / string
//
// into:
//
//     ParsedAuthorArtifact
//
// only after validating the canonical .author envelope,
// document contract, and supported Author node structures.
//
// P56 SEMANTIC BOUNDARY
//
//   REFERENCE
//      ↓
//   EXISTING_REFERENCE
//
//   OBSERVATION
//      ↓
//   NEW_AUTHORIAL_CONTENT
//
//   PARAGRAPH / HEADING / QUOTE / etc.
//      ↓
//   NON_COMPUTATIONAL_CONTENT
//
// This distinction is critical.
//
// Ordinary narrative prose is NOT automatically promoted into
// computational knowledge merely because it exists inside a
// canonical Author Document.
//
// Explicit OBSERVATION nodes cross the computational ingress
// boundary.
//
// RESPONSIBILITIES
//
// • Parse JSON text.
// • Validate ISEES_AUTHOR artifact identity.
// • Validate schemaVersion.
// • Validate document identity.
// • Validate document metadata.
// • Validate document type / status.
// • Validate Author nodes.
// • Validate REFERENCE node structure.
// • Validate OBSERVATION node structure.
// • Classify nodes according to explicit semantic type.
// • Construct artifact provenance.
//
// DOES NOT
//
// • Create Knowledge Objects.
// • Mutate Knowledge Runtime.
// • Invoke Resolve.
// • Invoke REX.
// • Infer entities from prose.
// • Infer relationships from prose.
// • Create graph topology.
// • Perform semantic inference.
// • Perform persistence.
// • Perform UI work.
//
// CANONICAL RETURN PATH
//
//   .author
//      ↓
//   AuthorArtifactParser
//      ↓
//   ParsedAuthorArtifact
//      ↓
//   AuthorKnowledgeCompiler
//      ↓
//   KOM
//      ↓
//   Canonical Computational Universe
//      ↓
//   Resolve
//      ↓
//             M = g(L,T,S)
//
// ============================================================

import {
  AUTHOR_ARTIFACT_SCHEMA_VERSION,
  AUTHOR_ARTIFACT_SOURCE_TYPE,
  AUTHOR_ARTIFACT_TYPE,
  AuthorIngestionClassifications,
  isAuthorArtifact,
  type AuthorArtifact,
  type AuthorArtifactParseResult,
  type AuthorArtifactProvenance,
  type IngestibleAuthorNode,
  type ParsedAuthorArtifact,
  type SerializedAuthorDocument,
  type SerializedAuthorNode,
  type SerializedObservationNode,
  type SerializedReferenceNode,
} from "./AuthorArtifactTypes";

import {
  AuthorDocumentStatuses,
  AuthorDocumentTypes,
} from "../model/AuthorDocumentTypes";

import {
  AuthorNodeTypes,
} from "../model/AuthorNodeTypes";

// ============================================================
// INTERNAL OBJECT TYPE
// ============================================================

type UnknownRecord =
  Record<string, unknown>;

// ============================================================
// BASIC VALUE GUARDS
// ============================================================

function isRecord(
  value: unknown,
): value is UnknownRecord {

  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );

}

function isNonEmptyString(
  value: unknown,
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );

}

function isString(
  value: unknown,
): value is string {

  return (
    typeof value === "string"
  );

}

function isFiniteNumber(
  value: unknown,
): value is number {

  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );

}

function isNonNegativeInteger(
  value: unknown,
): value is number {

  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0
  );

}

// ============================================================
// ISO DATE VALIDATION
// ============================================================
//
// JSON carries runtime Date values as strings.
//
// The parser validates temporal structure but intentionally
// leaves values serialized as strings.
//
// ============================================================

function isValidDateString(
  value: unknown,
): value is string {

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {

    return false;

  }

  return (
    !Number.isNaN(
      Date.parse(value),
    )
  );

}

// ============================================================
// STRING ARRAY VALIDATION
// ============================================================

function isStringArray(
  value: unknown,
): value is readonly string[] {

  if (
    !Array.isArray(value)
  ) {

    return false;

  }

  for (
    const item
    of value
  ) {

    if (
      !isNonEmptyString(
        item,
      )
    ) {

      return false;

    }

  }

  return true;

}

// ============================================================
// DOCUMENT TYPE VALIDATION
// ============================================================

function isAuthorDocumentType(
  value: unknown,
): value is SerializedAuthorDocument["type"] {

  return (
    typeof value === "string" &&
    Object.values(
      AuthorDocumentTypes,
    ).some(
      type =>
        type === value,
    )
  );

}

// ============================================================
// DOCUMENT STATUS VALIDATION
// ============================================================

function isAuthorDocumentStatus(
  value: unknown,
): value is SerializedAuthorDocument["status"] {

  return (
    typeof value === "string" &&
    Object.values(
      AuthorDocumentStatuses,
    ).some(
      status =>
        status === value,
    )
  );

}

// ============================================================
// AUTHOR NODE TYPE VALIDATION
// ============================================================

function isAuthorNodeType(
  value: unknown,
): value is SerializedAuthorNode["type"] {

  return (
    typeof value === "string" &&
    Object.values(
      AuthorNodeTypes,
    ).some(
      type =>
        type === value,
    )
  );

}

// ============================================================
// REFERENCE TARGET TYPE VALIDATION
// ============================================================

function isReferenceTargetType(
  value: unknown,
): value is SerializedReferenceNode["targetType"] {

  return (
    value === "NODE" ||
    value === "EDGE" ||
    value === "ARTIFACT" ||
    value === "DOCUMENT"
  );

}

// ============================================================
// OPTIONAL NUMBER VALIDATION
// ============================================================

function isOptionalFiniteNumber(
  value: unknown,
): boolean {

  return (
    value === undefined ||
    isFiniteNumber(value)
  );

}

// ============================================================
// OPTIONAL STRING VALIDATION
// ============================================================

function isOptionalString(
  value: unknown,
): boolean {

  return (
    value === undefined ||
    typeof value === "string"
  );

}

// ============================================================
// VALIDATE REFERENCE NODE
// ============================================================
//
// REFERENCE means:
//
//   "this Author Document points at an already-known
//    computational identity"
//
// It does NOT mean:
//
//   "create this entity again"
//
// ============================================================

function validateReferenceNode(
  value: UnknownRecord,
): value is UnknownRecord &
  SerializedReferenceNode {

  if (
    value.type !==
    AuthorNodeTypes.REFERENCE
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.id,
    )
  ) {

    return false;

  }

  if (
    !isReferenceTargetType(
      value.targetType,
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.targetId,
    )
  ) {

    return false;

  }

  if (
    !isString(
      value.title,
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.source,
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.corpusId,
    )
  ) {

    return false;

  }

  if (
    !isOptionalFiniteNumber(
      value.connections,
    )
  ) {

    return false;

  }

  if (
    !isOptionalFiniteNumber(
      value.confidence,
    )
  ) {

    return false;

  }

  if (
    !isOptionalString(
      value.summary,
    )
  ) {

    return false;

  }

  if (
    !isValidDateString(
      value.insertedAt,
    )
  ) {

    return false;

  }

  return true;

}

// ============================================================
// VALIDATE OBSERVATION NODE
// ============================================================
//
// OBSERVATION is an explicit computational assertion.
//
// This is stronger than ordinary narrative text.
//
// Required structure:
//
//   id
//   type = OBSERVATION
//   text
//   source
//   relatedReferences[]
//   createdAt
//
// relatedReferences contains only identities explicitly
// associated by the author.
//
// No relationship is inferred here.
//
// ============================================================

function validateObservationNode(
  value: UnknownRecord,
): value is UnknownRecord &
  SerializedObservationNode {

  if (
    value.type !==
    AuthorNodeTypes.OBSERVATION
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.id,
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.text,
    )
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.source,
    )
  ) {

    return false;

  }

  if (
    !isStringArray(
      value.relatedReferences,
    )
  ) {

    return false;

  }

  if (
    !isValidDateString(
      value.createdAt,
    )
  ) {

    return false;

  }

  return true;

}

// ============================================================
// VALIDATE GENERIC AUTHOR NODE
// ============================================================
//
// Every node must satisfy the canonical base contract.
//
// Nodes with computational ingress semantics receive stronger
// validation:
//
//   REFERENCE
//   OBSERVATION
//
// Other nodes remain valid canonical document content without
// being silently promoted into computational knowledge.
//
// ============================================================

function validateAuthorNode(
  value: unknown,
): value is SerializedAuthorNode {

  if (
    !isRecord(value)
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.id,
    )
  ) {

    return false;

  }

  if (
    !isAuthorNodeType(
      value.type,
    )
  ) {

    return false;

  }

  if (
    value.type ===
    AuthorNodeTypes.REFERENCE
  ) {

    return validateReferenceNode(
      value,
    );

  }

  if (
    value.type ===
    AuthorNodeTypes.OBSERVATION
  ) {

    return validateObservationNode(
      value,
    );

  }

  return true;

}

// ============================================================
// VALIDATE DOCUMENT IDENTITY
// ============================================================

function validateDocumentIdentity(
  value: unknown,
): boolean {

  if (
    !isRecord(value)
  ) {

    return false;

  }

  return (
    isNonEmptyString(
      value.id,
    ) &&
    isValidDateString(
      value.createdAt,
    )
  );

}

// ============================================================
// VALIDATE DOCUMENT METADATA
// ============================================================

function validateDocumentMetadata(
  value: unknown,
): boolean {

  if (
    !isRecord(value)
  ) {

    return false;

  }

  if (
    !isNonEmptyString(
      value.title,
    )
  ) {

    return false;

  }

  if (
    !isString(
      value.description,
    )
  ) {

    return false;

  }

  if (
    !isString(
      value.author,
    )
  ) {

    return false;

  }

  if (
    !isValidDateString(
      value.modifiedAt,
    )
  ) {

    return false;

  }

  if (
    !isNonNegativeInteger(
      value.version,
    ) ||
    value.version < 1
  ) {

    return false;

  }

  return true;

}

// ============================================================
// VALIDATE DOCUMENT
// ============================================================

function validateDocument(
  value: unknown,
): value is SerializedAuthorDocument {

  if (
    !isRecord(value)
  ) {

    return false;

  }

  if (
    !validateDocumentIdentity(
      value.identity,
    )
  ) {

    return false;

  }

  if (
    !validateDocumentMetadata(
      value.metadata,
    )
  ) {

    return false;

  }

  if (
    !isAuthorDocumentType(
      value.type,
    )
  ) {

    return false;

  }

  if (
    !isAuthorDocumentStatus(
      value.status,
    )
  ) {

    return false;

  }

  if (
    !Array.isArray(
      value.nodes,
    )
  ) {

    return false;

  }

  for (
    const node
    of value.nodes
  ) {

    if (
      !validateAuthorNode(
        node,
      )
    ) {

      return false;

    }

  }

  return true;

}

// ============================================================
// CLASSIFY AUTHOR NODE
// ============================================================
//
// This is the critical P56 semantic boundary.
//
// REFERENCE
//
//   Existing computational identity.
//
// OBSERVATION
//
//   Explicit researcher assertion intended to enter KOM.
//
// EVERYTHING ELSE
//
//   Canonical Author Document content.
//
//   It remains computationally available to the Author system,
//   but ingestion does not automatically claim it as knowledge.
//
// Future REX / semantic expansion may inspect such narrative
// content and propose candidates.
//
// ============================================================

function classifyAuthorNode(
  node: SerializedAuthorNode,
): IngestibleAuthorNode["classification"] {

  if (
    node.type ===
    AuthorNodeTypes.REFERENCE
  ) {

    return (
      AuthorIngestionClassifications
        .EXISTING_REFERENCE
    );

  }

  if (
    node.type ===
    AuthorNodeTypes.OBSERVATION
  ) {

    return (
      AuthorIngestionClassifications
        .NEW_AUTHORIAL_CONTENT
    );

  }

  return (
    AuthorIngestionClassifications
      .NON_COMPUTATIONAL_CONTENT
  );

}

// ============================================================
// BUILD ARTIFACT PROVENANCE
// ============================================================

function buildArtifactProvenance(
  document: SerializedAuthorDocument,
): AuthorArtifactProvenance {

  return {

    sourceId:
      document.identity.id,

    sourceType:
      AUTHOR_ARTIFACT_SOURCE_TYPE,

    sourceRevision:
      document.metadata.version,

    createdAt:
      document.identity.createdAt,

    modifiedAt:
      document.metadata.modifiedAt,

  };

}

// ============================================================
// BUILD INGESTIBLE NODES
// ============================================================

function buildIngestibleNodes(
  document: SerializedAuthorDocument,
  provenance: AuthorArtifactProvenance,
): readonly IngestibleAuthorNode[] {

  return document.nodes.map(
    node => ({

      node,

      classification:
        classifyAuthorNode(
          node,
        ),

      documentId:
        document.identity.id,

      documentVersion:
        document.metadata.version,

      provenance,

    }),
  );

}

// ============================================================
// BUILD PARSED ARTIFACT
// ============================================================

function buildParsedArtifact(
  artifact: AuthorArtifact,
): ParsedAuthorArtifact {

  const document =
    artifact.document;

  const provenance =
    buildArtifactProvenance(
      document,
    );

  const nodes =
    buildIngestibleNodes(
      document,
      provenance,
    );

  return {

    artifact,

    document,

    provenance,

    nodes,

  };

}

// ============================================================
// PARSE UNKNOWN VALUE
// ============================================================

export function parseAuthorArtifactValue(
  value: unknown,
): AuthorArtifactParseResult {

  // ----------------------------------------------------------
  // TOP-LEVEL ENVELOPE
  // ----------------------------------------------------------

  if (
    !isRecord(value)
  ) {

    return {

      ok:
        false,

      error:
        "Author artifact must be a JSON object.",

    };

  }

  // ----------------------------------------------------------
  // ARTIFACT TYPE
  // ----------------------------------------------------------

  if (
    value.artifactType !==
    AUTHOR_ARTIFACT_TYPE
  ) {

    return {

      ok:
        false,

      error:
        `Unsupported artifact type. Expected ${AUTHOR_ARTIFACT_TYPE}.`,

    };

  }

  // ----------------------------------------------------------
  // SCHEMA VERSION
  // ----------------------------------------------------------

  if (
    value.schemaVersion !==
    AUTHOR_ARTIFACT_SCHEMA_VERSION
  ) {

    return {

      ok:
        false,

      error:
        `Unsupported .author schema version. Expected ${AUTHOR_ARTIFACT_SCHEMA_VERSION}.`,

    };

  }

  // ----------------------------------------------------------
  // DOCUMENT
  // ----------------------------------------------------------

  if (
    !validateDocument(
      value.document,
    )
  ) {

    return {

      ok:
        false,

      error:
        "Invalid canonical Author Document structure.",

    };

  }

  // ----------------------------------------------------------
  // CANONICAL ARTIFACT
  // ----------------------------------------------------------

  if (
    !isAuthorArtifact(
      value,
    )
  ) {

    return {

      ok:
        false,

      error:
        "Invalid ISEES_AUTHOR artifact envelope.",

    };

  }

  const artifact:
    AuthorArtifact = {

      artifactType:
        AUTHOR_ARTIFACT_TYPE,

      schemaVersion:
        AUTHOR_ARTIFACT_SCHEMA_VERSION,

      document:
        value.document,

  };

  // ----------------------------------------------------------
  // SUCCESS
  // ----------------------------------------------------------

  return {

    ok:
      true,

    value:
      buildParsedArtifact(
        artifact,
      ),

  };

}

// ============================================================
// PARSE JSON TEXT
// ============================================================

export function parseAuthorArtifactJson(
  json: string,
): AuthorArtifactParseResult {

  let value:
    unknown;

  try {

    value =
      JSON.parse(
        json,
      );

  } catch {

    return {

      ok:
        false,

      error:
        "Author artifact contains invalid JSON.",

    };

  }

  return parseAuthorArtifactValue(
    value,
  );

}

// ============================================================
// PARSER FACADE
// ============================================================

export class AuthorArtifactParser {

  public static parseJson(
    json: string,
  ): AuthorArtifactParseResult {

    return parseAuthorArtifactJson(
      json,
    );

  }

  public static parseValue(
    value: unknown,
  ): AuthorArtifactParseResult {

    return parseAuthorArtifactValue(
      value,
    );

  }

}

// ============================================================
// END
// ============================================================