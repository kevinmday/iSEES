export const ISEES_INTRODUCTION_ACKNOWLEDGEMENT_VERSION = "isees-introduction/v1" as const;
export const ISEES_INTRODUCTION_ACKNOWLEDGEMENT_KEY = "isees.onboarding.introduction.v1" as const;

export interface OnboardingAcknowledgementStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): OnboardingAcknowledgementStorage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function hasAcknowledgedIseesIntroduction(storage: OnboardingAcknowledgementStorage | undefined = browserStorage()): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(ISEES_INTRODUCTION_ACKNOWLEDGEMENT_KEY) === ISEES_INTRODUCTION_ACKNOWLEDGEMENT_VERSION;
  } catch {
    return false;
  }
}

export function acknowledgeIseesIntroduction(storage: OnboardingAcknowledgementStorage | undefined = browserStorage()): void {
  try {
    storage?.setItem(ISEES_INTRODUCTION_ACKNOWLEDGEMENT_KEY, ISEES_INTRODUCTION_ACKNOWLEDGEMENT_VERSION);
  } catch {
    // Explicit entry remains available when browser preference storage is unavailable.
  }
}
