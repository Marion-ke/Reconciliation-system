import { detectLateEvents } from "../../src/reconciliation/lateEventDetector.js";
import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Late Event Detection", () => {
  test("flags late arriving events", () => {
    const events = [
      {
        eventId: "e001",
        occurredAt: "2026-06-01T08:00:00Z",
        receivedAt: "2026-06-01T12:00:00Z",
      },

      {
        eventId: "e002",
        occurredAt: "2026-06-01T09:00:00Z",
        receivedAt: "2026-06-03T10:00:00Z",
      },
    ];

    const detected = detectLateEvents(events, mockPolicy);

    expect(detected).toHaveLength(2);

    expect(detected[0].isLateEvent).toBe(false);

    expect(detected[1].isLateEvent).toBe(true);

    expect(detected[1].lateHours).toBeGreaterThan(
      mockPolicy.lateEventPolicy.thresholdHours,
    );
  });
});
