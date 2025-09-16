# Athena AI Client

> Front-of-house experience for orchestrated research: conversational intake, live agent telemetry, and polished report review.

## Quick Facts
| | |
| --- | --- |
| **Runtime** | React 19, Vite 6, TypeScript strict mode |
| **Routing** | TanStack Router with generated route tree and nested layouts |
| **State** | Zustand stores for UI/session state + TanStack Query for network cache |
| **Styling** | Tailwind CSS 4, shadcn/ui primitives, custom neon utility plugin |
| **Testing** | Vitest + Testing Library running on jsdom |
| **Streaming** | Vercel AI SDK adapters + WebSocket event pipeline |

## Architecture Overview
- **Entry point**: `src/main.tsx` mounts the router, query client, and providers for auth, theme, and analytics.
- **Layouts**: `src/routes/__root.tsx` hosts global shells, with `_auth` and `_authenticated` directories modeling public versus secured flows.
- **Feature slices**: Directories under `src/routes` pair UI with loader logic; domain-specific hooks live in `src/hooks` to keep components presentational.
- **Services**: `src/services` wraps tRPC clients, streaming adapters, and report assemblers so network concerns stay isolated.
- **State stores**: `src/store` packages Zustand slices for session playback, command palette, and layout preferences.

## Directory Guide
| Path | Purpose |
| --- | --- |
| `src/components/ui` | Tailored shadcn/ui primitives with neon theming and accessibility tweaks. |
| `src/components/ai-elements` | Agent cards, streaming tokens, and run progress visualizations. |
| `src/components/input-modal` | Command console orchestration (validation, multi-step flows, telemetry). |
| `src/integrations/auth` | Better Auth client bindings plus session gate helpers. |
| `src/integrations/tanstack-query` | Query client factory, cache hydration utilities, and listener registrations. |
| `src/lib` | Pure utilities (formatters, clipboard helpers, markdown transforms). |
| `src/types` | Shared TypeScript contracts mirrored from the server package. |

## Development Workflow
```bash
# install dependencies from repo root
pnpm install

# launch only the client with hot reload
pnpm -F @athena-ai/client dev

# lint, format, and type-check before committing
pnpm -F @athena-ai/client check
pnpm -F @athena-ai/client check-types

# create a production bundle
pnpm -F @athena-ai/client build
```
The generated `src/routeTree.gen.ts` file is produced when the dev server boots; delete and restart the dev server if route definitions go stale.

## Styling & Design System
- Tailwind extends OKLCH-powered neon palettes (`neon.*` tokens) alongside glassmorphism utilities in the custom plugin defined in `tailwind.config.ts`.
- Base typography and spacing scale follow design tokens in `src/styles.css`. Prefer semantic classes over ad-hoc magic numbers.
- Keep components composable: primitive building blocks belong in `src/components/ui`, while feature components wrap them with minimal logic.
- Always author focus states and reduced-motion fallbacks; the plugin exposes `.hocus` variants to simplify hover/focus parity.

## Data & State Patterns
- Use TanStack Router loaders for data that should resolve before paint (e.g., organization context). Co-locate loader schemas with the route file to keep types trusted.
- TanStack Query handles streaming hydration via the Vercel AI SDK—subscribe in `src/services` and fan results into Zustand so UI can animate without re-render storms.
- Leverage `useEffectEvent` helpers when bridging imperative event streams with declarative components to avoid stale closures.

## Testing & Quality Gates
- Place Vitest specs next to the unit under test using `.test.tsx` or `.test.ts`. Keep mocks lightweight by snapshotting agent transcripts in `__fixtures__` directories.
- Run `pnpm -F @athena-ai/client test --runInBand` when debugging DOM timing issues; jsdom + happy-dom adapters support streaming assertions.
- Accessibility checks are run in CI via axe integration; locally, use the `checkA11y` helper in component stories or tests.

## Performance & Diagnostics
- Web Vitals hooks in `reportWebVitals.ts` emit metrics to PostHog when enabled; toggle via environment flags in `src/config/env.ts`.
- Prefer React Suspense boundaries to isolate slow-loading panels; streaming views should default to skeleton components housed in `src/components/skeletons`.
- Inspect query cache usage with TanStack Query Devtools (auto-injected in development builds) to spot stale or duplicate fetches.

## Troubleshooting Checklist
1. **Missing environment variables**: confirm `VITE_API_BASE_URL` and other `VITE_` prefixed keys exist before starting the dev server.
2. **Route not rendering**: ensure the file exports a `Route` created with `createFileRoute` and restart dev server to regenerate the tree.
3. **Styling drift**: run `pnpm -F @athena-ai/client check` to apply Biome formatting; Tailwind jit will purge unused classes if the class name is not statically analyzable.
4. **Streaming gaps**: verify the websocket endpoint URL in `src/services/websocket.ts` matches the server configuration and that the user session has agent access.
