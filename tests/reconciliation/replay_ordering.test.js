import { orderEvents } from "../../src/reconciliation/replayOrdering.js";

describe("Replay Ordering", () => {
  test("orders by occurredAt, receivedAt and eventId", () => {
    const events = [
      {
        eventId: "e003",
        occurredAt: "2026-06-01T08:00:00Z",
        receivedAt: "2026-06-01T09:00:00Z",
      },
      {
        eventId: "e001",
        occurredAt: "2026-06-01T07:00:00Z",
        receivedAt: "2026-06-01T08:00:00Z",
      },
      {
        eventId: "e002",
        occurredAt: "2026-06-01T08:00:00Z",
        receivedAt: "2026-06-01T08:30:00Z",
      },
    ];

    const ordered = orderEvents(events);

    expect(ordered.map((e) => e.eventId)).toEqual(["e001", "e002", "e003"]);
  });
});
test("orders equal timestamps by event id", () => {
  const events = [
    {
      eventId: "e010",
      occurredAt: "2026-06-01T08:00:00Z",
      receivedAt: "2026-06-01T08:00:00Z",
    },
    {
      eventId: "e002",
      occurredAt: "2026-06-01T08:00:00Z",
      receivedAt: "2026-06-01T08:00:00Z",
    },
    {
      eventId: "e001",
      occurredAt: "2026-06-01T08:00:00Z",
      receivedAt: "2026-06-01T08:00:00Z",
    },
  ];

  const ordered = orderEvents(events);

  expect(ordered.map((e) => e.eventId)).toEqual(["e001", "e002", "e010"]);
});
