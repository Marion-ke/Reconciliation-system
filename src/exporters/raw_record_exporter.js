/**
 * Export raw record traceability index.
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

  const rows = rawRecords.map((record) => {
    let status = "ACCEPTED";

    if (
      validationResult.rejectedRecords.some(
        (r) => r.rawRecordId === record.rawRecordId,
      )
    ) {
      status = "REJECTED";
    } else if (
      validationResult.warningRecords.some(
        (r) => r.rawRecordId === record.rawRecordId,
      )
    ) {
      status = "WARNING";
    }

    return [
      record.rawRecordId,
      record.sourceFile,
      record.sourceRow,
      record.payload.event_id,
      record.payload.event_type,
      record.payload.asset_id,
      status,
      `"${JSON.stringify(record.payload).replaceAll('"', '""')}"`,
    ].join(",");
  });

  return [header, ...rows].join("\n");
}
