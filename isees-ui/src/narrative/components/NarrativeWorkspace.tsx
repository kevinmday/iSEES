import { useMemo, type ReactNode } from "react";

import { resolveCurrentInvestigationExecution } from "../../intelligence/selection/InvestigationSelectionCoherence";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";
import { resolveNarrativeWorkspaceProjection } from "../projection/NarrativeWorkspaceProjection";
import {
  NarrativeWorkspaceProjectionStatus,
  type NarrativeAvailability,
  type NarrativeWorkspaceReadyProjection,
  type SystemCanonNarrativeProjection,
} from "../projection/NarrativeWorkspaceProjectionTypes";
import type {
  CanonicalFeatureLineage,
  CanonicalFeatureValue,
  CanonicalKnowledgeFeatureSet,
} from "../../resolve/features/CanonicalKnowledgeFeatureTypes";
import type { ResolveCandidateDimensionIntelligence } from "../../resolve/intelligence/ResolveCandidateIntelligenceTypes";
import { useResolveRuntimeState } from "../../resolve/runtime/ResolveRuntimeContext";
import { useWorkspaceRuntime } from "../../workspace/runtime/WorkspaceRuntimeContext";

import "./NarrativeWorkspace.css";

const EMPTY_CANDIDATE_EVALUATIONS = Object.freeze([]);

const DIMENSION_ORDER = [
  "NARRATIVE",
  "OBSERVABILITY",
  "INFRASTRUCTURE",
  "TOPOLOGY",
  "GEOGRAPHY",
] as const;

function label(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toUpperCase();
}

function scalar(value: unknown): ReactNode {
  if (typeof value === "number") return Number.isInteger(value) ? value : value.toFixed(3);
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value === null || value === undefined) return "UNAVAILABLE";
  return String(value);
}

function StructuredValue({ value }: { value: unknown }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="narrative-workspace__empty-value">NONE</span>;
    return (
      <ul className="narrative-workspace__value-list">
        {value.map((item, index) => <li key={index}><StructuredValue value={item} /></li>)}
      </ul>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <dl className="narrative-workspace__value-map">
        {Object.entries(value).map(([key, item]) => (
          <div key={key}><dt>{label(key)}</dt><dd><StructuredValue value={item} /></dd></div>
        ))}
      </dl>
    );
  }

  return <>{scalar(value)}</>;
}

function Lineage({ lineage }: { lineage: CanonicalFeatureLineage }) {
  return (
    <details className="narrative-workspace__lineage">
      <summary>Source lineage</summary>
      <dl>
        <div><dt>Source</dt><dd>{lineage.source}</dd></div>
        <div><dt>Knowledge</dt><dd>{lineage.sourceKnowledgeObjectIds.join(", ")}</dd></div>
        {lineage.relationshipIds && (
          <div><dt>Relationships</dt><dd>{lineage.relationshipIds.join(", ") || "NONE"}</dd></div>
        )}
      </dl>
    </details>
  );
}

function Feature({ name, feature }: { name: string; feature: CanonicalFeatureValue<unknown> }) {
  if (feature.availability === "UNAVAILABLE") {
    return (
      <div className="narrative-workspace__feature narrative-workspace__feature--unavailable">
        <strong>{label(name)}</strong>
        <span className="narrative-workspace__badge narrative-workspace__badge--unavailable">UNAVAILABLE</span>
        <p>{feature.reason}</p>
      </div>
    );
  }

  return (
    <div className="narrative-workspace__feature">
      <strong>{label(name)}</strong>
      <span className="narrative-workspace__badge narrative-workspace__badge--available">AVAILABLE</span>
      <div className="narrative-workspace__feature-value"><StructuredValue value={feature.value} /></div>
      <Lineage lineage={feature.lineage} />
    </div>
  );
}

function ProfileDimension({ dimension, profile }: { dimension: typeof DIMENSION_ORDER[number]; profile: CanonicalKnowledgeFeatureSet }) {
  const features: readonly [string, CanonicalFeatureValue<unknown>][] = dimension === "NARRATIVE"
    ? [["traits", profile.narrative.traits]]
    : dimension === "OBSERVABILITY"
      ? [["confidence", profile.observability.confidence], ["durationMinutes", profile.observability.durationMinutes], ["regime", profile.observability.regime]]
      : dimension === "INFRASTRUCTURE"
        ? [["entities", profile.infrastructure.entities]]
        : dimension === "TOPOLOGY"
          ? [["state", profile.topology.state]]
          : [["location", profile.geography.location]];

  return <div className="narrative-workspace__profile-dimension">{features.map(([name, feature]) => <Feature key={name} name={name} feature={feature} />)}</div>;
}

function DimensionResult({ result }: { result: ResolveCandidateDimensionIntelligence | undefined }) {
  if (!result) return <p className="narrative-workspace__reason">Dimension result unavailable from the I1 projection.</p>;
  return (
    <div className="narrative-workspace__dimension-result">
      <span className={`narrative-workspace__badge narrative-workspace__badge--${result.source.availability.toLowerCase()}`}>{result.source.availability}</span>
      <dl>
        <div><dt>Status</dt><dd>{result.status}</dd></div>
        {result.source.availability === "AVAILABLE" ? (
          <>
            <div><dt>Similarity</dt><dd>{(result.source.similarity * 100).toFixed(1)}%</dd></div>
            <div><dt>Configured weight</dt><dd>{result.source.weight}</dd></div>
          </>
        ) : <div><dt>Reason</dt><dd>{result.source.reason}</dd></div>}
      </dl>
    </div>
  );
}

function NarrativeRegion({ role, narrative, compared = false }: { role: string; narrative: SystemCanonNarrativeProjection; compared?: boolean }) {
  return (
    <section className={`narrative-workspace__region narrative-workspace__region--prose${compared ? " narrative-workspace__region--compared" : " narrative-workspace__region--focused"}`} aria-labelledby={`narrative-${compared ? "compared" : "focused"}-title`}>
      <header className="narrative-workspace__region-header">
        <span className="narrative-workspace__eyebrow">{role}</span>
        <h2 id={`narrative-${compared ? "compared" : "focused"}-title`}>{narrative.title}</h2>
        <code>{narrative.canonicalEventId}</code>
        <span className="narrative-workspace__material">{narrative.materialClassification}</span>
      </header>
      <div className="narrative-workspace__paragraphs">
        {narrative.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </div>
    </section>
  );
}

function ExactSet({ title, values }: { title: string; values: readonly string[] }) {
  return <div><dt>{title}</dt><dd>{values.length ? values.join(", ") : "NONE"}</dd></div>;
}

function AvailableExactSet({ title, result }: { title: string; result: NarrativeAvailability<readonly string[]> }) {
  return result.availability === "AVAILABLE"
    ? <ExactSet title={title} values={result.value} />
    : <div><dt>{title}</dt><dd><span className="narrative-workspace__badge narrative-workspace__badge--unavailable">UNAVAILABLE</span> {result.reason}</dd></div>;
}

function NormalizedRegion({ projection }: { projection: NarrativeWorkspaceReadyProjection }) {
  const { normalizedCenter } = projection;
  return (
    <section className="narrative-workspace__region narrative-workspace__region--normalized" aria-labelledby="narrative-normalized-title">
      <header className="narrative-workspace__region-header">
        <span className="narrative-workspace__eyebrow">NORMALIZED NARRATIVE</span>
        <h2 id="narrative-normalized-title">iSEES normalized comparison</h2>
        <code>{projection.candidate.candidateId}</code>
        <span className="narrative-workspace__material">Revision {projection.currentRevisionId}</span>
      </header>

      <div className="narrative-workspace__normalized-body">
        <section className="narrative-workspace__identity-strip" aria-label="Normalized profile identities">
          <div><span>Focused profile</span><code>{normalizedCenter.focusedProfile.knowledgeObjectId}</code></div>
          <div><span>Compared profile</span><code>{normalizedCenter.comparedProfile.knowledgeObjectId}</code></div>
        </section>

        <div className="narrative-workspace__dimensions">
          {DIMENSION_ORDER.map(dimension => {
            const result = normalizedCenter.resolveDimensions.find(item => item.dimension === dimension);
            return (
              <section className="narrative-workspace__dimension" key={dimension}>
                <header><span>{dimension}</span><DimensionResult result={result} /></header>
                <div className="narrative-workspace__profile-pair">
                  <div><h3>Focused profile</h3><ProfileDimension dimension={dimension} profile={normalizedCenter.focusedProfile} /></div>
                  <div><h3>Compared profile</h3><ProfileDimension dimension={dimension} profile={normalizedCenter.comparedProfile} /></div>
                </div>
              </section>
            );
          })}
        </div>

        <section className="narrative-workspace__secondary">
          <span className="narrative-workspace__eyebrow">SECONDARY EXACT COMPARISON</span>
          <p>{normalizedCenter.secondaryExactComparison.classification}</p>
          <dl>
            <ExactSet title="Shared semantic traits" values={normalizedCenter.secondaryExactComparison.sharedSemanticTraits} />
            <ExactSet title="Focused-only semantic traits" values={normalizedCenter.secondaryExactComparison.focusedOnlySemanticTraits} />
            <ExactSet title="Compared-only semantic traits" values={normalizedCenter.secondaryExactComparison.comparedOnlySemanticTraits} />
            <AvailableExactSet title="Shared facility types" result={normalizedCenter.secondaryExactComparison.sharedFacilityTypes} />
            <AvailableExactSet title="Focused-only facility types" result={normalizedCenter.secondaryExactComparison.focusedOnlyFacilityTypes} />
            <AvailableExactSet title="Compared-only facility types" result={normalizedCenter.secondaryExactComparison.comparedOnlyFacilityTypes} />
          </dl>
        </section>

        <section className="narrative-workspace__unsupported">
          <span className="narrative-workspace__eyebrow">UNSUPPORTED ANALYSIS</span>
          <p>No unsupported analysis has been inferred or generated.</p>
          <dl>{Object.entries(projection.unsupported).map(([name, value]) => <div key={name}><dt>{label(name)}</dt><dd>{value.reason}</dd></div>)}</dl>
        </section>
      </div>
    </section>
  );
}

function State({ title, guidance, details }: { title: string; guidance: string; details?: readonly string[] }) {
  return (
    <main className="narrative-workspace narrative-workspace--state">
      <section className="narrative-workspace__state" aria-live="polite">
        <span className="narrative-workspace__eyebrow">NARRATIVE INSPECTION</span>
        <h2>{title}</h2>
        <p>{guidance}</p>
        {details?.map(detail => <code key={detail}>{detail}</code>)}
      </section>
    </main>
  );
}

export default function NarrativeWorkspace() {
  const knowledgeObjects = useKnowledgeObjects();
  const resolveState = useResolveRuntimeState();
  const workspaceRuntime = useWorkspaceRuntime();
  const investigation = workspaceRuntime.getActiveInvestigation();
  const selection = workspaceRuntime.getSelection();
  const currentExecution = resolveCurrentInvestigationExecution(investigation, resolveState.currentExecution);
  const candidateEvaluations = currentExecution?.result?.candidateEvaluations.evaluations ?? EMPTY_CANDIDATE_EVALUATIONS;

  const projection = useMemo(() => resolveNarrativeWorkspaceProjection({
    investigation,
    knowledgeObjects,
    selection,
    candidateEvaluations,
  }), [investigation, knowledgeObjects, selection, candidateEvaluations]);

  switch (projection.status) {
    case NarrativeWorkspaceProjectionStatus.NO_INVESTIGATION:
      return <State title="No active Investigation" guidance="NARRATIVE requires an active canonical Investigation." />;
    case NarrativeWorkspaceProjectionStatus.NO_FOCUSED_EVENT:
      return <State title="No focused EVENT" guidance="Open or focus a canonical case before entering NARRATIVE." details={[`Investigation: ${projection.investigationId}`]} />;
    case NarrativeWorkspaceProjectionStatus.NO_COMPARISON:
      return <State title="Select a comparison in COMPARE" guidance="NARRATIVE does not choose a default comparison. Select a Resolve candidate through COMPARE." details={[`Focused EVENT: ${projection.focusedEventId}`]} />;
    case NarrativeWorkspaceProjectionStatus.STALE_SELECTION:
      return <State title="Selected comparison is stale" guidance="Reselect a Resolve candidate through COMPARE. NARRATIVE has not cleared or repaired the selection." details={[`Focused EVENT: ${projection.focusedEventId}`, projection.reason]} />;
    case NarrativeWorkspaceProjectionStatus.UNAVAILABLE:
      return <State title="Narrative projection unavailable" guidance="The requested canonical projection cannot be shown; no partial narrative data has been fabricated." details={[...(projection.investigationId ? [`Investigation: ${projection.investigationId}`] : []), ...(projection.focusedEventId ? [`Focused EVENT: ${projection.focusedEventId}`] : []), projection.reason]} />;
    case NarrativeWorkspaceProjectionStatus.READY:
      return (
        <main className="narrative-workspace">
          <NarrativeRegion role="FOCUSED NARRATIVE" narrative={projection.focusedNarrative} />
          <NormalizedRegion projection={projection} />
          <NarrativeRegion role="COMPARED NARRATIVE" narrative={projection.comparedNarrative} compared />
        </main>
      );
  }
}
