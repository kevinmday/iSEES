import { createContext,useContext } from "react";
import type { StudioV1SaveState } from "../v1/runtime/StudioV1SaveOrchestrator.ts";
import type { RevisionDetail, RevisionList } from "../v1/api/StudioV1AuthorApiTypes.ts";
export interface StudioSaveActionContextValue{readonly state:StudioV1SaveState;save():Promise<void>;retry():Promise<void>;reloadHead():Promise<void>;keepLocalDraft():void;listRevisions():Promise<RevisionList|undefined>;loadRevision(id:string):Promise<RevisionDetail|undefined>;clearRevisionPreview():void;inspectProjections():Promise<unknown>}
export const StudioSaveActionContext=createContext<StudioSaveActionContextValue|undefined>(undefined);
export function useStudioSaveAction(){const value=useContext(StudioSaveActionContext);if(!value)throw new Error("Studio save action requires StudioSaveActionProvider.");return value}
