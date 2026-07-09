import { REASON_CODES } from "./reasonCodes.js";

export const RECOMMENDED_ACTIONS = {
  [REASON_CODES.DUPLICATE_EVENT_ID]:
    "Investigate duplicate event identifiers before replay.",

  [REASON_CODES.UNKNOWN_ASSET]:
    "Verify that the asset exists in the inventory baseline.",

  [REASON_CODES.UNAUTHORIZED_ACTION]:
    "Verify actor permissions before processing the event.",

  [REASON_CODES.ILLEGAL_STATE_TRANSITION]:
    "Review the current asset state before replaying the event.",

  [REASON_CODES.LIMIT_EXCEEDED]:
    "Return an active asset or obtain an override.",

  [REASON_CODES.HOLDER_MISMATCH]:
    "Verify the current holder before processing the return.",

  [REASON_CODES.CONDITION_DOWNGRADE]: "Review the reported condition change.",

  [REASON_CODES.AUDIT_DISCREPANCY]:
    "Compare audit observations with the ledger.",

  [REASON_CODES.LATE_EVENT]: "Review late-arriving event policy.",

  [REASON_CODES.SOURCE_CONFLICT]: "Resolve conflicting evidence before replay.",
  [REASON_CODES.CONDITION_DOWNGRADE]:
    "Inspect the asset and confirm the reported condition.",
};
