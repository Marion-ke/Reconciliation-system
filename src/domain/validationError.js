/**
 * Represents a validation issue discovered during processing.
 *
 * Validation errors do not modify the original data.
 * They simply document why a record failed validation
 * or generated a warning.
 */
export default class ValidationError {
  constructor({
    errorId,
    rawRecordId,
    reasonCode,
    severity,
    message,
    sourceValue,
  }) {
    // Unique identifier for the validation issue
    this.errorId = errorId;

    // Reference back to the original raw record
    this.rawRecordId = rawRecordId;

    // Machine-readable reason
    // Example: MISSING_ID
    this.reasonCode = reasonCode;

    // ERROR or WARNING
    this.severity = severity;

    // Human-readable explanation
    this.message = message;

    // Original value that triggered the issue
    this.sourceValue = sourceValue;
  }
}
