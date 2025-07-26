// import { createMiddleware } from "hono/factory";

// // Sensitive keys that should be redacted from logs
// const SENSITIVE_KEYS = [
//   "password",
//   "token",
//   "secret",
//   "key",
//   "authorization",
//   "auth",
//   "apikey",
//   "api_key",
//   "access_token",
//   "refresh_token",
//   "session",
//   "cookie",
//   "csrf",
//   "jwt",
//   "bearer",
// ];

// /**
//  * Recursively redacts sensitive information from objects.
//  */
// function redactSensitiveData(obj: any): any {
//   if (obj === null || obj === undefined) {
//     return obj;
//   }

//   if (typeof obj === "string") {
//     // Check if the string looks like a token or key
//     if (obj.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(obj)) {
//       return "[REDACTED]";
//     }
//     return obj;
//   }

//   if (Array.isArray(obj)) {
//     return obj.map(redactSensitiveData);
//   }

//   if (typeof obj === "object") {
//     const redacted: any = {};

//     for (const [key, value] of Object.entries(obj)) {
//       const lowerKey = key.toLowerCase();

//       // Check if key contains sensitive information
//       const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
//         lowerKey.includes(sensitiveKey)
//       );

//       if (isSensitive) {
//         redacted[key] = "[REDACTED]";
//       } else {
//         redacted[key] = redactSensitiveData(value);
//       }
//     }

//     return redacted;
//   }

//   return obj;
// }

// export const requestLogger = createMiddleware(async (c, next) => {
//   const logger = c.get("logger");
//   const start = Date.now();

//   // Redact sensitive data from request body and headers
//   const safeBody = redactSensitiveData(c.req.raw.body);

//   logger(
//     { method: c.req.method, url: c.req.path, body: safeBody },
//     "Incoming request"
//   );

//   // c.res.("finish", () => {
//   //   const duration = Date.now() - start;

//   //   logger.info(
//   //     {
//   //       statusCode: c.res.status,
//   //     },
//   //     `Request completed in ${duration}ms`
//   //   );
//   // });

//   return next();
// });
