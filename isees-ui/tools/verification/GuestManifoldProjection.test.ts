import { test } from "vitest";

test("guest MANIFOLD projection, Resolve pair, and LAYERS authority remain coherent", async () => {
  await import("./VerifyGuestResolveOnManifoldBridge.ts");
});
