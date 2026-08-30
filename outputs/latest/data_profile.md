# Data Profile Report

## Purpose

This report summarizes the quality, structure, and distribution of data processed by the Reconciliation Intelligence System during ingestion and validation.

The profile helps identify data quality issues, validate assumptions, and verify that the validation layer is functioning as expected.

---

## Dataset Overview

- Total Event Records: 150
- Duplicate Event IDs Detected: 0

---

## Missing Values

- condition_report: 75
- note: 49
- location_id: 14

### Observation

Most missing values occur in condition-related fields that are not required for every event type. Missing timestamps and actor roles represent data quality issues and are flagged during validation.

---

## Event Type Distribution

- CHECKOUT: 41
- RETURN: 29
- MAINTENANCE_CLOSE: 15
- MAINTENANCE_OPEN: 7
- HOLD: 1
- TRANSFER_OUT: 3
- TRANSFER_IN: 5
- AUDIT_OBSERVATION: 14
- RETIRE: 1
- RESERVE: 17
- CANCEL_RESERVATION: 8
- MANUAL_CORRECTION: 9

### Observation

The event distribution shows normal operational activity together with intentionally abnormal event types used to test validation rules.

---

## Actor Role Distribution

- student: 109
- staff: 8
- auditor: 14
- technician: 9
- admin: 10

### Observation

Students generated the majority of events. Missing actor roles prevent authorization checks and result in validation failures.

---

## Condition Distribution

- good: 50
- damaged: 8
- worn: 7
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
