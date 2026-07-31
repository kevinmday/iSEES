// ============================================================
// src/author/runtime/AuthorDocumentRuntimeContext.tsx
// P49A
// AUTHOR DOCUMENT RUNTIME CONTEXT
//
// React observation layer for the deterministic
// Author Document Runtime.
//
// The Author Document Runtime remains the canonical
// owner of document state.
//
// React owns nothing.
//
// Ownership:
//
// Author Document Runtime
//          ↓
// Author Document Context
//          ↓
// React Components
//
// ============================================================

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  authorDocumentRuntime,
} from "./AuthorDocumentRuntime";

import type {
  AuthorDocumentRuntime,
} from "./AuthorDocumentRuntime";

// ============================================================
// CONTEXT
// ============================================================

type AuthorDocumentRuntimeContextValue = {

  runtime:
    AuthorDocumentRuntime;

  revision:
    number;

};

const AuthorDocumentRuntimeContext =
  createContext<
    AuthorDocumentRuntimeContextValue | undefined
  >(undefined);

// ============================================================
// PROVIDER
// ============================================================

export function AuthorDocumentRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {

  // React owns no Author Document state.
  //
  // React simply observes deterministic
  // runtime revisions.

  const [
    revision,
    forceUpdate,
  ] = useState(0);

  useEffect(() => {

    const unsubscribe =
      authorDocumentRuntime.subscribe(() => {

        forceUpdate(
          revision => revision + 1,
        );

      });

    return unsubscribe;

  }, []);

  return (

    <AuthorDocumentRuntimeContext.Provider
      value={{

        runtime:
          authorDocumentRuntime,

        revision,

      }}
    >

      {children}

    </AuthorDocumentRuntimeContext.Provider>

  );

}

// ============================================================
// HOOKS
// ============================================================

export function useAuthorDocumentRuntime() {

  const context =
    useContext(
      AuthorDocumentRuntimeContext,
    );

  if (!context) {

    throw new Error(

      "useAuthorDocumentRuntime must be used inside AuthorDocumentRuntimeProvider",

    );

  }

  return context.runtime;

}

/**
 * Convenience hook for the
 * active Author Document.
 */

export function useAuthorDocument() {

  return useAuthorDocumentRuntime()
    .getActiveDocument();

}

/**
 * Convenience hook for the
 * current Author Document revision.
 */

export function useAuthorDocumentRevision() {

  return useAuthorDocumentRuntime()
    .getRevision();

}

/**
 * Convenience hook for the
 * Author Document dirty state.
 */

export function useAuthorDocumentDirty() {

  return useAuthorDocumentRuntime()
    .isDirty();

}