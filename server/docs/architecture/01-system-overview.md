# Backend Architecture: System Overview

**Version:** 1.0
**Author:** T3 Chat
**Status:** In Progress

---

## 1. Introduction

This document provides a high-level overview of the backend architecture for Project Athena v1. The system is designed to be a robust, observable, and scalable platform for orchestrating complex AI agent workflows, starting with a "Deep Research" task. It is built on a modern TypeScript stack, leveraging **Bun** as the runtime, **Mastra** for orchestration, and **Effect-TS** for structured concurrency and error handling.

The architecture emphasizes type safety, resilience, and clear, real-time communication with the frontend.

---

## 2. Core Components

The backend is composed of several key components that work together to fulfill a user's research request.

```mermaid
graph TD
    subgraph Client
        A[React Frontend w/ Vercel AI SDK]
    end

    subgraph Server (Bun Runtime)
        B[API Gateway w/ AI SDK]
        C[Mastra Orchestrator]
        D[Effect Event Hub]
        E[Agent: Decompose Query]
        F[Agent: Web Research]
        G[Agent: Web Research]
        H[Agent: Synthesize Report]
    end

    A -- "1. POST /api/chat (via useChat)" --> B
    B -- "2. Invokes" --> C
    B -- "6. Streams unified data to" --> A
    C -- "3. Decomposes" --> E
    C -- "4. Spawns N agents" --> F & G
    C -- "5. Consolidates & Synthesizes" --> H

    E -- "Publishes events" --> D
    F -- "Publishes events" --> D
    G -- "Publishes events" --> D
    H -- "Publishes events" --> D
    D -- "Forwards events to" --> B
```

1.  **React Frontend**: The user-facing single-page application. It uses the Vercel AI SDK's `useChat` hook to manage communication with the backend.
2.  **API Gateway**: A Bun server that exposes the public API. It uses the Vercel AI SDK's backend helpers to create a unified stream containing both LLM tokens and structured event data.
3.  **Effect Event Hub**: A dedicated, in-memory message bus for each task. Agents publish their status to this hub, which allows the API Gateway to inject real-time metadata into the stream for frontend visualization. See [`04-real-time-event-streaming.md`](./04-real-time-event-streaming.md) for details.
4.  **Mastra Orchestrator**: The central workflow engine that manages the state of the research task, from query decomposition to final report generation.
5.  **Agents**: Specialized, single-purpose functions that perform specific tasks like breaking down a query, searching the web (via the Exa API), or synthesizing a report from aggregated data.

---

## 3. Key Architectural Documents

- **[Orchestration & Concurrency](./02-orchestration-and-concurrency.md)**: Details the Mastra state graph and the use of Effect-TS for managing parallel agent execution.
- **[API & Error Handling](./03-api-and-error-handling.md)**: Defines the API contract, agent communication patterns, and the typed error handling strategy.
- **[Real-Time Event Streaming](./04-real-time-event-streaming.md)**: Explains how the backend streams agent status events to the frontend for visualization.
