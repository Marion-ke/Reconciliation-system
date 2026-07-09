# Test Evidence

## Overview

Automated testing was used throughout development to verify the correctness, determinism, and reliability of the reconciliation engine.

At the time of submission:

- Test Suites: 29
- Tests: 40
- Passing: 40
- Failing: 0

---

# Unit Tests

The following components are covered by automated unit tests:

## Validation

- Required fields
- Unknown asset detection
- Unknown event types
- Invalid timestamps
- Duplicate event IDs
- Missing actor role

## Reconciliation

- Decision engine
- Ledger construction
- State machine
- Transition table
- Replay ordering
- Late event detection
- Idempotent replay
- Condition ranking

## Policy

- Checkout limits
- Policy configuration

## Exporters

- Canonical events
- Event decisions
- Final asset state
- Exception queue
- Validation report
- Summary exporter
- Raw record exporter

---

# Integration Tests

Integration tests verify the complete reconciliation pipeline for:

- Packet 01
- Packet 03–04

These tests validate:

- Inventory loading
- Event loading
- Validation
- Canonical mapping
- Deterministic ordering
- Reconciliation
- Export generation

---

# Determinism

The reconciliation engine was verified to produce identical outputs when processing the same input multiple times.

Replay ordering is deterministic because canonical events are sorted using:

1. occurred_at
2. received_at
3. source priority
4. source row
5. event_id

---

# Exception Handling

Automated tests verify:

- Illegal state transitions
- Unauthorized actors
- Holder mismatches
- Audit discrepancies
- Policy violations

---

## Repeat-Run Evidence

The reconciliation engine was executed multiple times using the same inventory, policy, and event dataset.

Each execution produced identical:

- final_asset_state.csv
- event_decisions.csv
- exception_queue.csv
- run_summary.md

This demonstrates deterministic replay and idempotent reconciliation.

## Repeatability Verification

The reconciliation engine was executed multiple times using the same:

- inventory.csv
- events.csv
- policy.json

After each execution, SHA-256 hashes were generated for every file in `outputs/latest`.

The hashes were compared using:

```powershell
Compare-Object (Get-Content hash_run_1.txt) (Get-Content hash_run_2.txt)
```

The comparison returned no differences, confirming that every generated output was identical across repeated executions.

This demonstrates deterministic replay and reproducible reconciliation results.

# Result

All automated tests passed successfully before submission.
