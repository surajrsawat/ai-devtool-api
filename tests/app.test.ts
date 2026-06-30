import { afterEach, describe, expect, it } from "vitest";

import { createApp } from "../src/app";

let app = createApp();

afterEach(async () => {
  await app.close();
  app = createApp();
});

describe("api routes", () => {
  it("returns contract-valid health response", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("ai-devtool-api");
  });

  it("connects repository for valid payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/repos/connect",
      payload: {
        provider: "github",
        organization: "surajrsawat",
        repository: "ai-devtool-api",
      },
    });

    expect(response.statusCode).toBe(201);

    const body = response.json();
    expect(body.provider).toBe("github");
    expect(body.repository).toBe("ai-devtool-api");
    expect(body.status).toBe("connected");
  });

  it("returns validation error for invalid connect payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/repos/connect",
      payload: {
        provider: "invalid-provider",
        repository: "ai-devtool-api",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });
});
