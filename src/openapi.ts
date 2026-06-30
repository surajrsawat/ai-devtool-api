import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  repoIndexStatusOutputSchema,
  healthResponseSchema,
  reposConnectRequestSchema,
  reposConnectResponseSchema,
  repoSearchOutputSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";
import { reviewResponseSchema } from "./schemas/reviews";

const healthExample = healthResponseSchema.parse({
  status: "ok",
  service: "ai-devtool-api",
  version: "0.1.0",
  timestamp: "2026-06-30T00:00:00.000Z",
});

const connectRequestExample = reposConnectRequestSchema.parse({
  provider: "github",
  organization: "surajrsawat",
  repository: "ai-devtool-api",
  defaultBranch: "main",
});

const connectResponseExample = reposConnectResponseSchema.parse({
  connectionId: "conn_123",
  provider: "github",
  organization: "surajrsawat",
  repository: "ai-devtool-api",
  defaultBranch: "main",
  status: "connected",
  createdAt: "2026-06-30T00:00:00.000Z",
});

const indexStatusExample = repoIndexStatusOutputSchema.parse({
  repositoryId: "repo_123",
  status: "running",
  progress: 64,
  updatedAt: "2026-06-30T00:00:00.000Z",
});

const searchResponseExample = repoSearchOutputSchema.parse({
  repositoryId: "repo_123",
  query: "retry policy",
  tookMs: 14,
  results: [
    {
      path: "src/worker/index.ts",
      line: 31,
      score: 0.91,
      snippet: "retryPolicy: { strategy: 'exponential', maxAttempts: 5 }",
    },
  ],
});

const reviewResponseExample = reviewResponseSchema.parse({
  reviewId: "rev_123",
  repositoryId: "repo_123",
  branch: "main",
  status: "completed",
  summary: "Automated review completed",
  findings: [
    {
      severity: "medium",
      filePath: "src/app.ts",
      line: 73,
      message: "Consider adding explicit timeout handling for outbound service calls.",
    },
  ],
  createdAt: "2026-06-30T00:00:00.000Z",
  updatedAt: "2026-06-30T00:00:00.000Z",
});

const document = {
  openapi: "3.0.3",
  info: {
    title: "AI DevTool API",
    version: "0.1.0",
  },
  servers: [{ url: "http://localhost:3001" }],
  paths: {
    "/health": {
      get: {
        tags: ["system"],
        responses: {
          200: {
            description: "Health response",
            content: {
              "application/json": {
                example: healthExample,
              },
            },
          },
        },
      },
    },
    "/repos/connect": {
      post: {
        tags: ["repos"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: connectRequestExample,
            },
          },
        },
        responses: {
          201: {
            description: "Connected repo",
            content: {
              "application/json": {
                example: connectResponseExample,
              },
            },
          },
        },
      },
    },
    "/repos/{repositoryId}/index-status": {
      get: {
        tags: ["repos"],
        responses: {
          200: {
            description: "Repository index status",
            content: {
              "application/json": {
                example: indexStatusExample,
              },
            },
          },
        },
      },
    },
    "/repos/{repositoryId}/search": {
      post: {
        tags: ["repos"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                query: "retry policy",
                topK: 5,
              },
            },
          },
        },
        responses: {
          200: {
            description: "Repository semantic search results",
            content: {
              "application/json": {
                example: searchResponseExample,
              },
            },
          },
        },
      },
    },
    "/reviews": {
      post: {
        tags: ["reviews"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              example: {
                repositoryId: "repo_123",
                branch: "main",
                prompt: "Focus on security and reliability",
              },
            },
          },
        },
        responses: {
          201: {
            description: "Created review",
            content: {
              "application/json": {
                example: reviewResponseExample,
              },
            },
          },
        },
      },
    },
    "/reviews/{reviewId}": {
      get: {
        tags: ["reviews"],
        responses: {
          200: {
            description: "Review status",
            content: {
              "application/json": {
                example: reviewResponseExample,
              },
            },
          },
        },
      },
    },
  },
} as const;

const outputPath = resolve(process.cwd(), "openapi/openapi.json");
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8");
