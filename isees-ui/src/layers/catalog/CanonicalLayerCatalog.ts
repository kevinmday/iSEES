import {
  CANONICAL_LAYER_CATALOG_VERSION, CanonicalLayerAvailability as A,
  CanonicalLayerFamilyId as F, CanonicalLayerLifecycleStatus as L,
  CanonicalLayerOperationalStatus as O, CanonicalLayerProfileId as P,
  type CanonicalLayerDefinition, type CanonicalLayerFamilyDefinition,
} from "./CanonicalLayerCatalogTypes.ts";

const freeze = <T>(value: T): Readonly<T> => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value as object).forEach(freeze); Object.freeze(value);
  }
  return value;
};

export const CanonicalLayerFamilies = freeze([
  [F.OBSERVATIONAL,"Observational","Admitted observations and observation regimes."],[F.SENSOR,"Sensor","Sensor modalities, coverage, and reliability."],
  [F.NARRATIVE,"Narrative","Claims, reports, testimony, and accounts."],[F.HISTORICAL,"Historical","Qualified records and persistence across history."],
  [F.LINGUISTIC,"Linguistic","Terminology, translation, meaning, and context."],[F.TEMPORAL,"Temporal","Duration, sequence, recurrence, and seasonality."],
  [F.GEOSPATIAL,"Geospatial","Location, proximity, corridors, and spatial context."],[F.PHYSICAL,"Physical","Physical terrain and environmental structure."],
  [F.INFRASTRUCTURE,"Infrastructure","Facilities and supporting engineered networks."],[F.TECHNOLOGY,"Technology","Technical systems, networks, and capabilities."],
  [F.COMPUTATIONAL,"Computational","Deterministic computational structure."],[F.EVIDENCE,"Evidence","Evidence coverage, confidence, diversity, and provenance."],
  [F.MYTHIC_SYMBOLIC,"Mythic / Symbolic","Governed mythic motifs and symbols."],[F.CULTURAL,"Cultural","Qualified cultural traditions and folklore."],
  [F.RELIGIOUS,"Religious","Explicitly sourced religious interpretations."],[F.SOCIETAL_GLOBAL_CONTEXT,"Societal / Global Context","Societal response and governed global context."],
].map(([id,label,description], index) => ({id,label,description,displayOrder:index + 1})) as CanonicalLayerFamilyDefinition[]);

type Seed = readonly [string,string,CanonicalLayerFamilyDefinition["id"],CanonicalLayerDefinition["availability"],readonly string[],readonly string[],string?];
const seeds = [
 ["OBSERVABILITY","Observability",F.OBSERVATIONAL,A.OPERATIONAL,["canonical similarity evaluation observability dimension"],["similarity"],"OBSERVABILITY"],
 ["VISUAL_OBSERVATION","Visual observation",F.OBSERVATIONAL,A.MISSING_CANONICAL_DATA,["typed visual modality records"],["similarity"]],
 ["RADAR_OBSERVATION","Radar observation",F.SENSOR,A.MISSING_CANONICAL_DATA,["typed radar records and capabilities"],["similarity"]],
 ["INFRARED_OBSERVATION","Infrared observation",F.SENSOR,A.MISSING_CANONICAL_DATA,["typed infrared records"],["similarity"]],
 ["ACOUSTIC_OBSERVATION","Acoustic observation",F.SENSOR,A.MISSING_CANONICAL_DATA,["typed acoustic records"],["similarity"]],
 ["ELECTROMAGNETIC_OBSERVATION","Electromagnetic observation",F.SENSOR,A.MISSING_CANONICAL_DATA,["typed electromagnetic records"],["similarity"]],
 ["MULTISENSOR_CORROBORATION","Multi-sensor corroboration",F.SENSOR,A.MISSING_CANONICAL_DATA,["typed modality and independent source records"],["score","counts"]],
 ["SENSOR_COVERAGE","Sensor coverage",F.SENSOR,A.EXTERNAL_PROVIDER_REQUIRED,["coverage windows and sensor capabilities"],["ratio"]],
 ["SENSOR_RELIABILITY","Sensor reliability",F.SENSOR,A.EXTERNAL_PROVIDER_REQUIRED,["calibration and error histories"],["similarity"]],
 ["NARRATIVE","Narrative",F.NARRATIVE,A.OPERATIONAL,["canonical similarity evaluation narrative dimension"],["similarity"],"NARRATIVE"],
 ["WITNESS_TESTIMONY","Witness testimony",F.NARRATIVE,A.MISSING_CANONICAL_DATA,["authored testimony records"],["similarity"]],
 ["MILITARY_REPORTING","Military reporting",F.NARRATIVE,A.MISSING_CANONICAL_DATA,["document type and issuer"],["similarity"]],
 ["HISTORICAL_ACCOUNTS","Historical accounts",F.HISTORICAL,A.MISSING_CANONICAL_DATA,["dated qualified documents and source type"],["similarity"]],
 ["TERMINOLOGY","Terminology",F.LINGUISTIC,A.MISSING_CANONICAL_DATA,["normalized versioned term lexicon"],["similarity"]],
 ["SEMANTIC_DRIFT","Semantic drift",F.LINGUISTIC,A.EXTERNAL_PROVIDER_REQUIRED,["dated senses and qualified corpus"],["distance"]],
 ["TRANSLATION_VARIANCE","Translation variance",F.LINGUISTIC,A.MISSING_CANONICAL_DATA,["source text and independent translations"],["variance state"]],
 ["CONTEXT_PRESERVATION","Context preservation",F.LINGUISTIC,A.MISSING_CANONICAL_DATA,["source and derived passages with span derivations"],["ratio"]],
 ["TEMPORAL","Temporal",F.TEMPORAL,A.ADAPTER_REQUIRED,["typed TimelineTemporalItem records"],["similarity","state"]],
 ["DURATION","Duration",F.TEMPORAL,A.ADAPTER_REQUIRED,["typed duration values and units"],["similarity"]],
 ["SEQUENCE","Sequence",F.TEMPORAL,A.ADAPTER_REQUIRED,["typed sequence ordinals"],["coefficient"]],
 ["RECURRENCE","Recurrence",F.TEMPORAL,A.MISSING_CANONICAL_DATA,["repeated dated occurrences"],["similarity"]],
 ["SEASONALITY","Seasonality",F.TEMPORAL,A.MISSING_CANONICAL_DATA,["sufficient dated occurrences and declared window"],["score"]],
 ["LONG_TERM_PERSISTENCE","Long-term persistence",F.HISTORICAL,A.MISSING_CANONICAL_DATA,["longitudinal observations across declared windows"],["ratio"]],
 ["GEOGRAPHY","Geography",F.GEOSPATIAL,A.OPERATIONAL,["canonical similarity evaluation geography dimension"],["similarity"],"GEOGRAPHY"],
 ["SPATIAL_PROXIMITY","Spatial proximity",F.GEOSPATIAL,A.MISSING_CANONICAL_DATA,["coordinates and coordinate reference system"],["distance","similarity"]],
 ["TERRAIN","Terrain",F.PHYSICAL,A.EXTERNAL_PROVIDER_REQUIRED,["typed terrain classes and versioned geodata"],["similarity"]],
 ["BATHYMETRY","Bathymetry",F.PHYSICAL,A.EXTERNAL_PROVIDER_REQUIRED,["coordinates and dated bathymetry"],["similarity"]],
 ["FLIGHT_CORRIDORS","Flight corridors",F.GEOSPATIAL,A.EXTERNAL_PROVIDER_REQUIRED,["tracks, corridor geometry, and time window"],["relation score"]],
 ["STRATEGIC_LOCATION","Strategic location",F.SOCIETAL_GLOBAL_CONTEXT,A.MISSING_CANONICAL_DATA,["governed strategic-site taxonomy"],["similarity"]],
 ["INFRASTRUCTURE","Infrastructure",F.INFRASTRUCTURE,A.OPERATIONAL,["canonical similarity evaluation infrastructure dimension"],["similarity"],"INFRASTRUCTURE"],
 ["MILITARY_INSTALLATIONS","Military installations",F.INFRASTRUCTURE,A.MISSING_CANONICAL_DATA,["typed facility subtype and affiliation"],["similarity"]],
 ["RADAR_SYSTEMS","Radar systems",F.INFRASTRUCTURE,A.MISSING_CANONICAL_DATA,["typed radar entities and capabilities"],["similarity"]],
 ["AIRPORTS","Airports",F.INFRASTRUCTURE,A.MISSING_CANONICAL_DATA,["typed airport entities and geodata"],["similarity"]],
 ["POWER_GRIDS","Power grids",F.INFRASTRUCTURE,A.EXTERNAL_PROVIDER_REQUIRED,["power-grid topology and outage time series"],["similarity","state"]],
 ["TRANSPORT_NETWORKS","Transport networks",F.INFRASTRUCTURE,A.EXTERNAL_PROVIDER_REQUIRED,["typed transport network graph"],["similarity"]],
 ["COMMUNICATIONS_INFRASTRUCTURE","Communications infrastructure",F.TECHNOLOGY,A.EXTERNAL_PROVIDER_REQUIRED,["communications assets and outage windows"],["similarity"]],
 ["TOPOLOGY","Topology",F.COMPUTATIONAL,A.ADAPTER_REQUIRED,["complete topology_state and evaluator registration"],["similarity"]],
 ["SOURCE_DIVERSITY","Source diversity",F.EVIDENCE,A.ADAPTER_REQUIRED,["KnowledgeProvenance and evidence sources"],["counts","similarity"]],
 ["EVIDENCE_DENSITY","Evidence density",F.EVIDENCE,A.ADAPTER_REQUIRED,["resolvable evidence derivation links and declared denominator"],["coverage"]],
 ["CONFIDENCE_PROFILE","Confidence profile",F.EVIDENCE,A.ADAPTER_REQUIRED,["typed confidence values with declared scales"],["similarity"]],
 ["PROVENANCE_COMPLETENESS","Provenance completeness",F.EVIDENCE,A.ADAPTER_REQUIRED,["Knowledge, Evidence, and Timeline provenance"],["ratio"]],
 ["MYTHOLOGY","Mythology",F.MYTHIC_SYMBOLIC,A.MISSING_CANONICAL_DATA,["curated mythic motif annotations"],["similarity"]],
 ["FOLKLORE","Folklore",F.CULTURAL,A.MISSING_CANONICAL_DATA,["curated folklore taxonomy and annotations"],["similarity"]],
 ["SYMBOLISM","Symbolism",F.MYTHIC_SYMBOLIC,A.MISSING_CANONICAL_DATA,["explicit symbol annotations"],["similarity"]],
 ["RELIGIOUS_INTERPRETATION","Religious interpretation",F.RELIGIOUS,A.MISSING_CANONICAL_DATA,["authored classified texts, traditions, and source spans"],["similarity"]],
 ["TECHNOLOGICAL_CAPABILITY","Technological capability",F.TECHNOLOGY,A.EXTERNAL_PROVIDER_REQUIRED,["dated platform specifications and effective dates"],["similarity"]],
 ["SOCIETAL_RESPONSE","Societal response",F.SOCIETAL_GLOBAL_CONTEXT,A.EXTERNAL_PROVIDER_REQUIRED,["dated surveys, media metrics, event metrics, and declared window"],["similarity"]],
 ["GLOBAL_ANXIETY_INDEX","Global Anxiety Index",F.SOCIETAL_GLOBAL_CONTEXT,A.EXTERNAL_PROVIDER_REQUIRED,["governed component definitions","declared population","declared time window","qualified input datasets","normalization rules","coverage and adequacy requirements","complete component ledger","versioned methodology","full provenance"],["composite","components"]],
] as const satisfies readonly Seed[];

const legacyDescriptions: Readonly<Record<string,string>> = Object.freeze({
 OBSERVABILITY:"Sensor observations, witnesses, instrumentation, and evidence.", NARRATIVE:"Claims, reports, testimony, and descriptive accounts.",
 TEMPORAL:"Time relationships, chronology, sequencing, and recurrence.", GEOGRAPHY:"Spatial relationships, location, terrain, and proximity.",
 INFRASTRUCTURE:"Facilities, platforms, organizations, and supporting systems.",
});
const unavailableReason = (id:string, availability:CanonicalLayerDefinition["availability"], inputs:readonly string[]) => id === "GLOBAL_ANXIETY_INDEX"
 ? "Unavailable: no governed, versioned composite methodology or qualified component datasets exist; missing " + inputs.join(", ") + "."
 : `Unavailable (${availability}): requires ${inputs.join(", ")}.`;
const memberCounts = new Map<string,number>();
export type CanonicalLayerId = typeof seeds[number][0];
export const CanonicalLayerCatalog = freeze(seeds.map(([id,label,familyId,availability,inputs,outputs,evaluatorKey], index): CanonicalLayerDefinition => {
 const operational = availability === A.OPERATIONAL;
 const familyMemberOrder = (memberCounts.get(familyId) ?? 0) + 1; memberCounts.set(familyId,familyMemberOrder);
 return {
  id,label,description:legacyDescriptions[id] ?? `${label} evaluates its declared analytical question only when its required canonical inputs and methodology are available.`,
  familyId,displayOrder:index+1,familyMemberOrder,catalogVersion:CANONICAL_LAYER_CATALOG_VERSION,lifecycleStatus:L.CURRENT,
  availability,operationalStatus:operational?O.OPERATIONAL:O.UNAVAILABLE,requiredCanonicalInputs:inputs,evaluatorKey,
  evaluatorVersion:operational?"canonical-similarity/v1":undefined,outputKinds:outputs,
  provenancePolicy: operational?"Preserve canonical feature and source evaluation lineage.":"Require complete input, source, revision, method, and window lineage before evaluation.",
  missingDataBehavior:"Return UNAVAILABLE; never substitute zero, infer evidence, or affect scores or weights.",
  defaultProfileMembership: [...(id === "OBSERVABILITY" || id === "NARRATIVE" || id === "TEMPORAL" ? [P.CANONICAL_BASELINE] : []), ...(operational ? [P.ALL_OPERATIONAL] : [])],
  researcherSelectable:operational, unavailableReason:operational?undefined:unavailableReason(id,availability,inputs),
 };
}));
