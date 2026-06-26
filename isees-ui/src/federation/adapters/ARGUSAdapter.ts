// ============================================================
// src/federation/adapters/ARGUSAdapter.ts
// P26 FEDERATED KNOWLEDGE LAYER
// ARGUS ADAPTER
//
// Adapter exposing the ARGUS distributed observability
// repository through the Federation contract.
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
        "ARGUS",

    name:
        "ARGUS",

    description:
        "Distributed ARGUS observability repository.",

    version:
        "1.0",

    authority:
        "ARGUS",

    capabilities: {

        supportsSearch: true,

        supportsPreview: true,

        supportsImport: true,

        supportsCompare: true,

        supportsLiveUpdates: true

    }

};

// ============================================================
// ADAPTER
// ============================================================

export class ARGUSAdapter
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

        //
        // Placeholder.
        // Future implementation will retrieve
        // normalized investigations from ARGUS.
        //

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

                event
                    .canonical_event
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

        return {

            imported: 1,

            skipped: 0,

            warnings: []

        };

    }

}