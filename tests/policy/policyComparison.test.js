import { describe, test, expect } from "@jest/globals";

import { comparePolicyVersions } from "../../src/reconciliation/policyComparison.js";

import policyV1 from "../../data/policy/policy-v1.json" with { type: "json" };
import policyV2 from "../../data/policy/policy-v2.json" with { type: "json" };

describe("Policy version comparison", () => {
  const inventoryRawRecords = [
    {
      rawRecordId: "inventory.csv-1",
      payload: {
        asset_id: "cam-001",
        asset_type: "camera",
        condition: "good",
        status: "available",
        location_id: "media-lab",
        holder_id: "",
        due_at: "",
      },
    },
  ];

  test("runs the same input against both policy versions", () => {
    const eventRawRecords = [
      {
        rawRecordId: "events.csv-1",
        payload: {
          event_id: "e001",
          occurred_at: "2026-06-01T08:00:00Z",
          received_at: "2026-06-01T08:05:00Z",
          actor_id: "s001",
          actor_role: "student",
          event_type: "CHECKOUT",
          asset_id: "cam-001",
          location_id: "media-lab",
          condition_report: "good",
          source_system: "makerspace_app",
          note: "Checkout",
        },
      },
    ];

    const comparison = comparePolicyVersions({
      policyV1,
      policyV2,
      eventRawRecords,
      inventoryRawRecords,
    });

    expect(comparison.policyV1.policyVersion).toBe("1.0.0");
    expect(comparison.policyV2.policyVersion).toBe("2.0.0");

    expect(comparison.policyV1.decisionsByEventId.has("e001")).toBe(true);

    expect(comparison.policyV2.decisionsByEventId.has("e001")).toBe(true);
  });

  test("shows a meaningful difference for an event introduced in v2", () => {
    const eventRawRecords = [
      {
        rawRecordId: "events.csv-reserve-1",
        payload: {
          event_id: "e-reserve-001",
          occurred_at: "2026-06-01T08:00:00Z",
          received_at: "2026-06-01T08:05:00Z",
          actor_id: "s001",
          actor_role: "student",
          event_type: "RESERVE",
          asset_id: "cam-001",
          location_id: "media-lab",
          condition_report: "",
          source_system: "makerspace_app",
          note: "Reservation",
        },
      },
    ];

    const comparison = comparePolicyVersions({
      policyV1,
      policyV2,
      eventRawRecords,
      inventoryRawRecords,
    });

    const v1Decision =
      comparison.policyV1.decisionsByEventId.get("e-reserve-001");

    const v2Decision =
      comparison.policyV2.decisionsByEventId.get("e-reserve-001");

    expect(v1Decision).toBeDefined();
    expect(v2Decision).toBeDefined();

    expect(v1Decision.decision).toBe("REJECTED");
    expect(v1Decision.reasonCode).toBe("UNKNOWN_EVENT_TYPE");

    expect(
      comparison.differences.some(
        (difference) => difference.eventId === "e-reserve-001",
      ),
    ).toBe(true);
  });
});
