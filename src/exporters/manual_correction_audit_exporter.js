/**
 * Builds the manual correction audit report.
 *
 * The report preserves the original correction record while
 * exposing the authorization, evidence, outcome, and state
 * transition needed for audit review.
 */
export function buildManualCorrectionAuditCsv(manualCorrectionRecords) {
  const header = [
    "correction_id",
    "asset_id",
    "occurred_at",
    "actor_id",
    "actor_role",
    "before_status",
    "after_status",
    "reason",
    "evidence_ref",
    "authorization_outcome",
    "outcome",
    "warning",
    "source_system",
    "note",
  ].join(",");

  const rows = manualCorrectionRecords.map((record) => {
    const correction = record.payload ?? record;

    const values = [
      correction.correction_id ?? correction.correctionId ?? "",
      correction.asset_id ?? correction.assetId ?? "",
      correction.occurred_at ?? correction.occurredAt ?? "",
      correction.actor_id ?? correction.actorId ?? "",
      correction.actor_role ?? correction.actorRole ?? "",
      correction.before_status ?? correction.beforeStatus ?? "",
      correction.after_status ?? correction.afterStatus ?? "",
      correction.reason ?? "",
      correction.evidence_ref ?? correction.evidenceRef ?? "",
      correction.authorization_outcome ?? correction.authorizationOutcome ?? "",
      correction.outcome ?? "",
      correction.warning ?? "",
      correction.source_system ?? correction.sourceSystem ?? "",
      correction.note ?? "",
    ];

    return values
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
  });

  return [header, ...rows].join("\n");
}
