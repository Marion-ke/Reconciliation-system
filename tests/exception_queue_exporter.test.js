import { buildExceptionQueue } from "../src/reconciliation/exceptionQueue.js";
import { buildExceptionQueueCsv } from "../src/exporters/exception_queue_exporter.js";

describe("Exception Queue Exporter", () => {
  test("exports rejected decisions as exception cases", () => {
    const decisions = [
      {
        eventId: "e023",
        assetId: "tab-003",
        decision: "REJECTED",
        reasonCode: "ILLEGAL_STATE_TRANSITION",
        rawRecordId: "events.csv-23",
        message: "Cannot CHECKOUT an asset in state CHECKED_OUT.",
      },
    ];

    const queue = buildExceptionQueue(decisions);

    expect(queue).toHaveLength(1);

    const csv = buildExceptionQueueCsv(queue);

    expect(csv).toContain("case_id");
    expect(csv).toContain("EX-0001");
    expect(csv).toContain("ILLEGAL_STATE_TRANSITION");
    expect(csv).toContain("tab-003");
    expect(csv).toContain("events.csv-23");
  });
});
