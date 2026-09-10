import { Link } from "react-router-dom";
import captureIcon from "../../../isees-capture-extension/icons/isees-capture.svg";
import { ISEES_CAPTURE_INSTALL } from "./IseesCaptureConfig";
import { ISEES_CAPTURE_CONTENT } from "./IseesCaptureContent";
import "./IseesCapture.css";

export default function IseesCaptureInfo() {
  return (
    <main className="capture-info">
      <nav aria-label="Capture information"><Link to="/">← Back to iSEES</Link></nav>
      <header className="capture-info__hero">
        <img src={captureIcon} alt="iSEES Capture" />
        <div><span>iSEES companion tool · Microsoft Edge for Windows</span><h1>{ISEES_CAPTURE_CONTENT.headline}</h1><p>{ISEES_CAPTURE_CONTENT.explanation}</p><p>Microsoft Edge on Windows is the supported v1 path.</p></div>
      </header>

      <section aria-labelledby="capture-what"><h2 id="capture-what">What Capture preserves</h2><p>On an ordinary webpage outside iSEES, explicitly activate Capture after selecting a passage. It preserves the exact selected passage; source URL, title, language, and canonical URL; explicit rights and privacy classifications; and an integrity hash. Researcher notes remain separate from source text. The result is a local Source Capsule.</p><p>Provenance records where material came from and how it was handled. It supports later inspection without proving that a claim is true or that a source is authoritative.</p></section>

      <section aria-labelledby="capture-boundary"><h2 id="capture-boundary">Local, deliberate, and limited</h2><ul><li>Capture does not monitor browsing and does not inspect or capture without explicit activation.</li><li>Before inspecting a selected passage, it requests informed agreement. You can withdraw that agreement from Capture at any time.</li><li>Source Capsules remain local and are not automatically imported into iSEES.</li><li>A Source Capsule is not verified evidence, Candidate Knowledge, accepted knowledge, or System Canon.</li><li>Restricted <code>edge://</code> browser pages cannot be captured.</li></ul></section>

      <section aria-labelledby="capture-install"><h2 id="capture-install">Add Capture to Edge</h2><ol><li>Use the iSEES action below to open the verified Capture listing directly.</li><li>Review and approve the extension in Edge.</li><li>Open Capture and provide informed agreement before it inspects a selection.</li><li>Optionally pin the Capture icon from Edge’s Extensions menu for easy access.</li></ol><p>{ISEES_CAPTURE_CONTENT.approval}</p>{ISEES_CAPTURE_INSTALL.status === "READY" ? <a className="capture-info__primary" href={ISEES_CAPTURE_INSTALL.url} target="_blank" rel="noopener noreferrer">{ISEES_CAPTURE_CONTENT.action}</a> : <><button className="capture-info__primary" type="button" disabled aria-describedby="capture-info-pending">{ISEES_CAPTURE_CONTENT.action}</button><p className="capture-info__pending" id="capture-info-pending" role="status"><strong>Release pending.</strong> {ISEES_CAPTURE_CONTENT.pending}</p></>}</section>

      <section aria-labelledby="capture-after"><h2 id="capture-after">After installation</h2><p>Select exact language on an ordinary webpage, open Capture, inspect the selection, classify rights and privacy, add a separate researcher note if needed, and explicitly create the local Source Capsule. Bringing that capsule into iSEES remains a later, deliberate action; this experience does not perform an import.</p></section>
    </main>
  );
}
