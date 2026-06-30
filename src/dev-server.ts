import { createApp } from "./app";

const parsePort = (): number => {
  const value = process.env.PORT ?? "3001";
  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return parsed;
};

const run = async (): Promise<void> => {
  const app = createApp();
  const port = parsePort();
  const host = process.env.HOST ?? "127.0.0.1";

  try {
    await app.listen({ port, host });
    app.log.info({ host, port }, "api dev server started");
  } catch (error) {
    app.log.error({ error }, "failed to start api dev server");
    process.exitCode = 1;
  }

  const shutdown = async (): Promise<void> => {
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", () => {
    void shutdown();
  });
  process.on("SIGTERM", () => {
    void shutdown();
  });
};

void run();
