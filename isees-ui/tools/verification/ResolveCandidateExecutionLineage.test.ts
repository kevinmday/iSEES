import { describe, expect, it } from "vitest";

import { resolveCurrentExecutionCandidateSelection } from "../../src/resolve/runtime/useResolveExecutionCommand.ts";
import { WorkspaceSelectionKind, type WorkspaceCandidateSelection } from "../../src/workspace/runtime/WorkspaceRuntimeTypes.ts";
import type { ResolveExecutionRecord } from "../../src/resolve/runtime/ResolveRuntimeTypes.ts";

const selection: WorkspaceCandidateSelection = {
  kind: WorkspaceSelectionKind.CANDIDATE,
  executionId: "resolve:current",
  candidateId: "candidate:current",
  evaluationId: "evaluation:current",
  leftKnowledgeObjectId: "knowledge:left",
  rightKnowledgeObjectId: "knowledge:right",
};

const evaluation = {
  identity: {
    candidateId: selection.candidateId,
    evaluationId: selection.evaluationId,
    leftKnowledgeObjectId: selection.leftKnowledgeObjectId,
    rightKnowledgeObjectId: selection.rightKnowledgeObjectId,
  },
};

const execution = {
  executionId: selection.executionId,
  result: { candidateEvaluations: { evaluations: [evaluation] } },
} as unknown as ResolveExecutionRecord;

describe("Resolve candidate execution lineage", () => {
  it("accepts only one exact evaluation from the exact completed execution", () => {
    expect(resolveCurrentExecutionCandidateSelection(selection, execution)).toBe(true);
    expect(resolveCurrentExecutionCandidateSelection({ ...selection, executionId: undefined }, execution)).toBe(false);
    expect(resolveCurrentExecutionCandidateSelection({ ...selection, executionId: "resolve:old" }, execution)).toBe(false);
    expect(resolveCurrentExecutionCandidateSelection({ ...selection, evaluationId: "evaluation:forged" }, execution)).toBe(false);
    expect(resolveCurrentExecutionCandidateSelection({ ...selection, leftKnowledgeObjectId: selection.rightKnowledgeObjectId, rightKnowledgeObjectId: selection.leftKnowledgeObjectId }, execution)).toBe(false);
    expect(resolveCurrentExecutionCandidateSelection(selection, { ...execution, result: { ...execution.result!, candidateEvaluations: { evaluations: [evaluation, evaluation] } } } as ResolveExecutionRecord)).toBe(false);
  });
});
