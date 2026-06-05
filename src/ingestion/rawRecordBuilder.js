import RawRecord from "../domain/RawRecord.js";

/**
 * Converts source rows into RawRecord objects.
 *
 * Every source row receives:
 * - Unique raw record id
 * - Source file reference
 * - Source row number
 *
 * This enables full traceability and auditing.
 */
export function buildRawRecords(records, sourceFile) {
  return records.map(
    (record, index) =>
      new RawRecord({
        // Example:
        // events.csv-15
        rawRecordId: `${sourceFile}-${index + 1}`,

        sourceFile,

        // Human-readable row number
        sourceRow: index + 1,

        // Original row payload
        payload: record,
      }),
  );
}
