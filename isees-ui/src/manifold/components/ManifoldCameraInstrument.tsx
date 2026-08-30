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

    <div
      style={{
        position: "absolute",

        top: 16,
        left: 166,

        zIndex: 100,

        display: "flex",
        flexDirection: "column",

        gap: 5,

        padding: 6,

        border:
          "1px solid rgba(148,163,184,0.18)",

        borderRadius: 9,

        background:
          "rgba(2,6,23,0.82)",

        boxShadow:
          "0 12px 30px rgba(0,0,0,0.38)",

        pointerEvents: "auto",
      }}
    >

      {/* ===================================================== */}
      {/* ZOOM IN                                               */}
      {/* ===================================================== */}

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

      {/* ===================================================== */}
      {/* PAN UP                                                */}
      {/* ===================================================== */}

      <CameraButton
        label="↑"
        title="Pan up"
        onClick={
          () =>
            onAction(
              "PAN_UP"
            )
        }
      />

      {/* ===================================================== */}
      {/* PAN LEFT                                              */}
      {/* ===================================================== */}

      <CameraButton
        label="←"
        title="Pan left"
        onClick={
          () =>
            onAction(
              "PAN_LEFT"
            )
        }
      />

      {/* ===================================================== */}
      {/* CENTER                                                */}
      {/* ===================================================== */}

      <CameraButton
        label="•"
        title="Center manifold"
        onClick={
          () =>
            onAction(
              "CENTER"
            )
        }
      />

      {/* ===================================================== */}
      {/* PAN RIGHT                                             */}
      {/* ===================================================== */}

      <CameraButton
        label="→"
        title="Pan right"
        onClick={
          () =>
            onAction(
              "PAN_RIGHT"
            )
        }
      />

      {/* ===================================================== */}
      {/* PAN DOWN                                              */}
      {/* ===================================================== */}

      <CameraButton
        label="↓"
        title="Pan down"
        onClick={
          () =>
            onAction(
              "PAN_DOWN"
            )
        }
      />

      {/* ===================================================== */}
      {/* ZOOM OUT                                              */}
      {/* ===================================================== */}

      <CameraButton
        label="−"
        title="Zoom out"
        onClick={
          () =>
            onAction(
              "ZOOM_OUT"
            )
        }
      />

    </div>

  );
}