import { GUIDE_ORIENTATION_DIALOG_ID, GUIDE_PANEL_ID, useGuidePresentation } from "../presentation/GuidePresentationContext.tsx";
import "./IseesGuide.css";

export default function IseesGuideAffordance({ entryPoint = "contextual" }: { readonly entryPoint?: "contextual" | "orientation" }) {
  const { registerAffordance, isOpen, isOrientationOpen, openGuide, openOrientation, closeGuide } = useGuidePresentation();
  const expanded = entryPoint === "orientation" ? isOrientationOpen : isOpen;

  return (
    <button
      ref={registerAffordance}
      className="capture-global-link"
      type="button"
      aria-label={expanded ? "Close iSEES Guide" : "Open iSEES Guide"}
      aria-expanded={expanded}
      aria-controls={entryPoint === "orientation" ? GUIDE_ORIENTATION_DIALOG_ID : GUIDE_PANEL_ID}
      onClick={expanded ? closeGuide : event => entryPoint === "orientation" ? openOrientation(event.currentTarget) : openGuide()}
    >
      <svg className="isees-guide-affordance__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4.5h9.25A2.75 2.75 0 0 1 17 7.25V19H7.75A2.75 2.75 0 0 1 5 16.25Z" />
        <path d="M8.5 8h5M8.5 11.5h5M8.5 15h3" />
        <path d="m17 4 2 2-2 2" />
      </svg>
      <span className="isees-guide-affordance__label">Guide</span>
    </button>
  );
}
