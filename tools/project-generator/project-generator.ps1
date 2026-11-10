<#
.SYNOPSIS
    PowerShell wrapper for MADEL Studio Bridge Unified Project Generator.
.EXAMPLE
    .\project-generator.ps1 -Mode software -Name "Sample-Tool" -Tech node
    .\project-generator.ps1 -Mode creative -App "04-Photoshop" -Brand "Loris" -Name "Social-Design-01"
#>
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("software", "creative")]
    [string]$Mode,

    [Parameter(Mandatory=$true)]
    [string]$Name,

    # Software parameters
    [string]$Tech = "ts",
    [string]$RepoType = "source",
    [switch]$Git,

    # Creative parameters
    [string]$App,
    [string]$Brand,

    # Common
    [string]$Desc
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$jsPath = Join-Path $scriptDir "generator.js"

$argsList = @($jsPath, $Mode, "--name", $Name)

if ($Desc) {
    $argsList += "--desc"
    $argsList += $Desc
}

if ($Mode -eq "software") {
    $argsList += "--tech"
    $argsList += $Tech
    $argsList += "--repo-type"
    $argsList += $RepoType
    if ($Git) {
        $argsList += "--git"
    }
} elseif ($Mode -eq "creative") {
    if (-not $App -or -not $Brand) {
        Write-Error "-App and -Brand are mandatory when -Mode is 'creative'."
        exit 1
    }
    $argsList += "--app"
    $argsList += $App
    $argsList += "--brand"
    $argsList += $Brand
}

node $argsList
