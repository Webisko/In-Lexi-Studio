param(
  [string]$SshUser = 'srv77673',
  [string]$SshHost = 'h50.seohost.pl',
  [int]$SshPort = 57185,
  [string]$KeyPath = "$env:USERPROFILE\.ssh\copilot_inlexi",
  [string]$LocalRoot = (Get-Location).Path,
  [switch]$IncludeFrontend,
  [switch]$IncludeBackend,
  [switch]$IncludeAdmin
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
  param([string]$Title)
  Write-Host "`n=== $Title ===" -ForegroundColor Cyan
}

function To-UnixPath {
  param([string]$Path)
  return ($Path -replace '\\', '/')
}

function Should-Exclude {
  param(
    [string]$RelativePath,
    [string[]]$ExcludePatterns
  )

  foreach ($pattern in $ExcludePatterns) {
    if ($RelativePath -like $pattern) {
      return $true
    }
  }

  return $false
}

function Get-LocalHashes {
  param(
    [string]$Path,
    [string[]]$ExcludePatterns,
    [string[]]$IncludePatterns
  )

  $resolved = Resolve-Path $Path
  $base = $resolved.Path

  if (-not (Test-Path $base)) {
    return @{}
  }

  $files = Get-ChildItem -Path $base -Recurse -File
  $result = @{}

  foreach ($file in $files) {
    $relative = $file.FullName.Substring($base.Length).TrimStart('\', '/')
    $relative = To-UnixPath $relative

    $isIncluded = $true
    if ($IncludePatterns -and $IncludePatterns.Count -gt 0) {
      $isIncluded = $false
      foreach ($includePattern in $IncludePatterns) {
        if ($relative -like $includePattern) {
          $isIncluded = $true
          break
        }
      }
    }

    if (-not $isIncluded) {
      continue
    }

    if (Should-Exclude -RelativePath $relative -ExcludePatterns $ExcludePatterns) {
      continue
    }

    try {
      $hashObj = Get-FileHash -Path $file.FullName -Algorithm SHA256
      if (-not $hashObj -or -not ($hashObj.PSObject.Properties.Name -contains 'Hash')) {
        continue
      }

      $hash = [string]$hashObj.Hash
      if ([string]::IsNullOrWhiteSpace($hash)) {
        continue
      }

      $result[$relative] = $hash.ToLowerInvariant()
    } catch {
      Write-Host ("WARN: Cannot hash local file: {0}" -f $file.FullName) -ForegroundColor Yellow
    }
  }

  return $result
}

function Get-RemoteHashes {
  param(
    [string]$RemotePath,
    [string[]]$ExcludePatterns
  )

  $excludeScript = @()
  foreach ($pattern in $ExcludePatterns) {
    $excludeScript += "-not -path './$pattern'"
  }

  $excludeJoined = if ($excludeScript.Count -gt 0) { ' ' + ($excludeScript -join ' ') } else { '' }

  $remoteCommand = "if [ -d `"$RemotePath`" ]; then cd `"$RemotePath`" && find . -type f$excludeJoined -print0 | sort -z | xargs -0 sha256sum; fi"
  $output = & ssh -i $KeyPath -p $SshPort "$SshUser@$SshHost" $remoteCommand 2>&1
  if ($LASTEXITCODE -ne 0) {
    $details = ($output | Out-String).Trim()
    throw "Remote hash listing failed for '$RemotePath'. $details"
  }

  $result = @{}
  if (-not $output) {
    return $result
  }

  foreach ($line in $output) {
    if ($line -match '^([a-fA-F0-9]{64})\s+\*?(.+)$') {
      $hash = $matches[1].ToLowerInvariant()
      $path = $matches[2].Trim()
      if ($path.StartsWith('./')) {
        $path = $path.Substring(2)
      }
      $path = To-UnixPath $path
      $result[$path] = $hash
    }
  }

  return $result
}

function Compare-HashSets {
  param(
    [hashtable]$Local,
    [hashtable]$Remote
  )

  $localKeys = [System.Collections.Generic.HashSet[string]]::new([string[]]$Local.Keys)
  $remoteKeys = [System.Collections.Generic.HashSet[string]]::new([string[]]$Remote.Keys)

  $onlyLocal = New-Object System.Collections.Generic.List[string]
  $onlyRemote = New-Object System.Collections.Generic.List[string]
  $different = New-Object System.Collections.Generic.List[string]

  foreach ($key in $localKeys) {
    if (-not $remoteKeys.Contains($key)) {
      $onlyLocal.Add($key)
      continue
    }

    if ($Local[$key] -ne $Remote[$key]) {
      $different.Add($key)
    }
  }

  foreach ($key in $remoteKeys) {
    if (-not $localKeys.Contains($key)) {
      $onlyRemote.Add($key)
    }
  }

  return [pscustomobject]@{
    OnlyLocal = @($onlyLocal | Sort-Object)
    OnlyRemote = @($onlyRemote | Sort-Object)
    Different = @($different | Sort-Object)
  }
}

if (-not (Test-Path $KeyPath)) {
  throw "SSH key not found: $KeyPath"
}

$targets = @(
  [pscustomobject]@{
    Name = 'Frontend (dist -> public_html)'
    LocalPath = Join-Path $LocalRoot 'dist'
    RemotePath = 'domains/inlexistudio.com/public_html'
    Excludes = @()
    Includes = @('*')
    Enabled = $IncludeFrontend.IsPresent
  },
  [pscustomobject]@{
    Name = 'Backend (cms-app payload)'
    LocalPath = $LocalRoot
    RemotePath = 'domains/inlexistudio.com/cms-app'
    Excludes = @(
      'node_modules/*',
      '.git/*',
      'dist/*',
      '.env',
      '.htaccess',
      'node.log',
      'inlexistudio.db',
      'inlexistudio.db-journal',
      'prisma/inlexistudio.db',
      'public/.nojekyll',
      'public/uploads/*'
    )
    Includes = @('api/*', 'prisma/*', 'admin/*', 'app.js', 'package.json', 'package-lock.json')
    Enabled = $IncludeBackend.IsPresent
  },
  [pscustomobject]@{
    Name = 'Admin (admin -> public_html)'
    LocalPath = Join-Path $LocalRoot 'admin'
    RemotePath = 'domains/admin.inlexistudio.com/public_html'
    Excludes = @()
    Includes = @('*')
    Enabled = $IncludeAdmin.IsPresent
  }
)

if (-not ($IncludeFrontend -or $IncludeBackend -or $IncludeAdmin)) {
  $targets | ForEach-Object { $_.Enabled = $true }
}

Write-Section 'Remote hash comparison (SSH)'
Write-Host ("Host: {0}@{1}:{2}" -f $SshUser, $SshHost, $SshPort)
Write-Host "Local root: $LocalRoot"

$overallIssues = 0

foreach ($target in $targets) {
  if (-not $target.Enabled) {
    continue
  }

  Write-Section $target.Name

  if (-not (Test-Path $target.LocalPath)) {
    Write-Host "SKIP: local path missing -> $($target.LocalPath)" -ForegroundColor Yellow
    continue
  }

  $localHashes = Get-LocalHashes -Path $target.LocalPath -ExcludePatterns $target.Excludes -IncludePatterns $target.Includes
  $remoteHashes = Get-RemoteHashes -RemotePath $target.RemotePath -ExcludePatterns $target.Excludes
  $diff = Compare-HashSets -Local $localHashes -Remote $remoteHashes

  $countLocal = $localHashes.Count
  $countRemote = $remoteHashes.Count

  Write-Host "Local files:  $countLocal"
  Write-Host "Remote files: $countRemote"
  Write-Host "Only local:   $($diff.OnlyLocal.Count)"
  Write-Host "Only remote:  $($diff.OnlyRemote.Count)"
  Write-Host "Hash differs: $($diff.Different.Count)"

  if ($diff.OnlyLocal.Count -eq 0 -and $diff.OnlyRemote.Count -eq 0 -and $diff.Different.Count -eq 0) {
    Write-Host 'Status: MATCH' -ForegroundColor Green
    continue
  }

  $overallIssues += ($diff.OnlyLocal.Count + $diff.OnlyRemote.Count + $diff.Different.Count)
  Write-Host 'Status: DIFF' -ForegroundColor Yellow

  $previewLimit = 20

  if ($diff.OnlyLocal.Count -gt 0) {
    Write-Host "  Sample only-local (max $previewLimit):"
    $diff.OnlyLocal | Select-Object -First $previewLimit | ForEach-Object { Write-Host "    + $_" }
  }

  if ($diff.OnlyRemote.Count -gt 0) {
    Write-Host "  Sample only-remote (max $previewLimit):"
    $diff.OnlyRemote | Select-Object -First $previewLimit | ForEach-Object { Write-Host "    - $_" }
  }

  if ($diff.Different.Count -gt 0) {
    Write-Host "  Sample hash-different (max $previewLimit):"
    $diff.Different | Select-Object -First $previewLimit | ForEach-Object { Write-Host "    * $_" }
  }
}

Write-Section 'Done'
if ($overallIssues -eq 0) {
  Write-Host 'All selected targets are in sync.' -ForegroundColor Green
} else {
  Write-Host "Found $overallIssues differences across selected targets." -ForegroundColor Yellow
  exit 2
}
