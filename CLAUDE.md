# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application that provides a unified dashboard for monitoring API token consumption across multiple hosts. It aggregates token usage data from external APIs and displays metrics including prompt/completion tokens, costs, and usage time.

## Development Commands

```bash
# Install dependencies (uses pnpm)
pnpm install

# Run development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linter
pnpm lint
```

**Important**: Always run `pnpm lint` after making code changes to ensure code quality and catch potential issues.

## Configuration

The application requires a `config.json` file in the project root (see `config.example.json` for template):

```json
[
  {
    "HOST": "https://your-host.example.com",
    "API_KEY": "your-api-key",
    "NAME": "Display Name"
  }
]
```

- Multiple hosts can be configured in the array
- Each host must have `HOST` and `API_KEY` fields
- `NAME` is optional and used for display purposes
- The app fetches token logs from `{HOST}/api/log/token?key={API_KEY}`

## Architecture

### Data Flow

1. **Server-Side Rendering**: The home page (`app/page.tsx`) is a Server Component that fetches initial data using `getTokenSummary()` and passes it to the client component
2. **API Route**: `/api/token-consume` provides a REST endpoint for client-side data refreshes
3. **Token Summary Logic**: `lib/token-summary.ts` contains all data fetching and aggregation logic:
   - Loads configs from `config.json`
   - Fetches token logs from all configured hosts in parallel using `Promise.allSettled`
   - Aggregates data by host (deduplicates hosts with same URL)
   - Filters by date range (all, 24h, 7d, 30d, or custom)
   - Calculates costs using formula: `(quota / 1_000_000) * 2`
4. **Client Component**: `TokenDashboard` handles UI state, date range selection, and data refreshing

### Key Files

- `app/page.tsx` - Server Component entry point
- `app/api/token-consume/route.ts` - API endpoint for client-side fetches
- `lib/token-summary.ts` - Core business logic (server-only)
- `lib/token-types.ts` - Shared TypeScript types
- `components/TokenDashboard.tsx` - Main client component
- `components/DateRangePicker.tsx` - Date range selector UI

### Date Range Handling

Date ranges are managed via URL query parameters:
- `preset`: "all" | "24h" | "7d" | "30d" | "custom"
- `startDate`: ISO date string (YYYY-MM-DD) for custom range
- `endDate`: ISO date string (YYYY-MM-DD) for custom range

The dashboard updates the URL when date range changes, triggering a client-side fetch to the API route.

### Error Handling

- Config loading errors are caught and returned as error messages
- Individual host fetch failures are captured in `HostSummary.errors[]` array
- The UI displays both global errors and per-host errors
- Uses `Promise.allSettled` to ensure one host failure doesn't block others

## Docker Deployment

The app uses a multi-stage Dockerfile optimized for Next.js standalone output:

```bash
# Build image
docker build -t token-consume .

# Run container (mount config.json)
docker run -p 3000:3000 -v $(pwd)/config.json:/app/config.json token-consume
```

The `next.config.ts` sets `output: 'standalone'` for optimized Docker builds.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.9.3
- **Styling**: Tailwind CSS 4
- **Package Manager**: pnpm 10.28.2
- **Node**: 20 (Alpine in Docker)

## Important Patterns

- Server Components are used for initial data fetching to reduce client bundle size
- `"use server"` directive in `lib/token-summary.ts` ensures it only runs server-side
- Client components use `useTransition` for non-blocking UI updates during data fetches
- All API responses follow a consistent `{ success: boolean, data?: T, message?: string }` pattern
- Date filtering happens in-memory after fetching all logs (not at API level)
