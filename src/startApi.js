import { initializeDatabase } from "./persistence/database.js";
import { loadCsv } from "./ingestion/csvLoader.js";
import { loadJson } from "./ingestion/jsonLoader.js";
import { buildRawRecords } from "./ingestion/rawRecordBuilder.js";
import { startApiServer } from "./api/server.js";

await initializeDatabase();

const inventory = await loadCsv("./data/sample/inventory.csv");
const policy = await loadJson("./data/policy/policy-v2.json");

const inventoryRawRecords = buildRawRecords(inventory, "inventory.csv");

startApiServer({
  inventoryRawRecords,
  policy,
});
