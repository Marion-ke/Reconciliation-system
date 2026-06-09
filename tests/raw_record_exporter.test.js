import { describe, test, expect } from "@jest/globals";

import { buildRawRecordIndexCsv } from "../src/exporters/raw_record_exporter.js";

describe("Raw Record Exporter", () => {
  test("should generate raw record index csv", () => {
    const records = [
      {
        rawRecordId: "events.csv-1",

        payload: {
          event_id: "e001",
        },
      },
    ];

    const validationResult = {
      acceptedRecords: records,
      rejectedRecords: [],
      warningRecords: [],
    };

    const csv = buildRawRecordIndexCsv(records, validationResult);

    expect(csv).toContain("raw_record_id");

    expect(csv).toContain("events.csv-1");

    expect(csv).toContain("ACCEPTED");
  });
});
