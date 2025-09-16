# Athena AI — B2B Autonomous Intelligence Suite

Athena AI is a business-to-business intelligence platform that embeds collaborative AI agents inside enterprise workflows. It gives go-to-market, research, and operations teams a command center where machine teammates gather context, draft deliverables, and keep humans in the loop.

## Product Snapshot
| | |
| --- | --- |
| **Who it serves** | Operators, analysts, customer-facing teams inside growth-stage B2B companies |
| **Primary value** | Accelerates insight generation, document production, and customer responses without breaking compliance guardrails |
| **How it feels** | A secure workspace with agent-powered threads, shared libraries, and real-time playback so stakeholders can audit every decision |

## What You Can Do With Athena
- Spin up dedicated agent workstreams for research, account planning, and knowledge retrieval while tracking them in a unified timeline.
- Centralize organizational knowledge in libraries that agents cite automatically, reinforcing governance and source transparency.
- Route responsibilities between humans and machines with assignment flows, approvals, and contextual notifications.
- Monitor usage, latency, and quality metrics to keep deployments aligned with business objectives.

## Platform Pillars
- **Multi-tenant architecture** keeps customer data partitioned while offering role-based access controls, invitations, and usage reporting for each organization.
- **Agent orchestration** blends generalist and specialist personas, coordinating them through Mastra workflows that respect escalation and safety rules.
- **Real-time collaboration** streams token-level progress to the client so reviewers can intervene, leave feedback, or replay a completed session.
- **Observability & trust** weave telemetry, structured logging, and audit metadata through every layer, giving compliance teams confidence to deploy at scale.

## How the System Is Shaped
| Layer | Focus | Highlights |
| --- | --- | --- |
| **Experience** (`client`) | React 19 + Tailwind interface for command console, organization admin, and transcript playback. |
| **Services** (`server`) | Bun-powered API with tRPC endpoints, Drizzle-backed persistence, Better Auth sessions, and streaming transports. |
| **Orchestration** (`mastra`) | Mastra agents, workflows, and prompt libraries that coordinate external tools like OpenAI, Exa, and PostHog. |
| **Shared Foundation** | Turbo, pnpm workspaces, Biome formatting, and cross-package TypeScript configs living at the repository root. |

## Operating Rhythm
1. Install dependencies with pnpm to sync workspace packages and Turbo cache.
2. Run the composed development environment to launch the client, API, and database studio together.
3. Filter commands to individual packages when iterating on targeted features to keep feedback loops tight.
4. Prepare Docker-backed Postgres instances before executing server tests or orchestration scenarios.
5. Regenerate Mastra prompt artifacts whenever authoring new Markdown instructions to keep the build consistent.

## Collaboration Norms
- Adopt conventional commits (`feat`, `fix`, `chore`, `docs`, `refactor`) so release notes stay clean.
- Write pull requests like customer briefs: articulate the business problem, the shift in behavior, and how reviewers can validate outcomes.
- Capture environment or contract changes in both AGENTS.md and the relevant workspace README to avoid cross-team surprises.
- Favor incremental deliveries; align shared TypeScript contracts before merging changes across client, server, and Mastra packages.

## Continue Exploring
- **AGENTS.md** — Contributor handbook covering project structure, commands, and environment setup.
- **client/README.md** — Deep dive into the React application, state patterns, and design system.
- **server/README.md** — Details on the Bun API, domain modules, and observability practices.
- **mastra/README.md** — Documentation for agent configuration, prompt authoring, and workflow design.
