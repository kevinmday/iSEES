export type LocatedGuideTarget = Readonly<{ status: "LOCATED"; element: HTMLElement }>;
export type MissingGuideTarget = Readonly<{ status: "MISSING"; message: string }>;

export function locateGuideTarget(targetId: string): LocatedGuideTarget | MissingGuideTarget {
  const matches = [...document.querySelectorAll<HTMLElement>("[data-guide-id]")].filter(element => element.dataset.guideId === targetId);
  if (matches.length !== 1) return { status: "MISSING", message: "The requested control is not currently available. Follow the textual guidance instead." };
  const element = matches[0];
  const style = window.getComputedStyle(element);
  if (!element || element.hidden || style.display === "none" || style.visibility === "hidden" || element.getClientRects().length === 0) return { status: "MISSING", message: "The requested control is not currently visible. Follow the textual guidance instead." };
  return { status: "LOCATED", element };
}
