import express from "express";

/**
 * Creates the Express application used by the Week 7 API layer.
 *
 * The API is intentionally separated from the existing reconciliation
 * pipeline so that the reconciliation engine and persistence layer remain
 * reusable and independently testable.
 */
export function createApiServer() {
  const app = express();

  // Parse JSON request bodies.
  app.use(express.json());

  /**
   * Basic health endpoint.
   *
   * This will later allow deployment or monitoring systems to verify
   * that the API process is running.
   */
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      service: "reconciliation-api",
    });
  });

  return app;
}

/**
 * Starts the API server.
 *
 * The port can be supplied through the environment or defaults to 3000.
 */
export function startApiServer(port = process.env.PORT || 3000) {
  const app = createApiServer();

  return app.listen(port, () => {
    console.log(`Reconciliation API listening on port ${port}`);
  });
}
