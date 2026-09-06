import { NIMITZ_2004 } from "../../../canonical/nimitz_2004.ts";
import { ROOSEVELT_2015 } from "../../../canonical/roosevelt_2015.ts";
import { RENDLESHAM_1980 } from "../../../canonical/rendlesham_1980.ts";
import type { CanonicalReplayEvent } from "../../../adapters/canonicalEventAdapter.ts";
import { OverviewFrontDoorManifestation, type OverviewFrontDoorProjection } from "../../../investigation/frontDoor/FrontDoorProjectionTypes.ts";
import { InvestigationLibraryStatus } from "../../../investigation/frontDoor/FrontDoorProjectionTypes.ts";

export type OverviewCompositionKind = "CLOSED" | "GUEST_GATEWAY" | "NEW_ACCOUNT_GATEWAY" | "RETURNING_ACCOUNT" | "ACCOUNT_UNRESOLVED";

export function resolveOverviewCompositionKind(projection: OverviewFrontDoorProjection | null): OverviewCompositionKind {
  if (projection === null || projection.status !== "VALID") return "CLOSED";
  switch (projection.manifestation) {
    case OverviewFrontDoorManifestation.NEW_ACCOUNT: return "NEW_ACCOUNT_GATEWAY";
    case OverviewFrontDoorManifestation.RETURNING_ACCOUNT: return "RETURNING_ACCOUNT";
    case OverviewFrontDoorManifestation.ACCOUNT_LIBRARY_UNRESOLVED: return "ACCOUNT_UNRESOLVED";
    default: return "GUEST_GATEWAY";
  }
}

export const HYDRATED_OVERVIEW_EVENT_IDS = Object.freeze([
  "E-TICTAC-2004", "E-ROOSEVELT-2015", "E-RENDLESHAM-1980",
] as const);

const HYDRATED_CANONICAL_EVENTS = Object.freeze([NIMITZ_2004, ROOSEVELT_2015, RENDLESHAM_1980]);

const EVENT_PRESENTATION = Object.freeze({
  "E-TICTAC-2004": Object.freeze({ year: "2004", location: "Pacific Ocean / California" }),
  "E-ROOSEVELT-2015": Object.freeze({ year: "2015", location: "Atlantic Ocean / Virginia training areas" }),
  "E-RENDLESHAM-1980": Object.freeze({ year: "1980", location: "Suffolk, England" }),
});

export interface OverviewCanonCard { readonly eventId: string; readonly title: string; readonly year: string; readonly location: string; readonly classification: string; readonly vectors: readonly string[]; }

export function projectHydratedOverviewEvents(events: readonly CanonicalReplayEvent[] = HYDRATED_CANONICAL_EVENTS): readonly OverviewCanonCard[] {
  const eventsById = new Map(events.map(event => [event.event_id, event]));
  return Object.freeze(HYDRATED_OVERVIEW_EVENT_IDS.flatMap(eventId => {
    const event = eventsById.get(eventId);
    if (event === undefined) return [];
    const presentation = EVENT_PRESENTATION[eventId];
    return [Object.freeze({ eventId: event.event_id, title: event.event_name, year: presentation.year, location: presentation.location,
      classification: event.classification.replaceAll("_", " "),
      vectors: Object.freeze([...(event.operational_intelligence?.investigation_vectors ?? [])].slice(0, 2)) })];
  }));
}

export interface OverviewRepository { readonly name: string; readonly state: "REFERENCE" | "EXTERNAL READING" | "PLANNED"; readonly note: string; }

export type OverviewSelection =
  | Readonly<{ readonly kind: "NONE" }>
  | Readonly<{ readonly kind: "CANON_EVENT"; readonly eventId: string; readonly title: string; readonly year: string; readonly location: string; readonly classification: string; readonly vectors: readonly string[] }>
  | Readonly<{ readonly kind: "EXTERNAL_REPOSITORY"; readonly name: string; readonly capability: OverviewRepository["state"]; readonly note: string }>
  | Readonly<{ readonly kind: "OWNED_INVESTIGATION"; readonly investigationId: string; readonly title: string }>;

export const NO_OVERVIEW_SELECTION: OverviewSelection = Object.freeze({ kind: "NONE" });
export interface OverviewSelectionEnvelope { readonly authorityEpoch: string; readonly selection: OverviewSelection; }
export interface OverviewSelectionAuthority { readonly kind: "GUEST" | "ACCOUNT"; readonly principalId: string; readonly establishedAt: string; readonly revision: number; }
export interface OverviewSelectionLibrary { readonly status: InvestigationLibraryStatus; readonly summaries: readonly Readonly<{ readonly investigationId: string; readonly title: string }>[]; }

export function overviewAuthorityEpoch(authority: OverviewSelectionAuthority | null): string | null {
  return authority === null ? null : JSON.stringify([authority.kind, authority.principalId, authority.establishedAt, authority.revision]);
}

export function commitOverviewSelection(capturedEpoch: string | null, currentEpoch: string | null, selection: OverviewSelection): OverviewSelectionEnvelope | null {
  return capturedEpoch !== null && capturedEpoch === currentEpoch ? Object.freeze({ authorityEpoch: capturedEpoch, selection }) : null;
}

export function resolveOverviewSelection(envelope: OverviewSelectionEnvelope | null, authority: OverviewSelectionAuthority | null, library: OverviewSelectionLibrary): OverviewSelection {
  const epoch = overviewAuthorityEpoch(authority);
  if (epoch === null || envelope === null || envelope.authorityEpoch !== epoch) return NO_OVERVIEW_SELECTION;
  if (envelope.selection.kind !== "OWNED_INVESTIGATION") return envelope.selection;
  const ownedInvestigationId = envelope.selection.investigationId;
  return authority?.kind === "ACCOUNT"
    && library.status === InvestigationLibraryStatus.READY
    && library.summaries.some(summary => summary.investigationId === ownedInvestigationId)
    ? envelope.selection
    : NO_OVERVIEW_SELECTION;
}

export const OVERVIEW_REPOSITORIES: readonly OverviewRepository[] = Object.freeze([
  Object.freeze({ name: "SCU", state: "EXTERNAL READING", note: "Independent source material; no live connection." }),
  Object.freeze({ name: "AARO", state: "REFERENCE", note: "Public reference orientation only." }),
  Object.freeze({ name: "MUFON", state: "PLANNED", note: "Connectivity is not operational." }),
  Object.freeze({ name: "NUFORC", state: "EXTERNAL READING", note: "Browse outside iSEES; no data is imported here." }),
  Object.freeze({ name: "Zenodo", state: "REFERENCE", note: "General research repository orientation." }),
  Object.freeze({ name: "National Archives", state: "EXTERNAL READING", note: "Public archival reading; no federation implied." }),
] as const);

export const CANON_PRESENTATION_VISUAL = Object.freeze({ label: "Abstract presentation graphic; shared across cards and not event evidence", provenance: null, evidence: null });
