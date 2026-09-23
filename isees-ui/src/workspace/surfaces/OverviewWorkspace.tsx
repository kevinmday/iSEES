import { Link } from "react-router-dom";
import { useGuidePresentation } from "../../guide/presentation/GuidePresentationContext";
import { useLibraryNavigation } from "./LibraryWorkspace";
import "./OverviewWorkspace.css";
import "./GuestWelcomeOverview.css";

export default function OverviewWorkspace() {
  const library = useLibraryNavigation(); const guide = useGuidePresentation();
  return <main className="overview-workspace"><section className="guest-welcome__hero" aria-labelledby="overview-title"><div className="guest-welcome__hero-copy"><p className="guest-welcome__eyebrow">iSEES · Integrated Systems Epistemology &amp; Evaluation System</p><h1 id="overview-title">Investigate the record. Preserve how you know.</h1><p className="guest-welcome__lead">A deterministic investigative research environment for tracing evidence, relationships, provenance, and the limits of what is known.</p><div className="guest-welcome__orientation"><div><p className="guest-welcome__eyebrow">Guided orientation</p><h2>Understand the research flow</h2><p>Learn how Library selection leads to deterministic relationship analysis in MANIFOLD and evidence work across the analytical modes.</p></div><div className="guest-welcome__orientation-actions"><button className="is-primary" type="button" onClick={event => guide.openOrientation(event.currentTarget)}>Start Guided Orientation</button><Link to="/briefing">System Briefing</Link></div></div><div className="guest-welcome__bring-case"><button type="button" onClick={() => library.enter(false)}>Enter Library</button><button type="button" onClick={() => library.enter(true)}>Bring Your Own Case</button></div><p>OVERVIEW is orientation only. Browsing, previews, intake, opening, and resumption are governed in LIBRARY.</p></div><div className="guest-welcome__hero-signal" aria-hidden="true"><span>iSEES</span><b>DETERMINISTIC<br />RESEARCH<br />ENVIRONMENT</b></div></section></main>;
}
