/**
 * Convert validation errors
 * into CSV text.
 */
export function buildValidationErrorsCsv(validationErrors) {
  const header = [
    "error_id",
    "raw_record_id",
    "event_id",
    "reason_code",
    "severity",
    "message",
    "source_value",
  ].join(",");

  const rows = validationErrors.map((error) =>
    [
      error.errorId,
      error.rawRecordId,
      error.eventId ?? "",
      error.reasonCode,
      error.severity,
      error.message,
      error.sourceValue ?? "",
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
