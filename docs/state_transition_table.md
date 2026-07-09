# State Transition Table

## Overview

The Reconciliation Intelligence System implements an explicit finite state machine (FSM) to control how assets move between operational states.

Only transitions defined below are permitted. Any event that attempts an undefined transition is rejected and recorded in the exception queue.

---

# Valid State Transitions

| Current State | Event Type        | Next State  | Decision        |
| ------------- | ----------------- | ----------- | --------------- |
| AVAILABLE     | CHECKOUT          | CHECKED_OUT | ACCEPTED        |
| CHECKED_OUT   | RETURN            | AVAILABLE   | ACCEPTED        |
| AVAILABLE     | MAINTENANCE_OPEN  | MAINTENANCE | ACCEPTED        |
| MAINTENANCE   | MAINTENANCE_CLOSE | AVAILABLE   | ACCEPTED        |
| AVAILABLE     | TRANSFER_OUT      | IN_TRANSIT  | ACCEPTED        |
| IN_TRANSIT    | TRANSFER_IN       | AVAILABLE   | ACCEPTED        |
| AVAILABLE     | RETIRE            | RETIRED     | ACCEPTED        |
| CHECKED_OUT   | AUDIT_OBSERVATION | CHECKED_OUT | REVIEW_REQUIRED |
| AVAILABLE     | AUDIT_OBSERVATION | AVAILABLE   | WARNING_ONLY    |
| MAINTENANCE   | AUDIT_OBSERVATION | MAINTENANCE | REVIEW_REQUIRED |
| RETIRED       | AUDIT_OBSERVATION | RETIRED     | REVIEW_REQUIRED |

---

# Illegal Transitions

Examples of invalid transitions include:

| Current State | Event    |
| ------------- | -------- |
| CHECKED_OUT   | CHECKOUT |
| MAINTENANCE   | CHECKOUT |
| AVAILABLE     | RETURN   |
| RETIRED       | CHECKOUT |
| RETIRED       | RETIRE   |
| MAINTENANCE   | RETURN   |

Illegal transitions are rejected and do not mutate the asset ledger.

---

# State Machine Principles

- Every accepted event results in a legal state transition.
- Rejected events never modify the authoritative ledger.
- Review-required events do not mutate state unless explicitly allowed by policy.
- Warning-only events record observations without changing asset state.
- Every transition is deterministic and reproducible.

---

# Business Rule Enforcement

State transitions are evaluated together with:

- Actor permissions
- Checkout limits
- Holder validation
- Asset condition rules
- Policy version
- Event ordering

This ensures reconciliation decisions remain deterministic and policy compliant.
