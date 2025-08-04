import pino from "pino";
import { pinoLogger } from "hono-pino";

import pretty from "pino-pretty";
import { env } from "./env";
import type { HttpLoggerOptions } from "hono-pino/";

const isDevelopment = env.NODE_ENV === "development";

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
      body: c.req.raw.body,
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
