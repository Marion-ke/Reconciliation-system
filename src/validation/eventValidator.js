import crypto from "crypto";

import ValidationError from "../domain/ValidationError.js";

import { REASON_CODES, SEVERITY } from "./reasonCodes.js";

/**
 * Required event fields based on
 * the Packet 01 event contract.
 */
const REQUIRED_FIELDS = [
  "event_id",
  "occurred_at",
  "received_at",
  "actor_id",
  "event_type",
  "asset_id",
];

/**
 * Validate event raw records.
 *
 * Current validations:
 * - Duplicate event ids
 * - Required fields
 * - Missing actor role
 * - Invalid timestamps
 */
export function validateEvents(rawRecords, policy, inventoryRawRecords) {
  const errors = [];

  /**
   * Stores all event ids already seen.
   * Used to detect duplicates.
   */
  const seenEventIds = new Set();
  /**
   * Build a set of valid asset ids
   * from inventory.
   */
  const validAssetIds = new Set(
    inventoryRawRecords.map((record) => record.payload.asset_id),
  );

  rawRecords.forEach((record) => {
    /**
     * -----------------------------------
     * Duplicate Event ID Validation
     * -----------------------------------
     */
    const eventId = record.payload.event_id;

    if (eventId) {
      if (seenEventIds.has(eventId)) {
        errors.push(
          new ValidationError({
            errorId: crypto.randomUUID(),

            rawRecordId: record.rawRecordId,

            reasonCode: REASON_CODES.DUPLICATE_EVENT_ID,

            severity: SEVERITY.ERROR,

            message: `Duplicate event id: ${eventId}`,

            sourceValue: eventId,
          }),
        );
      } else {
        seenEventIds.add(eventId);
      }
    }

    /**
     * -----------------------------------
     * Required Field Validation
     * -----------------------------------
     */
    REQUIRED_FIELDS.forEach((field) => {
      const value = record.payload[field];

      if (!value) {
        errors.push(
          new ValidationError({
            errorId: crypto.randomUUID(),

            rawRecordId: record.rawRecordId,

            reasonCode: REASON_CODES.MISSING_REQUIRED_FIELD,

            severity: SEVERITY.ERROR,

            message: `${field} is required`,

            sourceValue: value,
          }),
        );
      }
    });

    /**
     * -----------------------------------
     * Actor Role Validation
     * -----------------------------------
     */
    if (!record.payload.actor_role) {
      errors.push(
        new ValidationError({
          errorId: crypto.randomUUID(),

          rawRecordId: record.rawRecordId,

          reasonCode: REASON_CODES.MISSING_ACTOR_ROLE,

          severity: SEVERITY.ERROR,

          message: "Actor role is required",

          sourceValue: record.payload.actor_role,
        }),
      );
    }

    /**
     * -----------------------------------
     * Timestamp Validation
     * -----------------------------------
     *
     * Example invalid value:
     * INVALID_DATE
     */
    if (
      record.payload.occurred_at &&
      Number.isNaN(Date.parse(record.payload.occurred_at))
    ) {
      errors.push(
        new ValidationError({
          errorId: crypto.randomUUID(),

          rawRecordId: record.rawRecordId,

          reasonCode: REASON_CODES.INVALID_TIMESTAMP,

          severity: SEVERITY.ERROR,

          message: "Invalid occurred_at timestamp",

          sourceValue: record.payload.occurred_at,
        }),
      );
    }
    /**
     * -----------------------------------
     * Event Type Validation
     * -----------------------------------
     *
     * Event types must exist in policy.
     */
    const eventType = record.payload.event_type;

    const allowedEventTypes = Object.keys(policy.eventDefinitions);

    if (eventType && !allowedEventTypes.includes(eventType)) {
      errors.push(
        new ValidationError({
          errorId: crypto.randomUUID(),

          rawRecordId: record.rawRecordId,

          reasonCode: REASON_CODES.UNKNOWN_EVENT_TYPE,

          severity: SEVERITY.ERROR,

          message: `Unknown event type: ${eventType}`,

          sourceValue: eventType,
        }),
      );
    }
    /**
     * -----------------------------------
     * Asset Validation
     * -----------------------------------
     *
     * Every event must reference
     * a known inventory asset.
     */
    const assetId = record.payload.asset_id;

    if (assetId && !validAssetIds.has(assetId)) {
      errors.push(
        new ValidationError({
          errorId: crypto.randomUUID(),

          rawRecordId: record.rawRecordId,

          reasonCode: REASON_CODES.UNKNOWN_ASSET,

          severity: SEVERITY.ERROR,

          message: `Unknown asset: ${assetId}`,

          sourceValue: assetId,
        }),
      );
    }
    /**
     * -----------------------------------
     * Condition Validation
     * -----------------------------------
     *
     * If a condition is supplied,
     * it must be one of the policy
     * approved condition values.
     */
    const condition = record.payload.condition_report;

    if (condition) {
      const allowedConditions = policy.allowedConditions;

      if (!allowedConditions.includes(condition)) {
        errors.push(
          new ValidationError({
            errorId: crypto.randomUUID(),

            rawRecordId: record.rawRecordId,

            reasonCode: REASON_CODES.INVALID_CONDITION,

            severity: SEVERITY.ERROR,

            message: `Invalid condition: ${condition}`,

            sourceValue: condition,
          }),
        );
      }
    }
    /**
 * -----------------------------------
 * Late Arrival Validation
 * -----------------------------------
 *
 * Events arriving significantly after
 * they occurred are flagged as warnings.
 */
const occurredAt =
  Date.parse(
    record.payload.occurred_at
  );

const receivedAt =
  Date.parse(
    record.payload.received_at
  );

if (
  !Number.isNaN(occurredAt) &&
  !Number.isNaN(receivedAt)
) {

  const hoursDifference =
    (receivedAt - occurredAt)
    / (1000 * 60 * 60);

  // More than 48 hours late
  if (hoursDifference > 48) {

    errors.push(
      new ValidationError({
        errorId:
          crypto.randomUUID(),

        rawRecordId:
          record.rawRecordId,

        reasonCode:
          REASON_CODES.LATE_ARRIVAL,

        severity:
          SEVERITY.WARNING,

        message:
          `Late arriving event (${Math.round(hoursDifference)} hours)`,

        sourceValue:
          record.payload.received_at,
      })
    );

  }

}
  });

  return errors;
}
