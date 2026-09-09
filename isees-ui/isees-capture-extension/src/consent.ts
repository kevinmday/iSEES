export const AGREEMENT_VERSION = "ISEES_CAPTURE_AGREEMENT_V1";
export const AGREEMENT_STORAGE_KEY = "iseesCaptureAgreement";

export interface AgreementRecord { version: typeof AGREEMENT_VERSION; agreedAt: string }

export function isCurrentAgreement(value: unknown): value is AgreementRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 2 && record.version === AGREEMENT_VERSION && typeof record.agreedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.agreedAt);
}

export async function readAgreement(): Promise<AgreementRecord | undefined> {
  const stored = await chrome.storage.local.get(AGREEMENT_STORAGE_KEY);
  return isCurrentAgreement(stored[AGREEMENT_STORAGE_KEY]) ? stored[AGREEMENT_STORAGE_KEY] : undefined;
}

export async function saveAgreement(): Promise<void> {
  await chrome.storage.local.set({ [AGREEMENT_STORAGE_KEY]: { version: AGREEMENT_VERSION, agreedAt: new Date().toISOString() } });
}

export async function withdrawAgreement(): Promise<void> { await chrome.storage.local.remove(AGREEMENT_STORAGE_KEY); }
