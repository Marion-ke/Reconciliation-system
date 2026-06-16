# Architecture Overview

## Purpose

The Reconciliation Intelligence System ingests operational asset events, validates data quality, transforms trusted records into a canonical representation, and generates traceable output artifacts for auditing, reconciliation, and future asset-state reconstruction.

The architecture is designed around traceability, deterministic processing, validation-first design, and extensibility for future reconciliation packets.

---

# Processing Pipeline

## Source Files

Input datasets:

- inventory.csv
- events.csv
- policy.json

↓

## Ingestion Layer

Responsibilities:

- Load CSV and JSON datasets.
- Verify source files can be processed.
- Convert source records into a common internal representation.

Components:

- CSV Loader
- JSON Loader

↓

## Raw Record Builder

Responsibilities:

- Create immutable RawRecord objects.
- Assign unique raw record identifiers.
- Preserve source file references.
- Preserve source row numbers.
- Maintain original payloads.

This layer provides complete traceability throughout the processing lifecycle.

↓

## Validation Layer

Responsibilities:

- Verify data quality.
- Enforce policy-driven rules.
- Detect abnormal records.

Validation checks include:

- Required fields
- Duplicate event IDs
- Invalid timestamps
- Unknown event types
- Unknown assets
- Missing actor roles
- Invalid condition values
- Late-arriving events

Validation issues are classified as either:

- ERROR
- WARNING

↓

## Validation Result

Records are classified into:

### Accepted Records

Records that satisfy all validation requirements.

### Rejected Records

Records containing validation errors.

### Warning Records

Records that remain processable but contain non-blocking issues.

↓

## Canonical Mapping

Accepted records are transformed into Canonical Events.

The Canonical Event model provides a standardized representation independent of source formats and prepares records for downstream reconciliation logic.

↓

## Deterministic Ordering

Canonical events are sorted using:

1. occurredAt
2. receivedAt
3. sourceSystem priority
4. sourceRow
5. eventId

This guarantees repeatable execution and reproducible outputs regardless of processing order.

↓

## Export Layer

Generated artifacts:

- canonical_events.csv
- validation_errors.csv
- raw_record_index.csv
- ingestion_summary.md
- data_profile.md

These outputs provide visibility into processing outcomes, validation results, and traceability information.

---

# Core Domain Objects

## RawRecord

Represents the original source record exactly as received.

Responsibilities:

- Preserve source data
- Preserve source file references
- Preserve source row numbers
- Support auditing and traceability

---

## ValidationError

Represents a validation failure or warning.

Responsibilities:

- Store severity classification
- Store reason codes
- Capture source values
- Document expected rules
- Recommend corrective actions

---

## ValidationResult

Stores processing outcomes.

Responsibilities:

- Accepted records
- Rejected records
- Warning records
- Validation errors

---

## CanonicalEvent

Represents a validated business event in a standardized format.

Responsibilities:

- Normalize source records
- Support deterministic processing
- Enable future reconciliation workflows
- Maintain traceability to source records

---

# Traceability Strategy

Traceability is maintained throughout the entire processing pipeline.

Each Canonical Event retains:

- rawRecordId
- source file reference
- source row reference

Each ValidationError retains:

- rawRecordId
- eventId
- source value

The raw_record_index.csv artifact provides a complete audit trail linking source records to validation outcomes and canonical events.

This enables:

- Auditability
- Error investigation
- Data lineage tracking
- Source reconstruction

---

# Schema Evolution

## Adding a New Source File

The architecture supports new source systems without modifying the core processing pipeline.

Steps:

1. Create a source contract.
2. Create a loader for the new source format.
3. Convert records into RawRecord objects.
4. Reuse existing validation and canonical mapping layers.

No changes are required to downstream processing components.

---

## Adding a New Event Type

The architecture supports additional event types through policy-driven configuration.

Steps:

1. Add the event type to policy.json.
2. Extend validation rules if necessary.
3. Process through the existing canonical event model.

No changes are required to ingestion, deterministic ordering, or export generation.

---

# Design Principles

The system was designed around:

- Traceability
- Deterministic processing
- Validation-first architecture
- Separation of concerns
- Extensibility
- Auditability

These principles ensure that future reconciliation functionality can be introduced without replacing the foundational architecture.
