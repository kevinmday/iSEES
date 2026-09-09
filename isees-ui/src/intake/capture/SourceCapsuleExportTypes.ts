import type {
  PrivacyClassification,
  ResearcherNoteV1,
  RightsClassification,
  SourceCapsuleV1,
  UnsignedSourcePassageV1,
} from "./SourceCapsuleV1.ts";

export interface SourceCapsuleExportRequest {
  confirmed: true;
  capsuleId: string;
  capturedAt: string;
  source: SourceCapsuleV1["source"];
  rightsClassification: RightsClassification;
  privacyClassification: PrivacyClassification;
  passages: UnsignedSourcePassageV1[];
  researcherNotes: ResearcherNoteV1[];
  filenameStem?: string;
}

export type SourceCapsuleExportErrorCode =
  | "CAPTURE_NOT_CONFIRMED"
  | "MALFORMED_EXPORT_REQUEST"
  | "UNSAFE_FILENAME"
  | "SOURCE_CAPSULE_VALIDATION_FAILED"
  | "FORBIDDEN_MATERIAL"
  | "EXPORT_ENCODING_FAILED";

export type DeepReadonly<T> = T extends (...arguments_: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export interface SourceCapsuleExportArtifact {
  readonly filename: string;
  readonly mediaType: "application/json";
  readonly canonicalJson: string;
  readonly byteLength: number;
  readonly capsuleHash: string;
  readonly capsule: DeepReadonly<SourceCapsuleV1>;
  /** Returns a new byte array on every call; callers cannot mutate retained export state. */
  readonly utf8Bytes: () => Uint8Array;
}
