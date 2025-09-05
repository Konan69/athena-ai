import { env } from 'hono/adapter'
import { createMiddleware } from 'hono/factory'
import { PostHog } from 'posthog-node'

export const posthogServerMiddleware = createMiddleware(async (c, next) => {
  const { POSTHOG_PUBLIC_KEY } = env<{ POSTHOG_PUBLIC_KEY:string }>(c)
  const posthog = new PostHog(POSTHOG_PUBLIC_KEY, { host: 'https://us.i.posthog.com' })

  posthog.capture({
      distinctId: c.var.user.id, // Their user id or email
      event: c.req.method + ' ' + c.req.path ,
			groups: {
				organizationId: c.var.activeOrganizationId,
			}
		})
		await posthog.shutdown() 
  await next()
})