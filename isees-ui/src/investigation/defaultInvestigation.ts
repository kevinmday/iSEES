// ============================================================
// src/investigation/defaultInvestigation.ts
// P29
// INVESTIGATION LIFECYCLE FOUNDATION
// DEFAULT INVESTIGATION
//
// Constructs the initial deterministic Investigation used by
// the InvestigationContext until investigations are persisted.
//
// FULL DROP-IN FILE
// ============================================================

import {
  DEFAULT_WORKSPACE,
} from "../workspace/defaultWorkspace";

import type {
  Investigation,
} from "./investigationTypes";

// ============================================================
// TIMESTAMP
// ============================================================

const now =
  new Date().toISOString();

// ============================================================
// DEFAULT INVESTIGATION
// ============================================================

export const DEFAULT_INVESTIGATION:
  Investigation = {

  id:
    "INVESTIGATION-0001",

  name:
    "Primary Investigation",

  description:
    "Default operator investigation.",

  createdAt:
    now,

  updatedAt:
    now,

  createdBy:
    "SYSTEM",

  status:
    "ACTIVE",

  workspace:
    DEFAULT_WORKSPACE,

  currentRevisionId:
    undefined,

  revisions: [],
};