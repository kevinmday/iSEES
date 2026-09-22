import IseesGuideAffordance from "./IseesGuideAffordance.tsx";
import OperationalGuideContextAdapter from "../context/OperationalGuideContextAdapter.tsx";
import "./IseesGuide.css";

export default function IseesGuideHost() {
  return (
    <>
      <IseesGuideAffordance />
      <OperationalGuideContextAdapter />
    </>
  );
}
