// ============================================================
// intel_engine.ts — CONTEXT-AWARE INTEL BUILDER
// ============================================================

import { objectRegistry } from "./object_registry";

export function buildContextualIntel(
  objectKey: string,
  eventType: string,
  clusterSize: number
) {
  const base = objectRegistry[objectKey];
  if (!base) return null;

  let role = "";
  let confidence = "";
  let priority = "NORMAL";

  // ------------------------------------------------------------
  // CONTEXT LOGIC
  // ------------------------------------------------------------

  if (eventType === "VISUAL_ONLY") {
    role = "Primary validation source (no sensor confirmation)";
    confidence = "LOW — requires independent confirmation";
    priority = "HIGH";
  }

  if (eventType === "SENSOR_ONLY") {
    role = "Sensor anomaly — requires visual confirmation";
    confidence = "MEDIUM — single modality";
    priority = "HIGH";
  }

  if (eventType === "MULTI_SOURCE") {
    role = "Cross-confirmation node";
    confidence =
      clusterSize > 2
        ? "HIGH — converging reports"
        : "MEDIUM — early convergence";
    priority = "CRITICAL";
  }

  if (eventType === "LOW_CONFIDENCE") {
    role = "Unverified signal";
    confidence = "LOW — insufficient data";
    priority = "LOW";
  }

  // ------------------------------------------------------------
  // OUTPUT
  // ------------------------------------------------------------

  return {
    name: objectKey,
    type: base.type,
    role,
    confidence,
    priority,
    capabilities: base.capabilities,
    limitations: base.limitations,
    actions: base.capabilities.slice(0, 2) // simple default
  };
}