export const RESET_PATH = "/reset-password";

const RESET_CAPABILITY_FRAGMENT = /^#token=([A-Za-z0-9_-]{43})$/;

export function captureResetCapability(
  location: Pick<Location, "pathname" | "hash">,
  scrub: () => void,
): string | null {
  if (location.pathname !== RESET_PATH) return null;
  const fragment = location.hash;
  const match = RESET_CAPABILITY_FRAGMENT.exec(fragment);
  scrub();
  return match ? match[1] : null;
}
