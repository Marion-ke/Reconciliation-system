/**
 * Export raw record traceability index.
 *
 * The index covers every source record used by the reconciliation run.
 * Different source files have different schemas, so event-specific
 * fields are populated only when they exist.
 */
export function buildRawRecordIndexCsv(rawRecords, validationResult) {
  const header = [
    "raw_record_id",
    "source_file",
    "source_row",
    "event_id",
    "event_type",
    "asset_id",
    "status",
    "original_payload",
  ].join(",");

  const rejectedRecords = validationResult?.rejectedRecords ?? [];
  const warningRecords = validationResult?.warningRecords ?? [];

  const rows = rawRecords.map((record) => {
    let status = "ACCEPTED";

    if (rejectedRecords.some((r) => r.rawRecordId === record.rawRecordId)) {
      status = "REJECTED";
    } else if (
      warningRecords.some((r) => r.rawRecordId === record.rawRecordId)
    ) {
      status = "WARNING";
    }

    const payload = record.payload ?? {};

    const eventId = payload.event_id ?? "";
    const eventType = payload.event_type ?? "";
    const assetId = payload.asset_id ?? payload.observed_asset_id ?? "";

    return [
      record.rawRecordId ?? "",
      record.sourceFile ?? "",
      record.sourceRow ?? "",
      eventId,
      eventType,
      assetId,
      status,
      `"${JSON.stringify(payload).replaceAll('"', '""')}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
