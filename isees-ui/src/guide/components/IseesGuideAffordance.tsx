import { GUIDE_PANEL_ID, useGuidePresentation } from "../presentation/GuidePresentationContext.tsx";

export default function IseesGuideAffordance() {
  const { registerAffordance, isOpen, openGuide, closeGuide } = useGuidePresentation();

  return (
    <button
      ref={registerAffordance}
      className="isees-guide-affordance"
      type="button"
      aria-label="Open iSEES Guide"
      aria-expanded={isOpen}
      aria-controls={GUIDE_PANEL_ID}
      onClick={isOpen ? closeGuide : openGuide}
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
