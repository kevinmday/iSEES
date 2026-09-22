import { useEffect, useState } from "react";

import { resolveSystemCompatibility, type CompatibilityResult } from "./SystemCompatibility.ts";
import type { SystemIdentity } from "./SystemIdentity.ts";
import { loadSystemIdentity } from "./SystemIdentityClient.ts";

type IdentityState =
  | Readonly<{ status: "LOADING"; identity: null; compatibility: "UNKNOWN" }>
  | Readonly<{ status: "READY"; identity: SystemIdentity; compatibility: CompatibilityResult }>
  | Readonly<{ status: "UNAVAILABLE"; identity: null; compatibility: "UNKNOWN" }>;

let shellIdentityRequest: Promise<SystemIdentity> | undefined;

export function loadShellSystemIdentity(): Promise<SystemIdentity> {
  shellIdentityRequest ??= loadSystemIdentity();
  return shellIdentityRequest;
}

export function SystemIdentityFooterPresentation({ state }: Readonly<{ state: IdentityState }>) {
  const identity = state.identity;
  const shortRevision = identity?.sourceRevision?.slice(0, 7);

  return (
    <div
      className="system-identity-footer"
      data-compatibility={state.compatibility}
      aria-label={identity ? `${identity.productName} system identity` : "iSEES system identity"}
    >
      <span className="system-identity-footer__primary">
        {identity ? `${identity.productName} v${identity.version}` : "iSEES"}
      </span>
      {identity && <span aria-hidden="true"> · </span>}
      {identity && <span>{identity.releaseChannel}</span>}
      {identity && <span className="system-identity-footer__runtime" aria-hidden="true"> · {identity.runtimeEnvironment}</span>}
      {shortRevision && <span className="system-identity-footer__revision" aria-hidden="true"> · Source {shortRevision}</span>}
      {state.compatibility === "INCOMPATIBLE" && (
        <span className="system-identity-footer__warning" role="status">Compatibility warning</span>
      )}
    </div>
  );
}

export default function SystemIdentityFooter() {
  const [state, setState] = useState<IdentityState>({
    status: "LOADING",
    identity: null,
    compatibility: "UNKNOWN",
  });

  useEffect(() => {
    let current = true;
    void loadShellSystemIdentity().then(
      identity => {
        if (current) setState({ status: "READY", identity, compatibility: resolveSystemCompatibility(identity) });
      },
      () => {
        if (current) setState({ status: "UNAVAILABLE", identity: null, compatibility: "UNKNOWN" });
      },
    );
    return () => { current = false; };
  }, []);

  return <SystemIdentityFooterPresentation state={state} />;
}
