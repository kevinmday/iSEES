import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guestWebDiscoveryApi, GuestWebDiscoveryError, type GuestWebDiscoveryOutcome } from "./GuestWebDiscoveryApi.ts";

const identity = (kind: string) => `guest-web-discovery-${kind}-${crypto.randomUUID()}`;

function visible(error: unknown): string {
  const structural = (error as { code?: unknown })?.code;
  const code = error instanceof GuestWebDiscoveryError ? error.code : typeof structural === "string" ? structural : "";
  const messages: Record<string, string> = {
    GUEST_ALLOWANCE_EXHAUSTED: "Your Guest Basic Search allowance has been used. An account can hold future research, but these Guest results will not transfer.",
    GUEST_GLOBAL_BUDGET_EXHAUSTED: "Guest Basic Search is paused because the shared operator-funded budget is exhausted.",
    GUEST_SEARCH_UNAVAILABLE: "Guest Basic Search is currently disabled or unavailable.",
    AUTHENTICATION_REQUIRED: "Your Guest session expired. Run a new search to establish a new disposable session.",
    CSRF_REJECTED: "The secure Guest session could not be verified.",
    CSRF_TOKEN_MISSING: "The secure Guest session could not be verified.",
    CSRF_TOKEN_INVALID: "The secure Guest session could not be verified.",
  };
  return messages[code] ?? (error instanceof Error ? error.message : "Guest Basic Search failed safely.");
}

export function useGuestWebDiscoveryWorkspaceController(enabled: boolean, contextKey: string) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [response, setResponse] = useState<GuestWebDiscoveryOutcome>();
  const [error, setError] = useState<string>();
  const generation = useRef(0);
  const active = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    generation.current += 1;
    active.current?.abort();
    active.current = undefined;
    setQuery("");
    setSearching(false);
    setResponse(undefined);
    setError(undefined);
  }, [enabled, contextKey]);
  useEffect(() => () => { generation.current += 1; active.current?.abort(); }, []);

  const search = useCallback(async () => {
    const normalized = query.trim();
    if (!enabled || !normalized || searching) return;
    active.current?.abort();
    const controller = new AbortController();
    const ticket = ++generation.current;
    active.current = controller;
    setSearching(true);
    setResponse(undefined);
    setError(undefined);
    try {
      await guestWebDiscoveryApi.ensureSession(controller.signal);
      const outcome = await guestWebDiscoveryApi.search(normalized, identity("operation"), identity("idempotency"), controller.signal);
      if (controller.signal.aborted || generation.current !== ticket) return;
      setResponse(outcome);
      if (outcome.operationState === "UNKNOWN") setError("The provider outcome is UNKNOWN. No automatic retry will be made; the allowance is held conservatively.");
      else if (outcome.error) setError(`${outcome.error.code}: ${outcome.error.message}`);
    } catch (caught) {
      if (!controller.signal.aborted && generation.current === ticket) setError(visible(caught));
    } finally {
      if (generation.current === ticket) { active.current = undefined; setSearching(false); }
    }
  }, [enabled, query, searching]);

  return useMemo(() => ({ query, setQuery, searching, response, error, search }), [query, searching, response, error, search]);
}
