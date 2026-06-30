import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  healthResponseSchema,
  reposConnectRequestSchema,
  reposConnectResponseSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";

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
  },
} as const;

const outputPath = resolve(process.cwd(), "openapi/openapi.json");
writeFileSync(outputPath, `${JSON.stringify(document, null, 2)}\n`, "utf-8");
