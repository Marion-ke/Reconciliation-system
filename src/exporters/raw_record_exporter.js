/**
 * Export raw record traceability index.
 */
export function buildRawRecordIndexCsv(rawRecords, validationResult) {
  const header = ["raw_record_id", "event_id", "status"].join(",");

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

    return [record.rawRecordId, record.payload.event_id, status].join(",");
  });

  return [header, ...rows].join("\n");
}
