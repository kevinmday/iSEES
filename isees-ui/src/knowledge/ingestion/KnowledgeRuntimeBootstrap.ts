// ============================================================
// src/knowledge/ingestion/KnowledgeRuntimeBootstrap.ts
// P56A
// KNOWLEDGE RUNTIME BOOTSTRAP
//
// Deterministic bootstrap boundary for installing source
// knowledge into the canonical Knowledge Object Runtime.
//
// Current source:
//
//     SYSTEM CANON
//          ↓
//     CanonicalReplayEvent[]
//          ↓
//     SystemCanonKnowledgeAdapter
//          ↓
//     KnowledgeObject[]
//          ↓
//     KnowledgeObjectRuntime
//
// Future composition:
//
//     SYSTEM CANON ────────┐
//                           │
//     ACCOUNT RESEARCH ─────┼──→ K
//                           │
//     FEDERATED SOURCES ─────┘
//
// This module owns source composition.
//
// It does NOT:
//
// • build topology
// • run RDC
// • perform layout
// • render UI
// • perform networking
// • perform persistence
// • perform AI inference
//
// ============================================================

import {
  CANONICAL_EVENTS,
} from "../../canonical/runtimeCorpus";

import {
  adaptSystemCanonToKnowledge,
} from "./SystemCanonKnowledgeAdapter";

import {
  knowledgeObjectRuntime,
} from "../runtime/KnowledgeObjectRuntime";

import type {
  KnowledgeObject,
} from "../model/KnowledgeObject";

// ============================================================
// RESULT
// ============================================================

export interface KnowledgeRuntimeBootstrapResult {

  sourceEventCount: number;

  knowledgeObjectCount: number;

  runtimeObjectCount: number;

  runtimeRevision: number;

}

// ============================================================
// BUILD BOOTSTRAP POPULATION
// ============================================================
//
// Pure construction step.
//
// Keeping this separate from runtime mutation gives us a
// deterministic seam that can be verified independently.
//
// ============================================================

export function buildKnowledgeBootstrapPopulation():
KnowledgeObject[] {

  return adaptSystemCanonToKnowledge(
    CANONICAL_EVENTS,
  );

}

// ============================================================
// BOOTSTRAP KNOWLEDGE RUNTIME
// ============================================================
//
// IMPORTANT:
//
// setObjects() establishes the complete bootstrap population
// atomically.
//
// We deliberately do NOT:
//
//     clear()
//     addObject()
//     addObject()
//     addObject()
//     ...
//
// because doing so would expose intermediate runtime states
// and create unnecessary revision/event churn.
//
// ============================================================

export function bootstrapKnowledgeRuntime():
KnowledgeRuntimeBootstrapResult {

  const objects =
    buildKnowledgeBootstrapPopulation();

  knowledgeObjectRuntime.setObjects(
    objects,
  );

  const state =
    knowledgeObjectRuntime.getState();

  return {

    sourceEventCount:
      CANONICAL_EVENTS.length,

    knowledgeObjectCount:
      objects.length,

    runtimeObjectCount:
      state.objects.length,

    runtimeRevision:
      state.revision,

  };

}

// ============================================================
// VERIFICATION
// ============================================================
//
// Useful for diagnostics and verification without exposing
// implementation details to React.
//
// ============================================================

export function isKnowledgeRuntimeBootstrapped():
boolean {

  const expected =
    buildKnowledgeBootstrapPopulation();

  const actual =
    knowledgeObjectRuntime.getObjects();

  if (
    expected.length !==
    actual.length
  ) {

    return false;

  }

  for (
    let index = 0;
    index < expected.length;
    index += 1
  ) {

    if (
      expected[index]?.identity.id !==
      actual[index]?.identity.id
    ) {

      return false;

    }

  }

  return true;

}

// ============================================================
// END
// ============================================================