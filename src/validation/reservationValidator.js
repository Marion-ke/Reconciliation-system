const REQUIRED_FIELDS = [
  "reservation_id",
  "asset_id",
  "requester_id",
  "requested_at",
  "reserved_from",
  "reserved_until",
  "status",
  "source_system",
];

const ALLOWED_STATUSES = ["OPEN", "FULFILLED", "CANCELLED", "CONFLICTED"];

export function validateReservations(records) {
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
      row.status &&
      !ALLOWED_STATUSES.includes(String(row.status).toUpperCase())
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_RESERVATION_STATUS",
        message: `Invalid reservation status: ${row.status}`,
      });
    }

    if (
      row.reserved_from &&
      row.reserved_until &&
      new Date(row.reserved_from) >= new Date(row.reserved_until)
    ) {
      errors.push({
        rawRecordId: record.rawRecordId,
        severity: "ERROR",
        reasonCode: "INVALID_RESERVATION_WINDOW",
        message: "reserved_from must be before reserved_until.",
      });
    }
  }

  return errors;
}
