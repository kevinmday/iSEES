// ============================================================
// RUNTIME CANONICAL CORPUS
// ============================================================

import type {
  CanonicalReplayEvent,
} from "../adapters/canonicalEventAdapter";

import {
  NIMITZ_2004,
} from "./nimitz_2004";

import {
  ROOSEVELT_2015,
} from "./roosevelt_2015";

import {
  RENDLESHAM_1980,
} from "./rendlesham_1980";

// ============================================================
// CANONICAL REPLAY EVENTS
// ============================================================

export const CANONICAL_EVENTS:
  CanonicalReplayEvent[] = [

  NIMITZ_2004,

  ROOSEVELT_2015,

  RENDLESHAM_1980,

];