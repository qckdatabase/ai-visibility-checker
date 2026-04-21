# QCK — AI Visibility Checker

Keyword intelligence platform for tracking brand visibility across AI search models.

## Stack

- **Frontend**: Vite + React 18 + TypeScript, Tailwind + shadcn/ui, Recharts, TanStack Query, React Router v6
- **Backend**: Express + TypeScript, OpenAI GPT-4o pipeline, Postgres (pg), JWT auth
- **Dev**: Bun, Vite HMR, Vitest

## Setup

```bash
bun install
bun run dev        # Frontend on :8080
cd server && bun install && bun run dev   # Backend on :3000
```

## Environment Variables

### Backend (`server/.env`)

| Variable | Description |
|---|---|
| `STORE_DRIVER` | `memory` or `postgres` |
| `DATABASE_URL` | Postgres connection string |
| `ADMIN_PASSWORD_HASH` | Bcrypt hash of admin password |
| `JWT_SECRET` | Secret for JWT signing |
| `OPENAI_API_KEY` | OpenAI API key for pipeline |
