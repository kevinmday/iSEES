export const PUBLIC_OVERVIEW_NIMITZ_EVENT_ID = "E-TICTAC-2004" as const;

export type PublicOverviewLaunchIntent =
  | { readonly kind: "LIBRARY_CANON_PREVIEW"; readonly eventId: typeof PUBLIC_OVERVIEW_NIMITZ_EVENT_ID }
  | { readonly kind: "LIBRARY" }
  | { readonly kind: "LIBRARY_INTAKE" };

let pendingIntent: PublicOverviewLaunchIntent | null = null;

export function requestPublicOverviewNimitzPreview(): void {
  pendingIntent = Object.freeze({ kind: "LIBRARY_CANON_PREVIEW", eventId: PUBLIC_OVERVIEW_NIMITZ_EVENT_ID });
}

export function requestPublicOverviewIntake(): void {
  pendingIntent = Object.freeze({ kind: "LIBRARY_INTAKE" });
}

export function requestPublicOverviewLibrary(): void {
  pendingIntent = Object.freeze({ kind: "LIBRARY" });
}

export function consumePublicOverviewLaunchIntent(): PublicOverviewLaunchIntent | null {
  const intent = pendingIntent;
  pendingIntent = null;
  return intent;
}
