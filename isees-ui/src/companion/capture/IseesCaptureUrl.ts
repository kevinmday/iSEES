const EDGE_ADDONS_HOST = "microsoftedge.microsoft.com";
const EDGE_LISTING_PATH = /^\/addons\/detail\/[^/]+\/[a-p]{32}\/?$/;

export type CaptureInstallConfiguration =
  | Readonly<{ status: "READY"; url: string }>
  | Readonly<{ status: "PENDING"; reason: "MISSING" | "INVALID" }>;

export function resolveCaptureInstallConfiguration(
  rawValue: string | undefined,
): CaptureInstallConfiguration {
  const value = rawValue?.trim();
  if (!value) return Object.freeze({ status: "PENDING", reason: "MISSING" });

  try {
    const url = new URL(value);
    const valid = url.protocol === "https:"
      && url.hostname === EDGE_ADDONS_HOST
      && url.port === ""
      && url.username === ""
      && url.password === ""
      && url.search === ""
      && url.hash === ""
      && EDGE_LISTING_PATH.test(url.pathname);
    return valid
      ? Object.freeze({ status: "READY", url: url.href })
      : Object.freeze({ status: "PENDING", reason: "INVALID" });
  } catch {
    return Object.freeze({ status: "PENDING", reason: "INVALID" });
  }
}
