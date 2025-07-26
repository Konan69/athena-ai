import pino from "pino";
import { pinoLogger } from "hono-pino";
import type { DebugLogOptions } from "hono-pino/debug-log";
import pretty from "pino-pretty";
import { env } from "./env";

const isDevelopment = env.NODE_ENV === "development";

const options: DebugLogOptions = {
  colorEnabled: true,
  normalLogFormat: "[{time}] {levelLabel} - {msg} - {module}",
  httpLogFormat:
    "[{time}] {req.method} {req.url} {res.status} - {msg} - {module} ({responseTime}ms)",
};

export const logger = pinoLogger({
  pino: pino(
    {
      level: env.NODE_ENV === "development" ? "debug" : "info",
      transport: isDevelopment
        ? {
            target: "pino-pretty",
            options,
          }
        : undefined,
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      base: {
        pid: false,
        hostname: false,
      },
    },
    isDevelopment ? pretty() : undefined
  ),
});
