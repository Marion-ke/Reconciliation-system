import { describe, test, expect } from "@jest/globals";

import { buildIngestionSummary } from "../src/exporters/summary_exporter.js";

describe("Summary Exporter", () => {
  test("should generate markdown summary", () => {
    const summary = buildIngestionSummary({
      inventoryCount: 23,

      eventCount: 50,

      acceptedCount: 37,

      rejectedCount: 13,

      warningCount: 2,

      errorCount: 13,

      policyVersion: "1.0.0",
    });

    expect(summary).toContain("# Ingestion Summary");

    expect(summary).toContain("Inventory Records: 23");

    expect(summary).toContain("Accepted Records: 37");
  });
});
