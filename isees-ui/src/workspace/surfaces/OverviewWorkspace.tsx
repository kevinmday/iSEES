import { useNavigate } from "react-router-dom";
import { useGuidePresentation } from "../../guide/presentation/GuidePresentationContext";
import { useLibraryNavigation } from "./LibraryWorkspace";
import OverviewPresentation, { RESEARCH_STAGES } from "./overview/OverviewPresentation";
import "./OverviewWorkspace.css";

export { RESEARCH_STAGES };

export default function OverviewWorkspace() {
  const library = useLibraryNavigation();
  const guide = useGuidePresentation();
  const navigate = useNavigate();
  return <OverviewPresentation primaryActionLabel="ENTER LIBRARY" secondaryActionLabel="BRING YOUR OWN CASE" onPrimaryAction={() => library.enter(false)} onSecondaryAction={() => library.enter(true)} onLibraryAction={() => library.enter(false)} onGuidedOrientation={invoker => guide.openOrientation(invoker)} onSystemBriefing={() => navigate("/briefing")} />;
}
