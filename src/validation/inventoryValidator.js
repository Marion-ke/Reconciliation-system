import crypto from "crypto";

import ValidationError from "../domain/validationError.js";

import { REASON_CODES, SEVERITY } from "./reasonCodes.js";

/*
 Minimum required fields for inventory records.
 If any of these are missing,
 the record cannot be trusted.
 */
const REQUIRED_FIELDS = [
  "asset_id",
  "asset_type",
  "condition",
  "status",
  "location_id",
];

/**
  Validate inventory raw records.
 
  Current responsibility:
  - Check required fields
 
  Future versions will also validate:
  - Allowed asset types
  - Allowed statuses
  - Allowed conditions
 */
export function validateInventory(rawRecords) {
  const errors = [];

  rawRecords.forEach((record) => {
    REQUIRED_FIELDS.forEach((field) => {
      const value = record.payload[field];

      /*
       Empty string, undefined,
       or null are considered missing.
       */
      if (!value) {
        errors.push(
          new ValidationError({
            // Generate unique error id
            errorId: `${record.rawRecordId}-${REASON_CODES.MISSING_REQUIRED_FIELD}`,

            // Link error to raw record
            rawRecordId: record.rawRecordId,

            reasonCode: REASON_CODES.MISSING_REQUIRED_FIELD,

            severity: SEVERITY.ERROR,

            message: `${field} is required`,

            sourceValue: value,
          }),
        );
      }
    });
  });

  return errors;
}
