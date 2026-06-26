// ============================================================
// src/federation/adapters/SystemCanonAdapter.ts
// P26 FEDERATED KNOWLEDGE LAYER
// SYSTEM CANON ADAPTER
//
// Adapter exposing the built-in deterministic iSEES corpus.
// ============================================================

import type {

    CorpusEvent

} from "../../corpus/corpusTypes";

import {

    loadCorpus

} from "../../corpus/loadCorpus";

import type {

    FederationAdapter,
    FederationImportResult,
    FederationPreview,
    FederationRepository,
    FederationSearchRequest

} from "./FederationAdapter";

// ============================================================
// REPOSITORY METADATA
// ============================================================

const repository:

    FederationRepository = {

    id:
        "SYSTEM_CANON",

    name:
        "System Canon",

    description:
        "Deterministic investigations distributed with iSEES.",

    version:
        "1.0",

    authority:
        "iSEES",

    capabilities: {

        supportsSearch: true,

        supportsPreview: true,

        supportsImport: true,

        supportsCompare: true,

        supportsLiveUpdates: false

    }

};

// ============================================================
// ADAPTER
// ============================================================

export class SystemCanonAdapter
    implements FederationAdapter {

    readonly repository =
        repository;

    // ========================================================
    // LOAD
    // ========================================================

    async load():

        Promise<
            CorpusEvent[]
        > {

        return loadCorpus();

    }

    // ========================================================
    // SEARCH
    // ========================================================

    async search(

        request:
            FederationSearchRequest

    ):

        Promise<
            CorpusEvent[]
        > {

        const corpus =
            await this.load();

        const query =
            request.query
                .trim()
                .toLowerCase();

        if (
            query.length === 0
        ) {

            return corpus;

        }

        return corpus.filter(

            event =>

                event.canonical_event
                    .event_name
                    .toLowerCase()
                    .includes(
                        query
                    )

        );

    }

    // ========================================================
    // PREVIEW
    // ========================================================

    async preview(

        eventId: string

    ):

        Promise<
            FederationPreview
        > {

        const corpus =
            await this.load();

        const event =
            corpus.find(

                candidate =>

                    candidate
                        .canonical_event
                        .event_id ===
                    eventId

            );

        if (
            !event
        ) {

            throw new Error(

                `Unknown event: ${eventId}`

            );

        }

        return {

            repositoryId:
                this.repository.id,

            event,

            availableArtifacts: 0,

            availableNarratives: 0,

            availableResolutions:

                event.resolutions
                    ?.length ?? 0,

            lastUpdated:

                event.updated_at

        };

    }

    // ========================================================
    // IMPORT
    // ========================================================

    async import(

        _eventId: string

    ):

        Promise<
            FederationImportResult
        > {

        // Import into workspace
        // will be implemented
        // during P26.

        return {

            imported: 1,

            skipped: 0,

            warnings: []

        };

    }

}