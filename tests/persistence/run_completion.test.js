import { describe, test, expect } from "@jest/globals";

import {
  createReconciliationRun,
  completeReconciliationRun,
  getReconciliationRun,
} from "../../src/persistence/repository.js";

import { initializeDatabase } from "../../src/persistence/database.js";

describe("Reconciliation Run Completion", () => {
  test("marks a reconciliation run as completed", async () => {
    await initializeDatabase();

    const runId = "completion-test-run-001";

    await createReconciliationRun({
      runId,
      policyVersion: "2.0.0",
      inputHash: "completion-test-hash",
      startedAt: "2026-08-03T15:00:00.000Z",
    });

    const beforeCompletion = await getReconciliationRun(runId);

    expect(beforeCompletion.status).toBe("RUNNING");
    expect(beforeCompletion.completed_at).toBeNull();

    const completedAt = "2026-08-03T15:05:00.000Z";

    const completedRun = await completeReconciliationRun(runId, completedAt);

    expect(completedRun.status).toBe("COMPLETED");
    expect(completedRun.completed_at).toBe(completedAt);

    expect(completedRun.run_id).toBe(runId);
    expect(completedRun.policy_version).toBe("2.0.0");
    expect(completedRun.input_hash).toBe("completion-test-hash");
  });
});
