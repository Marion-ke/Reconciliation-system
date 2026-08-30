export const SOURCE_AUTHORITY = {
  inventory: {
    classification: "AUTHORITATIVE",
    purpose: "Defines the baseline identity and starting state of assets.",
    conflictAction: "Reject invalid references or escalate inconsistencies.",
  },

  events: {
    classification: "AUTHORITATIVE",
    purpose: "Defines accepted operational state transitions.",
    conflictAction:
      "Apply policy validation and reject or escalate invalid transitions.",
  },

  reservations: {
    classification: "ADVISORY",
    purpose: "Represents requested or active reservations.",
    conflictAction:
      "Do not overwrite asset state; generate a reservation conflict for review.",
  },

  audits: {
    classification: "CONFIRMATORY",
    purpose: "Provides physical verification of reconciled asset state.",
    conflictAction:
      "Generate an audit discrepancy and review case; do not automatically rewrite the ledger.",
  },

  manualCorrections: {
    classification: "REVIEW_TRIGGERING",
    purpose: "Provides controlled administrative corrections.",
    conflictAction:
      "Require authorized actor, reason, and evidence; reject or escalate when controls fail.",
  },
};
