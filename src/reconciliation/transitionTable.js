//**
//  * Defines all legal asset state transitions.
//  *
//  * This table ONLY defines legal state changes.
//  * Business rule validation is handled by the
//  * decision engine.
//  */

export const TRANSITION_TABLE = {
  AVAILABLE: {
    CHECKOUT: "CHECKED_OUT",
    TRANSFER_OUT: "IN_TRANSIT",
    MAINTENANCE_OPEN: "MAINTENANCE",
    AUDIT_OBSERVATION: "AVAILABLE",
    RETIRE: "RETIRED",
  },

  CHECKED_OUT: {
    RETURN: "AVAILABLE",
    AUDIT_OBSERVATION: "CHECKED_OUT",
  },

  IN_TRANSIT: {
    TRANSFER_IN: "AVAILABLE",
    AUDIT_OBSERVATION: "IN_TRANSIT",
  },

  MAINTENANCE: {
    MAINTENANCE_CLOSE: "AVAILABLE",
    AUDIT_OBSERVATION: "MAINTENANCE",
  },

  RETIRED: {
    AUDIT_OBSERVATION: "RETIRED",
  },
};
