const environment = (import.meta as ImportMeta & {
  readonly env?: Readonly<Record<string, string | undefined>>;
}).env;

/**
 * API requests are same-origin by default. An explicit deployment override remains
 * available for environments that deliberately host the API on another origin.
 */
export function resolveApiBaseUrl(override?: string): string {
  return (override ?? environment?.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl();
