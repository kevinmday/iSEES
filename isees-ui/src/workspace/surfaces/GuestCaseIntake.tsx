import { useState } from "react";
import { StructuredObservationForm, nativeCaseDraftFieldControlId } from "../../nativeCaseDraft/StructuredObservationForm";
import "../../nativeCaseDraft/NativeCaseDraft.css";
import { createBlankNativeCaseDraftContent, restoreNativeCaseDraftContent, validateNativeCaseDraftForm, type NativeCaseDraftFieldName, type NativeCaseDraftFormState } from "../../nativeCaseDraft/NativeCaseDraftFieldState";
import { useOperatorIdentity } from "../../identity/runtime/OperatorIdentityRuntimeContext";
import { GUEST_WORKING_TITLE_REQUIRED_MESSAGE, submitGuestCase } from "../guestCase/GuestCaseIntake";
import { useWorkspaceRuntime } from "../runtime/WorkspaceRuntimeContext";
import { useKnowledgeObjects } from "../../knowledge/runtime/KnowledgeObjectRuntimeContext";

export default function GuestCaseIntake({ onCancel }: { readonly onCancel: () => void }) {
  const identity = useOperatorIdentity();
  const runtime = useWorkspaceRuntime();
  const knowledgeObjects = useKnowledgeObjects();
  const [form, setForm] = useState<NativeCaseDraftFormState>(() => restoreNativeCaseDraftContent(createBlankNativeCaseDraftContent()));
  const [validation, setValidation] = useState(() => validateNativeCaseDraftForm(form));
  const [completionError, setCompletionError] = useState<string | null>(null);
  const onFieldChange = (field: NativeCaseDraftFieldName, entry: NativeCaseDraftFormState[NativeCaseDraftFieldName]) => {
    const next = Object.freeze({ ...form, [field]: entry }) as NativeCaseDraftFormState;
    setForm(next);
    setCompletionError(null);
  };
  const revealInvalidField = (field: NativeCaseDraftFieldName) => queueMicrotask(() => {
    const id = nativeCaseDraftFieldControlId(field);
    const region = document.getElementById(`${id}-field`);
    region?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    const control = document.getElementById(id) ?? document.getElementById(`${id}-state-SUPPLIED`) ?? region?.querySelector<HTMLElement>("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)");
    control?.focus();
  });
  const onSubmit = () => {
    const result = submitGuestCase(form, identity, runtime, knowledgeObjects);
    if (result.status === "INVALID") {
      setValidation(result.validation);
      const firstInvalid = result.workingTitleError ? "workingTitle" : result.validation.find(item => !item.valid)?.field;
      setCompletionError(result.workingTitleError
        ? GUEST_WORKING_TITLE_REQUIRED_MESSAGE
        : firstInvalid ? `Please correct ${result.validation.find(item => item.field === firstInvalid)?.message ?? "the first invalid field"}.` : "Please review the supplied case fields.");
      if (firstInvalid) revealInvalidField(firstInvalid);
    }
  };
  return <section className="guest-welcome__intake" aria-labelledby="guest-case-title">
    <p className="guest-welcome__eyebrow">Bring Your Own Case / Guest Session</p>
    <h1 id="guest-case-title">Document your observation</h1>
    <p className="guest-welcome__lead">Create a structured candidate event, then compare it with System Canon.</p>
    <p className="guest-welcome__temporary-warning"><strong>This case remains only in the current browser session.</strong> It is not saved to an account or the server.</p>
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
          {completionError && <p className="native-case-draft__validation-summary" role="alert" aria-live="assertive">{completionError}</p>}
        </div>
        <button className="native-case-draft__button guest-welcome__completion-cancel" type="button" onClick={onCancel}>Cancel</button>
      </>}
    />
  </section>;
}
