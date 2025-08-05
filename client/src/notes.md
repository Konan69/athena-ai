# TRPC + React Query (TanStack Query v11) - QueryClient Options and Usage

This document merges the core concepts and best practices for using tRPC with TanStack Query (React Query v11), focusing on how to manage data fetching, caching, and hydration in React applications—especially when integrating with React Router and SSR.

---

## Core QueryClient Methods

### `fetchQuery`

- Synchronously fetches data from the server and returns it immediately.
- Will refetch if the cache is stale or missing.
- Best used in React Router loaders or blocking SSR scenarios where data is required before rendering.

### `ensureQueryData`

- Similar to `fetchQuery`, but never throws errors.
- Returns cached data if available, or fetches and caches it.
- Safer for UI rendering, as it avoids breaking suspense boundaries.
- Ideal for hydrating `useSuspenseQuery` in conjunction with loaders or preloaded data.

### `prefetchQuery`

- Asynchronously fetches and caches data without returning it.
- Useful for warming the cache ahead of navigation (e.g., on hover or route transitions).
- Does not block rendering.

---

## Component Hooks

### `useQuery`

- Standard React hook for fetching and caching data.
- Returns `{ data, isLoading, error }`.
- Supports stale-while-revalidate and refetching.
- Suitable for optional or client-side data loading.

### `useSuspenseQuery`

- Variant of `useQuery` designed for React Suspense.
- Requires the query to be preloaded or guaranteed to resolve.
- Only returns `{ data }` (no loading or error state).
- Ideal when paired with React Router loaders and `ensureQueryData`.

---

## Best Practices

- Use `fetchQuery` in React Router loaders when data is required immediately for rendering.
- Use `ensureQueryData` to safely hydrate `useSuspenseQuery` and avoid unhandled rejections.
- Use `prefetchQuery` for non-blocking preloading (e.g., on hover or route transitions).
- Pair `useSuspenseQuery` with a route loader for data-safe suspense rendering.
- Always use `queryOptions()` from the tRPC proxy to ensure consistent query keys and configurations.
- Use `dehydrate`/`hydrate` with superjson for correct serialization and deserialization of data.
- Wrap all data access in your context (e.g., `getContext`) to ensure a single instance of `queryClient` and tRPC.

---

## When Not To Use

- Avoid using `fetchQuery` inside components; prefer `useQuery` or `useSuspenseQuery` for component-level data fetching.
- Avoid `prefetchQuery` if you need data immediately in the render path.
- Do not use `useSuspenseQuery` without preloading; this will cause the component to suspend indefinitely or throw.

---

## Summary Table

| Method             | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `fetchQuery`       | Blocking fetch with immediate return      |
| `ensureQueryData`  | Safe fetch for suspense or SSR            |
| `prefetchQuery`    | Non-blocking cache priming                |
| `useQuery`         | Regular React data fetching               |
| `useSuspenseQuery` | Suspense-compatible fetch (needs preload) |

---

## Loader and Suspense Integration

The recommended approach is to use a loader with TanStack's `prefetchQuery` and provide a loading component via the `pendingComponent` prop in your Route configuration. Then, in your component, use `useSuspenseQuery` with the same `queryKey` that was used in the prefetch. This ensures proper caching and seamless data hydration.

**Example Flow:**

1. In your route config, set a `pendingComponent` and a loader that calls `ctx.queryClient.prefetchQuery`.
2. In your component, call `useSuspenseQuery` with the same `queryKey` used in the loader.
   - You can omit the `queryFn` in `useSuspenseQuery` if the data is already prefetched and the `queryKey` is present.
   - For dynamic queries (e.g., with an ID), you may still provide the `queryFn`.

---

## FAQ

**Q: How does prefetching work in this context, and how is it different from just using `useSuspenseQuery`?**

**A:**  
Prefetching with `prefetchQuery` in the loader warms the cache before the component renders. When the component mounts and calls `useSuspenseQuery` with the same `queryKey`, it retrieves the data from the cache instead of refetching. This enables instant data availability and smooth suspense transitions.

---

**Q: Why use `useSuspenseQuery` in the component instead of just reading loader data?**

**A:**  
While you can use loader data directly, `useSuspenseQuery` is beneficial when you have multiple queries. It allows parts of the UI to display as soon as their data is ready, rather than waiting for all queries to resolve, resulting in a more responsive UI.

---

**Q: If the loader prefetched the data (e.g., on hover), will `useSuspenseQuery` fetch again when the component renders?**

**A:**  
No. If the data was prefetched and is still fresh in the cache, `useSuspenseQuery` will retrieve it from the cache without refetching. For example, hovering over a Link can trigger prefetching, so when the route is activated, the data is already available.

---
