// ============================================================
// OverviewWorkspace.tsx
// P37A
// OVERVIEW WORKSPACE
//
// Production Investigation Dashboard
//
// Presentation-only workspace.
//
// Runtime ownership remains external.
//
// Canon v1
//
// When an investigation is active, the investigation
// becomes the workspace identity.
//
// FULL DROP-IN REPLACEMENT
// ============================================================

import "./OverviewWorkspace.css";

export default function OverviewWorkspace() {

  return (

    <div className="overview-workspace">

      <div className="overview-dashboard">

        {/* ================================================= */}
        {/* ACTIVE INVESTIGATION */}
        {/* ================================================= */}

        <section className="investigation-summary">

          <div className="summary-label">

            Active Investigation

          </div>

          <h2 className="summary-title">

            Nimitz Investigation

          </h2>

          <div className="summary-subtitle">

            Comparative Investigation • System Canon

          </div>

          <div className="summary-subject">

            Primary Subject&nbsp;&nbsp;E-TICTAC-2004

          </div>

          <div className="summary-location">

            Pacific Ocean, California

          </div>

        </section>

        {/* ================================================= */}
        {/* OPERATIONAL METRICS */}
        {/* ================================================= */}

        <section className="investigation-metrics">

          <div className="metric-card">

            <div className="metric-label">

              Confidence

            </div>

            <div className="metric-value">

              0.96

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-label">

              Reports

            </div>

            <div className="metric-value">

              4

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-label">

              Evidence Items

            </div>

            <div className="metric-value">

              1,842

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-label">

              Clusters

            </div>

            <div className="metric-value">

              1

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-label">

              Recurrence

            </div>

            <div className="metric-value">

              Moderate

            </div>

          </div>

          <div className="metric-card">

            <div className="metric-label">

              Trend

            </div>

            <div className="metric-value">

              Rising

            </div>

          </div>

        </section>

      </div>

    </div>

  );

}