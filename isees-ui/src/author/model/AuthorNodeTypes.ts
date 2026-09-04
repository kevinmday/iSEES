// ============================================================
// src/author/model/AuthorNodeTypes.ts
// P56
// AUTHOR NODE TYPES
//
// Canonical semantic node vocabulary for Computational Author
// Documents.
//
// These nodes describe computational document meaning
// independently of Lexical, Markdown, DOCX, PDF, HTML, or any
// other projection.
//
// P56:
//
// • REFERENCE represents knowledge already known or addressed
//   by the investigation.
//
// • OBSERVATION represents new knowledge explicitly asserted
//   by the researcher.
//
// • OBSERVATION may deterministically identify the existing
//   references to which the assertion relates.
//
// ============================================================

// ============================================================
// NODE TYPES
// ============================================================

export const AuthorNodeTypes = {

  PARAGRAPH:
    "PARAGRAPH",

  HEADING:
    "HEADING",

  QUOTE:
    "QUOTE",

  LIST:
    "LIST",

  CODE:
    "CODE",

  TABLE:
    "TABLE",

  IMAGE:
    "IMAGE",

  CITATION:
    "CITATION",

  REFERENCE:
    "REFERENCE",

  OBSERVATION:
    "OBSERVATION",

  DIVIDER:
    "DIVIDER",

  CUSTOM:
    "CUSTOM",

} as const;

export type AuthorNodeType =
  typeof AuthorNodeTypes[
    keyof typeof AuthorNodeTypes
  ];

// ============================================================
// BASE NODE
// ============================================================

/**
 * Every computational document node derives
 * from this canonical contract.
 */
export interface AuthorNode {

  readonly id:
    string;

  readonly type:
    AuthorNodeType;

}

// ============================================================
// PARAGRAPH
// ============================================================

/**
 * Textual content.
 *
 * Paragraph text is authored narrative.
 *
 * It is NOT automatically considered a computational
 * observation merely because it exists in a document.
 *
 * Future semantic processing may inspect paragraph content
 * and propose computational knowledge candidates.
 */
export interface ParagraphNode
  extends AuthorNode {

  text:
    string;

}

// ============================================================
// HEADING
// ============================================================

/**
 * Section heading.
 */
export interface HeadingNode
  extends AuthorNode {

  level:
    number;

  text:
    string;

}

// ============================================================
// QUOTE
// ============================================================

/**
 * Quoted content.
 */
export interface QuoteNode
  extends AuthorNode {

  text:
    string;

}

// ============================================================
// CITATION
// ============================================================

/**
 * Source citation.
 */
export interface CitationNode
  extends AuthorNode {

  citation:
    string;

}

// ============================================================
// REFERENCE
// ============================================================

/**
 * Computational reference to an external
 * knowledge object.
 *
 * The Author Document never owns Investigation
 * data. Instead it stores deterministic
 * references that projection runtimes may
 * render as citations, cards, hyperlinks,
 * expandable widgets, or other visual forms.
 *
 * A REFERENCE does not itself assert new knowledge.
 */
export interface ReferenceNode
  extends AuthorNode {

  /**
   * Target object category.
   */
  targetType:
    "NODE"
    | "EDGE"
    | "ARTIFACT"
    | "DOCUMENT";

  /**
   * Stable identifier of the referenced object.
   */
  targetId:
    string;

  /**
   * Human-readable title captured at the time
   * of insertion.
   */
  title:
    string;

  /**
   * Corpus or provider.
   */
  source:
    string;

  /**
   * External corpus identifier.
   */
  corpusId:
    string;

  /**
   * Graph connectivity snapshot.
   */
  connections?:
    number;

  /**
   * Confidence snapshot.
   */
  confidence?:
    number;

  /**
   * Optional descriptive summary captured
   * during insertion.
   */
  summary?:
    string;

  /**
   * UTC timestamp indicating when this
   * reference entered the document.
   */
  insertedAt:
    Date;

  /** Frozen Research ingress provenance. A REFERENCE does not imply a claim or citation. */
  researchSource?: Readonly<{
    anchorId: string;
    sourceKind: string;
    sourceIdentity: string;
    sourceInvestigationId: string;
    sourceWorkspace: string;
    sourceRevisionId?: string;
    sourceExecutionId?: string;
    sourceProjectionId?: string;
    classification: "CANONICAL" | "RESEARCHER_GENERATED" | "UNDETERMINED";
    capturedRepresentation: unknown;
  }>;

}

// ============================================================
// OBSERVATION
// ============================================================

/**
 * Explicit researcher-authored computational observation.
 *
 * OBSERVATION is semantically different from PARAGRAPH.
 *
 * PARAGRAPH:
 *
 *   narrative authored text
 *
 * OBSERVATION:
 *
 *   an explicit assertion intended to enter the
 *   computational knowledge pipeline
 *
 * During Author artifact ingestion, an ObservationNode may
 * therefore be compiled into a candidate Knowledge Object
 * without treating ordinary narrative prose as established
 * computational knowledge.
 */
export interface ObservationNode
  extends AuthorNode {

  /**
   * Canonical natural-language assertion supplied
   * by the researcher.
   *
   * The original assertion is preserved verbatim so
   * downstream computation retains provenance.
   */
  text:
    string;

  /**
   * Origin of the observation.
   *
   * Initial P56 authored observations use:
   *
   *   AUTHOR
   *
   * The field remains a string so later canonical
   * provenance sources can be introduced without
   * coupling this model to a UI implementation.
   */
  source:
    string;

  /**
   * Stable identifiers of existing objects explicitly
   * associated with this observation at authoring time.
   *
   * Example:
   *
   * [
   *   "facility:RAF Woodbridge"
   * ]
   *
   * These are deterministic author-declared relations.
   *
   * They are NOT entities inferred from the observation
   * text. Semantic discovery of previously unrecognized
   * entities belongs to later investigative expansion.
   */
  relatedReferences:
    string[];

  /**
   * UTC timestamp indicating when the researcher
   * created the observation.
   */
  createdAt:
    Date;

}

// ============================================================
// IMAGE
// ============================================================

/**
 * Image placeholder.
 */
export interface ImageNode
  extends AuthorNode {

  source:
    string;

}

// ============================================================
// TABLE
// ============================================================

/**
 * Table placeholder.
 */
export interface TableNode
  extends AuthorNode {

  rows:
    number;

  columns:
    number;

}
