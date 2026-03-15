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

if (-not (Test-Path $KeyPath)) {
  throw "SSH key not found: $KeyPath"
}

$remoteCmsRoot = "domains/inlexistudio.com/cms-app"
$remoteMainPublic = "/home/$SshUser/domains/inlexistudio.com/public_html"
$remoteAdminPublic = "/home/$SshUser/domains/admin.inlexistudio.com/public_html"
$remoteHost = "$SshUser@$SshHost"

Write-Host 'Uploading source files...' -ForegroundColor Cyan

scp -i $KeyPath -P $SshPort .\app.js "$remoteHost`:$remoteCmsRoot/app.js"
scp -i $KeyPath -P $SshPort -r .\api .\prisma .\admin .\src .\public "$remoteHost`:$remoteCmsRoot/"
scp -i $KeyPath -P $SshPort .\package.json .\package-lock.json .\astro.config.mjs .\tailwind.config.mjs .\tsconfig.json .\prettier.config.mjs "$remoteHost`:$remoteCmsRoot/"

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
  "rsync -a --delete --exclude app dist/ $remoteMainPublic/",
  "find $remoteMainPublic -type d -exec chmod 755 {} + || true",
  "find $remoteMainPublic -type f -exec chmod 644 {} + || true",
  "rsync -a --delete admin/ $remoteAdminPublic/",
  "find $remoteAdminPublic -type d -exec chmod 755 {} + || true",
  "find $remoteAdminPublic -type f -exec chmod 644 {} + || true",
  "chmod 755 $remoteAdminPublic || true",
  "if [ ! -L $remoteMainPublic/app ]; then rm -rf $remoteMainPublic/app; ln -s ../cms-app $remoteMainPublic/app; fi",
  "if [ -d $remoteMainPublic/cursor ]; then chmod 755 $remoteMainPublic/cursor || true; chmod 644 $remoteMainPublic/cursor/*.svg || true; fi",
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

$urls = @(
  'https://inlexistudio.com/',
  'https://inlexistudio.com/wedding-photography/',
  'https://inlexistudio.com/portrait-photography/',
  'https://inlexistudio.com/product-photography/',
  'https://inlexistudio.com/about/',
  'https://inlexistudio.com/approach/',
  'https://inlexistudio.com/portfolio/',
  'https://inlexistudio.com/contact/',
  'https://inlexistudio.com/pricing/',
  'https://admin.inlexistudio.com/',
  'https://inlexistudio.com/cursor/normal.svg',
  'https://inlexistudio.com/cursor/hover.svg',
  'https://inlexistudio.com/uploads/ils-40.webp',
  'https://inlexistudio.com/app/api/pages',
  'https://inlexistudio.com/app/api/settings'
)

foreach ($url in $urls) {
  try {
    $response = Invoke-WebRequest -Uri $url -UseBasicParsing -Method Head -TimeoutSec 25
    Write-Host ("{0} {1}" -f $response.StatusCode, $url)
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if (-not $code) { $code = 'ERR' }
    Write-Host ("{0} {1}" -f $code, $url)
  }
}

$body = 'formType=contact&name=Deploy+Safe&email=info%40inlexistudio.com&message=smoke+check'
try {
  $postRes = Invoke-WebRequest -Uri 'https://inlexistudio.com/app/api/contact' -Method Post -ContentType 'application/x-www-form-urlencoded' -Body $body -UseBasicParsing -TimeoutSec 30
  Write-Host ("POST /app/api/contact => {0}" -f $postRes.StatusCode)
  Write-Host $postRes.Content
} catch {
  $resp = $_.Exception.Response
  if ($resp) {
    Write-Host ("POST /app/api/contact => {0}" -f $resp.StatusCode.value__)
    $reader = New-Object IO.StreamReader($resp.GetResponseStream())
    Write-Host $reader.ReadToEnd()
  } else {
    Write-Host 'POST /app/api/contact => ERR'
    Write-Host $_.Exception.Message
  }
}

Write-Host 'Done.' -ForegroundColor Green
