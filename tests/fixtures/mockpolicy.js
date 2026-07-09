// tests/fixtures/mockPolicy.js

export const mockPolicy = {
  version: "2.0.0",

  // ---------- Packet 1–2 ----------
  eventDefinitions: {
    CHECKOUT: {},
    RETURN: {},
    TRANSFER: {},

    // ---------- Packet 3–4 ----------
    TRANSFER_OUT: {},
    TRANSFER_IN: {},
    MAINTENANCE_OPEN: {},
    MAINTENANCE_CLOSE: {},
    AUDIT_OBSERVATION: {},
    RETIRE: {},
    INSPECT: {},
    REPAIR: {},
  },

  allowedConditions: [
    "new",
    "good",
    "worn",
    "scratched",
    "damaged",
    "unusable",
  ],

  actorPermissions: {
    student: ["CHECKOUT", "RETURN"],

    staff: ["TRANSFER", "TRANSFER_OUT", "TRANSFER_IN"],

    technician: ["REPAIR", "MAINTENANCE_OPEN", "MAINTENANCE_CLOSE"],

    auditor: ["INSPECT", "AUDIT_OBSERVATION"],

    admin: ["RETIRE"],
  },

  lateEventPolicy: {
    enabled: true,
    thresholdHours: 24,
  },

  conditionRanking: {
    new: 6,
    good: 5,
    worn: 4,
    scratched: 3,
    damaged: 2,
    unusable: 1,
  },

  checkoutLimits: {
    student: 3,
    staff: 10,
    technician: 0,
    auditor: 0,
    admin: 0,
  },

  transitionTable: {
    AVAILABLE: {
      CHECKOUT: "CHECKED_OUT",
      TRANSFER: "IN_TRANSIT", // Packet 1–2
      TRANSFER_OUT: "IN_TRANSIT", // Packet 3–4
      MAINTENANCE_OPEN: "MAINTENANCE",
      INSPECT: "AVAILABLE",
      AUDIT_OBSERVATION: "AVAILABLE",
      RETIRE: "RETIRED",
    },

    CHECKED_OUT: {
      RETURN: "AVAILABLE",
      INSPECT: "CHECKED_OUT",
      AUDIT_OBSERVATION: "CHECKED_OUT",
    },

    IN_TRANSIT: {
      TRANSFER_IN: "AVAILABLE",
      INSPECT: "IN_TRANSIT",
      AUDIT_OBSERVATION: "IN_TRANSIT",
    },

    MAINTENANCE: {
      REPAIR: "AVAILABLE", // Packet 1–2
      MAINTENANCE_CLOSE: "AVAILABLE", // Packet 3–4
      AUDIT_OBSERVATION: "MAINTENANCE",
    },

    RETIRED: {},
  },
};
