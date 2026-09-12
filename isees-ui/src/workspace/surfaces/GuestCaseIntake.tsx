import { useState } from "react";
import { StructuredObservationForm } from "../../nativeCaseDraft/StructuredObservationForm";
import "../../nativeCaseDraft/NativeCaseDraft.css";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, validateNativeCaseDraftForm, type NativeCaseDraftFieldName, type NativeCaseDraftFormState } from "../../nativeCaseDraft/NativeCaseDraftFieldState";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { submitGuestCase } from "../guestCase/GuestCaseIntake";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";

export default function GuestCaseIntake({ onCancel }: { readonly onCancel: () => void }) {
  const identity = useOperatorIdentity();
  const runtime = useWorkspaceRuntime();
  const [form, setForm] = useState<NativeCaseDraftFormState>(() => restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent()));
  const [validation, setValidation] = useState(() => validateNativeCaseDraftForm(form));
  const [workingTitleError, setWorkingTitleError] = useState<string | null>(null);
  const onFieldChange = (field: NativeCaseDraftFieldName, entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]) => {
    const next = Object.freeze({ ...form, [field]: entry }) as NativeCaseDraftFormState;
    setForm(next);
    if (field === "workingTitle") setWorkingTitleError(null);
  };
  const onSubmit = () => {
    const result = submitGuestCase(form, identity, runtime);
    if (result.status === "INVALID") {
      setValidation(result.validation);
      setWorkingTitleError(result.workingTitleError ?? null);
    }
  };
  return <section className="guest-welcome__intake" aria-labelledby="guest-case-title">
    <p className="guest-welcome__eyebrow">Bring Your Own Case / Guest Session</p>
    <h1 id="guest-case-title">Document your observation</h1>
    <p className="guest-welcome__lead">Create a structured candidate event, then compare it with System Canon.</p>
    <p className="guest-welcome__temporary-warning"><strong>This case remains only in the current browser session.</strong> It is not saved to an account or the server.</p>
    {workingTitleError && <p className="native-case-draft__validation-summary" role="alert">{workingTitleError}</p>}
    <StructuredObservationForm
      form={form}
      validation={validation}
      busy={false}
      onFieldChange={onFieldChange}
      onSubmit={onSubmit}
      submitLabel="Create Temporary Case"
      actions={<>
        <div className="guest-welcome__completion-copy">
          <h2>Ready to compare your case?</h2>
          <p>Create this temporary case and choose a System Canon event for comparison.</p>
          <p className="guest-welcome__completion-retention">Your case remains only in this browser session and is not saved to an account or the server.</p>
        </div>
        <button className="native-case-draft__button guest-welcome__completion-cancel" type="button" onClick={onCancel}>Cancel</button>
      </>}
    />
  </section>;
}
