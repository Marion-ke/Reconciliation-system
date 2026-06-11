export function buildDataProfileMarkdown(profile) {
  return `# Data Profile Report

## Purpose

This report summarizes the quality, structure, and distribution of data processed by the Reconciliation Intelligence System during ingestion and validation.

The profile helps identify data quality issues, validate assumptions, and verify that the validation layer is functioning as expected.

---

## Dataset Overview

- Total Event Records: ${profile.totalEvents}
- Duplicate Event IDs Detected: ${profile.duplicateEventIds}

---

## Missing Values

${Object.entries(profile.missingValues)
  .map(([field, count]) => `- ${field}: ${count}`)
  .join("\n")}

### Observation

Most missing values occur in condition-related fields that are not required for every event type. Missing timestamps and actor roles represent data quality issues and are flagged during validation.

---

## Event Type Distribution

${Object.entries(profile.eventTypeCounts)
  .map(([type, count]) => `- ${type}: ${count}`)
  .join("\n")}

### Observation

The event distribution shows normal operational activity together with intentionally abnormal event types used to test validation rules.

---

## Actor Role Distribution

${Object.entries(profile.actorRoleCounts)
  .map(([role, count]) => `- ${role || "missing"}: ${count}`)
  .join("\n")}

### Observation

Students generated the majority of events. Missing actor roles prevent authorization checks and result in validation failures.

---

## Condition Distribution

${Object.entries(profile.conditionCounts)
  .map(([condition, count]) => `- ${condition}: ${count}`)
  .join("\n")}

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
`;
}
