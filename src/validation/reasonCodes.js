/**
 * Central catalog of validation reason codes.
 *
 * Using constants avoids hardcoding strings
 * throughout the application.
 */
export const REASON_CODES = {
  // Required identifier missing
  MISSING_ID: "MISSING_ID",

  // Mandatory field missing or empty
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Timestamp cannot be parsed
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",

  // Event ID appears more than once
  DUPLICATE_EVENT_ID: "DUPLICATE_EVENT_ID",

  // Event type not defined in policy
  UNKNOWN_EVENT_TYPE: "UNKNOWN_EVENT_TYPE",

  // Asset not found in inventory
  UNKNOWN_ASSET: "UNKNOWN_ASSET",

  // Condition value not allowed
  INVALID_CONDITION: "INVALID_CONDITION",

  // Actor role missing
  MISSING_ACTOR_ROLE: "MISSING_ACTOR_ROLE",

  LATE_ARRIVAL: "LATE_ARRIVAL",
};

/**
 * Validation severity levels.
 */
export const SEVERITY = {
  // Record should not proceed
  ERROR: "ERROR",

  // Record may proceed but requires attention
  WARNING: "WARNING",
};
