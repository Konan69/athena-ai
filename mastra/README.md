# Athena AI Mastra Workspace

> Orchestration brain for Athena AI — defines agents, tools, prompts, and workflows that coordinate research across external services.

## Quick Facts
| | |
| --- | --- |
| **Runtime** | Node 20+ (ESM) with Mastra CLI |
| **Agents** | Configured in `src/mastra/agents` with capability maps and guard rails |
| **Prompts** | Authored in Markdown, transformed to TypeScript during `prebuild` |
| **Memory** | Mastra memory adapters backed by PostgreSQL via `@mastra/pg` |
| **Tools** | Exa search, PostHog analytics, server utilities exposed through Mastra MCP |

## Directory Tour
| Path | Description |
| --- | --- |
| `src/mastra/agents` | Agent manifests: goals, tools, routing metadata, escalation paths. |
| `src/mastra/workflows` | Multi-step orchestrations that decompose prompts, call tools, and stitch outputs. |
| `src/mastra/tools` | Custom tool definitions that wrap server endpoints, vector lookups, or third-party APIs. |
| `src/mastra/prompts` | Authoring source for prompts. Markdown files are converted into `.ts` modules during `pnpm -F @athena-ai/mastra build` via the `prebuild` script. |
| `src/mastra/lib` | Shared helpers for logging, telemetry, and context shaping so prompts stay lean. |
| `src/config` | Environment schema, runtime wiring, and connection utilities reused across agents. |

## Development Workflow
```bash
# install dependencies from repo root
pnpm install

# run mastra in watch mode with live reload and agent preview tooling
pnpm -F @athena-ai/mastra dev

# build agents and prompts for deployment
pnpm -F @athena-ai/mastra build

# start the compiled bundle (used for production validation)
pnpm -F @athena-ai/mastra start
```
The `prebuild` script transforms Markdown prompts into TypeScript exporters. When editing prompts, run the build once or re-trigger `prebuild` to ensure the generated modules stay in sync.

## Agent Composition
- Keep agent manifests declarative. Describe capabilities, allowed tools, and guard rails in the agent definition; delegate heavy lifting to workflows or shared helpers.
- Reuse base prompt fragments from `prompts/base.ts` where possible to maintain a consistent tone and safety posture.
- Document agent-specific environment needs in `src/config` and mirror them in AGENTS.md when the server or client must be aware of new features.

## Workflows & Tools
- Workflows coordinate multiple agents: break down the user prompt, run research, and synthesize final reports. Store them in `src/mastra/workflows` with descriptive filenames such as `research-workflow.ts`.
- Tools expose deterministic behavior to agents. Wrap external services (OpenAI, Exa, PostHog) with clear input/output contracts and fallbacks.
- When integrating new server capabilities, surface them as tools first. Keep cross-workspace TypeScript contracts aligned using exports from `@athena-ai/server/types`.

## Prompt Guidelines
- Author prompts in Markdown for readability. Keep instructions modular and rely on placeholders (`{{variable}}`) for runtime data.
- Ensure safety instructions cover knowledge cutoffs, restricted categories, and escalation rules. Review for tone and duplication during PRs.
- Generated `.ts` prompt files should never be edited manually; treat them as derived artifacts.

## Testing & Validation
- Automated unit tests are intentionally light. Validate changes by running scenario scripts through `pnpm -F @athena-ai/mastra dev` and capturing transcripts.
- Coordinate with the server workspace to confirm streaming payloads and agent state transitions still match the contracts in `@athena-ai/server/types/agents`.
- For significant behavior changes, record demo sessions or update docs in `/docs` so reviewers can follow the agent flow end to end.

## Operational Notes
- Environment variables live in the workspace `.env`; see `src/config/env.ts` (if present) for validation. Sync any new secrets with the deployment platform and Better Auth vaults.
- Logs and telemetry should flow back to the server using provided utilities in `src/mastra/lib`. Avoid console logging except when diagnosing locally.
- Keep dependencies aligned with the server workspace to avoid mismatched versions of shared packages (Effect, AI SDK, Mastra core).
