# Clear Next.js Cache and Restart
# This script clears Next.js cache and prepares for fresh build

Write-Host "Clearing Next.js cache..." -ForegroundColor Yellow

# Remove .next directory
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✅ .next cache cleared" -ForegroundColor Green
} else {
    Write-Host "ℹ️ .next directory not found" -ForegroundColor Gray
}

# Remove node_modules/.cache if exists
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
    Write-Host "✅ node_modules cache cleared" -ForegroundColor Green
}

Write-Host "`nCache cleared! Now restart your dev server:" -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor Cyan

