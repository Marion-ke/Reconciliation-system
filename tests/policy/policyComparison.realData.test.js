import { describe, test, expect } from "@jest/globals";

import { loadCsv } from "../../src/ingestion/csvLoader.js";
import { loadJson } from "../../src/ingestion/jsonLoader.js";
import { buildRawRecords } from "../../src/ingestion/rawRecordBuilder.js";

import { comparePolicyVersions } from "../../src/reconciliation/policyComparison.js";

describe("Policy comparison against the real dataset", () => {
  test("compares policy v1 and v2 using the same inventory and events", async () => {
    const inventory = await loadCsv("./data/sample/inventory.csv");

    const events = await loadCsv("./data/sample/events.csv");

    const policyV1 = await loadJson("./data/policy/policy-v1.json");

    const policyV2 = await loadJson("./data/policy/policy-v2.json");

    const inventoryRawRecords = buildRawRecords(inventory, "inventory.csv");

    const eventRawRecords = buildRawRecords(events, "events.csv");

    const comparison = comparePolicyVersions({
      policyV1,
      policyV2,
      eventRawRecords,
      inventoryRawRecords,
    });

    console.log(`\nPolicy v1: ${comparison.policyV1.policyVersion}`);

    console.log(`Policy v2: ${comparison.policyV2.policyVersion}`);

    console.log(`Input events: ${eventRawRecords.length}`);

    console.log(`Changed outcomes: ${comparison.changedOutcomeCount}`);

    console.log(`Total differences: ${comparison.differences.length}`);

    expect(comparison.policyV1.policyVersion).toBe("1.0.0");
    expect(comparison.policyV2.policyVersion).toBe("2.0.0");

    expect(eventRawRecords.length).toBeGreaterThan(0);

    expect(comparison.differences.length).toBeGreaterThan(0);
  });
});
