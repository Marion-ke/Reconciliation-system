/**
 * Compare audit observations against reconciled asset state.
 *
 * Supports:
 * - assetStates: Map keyed by asset_id
 * - historicalStates: optional Map keyed by observation_id
 *
 * When historicalStates is provided, it takes precedence.
 */
export function detectAuditDiscrepancies(
  auditRecords,
  assetStates,
  historicalStates = null,
) {
  const discrepancies = [];

  for (const record of auditRecords) {
    const observation = record.payload;

    const observationId = observation.observation_id;
    const assetId = observation.asset_id;

    // Prefer the historical state when one is available.
    const assetState =
      historicalStates?.get(observationId) ?? assetStates.get(assetId);

    if (!assetState) {
      discrepancies.push({
        observationId,
        assetId,
        reasonCode: "AUDIT_UNKNOWN_ASSET",
        severity: "ERROR",
        message: `Audit observation references unknown asset: ` + `${assetId}.`,
      });

      continue;
    }

    const differences = [];

    if (
      observation.observed_status &&
      String(observation.observed_status).toLowerCase() !==
        String(assetState.status).toLowerCase()
    ) {
      differences.push("STATUS");
    }

    if (
      observation.observed_condition &&
      String(observation.observed_condition).toLowerCase() !==
        String(assetState.condition).toLowerCase()
    ) {
      differences.push("CONDITION");
    }

    if (
      observation.observed_location_id &&
      String(observation.observed_location_id).toLowerCase() !==
        String(assetState.locationId).toLowerCase()
    ) {
      differences.push("LOCATION");
    }

    if (differences.length > 0) {
      discrepancies.push({
        observationId,
        assetId,
        reasonCode: "AUDIT_STATE_DISCREPANCY",
        severity: "WARNING",
        differences,
        message:
          `Audit observation does not match reconciled state` +
          `${
            observation.observed_at ? ` at ${observation.observed_at}` : ""
          }: ` +
          differences.join(", "),
      });
    }
  }

  return discrepancies;
}
