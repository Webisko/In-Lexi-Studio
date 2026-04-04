param(
  [string]$SshUser = 'srv77673',
  [string]$SshHost = 'h50.seohost.pl',
  [int]$SshPort = 57185,
  [string]$KeyPath = "$HOME\.ssh\copilot_inlexi"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

function Assert-Command([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Missing required command: $Name"
  }
}

Assert-Command 'ssh'
Assert-Command 'scp'
Assert-Command 'node'
Assert-Command 'npm'

if (-not (Test-Path $KeyPath)) {
  throw "SSH key not found: $KeyPath"
}

Write-Host 'Running local preflight checks...' -ForegroundColor Cyan
node .\scripts\deploy-preflight.mjs

$remoteCmsRoot = "domains/inlexistudio.com/cms-app"
$remoteMainPublic = "/home/$SshUser/domains/inlexistudio.com/public_html"
$remoteAdminPublic = "/home/$SshUser/domains/admin.inlexistudio.com/public_html"
$remoteHost = "$SshUser@$SshHost"

Write-Host 'Uploading source files...' -ForegroundColor Cyan

scp -i $KeyPath -P $SshPort .\app.js "$remoteHost`:$remoteCmsRoot/app.js"
scp -i $KeyPath -P $SshPort -r .\api .\prisma .\admin .\src .\public "$remoteHost`:$remoteCmsRoot/"
scp -i $KeyPath -P $SshPort .\package.json .\package-lock.json .\astro.config.mjs .\tailwind.config.mjs .\tailwind.admin.config.mjs .\tsconfig.json .\prettier.config.mjs "$remoteHost`:$remoteCmsRoot/"

Write-Host 'Building and publishing on remote host...' -ForegroundColor Cyan

$remoteSteps = @(
  'set -e',
  "cd $remoteCmsRoot",
  "source /home/$SshUser/nodevenv/domains/inlexistudio.com/cms-app/22/bin/activate",
  'npm install --omit=dev',
  'npx prisma generate',
  'npx prisma migrate deploy',
  'rm -rf .astro node_modules/.astro dist',
  'PUBLIC_API_URL=https://inlexistudio.com/app/api PUBLIC_BASE_URL=https://inlexistudio.com/app npm run build',
  'test -f dist/index.html',
  'test -f admin/tailwind.generated.css',
  'test -f api/server.js',
  'test -f prisma/schema.prisma',
  "rsync -a --delete --exclude app dist/ $remoteMainPublic/",
  "find $remoteMainPublic -type d -exec chmod 755 {} + || true",
  "find $remoteMainPublic -type f -exec chmod 644 {} + || true",
  "rsync -a --delete admin/ $remoteAdminPublic/",
  "find $remoteAdminPublic -type d -exec chmod 755 {} + || true",
  "find $remoteAdminPublic -type f -exec chmod 644 {} + || true",
  "chmod 755 $remoteAdminPublic || true",
  "if [ ! -L $remoteMainPublic/app ]; then rm -rf $remoteMainPublic/app; ln -s ../cms-app $remoteMainPublic/app; fi",
  "if [ -d $remoteMainPublic/cursor ]; then chmod 755 $remoteMainPublic/cursor || true; chmod 644 $remoteMainPublic/cursor/*.svg || true; fi",
  'mkdir -p tmp',
  'touch tmp/restart.txt',
  'touch app.js',
  'echo DEPLOY_SAFE_OK'
)

$remoteScript = ($remoteSteps -join '; ')
# Exit code 1 from SSH can be a dotenv false-positive; capture output and check for DEPLOY_SAFE_OK
$sshOut = $null
try {
  $ErrorActionPreference = 'Continue'
  $sshOut = ssh -i $KeyPath -p $SshPort $remoteHost "bash -lc '$remoteScript'" 2>&1
  $sshExitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = 'Stop'
}
Write-Host $sshOut
if ($sshExitCode -gt 1) {
  throw "SSH remote build failed with exit code $sshExitCode"
}
if (-not ($sshOut -match 'DEPLOY_SAFE_OK')) {
  throw "Remote build did not complete (DEPLOY_SAFE_OK not found in output)"
}
Write-Host 'DEPLOY_SAFE_OK confirmed.' -ForegroundColor Green

Write-Host 'Running smoke checks...' -ForegroundColor Cyan
node .\scripts\deploy-smoke.mjs

Write-Host 'Done.' -ForegroundColor Green
