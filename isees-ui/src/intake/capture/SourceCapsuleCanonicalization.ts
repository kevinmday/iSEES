import type { SourceCapsuleV1, SourcePassageV1, UnsignedSourceCapsuleV1, UnsignedSourcePassageV1 } from "./SourceCapsuleV1.ts";

const compareUnicode = (left: string, right: string): number => {
  const a = Array.from(left, character => character.codePointAt(0)!);
  const b = Array.from(right, character => character.codePointAt(0)!);
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    if (a[index] !== b[index]) return a[index]! - b[index]!;
  }
  return a.length - b.length;
};

function canonicalValue(value: unknown): unknown {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid canonical timestamp.");
    return value.toISOString();
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => compareUnicode(left, right))
      .map(([key, item]) => {
        if (item === undefined) throw new Error(`Undefined is not canonical JSON (${key}).`);
        return [key, canonicalValue(item)];
      }));
  }
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Unsupported canonical JSON value: ${typeof value}.`);
}

/**
 * Canonical v1 bytes are UTF-8 JSON with Unicode code-point ordered object keys and no
 * insignificant whitespace. Arrays retain their supplied order: redirect order is causal,
 * passage order is capture order, note order is attribution order, and lineage order is
 * researcher-supplied order. Timestamps and URLs must already satisfy validation and are
 * serialized verbatim. Passage text, including every line ending, is never normalized.
 */
export function canonicalizeSourceCapsuleJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

export async function sha256SourceCapsuleValue(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalizeSourceCapsuleJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `sha256:${Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function passageHashBasis(passage: SourcePassageV1 | UnsignedSourcePassageV1): UnsignedSourcePassageV1 {
  const { passageHash: _excluded, ...basis } = passage as SourcePassageV1;
  return basis;
}

export function capsuleHashBasis(capsule: SourceCapsuleV1): Omit<SourceCapsuleV1, "integrity"> {
  const { integrity: _excluded, ...basis } = capsule;
  return basis;
}

export async function createSourceCapsuleV1(unsigned: UnsignedSourceCapsuleV1): Promise<SourceCapsuleV1> {
  const passages: SourcePassageV1[] = await Promise.all(unsigned.passages.map(async passage => ({
    ...passage,
    passageHash: await sha256SourceCapsuleValue(passageHashBasis(passage)),
  })));
  const basis = { ...unsigned, passages };
  return { ...basis, integrity: { algorithm: "SHA-256", capsuleHash: await sha256SourceCapsuleValue(basis) } };
}

export function serializeSourceCapsuleV1(capsule: SourceCapsuleV1): string {
  return canonicalizeSourceCapsuleJson(capsule);
}
