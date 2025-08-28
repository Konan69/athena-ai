import pino from "pino";
import { pinoLogger } from "hono-pino";

import pretty from "pino-pretty";
import { env } from "./env";
import type { HttpLoggerOptions } from "hono-pino/";

const isDevelopment = env.NODE_ENV === "development";

export const createLogger = () => {
  return pino({
    level: env.NODE_ENV === "development" ? "debug" : "info",
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      err: pino.stdSerializers.err,
    },
  },
    isDevelopment
      ? pretty({
        colorize: true,
        singleLine: true,
        ignore: "pid,hostname",
        translateTime: "SYS:standard",
      })
      : undefined
  );
};

// Dedicated Pino logger for error handling using createLogger
export const errorLogger = createLogger();

export const logger = pinoLogger({
  pino: pino(
    {
      level: env.NODE_ENV === "development" ? "debug" : "info",
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      // Add error serialization for better error logging
      serializers: {
        err: pino.stdSerializers.err,
      },
    },
    isDevelopment
      ? pretty({
        colorize: true,
        singleLine: true,
        ignore: "pid,hostname,url,method,host",
        translateTime: "SYS:standard",
      })
      : undefined
  ),
  http: {
    reqId: false,
    onReqBindings: (c) => ({
      url: c.req.raw.url,
      method: c.req.raw.method,
      host: c.req.raw.headers.get("host"),
    }),
    onResBindings: (c) => ({
      res: {
        status: c.res.status,
      },
    }),
    responseTime: true,
    onResMessage: (c) =>
      `${c.req.method} ${c.req.path} status: ${c.res.status} body: ${c.req.raw.body}`,
  },
});

// tRPC error handler function
export const handleTRPCError = (opts: {
  error: any;
  type: string;
  path: string | undefined;
  input: any;
  ctx: any;
  req: any;
}) => {
  const { error, type, path, input, ctx, req } = opts;

  // Use dedicated error logger with cleaner output
  errorLogger.error(
    {
      err: {
        message: typeof error.message === 'object' ? JSON.stringify(error) : error.message || 'Unknown error',
        code: typeof error.code === 'object' ? JSON.stringify(error.code) : error.code || 'UNKNOWN_ERROR',
        type: typeof error.name === 'object' ? JSON.stringify(error.name) : error.name || 'UnknownError',
        path,
        user: ctx?.user?.id
      },
    },
    `tRPC Error: ${typeof error.message === 'object' ? JSON.stringify(error.message) : error.message || 'Unknown error'}`
  );

  // Follow tRPC standards: send internal server errors to bug reporting
  const errorCode = typeof error.code === 'object' ? JSON.stringify(error.code) : error.code;
  if (errorCode === 'INTERNAL_SERVER_ERROR') {
    // Example: send to bug reporting service
    // reportToBugsnag(error, { type, path, input, ctx, req });
  }
};
