import {
  repoIndexStatusOutputSchema,
  repoSearchOutputSchema,
  type RepoIndexStatusOutput,
  type RepoSearchOutput,
} from "@ai-devtool/ai-devtool-contracts/src/index";

const now = (): string => new Date().toISOString();

const corpus = [
  {
    path: "src/services/review-service.ts",
    line: 42,
    snippet: "const findings = analyzeCodeChanges(repositoryId, branch)",
  },
  {
    path: "src/app.ts",
    line: 84,
    snippet: "app.post('/reviews', async (request, reply) => { ... })",
  },
  {
    path: "src/worker/index.ts",
    line: 31,
    snippet: "retryPolicy: { strategy: 'exponential', maxAttempts: 5 }",
  },
  {
    path: "src/repositories/search.ts",
    line: 18,
    snippet: "vectorStore.similaritySearch(query, topK)",
  },
];

export class RepositoryInsightsService {
  async getIndexStatus(repositoryId: string): Promise<RepoIndexStatusOutput> {
    const value = this.hash(repositoryId) % 100;
    const status = value > 85 ? "completed" : value > 35 ? "running" : "queued";

    return repoIndexStatusOutputSchema.parse({
      repositoryId,
      status,
      progress: Math.min(100, Math.max(0, value)),
      updatedAt: now(),
    });
  }

  async search(repositoryId: string, query: string, topK: number): Promise<RepoSearchOutput> {
    const q = query.trim().toLowerCase();
    const ranked = corpus
      .map((item) => {
        const haystack = `${item.path} ${item.snippet}`.toLowerCase();
        const score = haystack.includes(q) ? 0.92 : 0.45;

        return {
          ...item,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((item) => ({
        path: item.path,
        line: item.line,
        score: item.score,
        snippet: item.snippet,
      }));

    return repoSearchOutputSchema.parse({
      repositoryId,
      query,
      tookMs: 10 + ranked.length,
      results: ranked,
    });
  }

  private hash(value: string): number {
    let result = 0;

    for (const char of value) {
      result = (result * 31 + char.charCodeAt(0)) % 101;
    }

    return result;
  }
}