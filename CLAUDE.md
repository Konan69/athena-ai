# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

Athena AI is a monorepo with three main packages:
- **client/**: React 19 frontend with Vite, TanStack Router, and shadcn/ui
- **server/**: Bun backend with Hono, Mastra AI orchestration, and PostgreSQL
- **mastra/**: AI agents and workflows (separate package)

The architecture follows a clean separation with:
- Frontend uses tRPC for type-safe API calls to the backend
- Backend uses Hono as the web framework with tRPC integration
- Mastra handles AI agent orchestration and workflows
- PostgreSQL with Drizzle ORM for database operations
- Effect-TS for structured concurrency and error handling

## Development Commands

### Common Commands
```bash
# Install all dependencies
pnpm install

# Start both client and server in parallel
pnpm dev

# Build entire project
pnpm build

# Type checking across all packages
pnpm check-types

# Linting (uses Biome)
pnpm lint
```

### Client Development
```bash
# Start client only (port 3000)
pnpm dev:client

# Build client
cd client && pnpm build

# Type check client
cd client && pnpm check-types

# Run client tests
cd client && pnpm test

# Format client code (Biome)
cd client && pnpm format
```

### Server Development
```bash
# Start server only (port 3000 + Mastra on 4000)
pnpm dev:server

# Build server
cd server && pnpm build

# Type check server
cd server && pnpm test:typecheck

# Run server tests (Bun test runner)
cd server && pnpm test

# Database operations
cd server && pnpm db:studio      # Open Drizzle Studio
cd server && pnpm db:push        # Push schema changes to DB
```

### Database Schema
The database uses Drizzle ORM with PostgreSQL. Main tables:
- `user`, `account`, `session` - Authentication (Better Auth)
- `organization`, `member`, `invitation` - Multi-tenancy
- `mastra_threads` - AI conversation threads
- `library`, `library_item` - File management with processing status
- `embeddings` - Vector storage for RAG functionality

Schema files are in `server/src/db/schemas/` and migrations in `server/src/db/migrations/`.

## Key Technology Stack

### Frontend (client)
- **React 19** with TypeScript
- **TanStack Router** for file-based routing
- **shadcn/ui** components with Radix UI primitives
- **Vercel AI SDK** for streaming chat interface
- **Zustand** for state management
- **tRPC** for type-safe API calls
- **Tailwind CSS** v4 for styling
- **Biome** for linting and formatting

### Backend (server)
- **Bun** as the JavaScript runtime
- **Hono** as the web framework (migrated from Express)
- **Mastra** for AI agent orchestration
- **Effect-TS** for structured concurrency
- **PostgreSQL** with Drizzle ORM
- **Better Auth** for authentication
- **tRPC** for API endpoints
- **Pino** for structured logging

### AI/ML Components
- **OpenAI GPT-4** for language models
- **Exa API** or **Brave Search** for web research
- **Mastra agents** for research workflows
- **Vector embeddings** for RAG functionality

## Code Style and Guidelines

The project uses **Biome** for code formatting and linting, configured with the **Ultracite** ruleset. Key rules:

### TypeScript
- No `any` or `unknown` types
- Use `as const` instead of literal types
- Prefer `T[]` over `Array<T>` consistently
- No TypeScript enums
- No non-null assertions (`!`)

### React/JSX
- Use `<>...</>` instead of `<Fragment>...</Fragment>`
- No index-based keys in lists
- Components must be properly typed
- Follow accessibility rules (no `accessKey`, proper ARIA attributes)

### General
- Use `===` and `!==` for comparisons
- No `var` declarations
- Use `const` and `let` appropriately
- No unused variables or imports
- Proper error handling with try/catch

## Environment Configuration

### Server Environment (.env in server/)
```bash
# Core
PORT=3000
MASTRA_PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://..."

# AI Services
OPENAI_API_KEY=your_key
WEB_SEARCH_PROVIDER=exa  # or "brave"
EXA_API_KEY=your_key

# Auth
BETTER_AUTH_SECRET=your_secret
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
```

### Client Environment (.env in client/)
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_CLIENT_URL=http://localhost:3000
```

## Testing

### Client Tests
```bash
cd client && pnpm test          # Run tests once
cd client && pnpm test:watch     # Watch mode
```
Uses Vitest with React Testing Library.

### Server Tests
```bash
cd server && pnpm test          # Run Bun tests
cd server && pnpm test:watch    # Watch mode
cd server && pnpm test:coverage # Coverage report
```
Uses Bun's built-in test runner.

### Database Tests
```bash
cd server && pnpm test:setup     # Set up test DB
cd server && pnpm test:full      # Run full test suite
```

## Agent Architecture

The AI system uses Mastra for orchestrating research agents:

1. **Research Agent**: Conducts web research using Exa/Brave Search
2. **Summarizer Agent**: Creates comprehensive Markdown reports
3. **Workflow Orchestration**: Uses Effect-TS for parallel execution

Key files:
- `server/src/mastra/agents/` - Agent definitions
- `server/src/mastra/workflows/` - Workflow definitions
- `server/src/modules/chat/` - Chat API and orchestration

## API Structure

### Main Endpoints
- `/api/chat` - Chat and research interface
- `/api/download/:filename` - Download generated reports
- `/trpc/*` - tRPC endpoints for typed API calls

### tRPC Procedures
- `chat.sendMessage` - Send research query
- `chat.getHistory` - Retrieve chat history
- `auth.*` - Authentication procedures

## Build and Deployment

### Production Build
```bash
pnpm build  # Builds all packages
```

### Individual Builds
```bash
pnpm -F @athena-ai/client build
pnpm -F @athena-ai/server build
```

The project uses **Turbo** for build orchestration and caching.

## Important Notes

- The project uses **pnpm** as the package manager with workspaces
- **Bun** is used as the runtime for the server
- **Mastra** runs on port 4000 when in development
- Database migrations are handled by Drizzle Kit
- The codebase enforces strict type safety with TypeScript
- All API boundaries use Zod for validation