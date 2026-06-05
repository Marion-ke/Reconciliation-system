/**
 * Represents a single record exactly as it arrived from a source file.
 *
 * Packet 01 requires a clear separation between:
 * - Raw records
 * - Validated records
 * - Canonical events
 *
 * This object preserves traceability back to the original source row.
 */
export default class RawRecord {
  constructor({ rawRecordId, sourceFile, sourceRow, payload }) {
    // Unique identifier used internally for traceability
    this.rawRecordId = rawRecordId;

    // Source file the record came from
    this.sourceFile = sourceFile;

    // Original row number in the source file
    this.sourceRow = sourceRow;

    // Unmodified original data payload
    this.payload = payload;
  }
}
