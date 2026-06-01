# Self-contained synchronization script for ZA.go.ke and Obsidian mySpace Vault
# Run this script using PowerShell

$ErrorActionPreference = "Stop"

function Sync-GitDirectory {
    param (
        [string]$Path,
        [string]$RepoName,
        [string]$DefaultCommitMessage
    )

    Write-Host "`n==================================================" -ForegroundColor Cyan
    Write-Host "Syncing Directory: $RepoName" -ForegroundColor Cyan
    Write-Host "Path: $Path" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan

    # 1. Verify Directory Exists
    if (-not (Test-Path $Path)) {
        Write-Error "Target directory $Path does not exist!"
        return
    }

    # Change to directory
    Push-Location $Path

    try {
        # 2. Check if git is initialized
        if (-not (Test-Path ".git")) {
            Write-Host "Git repository not found. Initializing git repository..." -ForegroundColor Yellow
            git init
            git checkout -b main
        }

        # 3. Check for remote origin
        $remoteUrl = ""
        try {
            $remoteUrl = git remote get-url origin 2>$null
        } catch {
            $remoteUrl = ""
        }

        if ([string]::IsNullOrEmpty($remoteUrl)) {
            Write-Host "Remote 'origin' is not configured for $RepoName." -ForegroundColor Yellow
            $inputUrl = Read-Host "Please enter the GitHub HTTPS Remote URL for $RepoName (leave blank to skip pushing)"
            if (-not [string]::IsNullOrEmpty($inputUrl)) {
                git remote add origin $inputUrl.Trim()
                Write-Host "Configured remote origin to $inputUrl" -ForegroundColor Green
            } else {
                Write-Host "Skipping remote push for $RepoName as no URL was provided." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Remote 'origin' already configured: $remoteUrl" -ForegroundColor Green
        }

        # 4. Stage and commit changes
        Write-Host "Staging changes..." -ForegroundColor Gray
        git add -A

        $status = git status --porcelain
        if (-not [string]::IsNullOrEmpty($status)) {
            Write-Host "Changes detected. Committing changes..." -ForegroundColor Green
            git commit -m $DefaultCommitMessage
        } else {
            Write-Host "No changes to commit for $RepoName." -ForegroundColor Gray
        }

        # 5. Push to GitHub if remote is configured
        try {
            $remoteUrl = git remote get-url origin 2>$null
        } catch {
            $remoteUrl = ""
        }

        if (-not [string]::IsNullOrEmpty($remoteUrl)) {
            $currentBranch = git branch --show-current
            if ([string]::IsNullOrEmpty($currentBranch)) {
                $currentBranch = "main"
            }
            Write-Host "Pushing $currentBranch to remote origin..." -ForegroundColor Green
            git push -u origin $currentBranch
        }

    } catch {
        Write-Host "Error syncing $($RepoName): $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

# Run synchronization for ZA.go.ke
Sync-GitDirectory -Path "C:\Users\mwiti\ZA.go.ke" -RepoName "ZA.go.ke Project" -DefaultCommitMessage "feat: synchronize workspace and initialize premium digital experience layout"

# Run synchronization for Obsidian mySpace Vault
Sync-GitDirectory -Path "C:\Users\mwiti\Downloads\Obsidian\mySpace" -RepoName "Obsidian mySpace Vault" -DefaultCommitMessage "docs: update personal vault and developer logs"

Write-Host "`nWorkspace reconciliation completed successfully!`n" -ForegroundColor Green
