# Athena AI Server

> Type-safe Bun API that authenticates users, orchestrates agent jobs, and streams every step to the client.

## Quick Facts
| | |
| --- | --- |
| **Runtime** | Bun 1.x with native test runner |
| **Framework** | Hono + tRPC bridge for HTTP and WebSocket procedures |
| **Database** | PostgreSQL managed by Drizzle ORM and drizzle-kit migrations |
| **Messaging** | Streaming responses via EventSource/WebSocket adapters and Effect-TS channels |
| **Auth** | Better Auth with Google OAuth and session persistence |
| **Observability** | Pino structured logging, Datadog APM spans, OpenTelemetry contracts |

## Architectural Overview
- **Entry point**: `src/server.ts` bootstraps environment validation, registers observability hooks, and mounts the Hono app with tRPC routers and static assets.
- **Modules**: Domain folders under `src/modules` mirror business capabilities (agents, chat, library, organization, events). Each module exports validators, services, and routers wired together in `src/modules/index.ts`.
- **tRPC integration**: `src/trpc/base.ts` defines context creation, middleware, and error formatting; `src/trpc/index.ts` stitches module routers into a single caller for the client package.
- **Database layer**: `src/db` houses schema definitions, migrations, and helper factories. Drizzle configuration files (`drizzle.config.ts` and `drizzle.test.config.ts`) point to runtime versus test databases.
- **Cross-cutting support**: Middleware (auth, rate limiting, tracing) lives in `src/middleware`, while utilities (error mappers, factories) live in `src/lib`.

## Development Workflow
```bash
# install dependencies from repo root
pnpm install

# run the API with hot reload and Bun's --hot flag
pnpm -F @athena-ai/server dev

# build TypeScript to dist/
pnpm -F @athena-ai/server build

# spin up the test database and run the integration suite
pnpm -F @athena-ai/server test:setup
pnpm -F @athena-ai/server test

# stop and clean local containers when finished
pnpm -F @athena-ai/server test:db:down
```
Configuration lives in `src/config`; environment variables are validated through `@t3-oss/env-core`. Keep `.env` files in the workspace root and document new keys here.

## Domain Breakdown
| Module | Responsibilities | Notable Files |
| --- | --- | --- |
| `agents` | Manages agent definitions, assignment flows, and chat escalation to specialized workers. | `agent.service.ts`, `routes/procedures.ts`, `validators/agentValidator.ts` |
| `chat` | Handles research conversations, streaming responses, transcript persistence, and report assembly triggers. | `chat.service.ts`, `routes/procedures.ts`, `tests/chat.service.test.ts` |
| `library` | Indexes uploaded documents, exposes retrieval endpoints, coordinates RAG queries. | `libraryService.ts`, `libraryValidator.ts`, `routes/index.ts` |
| `organization` | Provisioning, invitations, role management, and usage reporting. | `organization.service.ts`, `validators/organizationValidator.ts` |
| `events` | Broadcast channel for UI notifications, system telemetry, and audit logging. | `event.service.ts`, `websocket.route.ts`, `websocket.service.ts` |
| `RAG` | Vector store utilities, embedding pipelines, and search strategies. | `ragService.ts`, `strategies/`, `events.ts` |

## Code Style & Best Practices
- Stick to repository-wide strict TypeScript settings; declare exports explicitly and avoid `any`.
- Validate every external boundary with Zod schemas. Shared types should flow through `src/types` and be re-exported for the client.
- Use Effect-TS for orchestrating multi-step workflows; encapsulate long-running sequences in `Effect` pipelines to keep cancellation controllable.
- Log with context. Prefer injecting Pino loggers via factory helpers from `src/lib/factory.ts` rather than importing global instances.
- When touching the database, update schema definitions, add migrations under `src/db/migrations`, and adjust seed utilities if required.

## Testing Strategy
- **Integration suites**: `src/__tests__` houses end-to-end style tests that hit live routers against the test database.
- **Module tests**: Specific behavior such as chat service fan-out lives under module-specific `tests` folders (for example, `src/modules/chat/tests`).
- **Coverage**: `pnpm -F @athena-ai/server test:coverage` reports hot paths; review before merging changes to core flows.
- **Mocking**: Stub third-party calls (OpenAI, PostHog, Redis) with lightweight adapters inside the relevant module test directory so suites remain deterministic.

## Observability & Operations
- Datadog tracing is initialized in `src/observability/tracer.ts`; ensure each new handler emits spans with descriptive names and status tags.
- Structured logs default to JSON in production. Use Pino pretty transport locally for readability and include correlation IDs in log contexts.
- Background jobs and long polling endpoints should publish lifecycle events through the `events` module so the client can render real-time progress.
- Health endpoints and readiness checks surface under the Hono app—extend them when adding critical dependencies (queues, external APIs).

## Deployment Considerations
- Builds emit ESM under `dist/`. Deploy the `dist/server.js` entry with Bun runtime and provide environment variables via the platform’s secret store.
- Database migrations are generated with drizzle-kit (see package scripts); run them as part of deployment pipelines before rolling out new code.
- Keep an eye on memory usage for Effect-TS fibers during peak orchestration; tune concurrency or add circuit breakers in module services if needed.
