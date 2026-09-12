import type { FormEvent, ReactNode } from "react";
import type { NativeCaseDraftFieldName, NativeCaseDraftFormState, FieldValidationResult } from "./NativeCaseDraftFieldState.ts";
import type { FieldState } from "./NativeCaseDraftTypes.ts";

export interface StructuredObservationFormProps {
  readonly form: NativeCaseDraftFormState;
  readonly validation: readonly FieldValidationResult[];
  readonly busy: boolean;
  readonly onFieldChange: (field: NativeCaseDraftFieldName, entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]) => void;
  readonly onSubmit: () => void;
  readonly actions?: ReactNode;
  readonly submitLabel?: string;
}

type InputKind = "text" | "textarea" | "date" | "time" | "timezone" | "integer" | "duration" | "privacy";
type Definition = Readonly<{ field: NativeCaseDraftFieldName; label: string; kind: InputKind; section: string; options?: readonly Readonly<{ value: string; label: string }>[]; placeholder?: string }>;
const OPTIONS = {
  objectShape: [["sphere_orb", "Sphere / orb"], ["elongated", "Elongated / cylindrical"], ["triangular", "Triangular"], ["disc", "Disc"], ["irregular", "Irregular"]],
  movementBehavior: [["stationary", "Stationary"], ["linear", "Linear"], ["erratic", "Erratic"], ["hovering", "Hovering"], ["coordinated", "Coordinated"], ["instantaneous_acceleration", "Instantaneous acceleration"]],
  soundCharacteristics: [["silent", "Silent"], ["humming", "Humming"], ["mechanical", "Mechanical"], ["other", "Other"]],
  lightingVisibility: [["self_luminous", "Self-luminous"], ["reflective", "Reflective"], ["dark_object", "Dark object"], ["intermittent", "Intermittent flashing"]],
  observerContext: [["alone", "Alone"], ["multiple_observers", "Multiple observers"], ["moving_vehicle", "Moving vehicle"], ["stationary", "Stationary"], ["group_event", "Group observation"]],
} as const;
const choices = (pairs: readonly (readonly [string, string])[]) => pairs.map(([value, label]) => ({ value, label }));
const FIELDS: readonly Definition[] = [
  { field: "workingTitle", label: "Working title", kind: "text", section: "Observation", placeholder: "A concise working reference" },
  { field: "observationLocation", label: "Observation location", kind: "text", section: "Observation" },
  { field: "localObservationDate", label: "Local observation date", kind: "date", section: "Observation" },
  { field: "localObservationTime", label: "Local observation time", kind: "time", section: "Observation" },
  { field: "timezone", label: "Timezone", kind: "timezone", section: "Observation", placeholder: "e.g. America/Los_Angeles or +08:00" },
  { field: "observationNarrative", label: "Observer narrative (in their own words)", kind: "textarea", section: "Observation", placeholder: "Record the observer's account exactly, including paragraph breaks." },
  { field: "objectShape", label: "Object shape", kind: "text", section: "Observed characteristics", options: choices(OPTIONS.objectShape) },
  { field: "movementBehavior", label: "Movement behavior", kind: "text", section: "Observed characteristics", options: choices(OPTIONS.movementBehavior) },
  { field: "soundCharacteristics", label: "Sound characteristics", kind: "text", section: "Observed characteristics", options: choices(OPTIONS.soundCharacteristics) },
  { field: "lightingVisibility", label: "Lighting/visibility", kind: "text", section: "Observed characteristics", options: choices(OPTIONS.lightingVisibility) },
  { field: "observerContext", label: "Observer context", kind: "text", section: "Observed characteristics", options: choices(OPTIONS.observerContext) },
  { field: "witnessCount", label: "Witness count", kind: "integer", section: "Observed characteristics" },
  { field: "environmentalConditions", label: "Environmental conditions", kind: "textarea", section: "Observed characteristics" },
  { field: "approximateDuration", label: "Approximate duration in seconds", kind: "duration", section: "Observed characteristics" },
  { field: "researcherNotes", label: "Researcher notes", kind: "textarea", section: "Research record" },
  { field: "sourceProvenanceStatement", label: "Source/provenance statement", kind: "textarea", section: "Research record" },
  { field: "privacyClassification", label: "Privacy classification", kind: "privacy", section: "Research record" },
  { field: "rightsPublicationRestriction", label: "Rights/publication restrictions", kind: "textarea", section: "Research record" },
];

const idFor = (field: NativeCaseDraftFieldName) => `native-case-draft-${field}`;
// eslint-disable-next-line react-refresh/only-export-components -- established test-facing control identity helper
export const nativeCaseDraftFieldControlId = idFor;

export function StructuredObservationForm({ form, validation, busy, onFieldChange, onSubmit, actions, submitLabel = "Save Draft" }: StructuredObservationFormProps) {
  const errors = new Map(validation.filter(result => !result.valid).map(result => [result.field, result.message]));
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSubmit(); };
  return (
    <form className="native-case-draft__form" aria-busy={busy} onSubmit={submit} noValidate>
      {errors.size > 0 && <div className="native-case-draft__validation-summary" role="alert"><strong>Review the highlighted fields.</strong><span>The draft has {errors.size} invalid {errors.size === 1 ? "field" : "fields"}.</span></div>}
      {["Observation", "Observed characteristics", "Research record"].map(section => (
        <section className="native-case-draft__section" key={section} aria-labelledby={`native-case-draft-section-${section.replaceAll(" ", "-").toLowerCase()}`}>
          <h2 id={`native-case-draft-section-${section.replaceAll(" ", "-").toLowerCase()}`}>{section}</h2>
          <div className="native-case-draft__field-grid">
            {FIELDS.filter(definition => definition.section === section).map(definition => <TriStateField key={definition.field} definition={definition} entry={form[definition.field]} error={errors.get(definition.field) ?? null} busy={busy} onChange={entry => onFieldChange(definition.field, entry)} />)}
          </div>
        </section>
      ))}
      <div className="native-case-draft__actions">{actions}<button className="native-case-draft__button native-case-draft__button--primary" type="submit" disabled={busy}>{submitLabel}</button></div>
    </form>
  );
}

function TriStateField({ definition, entry, error, busy, onChange }: Readonly<{ definition: Definition; entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]; error: string | null; busy: boolean; onChange: (entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]) => void }>) {
  const id = idFor(definition.field), errorId = `${id}-error`, stateName = `${id}-state`;
  const isObserverNarrative = definition.field === "observationNarrative";
  const setState = (state: FieldState) => {
    onChange(state === "SUPPLIED" ? { state, value: entry.state === "SUPPLIED" ? entry.value : "" } : { state });
    if (state === "SUPPLIED") queueMicrotask(() => document.getElementById(id)?.focus());
  };
  const setValue = (raw: string) => onChange(isObserverNarrative && raw === "" ? { state: "OMITTED" } : { state: "SUPPLIED", value: definition.kind === "integer" || definition.kind === "duration" ? raw === "" ? "" : Number(raw) : raw });
  const describedBy = error ? errorId : undefined;
  return (
    <fieldset className={`native-case-draft__field native-case-draft__field--${definition.kind}${isObserverNarrative ? " native-case-draft__field--observer-narrative" : ""}`} data-invalid={error ? "true" : undefined}>
      <legend>{definition.label}</legend>
      <div className="native-case-draft__state-choices" aria-label={`${definition.label} answer state`}>
        {(["OMITTED", "UNKNOWN", "SUPPLIED"] as const).map(state => <label key={state}><input type="radio" name={stateName} value={state} checked={entry.state === state} disabled={busy} onChange={() => setState(state)} />{state === "OMITTED" ? "Not answered" : state === "UNKNOWN" ? "Unknown" : "Supply value"}</label>)}
      </div>
      {(entry.state === "SUPPLIED" || isObserverNarrative && entry.state === "OMITTED") && <ValueControl definition={definition} id={id} value={entry.state === "SUPPLIED" ? entry.value ?? "" : ""} busy={busy} invalid={Boolean(error)} describedBy={describedBy} onChange={setValue} />}
      {error && <p className="native-case-draft__field-error" id={errorId}>{error}</p>}
    </fieldset>
  );
}

function ValueControl({ definition, id, value, busy, invalid, describedBy, onChange }: Readonly<{ definition: Definition; id: string; value: string | number; busy: boolean; invalid: boolean; describedBy?: string; onChange: (value: string) => void }>) {
  const common = { id, disabled: busy, "aria-invalid": invalid, "aria-describedby": describedBy, value: String(value), onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange(event.target.value) };
  if (definition.options) return <><label className="native-case-draft__value-label" htmlFor={id}>{definition.label} value</label><select {...common}><option value="">Choose a supplied value</option>{definition.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></>;
  if (definition.kind === "privacy") return <><label className="native-case-draft__value-label" htmlFor={id}>{definition.label} value</label><select {...common}><option value="">Choose a classification</option><option value="PUBLIC">Public</option><option value="RESTRICTED">Restricted</option><option value="PRIVATE">Private</option></select></>;
  if (definition.kind === "textarea") return <><label className="native-case-draft__value-label" htmlFor={id}>{definition.field === "observationNarrative" ? "Free-form narrative" : `${definition.label} value`}</label><textarea {...common} rows={definition.field === "observationNarrative" ? 10 : 4} placeholder={definition.placeholder} /></>;
  const type = definition.kind === "date" ? "date" : definition.kind === "time" ? "time" : definition.kind === "integer" || definition.kind === "duration" ? "number" : "text";
  return <><label className="native-case-draft__value-label" htmlFor={id}>{definition.label} value</label><input {...common} type={type} min={type === "number" ? 0 : undefined} max={definition.kind === "integer" ? 1_000_000 : definition.kind === "duration" ? 31_536_000 : undefined} step={type === "number" ? 1 : undefined} placeholder={definition.placeholder} /></>;
}
