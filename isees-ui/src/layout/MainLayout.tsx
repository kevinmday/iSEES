// ============================================================
// src/layout/MainLayout.tsx — OPERATOR CONSOLE SHELL (V3)
// FULL DROP-IN REPLACEMENT
// ============================================================

export default function MainLayout({ left, center, right }: any) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "#060b14",
        color: "#f8fafc",
        overflow: "hidden",
        fontFamily: "Consolas, monospace"
      }}
    >
      {/* ===================================================== */}
      {/* TOP COMMAND BAR */}
      {/* ===================================================== */}
      <div
        style={{
          height: 42,
          minHeight: 42,
          borderBottom: "1px solid #182235",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 16,
          paddingRight: 16,
          flexShrink: 0
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14
          }}
        >
          <div
            style={{
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: 1
            }}
          >
            iSEES-UAP
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#94a3b8",
              letterSpacing: 1
            }}
          >
            Emergence Detection System
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 11,
            textTransform: "uppercase",
            color: "#9ca3af"
          }}
        >
          <span>
            STATUS:
            <span
              style={{
                color: "#4ade80",
                marginLeft: 6,
                fontWeight: 700
              }}
            >
              ACTIVE
            </span>
          </span>

          <span>MODE: LIVE ANALYSIS</span>

          <span>
            MANIFOLD:
            <span
              style={{
                color: "#38bdf8",
                marginLeft: 6
              }}
            >
              ONLINE
            </span>
          </span>
        </div>
      </div>

      {/* ===================================================== */}
      {/* PRIMARY SIGNAL STRIP */}
      {/* ===================================================== */}
      <div
        style={{
          height: 58,
          minHeight: 58,
          borderBottom: "1px solid #182235",
          background: "#08101d",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 18,
          paddingRight: 18,
          flexShrink: 0
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#4ade80",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase"
          }}
        >
          Primary Signal | Event Acquired & Confirmed
        </div>

        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 26,
            flexWrap: "wrap",
            fontSize: 12,
            color: "#d1d5db"
          }}
        >
          <span>EVENT: E-MEDFORD-001</span>
          <span>CONFIDENCE: 0.82</span>
          <span>CLUSTERS: 2</span>
          <span>REPORTS: 4</span>
          <span>STATUS: TRACKING</span>
          <span>RECURRENCE: LOW</span>
        </div>
      </div>

      {/* ===================================================== */}
      {/* MAIN OPERATOR BODY */}
      {/* ===================================================== */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden"
        }}
      >
        {/* ================================================= */}
        {/* LEFT PANEL — EVENT RADAR */}
        {/* ================================================= */}
        <div
          style={{
            width: 300,
            minWidth: 300,
            borderRight: "1px solid #182235",
            background: "#070d18",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #182235",
              background: "#0b1220",
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase"
              }}
            >
              Event Radar
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#94a3b8"
              }}
            >
              Live emergence monitoring
            </div>
          </div>

          {/* CONTENT */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10
            }}
          >
            {left}
          </div>
        </div>

        {/* ================================================= */}
        {/* CENTER PANEL — INVESTIGATION WORKSPACE */}
        {/* ================================================= */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: "#09111f",
            overflowY: "auto",
            overflowX: "hidden"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1600,
              margin: "0 auto",
              padding: 18
            }}
          >
            {/* CENTER HEADER */}
            <div
              style={{
                borderBottom: "1px solid #182235",
                paddingBottom: 12,
                marginBottom: 18
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase"
                }}
              >
                Investigation Workspace
              </div>

              <div
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: "#94a3b8"
                }}
              >
                Reconstructed event analysis and manifold reasoning
              </div>
            </div>

            {/* CENTER CONTENT */}
            <div>
              {center}
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* RIGHT PANEL — OPERATIONAL INTELLIGENCE */}
        {/* ================================================= */}
        <div
          style={{
            width: 360,
            minWidth: 360,
            borderLeft: "1px solid #182235",
            background: "#070d18",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #182235",
              background: "#0b1220",
              flexShrink: 0
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: "uppercase"
              }}
            >
              Operational Intelligence
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 11,
                color: "#94a3b8"
              }}
            >
              Context-aware investigation vectors
            </div>
          </div>

          {/* CONTENT */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 10
            }}
          >
            {right}
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* FOOTER STATUS STRIP */}
      {/* ===================================================== */}
      <div
        style={{
          height: 28,
          minHeight: 28,
          borderTop: "1px solid #182235",
          background: "#0b1220",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 14,
          paddingRight: 14,
          fontSize: 10,
          color: "#94a3b8",
          flexShrink: 0,
          letterSpacing: 0.5
        }}
      >
        <div>
          VERSION: v0.9-operator-shell
        </div>

        <div>
          SYSTEM STATE: LIVE
        </div>

        <div>
          EVENT MANIFOLD: SYNCHRONIZED
        </div>
      </div>
    </div>
  );
}