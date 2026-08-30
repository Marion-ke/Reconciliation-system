/**
 * Builds the final reconciliation run summary.
 *
 * The summary is generated from the actual reconciliation run so that
 * run identity, policy version, source counts, decision counts, timing,
 * exceptions, findings, and generated outputs remain traceable.
 */
export function buildRunSummary({
  runId,
  policyVersion,
  inputHash,
  startedAt,
  completedAt,
  status,
  sourceCounts = {},
  inventoryCount,
  eventCount,
  reconciliationSummary,
  decisions,
  exceptions,
  auditDiscrepancyCount = 0,
  policyComparison = null,
  outputFiles = [],
}) {
  const eventTypeCounts = {};
  const decisionCounts = {};
  const severityCounts = {};

  // -----------------------------
  // Calculate decision statistics
  // -----------------------------
  decisions.forEach((decision) => {
    const decisionType = decision.decision ?? "UNKNOWN";

    decisionCounts[decisionType] = (decisionCounts[decisionType] ?? 0) + 1;

    // Convert reconciliation decisions into report severity.
    let severity = "INFO";

    switch (decisionType) {
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

  // -----------------------------
  // Run metadata
  // -----------------------------
  lines.push("# Reconciliation Run Summary");
  lines.push("");

  lines.push("## Run");
  lines.push("");

  lines.push(`- Run ID: ${runId}`);
  lines.push(`- Policy Version: ${policyVersion}`);
  lines.push(`- Status: ${status}`);
  lines.push(`- Started At: ${startedAt}`);
  lines.push(`- Completed At: ${completedAt ?? "Not completed"}`);
  lines.push(`- Input Hash: ${inputHash}`);
  lines.push("");

  // -----------------------------
  // Input sources
  // -----------------------------
  lines.push("## Input Sources");
  lines.push("");

  Object.entries(sourceCounts).forEach(([source, count]) => {
    lines.push(`- ${source}: ${count}`);
  });

  lines.push("");

  // -----------------------------
  // Processing
  // -----------------------------
  lines.push("## Processing");
  lines.push("");

  lines.push(`- Inventory Records: ${inventoryCount}`);
  lines.push(`- Canonical Events: ${eventCount}`);
  lines.push(`- Processed Events: ${decisions.length}`);
  lines.push("");

  // -----------------------------
  // Decisions
  // -----------------------------
  lines.push("## Decisions");
  lines.push("");

  lines.push(`- Processed: ${reconciliationSummary.processed}`);
  lines.push(`- ACCEPTED: ${reconciliationSummary.accepted}`);
  lines.push(
    `- ACCEPTED_WITH_WARNING: ${reconciliationSummary.acceptedWithWarning}`,
  );
  lines.push(`- REJECTED: ${reconciliationSummary.rejected}`);
  lines.push(`- REVIEW_REQUIRED: ${reconciliationSummary.reviewRequired}`);
  lines.push(`- WARNING_ONLY: ${reconciliationSummary.warningOnly}`);
  lines.push("");

  // -----------------------------
  // Severity
  // -----------------------------
  lines.push("## Severity");
  lines.push("");

  Object.entries(severityCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`- ${key}: ${value}`);
    });

  lines.push("");

  // -----------------------------
  // Event types
  // -----------------------------
  lines.push("## Event Types");
  lines.push("");

  Object.entries(eventTypeCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([key, value]) => {
      lines.push(`- ${key}: ${value}`);
    });

  lines.push("");

  // -----------------------------
  // Exceptions
  // -----------------------------
  lines.push("## Exceptions");
  lines.push("");

  lines.push(`- Total Exception Cases: ${exceptions.length}`);
  lines.push(`- Rejected Events: ${reconciliationSummary.rejected}`);
  lines.push(
    `- Events Requiring Manual Review: ${reconciliationSummary.reviewRequired}`,
  );
  lines.push(`- Warning-Only Events: ${reconciliationSummary.warningOnly}`);
  lines.push(
    `- Accepted With Warning: ${reconciliationSummary.acceptedWithWarning}`,
  );
  lines.push(`- Audit Discrepancies Detected: ${auditDiscrepancyCount}`);
  lines.push("");

  // -----------------------------
  // Major findings
  // -----------------------------
  lines.push("## Major Findings");
  lines.push("");

  lines.push(
    `- ${reconciliationSummary.rejected} events were rejected during reconciliation.`,
  );

  lines.push(
    `- ${reconciliationSummary.reviewRequired} events require manual review.`,
  );

  lines.push(
    `- ${reconciliationSummary.warningOnly} warning-only outcomes were generated.`,
  );

  lines.push(
    `- ${reconciliationSummary.acceptedWithWarning} events were accepted with warning.`,
  );

  lines.push(`- ${auditDiscrepancyCount} audit discrepancies were detected.`);

  // -----------------------------
  // Policy comparison findings
  // -----------------------------
  if (policyComparison) {
    lines.push(
      `- Policy versions ${policyComparison.policyV1} and ${policyComparison.policyV2} produced ${policyComparison.totalDifferences} total differences.`,
    );

    lines.push(
      `- ${policyComparison.changedOutcomeCount} reconciliation outcomes changed between the two policy versions.`,
    );
  }

  lines.push("");

  // -----------------------------
  // Generated outputs
  // -----------------------------
  lines.push("## Generated Outputs");
  lines.push("");

  for (const outputFile of outputFiles) {
    lines.push(`- ${outputFile}`);
  }

  return lines.join("\n");
}
