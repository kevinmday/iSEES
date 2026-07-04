// ============================================================
// src/investigationControl/InvestigationMode.ts
// P30.1
// INVESTIGATION CONTROL
// OPERATOR MODE CONTRACT
//
// Investigation Control owns the operator workflow for
// constructing and computing investigations.
//
// Explore Mode
//   Builds the investigation.
//
// Compute Mode
//   Defines the computational universe used by
//   Resolve–Dissolve Computation.
//
// NOTE:
// This project uses "erasableSyntaxOnly", therefore enums are
// intentionally avoided in favor of const objects with literal
// types.
//
// Full drop-in file.
// ============================================================

// ============================================================
// INVESTIGATION MODES
// ============================================================

export const InvestigationMode = {

  EXPLORE: "EXPLORE",

  COMPUTE: "COMPUTE",

} as const;

// ============================================================
// TYPE
// ============================================================

export type InvestigationMode =
  (typeof InvestigationMode)[keyof typeof InvestigationMode];