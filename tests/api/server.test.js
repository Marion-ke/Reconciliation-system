import { describe, test, expect } from "@jest/globals";
import request from "supertest";

import { createApiServer } from "../../src/api/server.js";

describe("Reconciliation API", () => {
  test("health endpoint returns API status", async () => {
    const app = createApiServer();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: "ok",
      service: "reconciliation-api",
    });
  });
});
