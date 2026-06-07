import SurfaceBlock from "./SurfaceBlock";
function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #172033",
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: 13,
          color: "#d1d5db",
          fontWeight: 600,
        }}
      >
        {value}
      </div>
    </div>
  );
}


export default function AssessmentSurface({
  event,
}: {
  event: any;
}) {
  return (
    <SurfaceBlock title="Operational Assessment">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {event.operational_intelligence?.assessment ? (
          <>
            <DetailRow
              label="Confidence"
              value={
                event.operational_intelligence
                  .assessment.confidence
              }
            />

            <DetailRow
              label="Topology State"
              value={
                event.operational_intelligence
                  .assessment.topology_state
              }
            />

            <DetailRow
              label="Primary Hypothesis"
              value={
                event.operational_intelligence
                  .assessment.primary_hypothesis
              }
            />

            <DetailRow
              label="Primary Contradiction"
              value={
                event.operational_intelligence
                  .assessment.primary_contradiction
              }
            />

            <DetailRow
              label="Next Best Action"
              value={
                event.operational_intelligence
                  .assessment.next_best_action
              }
            />
          </>
        ) : (
          <>
            <DetailRow
              label="Confidence"
              value={event.confidence}
            />

            <DetailRow
              label="Escalation"
              value={event.escalation}
            />

            <DetailRow
              label="Facility Count"
              value={
                event.facilities?.length || 0
              }
            />
          </>
        )}

        {(event.reasoning || []).map(
          (item: string, idx: number) => (
            <div
              key={idx}
              style={{
                padding: 12,
                border: "1px solid #1f2937",
                borderRadius: 8,
                background: "#0b1220",
                color: "#cbd5e1",
                fontSize: 13,
              }}
            >
              {item}
            </div>
          )
        )}
      </div>
    </SurfaceBlock>
  );
}