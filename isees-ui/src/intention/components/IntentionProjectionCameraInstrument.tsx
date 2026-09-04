export type IntentionProjectionCameraAction = "ZOOM_IN" | "ZOOM_OUT" | "PAN_UP" | "PAN_DOWN" | "PAN_LEFT" | "PAN_RIGHT" | "FIT" | "RESET";

export interface IntentionProjectionCameraInstrumentProps { readonly onAction: (action: IntentionProjectionCameraAction) => void; }

export default function IntentionProjectionCameraInstrument({ onAction }: IntentionProjectionCameraInstrumentProps) {
  const controls: readonly [IntentionProjectionCameraAction, string, string][] = [
    ["PAN_UP", "↑", "Pan up"], ["PAN_LEFT", "←", "Pan left"], ["FIT", "FIT", "Fit projection"], ["PAN_RIGHT", "→", "Pan right"],
    ["ZOOM_IN", "+", "Zoom in"], ["PAN_DOWN", "↓", "Pan down"], ["ZOOM_OUT", "−", "Zoom out"], ["RESET", "RST", "Reset camera"],
  ];
  return <div className="intention-camera" aria-label="Projection camera controls">
    {controls.map(([action, label, title]) => <button key={action} type="button" title={title} aria-label={title} onClick={() => onAction(action)}>{label}</button>)}
  </div>;
}
