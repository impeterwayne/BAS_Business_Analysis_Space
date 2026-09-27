<#
.SYNOPSIS
  Installs the BAKit BA toolkit into an Antigravity workspace and (optionally) registers the
  mobilerun MCP server in Antigravity's MCP config.

.DESCRIPTION
  Copies agents, skills, rules and workflows into <Target>\.agents\. The project config
  (.agents\config\ba-project-config.md) is only created when missing, so a filled-in config is never
  overwritten. Adds the deployed toolkit paths (not the project config) to the repository's
  info/exclude when Target is a git work tree.

  With -RegisterMcp, merges a "mobilerun" entry into Antigravity's MCP config
  (%USERPROFILE%\.gemini\config\mcp_config.json, or the legacy ...\.gemini\antigravity\mcp_config.json
  when the new folder does not exist). Other servers are preserved and a .bak copy is written first.
  An existing "mobilerun" entry is left untouched unless -Force is given.

.EXAMPLE
  .\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterMcp
.EXAMPLE
  .\install-bakit.ps1 -RegisterMcp -McpOnly -MobilerunPath D:\Quest\mobilerun-mcp -Device R58RB1XWAKJ
#>
[CmdletBinding()]
param(
  [string]$Target = (Get-Location).Path,
  [switch]$RegisterMcp,
  [switch]$McpOnly,
  [string]$MobilerunPath,
  [string]$Device,
  [switch]$Force
)

$ErrorActionPreference = 'Stop'
$KitRoot = Split-Path -Parent $PSScriptRoot
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false

function Copy-KitFolder([string]$Source, [string]$Dest) {
  if (-not (Test-Path $Dest)) { New-Item -ItemType Directory -Force $Dest | Out-Null }
  foreach ($item in Get-ChildItem -Force $Source) {
    $to = Join-Path $Dest $item.Name
    if (Test-Path $to) { Remove-Item -Recurse -Force $to }
    Copy-Item -Recurse -Force $item.FullName $to
  }
}

function Add-GitExclude([string]$WorkTree, [string[]]$Patterns) {
  $git = Get-Command git -ErrorAction SilentlyContinue
  if (-not $git) { return }
  $inside = & git -C $WorkTree rev-parse --is-inside-work-tree 2>$null
  if ($inside -ne 'true') { return }
  $excludePath = & git -C $WorkTree rev-parse --git-path info/exclude
  if (-not [System.IO.Path]::IsPathRooted($excludePath)) { $excludePath = Join-Path $WorkTree $excludePath }
  $dir = Split-Path -Parent $excludePath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  $existing = @()
  if (Test-Path $excludePath) { $existing = Get-Content $excludePath }
  $missing = $Patterns | Where-Object { $existing -notcontains $_ }
  if ($missing) {
    $block = @('', '# BAKit (BA Space)') + $missing
    [System.IO.File]::AppendAllText($excludePath, (($block -join "`n") + "`n"), $Utf8NoBom)
  }
}

function Resolve-MobilerunPython {
  $candidates = @()
  if ($MobilerunPath) { $candidates += $MobilerunPath }
  $candidates += (Join-Path (Split-Path -Parent (Split-Path -Parent $KitRoot)) 'mobilerun-mcp')
  $candidates += 'D:\Quest\mobilerun-mcp'
  foreach ($c in $candidates) {
    if (-not (Test-Path $c)) { continue }
    # Follow a symlinked checkout (e.g. BA_Space\mobilerun-mcp) to its real folder.
    $dirItem = Get-Item $c
    if ($dirItem.LinkType -and $dirItem.Target) { $c = @($dirItem.Target)[0] }
    $py = Join-Path $c '.venv\Scripts\python.exe'
    if (Test-Path $py) { return (Resolve-Path $py).Path }
  }
  throw "mobilerun-mcp venv not found. Pass -MobilerunPath <folder containing .venv>. Tried: $($candidates -join '; ')"
}

function Get-AntigravityMcpConfigPath {
  $geminiDir = Join-Path $env:USERPROFILE '.gemini'
  $current = Join-Path $geminiDir 'config'
  if (Test-Path $current) { return (Join-Path $current 'mcp_config.json') }
  return (Join-Path $geminiDir 'antigravity\mcp_config.json')
}

function Register-MobilerunMcp {
  $configPath = Get-AntigravityMcpConfigPath
  $python = Resolve-MobilerunPython

  $config = [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
  if (Test-Path $configPath) {
    $raw = [System.IO.File]::ReadAllText($configPath)
    if ($raw.Trim()) { $config = $raw | ConvertFrom-Json }
    if (-not $config.PSObject.Properties['mcpServers']) {
      $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})
    }
  }

  $exists = [bool]$config.mcpServers.PSObject.Properties['mobilerun']
  if ($exists -and -not $Force) {
    Write-Host "mobilerun is already registered in $configPath (use -Force to replace it)."
    return
  }

  $entry = [pscustomobject]@{ command = ($python -replace '\\', '/'); args = @('-m', 'mobilerun_mcp.server') }
  if ($Device) { $entry | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{ MOBILERUN_DEVICE = $Device }) }

  if ($exists) { $config.mcpServers.PSObject.Properties.Remove('mobilerun') }
  $config.mcpServers | Add-Member -NotePropertyName mobilerun -NotePropertyValue $entry

  $dir = Split-Path -Parent $configPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
  if (Test-Path $configPath) { Copy-Item -Force $configPath "$configPath.bak" }
  [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 20), $Utf8NoBom)
  Write-Host "Registered mobilerun MCP ($python) in $configPath. Restart the Antigravity agent to load it."
}

if (-not $McpOnly) {
  $Target = (Resolve-Path $Target).Path
  $agentsDir = Join-Path $Target '.agents'
  foreach ($folder in 'agents', 'skills', 'rules', 'workflows') {
    Copy-KitFolder (Join-Path $KitRoot $folder) (Join-Path $agentsDir $folder)
  }
  $configDest = Join-Path $agentsDir 'config\ba-project-config.md'
  if (-not (Test-Path $configDest)) {
    New-Item -ItemType Directory -Force (Split-Path -Parent $configDest) | Out-Null
    Copy-Item (Join-Path $KitRoot 'config\ba-project-config.md') $configDest
    Write-Host "Created $configDest - fill it in for this project."
  } else {
    Write-Host "Kept existing $configDest."
  }

  $patterns = @()
  foreach ($folder in 'agents', 'skills', 'rules', 'workflows') {
    foreach ($item in Get-ChildItem (Join-Path $KitRoot $folder)) {
      $suffix = if ($item.PSIsContainer) { '/' } else { '' }
      $patterns += ".agents/$folder/$($item.Name)$suffix"
    }
  }
  # ba-project-config.md is project data, not toolkit code: leave it committable.
  Add-GitExclude $Target $patterns
  Write-Host "BAKit installed into $agentsDir"
}

if ($RegisterMcp -or $McpOnly) { Register-MobilerunMcp }
