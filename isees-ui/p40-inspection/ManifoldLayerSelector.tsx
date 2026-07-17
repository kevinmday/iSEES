import { useState } from "react";

export default function ManifoldLayerSelector() {
  const layers = [
    "Narrative",
    "Geo",
    "Temporal",
    "Infrastructure",
    "Historical",
    "Sensor",
    "Cultural",
    "Ontological",
    "Semantic Drift",
  ];

  const layerDescriptions: Record<string, string> = {
    Narrative:
      "Witness accounts, testimony, descriptions, and reported experiences.",

    Geo:
      "Location, terrain, proximity, spatial relationships, and geography.",

    Temporal:
      "Timing, duration, sequence, recurrence, and historical context.",

    Infrastructure:
      "Facilities, sensors, transportation corridors, military assets, and built systems.",

    Historical:
      "Comparison against prior events, historical analogs, and long-term patterns.",

    Sensor:
      "Radar, infrared, optical, electronic, and instrument-derived observations.",

    Cultural:
      "Social interpretation, folklore, media influence, and collective response.",

    Ontological:
      "Questions concerning the nature, classification, and existence of the phenomenon itself.",

    "Semantic Drift":
      "Changes in meaning, interpretation, terminology, and descriptive language over time.",
  };

  const [activeLayers, setActiveLayers] =
    useState<string[]>([
      "Narrative",
      "Geo",
      "Temporal",
      "Infrastructure",
    ]);

  const toggleLayer = (layer: string) => {
    setActiveLayers((current) =>
      current.includes(layer)
        ? current.filter((l) => l !== layer)
        : [...current, layer]
    );
  };

  return (
    <div
      style={{
        background: "#08101f",
        border: "1px solid #172033",
        borderRadius: 8,
        padding: 16,
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          color: "#d1d5db",
          marginBottom: 10,
        }}
      >
        Select Manifold Layers
      </div>

      <div
        style={{
          fontSize: 11,
          color: "#6b7280",
          marginBottom: 14,
        }}
      >
        Choose the manifold dimensions used to position this
        event within the corpus.
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {layers.map((layer) => (
          <div
            key={layer}
            title={layerDescriptions[layer]}
            onClick={() => toggleLayer(layer)}
            style={{
              padding: "8px 12px",

              border: activeLayers.includes(layer)
                ? "1px solid #60a5fa"
                : "1px solid #374151",

              borderRadius: 6,

              background: activeLayers.includes(layer)
                ? "#0b1730"
                : "#08101f",

              color: activeLayers.includes(layer)
                ? "#dbeafe"
                : "#9ca3af",

              fontSize: 11,

              fontWeight: 700,

              letterSpacing: 1,

              textTransform: "uppercase",

              cursor: "pointer",

              userSelect: "none",

              transition:
                "background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
            }}
          >
            {layer}
          </div>
        ))}
      </div>
    </div>
  );
}