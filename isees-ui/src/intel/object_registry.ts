// ============================================================
// object_registry.ts — CANONICAL NODE INTELLIGENCE REGISTRY
// OPERATIONAL INFRASTRUCTURE DEFINITIONS
// FULL DROP-IN REPLACEMENT
// ============================================================

export const objectRegistry: Record<string, any> = {
  // =========================================================
  // AIR TRAFFIC CONTROL
  // =========================================================

  ATC_TOWER: {
    type: "Air Traffic Control Tower",

    category: "AIRSPACE CONTROL",

    role:
      "Visual and procedural airspace management",

    capabilities: [
      "Visual aircraft tracking",
      "Pilot radio communications (VHF/UHF)",
      "Radar coordination with regional systems",
      "Airspace deconfliction",
      "Runway traffic management",
      "Flight vector coordination",
    ],

    limitations: [
      "Requires transponder for full tracking",
      "Line-of-sight constraints (terrain masking)",
      "Weather impacts visual confirmation",
      "Human-dependent observation",
      "Limited low-altitude terrain visibility",
    ],

    observation_vectors: [
      "Visual anomaly confirmation",
      "Pilot traffic reports",
      "Unexpected airspace deviations",
      "Flight vector anomalies",
    ],

    contradiction_vectors: [
      "No corresponding flight traffic",
      "No transponder response",
      "Visual confirmation without radar correlation",
    ],

    collapse_failure_modes: [
      "Target lacks transponder",
      "Object outside radar coverage",
      "Visual-only confirmation",
    ],

    geo_constraints: [
      "Terrain masking",
      "Mountain obstruction",
      "Limited horizon geometry",
    ],

    recommended_actions: [
      "Pull ATC audio logs",
      "Review radar coordination timeline",
      "Cross-check pilot reports",
      "Review tower visual logs",
    ],

    operational_notes: [
      "Tower observations remain highly valuable during low-density traffic windows",
      "Human observation reliability increases during anomalous flight behavior",
    ],

    confidence_weight: 0.81,
  },

  // =========================================================
  // NEXRAD RADAR
  // =========================================================

  NEXRAD_RADAR: {
    type: "WSR-88D Doppler Weather Radar",

    category: "ATMOSPHERIC SENSOR",

    role:
      "Wide-area atmospheric and movement detection",

    capabilities: [
      "Wide-area radar coverage",
      "Velocity and movement detection",
      "All-weather operation",
      "High-altitude return detection",
      "Storm penetration analysis",
      "Atmospheric motion discrimination",
    ],

    limitations: [
      "Low-altitude blind zones",
      "Ground clutter interference",
      "Not optimized for small aerial objects",
      "Resolution limits on fast-moving targets",
      "Terrain interference",
    ],

    observation_vectors: [
      "Unexpected atmospheric returns",
      "Velocity discontinuities",
      "Persistent anomalous returns",
      "Non-weather movement signatures",
    ],

    contradiction_vectors: [
      "Visual observation without radar return",
      "Radar return without visual confirmation",
      "Velocity mismatch",
    ],

    collapse_failure_modes: [
      "Object below radar horizon",
      "Terrain masking",
      "Target cross-section insufficient",
      "Non-atmospheric motion behavior",
    ],

    geo_constraints: [
      "Radar horizon geometry",
      "Mountain shielding",
      "Ground clutter sectors",
    ],

    recommended_actions: [
      "Pull radar sweep archive",
      "Review velocity products",
      "Cross-check atmospheric anomalies",
      "Review time-synchronized radar frames",
    ],

    operational_notes: [
      "NEXRAD systems are optimized for atmospheric interpretation rather than object classification",
      "Persistent returns across multiple sweeps significantly increase relevance",
    ],

    confidence_weight: 0.88,
  },

  // =========================================================
  // AIRPORT OPERATIONS
  // =========================================================

  AIRPORT_OPS: {
    type: "Airport Operations Center",

    category: "INFRASTRUCTURE OPERATIONS",

    role:
      "Operational coordination and airport situational awareness",

    capabilities: [
      "Runway monitoring",
      "Incident coordination",
      "ATC communication support",
      "Ground operations coordination",
      "Airport camera access",
      "Operational reporting",
    ],

    limitations: [
      "No direct radar capability",
      "Limited airspace awareness",
      "Dependent on external sensor systems",
    ],

    observation_vectors: [
      "Ground personnel reports",
      "Camera system anomalies",
      "Operational disruptions",
      "Unexpected runway activity",
    ],

    contradiction_vectors: [
      "Operational activity without sensor confirmation",
      "Visual anomalies absent from airport logs",
    ],

    collapse_failure_modes: [
      "No direct sensing systems",
      "Observation dependent on personnel",
      "Limited elevated visibility",
    ],

    geo_constraints: [
      "Runway-centered perspective",
      "Local infrastructure obstruction",
    ],

    recommended_actions: [
      "Review airport camera systems",
      "Pull operations logs",
      "Review incident communications",
      "Cross-check maintenance activity",
    ],

    operational_notes: [
      "Airport operations often provide critical secondary confirmation pathways",
      "Ground-based observation timing is highly valuable during reconstruction",
    ],

    confidence_weight: 0.69,
  },

  // =========================================================
  // FAA RADAR
  // =========================================================

  FAA_RADAR: {
    type: "FAA Regional Radar",

    category: "AVIATION SENSOR",

    role:
      "Regional aviation surveillance and tracking",

    capabilities: [
      "Aircraft tracking",
      "Transponder interrogation",
      "Regional flight coordination",
      "Persistent traffic surveillance",
    ],

    limitations: [
      "Dependent on cooperative targets",
      "Terrain masking",
      "Low-altitude visibility gaps",
    ],

    observation_vectors: [
      "Traffic anomalies",
      "Unidentified track movement",
      "Flight corridor deviations",
    ],

    contradiction_vectors: [
      "Visual target without FAA track",
      "Track persistence inconsistency",
    ],

    collapse_failure_modes: [
      "Non-cooperative target",
      "Transponder absence",
      "Coverage gap",
    ],

    geo_constraints: [
      "Regional sector boundaries",
      "Terrain interference",
    ],

    recommended_actions: [
      "Pull FAA track history",
      "Cross-reference ADS-B records",
      "Review regional traffic logs",
    ],

    operational_notes: [
      "FAA radar correlation remains one of the strongest aviation exclusion pathways",
    ],

    confidence_weight: 0.84,
  },

  // =========================================================
  // MILITARY SENSOR
  // =========================================================

  MILITARY_SENSOR: {
    type: "Military Sensor Platform",

    category: "DEFENSE SENSOR",

    role:
      "Advanced tactical sensing and tracking",

    capabilities: [
      "High-speed target tracking",
      "Multi-spectrum sensing",
      "Advanced radar discrimination",
      "Persistent tactical surveillance",
    ],

    limitations: [
      "Classified operational limits",
      "Restricted access",
      "Unknown sensor filtering",
    ],

    observation_vectors: [
      "Multi-spectrum anomalies",
      "Persistent track continuity",
      "Unidentified tactical movement",
    ],

    contradiction_vectors: [
      "Sensor confirmation absent from civilian systems",
      "Advanced tracking without identification",
    ],

    collapse_failure_modes: [
      "Classification restrictions",
      "Sensor filtering",
      "Unknown target profile",
    ],

    geo_constraints: [
      "Operational sector restrictions",
      "Military airspace limitations",
    ],

    recommended_actions: [
      "Request military coordination",
      "Review tactical airspace overlap",
      "Cross-check restricted flight activity",
    ],

    operational_notes: [
      "Military sensing platforms may observe targets invisible to civilian infrastructure",
    ],

    confidence_weight: 0.93,
  },
};