import { PostHog } from "posthog-node";
import { env } from "./env";

export const posthog = new PostHog(
  env.POSTHOG_PUBLIC_KEY,
  { host: 'https://us.i.posthog.com' }
);

