import type { TimelineTemporalItem, TimelineTemporalValue } from "../projection";

export function presentTimelineTemporalValue(value: TimelineTemporalValue): string {
  switch (value.kind) {
    case "INSTANT": return value.sourceValue;
    case "DATE": return `${value.sourceValue} (date only)`;
    case "INTERVAL": return `${value.start.inclusive ? "[" : "("}${value.start.sourceValue} — ${value.end.sourceValue}${value.end.inclusive ? "]" : ")"}`;
    case "OPEN_INTERVAL": return value.start
      ? `${value.start.inclusive ? "[" : "("}${value.start.sourceValue} — open end`
      : `open start — ${value.end!.sourceValue}${value.end!.inclusive ? "]" : ")"}`;
    case "DURATION": return `${value.value} ${value.unit.toLowerCase()}`;
    case "SEQUENCE": return `Sequence ${value.ordinal}`;
    case "UNKNOWN": return `Unknown — ${value.reason}`;
  }
}

export function presentTimelinePrecision(item: TimelineTemporalItem): string {
  const labels: Record<TimelineTemporalItem["precision"], string> = {
    EXACT: "Exact time",
    DATE_ONLY: "Date only",
    APPROXIMATE: "Approximate",
    INFERRED: "Inferred",
    DISPUTED: "Disputed",
    SEQUENCE_ONLY: "Sequence only",
    UNKNOWN: "Unknown time",
  };
  return labels[item.precision];
}

export function presentTimelineSemantic(item: TimelineTemporalItem): string {
  return item.semantic.replace("_", " ").toLowerCase();
}
