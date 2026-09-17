import type { RexApi } from "./RexApi.ts";

export function RexResearchInboxHydrator(props:{readonly api?:RexApi}) {
  void props;
  // Durable completed REX history remains backend-owned. Restoration must not
  // translate that history into Research Inbox anchors without explicit review.
  return null;
}
