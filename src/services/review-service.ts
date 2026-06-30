import {
  reviewCreateRequestSchema,
  reviewResponseSchema,
  type ReviewCreateRequest,
  type ReviewResponse,
} from "../schemas/reviews";

const now = (): string => new Date().toISOString();

export class ReviewService {
  private readonly reviews = new Map<string, ReviewResponse>();

  async create(input: ReviewCreateRequest): Promise<ReviewResponse> {
    const parsed = reviewCreateRequestSchema.parse(input);
    const createdAt = now();

    const completed = reviewResponseSchema.parse({
      reviewId: globalThis.crypto.randomUUID(),
      repositoryId: parsed.repositoryId,
      branch: parsed.branch,
      status: "completed",
      summary: `Automated review completed for ${parsed.repositoryId} (${parsed.branch})`,
      findings: [
        {
          severity: "medium",
          filePath: "src/app.ts",
          line: 73,
          message: "Consider adding explicit timeout handling for outbound service calls.",
        },
        {
          severity: "low",
          filePath: "src/services/review-service.ts",
          line: 21,
          message: "Add tracing metadata to support debugging across distributed services.",
        },
      ],
      createdAt,
      updatedAt: createdAt,
    });

    this.reviews.set(completed.reviewId, completed);

    return completed;
  }

  async getById(reviewId: string): Promise<ReviewResponse | null> {
    const result = this.reviews.get(reviewId);

    return result ?? null;
  }
}