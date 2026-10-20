# MarketHub — Production Deployment Runbook

> **Status:** the application is **not deployed anywhere yet**. This document is
> the prepared plan; nothing in it has been executed against a real
> infrastructure, and no environment values are invented here.
>
> **Disclose before going live:** payment-gateway integration is *incomplete*.
> Checkout creates orders with status `CONFIRMED` and decrements stock, but **no
> payment is collected**. The webhook verifier rejects every event, so payment
> state can never change. Do not present this as a payment-capable checkout.

---

## 1. Topology

```
                    TLS (HTTPS)                     internal HTTP
 Browser ──────────────────────► reverse proxy ──┬──► Next.js frontend  :3000
                        ▲                        │      (next start)
                        │                        └──► Spring Boot API   :8080
                        │                                /api/v1
                        └── CORS: exact frontend origin only
                                                        │
                                                        └──► PostgreSQL :5432
```

| Component    | Runs on                       | Notes |
| ------------ | ----------------------------- | ----- |
| Frontend     | Node.js 20+ (`next start`)    | Static assets + server rendering; API base URL is fixed **at build time** |
| Backend      | JDK 17+ (`java -jar`)         | Spring Boot fat jar, context path `/api/v1` |
| Database     | PostgreSQL 16+ (18 verified)  | Separate service/account; TLS to the DB recommended |
| Proxy        | nginx / Caddy / cloud LB      | TLS termination, rate limiting, gzip |

Never expose the Spring Boot port or the PostgreSQL port directly to the
internet; only the proxy's 443 is public.

---

## 2. Build

```bash
# backend (run the suite first: needs DB_PASSWORD + JWT_SECRET in the environment)
./mvnw -B clean verify

# frontend (lint, types and production build)
cd frontend
npm ci
npm run lint
npx tsc --noEmit
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.example/api/v1 npm run build
```

Artifacts:

- `target/markethub-backend-0.0.1-SNAPSHOT.jar`
- `frontend/.next/` (serve with `npm run start`, or export/host on a Node platform)

---

## 3. Environment variables

Copy `.env.example` into the process environment (systemd `EnvironmentFile=`,
container `--env-file`, or your platform's secret store). **The file must never
contain real values in Git.**

| Variable | Production value | Notes |
| -------- | ---------------- | ----- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Enables schema `validate`, disables the H2 console |
| `DB_URL` | `jdbc:postgresql://<db-host>:5432/markethub` | Include the database name |
| `DB_USERNAME` / `DB_PASSWORD` | *from a secret store* | App refuses to start if unset |
| `JWT_SECRET` | `openssl rand -base64 48` (≥ 32 bytes) | App refuses to start if unset/too short |
| `CORS_ALLOWED_ORIGINS` | `https://www.your-domain.example` | Exact origin(s), comma separated, **https only** |
| `FORWARD_HEADERS_STRATEGY` | `framework` | Only when a trusted proxy sets `X-Forwarded-*` |
| `JPA_DDL_AUTO` | leave unset (`validate` under `prod`) | Never `update`/`create` in production |
| `DB_POOL_SIZE` | sized to `max_connections / instances` | HikariCP, default 10 |
| `SERVER_PORT` | `8080` (or bind to loopback and proxy) | Context path is always `/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.your-domain.example/api/v1` | **Bake into the frontend build** |

Startup validation (all under the `prod` profile) fails fast when:

- `DB_PASSWORD` or `JWT_SECRET` is missing, empty, or still the
  `.env.example` `change-me…` placeholder;
- `JWT_SECRET` is shorter than 32 bytes;
- `CORS_ALLOWED_ORIGINS` is empty, contains a wildcard, or lists an
  `http://` / `localhost` origin.

---

## 4. Database provisioning and migrations

1. Create a dedicated database and role; grant that role only what it needs
   (`CREATE` on its schema, `SELECT/INSERT/UPDATE/DELETE` on its tables).
2. **Back up before the first migration** (`pg_dump`) and keep automated
   backups on.
3. Migrations are Flyway files under `src/main/resources/db/migration`.
   They run **at application startup**, in order, recorded in
   `flyway_schema_history`:
   - empty database → `V1__baseline_schema.sql` is applied;
   - database created before Flyway existed → adopted with
     `baseline-on-migrate` (version 1) and left untouched;
4. Schema changes ship as `V2__*.sql` **with** the entity change in the same
   commit. Applied migrations are immutable.
5. With `prod` active, Hibernate validates the schema (`ddl-auto: validate`):
   code/schema drift stops the deployment instead of silently altering tables.
6. `flyway:clean` is disabled in configuration; do not re-enable it.

> Known warning: the Flyway version bundled with Spring Boot reports that
> PostgreSQL 18 is newer than its tested range (works, but untested). Verify
> migrations against your exact PostgreSQL version in staging.

---

## 5. Starting the services

Backend (systemd unit sketch):

```ini
[Service]
EnvironmentFile=/etc/markethub/backend.env
ExecStart=/usr/bin/java -jar /opt/markethub/markethub-backend.jar
Restart=on-failure
User=markethub
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/var/log/markethub
```

Frontend:

```bash
cd /opt/markethub/frontend
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api/v1 npm run build
npm run start - -- -p 3000     # or run under pm2 / a systemd unit
```

Reverse proxy (nginx sketch):

```nginx
server {
  listen 443 ssl http2;
  server_name www.example.com;
  # ssl_certificate ...; ssl_certificate_key ...;

  location / { proxy_pass http://127.0.0.1:3000; proxy_set_header Host $host; }
  location /api/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
    # the API only trusts forwarded headers when FORWARD_HEADERS_STRATEGY=framework
  }
  # the API has no built-in rate limiter: throttle the auth endpoints here
  location /api/v1/auth/ { limit_req zone=auth burst=10 nodelay; proxy_pass http://127.0.0.1:8080; }
}
server {
  listen 80; server_name www.example.com; return 301 https://$host$request_uri;
}
```

TLS: the frontend already sends `Strict-Transport-Security` (ignored over
plain http, effective once served over https). The JWT lives in browser
`localStorage`, so **HTTPS is the only transport protection** — do not serve
the site over http.

---

## 6. Health checks

| Probe | Request | Expected |
| ----- | ------- | -------- |
| API health  | `GET https://api.example.com/api/v1/actuator/health` | `200` `{"status":"UP"}` (no auth) |
| API liveness | `GET …/api/v1/actuator/health/liveness` | `200` |
| API readiness | `GET …/api/v1/actuator/health/readiness` | `200` only when the DB is reachable |
| Frontend | `GET https://www.example.com/` | `200` |

Only `health` and `info` are exposed; `env`, `configprops`, `beans`… are not
reachable (covered by an integration test). Details are withheld
(`show-details: never`) so probes never disclose configuration.

---

## 7. Logs and monitoring

- Logs go to **stdout/stderr** — ship them with journald, Docker log drivers or
  your platform; do not write log files by hand.
- `SHOW_SQL` must stay `false` in production (SQL logging can include row
  data). `spring.jpa.show-sql` is forced off by the `prod` profile.
- Stack traces stay server-side; clients only ever receive stable
  `ApiResponse` messages.
- Alert on: `Started MarketHubApplication` missing after deploy, repeated
  `Unhandled exception`, health probe failures, HTTP 5xx rate, and DB
  connection pool exhaustion (`markethub-db`).

---

## 8. Post-deploy smoke test

```bash
API=https://api.example.com/api/v1
curl -fsS "$API/actuator/health"                        # {"status":"UP"}
curl -fsS "$API/products?size=1"                        # public catalog
curl -fsS -X POST "$API/auth/register" -H 'Content-Type: application/json' \
  -d '{"email":"smoke@example.com","password":"Smoke-test-1!","firstName":"S","lastName":"T","role":"ROLE_CUSTOMER"}'
# expect 201, then login (200), add to cart (200), checkout (201),
# and a CORS preflight from the real origin:
curl -fsSI -X OPTIONS "$API/products" -H "Origin: https://www.example.com" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control-allow-origin
```

Checklist before announcing:

- [ ] backend suite green (unit + `@WebMvcTest` + PostgreSQL integration)
- [ ] frontend `lint`, `tsc --noEmit`, `build` green; Playwright suite green
- [ ] `prod` profile active, `ddl-auto: validate`, migrations applied and
      backed up
- [ ] CORS allowlist contains only the deployed frontend origin(s)
- [ ] secrets live in the platform's secret store, never in Git
- [ ] **database password rotation completed** (see TASK_LOG.md — a real
      credential was exposed in this repository's history)
- [ ] proxy rate-limits `/api/v1/auth/*`; 4xx/5xx and health monitored
- [ ] payment limitation disclosed in the UI copy and release notes

---

## 9. Rollback

Migrations are forward-only; a rollback restores the pre-deploy database
backup and redeploys the previous jar/`.next` build. Keep the previous
artifact for at least one release. A failed startup under `prod`
(`validate` mismatch, missing secret, bad CORS) is itself a safe failure:
nothing is written and the old process keeps running.
