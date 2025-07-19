#### Project Athena · Version 1.0 · 25 Jun 2025 (Updated)

    		Field
    		Value
    		Author
    		T3 Chat (co-architect)
    		Owner
    		Konan
    		Product Type
    		SaaS platform for dynamic AI agents
    		Primary Release
    		v1 (Local prototype, runs on laptop)
    		Future Releases
    		v1.1 Cloud / v2 Multi-tenant SaaS

#### 1 Problem Statement

Current AI tooling makes it easy to call a single LLM, but very hard to run many specialised agents concurrently, manage state, and consolidate results into reliable outputs within a production-grade, typed, cloud-ready environment. Teams waste time wiring orchestration glue, debugging race conditions, and re-implementing monitoring.

#### 2 Vision & Goals

    		Goal Category
    		Goal Statement
    		Product
    		Let any user trigger complex tasks (starting with Deep Research) and receive a polished Markdown report in minutes.
    		Technical
    		Provide a type-safe, highly concurrent orchestration layer that can spawn, monitor and aggregate child agents both locally and in serverless clouds.
    		Business
    		Deliver a foundation that can be commercialised as a subscription SaaS, with Datadog dashboards for both business and LLM metrics.

#### 3 Personas

    		Persona
    		Needs
    		Pain Points
    		Power-User Developer (Konan)
    		Predictable, debuggable, highly-typed system; ability to extend with new tools quickly.
    		Runtime surprises, slow end-to-end latency, brittle glue code.
    		Future End-user (Analyst)
    		Quick, credible answers compiled from multiple sources.
    		Manual web research takes hours; results lack structure.

#### 4 Scope

#### 4.1 In-Scope (v1)

    		Category
    		Requirement
    		Core Workflow
    		“Deep Research” from single prompt → Markdown report.
    		Orchestration
    		mastra,js running inside a Bun server; checkpointed to SQLite.
    		Dynamic Concurrency
    		Orchestrator decomposes work, spins up parallel child agents (fan-out), waits for completion (fan-in).
    		Child Agents
    		Web-research agents using Exa API; Summariser agent for synthesis.
    		Output
    		Markdown file saved to output/ directory; downloadable via API.
    		Frontend
    		Vite + React + Shadcn/ui + Zustand + Vercel AI SDK (streaming).
    		Backend
    		Bun HTTP server with modular middleware; uses Mastra as orchestrator framework.
    		Validation
    		Zod schemas for every API boundary & tool IO.
    		Security
    		Input/output length checks, path whitelisting, env-based secrets.
    		Observability
    		Datadog APM + custom LLM spans (prompt, completion, tokens, cost).

#### 4.2 Out of Scope (v1)

- DOCX/PDF export
- Multi-user auth & billing
- Cloud deployment (migrates in v1.1)
- MCP integration (v1.2)
- Advanced guardrail frameworks (Nemo, Guardrails-AI)

#### 5 Functional Requirements

    		ID
    		User Story
    		Acceptance Criteria
    		F-01
    		As a user, I submit a research query.
    		API accepts POST /api/chat with text payload.
    		F-02
    		I see live progress updates.
    		UI streams tokens & tool-status lines ≤ 1 s after backend emits them.
    		F-03
    		The orchestrator decomposes work.
    		Assigner node outputs ≥1 task objects with agent_type and params.
    		F-04
    		Up to N child agents run in parallel.
    		Executor proves concurrency via Datadog span timings overlap.
    		F-05
    		A final Markdown report is written.
    		File appears in output/; download endpoint returns 200 with content-disposition.
    		F-06
    		Agents can request clarification.
    		UI renders a prompt and user reply is routed back into graph state.

#### 6 Non-Functional Requirements

    		Category
    		Requirement
    		Type Safety
    		100% TypeScript; Zod validation must pass at every boundary.
    		Performance
    		5 parallel web-research agents complete benchmark query in < 20s on M-series laptop.
    		Reliability
    		If any child agent fails, orchestrator retries once; steady-state success ≥ 95%.
    		Observability
    		Every HTTP request, LangGraph node, tool call, and LLM usage logged as Datadog trace/span.
    		Security
    		File writes limited to output/; no path traversal; API keys never logged.

#### 7 High-Level Architecture

    		Layer
    		Technology & Notes
    		Frontend SPA
    		Vite + React 18 · Shadcn/ui · Zustand · Vercel AI SDK (useChat)
    		API Gateway
    		Bun.serve with composable middleware (logging, CORS, auth)
    		Orchestration
    		Mastra orchestrator with LangGraph-style step chaining · .parallel() for local concurrency
    		Concurrency
    		Phase 1: Effect in-process · Phase 2: Serverless via MCP tool endpoints
    		Tools
    		openrouter, Exa API (search), FS writer, summarizer
    		Persistence
    		SQLite for checkpointing (phase 1); Redis or RDS (phase 2)
    		Observability
    		Datadog APM (dd-trace), custom spans for LLM/tool usage
    		Security Edge
    		Zod validation, JWT auth stub, env-secret handling

#### 8 Concurrency Strategy (Updated)

- Fan-Out: Assigner emits array of task descriptors.
- Parallel Run (v1): In-process: Structured concurrency using Effect-TS fibers for robust, typed error handling and cancellation.
- Parallel Run (v1.2+): Remote: Sub-agents exposed via MCPServer; orchestrator fans out HTTP/SSE calls using MCPClient.
- Fan-In: Gather agent responses, merge to graph state, route to summarizer.
- Agent Hosting: Agents run as local modules (v1) or independent serverless functions (v1.2).

#### 9 Roadmap (Selected Milestones)

Version | Target | Key Additions
v1.0 (Local) | Aug 2025 | In-process Mastra orchestrator · Local agents · Markdown writer · SQLite checkpointing
v1.1 (Cloud) | Oct 2025 | Bun API on Fly.io · Redis checkpointing · File writer → S3 uploader
v1.2 (MCP) | Dec 2025 | Agents exposed via MCPServer · Orchestrator uses MCPClient to dynamically invoke agents
v2.0 (SaaS) | Q2 2026 | Multi-tenant auth · Usage billing · Admin UI · Tooling sandbox

#### 10 Assumptions & Dependencies

- Mastra >= 0.9.0 (for MCP support)
- Exa API free tier sufficient for v1 testing
- OpenAI / Anthropic keys provisioned
- Bun >= 1.1 installed
- Datadog APM configured with ingestion key
- MCP agents can be hosted on Vercel/Fly with HTTP/SSE access
- apify mcp

#### 11 Success Metrics

    		Metric
    		Target
    		First-byte latency (UI stream)
    		≤ 1s median
    		Report generation success
    		≥ 90% queries
    		Parallel efficiency
    		5-topic benchmark runs ≤ 1.2 × ideal linear time / 5
    		Unit test coverage (backend)
    		≥ 80%
    		Mean Datadog APM error rate
    		≤ 2%

#### 12 Open Questions (Updated)

1. What is the max number of parallel MCP agents before cost/perf trade-offs become poor?
2. How to coordinate session state across MCP server calls (JWT / headers / sticky sessions)?
3. Should orchestration logic use circuit-breakers & retries across agent services?
4. Do we need edge caching / CDN layer for report downloads and long-running tasks?
5. Should agents be pre-warmed or dynamically cold-started per invocation?
6. How to manage secrets (LLM keys, API tokens) across many serverless agents?

#### 13 Sign-Off

    		Stakeholder
    		Approval
    		Konan
    		☑ (pending)
    		T3 Chat
    		✔

End of PRD – Project Athena v1 (Mastra Edition)
