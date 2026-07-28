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

  lines.push(`Processed: ${reconciliationSummary.processed}`);
  lines.push(`ACCEPTED: ${reconciliationSummary.accepted}`);
  lines.push(
    `ACCEPTED_WITH_WARNING: ${reconciliationSummary.acceptedWithWarning}`,
  );
  lines.push(`REJECTED: ${reconciliationSummary.rejected}`);
  lines.push(`REVIEW_REQUIRED: ${reconciliationSummary.reviewRequired}`);
  lines.push(`WARNING_ONLY: ${reconciliationSummary.warningOnly}`);

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
  lines.push(
    `- ${reconciliationSummary.processed} canonical events processed.`,
  );
  lines.push(`- ${reconciliationSummary.accepted} events accepted.`);
  lines.push(
    `- ${reconciliationSummary.acceptedWithWarning} events accepted with warning.`,
  );
  lines.push(`- ${reconciliationSummary.rejected} events rejected.`);
  lines.push(
    `- ${reconciliationSummary.reviewRequired} events require manual review.`,
  );
  lines.push(
    `- ${reconciliationSummary.warningOnly} warning-only events generated.`,
  );

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
