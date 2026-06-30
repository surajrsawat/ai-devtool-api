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

  it("returns repository index status", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/repos/repo_123/index-status",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().repositoryId).toBe("repo_123");
  });

  it("returns repository search results", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/repos/repo_123/search",
      payload: {
        query: "retry",
        topK: 3,
      },
    });

    expect(response.statusCode).toBe(200);

    const body = response.json() as { query: string; results: Array<{ path: string }> };
    expect(body.query).toBe("retry");
    expect(body.results.length).toBeGreaterThan(0);
  });

  it("creates and fetches review", async () => {
    const createResponse = await app.inject({
      method: "POST",
      url: "/reviews",
      payload: {
        repositoryId: "repo_123",
        branch: "main",
        prompt: "Review security",
      },
    });

    expect(createResponse.statusCode).toBe(201);

    const created = createResponse.json() as { reviewId: string; status: string };
    expect(created.status).toBe("completed");

    const getResponse = await app.inject({
      method: "GET",
      url: `/reviews/${created.reviewId}`,
    });

    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().reviewId).toBe(created.reviewId);
  });
});
