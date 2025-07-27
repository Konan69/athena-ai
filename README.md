# Athena AI - Intelligent Research Platform

> **Project Athena v1.0** - A SaaS platform for dynamic AI agents that orchestrates complex research tasks and delivers polished Markdown reports.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white)](https://bun.sh/)
[![Mastra](https://img.shields.io/badge/Mastra-FF6B6B?style=flat)](https://mastra.ai/)

## 🎯 Overview

Athena AI is a production-grade platform that solves the complexity of orchestrating multiple specialized AI agents. It transforms a single research prompt into comprehensive, well-structured reports by intelligently decomposing work, running parallel research agents, and synthesizing results.

### Key Features

- **🔍 Deep Research Workflow**: Submit a query and receive a polished Markdown report
- **⚡ Concurrent Agent Orchestration**: Parallel execution of specialized AI agents using Effect-TS
- **🔄 Real-time Streaming**: Live progress updates and token streaming to the frontend
- **🛡️ Production-Ready**: Type-safe with Zod validation, comprehensive error handling, and security measures
- **📊 Full Observability**: Datadog APM integration with custom LLM/tool spans
- **🏗️ Modular Architecture**: Clean separation of concerns with controllers, services, and domain models

## 🏛️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │────│   API Gateway    │────│    Mastra       │
│   (Vite + UI)   │    │  (Express/tRPC)  │    │  Orchestrator   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                         │
                                │                         ▼
                       ┌────────▼────────┐       ┌─────────────────┐
                       │ Effect Event Hub │       │   AI Agents     │
                       │  (Real-time)     │       │ ┌─────────────┐ │
                       └─────────────────┘       │ │ Research    │ │
                                                 │ │ Summarizer  │ │
                                                 │ │ Web Search  │ │
                                                 │ └─────────────┘ │
                                                 └─────────────────┘
```

### Technology Stack

**Frontend:**

- **React 19** with **TanStack Router** for routing
- **Shadcn/ui** components with **Tailwind CSS**
- **Vercel AI SDK** for streaming chat interface
- **Zustand** for state management
- **tRPC** for type-safe API calls

**Backend:**

- **Bun** runtime with **Express** server
- **Mastra** for AI agent orchestration
- **Effect-TS** for structured concurrency and error handling
- **PostgreSQL** for persistence with **Drizzle**
- **Zod** for validation at every boundary

**AI & Tools:**

- **OpenAI GPT-4** for agent intelligence
- **Exa API / Brave Search** for web research
- **Better Auth** for authentication

**Observability:**

- **Datadog APM** with custom spans
- **Pino** structured logging
- Real-time event streaming

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.1 ([Install Bun](https://bun.sh/docs/installation))
- **Node.js** >= 18 (for some dependencies)
- **pnpm** package manager
- **PostgreSQL** database

### 1. Clone and Install

```bash
git clone <repository-url>
cd athena-ai

# Install all dependencies
pnpm run install:all
```

### 2. Environment Setup

Create environment files for both client and server:

**Server (.env in `/server`):**

```bash
# Core Configuration
PORT=3000
MASTRA_PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/athena"

# AI Services
OPENAI_API_KEY=your_openai_api_key_here

# Web Search (choose one)
WEB_SEARCH_PROVIDER=exa  # or "brave"
EXA_API_KEY=your_exa_api_key_here
# BRAVE_API_KEY=your_brave_api_key_here  # alternative

# Authentication
BETTER_AUTH_SECRET=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Observability
# DD_API_KEY=your_datadog_api_key
# DD_APP_KEY=your_datadog_app_key
```

**Client (.env in `/client`):**

```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_CLIENT_URL=http://localhost:3000
```

### 3. Database Setup

```bash
cd server
pnpm run generate
```

### 4. Start Development

```bash
# Start both client and server
pnpm run dev

# Or start individually:
pnpm run dev:client  # Frontend on http://localhost:3000
pnpm run dev:server  # Backend on http://localhost:3000 + Mastra on http://localhost:4000
```

## 🎮 How It Works

### Research Workflow

1. **Query Submission**: User submits a research prompt via the chat interface
2. **Task Decomposition**: The orchestrator analyzes the prompt and breaks it into parallelizable research tasks
3. **Fan-Out Execution**: Multiple research agents execute concurrently using structured concurrency
4. **Data Aggregation**: Results are collected and validated
5. **Report Synthesis**: A summarizer agent creates a comprehensive Markdown report
6. **File Output**: The report is saved to the `output/` directory and made available for download

### Agent Architecture

```typescript
// Example: Research Agent with Web Search
const researchAgent = new Agent({
  name: "Research Agent",
  instructions: "Conduct thorough web research...",
  model: openai("gpt-4o"),
  tools: { webSearchTool },
});

// Workflow orchestration with Effect-TS
const researchWorkflow = new Workflow({
  name: "Deep Research",
  triggerSchema: z.object({
    prompt: z.string(),
    maxAgents: z.number().default(5),
  }),
});
```

### Real-time Updates

The frontend receives live updates through:

- **Token Streaming**: Real-time LLM response tokens
- **Event Streaming**: Agent status, progress, and metadata
- **Error Handling**: Graceful failure recovery with retry logic

## 📁 Project Structure

```
athena-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── routes/         # TanStack Router routes
│   │   ├── config/         # Configuration & tRPC
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
│   └── package.json
├── server/                 # Bun backend
│   ├── src/
│   │   ├── modules/        # Feature modules (chat, auth)
│   │   ├── mastra/         # AI agents & workflows
│   │   ├── config/         # Environment & logging
│   │   ├── middleware/     # Express middleware
│   │   └── observability/  # Datadog integration
│   ├── docs/               # Architecture documentation
│   └── package.json
└── package.json            # Workspace root
```

## 🧪 Development

### Running Tests

```bash
# Run all tests
pnpm run test

# Individual test suites
pnpm run test:client
pnpm run test:server
```

### Code Quality

```bash
# Lint all code
pnpm run lint

# Format code
pnpm run format  # (client only - uses Biome)
```

### Building for Production

```bash
# Build everything
pnpm run build

# Individual builds
pnpm run build:client
pnpm run build:server
```

## 🔧 Configuration

### Web Search Providers

Choose between Exa or Brave Search:

```bash
# Use Exa (recommended)
WEB_SEARCH_PROVIDER=exa
EXA_API_KEY=your_key

# Or use Brave Search
WEB_SEARCH_PROVIDER=brave
BRAVE_API_KEY=your_key
```

### Agent Configuration

Customize agent behavior in `server/src/mastra/agents/`:

```typescript
// Modify research instructions
export const researchAgent = new Agent({
  name: "Research Agent",
  instructions: `Your custom instructions...`,
  model: openai("gpt-4o"),
  tools: { webSearchTool },
});
```

### Observability

Enable Datadog APM for production monitoring:

```typescript
// Uncomment in server/src/server.ts
import "./observability/tracer";
```

## 📊 API Reference

### Core Endpoints

**Chat API:**

```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Research the latest developments in quantum computing"
}
```

**Download Reports:**

```bash
GET /api/download/:filename
```

**tRPC Endpoints:**

- `chat.sendMessage` - Send research query
- `chat.getHistory` - Retrieve chat history
- `auth.getSession` - Get user session

## 🛡️ Security Features

- **Input Validation**: Zod schemas at every API boundary
- **Path Traversal Protection**: File operations restricted to safe directories
- **Secret Management**: Environment-based API key handling
- **Authentication**: Better Auth with Google OAuth
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: Built-in request throttling

## 📈 Performance & Scalability

### Current Capabilities (v1.0)

- **Concurrency**: Up to 5 parallel research agents
- **Performance Target**: <20s for 5-topic benchmark on M-series laptop
- **Reliability**: ≥95% steady-state success rate
- **Streaming Latency**: ≤1s first-byte response

### Roadmap

- **v1.1**: Cloud deployment on Fly.io with Redis
- **v1.2**: MCP integration for distributed agents
- **v2.0**: Multi-tenant SaaS with billing

## 🐛 Troubleshooting

### Common Issues

**Database Connection:**

```bash
# Ensure PostgreSQL is running
brew services start postgresql

# Check connection
psql $DATABASE_URL
```

**Missing API Keys:**

```bash
# Verify environment variables
cd server && node -e "console.log(process.env.OPENAI_API_KEY ? 'OpenAI key found' : 'Missing OpenAI key')"
```

**Port Conflicts:**

```bash
# Check what's using ports 3000/4000
lsof -i :3000
lsof -i :4000
```

### Debug Mode

Enable verbose logging:

```bash
NODE_ENV=development pnpm run dev:server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Zod for all validation
- Write tests for new features
- Update documentation
- Ensure 100% type safety

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Mastra** - AI agent orchestration framework
- **Effect-TS** - Structured concurrency and error handling
- **TanStack** - Modern React tooling
- **Shadcn/ui** - Beautiful UI components

---

**Built with ❤️ by the Athena AI Team**

For more detailed documentation, see the `/server/docs` directory.
