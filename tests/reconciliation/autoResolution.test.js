import { applyAutoResolution } from "../../src/reconciliation/autoResolution.js";

describe("Policy-driven auto resolution", () => {
  test("automatically resolves a condition downgrade when enabled by policy", () => {
    const exception = {
  caseId: "EX-0001",
  severity: "WARNING",
  reasonCode: "CONDITION_DOWNGRADE",
  assetId: "cam-001",
  eventId: "e001",
  conditionBefore: "good",
  conditionAfter: "worn",
  message: "Condition downgraded from good to worn.",
};
    const policy = {
        conditionSeverityRanking: {
    new: 0,
    good: 1,
    worn: 2,
    scratched: 3,
    damaged: 4,
    unusable: 5,
  },
      autoResolutionRules: {
        enabled: true,
        conditionDowngrade: {
          enabled: true,
          maxRankDifference: 1,
          decision: "ACCEPTED_WITH_WARNING",
        },
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(1);
    expect(result.exceptions).toHaveLength(0);

    expect(result.autoResolved[0].status).toBe("AUTO_RESOLVED");
    expect(result.autoResolved[0].resolvedBy).toBe("SYSTEM");
    expect(result.autoResolved[0].resolution).toBe(
      "Automatically resolved according to policy.",
    );
  });

  test("does not auto-resolve when the policy is disabled", () => {
    const exception = {
      caseId: "EX-0002",
      severity: "WARNING",
      reasonCode: "CONDITION_DOWNGRADE",
      assetId: "cam-001",
      eventId: "e002",
    };

    const policy = {
      autoResolutionRules: {
        enabled: false,
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(0);
    expect(result.exceptions).toHaveLength(1);
  });
  test("does not auto-resolve a downgrade beyond the policy threshold", () => {
    const exception = {
      caseId: "EX-0003",
      severity: "WARNING",
      reasonCode: "CONDITION_DOWNGRADE",
      assetId: "cam-001",
      eventId: "e003",
      conditionBefore: "good",
      conditionAfter: "damaged",
    };

    const policy = {
      conditionSeverityRanking: {
        new: 0,
        good: 1,
        worn: 2,
        scratched: 3,
        damaged: 4,
        unusable: 5,
      },
      autoResolutionRules: {
        enabled: true,
        conditionDowngrade: {
          enabled: true,
          maxRankDifference: 1,
          decision: "ACCEPTED_WITH_WARNING",
        },
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(0);
    expect(result.exceptions).toHaveLength(1);
  });

  test("automatically resolves a late return within the grace period", () => {
    const exception = {
      caseId: "EX-0004",
      severity: "WARNING",
      reasonCode: "LATE_RETURN_WITHIN_GRACE_PERIOD",
      assetId: "cam-001",
      eventId: "e004",
      message: "Return was 1.0 hours late but is within the 2-hour grace period.",
    };

    const policy = {
      autoResolutionRules: {
        enabled: true,
        lateReturn: {
          enabled: true,
          gracePeriodHours: 2,
          decision: "AUTO_RESOLVE",
        },
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(1);
    expect(result.exceptions).toHaveLength(0);

    expect(result.autoResolved[0].status).toBe("AUTO_RESOLVED");
    expect(result.autoResolved[0].resolvedBy).toBe("SYSTEM");
    expect(result.autoResolved[0].resolution).toBe(
      "Automatically resolved according to policy.",
    );
  });

  test("does not auto-resolve a late return when the rule is disabled", () => {
    const exception = {
      caseId: "EX-0005",
      severity: "WARNING",
      reasonCode: "LATE_RETURN_WITHIN_GRACE_PERIOD",
      assetId: "cam-001",
      eventId: "e005",
    };

    const policy = {
      autoResolutionRules: {
        enabled: true,
        lateReturn: {
          enabled: false,
          gracePeriodHours: 2,
          decision: "AUTO_RESOLVE",
        },
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(0);
    expect(result.exceptions).toHaveLength(1);
    expect(result.exceptions[0].status).not.toBe("AUTO_RESOLVED");
  });

  test("does not auto-resolve a late return when the policy decision is not AUTO_RESOLVE", () => {
    const exception = {
      caseId: "EX-0006",
      severity: "WARNING",
      reasonCode: "LATE_RETURN_WITHIN_GRACE_PERIOD",
      assetId: "cam-001",
      eventId: "e006",
    };

    const policy = {
      autoResolutionRules: {
        enabled: true,
        lateReturn: {
          enabled: true,
          gracePeriodHours: 2,
          decision: "ACCEPTED_WITH_WARNING",
        },
      },
    };

    const result = applyAutoResolution([exception], policy);

    expect(result.autoResolved).toHaveLength(0);
    expect(result.exceptions).toHaveLength(1);
    expect(result.exceptions[0].status).not.toBe("AUTO_RESOLVED");
  });
});
