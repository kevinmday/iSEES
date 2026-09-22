import releaseManifest from "../../../release/isees-release.json" with { type: "json" };

export const RELEASE_CHANNELS = ["LOCAL", "CANDIDATE", "PRODUCTION"] as const;
export const RUNTIME_ENVIRONMENTS = ["LOCAL", "GITHUB_SOURCE", "HUGGING_FACE"] as const;

export type ReleaseChannel = typeof RELEASE_CHANNELS[number];
export type RuntimeEnvironment = typeof RUNTIME_ENVIRONMENTS[number];

export interface SystemIdentity {
  readonly schemaVersion: string;
  readonly productId: string;
  readonly productName: string;
  readonly expandedName: string;
  readonly descriptor: string;
  readonly version: string;
  readonly frontendContract: string;
  readonly backendContract: string;
  readonly releaseChannel: ReleaseChannel;
  readonly runtimeEnvironment: RuntimeEnvironment;
  readonly sourceRevision: string | null;
  readonly deploymentRevision: string | null;
  readonly builtAt: string | null;
}

export const RUNNING_FRONTEND_CONTRACT = releaseManifest.frontendContract;
export const SUPPORTED_FRONTEND_CONTRACTS = Object.freeze([releaseManifest.frontendContract]);
export const SUPPORTED_BACKEND_CONTRACTS = Object.freeze([releaseManifest.backendContract]);

const keys = ["schemaVersion", "productId", "productName", "expandedName", "descriptor", "version", "frontendContract", "backendContract", "releaseChannel", "runtimeEnvironment", "sourceRevision", "deploymentRevision", "builtAt"] as const;
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && Boolean(value) && value === value.trim() && value.length <= 300 && !/[\u0000-\u001f]/.test(value);
const nullableText = (value: unknown): value is string | null => value === null || text(value);
const utcTimestamp = (value: unknown): value is string | null => value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && !Number.isNaN(Date.parse(value)));

export function decodeSystemIdentity(value: unknown): SystemIdentity {
  if (!object(value) || Object.keys(value).length !== keys.length || keys.some(key => !(key in value))) throw new Error("Invalid System Identity response");
  if (!["schemaVersion", "productId", "productName", "expandedName", "descriptor", "version", "frontendContract", "backendContract"].every(key => text(value[key]))) throw new Error("Invalid System Identity response");
  if (!RELEASE_CHANNELS.includes(value.releaseChannel as ReleaseChannel) || !RUNTIME_ENVIRONMENTS.includes(value.runtimeEnvironment as RuntimeEnvironment)) throw new Error("Invalid System Identity response");
  if (!nullableText(value.sourceRevision) || !nullableText(value.deploymentRevision) || !utcTimestamp(value.builtAt)) throw new Error("Invalid System Identity response");
  return Object.freeze({ ...value }) as unknown as SystemIdentity;
}
