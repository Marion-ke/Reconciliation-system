import { main } from "./index.js";

main().catch((error) => {
  console.error("Application startup failed:", error);
  process.exit(1);
});
