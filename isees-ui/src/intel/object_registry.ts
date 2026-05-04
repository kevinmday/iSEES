// ============================================================
// object_registry.ts — GLOBAL OBJECT DEFINITIONS (FRONTEND)
// ============================================================

export const objectRegistry: Record<string, any> = {
  ATC_TOWER: {
    type: "Air Traffic Control",
    capabilities: [
      "Visual aircraft tracking",
      "Pilot radio communications (VHF/UHF)",
      "Radar coordination with regional systems",
      "Airspace deconfliction"
    ],
    limitations: [
      "Requires transponder for full tracking",
      "Line-of-sight constraints (terrain masking)",
      "Weather impacts visual confirmation",
      "Human-dependent observation"
    ]
  },

  NEXRAD_RADAR: {
    type: "Doppler Weather Radar",
    capabilities: [
      "Wide-area radar coverage",
      "Velocity and movement detection",
      "All-weather operation",
      "High-altitude return detection"
    ],
    limitations: [
      "Low-altitude blind zones",
      "Not optimized for small aerial objects",
      "Ground clutter interference",
      "Resolution limits on fast-moving targets"
    ]
  },

  AIRPORT_OPS: {
    type: "Airport Operations",
    capabilities: [
      "Runway monitoring",
      "Incident coordination",
      "ATC communication support"
    ],
    limitations: [
      "No direct radar capability",
      "Limited airspace awareness"
    ]
  }
};