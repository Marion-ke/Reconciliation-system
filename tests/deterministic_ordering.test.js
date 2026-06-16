import { describe, test, expect } from "@jest/globals";

import { sortCanonicalEvents } from "../src/normalization/deterministic_sorter.js";

describe("Deterministic Ordering", () => {
  test("should sort by eventId when occurredAt and receivedAt are equal", () => {
    const events = [
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:00:00Z",
        eventId: "e002",
      },

      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:00:00Z",
        eventId: "e001",
      },
    ];

    const sorted = sortCanonicalEvents(events);

    expect(sorted[0].eventId).toBe("e001");
    expect(sorted[1].eventId).toBe("e002");
  });

  test("should use receivedAt when occurredAt is equal", () => {
    const events = [
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:05:00Z",
        eventId: "e001",
      },

      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:01:00Z",
        eventId: "e002",
      },
    ];

    const sorted = sortCanonicalEvents(events);

    expect(sorted[0].eventId).toBe("e002");
    expect(sorted[1].eventId).toBe("e001");
  });

  test("should use source priority when timestamps are equal", () => {
    const events = [
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:00:00Z",
        sourceSystem: "makerspace_app",
        sourceRow: 1,
        eventId: "e001",
      },
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:00:00Z",
        sourceSystem: "repair_system",
        sourceRow: 1,
        eventId: "e002",
      },
    ];

    const sorted = sortCanonicalEvents(events);

    expect(sorted[0].sourceSystem).toBe("repair_system");
  });
});
