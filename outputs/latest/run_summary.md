# Reconciliation Run Summary

## Run

- Run ID: run-20260901195010485-d213e1f5
- Policy Version: 2.0.0
- Status: COMPLETED
- Started At: 2026-09-01T19:50:10.485Z
- Completed At: 2026-09-01T19:50:12.917Z
- Input Hash: a006301918ee52433f0ab7b7fd44096488a227aeaa6294e7d2f5ea1bee5365cb

## Input Sources

- inventory.csv: 55
- events.csv: 250
- reservations.csv: 30
- audit_observations.csv: 20
- manual_corrections.csv: 12

## Processing

- Inventory Records: 55
- Canonical Events: 245
- Processed Events: 245

## Decisions

- Processed: 245
- ACCEPTED: 130
- ACCEPTED_WITH_WARNING: 21
- REJECTED: 86
- REVIEW_REQUIRED: 17
- WARNING_ONLY: 12

## Severity

- ERROR: 86
- INFO: 109
- WARNING: 50

## Event Types

- AUDIT_OBSERVATION: 51
- AUTO_RESOLUTION_APPLIED: 10
- CANCEL_RESERVATION: 9
- CHECKOUT: 51
- MAINTENANCE_CLOSE: 16
- MAINTENANCE_OPEN: 7
- MANUAL_CORRECTION: 11
- RESERVE: 19
- RETIRE: 1
- RETURN: 50
- TRANSFER_IN: 6
- TRANSFER_OUT: 4
- WEBHOOK_ACK: 10

## Exceptions

- Total Exception Cases: 168
- Rejected Events: 86
- Events Requiring Manual Review: 17
- Warning-Only Events: 12
- Accepted With Warning: 21
- Audit Discrepancies Detected: 20

## Major Findings

- 86 events were rejected during reconciliation.
- 17 events require manual review.
- 12 warning-only outcomes were generated.
- 21 events were accepted with warning.
- 20 audit discrepancies were detected.
- Policy versions 1.0.0 and 2.0.0 produced 165 total differences.
- 115 reconciliation outcomes changed between the two policy versions.

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
- outputs/latest/auto_resolution_summary.csv
- outputs/latest/webhook_dispatch_log.csv