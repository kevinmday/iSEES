import { Component, type ErrorInfo, type ReactNode } from "react";
import { operatorIdentityRuntime } from "../../identity/runtime/OperatorIdentityRuntime";
import { clearGuestWorkspaceSession } from "./GuestWorkspaceSessionPersistence";
import { guestWorkspaceSessionLifecycle } from "./GuestWorkspaceSessionLifecycle";

export class GuestWorkspaceRestorationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } { return { failed: true }; }
  componentDidCatch(_error: unknown, _info: ErrorInfo): void {
    console.warn("[iSEES guest restoration] REACT_BOUNDARY");
  }
  private returnToFrontDoor = (): void => {
    guestWorkspaceSessionLifecycle.stop();
    clearGuestWorkspaceSession();
    operatorIdentityRuntime.clearIdentity();
    window.location.reload();
  };
  render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return <main className="account-door"><section className="account-door__card"><p className="account-door__brand">iSEES</p><h1>We couldn’t restore this guest workspace.</h1><p>Your temporary workspace was not opened under a different guest. Return to the Front Door to continue with a clean guest session or sign in.</p><button className="account-door__primary" type="button" onClick={this.returnToFrontDoor}>Return to Front Door</button></section></main>;
  }
}
