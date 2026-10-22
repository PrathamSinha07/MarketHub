# MarketHub

Multi-vendor marketplace: a **Next.js** storefront/seller dashboard talking to a
**Spring Boot** REST API backed by **PostgreSQL**.

| Piece    | Tech                                             |
| -------- | ------------------------------------------------ |
| Frontend | Next.js 16 (App Router), React 19, Tailwind, TypeScript — `frontend/` |
| Backend  | Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, Flyway — `src/` |
| Database | PostgreSQL (16+; 18 verified), Flyway migrations  |
| Tests    | JUnit 5 + full-stack PostgreSQL suite (195), Playwright (72) |

> **Payment processing is intentionally incomplete.** Checkout creates orders
> with status `CONFIRMED` and decrements stock; no money moves. The payment
> module exists architecturally (`NoOpPaymentGateway`, verified webhooks that
> reject every event) but no gateway is integrated.

## Repository layout

```
src/main/java/com/markethub/     Spring Boot application (modular monolith)
src/main/resources/              application*.yml + db/migration (Flyway)
src/test/java/com/markethub/     unit, @WebMvcTest and PostgreSQL integration tests
frontend/                        Next.js app + Playwright specs (frontend/tests)
.env.example                     backend environment template (placeholders only)
DEPLOYMENT.md                    production deployment runbook
TASK_LOG.md                      engineering work log (decisions, evidence, risks)
```

## Prerequisites

- JDK 17+ (verified with JDK 26 runtime, `--release 17`)
- Maven wrapper `mvnw.cmd` / `./mvnw` (no global Maven needed)
- Node.js 20+ and npm 11+
- PostgreSQL 16+ (18 verified) for the default profile, or nothing at all for
  the `local` H2 profile

## Configuration

All configuration comes from environment variables — no credential lives in
the repository. Copy the template and fill it in:

```bash
cp .env.example .env     # git-ignored; never commit real values
```

| Variable                | Required | Default                       | Purpose |
| ----------------------- | -------- | ----------------------------- | ------- |
| `DB_URL`                | prod     | `jdbc:postgresql://localhost:5432/markethub_db` | JDBC URL (must include the database name) |
| `DB_USERNAME`           | prod     | `postgres`                    | Database user |
| `DB_PASSWORD`           | **yes**  | *(none — startup fails)*      | Database password |
| `JWT_SECRET`            | **yes**  | *(none — startup fails)*      | HS256 signing key, ≥ 32 bytes (`openssl rand -base64 48`) |
| `JWT_EXPIRATION_MS`     | no       | `86400000` (24 h)             | Access-token lifetime |
| `CORS_ALLOWED_ORIGINS`  | prod     | `http://localhost:3000`       | Exact frontend origin(s), comma separated |
| `SPRING_PROFILES_ACTIVE`| no       | *(none)*                      | `prod` (hardened) or `local` (H2) |
| `JPA_DDL_AUTO`          | no       | `validate` (`update` in `local`) | Schema handling — Flyway owns the schema; Hibernate only validates |
| `FORWARD_HEADERS_STRATEGY` | no    | `none`                        | `framework` behind a TLS-terminating proxy |
| `DB_POOL_SIZE` / `DB_POOL_MIN_IDLE` | no | `10` / `2`             | HikariCP pool sizing |
| `SERVER_PORT`           | no       | `8080`                        | HTTP port (context path is always `/api/v1`) |

Startup fails fast on purpose: a missing/short `JWT_SECRET`, an unset
`DB_PASSWORD`, a copied `.env.example` placeholder, or a localhost/wildcard
CORS origin under the `prod` profile stops the application before it accepts
traffic.

## Running locally

### Backend (PostgreSQL — the default profile)

```powershell
$env:DB_PASSWORD = "<your database password>"
$env:JWT_SECRET  = "<openssl rand -base64 48>"
./mvnw.cmd spring-boot:run
```

Alternatively use the launcher script, which reads `DB_*`/`JWT_SECRET` from
environment variables or a git-ignored `.env` file (never from Git history):

```powershell
./scripts/Start-Backend.ps1
```

API base: `http://localhost:8080/api/v1`, health: `http://localhost:8080/api/v1/actuator/health`.

### Backend (no database — the `local` H2 profile)

```powershell
$env:JWT_SECRET = "<32+ random bytes>"
./mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Data is stored in `./data/` (git-ignored) and survives restarts. Never activate
this profile in production.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # or export NEXT_PUBLIC_API_BASE_URL
npm run dev
```

Open http://localhost:3000.

## Database migrations

The schema is owned by **Flyway** (`src/main/resources/db/migration`):

- `V1__baseline_schema.sql` — full baseline, generated from the JPA entities.
- `V2__integrity_and_indexes.sql` — `lower(email)` unique index, product
  lookup indexes, redundant webhook index removed.
- Databases created before Flyway was introduced are adopted automatically
  (`baseline-on-migrate: true`, baseline version 1) and are not rewritten.
- To change the schema: add `V3__<description>.sql`, update the entities in the
  same commit, and run the suite. **Never edit an applied migration.**
- PostgreSQL profiles run with `ddl-auto: validate` by default (the `local` H2
  profile keeps `update`), so a code/schema mismatch fails startup instead of
  silently altering tables.
- `spring.flyway.clean-disabled: true` keeps `flyway:clean` away from shared
  databases.

## Tests

```powershell
# Backend: 195 tests (unit + @WebMvcTest + PostgreSQL full-stack integration).
# Needs DB_PASSWORD and JWT_SECRET in the environment, same as running the app.
./mvnw.cmd -B test

# Frontend: lint, types, production build
cd frontend
npm run lint
npx tsc --noEmit
npm run build

# Browser QA: requires backend on :8080 and `npm run start` on :3000
npx playwright test
```

Playwright uses the locally installed Edge (`channel: "msedge"`), so no browser
download is required.

## Production deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full runbook: process layout, TLS,
environment variables, migrations, health checks, log handling, smoke tests and
the known limitations you must disclose before going live.

## Security notes

- Passwords are BCrypt-hashed; registration accepts only `ROLE_CUSTOMER` and
  `ROLE_SELLER` (self-service admin creation is rejected).
- Every non-public endpoint is denied by default; ownership is enforced
  server-side (cart, orders, products, payments).
- Error responses return stable, non-technical messages; stack traces go to the
  server log only.
- CORS is an explicit allowlist of exact origins (no wildcards), HTTPS-only in
  production.
- JWTs are stored in browser `localStorage` by the frontend (documented XSS
  exposure); prefer an httpOnly cookie session if you extend the auth stack.
- **Never commit credentials.** If a secret is ever committed, rotate it —
  deleting the file does not remove it from Git history.
