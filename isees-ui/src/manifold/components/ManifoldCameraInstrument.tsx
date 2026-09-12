// ============================================================
// src/manifold/components/ManifoldCameraInstrument.tsx
// P45A
// MANIFOLD CAMERA INSTRUMENT
//
// Floating operator instrument for controlling the visible
// projection of the Investigation Manifold.
//
// This instrument expresses operator camera intent only.
//
// It does NOT:
// • Modify deterministic graph coordinates
// • Own topology layout
// • Own investigation state
// • Perform Resolve–Dissolve computation
//
// Camera operations are projected upward through callbacks.
//
// Ownership:
//
// Operator
//      ↓
// Manifold Camera Instrument
//      ↓
// Investigation Viewport / Projection
//      ↓
// SVG ViewBox
//
// ============================================================

// ============================================================
// TYPES
// ============================================================

import ManifoldInstrumentPalette
from "./ManifoldInstrumentPalette";

export type ManifoldCameraAction =
  | "ZOOM_IN"
  | "ZOOM_OUT"
  | "PAN_UP"
  | "PAN_DOWN"
  | "PAN_LEFT"
  | "PAN_RIGHT"
  | "CENTER";

interface ManifoldCameraInstrumentProps {

  onAction: (
    action: ManifoldCameraAction
  ) => void;
}

// ============================================================
// ACTION BUTTON
// ============================================================

function CameraButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {

  return (

    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        width: 34,
        height: 34,

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        border:
          "1px solid rgba(148,163,184,0.18)",

        borderRadius: 6,

        background:
          "rgba(15,23,42,0.94)",

        color: "#e2e8f0",

        fontSize: 16,
        fontWeight: 700,

        lineHeight: 1,

        cursor: "pointer",

        pointerEvents: "auto",
      }}
    >
      {label}
    </button>

  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function ManifoldCameraInstrument({
  onAction,
}: ManifoldCameraInstrumentProps) {

  return (

    <ManifoldInstrumentPalette
      instrumentId="camera"
      title="Camera"
      defaultPosition={{
        x: 166,
        y: 12,
      }}
    >

      <div
        style={{
          display: "grid",

          gridTemplateColumns:
            "repeat(3, 34px)",

          gridTemplateRows:
            "repeat(3, 34px)",

          justifyContent: "center",

          gap: 5,
        }}
      >

        <span aria-hidden="true" />

        <CameraButton
          label={"\u2191"}
          title="Pan up"
          onClick={
            () =>
              onAction(
                "PAN_UP"
              )
          }
        />

        <span aria-hidden="true" />

        <CameraButton
          label={"\u2190"}
          title="Pan left"
          onClick={
            () =>
              onAction(
                "PAN_LEFT"
              )
          }
        />

        <CameraButton
          label={"\u2022"}
          title="Center manifold"
          onClick={
            () =>
              onAction(
                "CENTER"
              )
          }
        />

        <CameraButton
          label={"\u2192"}
          title="Pan right"
          onClick={
            () =>
              onAction(
                "PAN_RIGHT"
              )
          }
        />

        <CameraButton
          label="+"
          title="Zoom in"
          onClick={
            () =>
              onAction(
                "ZOOM_IN"
              )
          }
        />

        <CameraButton
          label={"\u2193"}
          title="Pan down"
          onClick={
            () =>
              onAction(
                "PAN_DOWN"
              )
          }
        />

        <CameraButton
          label={"\u2212"}
          title="Zoom out"
          onClick={
            () =>
              onAction(
                "ZOOM_OUT"
              )
          }
        />

      </div>

    </ManifoldInstrumentPalette>

  );
}
