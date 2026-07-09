import { TRANSITION_TABLE } from "../../src/reconciliation/transitionTable.js";

describe("Transition Table", () => {
  test("contains AVAILABLE transitions", () => {
    expect(TRANSITION_TABLE).toHaveProperty("AVAILABLE");
  });

  test("AVAILABLE can transition to CHECKED_OUT via CHECKOUT", () => {
    expect(TRANSITION_TABLE.AVAILABLE.CHECKOUT).toBe("CHECKED_OUT");
  });

  test("RETIRED only allows audit observations", () => {
    expect(TRANSITION_TABLE.RETIRED).toEqual({
      AUDIT_OBSERVATION: "RETIRED",
    });
  });
});
