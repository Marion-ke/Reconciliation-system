export const mockPolicy = {
  policyVersion: "2.0.0",

  eventDefinitions: {
    CHECKOUT: {},
    RETURN: {},
    TRANSFER_OUT: {},
    TRANSFER_IN: {},
    MAINTENANCE_OPEN: {},
    MAINTENANCE_CLOSE: {},
    AUDIT_OBSERVATION: {},
    RETIRE: {},
    RESERVE: {},
    CANCEL_RESERVATION: {},
    MANUAL_CORRECTION: {},
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
    student: ["CHECKOUT", "RETURN", "RESERVE", "CANCEL_RESERVATION"],

    staff: [
      "CHECKOUT",
      "RETURN",
      "TRANSFER_OUT",
      "TRANSFER_IN",
      "RESERVE",
      "CANCEL_RESERVATION",
      "MANUAL_CORRECTION",
    ],

    technician: ["MAINTENANCE_OPEN", "MAINTENANCE_CLOSE", "AUDIT_OBSERVATION"],

    auditor: ["AUDIT_OBSERVATION"],

    admin: [
      "CHECKOUT",
      "RETURN",
      "TRANSFER_OUT",
      "TRANSFER_IN",
      "MAINTENANCE_OPEN",
      "MAINTENANCE_CLOSE",
      "AUDIT_OBSERVATION",
      "RETIRE",
      "RESERVE",
      "CANCEL_RESERVATION",
      "MANUAL_CORRECTION",
    ],
  },
  checkoutLimits: {
    student: 2,
    staff: 5,
    technician: 3,
    auditor: 0,
    admin: 999,
  },

  conditionSeverityRanking: {
    new: 0,
    good: 1,
    worn: 2,
    scratched: 3,
    damaged: 4,
    unusable: 5,
  },

  lateEventPolicy: {
    enabled: true,
    thresholdHours: 24,
    decision: "ACCEPTED_WITH_WARNING",
  },

  transitionTable: {
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
    RESERVE: {
      requiresActor: true,
      requiresLocation: true,
      allowedStates: ["AVAILABLE", "CHECKED_OUT"],
    },
    IN_TRANSIT: {
      TRANSFER_IN: "AVAILABLE",
      AUDIT_OBSERVATION: "IN_TRANSIT",
    },

    CANCEL_RESERVATION: {
      requiresActor: true,
      requiresLocation: false,
      allowedStates: ["AVAILABLE", "CHECKED_OUT"],
    },

    MANUAL_CORRECTION: {
      requiresActor: true,
      requiresLocation: false,
      allowedStates: ["AVAILABLE", "CHECKED_OUT", "IN_TRANSIT", "MAINTENANCE"],
    },

    MAINTENANCE: {
      MAINTENANCE_CLOSE: "AVAILABLE",
      AUDIT_OBSERVATION: "MAINTENANCE",
    },

    RETIRED: {},
  },
};
