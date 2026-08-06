// ============================================================
// src/session/services/OperatorInstrumentResolver.ts
// P54A
// OPERATOR INSTRUMENT RESOLVER
//
// Resolves contextual operator instruments from the active
// Operator Session.
//
// This service contains no UI.
//
// It performs no rendering.
//
// It performs no runtime ownership.
//
// It simply maps an Operator Session to the instruments
// required by that computational task.
//
// React never calls this directly.
//
// The Operator Session Runtime owns when this resolver is
// executed.
//
// ============================================================

import {

  OperatorSessionType,

} from "../runtime/OperatorSessionRuntimeTypes";

import type {

  OperatorInstrument,

} from "../runtime/OperatorSessionRuntimeTypes";

// ============================================================
// RESOLVER
// ============================================================

export class OperatorInstrumentResolver {

  // ==========================================================
  // LEFT
  // ==========================================================

  resolveLeft(

    session:
      OperatorSessionType,

  ): OperatorInstrument[] {

    switch (

      session

    ) {

      case OperatorSessionType.RESEARCH_REVIEW:

        return [

          {

            id:
              "candidateQueue",

            title:
              "Candidate Queue",

          },

        ];

      case OperatorSessionType.NORMAL:

      default:

        return [

          {

            id:
              "repositories",

            title:
              "Repositories",

          },

        ];

    }

  }

  // ==========================================================
  // RIGHT
  // ==========================================================

  resolveRight(

    session:
      OperatorSessionType,

  ): OperatorInstrument[] {

    switch (

      session

    ) {

      case OperatorSessionType.RESEARCH_REVIEW:

        return [

          {

            id:
              "promotionIntelligence",

            title:
              "Promotion Intelligence",

          },

        ];

      case OperatorSessionType.NORMAL:

      default:

        return [

          {

            id:
              "selectionIntelligence",

            title:
              "Selection Intelligence",

          },

        ];

    }

  }

  // ==========================================================
  // BOTH
  // ==========================================================

  resolve(

    session:
      OperatorSessionType,

  ): {

    left:
      OperatorInstrument[];

    right:
      OperatorInstrument[];

  } {

    return {

      left:

        this.resolveLeft(

          session,

        ),

      right:

        this.resolveRight(

          session,

        ),

    };

  }

}

// ============================================================
// SINGLETON
// ============================================================

export const operatorInstrumentResolver =

  new OperatorInstrumentResolver();