import { mockPolicy } from "../fixtures/mockPolicy.js";

describe("Policy Rules", () => {
  test("policy contains checkout limit", () => {
    expect(mockPolicy.checkoutLimits).toBeDefined();
    expect(mockPolicy.checkoutLimits.student).toBeGreaterThan(0);
  });

  test("policy contains condition severity ranking", () => {
    expect(mockPolicy.conditionSeverityRanking.good).toBeLessThan(
      mockPolicy.conditionSeverityRanking.damaged,
    );
  });

  test("policy contains late event policy", () => {
    expect(mockPolicy.lateEventPolicy.enabled).toBe(true);
    expect(mockPolicy.lateEventPolicy.thresholdHours).toBe(24);
  });
});
