// ============================================================
// src/author/artifact/AuthorArtifactSerializer.ts
// P56
// CANONICAL AUTHOR ARTIFACT SERIALIZER
//
// Native iSEES Author artifacts are canonical JSON.
//
// Responsibilities:
//
// • Serialize ComputationalAuthorDocument.
// • Preserve semantic nodes and graph references.
// • Normalize Date values to UTC ISO-8601 strings.
// • Produce deterministic human-inspectable JSON.
// • Remain independent of React and projection formats.
//
// PDF, DOCX, HTML, Markdown, and Lexical are projections.
// .author JSON is the native computational artifact.
//
// ============================================================

import type {
  ComputationalAuthorDocument,
} from "../model/AuthorDocument";

// ============================================================
// ARTIFACT CONTRACT
// ============================================================

export interface SerializedAuthorArtifact {

  artifactType:
    "ISEES_AUTHOR";

  schemaVersion:
    1;

  document:
    unknown;

}

// ============================================================
// DATE NORMALIZATION
// ============================================================

function normalizeValue(
  value: unknown,
): unknown {

  if (value instanceof Date) {

    return value.toISOString();

  }

  if (Array.isArray(value)) {

    return value.map(
      normalizeValue,
    );

  }

  if (
    value !== null &&
    typeof value === "object"
  ) {

    const normalized:
      Record<string, unknown> = {};

    for (
      const [
        key,
        childValue,
      ]
      of Object.entries(value)
    ) {

      normalized[key] =
        normalizeValue(
          childValue,
        );

    }

    return normalized;

  }

  return value;

}

// ============================================================
// SERIALIZATION
// ============================================================

export function serializeAuthorArtifact(
  document:
    ComputationalAuthorDocument,
): string {

  const artifact:
    SerializedAuthorArtifact = {

      artifactType:
        "ISEES_AUTHOR",

      schemaVersion:
        1,

      document:
        normalizeValue(
          document,
        ),

    };

  return JSON.stringify(
    artifact,
    null,
    2,
  );

}

// ============================================================
// FILE NAME
// ============================================================

export function createAuthorArtifactFileName(
  document:
    ComputationalAuthorDocument,
): string {

  const baseName =
    document.metadata.title
      .trim()
      .replace(
        /[^a-zA-Z0-9-_]+/g,
        "_",
      )
      .replace(
        /^_+|_+$/g,
        "",
      );

  return `${
    baseName ||
    "Untitled_Investigation_Document"
  }.author`;

}