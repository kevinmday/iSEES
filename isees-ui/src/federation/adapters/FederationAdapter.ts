// ============================================================
// src/federation/adapters/FederationAdapter.ts
// P26 FEDERATED KNOWLEDGE LAYER
// COMMON ADAPTER CONTRACT
//
// Every external knowledge repository implements this interface.
// The browser, loader, search, preview and import services all
// communicate ONLY through this deterministic contract.
// ============================================================

import type {

    CorpusEvent

} from "../../corpus/corpusTypes";

// ============================================================
// REPOSITORY CAPABILITIES
// ============================================================

export interface FederationCapabilities {

    readonly supportsSearch: boolean;

    readonly supportsPreview: boolean;

    readonly supportsImport: boolean;

    readonly supportsCompare: boolean;

    readonly supportsLiveUpdates: boolean;
}

// ============================================================
// REPOSITORY METADATA
// ============================================================

export interface FederationRepository {

    readonly id: string;

    readonly name: string;

    readonly description: string;

    readonly version: string;

    readonly authority: string;

    readonly capabilities:
        FederationCapabilities;
}

// ============================================================
// SEARCH
// ============================================================

export interface FederationSearchRequest {

    readonly query: string;

    readonly limit?: number;
}

// ============================================================
// PREVIEW
// ============================================================

export interface FederationPreview {

    readonly repositoryId: string;

    readonly event: CorpusEvent;

    readonly availableArtifacts: number;

    readonly availableNarratives: number;

    readonly availableResolutions: number;

    readonly lastUpdated: string;
}

// ============================================================
// IMPORT RESULT
// ============================================================

export interface FederationImportResult {

    readonly imported: number;

    readonly skipped: number;

    readonly warnings: string[];
}

// ============================================================
// COMMON ADAPTER CONTRACT
// ============================================================

export interface FederationAdapter {

    readonly repository:
        FederationRepository;

    load():

        Promise<
            CorpusEvent[]
        >;

    search(

        request:
            FederationSearchRequest

    ):

        Promise<
            CorpusEvent[]
        >;

    preview(

        eventId: string

    ):

        Promise<
            FederationPreview
        >;

    import(

        eventId: string

    ):

        Promise<
            FederationImportResult
        >;
}
