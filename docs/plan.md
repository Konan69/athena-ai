# Athena Backend Plan (v1)

## Overview

This document details the backend implementation plan for Athena, based on the PRD for Project Athena v1. The backend is a Bun HTTP server using Mastra for agent orchestration, with a focus on concurrency with effect library, observability, and robust API boundaries.

---

## 1. Goals & Vision

- **Orchestration:** Type-safe, highly concurrent orchestration of AI agents (fan-out/fan-in).
- **Reliability:** Retry failed agents, checkpoint state, ≥ 95% steady-state success.
- **Observability:** Full Datadog APM integration, custom LLM/tool spans.
- **Security:** Strict input/output validation, path whitelisting, env-based secrets.

---

## 2. Tech Stack

- **Runtime:** Bun >= 1.1
- **Framework:** Mastra >= 0.9.0
- **Database:** SQLite (checkpointing)
- **APM:** Datadog (dd-trace)
- **Validation:** Zod schemas
- **APIs:** REST (POST /api/chat, GET /api/download)
- **Agents:** Local modules (web-research via Exa API, summarizer, FS writer)

---

## 3. Key Features

- **Deep Research Workflow:**
  - Accept POST /api/chat with prompt
  - Orchestrator decomposes work, emits task objects
  - Fan-out: Run up to N child agents in parallel (Promise.all)
  - Fan-in: Aggregate results, pass to summarizer
  - Write Markdown report to output/ directory
- **Streaming & Progress:**
  - Stream tokens and tool-status to frontend
- **Agent Clarification:**
  - Support agent-initiated clarification requests
- **Validation & Security:**
  - Zod validation at every API/tool boundary
  - Input/output length checks
  - No path traversal, API keys never logged
- **Observability:**
  - Datadog APM, custom spans for HTTP, LangGraph nodes, LLM/tool calls
- **Persistence:**
  - Checkpoint state to SQLite

---

## 4. Milestones

1. **API Gateway:** express w bun, logging, CORS, auth stub
2. **Orchestrator:** Mastra integration, task decomposition, concurrency with effect library
3. **Agent Modules:** Exa API, summarizer, FS writer
4. **Persistence:** SQLite checkpointing
5. **Streaming:** Token/tool-status streaming to frontend
6. **Observability:** Datadog APM, custom spans
7. **Validation & Security:** Zod, path checks, env secrets
8. **Testing:** ≥ 80% unit test coverage

---

## 5. Out of Scope (v1)

- DOCX/PDF export
- Multi-user auth & billing
- Cloud deployment
- MCP integration
- Advanced guardrails

---

## 6. Open Questions

- Max parallel agents before perf/cost trade-offs?
- Session state coordination for future MCP?
- Circuit-breakers/retries for agent services?
- Edge caching/CDN for downloads?
- Agent pre-warming vs. cold-start?
- Secret management for serverless agents?

---

## 7. Success Metrics

- ≥ 90% report generation success
- Parallel efficiency: 5-topic run ≤ 1.2× ideal
- ≥ 80% unit test coverage
- Datadog APM error rate ≤ 2%
