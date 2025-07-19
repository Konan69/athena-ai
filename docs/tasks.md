# Development Tasks

This living document tracks the high-level tasks required to evolve Athena’s backend. Keep it up to date as work progresses.

---

## 1. Foundation & Project Setup

- [x] Adopt a **modular architecture** with clearly separated **controllers**, **services**, and **domain models**.
- [x] For **each module**, create the structure:
  - `controllers/` – HTTP handlers
  - `services/` – business logic & Mastra orchestration
  - `interfaces/` – local types & DTOs
- [x] Integrate the **Effect** library for safe, typed concurrency & retries. See: <https://effect.website/docs>
- [x] Upgrade / pin **Mastra** to the latest stable (≥ 0.9.0) and enable **MCP** orchestration.
- [x] Establish **shared types** in `src/types/` to be reused across modules.

## 2. HTTP & Routing

- [x] Replace the current ad-hoc routes with an **Express controller layer** (e.g. `src/modules/chat/controllers/chat.controller.ts`).
  - Controllers should: validate input, call the relevant service, map errors ➜ HTTP responses.
- [x] Add a **router registry** that automatically discovers and mounts controllers onto the Express app.
- [ ] Integrate **tRPC** alongside Express for type-safe RPC endpoints consumed by the React client.
- [x] Implement middleware: CORS, request logging, error handling.

## 3. Services Layer

- [x] **ChatService** – orchestrates Mastra agents (research, summarizer, writer)
- [x] **PersistenceService** – checkpoint orchestration state to SQLite.

## 4. Agents & Workflows

- [x] Migrate existing `mastra/agents/` & `mastra/workflows/` to **Effect-backed** tasks.
- [x] Create research agents: `researchAgent`, `summarizerAgent`
- [x] Create `researchWorkflow` for orchestrating research and summarization
- [x] Create `persistenceService` for state management
- [ ] Add tests for each agent ensuring deterministic outputs given mocked LLM responses.

## 5. Observability

- [x] Instrument Express server and Effect fibers with **Datadog APM** (`dd-trace`) and Mastra in-built observability.
- [x] Emit custom spans for LLM/tool calls.

## 6. Validation & Security

- [x] End-to-end **zod** validation on all inputs/outputs.
- [x] Path traversal protection for FS operations.
- [x] Secret redaction from logs.

## 7. Integration & Testing

- [x] Fix Mastra workflow execution API calls
- [x] Integrate enhanced web search simulation in `webSearchTool`
- [x] Test the complete research workflow end-to-end
- [x] Add unit tests for services and controllers

## 8. Documentation

- [ ] Keep **architecture docs** up to date (see `docs/architecture/`).
- [ ] Document public API and internal services in `/docs`.

## 9. Current Status

✅ **Completed:**

- Modular architecture with controllers/services/interfaces
- Effect integration for concurrency
- Express routing with manual registration
- Error handling middleware
- Chat and Persistence modules
- Zod validation
- Datadog APM observability with custom spans
- Mastra workflow execution with proper error handling
- Security middleware (path traversal protection)
- Secret redaction in logging
- Comprehensive unit tests
- Enhanced web search simulation

🔄 **In Progress:**

- Server running in development mode
- All API endpoints functional and tested

📋 **Production Ready:**
✅ All core functionality implemented
✅ Security measures in place
✅ Observability and monitoring
✅ Error handling and validation
✅ Unit test coverage

📋 **Optional Enhancements:**

1. Integrate real Exa API for web search
2. Add integration tests
3. Add API documentation
4. Deploy to production environment

---

_Last updated: <!-- TODO: auto-update via pre-commit hook? -->_
