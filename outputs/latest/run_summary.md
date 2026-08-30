# Reconciliation Run Summary

## Run

- Run ID: run-20260830065957581-374abf52
- Policy Version: 2.0.0
- Status: COMPLETED
- Started At: 2026-08-30T06:59:57.581Z
- Completed At: 2026-08-30T06:59:59.287Z
- Input Hash: bb3ec6aef36f59daf14161ca5d5bf169068639f7131d026f3b94cc90408f53a6

## Input Sources

- inventory.csv: 25
- events.csv: 150
- reservations.csv: 30
- audit_observations.csv: 20
- manual_corrections.csv: 12

## Processing

- Inventory Records: 25
- Canonical Events: 145
- Processed Events: 145

## Decisions

- Processed: 145
- ACCEPTED: 78
- ACCEPTED_WITH_WARNING: 1
- REJECTED: 53
- REVIEW_REQUIRED: 12
- WARNING_ONLY: 2

## Severity

- ERROR: 53
- INFO: 77
- WARNING: 15

## Event Types

- AUDIT_OBSERVATION: 14
- CANCEL_RESERVATION: 8
- CHECKOUT: 39
- MAINTENANCE_CLOSE: 15
- MAINTENANCE_OPEN: 6
- MANUAL_CORRECTION: 9
- RESERVE: 17
- RETIRE: 1
- RETURN: 28
- TRANSFER_IN: 5
- TRANSFER_OUT: 3

## Exceptions

- Total Exception Cases: 100
- Rejected Events: 53
- Events Requiring Manual Review: 12
- Warning-Only Events: 2
- Accepted With Warning: 1
- Audit Discrepancies Detected: 20

## Major Findings

- 53 events were rejected during reconciliation.
- 12 events require manual review.
- 2 warning-only outcomes were generated.
- 1 events were accepted with warning.
- 20 audit discrepancies were detected.
- Policy versions 1.0.0 and 2.0.0 produced 89 total differences.
- 58 reconciliation outcomes changed between the two policy versions.

## Generated Outputs

- outputs/latest/canonical_events.csv
- outputs/latest/event_decisions.csv
- outputs/latest/exception_queue.csv
- outputs/latest/final_asset_state.csv
- outputs/latest/validation_errors.csv
- outputs/latest/run_summary.md
- outputs/latest/data_profile.md
- outputs/latest/ingestion_summary.md
- outputs/latest/reservation_report.csv
- outputs/latest/manual_correction_audit.csv
- outputs/latest/source_conflict_report.csv
- outputs/latest/asset_state_report.csv
- outputs/latest/policy_breach_summary.csv
- outputs/latest/database_snapshot_notes.md
- outputs/latest/policy_decision_difference.csv