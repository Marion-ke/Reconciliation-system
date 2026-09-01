# State Transition Table

## Overview

The Reconciliation Intelligence System implements an explicit finite state machine (FSM) to control how assets move between operational states.

State transitions are evaluated using the current asset state, event type, actor permissions, policy rules, and deterministic event ordering.

Only transitions permitted by the active policy are allowed to mutate the authoritative asset ledger. Events that violate transition or business rules are rejected or routed for review without incorrectly mutating asset state.

---

# Valid State Transitions

| Current State | Event Type | Next State | Normal Decision |
|---|---|---|---|
| AVAILABLE | CHECKOUT | CHECKED_OUT | ACCEPTED |
| CHECKED_OUT | RETURN | AVAILABLE | ACCEPTED |
| AVAILABLE | MAINTENANCE_OPEN | MAINTENANCE | ACCEPTED |
| MAINTENANCE | MAINTENANCE_CLOSE | AVAILABLE | ACCEPTED |
| AVAILABLE | TRANSFER_OUT | IN_TRANSIT | ACCEPTED |
| IN_TRANSIT | TRANSFER_IN | AVAILABLE | ACCEPTED |
| AVAILABLE | RETIRE | RETIRED | ACCEPTED |
| CHECKED_OUT | AUDIT_OBSERVATION | CHECKED_OUT | REVIEW_REQUIRED |
| AVAILABLE | AUDIT_OBSERVATION | AVAILABLE | WARNING_ONLY |
| MAINTENANCE | AUDIT_OBSERVATION | MAINTENANCE | REVIEW_REQUIRED |
| RETIRED | AUDIT_OBSERVATION | RETIRED | REVIEW_REQUIRED |

The transition outcome may additionally be affected by actor permissions, holder validation, location rules, checkout limits, condition rules, and other active policy constraints.

---

# Return-Specific Policy Rules

`RETURN` events have additional policy evaluation beyond the basic `CHECKED_OUT → AVAILABLE` transition.

### Return Within Grace Period

When a return occurs after its due time but within the configured late-return grace period, the event remains a valid state transition:

| Current State | Event Type | Next State | Decision | Reason Code |
|---|---|---|---|---|
| CHECKED_OUT | RETURN | AVAILABLE | ACCEPTED_WITH_WARNING | LATE_RETURN_WITHIN_GRACE_PERIOD |

The warning records the lateness while allowing the asset to transition to `AVAILABLE`.

### Return Beyond Grace Period

When a return exceeds the configured grace period:

| Current State | Event Type | Next State | Decision | Reason Code |
|---|---|---|---|---|
| CHECKED_OUT | RETURN | CHECKED_OUT | REVIEW_REQUIRED | LATE_RETURN_BEYOND_GRACE_PERIOD |

The event is routed for review rather than being automatically accepted into the normal return transition.

This distinction is important because the late-return rule is policy-driven and is separate from the basic state-transition definition.

---

# Illegal Transitions

Examples of invalid state/event combinations include:

| Current State | Event Type |
|---|---|
| CHECKED_OUT | CHECKOUT |
| MAINTENANCE | CHECKOUT |
| AVAILABLE | RETURN |
| RETIRED | CHECKOUT |
| RETIRED | RETIRE |
| MAINTENANCE | RETURN |

Illegal transitions are rejected and must not mutate the authoritative asset ledger.

---

# Business Rule Failures

An event can also fail even when the state/event combination is otherwise valid.

Examples include:

- Holder mismatch
- Unauthorized actor role
- Checkout limit exceeded
- Invalid location
- Invalid condition
- Unknown asset
- Policy violation
- Invalid event data

These conditions are evaluated before the corresponding state mutation is accepted.

For example, a `RETURN` from `CHECKED_OUT` is normally valid, but a holder mismatch causes the event to be rejected rather than allowing the state transition.

---

# Audit Observations

`AUDIT_OBSERVATION` is treated as an observation/reconciliation event rather than a normal state-changing operation.

Depending on the current state and reconciliation result:

- Matching observations may produce no state change.
- Discrepant observations may produce `REVIEW_REQUIRED`.
- Warning-only observations retain the current state.
- Audit discrepancies may generate exception cases for investigation.

The audit process therefore preserves the authoritative ledger while making discrepancies visible for reconciliation.

---

# Exception and Resolution Behavior

Events that produce:

- `REJECTED`
- `REVIEW_REQUIRED`
- `WARNING_ONLY`
- `ACCEPTED_WITH_WARNING`

may generate exception or warning records according to the reconciliation and exception-queue rules.

Exception resolution is handled separately from the core FSM.

### Manual Resolution

A reviewable exception can be manually resolved through the API when valid resolution information and an authorized actor role are supplied.

Resolution changes the exception lifecycle status to `RESOLVED` and records the resolver, resolution, and resolution timestamp for auditability.

### Automated Resolution

Eligible exceptions may be automatically resolved when the active policy explicitly permits automated resolution.

Exceptions outside the configured automation conditions remain available for review.

---

# Integration Events

The system also supports integration-oriented event types such as:

- `WEBHOOK_ACK`
- `AUTO_RESOLUTION_APPLIED`

These events provide integration and audit evidence and do not represent ordinary asset-state transitions such as checkout, return, maintenance, or transfer.

Their processing is governed by the active policy and reconciliation rules.

---

# State Machine Principles

- Every authoritative state mutation must correspond to a permitted transition.
- Rejected events must not modify the authoritative asset ledger.
- Review-required events do not automatically perform the normal state transition.
- Warning-only events preserve the current asset state unless policy explicitly permits a state change.
- Accepted-with-warning events may mutate state while recording the associated warning.
- Late-return behavior is determined by the configured policy grace period.
- Holder and authorization rules are enforced before a state-changing event is accepted.
- Exception resolution is tracked separately from asset-state transitions.
- Automated resolution is policy-driven and auditable.
- Every reconciliation decision is deterministic and reproducible.

---

# Business Rule Enforcement

State transitions are evaluated together with:

- Actor permissions
- Checkout limits
- Holder validation
- Location validation
- Asset condition rules
- Due dates and late-return rules
- Policy version
- Event ordering
- Exception and resolution rules

This ensures that the reconciliation engine does not treat a syntactically valid event as automatically valid from a business perspective.

The state-transition model therefore provides the foundation for deterministic asset-state reconstruction while the surrounding policy and reconciliation layers determine whether each proposed transition is actually permitted.