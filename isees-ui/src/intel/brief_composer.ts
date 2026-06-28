// ============================================================
// src/intel/brief_composer.ts
// P26.1
// INTELLIGENCE BRIEF COMPOSER
//
// PURPOSE
// -------
// Translates repository previews into a repository-agnostic
// Intelligence Brief.
//
// This is intentionally independent of:
//
// - React
// - Workspace
// - Manifold
// - Operational Intelligence
//
// Operational intelligence answers:
//
//     "What should I do?"
//
// Intelligence Brief answers:
//
//     "What is this?"
//
// ============================================================

import type {

  IntelligenceBrief,

  IntelligenceRepositorySource,

} from "./types/intelligenceBriefTypes";

import type {

  FederationPreview,

} from "../federation/adapters/FederationAdapter";


// ============================================================
// FEDERATION
// ============================================================

export function composeFederationBrief(

  preview: FederationPreview

): IntelligenceBrief {

  return {

    // ========================================================
    // OBJECT
    // ========================================================

    objectType:

      "EVENT",

    objectId:

      resolveObjectId(
        preview
      ),

    title:

      resolveTitle(
        preview
      ),

    // ========================================================
    // SOURCE
    // ========================================================

    repositorySource:

      mapRepositorySource(

        preview

      ),

    repositoryId:

      resolveRepositoryId(
        preview
      ),

    // ========================================================
    // SUMMARY
    // ========================================================

    summary:

      resolveSummary(
        preview
      ),

    // ========================================================
    // FEDERATION
    // ========================================================

    corpusEventId:

      resolveCorpusEventId(
        preview
      ),

    // ========================================================
    // PLACEHOLDERS
    // ========================================================

    metadata: {},

    relationships: [],

    provenance: [

      {

        source:

          resolveRepositoryId(
            preview
          ),

      },

    ],

  };

}


// ============================================================
// UNIVERSAL ENTRY POINT
// ============================================================

export function composeBrief(

  preview: FederationPreview

): IntelligenceBrief {

  return composeFederationBrief(

    preview

  );

}


// ============================================================
// HELPERS
// ============================================================

function resolveObjectId(

  preview: any

): string {

  return (

    preview.objectId ??

    preview.eventId ??

    preview.event_id ??

    preview.id ??

    ""

  );

}


function resolveCorpusEventId(

  preview: any

): string | undefined {

  return (

    preview.eventId ??

    preview.event_id ??

    preview.objectId ??

    preview.id

  );

}


function resolveTitle(

  preview: any

): string {

  return (

    preview.title ??

    preview.eventName ??

    preview.event_name ??

    preview.name ??

    "Untitled"

  );

}


function resolveSummary(

  preview: any

): string | undefined {

  return (

    preview.summary ??

    preview.description ??

    undefined

  );

}


function resolveRepositoryId(

  preview: any

): string {

  return (

    preview.repositoryId ??

    preview.repository_id ??

    "UNKNOWN"

  );

}


// ============================================================
// REPOSITORY MAPPING
// ============================================================

function mapRepositorySource(

  preview: any

): IntelligenceRepositorySource {

  const repository =

    resolveRepositoryId(
      preview
    );

  switch (

    repository

  ) {

    case "SYSTEM_CANON":

      return "SYSTEM_CANON";

    case "RESEARCH_CANON":

      return "RESEARCH_CANON";

    case "SCU":

      return "SCU";

    case "AARO":

      return "AARO";

    case "ZENODO":

      return "ZENODO";

    case "ARGUS":

      return "ARGUS";

    case "WORKSPACE":

      return "WORKSPACE";

    case "MANUAL":

      return "MANUAL";

    default:

      return "UNKNOWN";

  }

}