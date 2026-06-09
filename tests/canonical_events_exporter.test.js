import { describe, test, expect } from "@jest/globals";

import { buildCanonicalEventsCsv } from "../src/exporters/canonical_events_exporter.js";

describe("Canonical Events Exporter", () => {
  test("should generate csv output", () => {
    const events = [
      {
        canonicalEventId: "ce-0001",
        eventId: "e001",
        occurredAt: "2026-06-01T08:00:00Z",
        receivedAt: "2026-06-01T08:01:00Z",
        actorId: "s001",
        actorRole: "student",
        eventType: "CHECKOUT",
        assetId: "cam-001",
        locationId: "LIBRARY",
        conditionReport: "good",
        sourceSystem: "inventory_app",
        note: "",
        rawRecordId: "events.csv-1",
      },
    ];

    const csv = buildCanonicalEventsCsv(events);

    expect(csv).toContain("canonical_event_id");

    expect(csv).toContain("ce-0001");

    expect(csv).toContain("e001");
  });
});
