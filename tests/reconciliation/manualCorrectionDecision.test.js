import { describe, test, expect } from "@jest/globals";

import { evaluateManualCorrectionEvent } from "../../src/reconciliation/manualCorrectionDecision.js";

describe("MANUAL_CORRECTION event decision", () => {
  const event = {
    event_id: "correction-001",
    event_type: "MANUAL_CORRECTION",
    asset_id: "lap-001",
  };

  const assetState = {
    assetId: "lap-001",
    status: "checked_out",
    condition: "good",
  };

  test("accepts an authorized correction with evidence", () => {
    const result = evaluateManualCorrectionEvent({
      event,
      actorRole: "admin",
      evidence: {
        evidence_ref: "audit-001",
        reason: "Inventory record was entered incorrectly.",
      },
      assetState,
    });

    expect(result.decisionType).toBe("ACCEPTED_WITH_WARNING");

    expect(result.reasonCode).toBe("MANUAL_CORRECTION_APPLIED");
  });

  test("accepts an authorized staff correction with evidence", () => {
    const result = evaluateManualCorrectionEvent({
      event,
      actorRole: "staff",
      evidence: {
        evidence_ref: "audit-002",
        reason: "Verified against physical inventory.",
      },
      assetState,
    });

    expect(result.decisionType).toBe("ACCEPTED_WITH_WARNING");
  });

  test("rejects an unauthorized correction", () => {
    const result = evaluateManualCorrectionEvent({
      event,
      actorRole: "student",
      evidence: {
        evidence_ref: "audit-003",
        reason: "Correction requested.",
      },
      assetState,
    });

    expect(result.decisionType).toBe("REJECTED");

    expect(result.reasonCode).toBe("MANUAL_CORRECTION_UNAUTHORIZED");
  });

  test("rejects a correction without sufficient evidence", () => {
    const result = evaluateManualCorrectionEvent({
      event,
      actorRole: "admin",
      evidence: {
        evidence_ref: "",
        reason: "",
      },
      assetState,
    });

    expect(result.decisionType).toBe("REJECTED");

    expect(result.reasonCode).toBe("MANUAL_CORRECTION_INSUFFICIENT_EVIDENCE");
  });

  test("rejects a correction for an unknown asset", () => {
    const result = evaluateManualCorrectionEvent({
      event,
      actorRole: "admin",
      evidence: {
        evidence_ref: "audit-004",
        reason: "Verified correction.",
      },
      assetState: null,
    });

    expect(result.decisionType).toBe("REJECTED");

    expect(result.reasonCode).toBe("MANUAL_CORRECTION_UNKNOWN_ASSET");
  });
});
