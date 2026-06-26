// ============================================================
// src/federation/FederationRegistry.ts
// P26 FEDERATED KNOWLEDGE LAYER
// REPOSITORY REGISTRY
//
// Central registration point for every federated repository.
// The remainder of the federation subsystem should never
// instantiate adapters directly.
// ============================================================

import type {

    FederationAdapter

} from "./adapters/FederationAdapter";

import {

    SystemCanonAdapter

} from "./adapters/SystemCanonAdapter";

import {

    ResearchCanonAdapter

} from "./adapters/ResearchCanonAdapter";

import {

    SCUAdapter

} from "./adapters/SCUAdapter";

import {

    AAROAdapter

} from "./adapters/AAROAdapter";

import {

    ZenodoAdapter

} from "./adapters/ZenodoAdapter";

import {

    ARGUSAdapter

} from "./adapters/ARGUSAdapter";

// ============================================================
// REPOSITORY REGISTRY
// ============================================================

export const federationRegistry:

    FederationAdapter[] = [

        new SystemCanonAdapter(),

        new ResearchCanonAdapter(),

        new SCUAdapter(),

        new AAROAdapter(),

        new ZenodoAdapter(),

        new ARGUSAdapter()

    ];

// ============================================================
// HELPERS
// ============================================================

export function getRepository(

    repositoryId: string

):

    FederationAdapter | undefined {

    return federationRegistry.find(

        repository =>

            repository.repository.id ===
            repositoryId

    );

}

export function getRepositories():

    FederationAdapter[] {

    return federationRegistry;

}