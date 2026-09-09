import { exportSourceCapsule } from "../../src/intake/capture/SourceCapsuleExport.ts";
import type { PrivacyClassification, RightsClassification } from "../../src/intake/capture/SourceCapsuleV1.ts";
import type { SourceCapsuleExportRequest } from "../../src/intake/capture/SourceCapsuleExportTypes.ts";
import { readAgreement, saveAgreement, withdrawAgreement } from "./consent.ts";
import { extractActiveSelection, type CapturePreview } from "./extraction.ts";

const required = <T extends HTMLElement>(id: string): T => { const value = document.getElementById(id); if (!value) throw new Error(`Missing interface element: ${id}`); return value as T; };
const consentView = required<HTMLElement>("consent-view");
const captureView = required<HTMLElement>("capture-view");
const agreementCheck = required<HTMLInputElement>("agreement-check");
const agreeButton = required<HTMLButtonElement>("agree-button");
const inspectButton = required<HTMLButtonElement>("inspect-button");
const confirmationForm = required<HTMLFormElement>("confirmation-form");
const captureCheck = required<HTMLInputElement>("capture-check");
const createButton = required<HTMLButtonElement>("create-button");
const status = required<HTMLElement>("status");
const receipt = required<HTMLElement>("receipt");
let preview: CapturePreview | undefined;
let frozenAttempt: Readonly<SourceCapsuleExportRequest> | undefined;

function showAgreed(agreed: boolean): void {
  consentView.hidden = agreed; captureView.hidden = !agreed;
  if (!agreed) { preview = undefined; frozenAttempt = undefined; confirmationForm.hidden = true; receipt.hidden = true; agreementCheck.checked = false; agreeButton.disabled = true; }
}
function announce(message: string, error = false): void { status.textContent = message; status.classList.toggle("error", error); }
function addMetadata(label: string, value: string): void {
  const term = document.createElement("dt"); term.textContent = label;
  const detail = document.createElement("dd"); detail.textContent = value;
  required<HTMLElement>("metadata").append(term, detail);
}
function uuid(prefix: string): string { return `${prefix}:${crypto.randomUUID()}`; }
function boundedIdentity(value: string): string {
  let result = "web:";
  for (const character of value) { if (new TextEncoder().encode(result + character).byteLength > 1024) break; result += character; }
  return result;
}

agreementCheck.addEventListener("change", () => { agreeButton.disabled = !agreementCheck.checked; });
agreeButton.addEventListener("click", async () => { if (!agreementCheck.checked) return; await saveAgreement(); showAgreed(true); announce("Agreement saved locally. Capture is enabled only for explicit actions."); inspectButton.focus(); });
required<HTMLButtonElement>("withdraw-button").addEventListener("click", async () => { await withdrawAgreement(); showAgreed(false); announce("Agreement withdrawn. Capture is disabled and the local agreement record was cleared."); agreementCheck.focus(); });

inspectButton.addEventListener("click", async () => {
  preview = undefined; frozenAttempt = undefined; confirmationForm.hidden = true; receipt.hidden = true; announce("Inspecting the current selection…");
  try {
    if (!await readAgreement()) { showAgreed(false); throw new Error("A current agreement is required before inspection."); }
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active webpage is available.");
    const [injection] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: extractActiveSelection });
    if (!injection?.result) throw new Error("The page did not return a selection.");
    preview = injection.result;
    const metadata = required<HTMLElement>("metadata"); metadata.replaceChildren();
    const labels: Array<[string, string | undefined]> = [["Final URL", preview.finalUrl], ["Title", preview.pageTitle], ["Publisher/site", preview.publisher], ["Author/byline", preview.authorByline], ["Published", preview.publishedAt], ["Modified", preview.modifiedAt], ["Language", preview.language], ["Canonical URL", preview.canonicalUrl], ["Governing heading", preview.governingHeading]];
    labels.forEach(([label, value]) => { if (value) addMetadata(label, value); });
    required<HTMLTextAreaElement>("passage").value = preview.exactText;
    required<HTMLTextAreaElement>("researcher-note").value = ""; captureCheck.checked = false; createButton.disabled = true;
    confirmationForm.hidden = false; announce("Review the exact passage and source information, then confirm creation."); required<HTMLTextAreaElement>("passage").focus();
  } catch (error) { announce(error instanceof Error && error.message === "EMPTY_SELECTION" ? "Select a non-empty passage on the current webpage, then try again." : error instanceof Error ? error.message : "Inspection failed.", true); }
});

captureCheck.addEventListener("change", () => { createButton.disabled = !captureCheck.checked; });
confirmationForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!preview || !captureCheck.checked) { announce("Inspect and explicitly confirm this capture first.", true); return; }
  createButton.disabled = true; inspectButton.disabled = true; announce("Creating and validating the local Source Capsule…");
  try {
    if (!await readAgreement()) { showAgreed(false); throw new Error("Agreement was withdrawn or changed. Renew agreement before capture."); }
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) throw new Error("The preview is no longer valid. Inspect the selection again.");
    const [current] = await chrome.scripting.executeScript({ target: { tabId: activeTab.id }, func: extractActiveSelection });
    if (!current?.result || current.result.exactText !== preview.exactText || current.result.finalUrl !== preview.finalUrl) {
      preview = undefined; frozenAttempt = undefined; confirmationForm.hidden = true;
      throw new Error("The page or selection changed. Inspect the current selection again.");
    }
    if (!frozenAttempt) {
      const passageId = uuid("passage"); const now = new Date().toISOString();
      const source: SourceCapsuleExportRequest["source"] = { identity: boundedIdentity(preview.canonicalUrl ?? preview.finalUrl), finalUrl: preview.finalUrl };
      const mappings: Array<[keyof CapturePreview, keyof typeof source]> = [["canonicalUrl", "canonicalUrl"], ["pageTitle", "pageTitle"], ["publisher", "publisher"], ["authorByline", "authorByline"], ["publishedAt", "publishedAt"], ["modifiedAt", "modifiedAt"], ["language", "language"]];
      for (const [from, to] of mappings) { const value = preview[from]; if (typeof value === "string") (source as unknown as Record<string, string>)[to] = value; }
      const note = required<HTMLTextAreaElement>("researcher-note").value.trim();
      if (new TextEncoder().encode(note).byteLength > 32_768) throw new Error("The researcher note exceeds the 32 KB Source Capsule limit.");
      frozenAttempt = Object.freeze({
        confirmed: true, capsuleId: uuid("capsule"), capturedAt: now, source,
        rightsClassification: required<HTMLSelectElement>("rights").value as RightsClassification,
        privacyClassification: required<HTMLSelectElement>("privacy").value as PrivacyClassification,
        passages: [{ passageId, exactText: preview.exactText, ...(preview.governingHeading ? { governingHeading: preview.governingHeading } : {}), ...(preview.prefixContext ? { prefixContext: preview.prefixContext } : {}), ...(preview.suffixContext ? { suffixContext: preview.suffixContext } : {}), ...(preview.selectionDirection ? { selection: { direction: preview.selectionDirection } } : {}) }],
        researcherNotes: note ? [{ noteId: uuid("note"), researcherId: "researcher:unattributed-local-capture", createdAt: now, text: note, derivedFromPassageIds: [passageId] }] : [],
      });
    }
    const artifact = await exportSourceCapsule(frozenAttempt);
    const exportedBytes = artifact.utf8Bytes();
    const exactBuffer = exportedBytes.buffer.slice(exportedBytes.byteOffset, exportedBytes.byteOffset + exportedBytes.byteLength) as ArrayBuffer;
    const blobUrl = URL.createObjectURL(new Blob([exactBuffer], { type: artifact.mediaType }));
    try { await chrome.downloads.download({ url: blobUrl, filename: artifact.filename, saveAs: false, conflictAction: "uniquify" }); }
    finally { URL.revokeObjectURL(blobUrl); }
    const details = required<HTMLElement>("receipt-details"); details.replaceChildren();
    [["Filename", artifact.filename], ["Bytes", String(artifact.byteLength)], ["Capsule hash", artifact.capsuleHash]].forEach(([label, value]) => { const dt = document.createElement("dt"); dt.textContent = label; const dd = document.createElement("dd"); dd.textContent = value; details.append(dt, dd); });
    receipt.hidden = false; confirmationForm.hidden = true; announce("Source Capsule saved locally. It has not been imported into iSEES."); receipt.focus();
  } catch (error) { announce(error instanceof Error ? `Could not create the Source Capsule: ${error.message}` : "Could not create the Source Capsule.", true); createButton.disabled = false; }
  finally { inspectButton.disabled = false; }
});

void readAgreement().then(record => { showAgreed(Boolean(record)); if (record) inspectButton.focus(); else agreementCheck.focus(); }).catch(() => { showAgreed(false); announce("Local agreement storage is unavailable. Capture remains disabled.", true); });
