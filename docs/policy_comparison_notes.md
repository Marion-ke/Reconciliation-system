# Policy Version Comparison

## 1. Overview

The Reconciliation Intelligence System supports multiple policy versions so that
reconciliation decisions remain traceable to the policy that was active when
the decision was made.

This comparison evaluates the same event dataset against:

- Policy version 1.0.0
- Policy version 2.0.0

The comparison uses the same inventory and event records for both policy
versions. This isolates the effect of policy changes from changes in the input
data.

## 2. Policy Versions

| Version | Description                                                                              |
| ------- | ---------------------------------------------------------------------------------------- |
| 1.0.0   | Original policy version used as the baseline.                                            |
| 2.0.0   | Updated policy introducing additional operational event and source-reconciliation rules. |

The current production reconciliation run uses policy version 2.0.0.

## 3. Meaningful Changes Introduced in Policy 2.0.0

Policy version 2.0.0 introduces additional rules that were not available in
version 1.0.0.

### Operational transfer events

Version 2.0.0 supports:

- `TRANSFER_OUT`
- `TRANSFER_IN`

Under version 1.0.0 these event types were treated as unknown event types.

For example, event `e053` is rejected under version 1.0.0 but accepted under
version 2.0.0 because `TRANSFER_OUT` is supported by the newer policy.

Event `e054` demonstrates the corresponding `TRANSFER_IN` behavior.

### Maintenance lifecycle events

Version 2.0.0 supports:

- `MAINTENANCE_OPEN`
- `MAINTENANCE_CLOSE`

These events allow the reconciliation engine to represent the maintenance
lifecycle explicitly.

For example, events `e056` and `e057` are rejected under version 1.0.0
because the event types are unknown, while version 2.0.0 accepts the
corresponding maintenance transitions.

### Reservation events

Version 2.0.0 introduces reservation-related behavior including:

- `RESERVE`
- `CANCEL_RESERVATION`

The newer policy allows reservation creation to be evaluated as a
reconciliation operation instead of treating `RESERVE` as an unknown event
type.

For example, event `e101` is rejected under version 1.0.0 but accepted under
version 2.0.0 as a reservation creation event.

Version 2.0.0 also applies reservation-specific rules to assets that cannot
satisfy reservations.

### Audit observation behavior

Version 2.0.0 introduces explicit audit-observation handling.

Audit observations can result in outcomes such as:

- `WARNING_ONLY`
- `REVIEW_REQUIRED`

rather than being rejected solely because the auditor role is not an
operational actor role.

For example, event `e055` changes from `REJECTED` under version 1.0.0 to
`WARNING_ONLY` under version 2.0.0.

Event `e058` changes from `REJECTED` to `REVIEW_REQUIRED`.

### Manual correction behavior

Version 2.0.0 introduces explicit manual-correction evaluation and evidence
requirements.

A manual correction must satisfy the authorization and evidence rules before
it can be applied.

For example, event `e104` remains rejected under both versions, but the
reason becomes more specific under version 2.0.0:

- Version 1.0.0: `UNKNOWN_EVENT_TYPE`
- Version 2.0.0: `MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE`

This demonstrates that policy evolution can change the explanation and
classification of a decision even when the final decision remains rejected.

## 4. Evidence of Behavioral Change

The comparison was performed using the same:

- 150 input events
- inventory dataset
- event ordering
- reconciliation process

The comparison produced:

| Metric                            | Result |
| --------------------------------- | -----: |
| Policy version 1                  |  1.0.0 |
| Policy version 2                  |  2.0.0 |
| Input events                      |    150 |
| Total differences                 |     89 |
| Changed decisions/outcomes        |     58 |
| Required minimum changed outcomes |      8 |

The system therefore exceeds the required minimum of eight policy-dependent
behavior changes.

The generated evidence is stored in:

`outputs/latest/policy_decision_difference.csv`

The report identifies the event, asset, event type, policy versions,
decisions, reason codes, states, and messages for each comparison.

## 5. Examples of Changed Outcomes

### Transfer

Event `e053`:

| Policy | Decision | Reason                   |
| ------ | -------- | ------------------------ |
| 1.0.0  | REJECTED | UNKNOWN_EVENT_TYPE       |
| 2.0.0  | ACCEPTED | STATE_TRANSITION_ALLOWED |

The event therefore demonstrates a direct policy-dependent decision change.

### Maintenance

Event `e056`:

| Policy | Decision | Reason                   |
| ------ | -------- | ------------------------ |
| 1.0.0  | REJECTED | UNKNOWN_EVENT_TYPE       |
| 2.0.0  | ACCEPTED | STATE_TRANSITION_ALLOWED |

The newer policy recognizes the maintenance lifecycle event.

### Reservation

Event `e101`:

| Policy | Decision | Reason              |
| ------ | -------- | ------------------- |
| 1.0.0  | REJECTED | UNKNOWN_EVENT_TYPE  |
| 2.0.0  | ACCEPTED | RESERVATION_CREATED |

This demonstrates the introduction of reservation-aware reconciliation.

### Audit

Event `e055`:

| Policy | Decision     | Reason             |
| ------ | ------------ | ------------------ |
| 1.0.0  | REJECTED     | UNKNOWN_ACTOR_ROLE |
| 2.0.0  | WARNING_ONLY | AUDIT_DISCREPANCY  |

This demonstrates the newer policy's explicit treatment of audit observations.

## 6. Backward Traceability

Every reconciliation run records the policy version used for that run.

The run metadata therefore allows a historical decision to be associated with
the policy version that produced it.

The current run records policy version `2.0.0`.

The policy comparison report independently records both `1.0.0` and `2.0.0`,
allowing reviewers to determine how the same input would have been handled
under each policy version.

This prevents policy evolution from silently changing the interpretation of
historical runs.

## 7. Compatibility Layer

Policy version 1.0.0 uses an older representation for some policy rules,
while the current reconciliation engine uses the common policy interface.

A small policy adapter translates legacy policy fields into the common
interface required by the shared decision engine.

The adapter does not define new business rules. It only provides structural
compatibility so that the original policy can be evaluated by the same
reconciliation engine.

Policy version 2.0.0 already uses the current policy representation.

This allows both policy versions to be compared using the same reconciliation
logic while preserving their original policy semantics.

## 8. Conclusion

Policy version 2.0.0 represents a meaningful evolution of the reconciliation
policy rather than a cosmetic version change.

The same 150-event dataset produced 58 changed decisions and 89 total
differences between the two policy versions.

The generated comparison report provides event-level evidence of these
changes, while persisted run metadata preserves the policy version associated
with each reconciliation run.
