// ============================================================
// ActionExecutionPanel.tsx — ACTION → EXECUTION INTEL
// FULL DROP-IN REPLACEMENT
// ============================================================

type ActionType =
  | "REQUEST_TOWER_LOGS"
  | "CHECK_PILOT_COMMS"
  | "CONFIRM_RADAR_CORRELATION";

type Props = {
  action: {
    label: string;
    type: ActionType;
    target: string;
  };
};

export default function ActionExecutionPanel({ action }: Props) {

  // ------------------------------------------------------------
  // MOCK CONTACT / PROCEDURE LAYER (REPLACE WITH ENGINE LATER)
  // ------------------------------------------------------------
  const getExecutionData = () => {
    switch (action.type) {

      case "REQUEST_TOWER_LOGS":
        return {
          title: "Request Tower Logs",

          contact: {
            org: "Medford ATC Tower",
            phone: "(541) XXX-XXXX",
            freq: "118.3 MHz",
            role: "Tower Operations"
          },

          request: [
            "Time window: last 2–5 minutes",
            "Primary radar logs",
            "Controller observation notes",
            "Any irregular comms"
          ],

          context: [
            "Multiple observer reports",
            "Possible low-altitude anomaly",
            "No confirmed transponder"
          ],

          notes: [
            "Expect incomplete radar return",
            "Visual confirmation may be primary"
          ]
        };

      case "CHECK_PILOT_COMMS":
        return {
          title: "Check Pilot Communications",

          contact: {
            org: "Regional Air Traffic / FAA",
            phone: "(UNKNOWN)",
            freq: "Multiple",
            role: "Airspace Coordination"
          },

          request: [
            "Recent pilot reports",
            "Unusual comm chatter",
            "Deviation alerts"
          ],

          context: [
            "Potential pilot observation",
            "Cross-check with ATC logs"
          ],

          notes: [
            "May require FAA coordination",
            "Logs may be delayed"
          ]
        };

      case "CONFIRM_RADAR_CORRELATION":
        return {
          title: "Confirm Radar Correlation",

          contact: {
            org: "NOAA / NEXRAD Ops",
            phone: "(UNKNOWN)",
            freq: "N/A",
            role: "Radar Operations"
          },

          request: [
            "Radar return verification",
            "Velocity data",
            "Altitude bands"
          ],

          context: [
            "Validate non-visual detection",
            "Cross-source confirmation"
          ],

          notes: [
            "Low altitude targets may not appear",
            "Ground clutter possible"
          ]
        };

      default:
        return null;
    }
  };

  const data = getExecutionData();
  if (!data) return null;

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------
  return (
    <div
      style={{
        marginTop: 20,
        padding: 20,
        borderTop: "1px solid #1f2a44",
        fontFamily: "monospace"
      }}
    >
      <h3>{data.title}</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* CONTACT */}
        <div>
          <strong>Contact</strong>
          <div>{data.contact.org}</div>
          <div>Role: {data.contact.role}</div>
          <div>Phone: {data.contact.phone}</div>
          <div>Freq: {data.contact.freq}</div>
        </div>

        {/* REQUEST */}
        <div>
          <strong>Request</strong>
          {data.request.map((r, i) => (
            <div key={i}>• {r}</div>
          ))}
        </div>

        {/* CONTEXT */}
        <div>
          <strong>Context</strong>
          {data.context.map((c, i) => (
            <div key={i}>• {c}</div>
          ))}
        </div>

        {/* NOTES */}
        <div>
          <strong>Notes</strong>
          {data.notes.map((n, i) => (
            <div key={i}>• {n}</div>
          ))}
        </div>

      </div>
    </div>
  );
}