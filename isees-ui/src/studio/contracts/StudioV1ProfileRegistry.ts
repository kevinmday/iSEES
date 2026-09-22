import { ARTIFACT_PROFILES, PROJECTION_FORMATS, SEMANTIC_NODE_TYPES, type ArtifactProfile, type SemanticNodeType } from "./StudioV1Contract.ts";
import { AuthorDocumentTypes, type AuthorDocumentType } from "../../author/model/AuthorDocumentTypes.ts";

export const STUDIO_V1_PROFILE_REGISTRY_SCHEMA_VERSION = "studio-v1/profile-registry/1" as const;
export const PROFILE_AVAILABILITIES = ["VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED"] as const;
export const SECTION_REQUIREMENTS = ["REQUIRED", "OPTIONAL"] as const;
export const SECTION_REPEATABILITIES = ["SINGLE", "REPEATABLE"] as const;
export const PROFILE_VALIDATION_LEVELS = ["VERIFIED", "ADMITTED_UNVERIFIED"] as const;
export const DRAFTING_DESIGN_IDS = ["investigation-report/1", "evidence-assessment/1", "comparative-event-analysis/1", "research-memorandum/1"] as const;
export const PROJECTION_CAPABILITY_STATES = ["VERIFIED_AVAILABLE", "ADMITTED_UNVERIFIED", "UNSUPPORTED"] as const;

export type ProfileAvailability = typeof PROFILE_AVAILABILITIES[number];
export type SectionRequirement = typeof SECTION_REQUIREMENTS[number];
export type SectionRepeatability = typeof SECTION_REPEATABILITIES[number];
export type ProfileValidationLevel = typeof PROFILE_VALIDATION_LEVELS[number];
export type DraftingDesignId = typeof DRAFTING_DESIGN_IDS[number];
export type ProjectionCapabilityState = typeof PROJECTION_CAPABILITY_STATES[number];
export type RegistryProjectionFormat = Extract<typeof PROJECTION_FORMATS[number], "PDF" | "DOCX" | "HTML">;

export interface StudioV1ProfileSectionDefinition {
  readonly sectionId: string; readonly displayLabel: string; readonly description: string; readonly ordinal: number;
  readonly requirement: SectionRequirement; readonly repeatability: SectionRepeatability;
  readonly allowedSemanticNodeTypes: readonly SemanticNodeType[]; readonly customResearcherContentAllowed: boolean;
}
export interface StudioV1ProjectionCapability {
  readonly format: RegistryProjectionFormat; readonly capabilityState: ProjectionCapabilityState;
  readonly templateProfileVersion?: string; readonly rendererVersion?: string;
  readonly currentDraftSupport: boolean; readonly savedRevisionSupport: boolean; readonly disposition: "DURABLE_CHILD_PROJECTION" | "LOCAL_DISPOSABLE_PREVIEW" | "NOT_PROJECTION_READY";
}
export interface StudioV1ProfileChangePolicy { readonly beforeFirstSave: "SELECTABLE_OR_CHANGEABLE_LOCAL_WORKING_DOCUMENT"; readonly afterFirstSave: "IMMUTABLE_FOR_ARTIFACT_LINEAGE" }
export interface StudioV1ProfileDefinition {
  readonly profileId: ArtifactProfile; readonly displayName: string; readonly description: string; readonly profileVersion: string;
  readonly availability: ProfileAvailability; readonly compatibleAuthorDocumentTypes: readonly AuthorDocumentType[];
  readonly sections: readonly StudioV1ProfileSectionDefinition[]; readonly validationLevel: ProfileValidationLevel;
  readonly compatibleDraftingDesignIds: readonly DraftingDesignId[]; readonly projectionCapabilities: readonly StudioV1ProjectionCapability[];
  readonly profileChangePolicy: StudioV1ProfileChangePolicy;
}

const NODES = [...SEMANTIC_NODE_TYPES] as const;
const POLICY = { beforeFirstSave: "SELECTABLE_OR_CHANGEABLE_LOCAL_WORKING_DOCUMENT", afterFirstSave: "IMMUTABLE_FOR_ARTIFACT_LINEAGE" } as const;
const section = (sectionId:string, displayLabel:string, description:string, ordinal:number, requirement:SectionRequirement, repeatability:SectionRepeatability):StudioV1ProfileSectionDefinition => ({sectionId,displayLabel,description,ordinal,requirement,repeatability,allowedSemanticNodeTypes:NODES,customResearcherContentAllowed:true});
const unavailable = (format:RegistryProjectionFormat):StudioV1ProjectionCapability => ({format,capabilityState:"ADMITTED_UNVERIFIED",currentDraftSupport:false,savedRevisionSupport:false,disposition:"NOT_PROJECTION_READY"});

const mutableRegistry: StudioV1ProfileDefinition[] = [
  { profileId:"INVESTIGATION_REPORT",displayName:"Investigation Report",description:"Governed report of a research question, evidence, analysis, and conclusion.",profileVersion:"investigation-report/v1",availability:"VERIFIED_AVAILABLE",compatibleAuthorDocumentTypes:["REPORT"],validationLevel:"VERIFIED",compatibleDraftingDesignIds:["investigation-report/1"],profileChangePolicy:POLICY,
    sections:[section("abstract","Abstract","Optional summary of the investigation.",1,"OPTIONAL","SINGLE"),section("research-question","Research Question","Question that governs the investigation.",2,"REQUIRED","SINGLE"),section("hypothesis","Hypothesis / H0 / H1","Declared hypotheses and alternatives.",3,"OPTIONAL","REPEATABLE"),section("method","Method","Methods, assumptions, and analytical approach.",4,"OPTIONAL","SINGLE"),section("evidence","Evidence","Governed evidence supporting or challenging the inquiry.",5,"REQUIRED","REPEATABLE"),section("analysis","Analysis","Reasoning grounded in the declared evidence.",6,"REQUIRED","REPEATABLE"),section("figures-tables","Figures / Tables","Figures and tables with governed lineage.",7,"OPTIONAL","REPEATABLE"),section("conclusion","Conclusion","Bounded findings and unresolved uncertainty.",8,"REQUIRED","SINGLE"),section("references-footnotes","References / Footnotes","Citations, references, and footnotes.",9,"OPTIONAL","REPEATABLE")],
    projectionCapabilities:[{format:"PDF",capabilityState:"VERIFIED_AVAILABLE",templateProfileVersion:"investigation-report-pdf/1",rendererVersion:"studio-v1-reportlab-pdf/1",currentDraftSupport:true,savedRevisionSupport:true,disposition:"DURABLE_CHILD_PROJECTION"},{format:"DOCX",capabilityState:"VERIFIED_AVAILABLE",templateProfileVersion:"investigation-report-docx/1",rendererVersion:"studio-v1-python-docx/1",currentDraftSupport:true,savedRevisionSupport:true,disposition:"DURABLE_CHILD_PROJECTION"},{format:"HTML",capabilityState:"VERIFIED_AVAILABLE",templateProfileVersion:"studio-current-draft/v1",rendererVersion:"studio-local-html/v1",currentDraftSupport:true,savedRevisionSupport:false,disposition:"LOCAL_DISPOSABLE_PREVIEW"}]},
  { profileId:"EXECUTIVE_BRIEF",displayName:"Executive Brief",description:"Concise decision-oriented synthesis; runtime validation and projection acceptance are incomplete.",profileVersion:"executive-brief/v1",availability:"ADMITTED_UNVERIFIED",compatibleAuthorDocumentTypes:["REPORT"],validationLevel:"ADMITTED_UNVERIFIED",compatibleDraftingDesignIds:[],profileChangePolicy:POLICY,sections:[section("executive-summary","Executive Summary","Concise statement of the issue and result.",1,"REQUIRED","SINGLE"),section("key-findings","Key Findings","Material supported findings.",2,"REQUIRED","REPEATABLE"),section("evidence-basis","Evidence Basis","Evidence scope and limitations.",3,"REQUIRED","REPEATABLE"),section("implications","Implications","Decision-relevant implications.",4,"REQUIRED","REPEATABLE"),section("recommended-actions","Recommended Actions","Bounded actions for consideration.",5,"OPTIONAL","REPEATABLE")],projectionCapabilities:[unavailable("PDF"),unavailable("DOCX"),unavailable("HTML")]},
  { profileId:"SCIENTIFIC_PAPER",displayName:"Scientific Paper",description:"Formal scientific manuscript; runtime validation and projection acceptance are incomplete.",profileVersion:"scientific-paper/v1",availability:"ADMITTED_UNVERIFIED",compatibleAuthorDocumentTypes:["ARTICLE"],validationLevel:"ADMITTED_UNVERIFIED",compatibleDraftingDesignIds:[],profileChangePolicy:POLICY,sections:[section("abstract","Abstract","Structured summary of the paper.",1,"REQUIRED","SINGLE"),section("introduction","Introduction","Research context, question, and contribution.",2,"REQUIRED","SINGLE"),section("methods","Methods","Reproducible methods and assumptions.",3,"REQUIRED","SINGLE"),section("results","Results","Reported results without interpretive overreach.",4,"REQUIRED","REPEATABLE"),section("discussion","Discussion","Interpretation, limitations, and alternatives.",5,"REQUIRED","SINGLE"),section("conclusion","Conclusion","Bounded conclusion and future work.",6,"OPTIONAL","SINGLE"),section("references","References","Structured scholarly citations.",7,"REQUIRED","SINGLE"),section("appendices-supplementary","Appendices / Supplementary Material","Supplementary governed material.",8,"OPTIONAL","REPEATABLE")],projectionCapabilities:[unavailable("PDF"),unavailable("DOCX"),unavailable("HTML")]},
  { profileId:"INTENTION_HYPOTHESIS_ASSESSMENT",displayName:"Intention Hypothesis Assessment",description:"Governed H0/H1 assessment; runtime validation and projection acceptance are incomplete.",profileVersion:"intention-hypothesis-assessment/v1",availability:"ADMITTED_UNVERIFIED",compatibleAuthorDocumentTypes:["REPORT"],validationLevel:"ADMITTED_UNVERIFIED",compatibleDraftingDesignIds:["evidence-assessment/1"],profileChangePolicy:POLICY,sections:[section("assessment-scope","Assessment Scope","Evidence scope, framework version, and declared tests.",1,"REQUIRED","SINGLE"),section("observations","Observations","Available deterministic measurements.",2,"REQUIRED","REPEATABLE"),section("hypotheses","H0 / H1 and Alternatives","H0, H1 variants, and competing explanations.",3,"REQUIRED","REPEATABLE"),section("supporting-evidence","Supporting Evidence","Evidence supporting declared hypotheses.",4,"REQUIRED","REPEATABLE"),section("counterevidence","Counterevidence","Counterevidence and strongest competing arguments.",5,"REQUIRED","REPEATABLE"),section("warrants-assumptions","Warrants / Assumptions","Mathematical warrants and explicit assumptions.",6,"REQUIRED","REPEATABLE"),section("predictions-falsifiers","Predictions / Falsifiers","Testable predictions and falsifiers.",7,"REQUIRED","REPEATABLE"),section("uncertainty-gaps","Uncertainty / Evidence Gaps","Unresolved uncertainty and unavailable measurements.",8,"REQUIRED","SINGLE"),section("governed-conclusion","Governed Conclusion","Controlled conclusion with evidence scope and alternatives.",9,"REQUIRED","SINGLE")],projectionCapabilities:[unavailable("PDF"),unavailable("DOCX"),unavailable("HTML")]}
];

function deepFreeze<T>(value:T):Readonly<T> { if(value && typeof value === "object" && !Object.isFrozen(value)){ Object.freeze(value); for(const child of Object.values(value as Record<string,unknown>)) deepFreeze(child); } return value; }
export function validateStudioV1ProfileRegistry(definitions:readonly StudioV1ProfileDefinition[]):true {
  const ids=new Set<string>(), pairs=new Set<string>();
  for(const profile of definitions){
    if(!ARTIFACT_PROFILES.includes(profile.profileId)||ids.has(profile.profileId)) throw new Error(`Duplicate or unknown profile ID: ${profile.profileId}`); ids.add(profile.profileId);
    const pair=`${profile.profileId}:${profile.profileVersion}`; if(pairs.has(pair)) throw new Error(`Duplicate profile version: ${pair}`); pairs.add(pair);
    if(!/^[a-z0-9-]+\/v[1-9][0-9]*$/.test(profile.profileVersion)||!profile.displayName.trim()||!PROFILE_AVAILABILITIES.includes(profile.availability)) throw new Error(`Malformed profile definition: ${profile.profileId}`);
    if(!PROFILE_VALIDATION_LEVELS.includes(profile.validationLevel)||profile.compatibleAuthorDocumentTypes.length===0||profile.compatibleAuthorDocumentTypes.some(kind=>!Object.values(AuthorDocumentTypes).includes(kind))) throw new Error(`Invalid compatibility or validation level: ${profile.profileId}`);
    const sectionIds=new Set<string>(), ordinals=new Set<number>(); profile.sections.forEach((s,index)=>{if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s.sectionId)||sectionIds.has(s.sectionId)||ordinals.has(s.ordinal)||s.ordinal!==index+1||!SECTION_REQUIREMENTS.includes(s.requirement)||!SECTION_REPEATABILITIES.includes(s.repeatability)||s.allowedSemanticNodeTypes.some(node=>!SEMANTIC_NODE_TYPES.includes(node))) throw new Error(`Invalid section contract: ${profile.profileId}/${s.sectionId}`);sectionIds.add(s.sectionId);ordinals.add(s.ordinal);});
    const designs=new Set<string>(); for(const design of profile.compatibleDraftingDesignIds){if(!DRAFTING_DESIGN_IDS.includes(design)||designs.has(design)) throw new Error(`Invalid drafting design: ${design}`);designs.add(design);}
    const formats=new Set<string>(); for(const capability of profile.projectionCapabilities){if(formats.has(capability.format)||!PROJECTION_CAPABILITY_STATES.includes(capability.capabilityState)) throw new Error(`Duplicate projection format or invalid state: ${capability.format}`);formats.add(capability.format);if(capability.capabilityState==="VERIFIED_AVAILABLE"&&(!capability.templateProfileVersion||!capability.rendererVersion)) throw new Error(`Verified projection lacks identity: ${capability.format}`);}
    if(profile.availability==="VERIFIED_AVAILABLE"&&!profile.projectionCapabilities.some(x=>x.format==="PDF"&&x.capabilityState==="VERIFIED_AVAILABLE"&&x.savedRevisionSupport)) throw new Error(`Verified profile lacks required durable PDF capability: ${profile.profileId}`);
    if(profile.profileChangePolicy.beforeFirstSave!==POLICY.beforeFirstSave||profile.profileChangePolicy.afterFirstSave!==POLICY.afterFirstSave) throw new Error(`Invalid profile-change policy: ${profile.profileId}`);
  }
  if(ids.size!==ARTIFACT_PROFILES.length) throw new Error("Registry must contain every and only Studio V1 profile"); return true;
}
validateStudioV1ProfileRegistry(mutableRegistry);
export const STUDIO_V1_PROFILE_REGISTRY = deepFreeze(mutableRegistry) as readonly Readonly<StudioV1ProfileDefinition>[];
export function listStudioV1Profiles(){return STUDIO_V1_PROFILE_REGISTRY;}
export function listVerifiedAvailableStudioV1Profiles(){return STUDIO_V1_PROFILE_REGISTRY.filter(x=>x.availability==="VERIFIED_AVAILABLE");}
export function getStudioV1Profile(profileId:ArtifactProfile){const found=STUDIO_V1_PROFILE_REGISTRY.find(x=>x.profileId===profileId);if(!found)throw new Error(`Unknown Studio V1 profile: ${profileId}`);return found;}
export function getStudioV1ProfileVersion(profileId:ArtifactProfile,profileVersion:string){const found=STUDIO_V1_PROFILE_REGISTRY.find(x=>x.profileId===profileId&&x.profileVersion===profileVersion);if(!found)throw new Error(`Unknown Studio V1 profile/version: ${profileId}/${profileVersion}`);return found;}
export function serializeStudioV1ProfileRegistry(){return {schemaVersion:STUDIO_V1_PROFILE_REGISTRY_SCHEMA_VERSION,profiles:STUDIO_V1_PROFILE_REGISTRY};}
