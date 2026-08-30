const REQUIRED_FIELDS = [
  "correction_id",
  "asset_id",
  "occurred_at",
  "actor_id",
  "actor_role",
  "before_status",
  "after_status",
  "reason",
  "authorization_outcome",
  "outcome",
  "source_system",
];

const ALLOWED_AUTHORIZATION = ["AUTHORIZED", "UNAUTHORIZED"];

const ALLOWED_OUTCOMES = ["APPLIED", "REJECTED"];

export function validateManualCorrections(records) {
  const errors = [];

  for (const record of records) {
    const row = record.payload;

    for (const field of REQUIRED_FIELDS) {
      if (
        row[field] === undefined ||
        row[field] === null ||
        String(row[field]).trim() === ""
      ) {
        errors.push({
          rawRecordId: record.rawRecordId,
          severity: "ERROR",
          reasonCode: "MISSING_REQUIRED_FIELD",
          message: `Missing required field: ${field}`,
        });
      }
    }

    if (
      row.authorization_outcome &&
      !ALLOWED_AUTHORIZATION.includes(
        String(row.authorization_outcome).toUpperCase(),
      )
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_AUTHORIZATION_OUTCOME",
        message: `Invalid authorization outcome: ${row.authorization_outcome}`,
      });
    }

    if (
      row.outcome &&
      !ALLOWED_OUTCOMES.includes(String(row.outcome).toUpperCase())
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_CORRECTION_OUTCOME",
        message: `Invalid correction outcome: ${row.outcome}`,
      });
    }

    if (row.occurred_at && Number.isNaN(Date.parse(row.occurred_at))) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_TIMESTAMP",
        message: "Invalid occurred_at timestamp.",
      });
    }

    // Unauthorized corrections must not be applied.
    if (
      String(row.authorization_outcome).toUpperCase() === "UNAUTHORIZED" &&
      String(row.outcome).toUpperCase() === "APPLIED"
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "UNAUTHORIZED_CORRECTION",
        message: "Unauthorized manual correction cannot be applied.",
      });
    }

    // Applied corrections require evidence.
    if (
      String(row.outcome).toUpperCase() === "APPLIED" &&
      (!row.evidence_ref || String(row.evidence_ref).trim() === "")
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "MISSING_CORRECTION_EVIDENCE",
        message: "Applied manual correction requires evidence_ref.",
      });
    }
  }

  return errors;
}
