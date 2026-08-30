/**
 * Builds the final asset state report.
 *
 * State confidence is derived from the reconciliation evidence:
 *
 * HIGH:
 *   No review/error exception and no warning decision for the asset.
 *
 * MEDIUM:
 *   Warning evidence exists but there is no unresolved review/error.
 *
 * LOW:
 *   The asset has a review-required decision, error-level exception,
 *   or source conflict requiring human attention.
 */

function csv(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildAssetStateReportCsv(
  ledger,
  { decisions = [], exceptions = [] } = {},
) {
  const header = [
    "asset_id",
    "asset_type",
    "status",
    "holder_id",
    "location_id",
    "condition",
    "due_at",
    "last_event_id",
    "last_occurred_at",
    "state_confidence",
    "review_required",
    "review_reasons",
  ].join(",");

  const decisionsByAsset = new Map();

  for (const decision of decisions) {
    if (!decision.assetId) continue;

    if (!decisionsByAsset.has(decision.assetId)) {
      decisionsByAsset.set(decision.assetId, []);
    }

    decisionsByAsset.get(decision.assetId).push(decision);
  }

  const exceptionsByAsset = new Map();

  for (const exception of exceptions) {
    if (!exception.assetId) continue;

    if (!exceptionsByAsset.has(exception.assetId)) {
      exceptionsByAsset.set(exception.assetId, []);
    }

    exceptionsByAsset.get(exception.assetId).push(exception);
  }

  const rows = Array.from(ledger.values())
    .sort((a, b) => a.assetId.localeCompare(b.assetId))
    .map((asset) => {
      const assetDecisions = decisionsByAsset.get(asset.assetId) ?? [];
      const assetExceptions = exceptionsByAsset.get(asset.assetId) ?? [];

      const reviewReasons = new Set();

      let hasError = false;
      let hasWarning = false;

      for (const decision of assetDecisions) {
        if (decision.decision === "REVIEW_REQUIRED") {
          reviewReasons.add(decision.reasonCode);
        }

        if (decision.decision === "REJECTED") {
          hasError = true;
          reviewReasons.add(decision.reasonCode);
        }

        if (
          decision.decision === "WARNING_ONLY" ||
          decision.decision === "ACCEPTED_WITH_WARNING"
        ) {
          hasWarning = true;
          reviewReasons.add(decision.reasonCode);
        }
      }

      for (const exception of assetExceptions) {
        if (exception.severity === "ERROR") {
          hasError = true;
        }

        if (
          exception.severity === "ERROR" ||
          exception.severity === "WARNING"
        ) {
          reviewReasons.add(exception.reasonCode);
        }
      }

      let stateConfidence = "HIGH";
      let reviewRequired = "NO";

      if (hasError || reviewReasons.size > 0) {
        stateConfidence = "LOW";
        reviewRequired = "YES";
      } else if (hasWarning) {
        stateConfidence = "MEDIUM";
      }

      return [
        asset.assetId,
        asset.assetType,
        asset.status,
        asset.holderId ?? "",
        asset.locationId ?? "",
        asset.condition ?? "",
        asset.dueAt ?? "",
        asset.lastEventId ?? "",
        asset.lastOccurredAt ?? "",
        stateConfidence,
        reviewRequired,
        [...reviewReasons].sort().join(";"),
      ]
        .map(csv)
        .join(",");
    });

  return [header, ...rows].join("\n");
}
