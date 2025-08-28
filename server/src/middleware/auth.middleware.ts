import { auth } from "../modules/auth";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    c.set("activeOrganizationId", null);
    throw new HTTPException(401, {
      message: "Session has expired, please login again",
    });
  }
  c.set("user", session.user);
  c.set("session", session.session);
  c.set("activeOrganizationId", session.session.activeOrganizationId);
  return next();
});
