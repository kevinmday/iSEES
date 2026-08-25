// ============================================================
// src/identity/components/OperatorEntryScreen.tsx
// P56D-I1
// P57-UI-A2
// OPERATOR ENTRY SCREEN
//
// Entry surface for establishing an iSEES operator identity.
//
// Product contract:
//
//   Guest = full iSEES + session persistence
//   Account = full iSEES + durable persistence
//
// Guest is NOT:
//
//   - a demo
//   - a restricted application mode
//   - reduced computational capability
//
// Only Continue as Guest is operational during P56D-I1.
//
// Account creation and login are intentionally represented as
// future persistence paths and MUST NOT fake authentication.
//
// P57-UI-A2:
//
// Presentation now consumes the canonical iSEES design language.
// Identity behavior and runtime ownership remain unchanged.
//
// ============================================================

import {

  useOperatorIdentityRuntime,

} from "../runtime/OperatorIdentityRuntimeContext";

import "./OperatorEntryScreen.css";


// ============================================================
// COMPONENT
// ============================================================

export function OperatorEntryScreen() {

  const {

    runtime,

  } = useOperatorIdentityRuntime();


  // ==========================================================
  // GUEST ENTRY
  // ==========================================================

  function handleContinueAsGuest() {

    runtime.continueAsGuest();

  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <main className="isees-entry">

      <section

        className="isees-entry__surface"

        aria-labelledby="isees-entry-title"

      >

        {/* ====================================================
            BRAND
            ==================================================== */}

        <header className="isees-entry__brand">

          <div className="isees-entry__system-label">

            Emergence Detection System

          </div>


          <h1

            id="isees-entry-title"

            className="isees-entry__title"

          >

            iSEES

          </h1>


          <p className="isees-entry__subtitle">

            Computational Research Environment

          </p>

        </header>


        {/* ====================================================
            GUEST
            ==================================================== */}

        <button

          type="button"

          className={
            "isees-entry__button " +
            "isees-entry__button--primary"
          }

          onClick={
            handleContinueAsGuest
          }

          title={
            "This is the real iSEES application — not a demo. " +
            "All research and computational tools are available. " +
            "Guest work is retained for the current session."
          }

        >

          Continue as Guest

        </button>


        <div className="isees-entry__guidance">

          <div className="isees-entry__guidance-title">

            Full iSEES application — not a demo.

          </div>


          <div className="isees-entry__guidance-detail">

            Work is retained for this browser session.

          </div>

        </div>


        {/* ====================================================
            DIVIDER
            ==================================================== */}

        <div

          className="isees-entry__divider"

          aria-hidden="true"

        />


        {/* ====================================================
            ACCOUNT
            ==================================================== */}

        <button

          type="button"

          className={
            "isees-entry__button " +
            "isees-entry__button--disabled"
          }

          disabled

          title={
            "Persistent accounts are being connected in the " +
            "next identity phase."
          }

        >

          Create Account

        </button>


        <div className="isees-entry__account-guidance">

          Save your workspace and return later.

        </div>


        {/* ====================================================
            LOGIN
            ==================================================== */}

        <button

          type="button"

          className="isees-entry__login"

          disabled

          title={
            "Account login is being connected in the next " +
            "identity phase."
          }

        >

          Log In

        </button>


        {/* ====================================================
            PERSISTENCE NOTICE
            ==================================================== */}

        <p className="isees-entry__persistence-notice">

          Accounts change how your work is saved,
          not what iSEES can do.

        </p>

      </section>

    </main>

  );

}