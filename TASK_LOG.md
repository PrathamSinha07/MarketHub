# MarketHub — Task Log

Working log so progress survives context limits. Updated after each cohesive stage.
Nothing is committed to git without explicit owner approval.

## Environment facts (verified)

- Repo: clean working tree on `main`, last commit `81c2188 feat: integrate buyer cart and checkout`.
- Node 24 / npm 11; Java 26 runtime (project targets 17); Maven via `mvnw.cmd` (no global `mvn`).
- PostgreSQL 17 + 18 services running on 5432/5433, **SCRAM auth** — no credentials are available to this
  agent (and must not be requested), so the backend cannot boot against the local Postgres.
  → Blocker for full-stack verification with the default profile. Mitigated with a `local` H2 profile (see below).
- No browser-automation tooling in the repo; Edge + Chrome are installed (Playwright can use them without
  downloading browsers).

## Baseline results (before changes)

- `mvnw.cmd -q -B test` → **PASS** (all unit + `@WebMvcTest` slice tests).
- `npm run build` (Next 16.4 / Turbopack) → **PASS**, 13 routes.
- `npm run lint` → 0 errors, **2 warnings** (unused `AuthCard` imports in LoginForm/RegisterForm).

## Stage 1 — Backend correctness, security, API gaps (COMPLETE)

All 10 backend defects (B1–B10) fixed and verified:

| # | Severity | Defect | Status |
|---|----------|--------|--------|
| B1 | Critical | `POST /auth/register` accepts `role=ROLE_ADMIN` → privilege escalation | ✅ Fixed |
| B2 | High | Wrong login credentials → HTTP 500 instead of 401 | ✅ Fixed |
| B3 | High | `GlobalExceptionHandler` leaks internal details | ✅ Fixed |
| B4 | High | `GET /cart` 404s for new customers | ✅ Fixed |
| B5 | Medium | CORS origins hard-coded | ✅ Fixed |
| B6 | Medium | `JWT_SECRET` has no startup validation | ✅ Fixed |
| B7 | Medium | DRAFT/ARCHIVED products visible to public | ✅ Fixed |
| B8 | Medium | No server-side search or sort | ✅ Fixed |
| B9 | Low | `show-sql: true` always on; env vars not profile-driven | ✅ Fixed |
| B10 | Low | `startup-error-new.txt` committed | ✅ Fixed |

**Additional fix:** `SecurityConfig` had wrong import for `AuthenticationEntryPoint` (wrong package) and wrong lambda parameter type — caused 66 test failures. Fixed import path and lambda signature.

**Test updates:** 8 tests updated to expect 401 (Unauthorized) instead of 403 (Forbidden) for unauthenticated requests — correct HTTP semantics.

## Stage 2 — Frontend completeness and correctness (COMPLETE)

All 6 frontend defects (F1–F6) fixed and verified:

| # | Severity | Defect | Status |
|---|----------|--------|--------|
| F1 | High | Seller overview shows "Not available" cards | ✅ Fixed — uses `GET /products/seller` |
| F2 | Medium | No customer order-history route | ✅ Fixed — `/orders` page created |
| F3 | Medium | Seller nav has dead "Orders — Soon" placeholder | ✅ Fixed — `/seller/orders` page created |
| F4 | Medium | No `/checkout` step | ✅ Fixed — `/checkout` page created |
| F5 | Medium | Client-side-only search/sort; no error pages | ✅ Fixed — server-side search/sort + `not-found.tsx` + `error.tsx` |
| F6 | Low | 2 lint warnings; stale comments | ✅ Fixed — 0 warnings, comments updated |

## Stage verification log

### Backend
- `mvnw.cmd -q -B clean test` → **PASS** (153 tests, 0 failures, 0 errors)
- `mvnw.cmd -q -B test` → **PASS** (exit code 0)

### Frontend
- `npm run lint` → **PASS** (0 errors, 0 warnings)
- `npm run build` → **PASS** (16 routes, compiled successfully)

## New files created

### Backend
- `src/main/resources/application-local.yml` — H2 profile for local dev without PostgreSQL

### Frontend
- `src/app/checkout/page.tsx` — Checkout page
- `src/components/checkout/CheckoutView.tsx` — Checkout logic
- `src/app/orders/page.tsx` — Customer order history page
- `src/components/orders/CustomerOrdersView.tsx` — Customer orders list
- `src/app/seller/orders/page.tsx` — Seller orders page
- `src/components/seller/SellerOrdersView.tsx` — Seller orders list with status filter
- `src/app/not-found.tsx` — 404 page
- `src/app/error.tsx` — Error boundary page

## Remaining known limitations

- **PostgreSQL not available** — backend cannot boot against local Postgres (SCRAM auth, no credentials). Full-stack integration testing blocked. Mitigated with H2 `local` profile.
- **No browser automation** — no Playwright/Cypress tests. Manual verification recommended.
- **Payment processing** — checkout creates orders with PENDING status. Payment gateway integration is architecturally prepared but not implemented (by design — no fake payment claims).
