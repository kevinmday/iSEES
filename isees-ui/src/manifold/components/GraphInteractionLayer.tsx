// ============================================================
// src/manifold/components/GraphInteractionLayer.tsx
// P45B
// GRAPH INTERACTION LAYER
//
// Owns
// • Operator interaction
// • Pointer interpretation
// • Node interaction
// • Edge interaction
// • Click handling
// • Double-click handling
// • Future drag initiation
// • Future drop handling
// • Future lasso selection
// • Future keyboard interaction
//
// Does NOT own
// • Graph rendering
// • Graph computation
// • Graph layout
// • Viewport projection
// • Camera
// • Research Bridge persistence
//
// Purpose
//
// The Graph Interaction Layer provides the canonical location
// for deterministic operator interaction with the Investigation
// Manifold.
//
// Rendering components remain responsible only for presentation.
// Interaction behavior is progressively migrated here without
// changing visible behavior.
//
// ============================================================

export interface GraphInteractionLayerProps {

  children: React.ReactNode;

}

export default function GraphInteractionLayer({

  children,

}: GraphInteractionLayerProps) {

  return (

    <>

      {children}

    </>

  );

}