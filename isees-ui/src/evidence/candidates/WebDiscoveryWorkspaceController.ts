import { useCallback, useEffect, useMemo, useState } from "react";
import type { CandidateEvidenceApiScope, CandidateEvidenceHttpError } from "./CandidateEvidenceApi";
import { buildWebDiscoveryCaptureCommand, buildWebDiscoverySearchCommand, webDiscoveryApi } from "./WebDiscoveryApi";
import type { WebDiscoveryCaptureDisposition, WebDiscoverySearchResponse, WebDiscoverySearchResult } from "./WebDiscoveryApi";

export const WEB_DISCOVERY_ADAPTER = Object.freeze({ id: "offline-web-discovery-fixture", version: "1.0.0" });
export interface WebDiscoveryRevisionBinding { readonly investigationAggregateRevision: number; readonly manifoldRevisionId: string }
interface CaptureConfirmation { readonly result: WebDiscoverySearchResult; readonly operationId: string; readonly idempotencyKey: string }
export interface CapturedResult { readonly candidateId: string; readonly disposition: WebDiscoveryCaptureDisposition }

const commandIdentity = (kind: string): string => `web-discovery-${kind}-${crypto.randomUUID()}`;
function visibleError(error: unknown, action: "search" | "capture"): string {
  const http = error as CandidateEvidenceHttpError;
  const code = http?.backendError?.code ?? "";
  if (http?.status === 401 || code.includes("UNAUTHENTICATED")) return "Your authenticated session has expired. Sign in again, then retry deliberately.";
  if (http?.status === 403 || code.includes("OWNERSHIP")) return "This Investigation is not available to the authenticated account. Reopen an Investigation you own.";
  if (http?.status === 409 || code.includes("REVISION")) return "The Investigation or Manifold revision changed. Refresh Candidate Evidence before searching or capturing again.";
  if (code.includes("SESSION") || code.includes("EXPIRED")) return "This discovery session expired. Run the search again before capturing.";
  return error instanceof Error ? error.message : `Web Discovery ${action} failed.`;
}

export function useWebDiscoveryWorkspaceController(scope: CandidateEvidenceApiScope | undefined, binding: WebDiscoveryRevisionBinding | undefined, onCandidateCaptured: (candidateId: string) => Promise<void>) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [response, setResponse] = useState<WebDiscoverySearchResponse>();
  const [error, setError] = useState<string>();
  const [confirmation, setConfirmation] = useState<CaptureConfirmation>();
  const [researcherNote, setResearcherNote] = useState("");
  const [capturePending, setCapturePending] = useState<string>();
  const [captured, setCaptured] = useState<Readonly<Record<string, CapturedResult>>>({});
  const bindingKey = scope && binding ? `${scope.principalId}\u0000${scope.investigationId}\u0000${binding.investigationAggregateRevision}\u0000${binding.manifoldRevisionId}` : "unavailable";

  useEffect(() => { setResponse(undefined); setError(undefined); setConfirmation(undefined); setResearcherNote(""); setCapturePending(undefined); setCaptured({}); }, [bindingKey]);

  const search = useCallback(async () => {
    const normalized = query.trim();
    if (!normalized || !scope || !binding || searching) return;
    const searchSessionId = commandIdentity("session");
    const operationId = commandIdentity("search-operation");
    const idempotencyKey = commandIdentity("search-idempotency");
    setSearching(true); setError(undefined); setConfirmation(undefined); setCaptured({});
    try {
      const outcome = await webDiscoveryApi.search(scope, buildWebDiscoverySearchCommand({ investigationId: scope.investigationId, expectedInvestigationRevision: binding.investigationAggregateRevision, manifoldRevisionId: binding.manifoldRevisionId, searchSessionId, operationId, query: normalized, resultLimit: 10, adapterId: WEB_DISCOVERY_ADAPTER.id, adapterVersion: WEB_DISCOVERY_ADAPTER.version, idempotencyKey }));
      setResponse(outcome);
      if (outcome.error) setError(`${outcome.error.code}: ${outcome.error.message}`);
    } catch (caught) { setError(visibleError(caught, "search")); setResponse(undefined); }
    finally { setSearching(false); }
  }, [binding, query, scope, searching]);

  const requestCapture = useCallback((result: WebDiscoverySearchResult) => {
    if (capturePending) return;
    setResearcherNote(""); setError(undefined);
    setConfirmation({ result, operationId: commandIdentity("capture-operation"), idempotencyKey: commandIdentity("capture-idempotency") });
  }, [capturePending]);
  const cancelCapture = useCallback(() => { if (!capturePending) { setConfirmation(undefined); setResearcherNote(""); } }, [capturePending]);
  const confirmCapture = useCallback(async () => {
    if (!scope || !binding || !response || !confirmation || capturePending) return;
    const resultId = confirmation.result.resultId;
    setCapturePending(resultId); setError(undefined);
    try {
      const outcome = await webDiscoveryApi.capture(scope, buildWebDiscoveryCaptureCommand({ investigationId: scope.investigationId, expectedInvestigationRevision: binding.investigationAggregateRevision, manifoldRevisionId: binding.manifoldRevisionId, searchSessionId: response.searchSessionId, resultId, operationId: confirmation.operationId, idempotencyKey: confirmation.idempotencyKey, ...(researcherNote.trim() ? { researcherNote: researcherNote.trim() } : {}) }));
      setCaptured((current) => ({ ...current, [resultId]: { candidateId: outcome.candidateId, disposition: outcome.idempotencyDisposition } }));
      setConfirmation(undefined); setResearcherNote("");
      await onCandidateCaptured(outcome.candidateId);
    } catch (caught) { setError(visibleError(caught, "capture")); }
    finally { setCapturePending(undefined); }
  }, [binding, capturePending, confirmation, onCandidateCaptured, researcherNote, response, scope]);

  return useMemo(() => ({ query, setQuery, searching, response, error, confirmation, researcherNote, setResearcherNote, capturePending, captured, search, requestCapture, cancelCapture, confirmCapture }), [query, searching, response, error, confirmation, researcherNote, capturePending, captured, search, requestCapture, cancelCapture, confirmCapture]);
}
