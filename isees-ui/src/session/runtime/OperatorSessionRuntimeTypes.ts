// ============================================================
// src/session/runtime/OperatorSessionRuntimeTypes.ts
// P54A
// COMPUTATIONAL OPERATOR SESSION RUNTIME TYPES
//
// The Operator Session Runtime governs the operator's
// active computational task.
//
// Unlike the Workspace Runtime, which determines what
// occupies the center workspace, the Operator Session
// Runtime determines what the operator is doing.
//
// React observes.
//
// ============================================================

// ============================================================
// SESSION STATUS
// ============================================================

export type OperatorSessionStatus =

  | "INITIALIZING"
  | "READY"
  | "ACTIVE";

// ============================================================
// SESSION TYPES
// ============================================================

export const OperatorSessionType = {

  NORMAL:
    "NORMAL",

  RESEARCH_REVIEW:
    "RESEARCH_REVIEW",

} as const;

export type OperatorSessionType =

  typeof OperatorSessionType[

    keyof typeof OperatorSessionType

  ];
// ============================================================
// INSTRUMENT DESCRIPTOR
// ============================================================

export interface OperatorInstrument {

  id: string;

  title: string;

}

// ============================================================
// SESSION STATE
// ============================================================

export interface OperatorSessionState {

  status:
    OperatorSessionStatus;

  activeSession:
    OperatorSessionType;

  previousSession?:
    OperatorSessionType;

  startedAt?:
    Date;

  revision:
    number;

  leftInstruments:
    OperatorInstrument[];

  rightInstruments:
    OperatorInstrument[];

}