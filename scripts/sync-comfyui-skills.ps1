[CmdletBinding()]
param(
    [switch]$Check,
    [string]$Source
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$skillsRoot = Join-Path $repoRoot ".agents\skills"

if ([string]::IsNullOrWhiteSpace($Source)) {
    $Source = Join-Path $repoRoot ".agents\vendor\comfyui-custom-node-skills\plugins\comfyui-custom-nodes\skills"
}

if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
    throw "Skill source not found: $Source`nInitialize the submodule first with: git submodule update --init --recursive"
}

$sourceRoot = (Resolve-Path -LiteralPath $Source).Path
$sourceSkills = @(
    Get-ChildItem -LiteralPath $sourceRoot -Directory |
        Where-Object Name -Like "comfyui-node-*" |
        Sort-Object Name
)

if ($sourceSkills.Count -eq 0) {
    throw "No comfyui-node-* skill directories found in: $sourceRoot"
}

foreach ($skill in $sourceSkills) {
    if (-not (Test-Path -LiteralPath (Join-Path $skill.FullName "SKILL.md") -PathType Leaf)) {
        throw "Refusing to sync invalid skill directory (SKILL.md is missing): $($skill.FullName)"
    }
}

function Get-DirectoryFingerprint {
    param([Parameter(Mandatory)][string]$Path)

    if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
        return "<missing>"
    }

    $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $entries = foreach ($file in Get-ChildItem -LiteralPath $resolvedPath -File -Recurse | Sort-Object FullName) {
        $relativePath = [IO.Path]::GetRelativePath($resolvedPath, $file.FullName).Replace("\", "/")
        $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
        "$relativePath`t$hash"
    }

    return ($entries -join "`n")
}

$outdatedSkills = @(
    foreach ($skill in $sourceSkills) {
        $destination = Join-Path $skillsRoot $skill.Name
        if ((Get-DirectoryFingerprint -Path $skill.FullName) -cne (Get-DirectoryFingerprint -Path $destination)) {
            $skill.Name
        }
    }
)

if ($outdatedSkills.Count -eq 0) {
    Write-Host "ComfyUI node skills are up to date."
    exit 0
}

if ($Check) {
    Write-Host "ComfyUI node skills need synchronization:"
    $outdatedSkills | ForEach-Object { Write-Host "  - $_" }
    exit 1
}

if (-not (Test-Path -LiteralPath $skillsRoot -PathType Container)) {
    New-Item -ItemType Directory -Path $skillsRoot | Out-Null
}

$stagingRoot = Join-Path $repoRoot ".agents\.skill-sync-$([Guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $stagingRoot | Out-Null

try {
    foreach ($skillName in $outdatedSkills) {
        $sourceSkill = Join-Path $sourceRoot $skillName
        $stagedSkill = Join-Path $stagingRoot $skillName
        Copy-Item -LiteralPath $sourceSkill -Destination $stagedSkill -Recurse

        if ((Get-DirectoryFingerprint -Path $sourceSkill) -cne (Get-DirectoryFingerprint -Path $stagedSkill)) {
            throw "Staged copy verification failed for: $skillName"
        }
    }

    foreach ($skillName in $outdatedSkills) {
        $destination = Join-Path $skillsRoot $skillName
        $stagedSkill = Join-Path $stagingRoot $skillName
        $backup = Join-Path $stagingRoot "$skillName.backup"

        if (Test-Path -LiteralPath $destination) {
            $destinationItem = Get-Item -LiteralPath $destination -Force
            if (-not $destinationItem.PSIsContainer -or ($destinationItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                throw "Refusing to replace a non-directory or reparse point: $destination"
            }
            Move-Item -LiteralPath $destination -Destination $backup
        }

        try {
            Move-Item -LiteralPath $stagedSkill -Destination $destination
        }
        catch {
            if (Test-Path -LiteralPath $backup) {
                Move-Item -LiteralPath $backup -Destination $destination
            }
            throw
        }

        if (Test-Path -LiteralPath $backup) {
            Remove-Item -LiteralPath $backup -Recurse -Force
        }

        Write-Host "Synchronized $skillName"
    }
}
finally {
    if (Test-Path -LiteralPath $stagingRoot) {
        $resolvedStaging = (Resolve-Path -LiteralPath $stagingRoot).Path
        $expectedParent = (Resolve-Path -LiteralPath (Join-Path $repoRoot ".agents")).Path
        $stagingItem = Get-Item -LiteralPath $resolvedStaging -Force

        if (
            $stagingItem.PSIsContainer -and
            -not ($stagingItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -and
            [IO.Path]::GetDirectoryName($resolvedStaging) -eq $expectedParent -and
            [IO.Path]::GetFileName($resolvedStaging) -like ".skill-sync-*"
        ) {
            Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
        }
        else {
            Write-Warning "Temporary directory was not removed because validation failed: $resolvedStaging"
        }
    }
}

Write-Host "Synchronized $($outdatedSkills.Count) ComfyUI node skill(s)."
