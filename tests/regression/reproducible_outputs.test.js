import { describe, test, expect } from "@jest/globals";

import { sortCanonicalEvents } from "../../src/normalization/deterministic_sorter.js";

describe("Reproducible Outputs", () => {
  test("should produce identical ordering for the same input", () => {
    const events = [
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:02:00Z",
        sourceSystem: "makerspace_app",
        sourceRow: 2,
        eventId: "e002",
      },
      {
        occurredAt: "2026-06-01T10:00:00Z",
        receivedAt: "2026-06-01T10:01:00Z",
        sourceSystem: "inventory_portal",
        sourceRow: 1,
        eventId: "e001",
      },
    ];

    const firstRun = sortCanonicalEvents(events);
    const secondRun = sortCanonicalEvents(events);

    expect(firstRun).toEqual(secondRun);
  });
});
