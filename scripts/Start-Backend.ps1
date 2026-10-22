# ---------------------------------------------------------------------------
# Starts the MarketHub backend against a local PostgreSQL.
#
# Credential handling (deliberate, non-negotiable):
#   * DB_PASSWORD / JWT_SECRET come from the process environment or from a
#     git-ignored `.env` file at the repo root (copy .env.example -> .env).
#   * This script NEVER reads credentials from git history, committed files,
#     or logs. If a credential is missing it stops and tells you where to put
#     it - it does not go looking for one.
#
# Usage:
#   .\scripts\Start-Backend.ps1              # uses .env / environment
#   .\scripts\Start-Backend.ps1 -RunTests    # mvnw test instead of run
# ---------------------------------------------------------------------------
param(
    [switch]$RunTests,
    [string]$LogFile = (Join-Path $env:TEMP "markethub-backend.log")
)

$ErrorActionPreference = "Stop"
$repo = Split-Path -Parent $PSScriptRoot

# Load KEY=VALUE lines from the git-ignored .env (existing env vars win).
$envFile = Join-Path $repo ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $key, $value = $line.Split("=", 2)
            $key = $key.Trim()
            if ($key -and -not [Environment]::GetEnvironmentVariable($key)) {
                [Environment]::SetEnvironmentVariable($key, $value.Trim())
            }
        }
    }
}

if (-not [Environment]::GetEnvironmentVariable("DB_PASSWORD")) {
    throw "DB_PASSWORD is not set. Copy .env.example to .env (git-ignored) and fill it in, or export DB_PASSWORD in your shell."
}
if (-not [Environment]::GetEnvironmentVariable("JWT_SECRET")) {
    throw "JWT_SECRET is not set. Copy .env.example to .env (git-ignored) and fill it in, or export JWT_SECRET in your shell."
}

# Stop a previously running instance started by this script.
Get-CimInstance Win32_Process -Filter "Name='java.exe'" |
    Where-Object { $_.CommandLine -like "*MarketHubApplication*" -or $_.CommandLine -like "*spring-boot:run*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

$mvn = Join-Path $repo "mvnw.cmd"
if ($RunTests) {
    & $mvn -B test
    exit $LASTEXITCODE
}

if (Test-Path $LogFile) { Remove-Item $LogFile -Force }
$p = Start-Process -FilePath $mvn `
    -ArgumentList @("-B", "spring-boot:run") `
    -WorkingDirectory $repo `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError ($LogFile -replace "\.log$", "-err.log") `
    -NoNewWindow -PassThru
"Started backend PID=$($p.Id); logs: $LogFile"
