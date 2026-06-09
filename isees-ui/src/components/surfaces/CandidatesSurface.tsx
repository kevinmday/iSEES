import SurfaceState from "../SurfaceState";

export default function CandidatesSurface() {
  return (
    <SurfaceState
      title="Candidate Surface"
      state="ACTIVE"
      density="MODERATE"
      topology="EVALUATING"
      pressure="RISING"
      integrity="VERIFIED"
      glyph="CANDIDATES"
      explanation={[
        "Candidate object evaluation active.",
        "Operational sensor alignment underway.",
        "Contradiction filtering currently propagating.",
      ]}
    />
  );
}