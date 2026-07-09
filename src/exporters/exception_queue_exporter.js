/**
 * Converts exception cases into CSV.
 */
export function buildExceptionQueueCsv(exceptionQueue) {
  const header = [
    "case_id",
    "severity",
    "reason_code",
    "asset_id",
    "event_id",
    "raw_record_id",
    "message",
    "recommended_next_action",
    "grouping_key",
  ].join(",");

  const rows = exceptionQueue.map((exception) =>
    [
      exception.caseId,
      exception.severity,
      exception.reasonCode,
      exception.assetId,
      exception.eventId,
      exception.rawRecordId,
      `"${exception.message}"`,
      `"${exception.recommendedNextAction}"`,
      exception.groupingKey,
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
