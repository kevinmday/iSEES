// ============================================================
// src/federation/services/loadFederation.ts
// P26 FEDERATED KNOWLEDGE LAYER
// LOAD ALL REGISTERED REPOSITORIES
// ============================================================

import type {

    CorpusEvent

} from "../../corpus/corpusTypes";

import {

    getRepositories

} from "../FederationRegistry";

import type {

    FederationAdapter,
    FederationRepository

} from "../adapters/FederationAdapter";

// ============================================================
// TYPES
// ============================================================

export interface FederatedRepository {

    adapter:
        FederationAdapter;

    repository:
        FederationRepository;

    events:
        CorpusEvent[];

}

export type FederatedKnowledgeLayer =

    FederatedRepository[];

// ============================================================
// LOAD
// ============================================================

export async function
loadFederation():

Promise<
    FederatedKnowledgeLayer
> {

    const adapters =
        getRepositories();

    const knowledgeLayer:

        FederatedKnowledgeLayer = [];

    for (

        const adapter
        of adapters

    ) {

        const events =
            await adapter.load();

        knowledgeLayer.push({

            adapter,

            repository:

                adapter.repository,

            events

        });

    }

    return knowledgeLayer;

}