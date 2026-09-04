import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const shell = read("src/author/components/StudioShell.tsx"); const panel = read("src/studio/components/StudioDraftingPanel.tsx"); const runtime = read("src/studio/drafting/StudioDraftingRuntime.ts"); const api = read("src/studio/api/StudioApi.ts");
assert.equal((shell.match(/<StudioResearchInbox/g) ?? []).length, 1); assert.equal((shell.match(/<AuthorEditorSurface/g) ?? []).length, 1); assert.equal((shell.match(/<StudioArtifactInspector/g) ?? []).length, 1); assert.equal((shell.match(/<StudioDraftingPanel/g) ?? []).length, 1);
assert.match(shell, /studio-shell__right-authority/); assert.match(shell, /Artifact Drafting/); assert.doesNotMatch(shell + panel, /OperatorAssistant|MockAssistantAdapter|chat window|completion surface/i);
assert.match(panel, /projectInvestigation\(\{ investigationId: investigation\?\.id, pinnedFirst: false \}\)/); assert.match(panel, /full Investigation projection, independent of Inbox filters/); assert.match(panel, /References are never listed here/); assert.match(panel, /UNAPPLIED DRAFT/); assert.doesNotMatch(panel, />Apply</);
assert.doesNotMatch(runtime, /insertNode|updateNodeText|setActiveDocument|markDirty|markClean|create_candidate|KnowledgeObjectRuntime|Resolve|graph/i); assert.match(runtime, /AbortController/); assert.match(runtime, /requestSequence/); assert.match(api, /signal\?: AbortSignal/);
console.log("VerifyStudioDraftingWorkspace: PASS");
