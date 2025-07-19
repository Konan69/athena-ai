# Backend Architecture: Real-Time Event Streaming

**Version:** 1.1
**Author:** T3 Chat
**Status:** In Progress

---

## 1. Introduction

To provide a rich, interactive frontend experience, the backend must stream events to the client in real time, visualizing what the agent is currently doing. This is handled through the **Vercel AI SDK**, which manages a single, unified stream for both LLM token generation and structured metadata events.

The core of this system is the combination of a server-side event bus using **Effect's `Hub`** and the **Vercel AI SDK's `StreamingTextResponse`**.

---

## 2. Architecture

### Backend: Unifying Events with Effect `Hub` and AI SDK

For each research task, the system uses a dedicated `Effect.Hub` as an in-memory message bus. However, instead of creating a separate SSE stream, these events are piped directly into the Vercel AI SDK's data stream.

1.  **Event Publishing**: Agents and the orchestrator publish structured event objects (e.g., `ToolCallStarted`, `AgentError`) to the `Hub`. This keeps the agent logic decoupled from the streaming implementation.
2.  **Stream Unification**: The main API route handler (`POST /api/chat`) is responsible for creating the `StreamingTextResponse`. It subscribes to two sources:
    - The final LLM text generation stream.
    - The `Effect.Hub` for structured metadata events.
3.  **Piping to Client**: The handler uses utilities from the `ai` package to pipe both the text tokens and the JSON event data into a single `ReadableStream`. The AI SDK transparently handles the interleaving of this data for the client.

This pattern leverages the robustness of the AI SDK's connection management while maintaining a clean, decoupled event-sourcing model on the backend with Effect.

### Frontend: Consuming a Unified Stream with `useChat`

The frontend uses the `useChat` hook from the Vercel AI SDK, which is designed to consume the unified stream from the backend.

```javascript
// Example Frontend Code with useChat
import { useChat } from "ai/react";

function MyComponent() {
  const { messages, data, ...rest } = useChat({
    api: "/api/chat",
  });

  // 'messages' contains the assistant's textual response
  // 'data' will contain the structured JSON events from the backend

  // A simple way to visualize the latest event
  const lastEvent = data?.[data.length - 1];

  return (
    <div>
      {/* Render chat messages */}
      {messages.map((m) => (
        <div key={m.id}>
          {m.role}: {m.content}
        </div>
      ))}

      {/* Render visualization based on the latest event */}
      {lastEvent && (
        <div className="status-visualizer">
          Event: {lastEvent.type} - {JSON.stringify(lastEvent.payload)}
        </div>
      )}

      {/* ... form to send new messages */}
    </div>
  );
}
```

The `useChat` hook automatically parses the stream, separating the core message content from the auxiliary JSON data, making it simple to bind UI components to real-time agent events.

---

## 3. Event Schema

All structured data events streamed to the client will follow a consistent schema. The Vercel AI SDK will deliver these in the `data` property of the `useChat` hook.

```typescript
interface AgentEvent {
  type: string; // The type of event, e.g., "ToolCallStarted"
  payload: Record<string, any>; // The data associated with the event
  timestamp: string; // ISO 8601 timestamp
}
```

### Example Events

- **A tool call is initiated:**
  ```json
  {
    "type": "ToolCallStarted",
    "payload": {
      "toolName": "ExaSearch",
      "input": { "query": "Effect-TS for beginners" }
    },
    "timestamp": "2023-10-27T10:00:01Z"
  }
  ```
- **The orchestrator moves to the synthesis step:**
  ```json
  {
    "type": "SynthesisStarted",
    "payload": {
      "message": "Aggregated all research data, beginning final report synthesis."
    },
    "timestamp": "2023-10-27T10:00:10Z"
  }
  ```
- **A typed error occurs:**
  ```json
  {
    "type": "AgentError",
    "payload": {
      "errorName": "AgentTimeoutError",
      "message": "The ExaSearch agent took too long to respond."
    },
    "timestamp": "2023-10-27T10:00:04Z"
  }
  ```
