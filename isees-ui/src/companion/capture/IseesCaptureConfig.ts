import { resolveCaptureInstallConfiguration } from "./IseesCaptureUrl";

export const ISEES_CAPTURE_INSTALL = resolveCaptureInstallConfiguration(
  import.meta.env.VITE_ISEES_CAPTURE_EDGE_ADDONS_URL,
);
