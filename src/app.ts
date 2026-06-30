import Fastify, { type FastifyInstance } from "fastify";
import {
  errorSchema,
  healthResponseSchema,
  reposConnectRequestSchema,
  reposConnectResponseSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";

const now = (): string => new Date().toISOString();

export const createApp = (): FastifyInstance => {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (request) => {
    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
      },
      "incoming request",
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    const payload = errorSchema.parse({
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "VALIDATION_ERROR",
      message,
      requestId: request.id,
      timestamp: now(),
    });

    void reply.status(statusCode).send(payload);
  });

  app.get("/health", async (_request, reply) => {
    const payload = healthResponseSchema.parse({
      status: "ok",
      service: "ai-devtool-api",
      version: "0.1.0",
      timestamp: now(),
    });

    return reply.send(payload);
  });

  app.post("/repos/connect", async (request, reply) => {
    const bodyValidation = reposConnectRequestSchema.safeParse(request.body);

    if (!bodyValidation.success) {
      const error = new Error("Invalid repos/connect request payload");
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const body = bodyValidation.data;
    const payload = reposConnectResponseSchema.parse({
      connectionId: globalThis.crypto.randomUUID(),
      provider: body.provider,
      organization: body.organization ?? null,
      repository: body.repository,
      defaultBranch: body.defaultBranch,
      status: "connected",
      createdAt: now(),
    });

    return reply.status(201).send(payload);
  });

  return app;
};
