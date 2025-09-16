# Athena AI — B2B Autonomous Intelligence Suite

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-fbff00.svg)](https://bun.sh/)
[![Biome](https://img.shields.io/badge/Biome-2.2+-60a5fa.svg)](https://biomejs.dev/)
[![Turbo](https://img.shields.io/badge/Turbo-2.5+-ef4444.svg)](https://turbo.build/)

Athena AI is a business-to-business intelligence platform that embeds collaborative AI agents inside enterprise workflows. It gives go-to-market, research, and operations teams a command center where machine teammates gather context, draft deliverables, and keep humans in the loop.

## 🚀 Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd athena-ai

# Install dependencies
pnpm install

# Start development environment (client + server + database studio)
pnpm dev
```

## 📋 Table of Contents

- [Product Overview](#-product-overview)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development](#-development)
- [Available Commands](#-available-commands)
- [Project Structure](#-project-structure)
- [Technology Stack](#-technology-stack)
- [Contributing](#-contributing)
- [Documentation](#-documentation)

## 🎯 Product Overview

### Who It Serves

Operators, analysts, and customer-facing teams inside growth-stage B2B companies

### Primary Value

Accelerates insight generation, document production, and customer responses without breaking compliance guardrails

### Key Features

- **🤖 Agent Workstreams**: Spin up dedicated agent workflows for research, account planning, and knowledge retrieval
- **📚 Knowledge Libraries**: Centralize organizational knowledge that agents cite automatically
- **🔄 Human-AI Collaboration**: Route responsibilities with assignment flows, approvals, and notifications
- **📊 Real-time Monitoring**: Track usage, latency, and quality metrics
- **🔒 Enterprise Security**: Multi-tenant architecture with role-based access controls
- **⚡ Live Collaboration**: Stream token-level progress for real-time review and intervention

## 🏗️ Architecture

| Layer                        | Technology                            | Purpose                                                                        |
| ---------------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| **Experience** (`client`)    | React 19 + TanStack Router + Tailwind | Web interface for command console, organization admin, and transcript playback |
| **Services** (`server`)      | Bun + Hono + tRPC + Drizzle           | API with type-safe endpoints, database persistence, and streaming              |
| **Orchestration** (`mastra`) | Mastra + AI SDK                       | Agent workflows coordinating OpenAI, Exa, PostHog, and custom tools            |
| **Shared Foundation**        | Turbo + pnpm + Biome + TypeScript     | Build orchestration, package management, and code quality                      |

## 📋 Prerequisites

- **Node.js**: 20.9.0 or higher
- **pnpm**: 10.0.0 or higher
- **Bun**: 1.0+ (for server runtime)
- **Docker**: For test databases (optional)
- **PostgreSQL**: For production database (can use Neon, Supabase, etc.)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd athena-ai
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Copy environment templates
   cp client/.env.example client/.env.local
   cp server/.env.example server/.env.local
   cp mastra/.env.example mastra/.env.local
   ```

4. **Configure your environment**
   - OpenAI API key (for AI features)
   - Database connection string
   - Authentication secrets
   - Other service API keys as needed

## 🚀 Development

### Start the full development environment

```bash
pnpm dev
```

This launches:

- **Client**: React dev server on http://localhost:3000
- **Server**: Bun dev server with hot reload
- **Database Studio**: Drizzle Studio for database management

### Start individual services

```bash
# Client only
pnpm dev:client

# Server only
pnpm dev:server

# Database studio only
pnpm dev:db-studio

# Mastra orchestration
pnpm dev:mastra
```

### Build for production

```bash
# Build all packages
pnpm build

# Build individual packages
pnpm -F @athena-ai/client build
pnpm -F @athena-ai/server build
pnpm -F @athena-ai/mastra build
```

## 📜 Available Commands

### Root Commands (Workspace)

```bash
# Development
pnpm dev                    # Start all services (client + server + db studio)
pnpm build                  # Build all packages
pnpm check-types           # Type checking across workspace
pnpm clean                 # Clean caches and node_modules

# Individual services
pnpm dev:client            # Client only
pnpm dev:server            # Server only
pnpm dev:db-studio         # Database studio only
pnpm dev:mastra           # Mastra orchestration only
```

### Client Commands

```bash
cd client
pnpm dev                   # Start Vite dev server
pnpm build                 # Production build
pnpm serve                 # Preview production build
pnpm check-types          # TypeScript type checking
pnpm test                  # Run Vitest tests
pnpm format                # Format with Biome
pnpm lint                  # Lint with Biome
pnpm check                 # Full Biome check
```

### Server Commands

```bash
cd server
pnpm dev                   # Start Bun dev server with hot reload
pnpm build                 # TypeScript compilation
pnpm start                 # Production server

# Testing
pnpm test                  # Run tests
pnpm test:watch            # Watch mode tests
pnpm test:coverage         # Coverage report
pnpm test:typecheck        # Type checking

# Database
pnpm db:studio            # Drizzle Studio
pnpm db:push              # Push schema changes

# Test database
pnpm test:db:up           # Start test database
pnpm test:db:down         # Stop test database
pnpm test:db:reset        # Reset test database
pnpm test:db:migrate      # Run migrations
pnpm test:db:generate     # Generate migrations
pnpm test:db:push         # Push schema to test db
pnpm test:setup           # Full test setup (db + schema)
pnpm test:full            # Setup + run tests
```

### Mastra Commands

```bash
cd mastra
pnpm dev                   # Start Mastra development server
pnpm build                 # Build Mastra agents and workflows
pnpm start                 # Production Mastra server
```

## 📁 Project Structure

```
athena-ai/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── routes/         # TanStack Router routes
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   └── package.json
├── server/                 # Bun backend API
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── db/             # Database schemas/migrations
│   │   ├── trpc/           # tRPC routes
│   │   ├── middleware/     # Server middleware
│   │   └── __tests__/      # Integration tests
│   └── package.json
├── mastra/                 # AI orchestration
│   ├── src/mastra/
│   │   ├── agents/         # AI agents
│   │   ├── workflows/      # Agent workflows
│   │   ├── tools/          # Custom tools
│   │   └── prompts/        # Prompt templates
│   └── package.json
├── package.json           # Workspace root
├── turbo.json            # Build orchestration
├── tsconfig.json         # TypeScript config
└── biome.jsonc          # Code formatting/linting
```

## 🛠️ Technology Stack

### Frontend

- **React 19** - Latest React with concurrent features
- **TanStack Router** - Type-safe routing with file-based routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Powerful data fetching and caching
- **Zustand** - Lightweight state management
- **Vite** - Fast build tool and dev server

### Backend

- **Bun** - Fast JavaScript runtime and bundler
- **Hono** - Lightweight web framework
- **tRPC** - Type-safe API layer
- **Drizzle ORM** - Type-safe SQL query builder
- **PostgreSQL** - Primary database
- **Better Auth** - Authentication and authorization
- **Redis** - Caching and session storage

### AI & Orchestration

- **Mastra** - AI agent orchestration framework
- **OpenAI** - LLM provider
- **Exa** - Web search and research
- **PostHog** - Analytics and monitoring
- **AI SDK** - Unified AI interface

### Development & Quality

- **TypeScript** - Type-safe JavaScript
- **Biome** - Fast formatter and linter
- **Turbo** - Build orchestration and caching
- **Vitest** - Fast unit testing
- **Playwright** - E2E testing (future)

## 🤝 Contributing

### Development Workflow

1. **Branch**: Create feature branches from `main`
2. **Commits**: Use conventional commits (`feat:`, `fix:`, `chore:`, etc.)
3. **PRs**: Write descriptive pull requests explaining the problem and solution
4. **Testing**: Ensure tests pass and add new tests for features
5. **Code Quality**: Run `pnpm check` before committing

### Code Quality

- **Biome**: Automatic formatting and linting
- **TypeScript**: Strict type checking enabled
- **Conventional Commits**: For clean release notes
- **Pre-commit hooks**: Automated quality checks

### Testing Strategy

- **Frontend**: Vitest for unit tests with Testing Library
- **Backend**: Bun test runner with integration tests
- **Database**: Docker-based test databases
- **E2E**: Playwright (planned)

## 📚 Documentation

- [**AGENTS.md**](./AGENTS.md) — Contributor handbook and development setup
- [**client/README.md**](./client/README.md) — Frontend architecture and patterns
- [**server/README.md**](./server/README.md) — Backend API and database design
- [**mastra/README.md**](./mastra/README.md) — AI orchestration and agent configuration
- [**server/docs/**](./server/docs/) — Detailed technical documentation

## 📄 License

This project is licensed under the ISC License.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/athena-ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/athena-ai/discussions)
- **Documentation**: See individual package READMEs for detailed guides

---

**Athena AI** — Where human intelligence meets artificial capability 🤖✨
