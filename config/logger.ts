import pino from "pino";
import { env } from "./env";

const isDevelopment = env.NODE_ENV === "development";

export const logger = pino({
  level: env.NODE_ENV === "development" ? "debug" : "info",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "HH:MM:ss Z",
          messageFormat: "{levelLabel} - {msg}",
        },
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
});

// Create child loggers for different modules
export const createLogger = (name: string) => {
  return logger.child({ module: name });
};
