import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";

export const queryClient = new QueryClient({
  defaultOptions: {
    dehydrate: { serializeData: superjson.serialize },
    hydrate: { deserializeData: superjson.deserialize },
  },
});

export function getContext() {
  return {
    queryClient,
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
