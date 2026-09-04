// ============================================================
// src/author/runtime/AuthorDocumentRuntime.ts
// P51C
// AUTHOR DOCUMENT RUNTIME
//
// Deterministic runtime owning the operator's active
// Computational Author Document.
//
// React observes.
//
// Editors edit.
//
// Projection runtimes render.
//
// No React.
// No Lexical.
// No persistence.
// No networking.
// No AI.
//
// ============================================================

import type {

  ComputationalAuthorDocument,

} from "../model/AuthorDocument";

import type {

  AuthorNode,

} from "../model/AuthorNodeTypes";

import type {

  AuthorDocumentRuntimeState,

} from "./AuthorDocumentRuntimeTypes";

// ============================================================
// TYPES
// ============================================================

type AuthorDocumentRuntimeListener =
  () => void;

// ============================================================
// RUNTIME
// ============================================================

export class AuthorDocumentRuntime {

  private activeInvestigationId: string | undefined;

  private documentsByInvestigation = new Map<string, ComputationalAuthorDocument>();

  private lastInsertedNodeId: string | undefined;

  private state:
    AuthorDocumentRuntimeState = {

      activeDocument:
        undefined,

      dirty:
        false,

      revision:
        0,

    };

  private listeners =
    new Set<
      AuthorDocumentRuntimeListener
    >();

  // ==========================================================
  // ACCESSORS
  // ==========================================================

  getState():
    Readonly<
      AuthorDocumentRuntimeState
    > {

    return this.state;

  }

  getActiveDocument():
    ComputationalAuthorDocument | undefined {

    return this.state.activeDocument;

  }

  getRevision():
    number {

    return this.state.revision;

  }

  isDirty():
    boolean {

    return this.state.dirty;

  }

  getActiveInvestigationId(): string | undefined {
    return this.activeInvestigationId;
  }

  getLastInsertedNodeId(): string | undefined {
    return this.lastInsertedNodeId;
  }

  // ==========================================================
  // OBSERVERS
  // ==========================================================

  subscribe(
    listener:
      AuthorDocumentRuntimeListener,
  ): () => void {

    this.listeners.add(
      listener,
    );

    return () => {

      this.listeners.delete(
        listener,
      );

    };

  }

  private notify():
    void {

    for (
      const listener
      of this.listeners
    ) {

      listener();

    }

  }

  // ==========================================================
  // DOCUMENT OWNERSHIP
  // ==========================================================

  setActiveDocument(
    document:
      ComputationalAuthorDocument,
  ): void {

    if (
      this.state.activeDocument ===
      document
    ) {

      return;

    }

    this.state = {

      ...this.state,

      activeDocument:
        document,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    if (this.activeInvestigationId) {
      this.documentsByInvestigation.set(this.activeInvestigationId, document);
    }

    this.notify();

  }

  /** Keeps one canonical draft per Investigation without introducing a UI document owner. */
  activateInvestigation(investigationId: string | undefined): void {
    if (this.activeInvestigationId === investigationId) return;

    if (this.activeInvestigationId && this.state.activeDocument) {
      this.documentsByInvestigation.set(this.activeInvestigationId, this.state.activeDocument);
    }

    const firstActivation = this.activeInvestigationId === undefined && investigationId !== undefined;
    const nextDocument = firstActivation
      ? this.state.activeDocument
      : investigationId
        ? this.documentsByInvestigation.get(investigationId)
        : undefined;

    this.activeInvestigationId = investigationId;
    if (investigationId && nextDocument) this.documentsByInvestigation.set(investigationId, nextDocument);
    this.lastInsertedNodeId = undefined;
    this.state = { ...this.state, activeDocument: nextDocument, dirty: false, revision: this.state.revision + 1 };
    this.notify();
  }

  clearActiveDocument():
    void {

    if (
      this.state.activeDocument ===
      undefined
    ) {

      return;

    }

    this.state = {

      ...this.state,

      activeDocument:
        undefined,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // DOCUMENT MUTATION
  // ==========================================================

  /**
   * Inserts a computational node into the
   * active Author Document.
   *
   * The runtime owns the mutation.
   *
   * Editors, the Research Inbox, REX, and
   * future subsystems merely construct nodes
   * and request insertion.
   */
  insertNode(
    node:
      AuthorNode,
  ): "INSERTED" | "DUPLICATE" | "NO_ACTIVE_DOCUMENT" | "INVESTIGATION_MISMATCH" {

    const document =
      this.state.activeDocument;

    if (
      document ===
      undefined
    ) {

      return "NO_ACTIVE_DOCUMENT";

    }

    if (node.type === "REFERENCE") {
      const reference = node as import("../model/AuthorNodeTypes").ReferenceNode;
      if (this.activeInvestigationId && reference.researchSource?.sourceInvestigationId && reference.researchSource.sourceInvestigationId !== this.activeInvestigationId) {
        return "INVESTIGATION_MISMATCH";
      }
      if (reference.researchSource) {
        const existing = document.nodes.find(candidate =>
          candidate.type === "REFERENCE" &&
          (candidate as import("../model/AuthorNodeTypes").ReferenceNode).researchSource?.anchorId === reference.researchSource?.anchorId
        );
        if (existing) {
          this.lastInsertedNodeId = existing.id;
          this.state = { ...this.state, revision: this.state.revision + 1 };
          this.notify();
          return "DUPLICATE";
        }
      }
    }

    if (this.activeInvestigationId) {
      this.documentsByInvestigation.delete(this.activeInvestigationId);
    }

    document.nodes.push(
      node,
    );

    this.lastInsertedNodeId = node.id;

    this.state = {

      ...this.state,

      dirty:
        true,

      revision:
        this.state.revision + 1,

    };

    this.notify();

    return "INSERTED";

  }

  updateNodeText(nodeId: string, text: string): boolean {
    const node = this.state.activeDocument?.nodes.find(candidate => candidate.id === nodeId);
    if (!node || !("text" in node) || typeof node.text !== "string") return false;
    node.text = text;
    this.publishDraftMutation(nodeId);
    return true;
  }

  updateDocumentTitle(title: string): boolean {
    const document = this.state.activeDocument;
    if (!document || !title.trim()) return false;
    document.metadata.title = title.trim();
    document.metadata.modifiedAt = new Date();
    this.publishDraftMutation();
    return true;
  }

  moveNode(nodeId: string, direction: "UP" | "DOWN"): boolean {
    const nodes = this.state.activeDocument?.nodes;
    if (!nodes) return false;
    const index = nodes.findIndex(node => node.id === nodeId);
    const destination = direction === "UP" ? index - 1 : index + 1;
    if (index < 0 || destination < 0 || destination >= nodes.length) return false;
    [nodes[index], nodes[destination]] = [nodes[destination]!, nodes[index]!];
    this.publishDraftMutation(nodeId);
    return true;
  }

  removeNode(nodeId: string): boolean {
    const nodes = this.state.activeDocument?.nodes;
    if (!nodes) return false;
    const index = nodes.findIndex(node => node.id === nodeId);
    if (index < 0) return false;
    nodes.splice(index, 1);
    this.publishDraftMutation();
    return true;
  }

  private publishDraftMutation(nodeId?: string): void {
    this.lastInsertedNodeId = nodeId;
    this.state = { ...this.state, dirty: true, revision: this.state.revision + 1 };
    this.notify();
  }

  // ==========================================================
  // DOCUMENT STATE
  // ==========================================================

  markDirty():
    void {

    if (
      this.state.dirty
    ) {

      return;

    }

    this.state = {

      ...this.state,

      dirty:
        true,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  markClean():
    void {

    if (
      !this.state.dirty
    ) {

      return;

    }

    this.state = {

      ...this.state,

      dirty:
        false,

      revision:
        this.state.revision + 1,

    };

    this.notify();

  }

  // ==========================================================
  // FUTURE OWNERSHIP
  // ==========================================================
  //
  // Multiple Documents
  // Tabs
  // Undo / Redo
  // Save Manager
  // Publish Manager
  // Citation Manager
  // Embedded Graph Objects
  // Observation Nodes
  // Lexical Projection
  // Collaboration
  //
  // ==========================================================

}

// ============================================================
// SINGLETON
// ============================================================

export const authorDocumentRuntime =
  new AuthorDocumentRuntime();
