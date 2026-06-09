import { describe, test, expect } from "@jest/globals";

import { buildValidationErrorsCsv } from "../src/exporters/validation_exporter.js";

describe("Validation Exporter", () => {
  test("should generate validation error csv", () => {
    const errors = [
      {
        errorId: "err-001",
        rawRecordId: "events.csv-39",
        eventId: "e039",
        reasonCode: "INVALID_TIMESTAMP",
        severity: "ERROR",
        message: "Invalid timestamp",
        sourceValue: "INVALID_DATE",
      },
    ];

    const csv = buildValidationErrorsCsv(errors);

    expect(csv).toContain("error_id");

    expect(csv).toContain("err-001");

    expect(csv).toContain("INVALID_TIMESTAMP");
  });
});
