// ============================================================
// object_registry.ts — CANONICAL NODE INTELLIGENCE REGISTRY
// OPERATIONAL INFRASTRUCTURE DEFINITIONS (V2)
// ENRICHED OPERATIONAL INTELLIGENCE LAYER
// FULL DROP-IN REPLACEMENT
// ============================================================

export const objectRegistry: Record<string, any> = {

  // =========================================================
  // AIR TRAFFIC CONTROL
  // =========================================================

  ATC_TOWER: {

    type:
      "Air Traffic Control Tower",

    category:
      "AIRSPACE CONTROL",

    role:
      "Visual and procedural airspace management",

    // =======================================================
    // CONTACTS
    // =======================================================

    contacts: {

      facility_id:
        "KMFR ATCT",

      ops_phone:
        "(541) 776-7228",

      tower_frequency:
        "118.3 MHz",

      coordination_line:
        "FAA Regional Coordination",

      reporting_chain:
        "FAA -> Regional Operations",
    },

    // =======================================================
    // SENSOR STACK
    // =======================================================

    sensor_stack: [

      {
        name:
          "ASR-11",

        type:
          "Airport Surveillance Radar",

        range:
          "~60 NM",

        refresh_rate:
          "4.8 seconds",

        notes:
          "Primary terminal surveillance radar",
      },

      {
        name:
          "Mode-C SSR",

        type:
          "Secondary Surveillance Radar",

        range:
          "Regional",

        refresh_rate:
          "Interrogation-based",

        notes:
          "Requires transponder cooperation",
      },

      {
        name:
          "ADS-B",

        type:
          "Aircraft Position Broadcast",

        range:
          "Regional",

        refresh_rate:
          "Real-time",

        notes:
          "Dependent on cooperative targets",
      },
    ],

    // =======================================================
    // CAPABILITIES
    // =======================================================

    capabilities: [

      "Visual aircraft tracking",

      "Pilot radio communications (VHF/UHF)",

      "Radar coordination with regional systems",

      "Airspace deconfliction",

      "Runway traffic management",

      "Flight vector coordination",

      "ADS-B aircraft monitoring",

      "Transponder interrogation support",
    ],

    // =======================================================
    // LIMITATIONS
    // =======================================================

    limitations: [

      "Requires transponder for full tracking",

      "Line-of-sight constraints (terrain masking)",

      "Weather impacts visual confirmation",

      "Human-dependent observation",

      "Limited low-altitude terrain visibility",

      "Cannot classify unknown aerial phenomena",
    ],

    // =======================================================
    // BLIND SPOTS
    // =======================================================

    blind_spots: [

      "Non-transponder objects",

      "Low-altitude terrain shadow zones",

      "Hover ambiguity near clutter zones",

      "Visual saturation during severe weather",
    ],

    // =======================================================
    // INVESTIGATIVE VALUE
    // =======================================================

    investigative_value: [

      "Can confirm pilot interaction",

      "Can eliminate known commercial traffic",

      "Can validate vector continuity",

      "Can correlate visual observation timing",
    ],

    // =======================================================
    // OBSERVATION VECTORS
    // =======================================================

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

    operational_notes: [

      "Tower observations remain highly valuable during low-density traffic windows",

      "Human observation reliability increases during anomalous flight behavior",
    ],

    // =======================================================
    // RECORD RETENTION
    // =======================================================

    record_retention: [

      "Tower audio logs: ~45 days",

      "Radar coordination records: variable",

      "Incident reports: archival retention",
    ],

    confidence_weight:
      0.81,
  },

  // =========================================================
  // NEXRAD RADAR
  // =========================================================

  NEXRAD_RADAR: {

    type:
      "WSR-88D Doppler Weather Radar",

    category:
      "ATMOSPHERIC SENSOR",

    role:
      "Wide-area atmospheric and movement detection",

    contacts: {

      facility_id:
        "KMAX",

      ops_phone:
        "NOAA/NWS Regional Ops",

      tower_frequency:
        "N/A",

      coordination_line:
        "National Weather Service",

      reporting_chain:
        "NOAA -> NWS",
    },

    sensor_stack: [

      {
        name:
          "WSR-88D",

        type:
          "Doppler Weather Radar",

        range:
          "~230 km",

        refresh_rate:
          "~5 minutes",

        notes:
          "Weather optimized, not object optimized",
      },
    ],

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

    blind_spots: [

      "Objects below radar horizon",

      "Terrain-shadowed valleys",

      "Low-RCS aerial targets",
    ],

    investigative_value: [

      "Can detect persistent anomalous returns",

      "Can correlate atmospheric movement",

      "Can eliminate weather explanations",
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

    operational_notes: [

      "NEXRAD systems are optimized for atmospheric interpretation rather than object classification",

      "Persistent returns across multiple sweeps significantly increase relevance",
    ],

    record_retention: [

      "Radar sweeps: archival",

      "Velocity products: archival",

      "Weather products: persistent storage",
    ],

    confidence_weight:
      0.88,
  },

  // =========================================================
  // AIRPORT OPERATIONS
  // =========================================================

  AIRPORT_OPS: {

    type:
      "Airport Operations Center",

    category:
      "INFRASTRUCTURE OPERATIONS",

    role:
      "Operational coordination and airport situational awareness",

    contacts: {

      facility_id:
        "KMFR OPS",

      ops_phone:
        "(541) 776-7222",

      tower_frequency:
        "N/A",

      coordination_line:
        "Airport Operations Desk",

      reporting_chain:
        "Airport Authority",
    },

    sensor_stack: [

      {
        name:
          "Airport Camera Network",

        type:
          "Visual Monitoring",

        range:
          "Airport grounds",

        refresh_rate:
          "Continuous",

        notes:
          "Operational situational awareness",
      },
    ],

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

    blind_spots: [

      "High-altitude phenomena",

      "Terrain-obscured objects",

      "Beyond-airport-range events",
    ],

    investigative_value: [

      "Can validate ground disruption",

      "Can provide operational timelines",

      "Can correlate personnel observations",
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

    operational_notes: [

      "Airport operations often provide critical secondary confirmation pathways",

      "Ground-based observation timing is highly valuable during reconstruction",
    ],

    record_retention: [

      "Ops logs: variable retention",

      "Camera footage: limited rolling retention",
    ],

    confidence_weight:
      0.69,
  },

  // =========================================================
  // FAA RADAR
  // =========================================================

  FAA_RADAR: {

    type:
      "FAA Regional Radar",

    category:
      "AVIATION SENSOR",

    role:
      "Regional aviation surveillance and tracking",

    contacts: {

      facility_id:
        "FAA REGIONAL",

      ops_phone:
        "FAA Regional Operations",

      tower_frequency:
        "N/A",

      coordination_line:
        "FAA Coordination",

      reporting_chain:
        "FAA",
    },

    sensor_stack: [

      {
        name:
          "Regional SSR",

        type:
          "Secondary Surveillance Radar",

        range:
          "Regional",

        refresh_rate:
          "Interrogation cycle",

        notes:
          "Cooperative aviation tracking",
      },
    ],

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

    blind_spots: [

      "Non-cooperative targets",

      "Low-RCS objects",

      "Terrain shadow sectors",
    ],

    investigative_value: [

      "Can reconstruct flight timelines",

      "Can exclude known traffic",

      "Can correlate regional movement",
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

    operational_notes: [

      "FAA radar correlation remains one of the strongest aviation exclusion pathways",
    ],

    record_retention: [

      "Traffic logs: archival",

      "Track history: variable retention",
    ],

    confidence_weight:
      0.84,
  },

  // =========================================================
  // MILITARY SENSOR
  // =========================================================

  MILITARY_SENSOR: {

    type:
      "Military Sensor Platform",

    category:
      "DEFENSE SENSOR",

    role:
      "Advanced tactical sensing and tracking",

    contacts: {

      facility_id:
        "RESTRICTED",

      ops_phone:
        "RESTRICTED",

      tower_frequency:
        "RESTRICTED",

      coordination_line:
        "Military Coordination",

      reporting_chain:
        "Department of Defense",
    },

    sensor_stack: [

      {
        name:
          "Multi-Spectrum Tactical Radar",

        type:
          "Classified",

        range:
          "Unknown",

        refresh_rate:
          "Unknown",

        notes:
          "Capabilities partially classified",
      },
    ],

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

    blind_spots: [

      "Unknown due to classification",

      "Potential filtering bias",
    ],

    investigative_value: [

      "Can detect targets invisible to civilian systems",

      "Can correlate multi-spectrum activity",
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

    operational_notes: [

      "Military sensing platforms may observe targets invisible to civilian infrastructure",
    ],

    record_retention: [

      "Unknown / classified",
    ],

    confidence_weight:
      0.93,
  },
};