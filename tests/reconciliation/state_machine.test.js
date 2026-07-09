import { getNextState } from "../../src/reconciliation/stateMachine.js";

describe("State Machine", () => {
  test("AVAILABLE asset can be checked out", () => {
    expect(getNextState("AVAILABLE", "CHECKOUT")).toBe("CHECKED_OUT");
  });

  test("CHECKED_OUT asset can be returned", () => {
    expect(getNextState("CHECKED_OUT", "RETURN")).toBe("AVAILABLE");
  });

  test("RETIRED asset cannot be checked out", () => {
    expect(getNextState("RETIRED", "CHECKOUT")).toBeNull();
  });
});
