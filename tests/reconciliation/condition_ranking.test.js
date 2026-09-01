import { evaluateEvent } from "../../src/reconciliation/decisionEngine.js";
import { REASON_CODES } from "../../src/reconciliation/reasonCodes.js";
describe("Condition Ranking", () => {
  test("detects a condition downgrade", () => {
    const asset = {
      status: "AVAILABLE",
      condition: "good",
    };

    const event = {
      eventId: "e001",
      assetId: "cam-001",
      actorRole: "technician",
      actorId: "tech01",
      eventType: "AUDIT_OBSERVATION",
      conditionReport: "damaged",
    };

    const policy = {
      policyVersion: "1.0.0",

      eventDefinitions: {
        AUDIT_OBSERVATION: {},
      },

      actorPermissions: {
        technician: ["AUDIT_OBSERVATION"],
      },

      conditionSeverityRanking: {
        new: 0,
        good: 1,
        worn: 2,
        scratched: 3,
        damaged: 4,
        unusable: 5,
      },
    };

    const decision = evaluateEvent(asset, event, policy, new Map());

    expect(decision.decision).toBe("REVIEW_REQUIRED");

    expect(decision.reasonCode).toBe(REASON_CODES.CONDITION_DOWNGRADE);
  });
});
