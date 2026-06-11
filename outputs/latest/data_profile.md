# Data Profile Report

## Purpose

This report summarizes the quality, structure, and distribution of data processed by the Reconciliation Intelligence System during ingestion and validation.

The profile helps identify data quality issues, validate assumptions, and verify that the validation layer is functioning as expected.

---

## Dataset Overview

- Total Event Records: 50
- Duplicate Event IDs Detected: 2

---

## Missing Values

- condition_report: 29
- occurred_at: 1
- actor_role: 2

### Observation

Most missing values occur in condition-related fields that are not required for every event type. Missing timestamps and actor roles represent data quality issues and are flagged during validation.

---

## Event Type Distribution

- CHECKOUT: 21
- TRANSFER: 6
- INSPECT: 7
- REPAIR: 2
- RETURN: 10
- RETIRE: 2
- LOST_ITEM: 1
- BORROW: 1

### Observation

The event distribution shows normal operational activity together with intentionally abnormal event types used to test validation rules.

---

## Actor Role Distribution

- student: 31
- staff: 6
- technician: 9
- admin: 2
- missing: 2

### Observation

Students generated the majority of events. Missing actor roles prevent authorization checks and result in validation failures.

---

## Condition Distribution

- scratched: 4
- damaged: 1
- good: 11
- worn: 3
- brokenish: 1
- super_worn: 1

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
