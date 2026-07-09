/**
 * Converts reconciliation decisions
 * into a CSV document.
 */
export function buildEventDecisionsCsv(decisions) {
  const header = [
    "event_id",
    "asset_id",
    "event_type",
    "decision",
    "reason_code",
    "message",
    "previous_state",
    "next_state",
    "raw_record_id",
    "policy_version",
  ].join(",");

  const rows = decisions.map((decision) =>
    [
      decision.eventId,
      decision.assetId,
      decision.eventType,
      decision.decision,
      decision.reasonCode,
      `"${decision.message}"`,
      decision.previousState,
      decision.nextState ?? "",
      decision.rawRecordId,
      decision.policyVersion,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
