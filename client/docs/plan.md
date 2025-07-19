# Athena Frontend Plan (v1)

## Overview

This document outlines the implementation plan for the Athena frontend, based on the PRD for Project Athena v1. The frontend is a Vite + React SPA designed to enable users to trigger complex AI research tasks and receive polished Markdown reports, with live streaming and robust state management.

---

## 1. Goals & Vision

- **User Experience:** Allow users to submit research queries and receive live, streaming progress and results.
- **Performance:** UI must stream updates ≤ 1s after backend emits them.
- **Extensibility:** Built for rapid addition of new agent types and tools.
- **Type Safety:** 100% TypeScript, Zod validation at API boundaries.

---

## 2. Tech Stack

- **Framework:** Vite + React 18
- **UI:** Shadcn/ui
- **State Management:** Zustand
- **Streaming:** Vercel AI SDK (`useChat`)
- **API Integration:** REST/HTTP (POST /api/chat, streaming endpoints)
- **Validation:** Zod schemas for API payloads

---

## 3. Key Features

- **Query Submission:**
  - Form for user to enter research prompt
  - POST to `/api/chat` with text payload
- **Live Progress Streaming:**
  - Display token stream and tool-status lines in real time
  - UI updates ≤ 1s after backend emits
- **Markdown Report Display & Download:**
  - Render final Markdown report in-app
  - Download button (calls backend endpoint)
- **Agent Clarification Requests:**
  - UI prompt for agent clarification, routes user reply to backend
- **Error Handling:**
  - Show errors, retries, and agent failures clearly
- **Observability:**
  - Log UI events, errors, and stream timings for Datadog

---

## 4. Milestones

1. **MVP UI:** Query form, streaming output, Markdown rendering
2. **API Integration:** Connect to backend endpoints, handle streaming
3. **Clarification Loop:** Support agent clarification requests
4. **Download Report:** Implement download endpoint
5. **Observability Hooks:** Integrate Datadog logging
6. **Polish & Testing:** UI/UX improvements, Zod validation, unit tests

---

## 5. Out of Scope (v1)

- DOCX/PDF export
- Multi-user auth & billing
- Cloud deployment
- Advanced guardrails

---

## 6. Open Questions

- How to handle very large Markdown reports in UI?
- Should we support offline mode for local-only use?
- How to best visualize agent progress and status?

---

## 7. Success Metrics

- First-byte latency ≤ 1s
- ≥ 90% report generation success
- UI error rate ≤ 2%
- 100% TypeScript coverage
