# Repository Guidelines

## Project Structure & Module Organization

Athena AI is a pnpm workspace with three actively developed packages. The React client lives in `client/src` (routes, components, hooks, services) with docs and static assets in `client/public`. The Bun backend resides in `server/src`, organized by domain (`modules`, `db`, `trpc`, shared `lib` utilities) and integration tests under `server/src/__tests__`. Agent orchestration code and prompt assets sit in `mastra/src`, with generated prompt modules emitted next to their Markdown sources. Shared configs (Turbo, TypeScript, Biome) are defined at the repository root.

## Build, Test, and Development Commands

- `pnpm install` – install all workspace dependencies; run after pulling changes.
- `pnpm dev` – launch client, server, and Drizzle Studio via Turbo in watch mode.
- `pnpm -F @athena-ai/client build` – production build for the React app.
- `pnpm -F @athena-ai/server build` – type-check and emit Bun server output to `dist/`.
- `pnpm -F @athena-ai/mastra build` – compile Mastra agents, including Markdown prompt transforms.
- `pnpm clean` – remove `.turbo` cache and workspace `node_modules` (use before release builds).

## Coding Style & Naming Conventions

TypeScript is used across packages; prefer strict typing, explicit interfaces, and `zod` schemas at boundaries. Biome enforces formatting and linting (`pnpm -F @athena-ai/client check` or `pnpm dlx biome check .`) with tab indentation and double quotes in frontend files. Keep React components and hooks in `client/src` using PascalCase exports but kebab-case file names. Backend modules follow folder-by-concern naming (`chat`, `agents`, `observability`); new utilities belong in `server/src/lib` with descriptive camelCase exports. Generated files (e.g., `routeTree.gen.ts`) are ignored—avoid manual edits.

## Testing Guidelines

Frontend unit tests use Vitest and Testing Library; place them alongside components with `.test.tsx` suffixes and run via `pnpm -F @athena-ai/client test`. Server integration tests rely on Bun’s test runner plus Postgres containers; initialize via `pnpm -F @athena-ai/server test:setup` before `pnpm -F @athena-ai/server test`. Branch coverage is tracked informally—run `pnpm -F @athena-ai/server test:coverage` before large merges. Mastra jobs are validated through end-to-end exercises in `mastra dev`; capture new scenarios in docs rather than brittle unit tests.

## Commit & Pull Request Guidelines

Follow conventional commits (`feat:`, `fix:`, `chore:`) matching the existing history; scope optional. Keep commits focused on a single concern and include relevant workspace filter commands in the body when non-obvious. Pull requests must narrate the change, reference related issues, and paste test command output or screenshots for UI updates. Request review from domain owners (client, server, mastra) and ensure CI passes before merging.

## Agent & Configuration Notes

Environment variables live in package-specific `.env` files; document new keys in each README and default to `VITE_` prefixes for client consumption. Mastra prompt Markdown in `mastra/src/mastra/prompts` is transformed during `pnpm -F @athena-ai/mastra build`—keep templates concise and prefer reusable partials. Sensitive keys (OpenAI, Exa, PostHog) should be loaded via Better Auth secrets or local `.env` files; never commit real credentials.
