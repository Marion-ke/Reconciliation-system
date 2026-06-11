# Architecture Overview

## Purpose

The Reconciliation Intelligence System ingests operational asset events, validates data quality, transforms valid records into a canonical representation, and generates traceable output artifacts for auditing and reconciliation.

---

## Processing Pipeline

Source Files

- inventory.csv
- events.csv
- policy.json

↓

Ingestion Layer

- CSV Loader
- JSON Loader

↓

Raw Record Builder

- Creates immutable raw records.
- Preserves source traceability.

↓

Validation Layer

- Inventory Validation
- Event Validation
- Policy Validation

Validation checks include:

- Required fields
- Duplicate event IDs
- Invalid timestamps
- Unknown event types
- Unknown assets
- Missing actor roles
- Invalid condition values
- Late-arriving events

↓

Validation Result

Records are classified into:

- Accepted Records
- Rejected Records
- Warning Records

↓

Canonical Mapping

Accepted records are transformed into Canonical Events.

Canonical events provide a standardized internal representation independent of source formats.

↓

Deterministic Ordering

Canonical events are sorted using:

1. occurredAt
2. receivedAt
3. eventId

This guarantees repeatable processing and output generation.

↓

Export Layer

Generated outputs:

- canonical_events.csv
- validation_errors.csv
- raw_record_index.csv
- ingestion_summary.md
- data_profile.md

---

## Core Domain Objects

### RawRecord

Represents the original source record exactly as received.

Responsibilities:

- Preserve source data
- Maintain traceability
- Support auditing

### ValidationError

Represents a validation failure or warning.

Responsibilities:

- Capture validation issues
- Store reason codes
- Preserve source references

### ValidationResult

Stores record classification results.

Responsibilities:

- Accepted records
- Rejected records
- Warning records
- Validation errors

### CanonicalEvent

Represents a validated business event in a standardized format.

Responsibilities:

- Provide a consistent internal model
- Support deterministic processing
- Enable future reconciliation logic

---

## Traceability Strategy

Every canonical event maintains a reference to its originating raw record through rawRecordId.

This allows:

- Auditability
- Error investigation
- Source reconstruction

The raw_record_index.csv artifact provides a complete traceability map between source records and processing outcomes.

---

## Design Principles

The system was designed around:

- Traceability
- Deterministic processing
- Data quality validation
- Separation of concerns
- Extensibility for future reconciliation packets

These principles ensure that future functionality can be added without replacing the foundational architecture.
