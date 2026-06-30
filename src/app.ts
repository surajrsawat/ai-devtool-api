import Fastify, { type FastifyInstance } from "fastify";
import {
  errorSchema,
  healthResponseSchema,
  repoIndexStatusInputSchema,
  reposConnectRequestSchema,
  reposConnectResponseSchema,
  repoSearchInputSchema,
} from "@ai-devtool/ai-devtool-contracts/src/index";
import { reviewResponseSchema } from "./schemas/reviews";
import { RepositoryInsightsService } from "./services/repository-insights-service";
import { ReviewService } from "./services/review-service";

const now = (): string => new Date().toISOString();

export const createApp = (): FastifyInstance => {
  const app = Fastify({ logger: true });
  const reviewService = new ReviewService();
  const insightsService = new RepositoryInsightsService();

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

  app.get("/repos/:repositoryId/index-status", async (request, reply) => {
    const paramsResult = repoIndexStatusInputSchema.safeParse(request.params);

    if (!paramsResult.success) {
      const error = new Error("Invalid repository id");
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const payload = await insightsService.getIndexStatus(paramsResult.data.repositoryId);

    return reply.send(payload);
  });

  app.post("/repos/:repositoryId/search", async (request, reply) => {
    const repositoryIdResult = repoIndexStatusInputSchema.safeParse(request.params);

    if (!repositoryIdResult.success) {
      const error = new Error("Invalid repository id");
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const body =
      typeof request.body === "object" && request.body !== null
        ? (request.body as Record<string, unknown>)
        : {};

    const payloadResult = repoSearchInputSchema.safeParse({
      repositoryId: repositoryIdResult.data.repositoryId,
      query: body.query,
      topK: body.topK,
    });

    if (!payloadResult.success) {
      const error = new Error("Invalid search payload");
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const payload = await insightsService.search(
      payloadResult.data.repositoryId,
      payloadResult.data.query,
      payloadResult.data.topK,
    );

    return reply.send(payload);
  });

  app.post("/reviews", async (request, reply) => {
    const body =
      typeof request.body === "object" && request.body !== null
        ? (request.body as Record<string, unknown>)
        : {};

    const created = await reviewService.create({
      repositoryId: typeof body.repositoryId === "string" ? body.repositoryId : "",
      branch: typeof body.branch === "string" ? body.branch : "main",
      prNumber: typeof body.prNumber === "number" ? body.prNumber : undefined,
      prompt: typeof body.prompt === "string" ? body.prompt : undefined,
    });

    return reply.status(201).send(created);
  });

  app.get("/reviews/:reviewId", async (request, reply) => {
    const params = request.params as { reviewId?: unknown };
    const reviewId = typeof params.reviewId === "string" ? params.reviewId : "";

    if (!reviewId) {
      const error = new Error("reviewId is required");
      (error as Error & { statusCode: number }).statusCode = 400;
      throw error;
    }

    const result = await reviewService.getById(reviewId);

    if (!result) {
      const error = new Error("Review not found");
      (error as Error & { statusCode: number }).statusCode = 404;
      throw error;
    }

    return reply.send(reviewResponseSchema.parse(result));
  });

  return app;
};
