import type { QueryClient } from "@tanstack/react-query";
import type { AuthContext } from "../lib/auth-client";
import type { createTRPCClient } from "@trpc/client";
import type { AppRouter } from "@athena-ai/server/trpc";

export interface MyRouterContext {
  queryClient: QueryClient;
  auth: AuthContext;
  trpc: ReturnType<typeof createTRPCClient<AppRouter>>;
}
