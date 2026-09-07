import { useId, useMemo, useState } from "react";
import { CanonicalLayerCatalog, CanonicalLayerOperationalStatus, CanonicalLayerProfileId } from "../catalog/index.ts";
import { clearCatalogFamily, layerCatalogTotals, normalizeOperationalSelection, operationalSelectableLayerIds, projectLayerCatalogFamilies, selectCatalogFamily } from "../presentation/LayerCatalogMatrixProjection.ts";

interface Props {
  readonly experimentReady: boolean;
  readonly inputRequiredReason?: string;
  readonly selectedIds: readonly string[];
  readonly baselineIds: readonly string[];
  readonly restoreProfile: (profileId: typeof CanonicalLayerProfileId.CANONICAL_BASELINE) => void;
  readonly onSelectionChange: (layerIds: readonly string[]) => void;
}

export default function LayerCatalogMatrix({ experimentReady, inputRequiredReason, selectedIds, baselineIds, restoreProfile, onSelectionChange }: Props) {
  const [filter, setFilter] = useState("");
  const searchId = useId();
  const selected = normalizeOperationalSelection(selectedIds);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const baselineSet = useMemo(() => new Set(baselineIds), [baselineIds]);
  const families = projectLayerCatalogFamilies(filter, selected);
  return <div className="layer-catalog">
    <header className="layer-catalog__header">
      <div><p className="layers-lab__eyebrow">LAYER CATALOG</p><h3>{layerCatalogTotals.total} investigation layers</h3></div>
      <dl className="layer-catalog__totals" aria-label="Catalog totals"><div><dt>Selected</dt><dd>{selected.length}</dd></div><div><dt>{experimentReady ? "Available" : "Input required"}</dt><dd>{layerCatalogTotals.operational}</dd></div><div><dt>Unavailable</dt><dd>{layerCatalogTotals.unavailable}</dd></div></dl>
    </header>
    <div className="layer-catalog__toolbar">
      <button type="button" disabled={!experimentReady} onClick={() => onSelectionChange(operationalSelectableLayerIds)}>Select all operational</button>
      <button type="button" onClick={() => onSelectionChange([])} disabled={selected.length === 0}>Clear all</button>
      <button type="button" disabled={!experimentReady} onClick={() => restoreProfile(CanonicalLayerProfileId.CANONICAL_BASELINE)}>Restore baseline</button>
      <label htmlFor={searchId}>Filter catalog<input id={searchId} type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="Label, ID, family, or description"/></label>
    </div>
    <div className="layer-catalog__families" aria-label="Layer catalog families">
      {families.length === 0 && <div className="layer-catalog__empty" role="status"><p>No investigation layers match the filter <strong>“{filter}”</strong>.</p><button type="button" onClick={() => setFilter("")}>Clear filter</button></div>}
      {families.map(group => <section className="layer-family" key={group.family.id} aria-labelledby={`layer-family-${group.family.id}`}>
        <header className="layer-family__header"><div><h4 id={`layer-family-${group.family.id}`}>{group.family.label}</h4><p>{group.family.description}</p><small>{group.members.length === CanonicalLayerCatalogFamilyTotal(group.family.id) ? `${group.members.length} members` : `${group.members.length} visible of ${CanonicalLayerCatalogFamilyTotal(group.family.id)}`} · {group.operationalCount} {experimentReady ? "available" : "input required"} · {group.selectedOperationalCount} selected</small></div><div>
          <button type="button" aria-label={`Select ${group.family.label} family`} disabled={!experimentReady || group.operationalCount === 0} onClick={() => onSelectionChange(selectCatalogFamily(selected, group.family.id))}>Select family</button>
          <button type="button" aria-label={`Clear ${group.family.label} family`} disabled={group.selectedOperationalCount === 0} onClick={() => onSelectionChange(clearCatalogFamily(selected, group.family.id))}>Clear family</button>
        </div></header>
        <div className="layer-family__grid">{group.members.map(layer => {
          const operational = layer.operationalStatus === CanonicalLayerOperationalStatus.OPERATIONAL && layer.researcherSelectable;
          const isSelected = selectedSet.has(layer.id);
          const baseline = baselineSet.has(layer.id);
          return operational && experimentReady ? <button type="button" key={layer.id} className="layer-cell layer-cell--operational" aria-pressed={isSelected} onClick={() => onSelectionChange(isSelected ? selected.filter(id => id !== layer.id) : normalizeOperationalSelection([...selected, layer.id]))}>
            <span className="layer-cell__title"><strong>{layer.label}</strong><em>{isSelected ? "SELECTED" : "AVAILABLE"}</em></span><code>{layer.id}</code><p>{layer.description}</p>{baseline && <small>CANONICAL BASELINE MEMBER</small>}
          </button> : operational ? <details className="layer-cell layer-cell--input-required" key={layer.id}>
            <summary><span className="layer-cell__title"><strong>{layer.label}</strong><em>INPUT REQUIRED</em></span><code>{layer.id}</code><p>{layer.description}</p>{baseline && <small>CANONICAL BASELINE MEMBER</small>}</summary>
            <div><p><strong>Evaluator:</strong> {layer.evaluatorKey}@{layer.evaluatorVersion}</p><p>{inputRequiredReason ?? "Resolve and comparison inputs are required before this evaluator can participate."}</p><p><strong>Required inputs:</strong> {layer.requiredCanonicalInputs.join(" · ")}</p></div>
          </details> : <details className="layer-cell layer-cell--unavailable" key={layer.id}>
            <summary><span className="layer-cell__title"><strong>{layer.label}</strong><em>UNAVAILABLE</em></span><code>{layer.id}</code><p>{layer.description}</p>{baseline && <small>CANONICAL BASELINE MEMBER · NOT COMPUTATIONALLY ACTIVE</small>}</summary>
            <div><p><strong>Availability:</strong> {layer.availability}</p><p>{layer.unavailableReason}</p><p><strong>Required missing inputs:</strong> {layer.requiredCanonicalInputs.join(" · ")}</p></div>
          </details>;
        })}</div>
      </section>)}
    </div>
  </div>;
}

function CanonicalLayerCatalogFamilyTotal(familyId: string): number { return CanonicalLayerCatalog.filter(layer => layer.familyId === familyId).length; }
