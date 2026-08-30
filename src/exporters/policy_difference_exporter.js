/**
 * Builds a CSV report showing how reconciliation outcomes differ
 * between policy versions.
 */

function escapeCsv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildPolicyDifferenceCsv({ policyV1, policyV2, differences }) {
  const header = [
    "event_id",
    "asset_id",
    "event_type",
    "policy_v1",
    "policy_v2",
    "decision_v1",
    "decision_v2",
    "reason_code_v1",
    "reason_code_v2",
    "previous_state_v1",
    "previous_state_v2",
    "next_state_v1",
    "next_state_v2",
    "outcome_changed",
    "change_type",
    "message_v1",
    "message_v2",
  ].join(",");

  const rows = differences
    .slice()
    .sort((a, b) => a.eventId.localeCompare(b.eventId))
    .map((difference) =>
      [
        difference.eventId,
        difference.assetId,
        difference.eventType,
        policyV1,
        policyV2,
        difference.decisionV1,
        difference.decisionV2,
        difference.reasonCodeV1,
        difference.reasonCodeV2,
        difference.previousStateV1,
        difference.previousStateV2,
        difference.nextStateV1,
        difference.nextStateV2,
        difference.outcomeChanged ? "YES" : "NO",
        difference.outcomeChanged
          ? "DECISION_CHANGED"
          : "STATE_OR_REASON_CHANGED",
        difference.messageV1,
        difference.messageV2,
      ]
        .map(escapeCsv)
        .join(","),
    );

  return [header, ...rows].join("\n");
}
