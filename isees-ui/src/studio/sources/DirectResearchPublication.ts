import type { ResearchAnchor } from "../../research/researchBridgeTypes";
import type { ResearchBridgeRuntime } from "../../research/ResearchBridgeRuntime";

export type ResearchCollectionResult = Readonly<{ status: "ADDED" | "ALREADY_PRESENT" | "UNAVAILABLE"; message: string }>;

export function collectTypedResearchSource(runtime: ResearchBridgeRuntime, create: () => ResearchAnchor): ResearchCollectionResult {
  try {
    const status = runtime.createAnchor(create());
    return { status, message: status === "ADDED" ? "Added to Research Inbox" : "Already in Research Inbox" };
  } catch (error) {
    return { status: "UNAVAILABLE", message: error instanceof Error ? error.message : "Research collection is unavailable." };
  }
}
