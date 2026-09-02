import type { LayersExperimentalPairProjection } from "../projection";
import { useLayersPresentationSelection } from "./LayersPresentationSelection";

const percent = (value?: number) => value === undefined ? "UNAVAILABLE" : `${(value * 100).toFixed(1)}%`;

export default function LayersWireManifoldChamber({ projection, caseA, caseB }: { projection: LayersExperimentalPairProjection; caseA: string; caseB: string }) {
  const { selection, select } = useLayersPresentationSelection();
  const baseline = projection.baseline.relationship;
  const experiment = projection.experimental.relationship;
  return <section className="layers-lab__chamber" aria-labelledby="layers-chamber-title">
    <div className="layers-lab__section-heading"><span>03</span><h2 id="layers-chamber-title">Wire manifold chamber</h2><strong>{projection.delta.state}</strong></div>
    <div className="layers-lab__inspection-hooks">
      <button type="button" aria-pressed={selection.kind === "CASE_A"} onClick={() => select({kind:"CASE_A"})}>Inspect Case A</button>
      <button type="button" aria-pressed={selection.kind === "BASELINE_RELATIONSHIP"} onClick={() => select({kind:"BASELINE_RELATIONSHIP"})}>Inspect baseline wire</button>
      <button type="button" aria-pressed={selection.kind === "EXPERIMENTAL_RELATIONSHIP"} onClick={() => select({kind:"EXPERIMENTAL_RELATIONSHIP"})}>Inspect experimental wire</button>
      <button type="button" aria-pressed={selection.kind === "CASE_B"} onClick={() => select({kind:"CASE_B"})}>Inspect Case B</button>
    </div>
    <svg className="layers-wire" viewBox="0 0 900 300" role="img" aria-labelledby="wire-title wire-description">
      <title id="wire-title">Concurrent baseline and experimental relationship wires</title>
      <desc id="wire-description">Case A and Case B connected by separate reference and experimental wires. Delta state {projection.delta.state}.</desc>
      <defs><pattern id="layers-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" /></pattern></defs>
      <rect width="900" height="300" className="layers-wire__field"/><rect width="900" height="300" fill="url(#layers-grid)" className="layers-wire__grid"/>
      <g className="layers-wire__node"><circle cx="145" cy="150" r="58"/><circle cx="145" cy="150" r="44"/><text x="145" y="142">CASE A</text><text x="145" y="165">{caseA}</text></g>
      <g className="layers-wire__node"><circle cx="755" cy="150" r="58"/><circle cx="755" cy="150" r="44"/><text x="755" y="142">CASE B</text><text x="755" y="165">{caseB}</text></g>
      {baseline.availability === "AVAILABLE" ? <path className="layers-wire__baseline" d="M203 132 C360 82 540 82 697 132"/> : <path className="layers-wire__unavailable" d="M203 132 H697"/>}
      {experiment.availability === "AVAILABLE" ? <path className="layers-wire__experiment" d="M203 168 C360 218 540 218 697 168"/> : <path className="layers-wire__unavailable" d="M203 168 H697"/>}
      <text x="450" y="70" className="layers-wire__label">BASELINE · {percent(baseline.availability === "AVAILABLE" ? baseline.score : undefined)}</text>
      <text x="450" y="245" className="layers-wire__label layers-wire__label--experiment">EXPERIMENT · {percent(experiment.availability === "AVAILABLE" ? experiment.score : undefined)}</text>
      <text x="450" y="154" className="layers-wire__delta">{projection.delta.state} {projection.delta.scoreDelta === undefined ? "" : `${projection.delta.scoreDelta >= 0 ? "+" : ""}${(projection.delta.scoreDelta * 100).toFixed(1)} pp`}</text>
    </svg>
    <div className="layers-lab__wire-key"><span>━━━━ Baseline reference</span><span>═◆═ Experimental test</span><span>┄┄ UNAVAILABLE (not zero)</span></div>
  </section>;
}
