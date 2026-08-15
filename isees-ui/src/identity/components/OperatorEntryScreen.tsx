// ============================================================
// src/identity/components/OperatorEntryScreen.tsx
// P56D-I1
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
// ============================================================

import {

  useOperatorIdentityRuntime,

} from "../runtime/OperatorIdentityRuntimeContext";


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

    <main

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
          "#d7e2ec",

        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

      }}

    >

      <section

        aria-labelledby="isees-entry-title"

        style={{

          width:
            "min(460px, calc(100vw - 48px))",

          display:
            "flex",

          flexDirection:
            "column",

          alignItems:
            "stretch",

          gap:
            "18px",

        }}

      >

        {/* ====================================================
            BRAND
            ==================================================== */}

        <header

          style={{

            textAlign:
              "center",

            marginBottom:
              "10px",

          }}

        >

          <div

            style={{

              fontSize:
                "12px",

              letterSpacing:
                "0.22em",

              textTransform:
                "uppercase",

              color:
                "#6f8799",

              marginBottom:
                "12px",

            }}

          >

            Emergence Detection System

          </div>


          <h1

            id="isees-entry-title"

            style={{

              margin:
                0,

              fontSize:
                "42px",

              lineHeight:
                1,

              letterSpacing:
                "0.08em",

              fontWeight:
                700,

              color:
                "#e6edf3",

            }}

          >

            iSEES

          </h1>


          <p

            style={{

              margin:
                "14px 0 0",

              fontSize:
                "14px",

              lineHeight:
                1.5,

              color:
                "#8ea2b3",

            }}

          >

            Computational Research Environment

          </p>

        </header>


        {/* ====================================================
            GUEST
            ==================================================== */}

        <button

          type="button"

          onClick={
            handleContinueAsGuest
          }

          title={
            "This is the real iSEES application — not a demo. " +
            "All research and computational tools are available. " +
            "Guest work is retained for the current session."
          }

          style={{

            width:
              "100%",

            padding:
              "14px 18px",

            border:
              "1px solid #5b7285",

            borderRadius:
              "4px",

            background:
              "#15212b",

            color:
              "#e6edf3",

            fontSize:
              "14px",

            fontWeight:
              600,

            letterSpacing:
              "0.02em",

            cursor:
              "pointer",

          }}

        >

          Continue as Guest

        </button>


        <div

          style={{

            textAlign:
              "center",

            marginTop:
              "-8px",

          }}

        >

          <div

            style={{

              fontSize:
                "12px",

              fontWeight:
                600,

              color:
                "#a9bac7",

            }}

          >

            Full iSEES application — not a demo.

          </div>


          <div

            style={{

              marginTop:
                "4px",

              fontSize:
                "11px",

              lineHeight:
                1.45,

              color:
                "#687d8d",

            }}

          >

            Work is retained for this browser session.

          </div>

        </div>


        {/* ====================================================
            DIVIDER
            ==================================================== */}

        <div

          aria-hidden="true"

          style={{

            height:
              "1px",

            background:
              "#1c2933",

            margin:
              "6px 0",

          }}

        />


        {/* ====================================================
            ACCOUNT
            ==================================================== */}

        <button

          type="button"

          disabled

          title={
            "Persistent accounts are being connected in the next identity phase."
          }

          style={{

            width:
              "100%",

            padding:
              "13px 18px",

            border:
              "1px solid #273844",

            borderRadius:
              "4px",

            background:
              "#0d141a",

            color:
              "#617481",

            fontSize:
              "14px",

            fontWeight:
              600,

            cursor:
              "not-allowed",

            opacity:
              0.8,

          }}

        >

          Create Account

        </button>


        <div

          style={{

            textAlign:
              "center",

            marginTop:
              "-8px",

            fontSize:
              "11px",

            lineHeight:
              1.45,

            color:
              "#617481",

          }}

        >

          Save your workspace and return later.

        </div>


        {/* ====================================================
            LOGIN
            ==================================================== */}

        <button

          type="button"

          disabled

          title={
            "Account login is being connected in the next identity phase."
          }

          style={{

            alignSelf:
              "center",

            border:
              0,

            background:
              "transparent",

            color:
              "#617481",

            fontSize:
              "12px",

            textDecoration:
              "underline",

            textUnderlineOffset:
              "3px",

            cursor:
              "not-allowed",

            padding:
              "4px 8px",

          }}

        >

          Log In

        </button>


        {/* ====================================================
            PERSISTENCE NOTICE
            ==================================================== */}

        <p

          style={{

            margin:
              "8px 0 0",

            textAlign:
              "center",

            fontSize:
              "10px",

            lineHeight:
              1.5,

            color:
              "#50616d",

          }}

        >

          Accounts change how your work is saved,
          not what iSEES can do.

        </p>

      </section>

    </main>

  );

}