# Reconciliation Intelligence System

## Overview

The Reconciliation Intelligence System is a data processing pipeline that ingests asset inventory records, operational events, and policy definitions, validates data quality, transforms valid records into a canonical format, and generates traceable output artifacts.

This implementation was developed for Packet 01 and focuses on ingestion, validation, profiling, normalization, deterministic ordering, and output generation.

---

## Features

### Ingestion

- CSV inventory loading
- CSV event loading
- JSON policy loading
- Raw record generation with traceability

### Validation

The system validates:

- Required fields
- Duplicate event IDs
- Invalid timestamps
- Unknown event types
- Unknown assets
- Missing actor roles
- Invalid condition values
- Late-arriving events

### Profiling

Dataset profiling includes:

- Missing value analysis
- Duplicate key detection
- Event type distribution
- Actor role distribution
- Condition distribution

### Normalization

- Canonical event generation
- Deterministic event ordering
- Traceable source references

### Export Generation

The system produces:

- `canonical_events.csv`
- `validation_errors.csv`
- `raw_record_index.csv`
- `ingestion_summary.md`
- `data_profile.md`

---

## Project Structure

```text
src/
├── contracts/
├── domain/
├── exporters/
├── ingestion/
├── normalization/
├── profiling/
├── utils/
├── validation/
└── index.js

tests/

data/
└── sample/

outputs/
└── latest/

docs/
├── architecture.md
└── assumptions.md
```

## Installation

Install dependencies:

```bash
npm install
```

---

## Running the Application

Execute:

```bash
npm run start
```

The application will:

1. Load source datasets.
2. Validate records.
3. Generate canonical events.
4. Produce output artifacts.

Generated outputs can be found in:

```text
outputs/latest/
```

---

## Running Tests

Execute:

```bash
npm test
```

The test suite validates:

- Required field validation
- Duplicate event detection
- Timestamp validation
- Unknown event handling
- Asset validation
- Canonical mapping
- Deterministic ordering
- Pipeline integration
- Export generation
- Profiling

---

## Sample Dataset

The sample dataset contains:

- 50 event records
- Multiple asset categories
- Multiple actor roles
- Multiple source systems
- Intentional abnormal records

Abnormal records include:

- Duplicate event IDs
- Invalid timestamps
- Unknown assets
- Unknown event types
- Missing actor roles
- Invalid condition values
- Late-arriving events

These records are intentionally included to verify validation behavior.

---

## Generated Outputs

### canonical_events.csv

Contains validated canonical events used for downstream processing.

### validation_errors.csv

Contains all validation errors and warnings.

### raw_record_index.csv

Provides traceability between source records and processing outcomes.

### ingestion_summary.md

Summarizes ingestion and validation statistics.

### data_profile.md

Provides dataset profiling statistics and observations.

---

## Design Principles

The system was designed around:

- Traceability
- Deterministic processing
- Validation-first architecture
- Separation of concerns
- Extensibility for future reconciliation packets

---

## Documentation

Additional documentation is available in:

- docs/architecture.md
- docs/assumptions.md
- ASSISTANCE_DISCLOSURE.md
