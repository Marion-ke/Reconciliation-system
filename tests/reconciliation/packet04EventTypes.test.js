import { evaluateEvent } from "../../src/reconciliation/decisionEngine.js";

describe("Packet 04 operational event types", () => {
  const policy = {
    policyVersion: "2.0.0",

    eventDefinitions: {
      WEBHOOK_ACK: {
        description: "Acknowledges receipt of a webhook notification",
        requiresActor: true,
        requiresLocation: false,
        allowedStates: [
          "AVAILABLE",
          "CHECKED_OUT",
          "IN_TRANSIT",
          "MAINTENANCE",
        ],
      },

      AUTO_RESOLUTION_APPLIED: {
        description: "Records application of an automated resolution rule",
        requiresActor: true,
        requiresLocation: false,
        allowedStates: [
          "AVAILABLE",
          "CHECKED_OUT",
          "IN_TRANSIT",
          "MAINTENANCE",
        ],
      },
    },

    actorPermissions: {
      system: ["AUTO_RESOLUTION_APPLIED"],
      staff: ["WEBHOOK_ACK"],
    },
  };

  test("accepts WEBHOOK_ACK as a recognized operational event", () => {
    const asset = {
      assetId: "cam-001",
      status: "AVAILABLE",
      condition: "good",
      holderId: "",
      locationId: "media-lab",
    };

    const event = {
      eventId: "ack-001",
      assetId: "cam-001",
      actorId: "external-system",
      actorRole: "staff",
      eventType: "WEBHOOK_ACK",
      rawRecordId: "raw-ack-001",
    };

    const decision = evaluateEvent(asset, event, policy, new Map());

    expect(decision.decision).toBe("ACCEPTED");
    expect(decision.eventType).toBe("WEBHOOK_ACK");
  });

  test("accepts AUTO_RESOLUTION_APPLIED as a recognized operational event", () => {
    const asset = {
      assetId: "cam-001",
      status: "AVAILABLE",
      condition: "good",
      holderId: "",
      locationId: "media-lab",
    };

    const event = {
      eventId: "auto-001",
      assetId: "cam-001",
      actorId: "SYSTEM",
      actorRole: "system",
      eventType: "AUTO_RESOLUTION_APPLIED",
      rawRecordId: "raw-auto-001",
    };

    const decision = evaluateEvent(asset, event, policy, new Map());

    expect(decision.decision).toBe("ACCEPTED");
    expect(decision.eventType).toBe("AUTO_RESOLUTION_APPLIED");
  });
});
