# TRPC + React Query (TanStack Query v11) - QueryClient Options and Usage

## Core Query Methods (QueryClient)

### `fetchQuery`

- Synchronously fetches data from server.
- Returns data immediately.
- Will refetch if cache is stale or missing.
- Best for loaders or blocking SSR scenarios.

### `ensureQueryData`

- Like `fetchQuery`, but never throws.
- Returns cached data or fetches and caches.
- Safer in UI rendering to avoid breaking suspense boundaries.
- Ideal for `useSuspenseQuery` when paired with loaders or preloaded data.

### `prefetchQuery`

- Asynchronously fetches and caches data.
- Doesn’t return data.
- Useful for warming the cache ahead of navigation.

## Component Hooks

### `useQuery`

- Classic React hook for fetching and caching data.
- Returns `{ data, isLoading, error }`.
- Supports stale-while-revalidate and refetching.
- Suitable for optional or client-side data loading.

### `useSuspenseQuery`

- Variant of `useQuery` that works with React Suspense.
- Requires query to be preloaded or guaranteed to resolve.
- Only returns `{ data }` (no loading/error state).
- Ideal when using React Router loaders with `ensureQueryData`.

## Best Practices

- Use `fetchQuery` inside React Router loaders where data is required immediately.
- Use `ensureQueryData` to safely hydrate `useSuspenseQuery` without risk of unhandled rejections.
- Use `prefetchQuery` for non-blocking preloading (e.g. on hover or route transitions).
- Pair `useSuspenseQuery` with route loader for data-safe suspense rendering.
- Always use `queryOptions()` from tRPC proxy to get consistent keys and configs.
- Use `dehydrate/hydrate` with superjson for correct serialization/deserialization.
- Wrap all data access in your context (`getContext`) to ensure single instance of queryClient and trpc.

## When Not To Use

- Avoid using `fetchQuery` inside components—use `useQuery` or `useSuspenseQuery` instead.
- Avoid `prefetchQuery` if you need data immediately in render path.
- Don’t use `useSuspenseQuery` without preloading; this will suspend indefinitely or throw.

## Summary

- `fetchQuery`: Blocking fetch with return.
- `ensureQueryData`: Safe fetch for suspense or SSR.
- `prefetchQuery`: Non-blocking cache priming.
- `useQuery`: Regular React data fetching.
- `useSuspenseQuery`: Suspense-compatible fetch requiring preload.
