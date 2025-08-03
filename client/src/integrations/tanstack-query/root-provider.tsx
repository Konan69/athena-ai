import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@athena-ai/server/trpc";
import {
  createTRPCContext,
  createTRPCOptionsProxy,
} from "@trpc/tanstack-react-query";
export const { TRPCProvider } = createTRPCContext<AppRouter>();

import superjson from "superjson";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { env } from "@/config/env";

export const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
  },
});
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpBatchLink({
        url: env.VITE_API_BASE_URL + "/trpc",
        transformer: superjson,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  }),
  queryClient,
});

export function getContext() {
  return {
    queryClient,
    trpc,
  };
}

// Use a named export for the Provider component
export function TanStackQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Keep the old export for backward compatibility
export const Provider = TanStackQueryProvider;
