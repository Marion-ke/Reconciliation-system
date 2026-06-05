import fs from "fs/promises";

/**
 * Loads policy.json into memory.
 *
 * The policy drives validation rules and business behavior.
 * Keeping policy external avoids hardcoding business rules.
 */
export async function loadJson(filePath) {
  const content = await fs.readFile(filePath, "utf-8");

  return JSON.parse(content);
}
