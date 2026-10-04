<#
.SYNOPSIS
  Installs the BAKit BA toolkit into an Antigravity workspace and (optionally) registers the
  mobilerun MCP server for that workspace.

.DESCRIPTION
  Copies agents, skills, rules and workflows into <Target>\.agents\. The project config
  (.agents\config\ba-project-config.md) is only created when missing, so a filled-in config is never
  overwritten. Adds the deployed toolkit paths (not the project config) to the repository's
  info/exclude when Target is a git work tree.

  With -RegisterMcp, adds mobilerun as an Antigravity workspace plugin:
  <Target>\.agents\plugins\mobilerun\{plugin.json, mcp_config.json}. Antigravity discovers plugins in
  the workspace's .agents\, so the server starts only in this workspace. Other servers in that file are
  preserved; an existing "mobilerun" entry is left untouched unless -Force is given. Warns when an older
  global entry (%USERPROFILE%\.gemini\config\mcp_config.json) would still start it everywhere.

  With -RegisterFigmaMcp, adds figma-mcp-android (npx, Figma Desktop plugin bridge) the same way, as
  <Target>\.agents\plugins\figma\. Skipped when an enabled global entry already launches it: the server binds
  127.0.0.1:1994 for the Figma plugin, so two copies cannot run side by side.

.EXAMPLE
  .\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterMcp
.EXAMPLE
  .\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -McpOnly -MobilerunPath D:\Quest\BA_Space\mobilerun-mcp -Device R58RB1XWAKJ
.EXAMPLE
  .\install-bakit.ps1 -Target D:\Projects\my-ba-workspace -RegisterFigmaMcp
#>
[CmdletBinding()]
param(
  [string]$Target = (Get-Location).Path,
  [switch]$RegisterMcp,
  [switch]$RegisterFigmaMcp,
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
  foreach ($c in $candidates) {
    $py = Join-Path $c '.venv\Scripts\python.exe'
    if (Test-Path $py) { return (Resolve-Path $py).Path }
  }
  # The copy BA Space installs (Mobilerun setup); .installed is written only after a complete install.
  $managed = Join-Path $env:LOCALAPPDATA 'BA Space\mobilerun\mcp'
  $py = Join-Path $managed '.venv\Scripts\python.exe'
  if ((Test-Path (Join-Path $managed '.installed')) -and (Test-Path $py)) { return (Resolve-Path $py).Path }
  throw "mobilerun-mcp venv not found. Run Mobilerun setup in BA Space, or pass -MobilerunPath <folder containing .venv>. Tried: $(($candidates + $managed) -join '; ')"
}

function Get-AntigravityMcpConfigPath {
  $geminiDir = Join-Path $env:USERPROFILE '.gemini'
  $current = Join-Path $geminiDir 'config'
  if (Test-Path $current) { return (Join-Path $current 'mcp_config.json') }
  return (Join-Path $geminiDir 'antigravity\mcp_config.json')
}

function Register-MobilerunMcp {
  # Workspace scope: an Antigravity plugin under <Target>\.agents\plugins\mobilerun, discovered only in
  # this workspace. The global config is read only to warn about an entry left by an older BAKit.
  $pluginDir = Join-Path (Resolve-Path $Target).Path '.agents\plugins\mobilerun'
  $configPath = Join-Path $pluginDir 'mcp_config.json'
  $python = Resolve-MobilerunPython

  if (-not (Test-Path $pluginDir)) { New-Item -ItemType Directory -Force $pluginDir | Out-Null }
  $manifest = [pscustomobject]@{ name = 'mobilerun'; description = 'BAKit: drives a connected Android device for competitor app analysis (mobilerun MCP).' }
  [System.IO.File]::WriteAllText((Join-Path $pluginDir 'plugin.json'), ($manifest | ConvertTo-Json), $Utf8NoBom)

  $globalPath = Get-AntigravityMcpConfigPath
  if ((Test-Path $globalPath) -and ([System.IO.File]::ReadAllText($globalPath) -match '"mobilerun"\s*:')) {
    Write-Warning "mobilerun is also registered globally in $globalPath, so it starts in every workspace. Remove that entry to keep it workspace-only."
  }

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

  [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 20), $Utf8NoBom)
  Write-Host "Registered mobilerun MCP ($python) as a workspace plugin in $configPath. Restart the Antigravity agent to load it."
}

function Find-GlobalFigmaMcp {
  # Only the global file Antigravity reads counts (same resolution as mobilerun).
  foreach ($p in @(Get-AntigravityMcpConfigPath)) {
    if (-not (Test-Path $p)) { continue }
    $raw = [System.IO.File]::ReadAllText($p)
    if (-not $raw.Trim()) { continue }
    try { $cfg = $raw | ConvertFrom-Json } catch { continue }
    if (-not $cfg.mcpServers) { continue }
    foreach ($s in $cfg.mcpServers.PSObject.Properties) {
      if ($s.Value.disabled) { continue }
      $launch = (@($s.Value.command) + @($s.Value.args)) -join ' '
      if ($s.Name -eq 'figma-mcp-android' -or $launch -match 'figma-mcp-android') { return $p }
    }
  }
  return $null
}

function Register-FigmaMcp {
  $global = Find-GlobalFigmaMcp
  if ($global) {
    Write-Host "figma-mcp-android is already registered globally in $global; this workspace uses it. No workspace plugin added."
    return
  }
  $pluginDir = Join-Path (Resolve-Path $Target).Path '.agents\plugins\figma'
  $configPath = Join-Path $pluginDir 'mcp_config.json'
  if (-not (Test-Path $pluginDir)) { New-Item -ItemType Directory -Force $pluginDir | Out-Null }
  $manifest = [pscustomobject]@{ name = 'figma'; description = 'BAKit: reads the Figma design open in Figma Desktop (figma-mcp-android plugin bridge) for BA analysis.' }
  [System.IO.File]::WriteAllText((Join-Path $pluginDir 'plugin.json'), ($manifest | ConvertTo-Json), $Utf8NoBom)

  $config = [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
  if (Test-Path $configPath) {
    $raw = [System.IO.File]::ReadAllText($configPath)
    if ($raw.Trim()) { $config = $raw | ConvertFrom-Json }
    if (-not $config.PSObject.Properties['mcpServers']) {
      $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})
    }
  }
  if ($config.mcpServers.PSObject.Properties['figma-mcp-android'] -and -not $Force) {
    Write-Host "figma-mcp-android is already registered in $configPath (use -Force to replace it)."
    return
  }
  # npx is a .cmd shim on Windows, which a bare spawn cannot start.
  $entry = [pscustomobject]@{ command = 'cmd'; args = @('/c', 'npx', '-y', '@impeterwayne/figma-mcp-android@latest') }
  if ($config.mcpServers.PSObject.Properties['figma-mcp-android']) { $config.mcpServers.PSObject.Properties.Remove('figma-mcp-android') }
  $config.mcpServers | Add-Member -NotePropertyName 'figma-mcp-android' -NotePropertyValue $entry
  [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 20), $Utf8NoBom)
  Write-Host "Registered figma-mcp-android as a workspace plugin in $configPath. Run the plugin in Figma Desktop and restart the Antigravity agent."
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
  # The delegation rule goes into AGENTS.md as a marked block (Antigravity always reads AGENTS.md;
  # rule files load unreliably). Content outside the markers is the user's and is kept.
  $agentsMd = Join-Path $Target 'AGENTS.md'
  $blockBody = [System.IO.File]::ReadAllText((Join-Path $KitRoot 'agents-md\AGENTS.block.md')).Trim()
  $block = "<!-- bakit:orchestrate:start -->`n$blockBody`n<!-- bakit:orchestrate:end -->`n"
  $blockRe = '(?s)<!-- bakit:orchestrate:start -->.*?<!-- bakit:orchestrate:end -->\r?\n?'
  if (Test-Path $agentsMd) {
    $current = [System.IO.File]::ReadAllText($agentsMd)
    if ($current -match $blockRe) {
      $next = [regex]::Replace($current, $blockRe, { param($m) $block })
    } elseif ($current.Trim()) {
      $next = "$block`n$current"
    } else {
      $next = $block
    }
  } else {
    $next = $block
  }
  [System.IO.File]::WriteAllText($agentsMd, $next, $Utf8NoBom)
  Write-Host "Delegation rule written to $agentsMd"

  # ba-project-config.md is project data, not toolkit code: leave it committable.
  Add-GitExclude $Target $patterns
  Write-Host "BAKit installed into $agentsDir"
}

if ($RegisterMcp -or ($McpOnly -and -not $RegisterFigmaMcp)) { Register-MobilerunMcp }
if ($RegisterFigmaMcp) { Register-FigmaMcp }
