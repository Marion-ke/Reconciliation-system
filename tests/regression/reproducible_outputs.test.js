import { describe, test, expect } from "@jest/globals";
import { createHash } from "crypto";
import { readFile } from "fs/promises";

import { main } from "../../src/index.js";

const files = [
  "outputs/latest/canonical_events.csv",
  "outputs/latest/event_decisions.csv",
  "outputs/latest/exception_queue.csv",
  "outputs/latest/final_asset_state.csv",
  "outputs/latest/run_summary.md",
];

async function hashFile(path) {
  const buffer = await readFile(path);
  return createHash("sha256").update(buffer).digest("hex");
}

describe("Reproducible Outputs", () => {
  test("pipeline produces identical output files across repeated runs", async () => {
    await main();

    const firstRun = {};
    for (const file of files) {
      firstRun[file] = await hashFile(file);
    }

    await main();

    const secondRun = {};
    for (const file of files) {
      secondRun[file] = await hashFile(file);
    }

    expect(secondRun).toEqual(firstRun);
  });
});
