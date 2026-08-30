import ValidationError from "../domain/validationError.js";

import { REASON_CODES, SEVERITY } from "./reasonCodes.js";

/*
  Required event fields based on
  the Packet 01 event contract.
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
 */
export function validateEvents(rawRecords, policy, inventoryRawRecords) {
  const errors = [];

  /*
    Stores event IDs already seen
    to detect duplicates.
  */
  const seenEventIds = new Set();

  /*
    Build a set of valid asset IDs
    from inventory.
  */
  const validAssetIds = new Set(
    inventoryRawRecords.map((record) => record.payload.asset_id),
  );

  /*
    Read policy values safely.
    This helps maintain compatibility with
    tests that may use smaller policy objects.
  */
  const allowedEventTypes = Object.keys(policy.eventDefinitions ?? {});
  const allowedConditions = policy.allowedConditions ?? [];
  const allowedActorRoles = policy.actorRoles ?? [];

  const lateEventEnabled = policy.lateEventPolicy?.enabled ?? true;
  const lateThresholdHours = policy.lateEventPolicy?.thresholdHours ?? 48;

  rawRecords.forEach((record) => {
    const eventId = record.payload.event_id;
    const occurredAtValue = record.payload.occurred_at;
    const receivedAtValue = record.payload.received_at;
    const eventType = record.payload.event_type;
    const assetId = record.payload.asset_id;
    const actorRole = record.payload.actor_role;
    const condition = record.payload.condition_report;

    /*
      Duplicate Event ID Validation
    */
    if (eventId) {
      if (seenEventIds.has(eventId)) {
        errors.push(
          new ValidationError({
            errorId: `${record.rawRecordId}-${REASON_CODES.DUPLICATE_EVENT_ID}`,
            rawRecordId: record.rawRecordId,
            eventId,
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

    /*
      Required Field Validation
    */
    REQUIRED_FIELDS.forEach((field) => {
      const value = record.payload[field];

      if (!value) {
        errors.push(
          new ValidationError({
            errorId: `${record.rawRecordId}-${REASON_CODES.MISSING_REQUIRED_FIELD}`,
            rawRecordId: record.rawRecordId,
            eventId,
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

    /*
      Actor Role Validation
    */
    if (!actorRole) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-${REASON_CODES.MISSING_ACTOR_ROLE}`,
          rawRecordId: record.rawRecordId,
          eventId,
          reasonCode: REASON_CODES.MISSING_ACTOR_ROLE,
          severity: SEVERITY.ERROR,
          message: "Actor role is required",
          sourceValue: actorRole,
          expectedRule:
            "actor_role is required for authorization and validation.",
          recommendedNextAction: "Provide a valid actor role.",
        }),
      );
    }

    /*
      Only validate actor role against policy
      if actorRoles are available in the policy.
    */
    if (
      actorRole &&
      allowedActorRoles.length > 0 &&
      !allowedActorRoles.includes(actorRole)
    ) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-UNKNOWN_ACTOR_ROLE`,
          rawRecordId: record.rawRecordId,
          eventId,
          reasonCode: "UNKNOWN_ACTOR_ROLE",
          severity: SEVERITY.ERROR,
          message: `Unknown actor role: ${actorRole}`,
          sourceValue: actorRole,
          expectedRule: "actor_role must be one of the policy-approved roles.",
          recommendedNextAction:
            "Use a valid actor role defined in policy.json.",
        }),
      );
    }

    /*
      Timestamp Validation
    */
    if (occurredAtValue && Number.isNaN(Date.parse(occurredAtValue))) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-${REASON_CODES.INVALID_TIMESTAMP}`,
          rawRecordId: record.rawRecordId,
          eventId,
          reasonCode: REASON_CODES.INVALID_TIMESTAMP,
          severity: SEVERITY.ERROR,
          message: "Invalid occurred_at timestamp",
          sourceValue: occurredAtValue,
          expectedRule: "occurred_at must be a valid ISO-8601 timestamp.",
          recommendedNextAction:
            "Provide a valid timestamp in ISO-8601 format.",
        }),
      );
    }

    if (receivedAtValue && Number.isNaN(Date.parse(receivedAtValue))) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-INVALID_RECEIVED_TIMESTAMP`,
          rawRecordId: record.rawRecordId,
          eventId,
          reasonCode: "INVALID_RECEIVED_TIMESTAMP",
          severity: SEVERITY.ERROR,
          message: "Invalid received_at timestamp",
          sourceValue: receivedAtValue,
          expectedRule: "received_at must be a valid ISO-8601 timestamp.",
          recommendedNextAction:
            "Provide a valid timestamp in ISO-8601 format.",
        }),
      );
    }

    /*
      Event Type Validation
    */
    if (
      eventType &&
      allowedEventTypes.length > 0 &&
      !allowedEventTypes.includes(eventType)
    ) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-${REASON_CODES.UNKNOWN_EVENT_TYPE}`,
          rawRecordId: record.rawRecordId,
          eventId,
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

    /*
      Asset Validation
    */
    if (assetId && !validAssetIds.has(assetId)) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-${REASON_CODES.UNKNOWN_ASSET}`,
          rawRecordId: record.rawRecordId,
          eventId,
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

    /*
      Condition Validation
    */
    if (
      condition &&
      allowedConditions.length > 0 &&
      !allowedConditions.includes(condition)
    ) {
      errors.push(
        new ValidationError({
          errorId: `${record.rawRecordId}-${REASON_CODES.INVALID_CONDITION}`,
          rawRecordId: record.rawRecordId,
          eventId,
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

    /*
      Late Arrival Validation

      Uses the configured policy threshold
      instead of a hardcoded 48 hours.
    */
    const occurredAt = Date.parse(occurredAtValue);
    const receivedAt = Date.parse(receivedAtValue);

    if (
      lateEventEnabled &&
      !Number.isNaN(occurredAt) &&
      !Number.isNaN(receivedAt)
    ) {
      const hoursDifference = (receivedAt - occurredAt) / (1000 * 60 * 60);

      if (hoursDifference > lateThresholdHours) {
        errors.push(
          new ValidationError({
            errorId: `${record.rawRecordId}-${REASON_CODES.LATE_ARRIVAL}`,
            rawRecordId: record.rawRecordId,
            eventId,
            reasonCode: REASON_CODES.LATE_ARRIVAL,
            severity: SEVERITY.WARNING,
            message: `Late arriving event (${Math.round(hoursDifference)} hours)`,
            sourceValue: receivedAtValue,
            expectedRule: `Events should arrive within ${lateThresholdHours} hours.`,
            recommendedNextAction:
              "Investigate delayed event delivery from the source system.",
          }),
        );
      }
    }
  });

  return errors;
}
