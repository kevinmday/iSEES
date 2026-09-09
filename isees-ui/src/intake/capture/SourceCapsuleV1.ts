export const SOURCE_CAPSULE_SCHEMA_ID = "https://isees.example/schemas/source-capsule/v1" as const;
export const SOURCE_CAPSULE_SCHEMA_VERSION = 1 as const;

export const SOURCE_CAPSULE_LIMITS = Object.freeze({
  maxRedirects: 10,
  maxPassages: 50,
  maxPassageTextBytes: 65_536,
  maxPassageHtmlBytes: 131_072,
  maxContextBytes: 8_192,
  maxNoteBytes: 32_768,
  maxPackageBytes: 1_048_576,
});

export type RightsClassification =
  | "PUBLIC_REFERENCE"
  | "RESEARCHER_OWNED"
  | "PRIVATE_CORRESPONDENCE"
  | "PERSONAL_COMMUNICATION"
  | "RESTRICTED_DISTRIBUTION"
  | "LICENSED_REPOSITORY_CONTENT"
  | "QUOTATION_PERMITTED"
  | "REFERENCE_ONLY"
  | "UNKNOWN_RIGHTS";

export type PrivacyClassification = "PUBLIC" | "PRIVATE" | "RESTRICTED" | "UNKNOWN";

export interface SourcePassageV1 {
  passageId: string;
  exactText: string;
  originalHtml?: string;
  htmlSanitization?: "ISEES_CAPTURE_ALLOWLIST_V1";
  governingHeading?: string;
  prefixContext?: string;
  suffixContext?: string;
  documentPosition?: {
    kind: "TEXT_OFFSETS" | "DOM_PATH" | "PAGE" | "UNKNOWN";
    startOffset?: number;
    endOffset?: number;
    domPath?: string;
    pageNumber?: number;
  };
  selection?: {
    selectionId?: string;
    direction?: "FORWARD" | "BACKWARD" | "NONE";
  };
  passageHash: string;
}

export interface ResearcherNoteV1 {
  noteId: string;
  researcherId: string;
  createdAt: string;
  text: string;
  derivedFromPassageIds?: string[];
}

export interface SourceCapsuleV1 {
  schema: { identity: typeof SOURCE_CAPSULE_SCHEMA_ID; version: typeof SOURCE_CAPSULE_SCHEMA_VERSION };
  capsuleId: string;
  captureMethod: "ISEES_CAPTURE_EXPLICIT";
  capturedAt: string;
  source: {
    identity: string;
    requestedUrl?: string;
    redirectChain?: string[];
    finalUrl: string;
    canonicalUrl?: string;
    pageTitle?: string;
    publisher?: string;
    authorByline?: string;
    publishedAt?: string;
    modifiedAt?: string;
    language?: string;
    revisionIdentity?: string;
  };
  rightsClassification: RightsClassification;
  privacyClassification: PrivacyClassification;
  passages: SourcePassageV1[];
  researcherNotes: ResearcherNoteV1[];
  integrity: { algorithm: "SHA-256"; capsuleHash: string };
}

export type UnsignedSourcePassageV1 = Omit<SourcePassageV1, "passageHash">;
export type UnsignedSourceCapsuleV1 = Omit<SourceCapsuleV1, "integrity" | "passages"> & {
  passages: UnsignedSourcePassageV1[];
};
