/**
 * Stores the outcome of validation.
 */
export default class ValidationResult {
  constructor({
    acceptedRecords,
    rejectedRecords,
    warningRecords,
    validationErrors,
  }) {
    this.acceptedRecords = acceptedRecords;
    this.rejectedRecords = rejectedRecords;
    this.warningRecords = warningRecords;
    this.validationErrors = validationErrors;
  }
}
