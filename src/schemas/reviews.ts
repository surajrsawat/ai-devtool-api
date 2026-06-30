import { z } from "zod";

const timestampSchema = z.string().datetime({ offset: true });

export const reviewSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const reviewFindingSchema = z.object({
  severity: reviewSeveritySchema,
  filePath: z.string().min(1),
  line: z.number().int().min(1),
  message: z.string().min(1),
});

export const reviewStatusSchema = z.enum(["queued", "running", "completed", "failed"]);

export const reviewCreateRequestSchema = z.object({
  repositoryId: z.string().min(1),
  branch: z.string().min(1).default("main"),
  prNumber: z.number().int().positive().optional(),
  prompt: z.string().min(1).max(4000).optional(),
});

export const reviewResponseSchema = z.object({
  reviewId: z.string().min(1),
  repositoryId: z.string().min(1),
  branch: z.string().min(1),
  status: reviewStatusSchema,
  summary: z.string().nullable(),
  findings: z.array(reviewFindingSchema),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export type ReviewCreateRequest = z.infer<typeof reviewCreateRequestSchema>;
export type ReviewResponse = z.infer<typeof reviewResponseSchema>;