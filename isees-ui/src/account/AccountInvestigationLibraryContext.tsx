/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import type { OwnedInvestigationSummary } from "./AccountFrontDoorApi";

export interface AccountInvestigationLibraryValue {
  readonly available: boolean;
  readonly items: readonly OwnedInvestigationSummary[];
  readonly activeInvestigationId: string | null;
  readonly busy: boolean;
  readonly error: string;
  readonly create: (title: string) => Promise<void>;
  readonly open: (investigationId: string) => Promise<void>;
}

const unavailable: AccountInvestigationLibraryValue = Object.freeze({
  available: false,
  items: Object.freeze([]),
  activeInvestigationId: null,
  busy: false,
  error: "",
  create: async () => undefined,
  open: async () => undefined,
});

const AccountInvestigationLibraryContext = createContext<AccountInvestigationLibraryValue>(unavailable);

export function AccountInvestigationLibraryProvider({ value, children }: { readonly value: AccountInvestigationLibraryValue; readonly children: ReactNode }) {
  return <AccountInvestigationLibraryContext.Provider value={value}>{children}</AccountInvestigationLibraryContext.Provider>;
}

export function useAccountInvestigationLibrary(): AccountInvestigationLibraryValue {
  return useContext(AccountInvestigationLibraryContext);
}
