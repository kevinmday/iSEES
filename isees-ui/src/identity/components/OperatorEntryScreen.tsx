import { useOperatorIdentityRuntime } from "../runtime/OperatorIdentityRuntimeContext";
import "./OperatorEntryScreen.css";

export function OperatorEntryScreen() {
  const { runtime } = useOperatorIdentityRuntime();

  function handleContinueAsGuest() {
    runtime.continueAsGuest();
  }

  return (
    <main className="isees-entry">
      <section className="isees-entry__panel" aria-labelledby="isees-entry-title">
        <header>
          <p className="isees-entry__product">iSEES-UAP</p>
          <p className="isees-entry__system-label">EMERGENCE DETECTION SYSTEM</p>
        </header>

        <div className="isees-entry__introduction">
          <h1 id="isees-entry-title" className="isees-entry__title">
            SEE THE RELATIONSHIPS OTHERS MISS.
          </h1>
          <p className="isees-entry__description">
            A deterministic UAP research environment for examining events,
            evidence, relationships, and emerging patterns.
          </p>
          <p className="isees-entry__capabilities">
            Connect canonical UAP events with source-grounded evidence through
            inspectable, reproducible, human-directed investigations.
          </p>
        </div>

        <div className="isees-entry__actions" aria-label="Application access">
          <div>
            <button type="button" className="isees-entry__button isees-entry__button--primary" onClick={handleContinueAsGuest} aria-describedby="isees-guest-detail">
              Continue as Guest
            </button>
            <p id="isees-guest-detail" className="isees-entry__access-copy">
              Enter the complete research application. Work is retained for the current browser session.
            </p>
          </div>

          <div className="isees-entry__account-actions">
            <div>
              <button type="button" className="isees-entry__button isees-entry__button--planned" disabled aria-describedby="isees-login-detail">
                Log In
              </button>
              <p id="isees-login-detail" className="isees-entry__planned-copy">
                <strong>Planned</strong>
                Future account access will support durable return to account-owned work.
              </p>
            </div>
            <div>
              <button type="button" className="isees-entry__button isees-entry__button--planned" disabled aria-describedby="isees-account-detail">
                Create Account
              </button>
              <p id="isees-account-detail" className="isees-entry__planned-copy">
                <strong>Planned</strong>
                Future accounts will provide durable ownership and synchronization.
              </p>
            </div>
          </div>
        </div>

        <p className="isees-entry__governing-copy">
          Guest and account users receive the same research capabilities; persistence and ownership are the distinction.
        </p>
      </section>
    </main>
  );
}
