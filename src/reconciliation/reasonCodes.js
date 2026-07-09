/**
 * Stable reconciliation reason codes.
 *
 * These codes are defined by the Week 3–4 specification.
 */

export const REASON_CODES = {
  // Success
  STATE_TRANSITION_ALLOWED: "STATE_TRANSITION_ALLOWED",

  // Validation
  DUPLICATE_EVENT_ID: "DUPLICATE_EVENT_ID",
  UNKNOWN_ASSET: "UNKNOWN_ASSET",
  UNAUTHORIZED_ACTION: "UNAUTHORIZED_ACTION",

  // State machine
  ILLEGAL_STATE_TRANSITION: "ILLEGAL_STATE_TRANSITION",

  // Policy
  LIMIT_EXCEEDED: "LIMIT_EXCEEDED",

  // Holder validation
  HOLDER_MISMATCH: "HOLDER_MISMATCH",

  // Condition
  CONDITION_DOWNGRADE: "CONDITION_DOWNGRADE",

  // Audit
  AUDIT_DISCREPANCY: "AUDIT_DISCREPANCY",

  // Ordering
  LATE_EVENT: "LATE_EVENT",

  // Evidence conflict
  SOURCE_CONFLICT: "SOURCE_CONFLICT",
};
