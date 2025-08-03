import type { QueryClient } from "@tanstack/react-query";
import type { AuthContext } from "../lib/auth-client";
import type { trpc } from "@/integrations/tanstack-query/root-provider";

export interface MyRouterContext {
  queryClient: QueryClient;
  auth: AuthContext;
  trpc: typeof trpc;
}
