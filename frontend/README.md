# MarketHub Frontend

Next.js, React, TypeScript and Tailwind CSS client for the MarketHub
multi-vendor marketplace (Spring Boot backend).

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The backend must be running on
http://localhost:8080 (see the repository root for Spring Boot setup).

## Configuration

The frontend talks to the Spring Boot API through a single environment
variable. The backend serves its REST API under the `/api/v1` context
path, so the base URL must include it:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

If the variable is not set, the client falls back to
`http://localhost:8080/api/v1`.

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server (Turbopack)     |
| `npm run build`   | Type-check and build for production  |
| `npm run start`   | Serve the production build           |
| `npm run lint`    | Run ESLint                           |

## Project structure

```
src/
  app/                  # Next.js routes (pages and root layout)
  components/           # Reusable UI (layout, products, categories, auth, shared)
  hooks/                # Data-fetching hooks (useProducts, useCategories, ...)
  services/             # API services (auth, products, categories, cart, orders, payments)
  lib/                  # API client, environment config, session and formatting helpers
  types/                # TypeScript contracts matching the backend DTOs
```

## API layer

All backend calls go through `src/lib/api-client.ts`, which unwraps the
Spring Boot `ApiResponse<T>` envelope (`{ success, message, data, errors }`)
and throws `ApiError` with the status, message and field-level validation
errors. Services in `src/services/` expose one function per endpoint and are
the only place endpoint paths are constructed.

Cart, order and payment services are already implemented against the backend
contracts but are not yet wired into the UI; authentication state management
is also intentionally not implemented yet.
