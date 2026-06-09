/**
 * Generate markdown summary
 * for a reconciliation run.
 */
export function buildIngestionSummary({
  inventoryCount,
  eventCount,
  acceptedCount,
  rejectedCount,
  warningCount,
  errorCount,
  policyVersion,
}) {
  return `# Ingestion Summary

## Source Files

- Inventory Records: ${inventoryCount}
- Event Records: ${eventCount}
- Policy Version: ${policyVersion}

## Validation Summary

- Errors: ${errorCount}
- Warnings: ${warningCount}

## Processing Summary

- Accepted Records: ${acceptedCount}
- Rejected Records: ${rejectedCount}
`;
}
