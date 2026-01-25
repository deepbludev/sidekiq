# Sidekiq

A premium AI chat application for model-agnostic conversations with custom assistants.

## Overview

Sidekiq is a full-stack AI chat platform that allows users to interact with multiple LLM providers through a unified interface. Similar to [t3.chat](https://t3.chat), users can choose their preferred AI model while leveraging custom assistants called "Sidekiqs" for specialized tasks.

### Key Features

- **Multi-Model Support** - Switch between OpenAI, Anthropic, Google, and other LLM providers
- **Custom Assistants (Sidekiqs)** - Create specialized AI personas with custom instructions, conversation starters, and default models
- **Team Collaboration** - Share chats and Sidekiqs with your team (coming soon)
- **Modern UX** - Fast, responsive interface with dark mode, streaming responses, and keyboard shortcuts

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL, Drizzle ORM |
| API | tRPC |
| Authentication | Better Auth (GitHub OAuth) |
| AI Integration | Vercel AI SDK, AI Gateway |
| Testing | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for PostgreSQL)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/sidekiq.git
   cd sidekiq
   ```

2. **Configure environment variables**

   ```bash
   cp sidekiq-webapp/.env.example sidekiq-webapp/.env
   ```

   Edit `sidekiq-webapp/.env` and configure:
   - `DATABASE_URL` - PostgreSQL connection string
   - `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `BETTER_AUTH_URL` - `http://localhost:3000` for development
   - `BETTER_AUTH_GITHUB_CLIENT_ID` and `BETTER_AUTH_GITHUB_CLIENT_SECRET` - [Create OAuth app](https://github.com/settings/developers)
   - `AI_GATEWAY_API_KEY` - Vercel AI Gateway API key

   See `.env.example` for all available options.

3. **Start PostgreSQL**

   ```bash
   docker compose up -d
   ```

4. **Install dependencies**

   ```bash
   cd sidekiq-webapp
   pnpm install
   ```

5. **Apply database schema**

   ```bash
   pnpm db:push
   ```

6. **Seed development data (optional)**

   ```bash
   pnpm db:seed
   ```

7. **Start the development server**

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development Workflow

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with Turbo |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm check` | Run linting and type checking |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm format:write` | Format code with Prettier |
| `pnpm test` | Run unit tests in watch mode |
| `pnpm test:run` | Run unit tests once |
| `pnpm test:e2e` | Run E2E tests with Playwright |

### Database Commands

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Push schema changes to database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:studio` | Open Drizzle Studio for database inspection |
| `pnpm db:seed` | Seed database with development data (additive) |
| `pnpm db:reset` | Flush app data and reseed (preserves auth tables) |

## Project Structure

```
sidekiq-webapp/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (auth)/          # Authentication pages
│   │   ├── (dashboard)/     # Main application routes
│   │   └── api/             # API routes (chat, auth)
│   ├── components/          # React components
│   │   ├── chat/            # Chat interface components
│   │   ├── model-picker/    # Model selection components
│   │   ├── sidebar/         # Sidebar and navigation
│   │   ├── sidekiq/         # Sidekiq management components
│   │   └── ui/              # shadcn/ui base components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utilities and helpers
│   └── server/              # Server-side code
│       ├── api/             # tRPC routers
│       ├── auth/            # Better Auth configuration
│       └── db/              # Drizzle schema and seeds
├── tests/
│   ├── unit/                # Vitest unit tests
│   └── e2e/                 # Playwright E2E tests
└── public/                  # Static assets
```

## Testing

### Unit Tests

Unit tests are written with Vitest and Testing Library.

```bash
# Run in watch mode
pnpm test

# Run once
pnpm test:run
```

### E2E Tests

E2E tests are written with Playwright.

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Generate HTML report
pnpm test:e2e:html
```

**E2E Test Setup:**

1. Configure test credentials in `.env`:
   ```
   E2E_TEST_EMAIL="your-test-user@example.com"
   E2E_TEST_PASSWORD="your-test-password"
   ```

2. Create a test user in your development database with these credentials

3. E2E tests automatically reset and seed the database before each run via Playwright's global setup

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run checks: `pnpm check`
5. Commit using conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. Push to your fork and open a Pull Request

## License

See [LICENSE](./LICENSE) for details.
