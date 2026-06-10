// ============================================================
// CANONICAL CORPUS REGISTRY
// ============================================================

import type {
  CanonicalMetadata,
} from "./canonicalMetadata";

export const CANONICAL_REGISTRY:
  CanonicalMetadata[] = [

  // ----------------------------------------------------------
  // TIER 1
  // MULTI-SENSOR MILITARY CANON
  // ----------------------------------------------------------

  {
    event_id: "E-TICTAC-2004",
    event_name: "Nimitz Tic Tac Encounter",
    tier: 1,
    classification: "multi_sensor_naval_event",
    year: 2004,
    location: "Pacific Ocean",
    observability_profile: "multi_sensor",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-ROOSEVELT-2015",
    event_name: "Roosevelt Carrier Group Encounters",
    tier: 1,
    classification: "multi_sensor_naval_event",
    year: 2015,
    location: "US East Coast",
    observability_profile: "multi_sensor",
    canonical_status: "ACTIVE",
  },

  // ----------------------------------------------------------
  // TIER 2
  // MILITARY HISTORICAL CANON
  // ----------------------------------------------------------

  {
    event_id: "E-RENDLESHAM-1980",
    event_name: "Rendlesham Forest Incident",
    tier: 2,
    classification: "military_historical_case",
    year: 1980,
    location: "United Kingdom",
    observability_profile: "military_witness",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-BELGIAN-1989",
    event_name: "Belgian Wave",
    tier: 2,
    classification: "military_historical_case",
    year: 1989,
    location: "Belgium",
    observability_profile: "radar_visual",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-WASHINGTON-1952",
    event_name: "Washington National Sightings",
    tier: 2,
    classification: "military_historical_case",
    year: 1952,
    location: "Washington DC",
    observability_profile: "radar_visual",
    canonical_status: "ACTIVE",
  },

  // ----------------------------------------------------------
  // TIER 3
  // MASS WITNESS CANON
  // ----------------------------------------------------------

  {
    event_id: "E-PHOENIX-1997",
    event_name: "Phoenix Lights",
    tier: 3,
    classification: "mass_witness_event",
    year: 1997,
    location: "Arizona",
    observability_profile: "mass_visual",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-WESTALL-1966",
    event_name: "Westall School Incident",
    tier: 3,
    classification: "mass_witness_event",
    year: 1966,
    location: "Australia",
    observability_profile: "mass_visual",
    canonical_status: "ACTIVE",
  },

  // ----------------------------------------------------------
  // TIER 4
  // HISTORICAL NARRATIVE CANON
  // ----------------------------------------------------------

  {
    event_id: "E-FATIMA-1917",
    event_name: "Fatima Apparitions",
    tier: 4,
    classification: "historical_narrative",
    year: 1917,
    location: "Portugal",
    observability_profile: "historical_mass_witness",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-NUREMBERG-1561",
    event_name: "Nuremberg Celestial Phenomenon",
    tier: 4,
    classification: "historical_narrative",
    year: 1561,
    location: "Germany",
    observability_profile: "historical_narrative",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-BASEL-1566",
    event_name: "Basel Celestial Phenomenon",
    tier: 4,
    classification: "historical_narrative",
    year: 1566,
    location: "Switzerland",
    observability_profile: "historical_narrative",
    canonical_status: "ACTIVE",
  },

  {
    event_id: "E-AIRSHIP-1897",
    event_name: "American Airship Wave",
    tier: 4,
    classification: "historical_narrative",
    year: 1897,
    location: "United States",
    observability_profile: "historical_narrative",
    canonical_status: "ACTIVE",
  },

  // ----------------------------------------------------------
  // TIER 5
  // ANCIENT NARRATIVE CANON
  // ----------------------------------------------------------

  {
    event_id: "E-EZEKIEL",
    event_name: "Ezekiel Vision",
    tier: 5,
    classification: "ancient_narrative",
    year: -593,
    location: "Babylon",
    observability_profile: "ancient_textual",
    canonical_status: "ACTIVE",
  },

];