import { CanonicalLayerRegistry } from "../../manifold/layers/systemCanonLayers";
import {
  ArmedLayerClassification,
  LayersExperimentStatus,
} from "./LayersExperimentRuntimeTypes";
import type {
  ArmedLayer,
  ArmedLayerSelection,
  EstablishLayersExperimentInput,
  LayersExperimentError,
  LayersExperimentExecution,
  LayersExperimentResult,
  LayersExperimentState,
} from "./LayersExperimentRuntimeTypes";

type Listener = () => void;

function requireIdentifier(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  const normalized = value.trim();
  if (!normalized || !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(normalized)) {
    throw new Error(`${label} is missing or malformed.`);
  }
  return normalized;
}

function optionalIdentifier(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : requireIdentifier(value, label);
}

function identifiers(values: readonly string[] | undefined, label: string): readonly string[] {
  return Object.freeze([...new Set((values ?? []).map((value) => requireIdentifier(value, label)))].sort());
}

function cloneValue<T>(value: T, seen = new WeakSet<object>()): T {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
      throw new Error("Experiment values must be JSON-compatible.");
    }
    if (typeof value === "number" && !Number.isFinite(value)) throw new Error("Experiment numbers must be finite.");
    return value;
  }
  if (seen.has(value)) throw new Error("Experiment values must not be cyclic.");
  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => cloneValue(item, seen)) as T;
    seen.delete(value);
    return result;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error("Experiment values must use plain objects and arrays.");
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as object).sort()) {
    result[key] = cloneValue((value as Record<string, unknown>)[key], seen);
  }
  seen.delete(value);
  return result as T;
}

function freezeValue<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as object)) freezeValue(child);
    Object.freeze(value);
  }
  return value;
}

function immutable<T>(value: T): Readonly<T> {
  return freezeValue(cloneValue(value));
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(value);
}

function semanticId(input: unknown): string {
  const text = stableSerialize(input);
  let hash = 0xcbf29ce484222325n;
  for (const character of text) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return `layers-execution:${hash.toString(16).padStart(16, "0")}`;
}

function normalizeLayers(selection: ArmedLayerSelection): readonly ArmedLayer[] {
  const legacy = new Set(identifiers(selection.legacyLayerIds, "Legacy layer identifier"));
  const all = identifiers([...selection.layerIds, ...legacy], "Layer identifier");
  const registry = new Map(CanonicalLayerRegistry.map((layer) => [layer.id, layer]));
  return immutable(all.map((id): ArmedLayer => {
    const canonicalDefinition = registry.get(id);
    if (canonicalDefinition) {
      return { id, classification: ArmedLayerClassification.CANONICAL, operational: true, canonicalDefinition };
    }
    return {
      id,
      classification: legacy.has(id) ? ArmedLayerClassification.LEGACY : ArmedLayerClassification.UNSUPPORTED,
      operational: false,
    };
  }));
}

export function createUnavailableLayersExperimentResult(): LayersExperimentResult {
  return immutable({
    outcome: "UNAVAILABLE",
    unavailableInputs: [{
      code: "COMPUTATIONAL_ADAPTER_UNAVAILABLE",
      description: "No operational Laboratory computational adapter exists; the dormant P30 manifold engine was not executed.",
    }],
  });
}

export class LayersExperimentRuntime {
  private state: LayersExperimentState = immutable({
    status: LayersExperimentStatus.EMPTY,
    armedLayers: [],
    history: [],
    revision: 0,
  });

  private readonly listeners = new Set<Listener>();

  getState(): LayersExperimentState {
    return immutable(this.state) as LayersExperimentState;
  }

  establish(input: EstablishLayersExperimentInput): void {
    const investigationId = requireIdentifier(input.scope.investigationId, "Investigation identity");
    const baselineInvestigationId = requireIdentifier(input.baseline.investigationId, "Baseline Investigation identity");
    if (investigationId !== baselineInvestigationId) throw new Error("Scope and baseline Investigation identities must match.");
    const workspaceId = optionalIdentifier(input.scope.workspaceId, "Workspace identity");
    const baselineWorkspaceId = optionalIdentifier(input.baseline.workspaceId, "Baseline workspace identity");
    if (workspaceId !== baselineWorkspaceId) throw new Error("Scope and baseline workspace identities must match.");
    const subjectIds = identifiers(input.scope.subjectIds, "Subject identity");
    const baselineSubjectIds = identifiers(input.baseline.subjectIds, "Baseline subject identity");
    if (stableSerialize(subjectIds) !== stableSerialize(baselineSubjectIds)) throw new Error("Scope and baseline subject identities must match.");
    const scope = immutable({
      investigationId, workspaceId,
      focusedEventId: optionalIdentifier(input.scope.focusedEventId, "Focused event identity"),
      comparisonEventId: optionalIdentifier(input.scope.comparisonEventId, "Comparison event identity"),
      subjectIds,
      compareOrigin: input.scope.compareOrigin === undefined ? undefined : {
        pairId: optionalIdentifier(input.scope.compareOrigin.pairId, "COMPARE pair identity"),
        candidateId: optionalIdentifier(input.scope.compareOrigin.candidateId, "COMPARE candidate identity"),
      },
      resolveOrigin: input.scope.resolveOrigin === undefined ? undefined : {
        executionId: optionalIdentifier(input.scope.resolveOrigin.executionId, "Resolve execution identity"),
        manifoldId: optionalIdentifier(input.scope.resolveOrigin.manifoldId, "Manifold identity"),
      },
    });
    const baseline = immutable({
      investigationId, workspaceId, subjectIds: baselineSubjectIds,
      canonicalStartingLayerIds: identifiers(input.baseline.canonicalStartingLayerIds, "Starting layer identifier"),
      startingResolveExecutionId: optionalIdentifier(input.baseline.startingResolveExecutionId, "Starting Resolve execution identity"),
      startingManifoldId: optionalIdentifier(input.baseline.startingManifoldId, "Starting manifold identity"),
      temporalContext: input.baseline.temporalContext,
      investigativeScale: input.baseline.investigativeScale,
    });
    const armedLayers = normalizeLayers(input.armedLayers ?? { layerIds: baseline.canonicalStartingLayerIds });
    this.replace({ status: LayersExperimentStatus.READY, scope, baseline, armedLayers, history: [], revision: this.state.revision + 1 });
  }

  setArmedLayers(selection: ArmedLayerSelection): void {
    if (!this.state.scope || !this.state.baseline) throw new Error("Establish the Laboratory before changing armed layers.");
    if (this.state.status === LayersExperimentStatus.EXECUTING) throw new Error("Armed layers cannot change during execution.");
    this.replace({ ...this.state, status: LayersExperimentStatus.READY, armedLayers: normalizeLayers(selection), currentExecution: undefined, error: undefined, revision: this.state.revision + 1 });
  }

  beginExecution(researcherConfiguration: Readonly<Record<string, unknown>>, metadata?: { startedAt?: string }): string {
    if (!this.state.scope || !this.state.baseline) throw new Error("Establish the Laboratory before execution.");
    if (this.state.status === LayersExperimentStatus.EXECUTING) throw new Error("A Laboratory execution is already active.");
    const input = immutable({
      scope: this.state.scope,
      baseline: this.state.baseline,
      armedLayers: this.state.armedLayers,
      temporalContext: this.state.baseline.temporalContext,
      investigativeScale: this.state.baseline.investigativeScale,
      researcherConfiguration,
    });
    const executionId = semanticId(input);
    const currentExecution = immutable({ executionId, input, startedAt: metadata?.startedAt });
    this.replace({ ...this.state, status: LayersExperimentStatus.EXECUTING, currentExecution, error: undefined, revision: this.state.revision + 1 });
    return executionId;
  }

  completeExecution(executionId: string, investigationId: string, result: LayersExperimentResult, metadata?: { completedAt?: string }): void {
    const current = this.matchExecution(executionId, investigationId, "complete");
    const completed = immutable({ ...current, result, completedAt: metadata?.completedAt });
    this.replace({ ...this.state, status: LayersExperimentStatus.COMPLETE, currentExecution: completed, history: [...this.state.history, completed], error: undefined, revision: this.state.revision + 1 });
  }

  failExecution(executionId: string, investigationId: string, error: LayersExperimentError, metadata?: { completedAt?: string }): void {
    const current = this.matchExecution(executionId, investigationId, "fail");
    if (typeof error.message !== "string" || !error.message.trim()) throw new Error("Error message is required.");
    const normalizedError = immutable({ code: requireIdentifier(error.code, "Error code"), message: error.message.trim(), details: error.details });
    const failed = immutable({ ...current, error: normalizedError, completedAt: metadata?.completedAt });
    this.replace({ ...this.state, status: LayersExperimentStatus.ERROR, currentExecution: failed, history: [...this.state.history, failed], error: normalizedError, revision: this.state.revision + 1 });
  }

  reset(): void {
    this.replace({ status: LayersExperimentStatus.EMPTY, armedLayers: [], history: [], revision: this.state.revision + 1 });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private matchExecution(executionId: string, investigationId: string, action: string): LayersExperimentExecution {
    if (this.state.status !== LayersExperimentStatus.EXECUTING || !this.state.currentExecution || !this.state.scope) {
      throw new Error(`Cannot ${action} without an EXECUTING Laboratory execution.`);
    }
    if (requireIdentifier(executionId, "Execution identity") !== this.state.currentExecution.executionId) throw new Error("Execution identity does not match the active execution.");
    if (requireIdentifier(investigationId, "Investigation identity") !== this.state.scope.investigationId) throw new Error("Investigation identity does not match the Laboratory scope.");
    return this.state.currentExecution;
  }

  private replace(next: LayersExperimentState): void {
    this.state = immutable(next) as LayersExperimentState;
    for (const listener of [...this.listeners]) listener();
  }
}
