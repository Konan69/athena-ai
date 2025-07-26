import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { appRouter } from "@athena-ai/server/types";
import superjson from "superjson";
import { env } from "../env";

export const trpc = createTRPCClient<typeof appRouter>({
  links: [
    httpBatchLink({
      url: env.VITE_API_BASE_URL + "/trpc",
      transformer: superjson,
    }),
  ],
});
