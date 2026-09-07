import { CanonicalFeatureDimension } from "../resolve/features/CanonicalKnowledgeFeatureTypes.ts";
import { layersContributionId, LayersContributionSet, type LayersExperimentalPairProjection } from "../layers/projection/LayersExperimentalPairProjectionTypes.ts";
import type { MetricBriefingTemplate, MetricIntelligenceDefinition, MetricIntelligenceSource, MetricSignificanceBriefing } from "./MetricIntelligenceTypes.ts";

export const TOPOLOGY_SIMILARITY_TEMPLATE = Object.freeze<MetricBriefingTemplate>({ id: "metric-briefing/topology-similarity", version: "v1", metricSemanticKind: "TOPOLOGY_SIMILARITY" });
export const METRIC_BRIEFING_TEMPLATE_REGISTRY = Object.freeze([TOPOLOGY_SIMILARITY_TEMPLATE]);
export const TOPOLOGY_SIMILARITY_DEFINITION = Object.freeze<MetricIntelligenceDefinition>({
  metricId: "layers.resolve-topology-state.similarity",
  label: "Resolve Topology State similarity",
  unit: "PERCENT",
  semanticKind: "TOPOLOGY_SIMILARITY",
  evaluator: Object.freeze({ key: "TOPOLOGY", version: "canonical-similarity/v1" }),
  normalization: Object.freeze({ key: "CANONICAL_DIMENSION_SIMILARITY", version: "canonical-similarity/v1" }),
  epistemicBoundary: Object.freeze(["Similarity is not probability.", "Similarity is not causation or proof.", "Topology similarity is not full-case similarity.", "An experimental result is not a canonical relationship."]),
  briefingTemplateId: TOPOLOGY_SIMILARITY_TEMPLATE.id,
  briefingTemplateVersion: TOPOLOGY_SIMILARITY_TEMPLATE.version,
});

function canonical(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value as object).sort().map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(",")}}`;
}
function hash(text: string): string { let value=0xcbf29ce484222325n; for(const c of text){value^=BigInt(c.codePointAt(0)??0);value=BigInt.asUintN(64,value*0x100000001b3n);} return value.toString(16).padStart(16,"0"); }
function immutable<T>(value: T): T { if(value&&typeof value==="object"&&!Object.isFrozen(value)){for(const child of Object.values(value as object))immutable(child);Object.freeze(value);} return value; }
function required(value: string, label: string): string { if (!value?.trim()) throw new Error(`${label} is required.`); return value; }

export function topologySimilaritySourceFromProjection(projection: LayersExperimentalPairProjection, labels?: Readonly<{ caseA: string; caseB: string }>): MetricIntelligenceSource {
  const contribution = projection.layerContributions.find(item => item.layerId === layersContributionId(LayersContributionSet.EXPERIMENTAL, CanonicalFeatureDimension.TOPOLOGY));
  if (!contribution || contribution.availability !== "AVAILABLE" || contribution.canonicalDimension !== CanonicalFeatureDimension.TOPOLOGY || contribution.similarity === undefined || contribution.normalizedResult === undefined) throw new Error("A completed available TOPOLOGY contribution is required.");
  if (contribution.similarity !== contribution.normalizedResult) throw new Error("TOPOLOGY similarity and normalized result do not match.");
  const definition = TOPOLOGY_SIMILARITY_DEFINITION;
  if (contribution.evaluatorKey !== definition.evaluator.key || contribution.evaluatorVersion !== definition.evaluator.version) throw new Error("Unsupported TOPOLOGY evaluator identity.");
  if (!contribution.normalization) throw new Error("TOPOLOGY normalization identity is required.");
  if (contribution.normalization.normalizationKey !== definition.normalization.key || contribution.normalization.normalizationVersion !== definition.normalization.version) throw new Error("Unsupported TOPOLOGY normalization identity.");
  const input = projection.evaluatorInput;
  if (input.executionId !== projection.executionId || input.investigationId !== projection.investigationId || input.pairId !== projection.pairId || input.candidateId !== projection.candidateId || input.evaluationId !== projection.evaluationId) throw new Error("Metric execution provenance is stale or mismatched.");
  const endpoints = input.endpoints.map(endpoint => {
    const components = endpoint.components.filter(item => item.componentIdentity.startsWith("TOPOLOGY."));
    if (components.length !== 4 || components.some(item => item.availability !== "AVAILABLE" || typeof item.rawValue !== "number")) throw new Error("All four frozen TOPOLOGY endpoint components are required.");
    return { role: endpoint.subjectRole, subjectIdentity: required(endpoint.subjectIdentity, `${endpoint.subjectRole} identity`), displayLabel: required(endpoint.subjectRole === "CASE_A" ? labels?.caseA ?? endpoint.subjectIdentity : labels?.caseB ?? endpoint.subjectIdentity, `${endpoint.subjectRole} display label`), knowledgeObjectId: required(endpoint.knowledgeObjectId, `${endpoint.subjectRole} Knowledge object`), snapshotId: required(endpoint.endpointSnapshotId, `${endpoint.subjectRole} snapshot`), components: components.map(item => { if (item.availability !== "AVAILABLE" || typeof item.rawValue !== "number") throw new Error("Frozen TOPOLOGY component is unavailable."); return { identity: item.componentIdentity, value: item.rawValue, sourceReferences: item.lineage.sources.map(source => `${source.sourceIdentity}${source.sourceVersion ? `@${source.sourceVersion}` : ""}${source.sourceRevision ? `#${source.sourceRevision}` : ""}`) }; }) };
  }) as unknown as MetricIntelligenceSource["endpoints"];
  if (endpoints[0].role !== "CASE_A" || endpoints[1].role !== "CASE_B" || endpoints[0].knowledgeObjectId === endpoints[1].knowledgeObjectId) throw new Error("Metric endpoints must be an ordered, distinct CASE_A/CASE_B pair.");
  if (!Number.isFinite(contribution.canonicalWeight) || !Number.isFinite(contribution.participatingWeight)) throw new Error("Both configured and participating TOPOLOGY weights are required.");
  return immutable({ investigationId: required(projection.investigationId, "Investigation identity"), pairId: required(projection.pairId, "Pair identity"), value: contribution.similarity, availability: "AVAILABLE", evaluator: { key: contribution.evaluatorKey, version: contribution.evaluatorVersion }, normalization: { key: contribution.normalization.normalizationKey, version: contribution.normalization.normalizationVersion }, executionId: required(projection.executionId, "Execution identity"), inputProjectionId: required(input.inputProjectionId, "Input projection identity"), endpoints, canonicalConfiguredWeight: contribution.canonicalWeight!, participatingNormalizedWeight: contribution.participatingWeight, classification: "EXPERIMENTAL / DERIVED / NON-CANONICAL" });
}

export function assembleTopologySimilarityBriefing(source: MetricIntelligenceSource, definition: MetricIntelligenceDefinition = TOPOLOGY_SIMILARITY_DEFINITION): MetricSignificanceBriefing {
  if (definition.metricId !== TOPOLOGY_SIMILARITY_DEFINITION.metricId || definition.briefingTemplateId !== TOPOLOGY_SIMILARITY_TEMPLATE.id || definition.briefingTemplateVersion !== TOPOLOGY_SIMILARITY_TEMPLATE.version) throw new Error("Unsupported or stale metric briefing definition.");
  if (source.availability !== "AVAILABLE" || !Number.isFinite(source.value) || source.value < 0 || source.value > 1 || source.evaluator.key !== definition.evaluator.key || source.evaluator.version !== definition.evaluator.version || source.normalization.key !== definition.normalization.key || source.normalization.version !== definition.normalization.version || source.classification !== "EXPERIMENTAL / DERIVED / NON-CANONICAL") throw new Error("Metric source does not satisfy the supported definition.");
  if (!source.investigationId || !source.pairId || !source.executionId || !source.inputProjectionId || !Number.isFinite(source.canonicalConfiguredWeight) || !Number.isFinite(source.participatingNormalizedWeight) || source.endpoints.length !== 2 || source.endpoints.some(endpoint => !endpoint.subjectIdentity || !endpoint.displayLabel || !endpoint.knowledgeObjectId || !endpoint.snapshotId || endpoint.components.length !== 4)) throw new Error("Metric source provenance is incomplete.");
  const displayValue = `${(source.value * 100).toFixed(1)}%`;
  const [a,b] = source.endpoints;
  const pairDisplay = `${a.displayLabel} ↔ ${b.displayLabel}`;
  const microBriefing = `The two frozen investigation structures are ${displayValue} alike.`;
  const whyItMatters = `${a.displayLabel} and ${b.displayLabel} are two distinct cases. After each case's evidence and relationships are organized into a deterministic Resolve structure, their frozen topology states are ${displayValue} alike.\n\nThat does not mean there is a ${displayValue} chance that the events are connected. It means the selected topology evaluator found a strong similarity in how their investigation structures behave.`;
  const researchQuestion = `Why do two distinct cases produce such similar Resolve topology states?`;
  const plausibleExplanations = ["The investigations may contain similarly organized evidence and relationships.", "Their contradiction, uncertainty, and evidence-cluster structures may behave alike.", "Their records may have comparable data density or modeling conventions.", "The evaluator may not yet discriminate strongly enough.", "The cases may share a genuinely meaningful structural pattern."];
  const limitations = [...definition.epistemicBoundary, "This experiment cannot decide among the plausible explanations; it identifies where deeper investigation is justified.", `The configured canonical weight (${source.canonicalConfiguredWeight}) and normalized participating weight (${source.participatingNormalizedWeight}) describe different weighting contexts.`];
  const deterministicBasisSummary = `${definition.label} ${displayValue}; ${definition.evaluator.key}@${definition.evaluator.version}; normalized by ${definition.normalization.key}@${definition.normalization.version}; immutable execution ${source.executionId}; template ${definition.briefingTemplateId}/${definition.briefingTemplateVersion}.`;
  const semantic = { metricId: definition.metricId, source, templateId: definition.briefingTemplateId, templateVersion: definition.briefingTemplateVersion };
  return immutable({ findingId: `metric-finding:${hash(canonical(semantic))}`, metricId: definition.metricId, metricLabel: definition.label, value: source.value, displayValue, pairDisplay, microBriefing, whyItMatters, researchQuestion, plausibleExplanations, limitations, deterministicBasisSummary, epistemicClassification: source.classification, templateId: definition.briefingTemplateId, templateVersion: definition.briefingTemplateVersion, evaluator: source.evaluator, normalization: source.normalization, source });
}
