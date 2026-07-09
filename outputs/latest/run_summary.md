# Reconciliation Run Summary

Policy Version: 2.0.0

## Input

Inventory Records: 25
Canonical Events: 95
Processed Events: 95

## Decisions

ACCEPTED: 53
REJECTED: 27
ACCEPTED_WITH_WARNING: 1
WARNING_ONLY: 2
REVIEW_REQUIRED: 12

## Severity

INFO: 53
ERROR: 27
WARNING: 15

## Event Types

AUDIT_OBSERVATION: 14
CHECKOUT: 31
MAINTENANCE_CLOSE: 15
MAINTENANCE_OPEN: 6
RETIRE: 1
RETURN: 20
TRANSFER_IN: 5
TRANSFER_OUT: 3

## Exceptions

Total Exception Cases: 41

## Notable Findings

- 95 canonical events processed.
- 53 events accepted.
- 1 events accepted with warning.
- 27 events rejected.
- 12 events require manual review.
- 2 warning-only events generated.
- 41 exception cases generated.

## Generated Outputs

outputs/latest/canonical_events.csv
outputs/latest/event_decisions.csv
outputs/latest/exception_queue.csv
outputs/latest/final_asset_state.csv
outputs/latest/validation_errors.csv
outputs/latest/run_summary.md
outputs/latest/data_profile.md
outputs/latest/ingestion_summary.md