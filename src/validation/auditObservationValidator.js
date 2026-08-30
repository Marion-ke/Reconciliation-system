const REQUIRED_FIELDS = [
  "observation_id",
  "asset_id",
  "observed_at",
  "observed_by",
  "observed_location_id",
  "observed_status",
  "observed_condition",
  "reconciliation_result",
  "source_system",
];

const ALLOWED_RESULTS = ["CONFIRMED", "WARNING", "DISCREPANCY"];

export function validateAuditObservations(records) {
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
      row.reconciliation_result &&
      !ALLOWED_RESULTS.includes(String(row.reconciliation_result).toUpperCase())
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_AUDIT_RESULT",
        message: `Invalid audit reconciliation result: ${row.reconciliation_result}`,
      });
    }

    if (row.observed_at && Number.isNaN(Date.parse(row.observed_at))) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_TIMESTAMP",
        message: "Invalid observed_at timestamp.",
      });
    }
  }

  return errors;
}
