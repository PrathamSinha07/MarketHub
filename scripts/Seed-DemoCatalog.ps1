# ---------------------------------------------------------------------------
# Seeds the DEVELOPMENT-ONLY demo catalog into a local MarketHub database.
#
#   .\scripts\Seed-DemoCatalog.ps1 -Yes
#
# Safety rails (deliberate, non-negotiable):
#   * Only runs against 127.0.0.1 / localhost (refuses anything else).
#   * Requires the explicit -Yes switch; it will never run implicitly.
#   * Runs scripts/demo/seed-demo-catalog.sql, which is applied ONLY by this
#     script - never by Flyway - so demo rows can never reach production.
#   * Leftover automated-test products are ARCHIVED, never deleted.
#   * The target database must already have the Flyway schema (start the
#     backend once against it first).
#
# Connection is taken from the standard env vars (DB_URL / DB_USERNAME /
# DB_PASSWORD) with sensible local defaults; psql is located via PSQL_PATH
# or the PostgreSQL 18 install directory.
# ---------------------------------------------------------------------------
param(
    [switch]$Yes,
    [string]$Host_ = $(if ($env:DB_URL -match 'jdbc:postgresql://([^:/]+)') { $Matches[1] } else { "127.0.0.1" }),
    [string]$Port  = $(if ($env:DB_URL -match 'jdbc:postgresql://[^:/]+:(\d+)') { $Matches[1] } else { "5432" }),
    [string]$Database = $(if ($env:DB_URL -match 'jdbc:postgresql://[^:/]+:\d+/(\w+)') { $Matches[1] } else { "markethub_db" })
)

$ErrorActionPreference = "Stop"

if (-not $Yes) {
    throw "Refusing to run without -Yes. This script writes demo inventory into a database; pass -Yes only against a LOCAL dev database."
}
if ($Host_ -notin @("127.0.0.1", "localhost")) {
    throw "Refusing to seed a non-local host ('$Host_'). Demo data must never be written to a shared or production database."
}

# Locate psql: explicit env var wins, then the standard PostgreSQL dirs.
$psql = $env:PSQL_PATH
if (-not $psql) {
    foreach ($candidate in @("C:\Program Files\PostgreSQL\18\bin\psql.exe",
                             "C:\Program Files\PostgreSQL\17\bin\psql.exe")) {
        if (Test-Path $candidate) { $psql = $candidate; break }
    }
}
if (-not $psql -or -not (Test-Path $psql)) {
    throw "psql.exe not found. Set PSQL_PATH to its full path."
}

$sqlFile = Join-Path $PSScriptRoot "demo\seed-demo-catalog.sql"
$user = if ($env:DB_USERNAME) { $env:DB_USERNAME } else { "postgres" }

# Extra guard: only ever touch a market* database.
if ($Database -notlike "markethub*") {
    throw "Refusing to seed database '$Database' - only markethub* development databases are valid targets."
}

Write-Host "Seeding demo catalog into ${Host_}:${Port}/${Database} (user: $user)" -ForegroundColor Yellow
# -w: never prompt for a password. Wrong port or credentials must fail fast
# instead of hanging on an interactive prompt.
if ($env:DB_PASSWORD) { $env:PGPASSWORD = $env:DB_PASSWORD }
& $psql -w -h $Host_ -p $Port -U $user -d $Database -v ON_ERROR_STOP=1 -f $sqlFile
if ($LASTEXITCODE -ne 0) {
    throw "Seeding failed (psql exit $LASTEXITCODE)."
}
Write-Host "Demo catalog applied. Demo seller logins: demo.*@demo.markethub.local / password 'markethub-demo' (development only)." -ForegroundColor Green
