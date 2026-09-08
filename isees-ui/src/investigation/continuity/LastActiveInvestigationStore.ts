const KEY_PREFIX = "isees.account.lastActiveInvestigation.v1:";
export interface LastActiveStore { read(accountId: string): string | null; write(accountId: string, investigationId: string): void; }
export function createLastActiveInvestigationStore(storage: Pick<Storage, "getItem" | "setItem"> = localStorage): LastActiveStore {
  const key = (accountId: string) => `${KEY_PREFIX}${encodeURIComponent(accountId)}`;
  return Object.freeze({
    read(accountId: string) { const value = storage.getItem(key(accountId)); return value?.trim() || null; },
    write(accountId: string, investigationId: string) { storage.setItem(key(accountId), investigationId); },
  });
}
