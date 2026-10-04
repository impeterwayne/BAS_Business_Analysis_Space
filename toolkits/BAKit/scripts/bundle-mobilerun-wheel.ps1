<#
.SYNOPSIS
  Builds the mobilerun-mcp wheel that BA Space ships in toolkits\BAKit\mcp\.

.DESCRIPTION
  Mobilerun setup in BA Space installs mobilerun-mcp from this bundled wheel (its Python dependencies still
  come from PyPI). Run this after changing mobilerun-mcp, then rebuild the app. Older bundled wheels are
  removed so exactly one ships. Needs uv on PATH.

.EXAMPLE
  .\bundle-mobilerun-wheel.ps1
.EXAMPLE
  .\bundle-mobilerun-wheel.ps1 -Source D:\Quest\mobilerun-mcp
#>
[CmdletBinding()]
param(
  [string]$Source
)

$ErrorActionPreference = 'Stop'
$KitRoot = Split-Path -Parent $PSScriptRoot
$OutDir = Join-Path $KitRoot 'mcp'

if (-not $Source) {
  $candidates = @((Join-Path (Split-Path -Parent (Split-Path -Parent $KitRoot)) 'mobilerun-mcp'), 'D:\Quest\mobilerun-mcp')
  $Source = $candidates | Where-Object { Test-Path (Join-Path $_ 'pyproject.toml') } | Select-Object -First 1
  if (-not $Source) { throw "mobilerun-mcp checkout not found. Pass -Source <folder with pyproject.toml>. Tried: $($candidates -join '; ')" }
}
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) { throw 'uv is not on PATH: https://docs.astral.sh/uv/getting-started/installation/' }

$staging = Join-Path ([System.IO.Path]::GetTempPath()) "mobilerun-wheel-$([guid]::NewGuid().ToString('N'))"
try {
  & uv build --wheel --out-dir $staging $Source
  if ($LASTEXITCODE -ne 0) { throw "uv build failed ($LASTEXITCODE)" }
  $wheel = Get-ChildItem $staging -Filter 'mobilerun_mcp-*.whl' | Select-Object -First 1
  if (-not $wheel) { throw "uv build produced no mobilerun_mcp wheel in $staging" }
  Get-ChildItem $OutDir -Filter 'mobilerun_mcp-*.whl' -ErrorAction SilentlyContinue | Remove-Item -Force
  Copy-Item $wheel.FullName $OutDir
  $commit = (& git -C $Source rev-parse --short HEAD 2>$null)
  Write-Host "Bundled $($wheel.Name) from $Source$(if ($commit) { " @ $commit" }) into $OutDir"
} finally {
  Remove-Item -Recurse -Force $staging -ErrorAction SilentlyContinue
}
