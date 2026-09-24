/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { useAccountInvestigationLibrary } from "../../account/AccountInvestigationLibraryContext";
import { InvestigationLibraryStatus } from "../../investigation/frontDoor/FrontDoorProjectionTypes";
import { resolveLibraryVisualAsset, resolveLibraryVisualAssets, type LibraryVisualAsset } from "../../investigation/library/LibraryVisualAssetRegistry";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";
import { WorkspaceMode } from "../runtime/WorkspaceRuntimeTypes";
import GuestCaseIntake from "./GuestCaseIntake";
import OverviewInspector from "./overview/OverviewInspector";
import { OVERVIEW_REPOSITORIES, projectHydratedOverviewEvents, type OverviewRepository } from "./overview/OverviewEndStateModel";
import { useOverviewSelection } from "./overview/OverviewSelectionContext";
import "./LibraryWorkspace.css";
import { resumeCurrentInvestigation } from "./LibraryInvestigationResumeCommand";

interface LibraryNavigationValue { readonly intakeOpen: boolean; readonly enter: (intake?: boolean) => void; readonly closeIntake: () => void; }
const LibraryNavigationContext = createContext<LibraryNavigationValue | undefined>(undefined);

export function LibraryNavigationProvider({ children }: { readonly children: ReactNode }) {
  const runtime = useWorkspaceRuntime();
  const [intakeOpen, setIntakeOpen] = useState(false);
  const value = useMemo(() => Object.freeze({ intakeOpen, enter(intake = false) { setIntakeOpen(intake); runtime.navigateToMode(WorkspaceMode.LIBRARY); }, closeIntake() { setIntakeOpen(false); } }), [intakeOpen, runtime]);
  return <LibraryNavigationContext.Provider value={value}>{children}</LibraryNavigationContext.Provider>;
}

export function useLibraryNavigation(): LibraryNavigationValue {
  const value = useContext(LibraryNavigationContext);
  if (value === undefined) throw new Error("useLibraryNavigation must be used inside LibraryNavigationProvider");
  return value;
}

const CANON_EVENTS = projectHydratedOverviewEvents();

export default function LibraryWorkspace() {
  const identity = useOperatorIdentity();
  const runtime = useWorkspaceRuntime();
  const overview = useOverviewSelection();
  const account = useAccountInvestigationLibrary();
  const navigation = useLibraryNavigation();
  const previewRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState("");
  const [authority, setAuthority] = useState<"ALL" | "CANON" | "REFERENCE">("ALL");
  const active = runtime.getActiveInvestigation();
  const normalized = query.trim().toLocaleLowerCase();
  const matches = (value: string) => normalized.length === 0 || value.toLocaleLowerCase().includes(normalized);
  const canon = authority !== "REFERENCE" ? CANON_EVENTS.filter(item => matches(`${item.title} ${item.eventId} ${item.location}`)) : [];
  const repositories = authority !== "CANON" ? OVERVIEW_REPOSITORIES.filter(item => matches(`${item.name} ${item.state} ${item.note}`)) : [];
  const isGuest = identity.identity?.kind !== "ACCOUNT";
  const emptyOwnedInvestigationId = active?.createdBy === "AUTHENTICATED_RESEARCHER" && active.revisions.length === 0 ? active.id : null;
  const selectionKey = overview.selection.kind === "CANON_EVENT" ? `canon:${overview.selection.eventId}` : overview.selection.kind === "EXTERNAL_REPOSITORY" ? `external:${overview.selection.name}` : overview.selection.kind === "OWNED_INVESTIGATION" ? `owned:${overview.selection.investigationId}` : "none";

  useEffect(() => { previewRef.current?.scrollTo({ top: 0 }); }, [selectionKey]);

  if (navigation.intakeOpen && isGuest) return <section className="library-workspace"><GuestCaseIntake onCancel={navigation.closeIntake} onCreated={navigation.closeIntake} /></section>;

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const title = String(new FormData(form).get("title") ?? "").trim();
    if (title) { void account.create(title); form.reset(); }
  }

  return <main className="library-workspace" aria-labelledby="library-workspace-title">
    <div className="library-workspace__canvas">
      <aside className="library-workspace__command" aria-labelledby="library-workspace-title">
        <header><p className="library-workspace__eyebrow">Library command</p><h1 id="library-workspace-title">Investigation Library</h1><p>Choose, preview, create, or resume the investigation you want to pursue.</p></header>
        <p className="library-workspace__persistence">{isGuest ? "Guest work is retained locally for this browser session and is not durably saved." : "Account-owned investigations use existing authorized continuity and persistence."}</p>
        <section className="library-workspace__status" aria-labelledby="current-investigation-title"><p className="library-workspace__eyebrow">Current investigation</p><h2 id="current-investigation-title">{active?.name ?? "No active investigation"}</h2><p>{active === undefined ? "Start a case or preview a Library record when you are ready." : isGuest ? "SESSION-LOCAL · NOT DURABLY SAVED" : "ACTIVE INVESTIGATION · ACCOUNT OWNED"}</p></section>
        <section className="library-workspace__actions" aria-label="Investigation actions">
          {isGuest ? <button className="library-workspace__primary" type="button" onClick={() => navigation.enter(true)}>Start or Bring a New Case</button> : <form onSubmit={create}><label htmlFor="library-new-title">New investigation title</label><input id="library-new-title" name="title" maxLength={200} disabled={account.busy} required /><button className="library-workspace__primary" disabled={account.busy}>Start or Bring a New Case</button></form>}
          {active && active.revisions.length > 0 && <button type="button" onClick={() => resumeCurrentInvestigation(runtime)}>Resume Current Investigation</button>}
          {emptyOwnedInvestigationId && <div className="library-workspace__setup" role="status"><strong>{active?.name}</strong><span>This saved investigation has no focused event or operational content.</span><button type="button" disabled>Continue Setup</button></div>}
        </section>
        <section className="library-workspace__search" aria-label="Search and filters"><label htmlFor="library-search">Search records</label><input id="library-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search titles, identifiers, places, or repositories" /><div role="group" aria-label="Authority filter">{(["ALL", "CANON", "REFERENCE"] as const).map(value => <button key={value} type="button" aria-pressed={authority === value} onClick={() => setAuthority(value)}>{value === "CANON" ? "SYSTEM CANON" : value === "REFERENCE" ? "EXTERNAL" : "ALL"}</button>)}</div></section>
        {!isGuest && <section className="library-workspace__owned" aria-labelledby="owned-investigations-title"><h2 id="owned-investigations-title">Your investigations</h2>{overview.library.status === InvestigationLibraryStatus.READY ? <div className="library-workspace__owned-items">{overview.library.summaries.filter(item => matches(item.title)).map(item => <button key={item.investigationId} type="button" aria-pressed={overview.selection.kind === "OWNED_INVESTIGATION" && overview.selection.investigationId === item.investigationId} onClick={() => overview.selectOwnedInvestigation(item)}><span>SAVED INVESTIGATION</span><strong>{item.title}</strong></button>)}</div> : <p role="status">Saved investigations remain hidden until account authority is ready.</p>}</section>}
      </aside>

      <section className="library-workspace__collection" aria-label="Library collection">
        {overview.selection.kind === "NONE" ? <header className="library-workspace__collection-header"><div><p className="library-workspace__eyebrow">Protected collection</p><h2>SYSTEM CANON</h2><p>Protected canonical records. Selection previews only.</p></div><p className="library-workspace__helper">Select a record to preview source, provenance, and rights.</p></header> : <section ref={previewRef} className="library-workspace__preview" aria-label="Selected record preview" tabIndex={-1}><div className="library-workspace__preview-toolbar"><span>Selected record preview</span><button type="button" onClick={overview.clearSelection} aria-label="Close selected record preview">Close preview</button></div>{overview.selection.kind === "CANON_EVENT" && <LibraryVisualPreview recordId={overview.selection.eventId} />}<OverviewInspector previewLabel="Library Preview" ownedBusy={account.busy} emptyOwnedInvestigationId={emptyOwnedInvestigationId} onOpenOwned={account.available ? id => { void account.open(id); } : undefined} />{account.error && <p role="alert">{account.error}</p>}</section>}
        <section className="library-workspace__canon" aria-labelledby="system-canon-title"><h2 id="system-canon-title" className="library-workspace__section-label">SYSTEM CANON</h2><div className="library-workspace__canon-cards">{canon.map(item => <button className="library-workspace__canon-card" key={item.eventId} type="button" aria-pressed={overview.selection.kind === "CANON_EVENT" && overview.selection.eventId === item.eventId} onClick={() => overview.selectCanonEvent(item)}><LibraryVisualBoundary recordId={item.eventId} /><span className="library-workspace__classification">{resolveLibraryVisualAsset(item.eventId).assetClass} · CONTEXTUAL</span><small>{item.eventId}</small><strong>{item.title}</strong><span>{item.year} · {item.location}</span></button>)}</div>{canon.length === 0 && <p className="library-workspace__empty">No System Canon records match the current search and filter.</p>}</section>
        <section className="library-workspace__external" aria-labelledby="external-repositories-title"><div><h2 id="external-repositories-title">EXTERNAL RESEARCH</h2><p>Orientation and reading references only; no partnership, federation, endorsement, or Canon authority is implied.</p></div><div className="library-workspace__external-tiles">{repositories.map(item => <ExternalResearchTile key={item.repositoryId} repository={item} />)}</div>{repositories.length === 0 && <p className="library-workspace__empty">No external records match the current search and filter.</p>}</section>
      </section>
    </div>
    <p className="library-workspace__boundary">Selection alone never activates a workspace. LIBRARY does not run Resolve, compute relationships, mutate System Canon, admit Investigation Evidence, or publish to the Research Inbox. Explicit opening enters MANIFOLD.</p>
  </main>;
}

export function ExternalResearchTile({ repository }: { readonly repository: OverviewRepository }) {
  const content = <><span className="library-workspace__external-state">{repository.state}</span><strong>{repository.name}</strong>{repository.navigationAvailable ? <><small className="library-workspace__external-domain">{repository.destinationDomain}</small><span className="library-workspace__external-indicator" aria-hidden="true">↗</span><span className="library-workspace__sr-only">Opens official reading destination in a new tab.</span></> : <small>External access planned.</small>}</>;
  return repository.navigationAvailable
    ? <a className="library-workspace__external-tile" href={repository.destinationUrl} target="_blank" rel="noopener noreferrer" aria-label={`${repository.name}: opens official reading destination at ${repository.destinationDomain} in a new tab`}>{content}</a>
    : <article className="library-workspace__external-tile library-workspace__external-tile--disabled" aria-disabled="true">{content}</article>;
}

function LibraryVisualBoundary({ recordId }: { readonly recordId: string }) {
  const assets = resolveLibraryVisualAssets(recordId);
  const [assetIndex, setAssetIndex] = useState(0);
  const asset = assets[assetIndex] ?? resolveLibraryVisualAsset(recordId);
  if (asset.availabilityState === "UNAVAILABLE" || asset.deliveryReference === null) return <span className="library-workspace__media-boundary library-workspace__media-boundary--unavailable" role="img" aria-label={asset.alternativeText} data-asset-class={asset.assetClass} data-availability={asset.availabilityState}>Visual unavailable</span>;
  return <span className="library-workspace__media-boundary" data-asset-class={asset.assetClass} data-availability={asset.availabilityState}><img src={asset.deliveryReference} alt={asset.alternativeText} onError={() => setAssetIndex(index => Math.min(index + 1, assets.length - 1))} /></span>;
}

function LibraryVisualPreview({ recordId }: { readonly recordId: string }) {
  const assets = resolveLibraryVisualAssets(recordId);
  if (assets.length === 0) return <p className="library-workspace__preview-unavailable">Visual and provenance metadata unavailable.</p>;
  return <div className="library-workspace__preview-visuals">{assets.map((asset, index) => <GovernedVisual key={asset.assetId} asset={asset} primary={index === 0} />)}</div>;
}

function GovernedVisual({ asset, primary }: { readonly asset: LibraryVisualAsset; readonly primary: boolean }) {
  return <figure className="library-workspace__visual-preview" data-asset-class={asset.assetClass}><img src={asset.deliveryReference ?? undefined} alt={asset.alternativeText} /><figcaption><strong>{primary ? "Primary governed visual" : "Additional governed iSEES diagram"} · {asset.assetClass} · {asset.evidentiaryRole}</strong><span>{asset.caption ?? "Caption unavailable"}</span><span>{asset.reconstructionOrGeneratedDisclosure ?? "Disclosure unavailable"}</span><dl><Metadata label="Title" value={asset.title} /><Metadata label="Creator / Source institution" value={asset.creator} /><Metadata label="Creation or publication date" value={asset.captureOrPublicationDate} /><Metadata label="Evidence status" value={asset.evidenceStatus} /><Metadata label="Source type" value={asset.sourceType} /><Metadata label="Record identifier" value={asset.sourceRecordIdentifier} /><Metadata label="Reuse basis" value={asset.licenseOrUsageAuthority} /><Metadata label="Attribution" value={asset.attribution} /><Metadata label="Source link" value={asset.sourcePageUrl} link /><Metadata label="Integrity" value={asset.integrityReference} /><Metadata label="Derivation" value={asset.derivation} /></dl><em>Contextual Library media; not admitted Investigation Evidence.</em></figcaption></figure>;
}

function Metadata({ label, value, link = false }: { readonly label: string; readonly value: string | null; readonly link?: boolean }) {
  return <div><dt>{label}</dt><dd>{value === null ? "Unavailable" : link ? <a href={value} target="_blank" rel="noreferrer">Open governed source</a> : value}</dd></div>;
}
