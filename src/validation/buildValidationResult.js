import ValidationResult from "../domain/validationResult.js";

/**
 * Determines which records are accepted,
 * rejected, or accepted with warnings.
 */
export function buildValidationResult(rawRecords, validationErrors) {
  const acceptedRecords = [];
  const rejectedRecords = [];
  const warningRecords = [];

  rawRecords.forEach((record) => {
    const recordIssues = validationErrors.filter(
      (error) => error.rawRecordId === record.rawRecordId,
    );

    const hasError = recordIssues.some((issue) => issue.severity === "ERROR");

    const hasWarning = recordIssues.some(
      (issue) => issue.severity === "WARNING",
    );

    if (hasError) {
      rejectedRecords.push(record);
    } else if (hasWarning) {
      warningRecords.push(record);

      acceptedRecords.push(record);
    } else {
      acceptedRecords.push(record);
    }
  });

  return new ValidationResult({
    acceptedRecords,
    rejectedRecords,
    warningRecords,
    validationErrors,
  });
}
