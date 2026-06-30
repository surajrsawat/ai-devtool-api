import { createApp } from "./app";

type LambdaLikeEvent = {
  path: string;
  httpMethod: string;
  headers?: Record<string, string | undefined>;
  body?: string | null;
};

type LambdaLikeResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const toHttpMethod = (method: string): "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD" => {
  const normalized = method.toUpperCase();

  if (
    normalized === "GET" ||
    normalized === "POST" ||
    normalized === "PUT" ||
    normalized === "PATCH" ||
    normalized === "DELETE" ||
    normalized === "OPTIONS" ||
    normalized === "HEAD"
  ) {
    return normalized;
  }

  return "GET";
};

export const handler = async (event: LambdaLikeEvent): Promise<LambdaLikeResponse> => {
  const app = createApp();

  const response = await app.inject({
    method: toHttpMethod(event.httpMethod),
    url: event.path,
    headers: event.headers,
    payload: event.body ?? undefined,
  });

  await app.close();

  return {
    statusCode: response.statusCode,
    headers: { "content-type": "application/json" },
    body: response.body,
  };
};
