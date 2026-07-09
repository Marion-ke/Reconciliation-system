/**
 * Builds the final reconciliation run summary.
 */
export function buildRunSummary({
  policyVersion,
  inventoryCount,
  eventCount,
  reconciliationSummary,
  decisions,
  exceptions,
}) {
  const eventTypeCounts = {};
  const decisionCounts = {};
  const severityCounts = {};

  decisions.forEach((decision) => {
    // -----------------------------
    // Decision counts
    // -----------------------------
    decisionCounts[decision.decision] =
      (decisionCounts[decision.decision] ?? 0) + 1;

    // -----------------------------
    // Severity counts
    // -----------------------------
    let severity = "INFO";

    switch (decision.decision) {
      case "REJECTED":
        severity = "ERROR";
        break;

      case "REVIEW_REQUIRED":
      case "WARNING_ONLY":
      case "ACCEPTED_WITH_WARNING":
        severity = "WARNING";
        break;

      default:
        severity = "INFO";
    }

    severityCounts[severity] = (severityCounts[severity] ?? 0) + 1;

    // -----------------------------
    // Event type counts
    // -----------------------------
    const eventType = decision.eventType ?? "UNKNOWN";

    eventTypeCounts[eventType] = (eventTypeCounts[eventType] ?? 0) + 1;
  });

  const lines = [];

  lines.push("# Reconciliation Run Summary");
  lines.push("");

  lines.push(`Policy Version: ${policyVersion}`);
  lines.push("");

  // -----------------------------
  // Input
  // -----------------------------
  lines.push("## Input");
  lines.push("");

  lines.push(`Inventory Records: ${inventoryCount}`);
  lines.push(`Canonical Events: ${eventCount}`);
  lines.push(`Processed Events: ${decisions.length}`);
  lines.push("");

  // -----------------------------
  // Decisions
  // -----------------------------
  lines.push("## Decisions");
  lines.push("");

  Object.entries(decisionCounts).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });

  lines.push("");

  // -----------------------------
  // Severity
  // -----------------------------
  lines.push("## Severity");
  lines.push("");

  Object.entries(severityCounts).forEach(([key, value]) => {
    lines.push(`${key}: ${value}`);
  });

  lines.push("");

  // -----------------------------
  // Event Types
  // -----------------------------
  lines.push("## Event Types");
  lines.push("");

  Object.entries(eventTypeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`${key}: ${value}`);
    });

  lines.push("");

  // -----------------------------
  // Exceptions
  // -----------------------------
  lines.push("## Exceptions");
  lines.push("");

  lines.push(`Total Exception Cases: ${exceptions.length}`);
  lines.push("");

  // -----------------------------
  // Notable Findings
  // -----------------------------
  lines.push("## Notable Findings");
  lines.push("");

  lines.push(`- ${decisions.length} canonical events processed.`);
  lines.push(`- ${decisionCounts.ACCEPTED ?? 0} events accepted.`);
  lines.push(
    `- ${decisionCounts.ACCEPTED_WITH_WARNING ?? 0} events accepted with warning.`,
  );
  lines.push(`- ${decisionCounts.REJECTED ?? 0} events rejected.`);
  lines.push(
    `- ${decisionCounts.REVIEW_REQUIRED ?? 0} events require manual review.`,
  );
  lines.push(
    `- ${decisionCounts.WARNING_ONLY ?? 0} warning-only events generated.`,
  );
  lines.push(`- ${exceptions.length} exception cases generated.`);
  lines.push("");

  // -----------------------------
  // Output Files
  // -----------------------------
  lines.push("## Generated Outputs");
  lines.push("");

  lines.push("outputs/latest/canonical_events.csv");
  lines.push("outputs/latest/event_decisions.csv");
  lines.push("outputs/latest/exception_queue.csv");
  lines.push("outputs/latest/final_asset_state.csv");
  lines.push("outputs/latest/validation_errors.csv");
  lines.push("outputs/latest/run_summary.md");
  lines.push("outputs/latest/data_profile.md");
  lines.push("outputs/latest/ingestion_summary.md");

  return lines.join("\n");
}
