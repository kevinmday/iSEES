import { useEffect } from "react";
import { locateGuideTarget } from "../presentation/GuideTargetLocator.ts";

export default function GuideSpotlight({ targetId, onMissing, onRemoved }: { readonly targetId: string; readonly onMissing: (message: string) => void; readonly onRemoved: () => void }) {
  useEffect(() => {
    const result = locateGuideTarget(targetId);
    if (result.status === "MISSING") { onMissing(result.message); return; }
    const target = result.element;
    target.dataset.guideSpotlight = "true";
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "nearest", inline: "nearest" });
    const observer = new MutationObserver(() => { if (!target.isConnected) onRemoved(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); delete target.dataset.guideSpotlight; };
  }, [onMissing, onRemoved, targetId]);
  return <div className="isees-guide-spotlight-note" role="status">The recommended control is highlighted. Guide has not activated it.</div>;
}
