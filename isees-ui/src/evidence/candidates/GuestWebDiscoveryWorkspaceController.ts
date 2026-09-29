import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { guestWebDiscoveryApi, GuestWebDiscoveryError, type GuestWebDiscoveryOutcome } from "./GuestWebDiscoveryApi.ts";
import { projectGuestDiscoveryPreview, type GuestDiscoveryConnection, type GuestDiscoveryLead, type GuestDiscoveryTarget } from "./GuestDiscoveryPreview.ts";

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

export function useGuestWebDiscoveryWorkspaceController(enabled: boolean, contextKey: string, investigationId: string, proposedBy: string, targets: readonly GuestDiscoveryTarget[] = [], activeLayerIds: readonly string[] = []) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [response, setResponse] = useState<GuestWebDiscoveryOutcome>();
  const [error, setError] = useState<string>();
  const [leads, setLeads] = useState<readonly GuestDiscoveryLead[]>([]);
  const [pendingResult, setPendingResult] = useState<GuestWebDiscoveryOutcome["results"][number]>();
  const [connection, setConnection] = useState<GuestDiscoveryConnection>();
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
    setLeads([]); setPendingResult(undefined); setConnection(undefined);
  }, [enabled, contextKey]);
  useEffect(() => {
    if (!enabled || leads.length === 0) return;
    const expiries = leads.map((lead) => lead.expiresAt ? Date.parse(lead.expiresAt) : Number.POSITIVE_INFINITY);
    const next = Math.min(...expiries);
    if (!Number.isFinite(next)) return;
    const timeout = window.setTimeout(() => { setLeads((current) => current.filter((lead) => !lead.expiresAt || Date.parse(lead.expiresAt) > Date.now())); setConnection((current) => current && leads.some((lead) => lead.leadId === current.leadId && (!lead.expiresAt || Date.parse(lead.expiresAt) > Date.now())) ? current : undefined); }, Math.max(0, next - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [enabled, leads]);
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

  const requestAddLead = useCallback((result: GuestWebDiscoveryOutcome["results"][number]) => setPendingResult(result), []);
  const cancelAddLead = useCallback(() => setPendingResult(undefined), []);
  const confirmAddLead = useCallback(() => {
    if (!pendingResult || !response) return;
    const lead: GuestDiscoveryLead = Object.freeze({ leadId: `guest-lead:${pendingResult.resultId}`, result: pendingResult, query: response.normalizedQuery ?? query.trim(), provider: response.providerAttribution ?? pendingResult.attribution, expiresAt: response.expiresAt });
    setLeads((current) => current.some((item) => item.leadId === lead.leadId) ? current : Object.freeze([...current, lead]));
    setPendingResult(undefined);
  }, [pendingResult, query, response]);
  const removeLead = useCallback((leadId: string) => { setLeads((current) => current.filter((lead) => lead.leadId !== leadId)); setConnection((current) => current?.leadId === leadId ? undefined : current); }, []);
  const reset = useCallback(() => { setLeads([]); setPendingResult(undefined); setConnection(undefined); setResponse(undefined); setQuery(""); }, []);
  const proposeConnection = useCallback((next: GuestDiscoveryConnection) => setConnection(next), []);
  const selectedLead = leads.find((lead) => lead.leadId === connection?.leadId);
  const preview = selectedLead && connection ? projectGuestDiscoveryPreview({ investigationId, proposedBy, lead: selectedLead, connection, targets, activeLayerIds }) : undefined;

  return useMemo(() => ({ query, setQuery, searching, response, error, leads, pendingResult, connection, preview, search, requestAddLead, cancelAddLead, confirmAddLead, removeLead, reset, proposeConnection }), [query, searching, response, error, leads, pendingResult, connection, preview, search, requestAddLead, cancelAddLead, confirmAddLead, removeLead, reset, proposeConnection]);
}
