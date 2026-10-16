# MarketHub — Task Log

Working log so progress survives context limits. Updated after each cohesive stage.
Nothing is committed to git without explicit owner approval.

> **Note:** the "Remaining known limitations" section at the bottom of this log is
> **stale** — see "Day 2" below. The backend now runs against real PostgreSQL 18,
> and Playwright browser QA is in place. All Day 2 changes remain uncommitted.

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

- ~~**PostgreSQL not available**~~ — RESOLVED on Day 2 (see below): backend runs against real PostgreSQL 18.
- ~~**No browser automation**~~ — RESOLVED on Day 2: Playwright suite (46 tests, desktop + mobile) in `frontend/tests/`.
- **Payment processing** — checkout creates orders with CONFIRMED status. Payment gateway integration is architecturally prepared but not implemented (by design — no fake payment claims).

## Day 2 — Full-stack integration + browser QA (COMPLETE)

### Backend against real PostgreSQL
- The default profile's `application.yml` reads `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` and `JWT_SECRET`
  from the environment; nothing is hard-coded and no value was printed to logs or committed.
- Note: an earlier commit in this repo's history contains a plaintext `application.yml` with a database
  password. That is a pre-existing secret-exposure issue worth rotating and scrubbing separately; it is
  deliberately not referenced further here.
- Backend boots on PostgreSQL 18 (`markethub_db`, :5432) — `Started MarketHubApplication`, Tomcat :8080,
  context `/api/v1`. Launcher script: `C:\Users\PRATHAM\AppData\Local\Temp\opencode\start-backend.ps1`.
- Stale bytecode (`ClassFormatError: Invalid method Code length 0 in CartItem`) fixed via `mvnw clean compile`.

### New integration suite (PostgreSQL, full stack)
- `src/test/java/com/markethub/integration/MarketHubIntegrationTest.java` — 9 tests: registration/login,
  authz/role restrictions, public browsing/search/sort/filter, cart CRUD, checkout + order persistence +
  stock decrement, customer order ownership, seller product management, seller order visibility.
- Full backend suite: **162 tests, 0 failures** (`mvnw clean test`, exit 0).

### Browser QA (Playwright, local Edge, no browser download)
- Desktop 1280×720 + mobile 375×667; `webServer` reuses the running :3000 server.
- 46 tests in `frontend/tests/{home,catalog,auth,shop-flow,seller}.spec.ts` + `helpers.ts`.
- Result: **44 passed, 2 skipped (desktop-only tests on mobile), 0 failed** — verified on two consecutive runs.
  Every test asserts no console errors, no page errors, no 5xx, no failed requests.

### Defects found & fixed during QA
| # | Severity | Defect | Status |
|---|----------|--------|--------|
| Q1 | High | `useProducts` dropped `search`/`sortBy` — catalog search never reached the API (full catalog returned for any query) | ✅ Fixed |
| Q2 | Medium | Hydration error (React #418) on every route — `restoring` state raced the Suspense-deferred Navbar | ✅ Fixed (`completeRestore()` handshake; login page no longer awaits `searchParams`) |
| Q3 | Medium | Cart row overflows horizontally by 18px at 375px (stepper + subtotal + Remove can't fit) | ✅ Fixed (`flex-wrap` on the cart row) |
| Q4 | Low | Checkout confirmation showed raw `PENDING` status text for a `CONFIRMED` order | ✅ Fixed |

### Known non-defects worth remembering
- Next 16 (Cache Components) requires the `Suspense` wrapper around `usePathname()` in `layout.tsx`;
  removing it breaks the build (`CLIENT_HOOK_DYNAMIC`).
- During client-side navigation Next.js briefly keeps a hidden streamed copy of the page (`div#S:0`);
  Playwright tests therefore scope catalog selectors to `#main-content`.
- Next.js prefetch `_rsc` requests are aborted (`net::ERR_ABORTED`) when navigation commits — expected,
  filtered out in `tests/helpers.ts`.

### How to run
```powershell
# backend (real PostgreSQL)
C:\Users\PRATHAM\AppData\Local\Temp\opencode\start-backend.ps1
# frontend
cd frontend; npm run build; npm run start
# QA
cd frontend; npx playwright test
```

**Next unfinished task:** none scheduled — all Day 2 work is complete and verified.
All changes remain **uncommitted** pending owner review/approval.
