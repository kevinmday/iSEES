import { resolveApiBaseUrl } from "../api/ApiOrigin.ts";
import { decodeSystemIdentity, type SystemIdentity } from "./SystemIdentity.ts";

export interface SystemIdentityClientOptions {
  readonly baseUrl?: string;
  readonly fetch?: typeof fetch;
}

export async function loadSystemIdentity(
  options: SystemIdentityClientOptions = {},
  signal?: AbortSignal,
): Promise<SystemIdentity> {
  const fetcher = options.fetch ?? ((input, init) => fetch(input, init));
  const response = await fetcher(`${resolveApiBaseUrl(options.baseUrl)}/api/v1/system/identity`, {
    method: "GET",
    credentials: "include",
    redirect: "error",
    signal,
  });
  if (!response.ok) throw new Error("System Identity is unavailable");
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("System Identity returned a malformed response");
  }
  return decodeSystemIdentity(payload);
}
