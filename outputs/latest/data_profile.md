# Data Profile Report

## Purpose

This report summarizes the quality, structure, and distribution of data processed by the Reconciliation Intelligence System during ingestion and validation.

The profile helps identify data quality issues, validate assumptions, and verify that the validation layer is functioning as expected.

---

## Dataset Overview

- Total Event Records: 250
- Duplicate Event IDs Detected: 0

---

## Missing Values

- condition_report: 123
- note: 49
- location_id: 14

### Observation

Most missing values occur in condition-related fields that are not required for every event type. Missing timestamps and actor roles represent data quality issues and are flagged during validation.

---

## Event Type Distribution

- CHECKOUT: 53
- RETURN: 51
- MAINTENANCE_CLOSE: 16
- MAINTENANCE_OPEN: 8
- HOLD: 1
- TRANSFER_OUT: 4
- TRANSFER_IN: 6
- AUDIT_OBSERVATION: 51
- RETIRE: 1
- RESERVE: 19
- CANCEL_RESERVATION: 9
- MANUAL_CORRECTION: 11
- WEBHOOK_ACK: 10
- AUTO_RESOLUTION_APPLIED: 10

### Observation

The event distribution shows normal operational activity together with intentionally abnormal event types used to test validation rules.

---

## Actor Role Distribution

- student: 160
- staff: 20
- auditor: 29
- technician: 11
- admin: 20
- system: 10

### Observation

Students generated the majority of events. Missing actor roles prevent authorization checks and result in validation failures.

---

## Condition Distribution

- good: 77
- damaged: 23
- worn: 17
- unusable: 2
- scratched: 6
- new: 1
- unknown_condition: 1

### Observation

Invalid condition values were intentionally included to verify policy-driven validation.

---

## Key Findings

- Duplicate event identifiers were detected.
- Missing timestamps and actor roles were identified.
- Unknown event types and invalid condition values were flagged.
- Late-arriving events were detected.
- Raw records remained traceable through raw record identifiers.

---

## Conclusion

The dataset contains both valid and intentionally abnormal records designed to test validation, traceability, and canonical event generation. Profiling confirms that the ingestion and validation layers are functioning correctly before records are promoted into the canonical event model.
