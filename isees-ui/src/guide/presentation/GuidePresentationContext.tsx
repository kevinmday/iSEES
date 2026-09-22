/* eslint-disable react-refresh/only-export-components -- I2 keeps its provider, hook, and presentation constants in the single authorized context file. */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const GUIDE_PANEL_ID = "isees-guide-panel" as const;
export const GUIDE_PANEL_HEADING_ID = "isees-guide-panel-heading" as const;

export const GuideShellPresentation = {
  CLOSED: "CLOSED",
  OPEN: "OPEN",
  ORIENTATION: "ORIENTATION",
} as const;

export type GuideShellPresentation =
  typeof GuideShellPresentation[keyof typeof GuideShellPresentation];

interface GuidePresentationValue {
  readonly presentation: GuideShellPresentation;
  readonly isOpen: boolean;
  readonly isOrientationOpen: boolean;
  readonly registerAffordance: (element: HTMLButtonElement | null) => void;
  readonly openGuide: () => void;
  readonly openOrientation: (returnFocusTo?: HTMLElement | null) => void;
  readonly closeGuide: () => void;
}

const GuidePresentationContext = createContext<GuidePresentationValue | undefined>(undefined);

export function GuidePresentationProvider({ children }: { readonly children: ReactNode }) {
  const [presentation, setPresentation] = useState<GuideShellPresentation>(GuideShellPresentation.CLOSED);
  const [affordanceElement, registerAffordance] = useState<HTMLButtonElement | null>(null);
  const [orientationReturnFocus, setOrientationReturnFocus] = useState<HTMLElement | null>(null);

  const openGuide = useCallback(() => {
    setPresentation(GuideShellPresentation.OPEN);
  }, []);

  const openOrientation = useCallback((returnFocusTo?: HTMLElement | null) => {
    setOrientationReturnFocus(returnFocusTo ?? document.activeElement as HTMLElement | null);
    setPresentation(GuideShellPresentation.ORIENTATION);
  }, []);

  const closeGuide = useCallback(() => {
    setPresentation(GuideShellPresentation.CLOSED);
    if (presentation === GuideShellPresentation.ORIENTATION) window.setTimeout(() => orientationReturnFocus?.focus(), 0);
    else affordanceElement?.focus();
  }, [affordanceElement, orientationReturnFocus, presentation]);

  const value = useMemo<GuidePresentationValue>(() => Object.freeze({
    presentation,
    isOpen: presentation === GuideShellPresentation.OPEN,
    isOrientationOpen: presentation === GuideShellPresentation.ORIENTATION,
    registerAffordance,
    openGuide,
    openOrientation,
    closeGuide,
  }), [closeGuide, openGuide, openOrientation, presentation, registerAffordance]);

  return (
    <GuidePresentationContext.Provider value={value}>
      {children}
    </GuidePresentationContext.Provider>
  );
}

export function useGuidePresentation(): GuidePresentationValue {
  const value = useContext(GuidePresentationContext);
  if (!value) throw new Error("useGuidePresentation must be used inside GuidePresentationProvider.");
  return value;
}
