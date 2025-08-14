import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppRouter } from "@athena-ai/server/trpc";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
} from "@trpc/client";
import { env } from "@/config/env";

export const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
    queries: {
      staleTime: 0,
    },
  },
});
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient({
    links: [
      httpSubscriptionLink({
        url: env.VITE_API_BASE_URL + "/trpc",
        transformer: superjson,
      }),
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
