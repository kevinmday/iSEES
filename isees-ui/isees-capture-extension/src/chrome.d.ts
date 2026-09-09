declare namespace chrome {
  namespace storage {
    interface Area { get(keys: string | string[]): Promise<Record<string, unknown>>; set(items: Record<string, unknown>): Promise<void>; remove(keys: string | string[]): Promise<void>; }
    const local: Area;
  }
  namespace tabs { interface Tab { id?: number; url?: string; } function query(queryInfo: { active: boolean; currentWindow: boolean }): Promise<Tab[]>; }
  namespace scripting {
    function executeScript<T>(injection: { target: { tabId: number }; func: () => T }): Promise<Array<{ result?: T }>>;
  }
  namespace downloads { function download(options: { url: string; filename: string; saveAs: boolean; conflictAction: "uniquify" }): Promise<number>; }
}
