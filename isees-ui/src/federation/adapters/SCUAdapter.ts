// ============================================================
// src/federation/adapters/SCUAdapter.ts
// P26 FEDERATED KNOWLEDGE LAYER
// SCU ADAPTER
//
// Adapter exposing the Scientific Coalition for UAP Studies
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
        "SCU",

    name:
        "SCU",

    description:
        "Scientific Coalition for UAP Studies repository.",

    version:
        "1.0",

    authority:
        "SCU",

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

export class SCUAdapter
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
        // Later this will hydrate the SCU repository.
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