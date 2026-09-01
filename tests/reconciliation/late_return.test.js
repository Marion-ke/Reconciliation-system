import { evaluateEvent } from "../../src/reconciliation/decisionEngine.js";

describe("Late return auto-resolution", () => {
  test("auto-resolves a return within the policy grace period", () => {
    const asset = {
      status: "CHECKED_OUT",
      condition: "good",
      holderId: "student-001",
      dueAt: "2026-08-31T10:00:00.000Z",
    };

    const event = {
      eventId: "return-001",
      assetId: "cam-001",
      actorRole: "student",
      actorId: "student-001",
      eventType: "RETURN",
      occurredAt: "2026-08-31T12:00:00.000Z",
      conditionReport: "good",
    };

    const policy = {
      policyVersion: "2.0.0",

      eventDefinitions: {
        RETURN: {
          allowedStates: ["checked_out"],
        },
      },

      actorPermissions: {
        student: ["RETURN"],
      },

      autoResolutionRules: {
        lateReturn: {
          enabled: true,
          gracePeriodHours: 2,
          decision: "AUTO_RESOLVE",
        },
      },
    };

    const decision = evaluateEvent(asset, event, policy, new Map());

    expect(decision.decision).toBe("ACCEPTED_WITH_WARNING");
    expect(decision.reasonCode).toBe("LATE_RETURN_WITHIN_GRACE_PERIOD");
    expect(decision.nextState).toBe("AVAILABLE");
  });
  test("does not auto-resolve a return beyond the grace period", () => {
    const asset = {
      status: "CHECKED_OUT",
      condition: "good",
      holderId: "student-001",
      dueAt: "2026-08-31T10:00:00.000Z",
    };

    const event = {
      eventId: "return-002",
      assetId: "cam-001",
      actorRole: "student",
      actorId: "student-001",
      eventType: "RETURN",
      occurredAt: "2026-08-31T12:01:00.000Z",
      conditionReport: "good",
    };

    const policy = {
      policyVersion: "2.0.0",

      eventDefinitions: {
        RETURN: {
          allowedStates: ["checked_out"],
        },
      },

      actorPermissions: {
        student: ["RETURN"],
      },

      autoResolutionRules: {
        lateReturn: {
          enabled: true,
          gracePeriodHours: 2,
          decision: "AUTO_RESOLVE",
        },
      },
    };

    const decision = evaluateEvent(asset, event, policy, new Map());

    expect(decision.decision).toBe("ACCEPTED");
    expect(decision.reasonCode).toBe("STATE_TRANSITION_ALLOWED");
    expect(decision.nextState).toBe("AVAILABLE");
  });
});
