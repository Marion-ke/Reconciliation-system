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
    "expected_rule",
    "recommended_next_action",
  ].join(",");

  const rows = validationErrors.map((error) =>
    [
      error.errorId,
      error.rawRecordId,
      error.eventId ?? "",
      error.reasonCode,
      error.severity,
      `"${error.message}"`,
      `"${error.sourceValue}"`,
      `"${error.expectedRule ?? ""}"`,
      `"${error.recommendedNextAction ?? ""}"`,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
