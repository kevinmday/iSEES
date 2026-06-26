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

    FederationRepository

} from "../adapters/FederationAdapter";

// ============================================================
// TYPES
// ============================================================

export interface FederatedRepository {

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

    const repositories =
        getRepositories();

    const knowledgeLayer:

        FederatedKnowledgeLayer = [];

    for (

        const adapter
        of repositories

    ) {

        const events =
            await adapter.load();

        knowledgeLayer.push({

            repository:

                adapter.repository,

            events

        });

    }

    return knowledgeLayer;

}