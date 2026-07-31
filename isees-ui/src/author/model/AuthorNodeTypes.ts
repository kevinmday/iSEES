// ============================================================
// AUTHOR NODE TYPES
// ============================================================

/**
 * Canonical semantic node types.
 *
 * These describe the computational structure
 * of the document independently of any editor
 * implementation or export format.
 */
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

  DIVIDER:
    "DIVIDER",

  CUSTOM:
    "CUSTOM",

} as const;

export type AuthorNodeType =
  typeof AuthorNodeTypes[
    keyof typeof AuthorNodeTypes
  ];

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

/**
 * Textual content.
 */
export interface ParagraphNode
  extends AuthorNode {

  text:
    string;

}

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

/**
 * Quoted content.
 */
export interface QuoteNode
  extends AuthorNode {

  text:
    string;

}

/**
 * Source citation.
 */
export interface CitationNode
  extends AuthorNode {

  citation:
    string;

}

/**
 * External reference.
 */
export interface ReferenceNode
  extends AuthorNode {

  target:
    string;

}

/**
 * Image placeholder.
 */
export interface ImageNode
  extends AuthorNode {

  source:
    string;

}

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