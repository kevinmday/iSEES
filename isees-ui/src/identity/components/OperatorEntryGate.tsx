// ============================================================
// src/identity/components/OperatorEntryGate.tsx
// P56D-I1
// OPERATOR IDENTITY ENTRY GATE
//
// Deterministic application-entry boundary.
//
// This component decides only whether an operator identity has
// been established.
//
// It does NOT:
//
//   - authenticate accounts
//   - own identity state
//   - own Workspace state
//   - own Operator Session state
//   - change application capability
//
// Identity semantics:
//
//   INITIALIZING
//       -> neutral initialization surface
//
//   READY / NONE
//       -> OperatorEntryScreen
//
//   READY / GUEST
//       -> real iSEES application
//
//   READY / ACCOUNT
//       -> real iSEES application
//
// Guest and Account therefore cross the SAME application gate.
//
// Account != Capability
//
// ============================================================

import type {

  ReactNode,

} from "react";

import {

  useOperatorIdentity,

} from "../runtime/OperatorIdentityRuntimeContext";

import {

  getOperatorIdentityKind,

} from "../runtime/OperatorIdentityRuntimeTypes";

import {

  OperatorEntryScreen,

} from "./OperatorEntryScreen";


// ============================================================
// PROPS
// ============================================================

type OperatorEntryGateProps = {

  children:
    ReactNode;

};


// ============================================================
// COMPONENT
// ============================================================

export function OperatorEntryGate({

  children,

}: OperatorEntryGateProps) {

  const identityState =
    useOperatorIdentity();

  const identityKind =
    getOperatorIdentityKind(
      identityState,
    );


  // ==========================================================
  // INITIALIZING
  // ==========================================================
  //
  // Do not briefly expose either the entry screen or the
  // operational application while identity runtime startup is
  // unresolved.
  //
  // ==========================================================

  if (

    identityState.status ===
    "INITIALIZING"

  ) {

    return (

      <main

        aria-busy="true"
        aria-label="Initializing iSEES"

        style={{

          minHeight:
            "100vh",

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#070b10",

          color:
            "#6f8799",

          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

          fontSize:
            "12px",

          letterSpacing:
            "0.16em",

          textTransform:
            "uppercase",

        }}

      >

        Initializing iSEES

      </main>

    );

  }


  // ==========================================================
  // NO OPERATOR
  // ==========================================================
  //
  // READY does not imply Guest.
  //
  // The operator must deliberately choose an entry path.
  //
  // ==========================================================

  if (

    identityKind === "NONE"

  ) {

    return (

      <OperatorEntryScreen />

    );

  }


  // ==========================================================
  // ESTABLISHED OPERATOR
  // ==========================================================
  //
  // GUEST and ACCOUNT deliberately enter the exact same
  // operational application.
  //
  // Persistence differs.
  // Capability does not.
  //
  // ==========================================================

  if (

    identityKind === "GUEST" ||
    identityKind === "ACCOUNT"

  ) {

    return (

      <>

        {children}

      </>

    );

  }


  // ==========================================================
  // EXHAUSTIVE SAFETY BOUNDARY
  // ==========================================================
  //
  // The canonical identity vocabulary should make this path
  // unreachable.
  //
  // Keeping an explicit failure prevents an unknown future
  // identity state from silently entering the application.
  //
  // ==========================================================

  throw new Error(

    `Unsupported operator identity kind: ${String(identityKind)}`,

  );

}