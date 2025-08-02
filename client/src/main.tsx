import { StrictMode, useState } from "react";
import * as ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  TanStackQueryProvider,
  getContext,
  queryClient,
} from "./integrations/tanstack-query/root-provider.tsx";
import { routeTree } from "./routeTree.gen";
import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { AuthProvider, useAuth } from "./integrations/auth/root-provider.tsx";
import { TRPCProvider } from "./config/trpc";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@athena-ai/server/trpc";
import { env } from "./config/env.ts";
import superjson from "superjson";

// Create a new router instance
const router = createRouter({
  routeTree,
  context: undefined!,
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

function InnerApp() {
  useAuth();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
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
    })
  );
  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      <RouterProvider
        router={router}
        context={{
          ...getContext(),
          trpc: trpcClient,
        }}
      />
    </TRPCProvider>
  );
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <TanStackQueryProvider>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
        <ReactQueryDevtools position="left" />
      </TanStackQueryProvider>
    </StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
