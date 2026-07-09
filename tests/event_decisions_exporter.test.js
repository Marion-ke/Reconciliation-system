import { buildEventDecisionsCsv } from "../src/exporters/event_decisions_exporter.js";

describe("Event Decisions Exporter", () => {
  test("exports reconciliation decisions", () => {
    const csv = buildEventDecisionsCsv([
      {
        eventId: "e001",
        assetId: "cam-001",
        decision: "ACCEPTED",
        reason: "Valid state transition.",
        previousState: "AVAILABLE",
        nextState: "CHECKED_OUT",
      },
    ]);

    expect(csv).toContain("event_id");
    expect(csv).toContain("e001");
    expect(csv).toContain("CHECKED_OUT");
  });
});
