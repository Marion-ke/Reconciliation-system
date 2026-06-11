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

            eventId: record.payload.event_id,

            reasonCode: REASON_CODES.DUPLICATE_EVENT_ID,

            severity: SEVERITY.ERROR,

            message: `Duplicate event id: ${eventId}`,

            sourceValue: eventId,

            expectedRule: "Each event_id must be unique.",

            recommendedNextAction:
              "Remove or correct duplicate event identifiers.",
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

            eventId: record.payload.event_id,

            reasonCode: REASON_CODES.MISSING_REQUIRED_FIELD,

            severity: SEVERITY.ERROR,

            message: `${field} is required`,

            sourceValue: value,

            expectedRule: `${field} must be present and non-empty.`,

            recommendedNextAction: `Populate the ${field} field before processing.`,
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

          eventId: record.payload.event_id,

          reasonCode: REASON_CODES.MISSING_ACTOR_ROLE,

          severity: SEVERITY.ERROR,

          message: "Actor role is required",

          sourceValue: record.payload.actor_role,

          expectedRule:
            "actor_role is required for authorization and validation.",

          recommendedNextAction: "Provide a valid actor role.",
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

          eventId: record.payload.event_id,

          reasonCode: REASON_CODES.INVALID_TIMESTAMP,

          severity: SEVERITY.ERROR,

          message: "Invalid occurred_at timestamp",

          sourceValue: record.payload.occurred_at,

          expectedRule: "occurred_at must be a valid ISO-8601 timestamp.",

          recommendedNextAction:
            "Provide a valid timestamp in ISO-8601 format.",
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

          eventId: record.payload.event_id,

          reasonCode: REASON_CODES.UNKNOWN_EVENT_TYPE,

          severity: SEVERITY.ERROR,

          message: `Unknown event type: ${eventType}`,

          sourceValue: eventType,
          expectedRule: "event_type must exist in the policy definition.",

          recommendedNextAction:
            "Use a supported event type or update the policy configuration.",
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

          eventId: record.payload.event_id,

          reasonCode: REASON_CODES.UNKNOWN_ASSET,

          severity: SEVERITY.ERROR,

          message: `Unknown asset: ${assetId}`,

          sourceValue: assetId,

          expectedRule: "asset_id must reference an asset in inventory.csv.",

          recommendedNextAction:
            "Correct the asset identifier or add the asset to inventory.",
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

            eventId: record.payload.event_id,

            reasonCode: REASON_CODES.INVALID_CONDITION,

            severity: SEVERITY.ERROR,

            message: `Invalid condition: ${condition}`,

            sourceValue: condition,

            expectedRule:
              "condition_report must be one of the policy-approved values.",

            recommendedNextAction:
              "Use a valid condition value defined in policy.json.",
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
    const occurredAt = Date.parse(record.payload.occurred_at);

    const receivedAt = Date.parse(record.payload.received_at);

    if (!Number.isNaN(occurredAt) && !Number.isNaN(receivedAt)) {
      const hoursDifference = (receivedAt - occurredAt) / (1000 * 60 * 60);

      // More than 48 hours late
      if (hoursDifference > 48) {
        errors.push(
          new ValidationError({
            errorId: crypto.randomUUID(),

            rawRecordId: record.rawRecordId,

            eventId: record.payload.event_id,

            reasonCode: REASON_CODES.LATE_ARRIVAL,

            severity: SEVERITY.WARNING,

            message: `Late arriving event (${Math.round(hoursDifference)} hours)`,

            sourceValue: record.payload.received_at,

            expectedRule:
              "Events should arrive within the configured lateness threshold.",

            recommendedNextAction:
              "Investigate delayed event delivery from the source system.",
          }),
        );
      }
    }
  });

  return errors;
}
