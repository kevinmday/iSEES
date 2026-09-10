import IseesGuideAffordance from "./IseesGuideAffordance.tsx";
import OperationalGuideContextAdapter from "../context/OperationalGuideContextAdapter.tsx";
import { GuidePresentationProvider } from "../presentation/GuidePresentationContext.tsx";
import "./IseesGuide.css";

export default function IseesGuideHost() {
  return (
    <GuidePresentationProvider>
      <IseesGuideAffordance />
      <OperationalGuideContextAdapter />
    </GuidePresentationProvider>
  );
}
