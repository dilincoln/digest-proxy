Write-Host "Starting Digest Proxy Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Make sure you have run: npm install" -ForegroundColor Yellow
Write-Host ""
Write-Host "Starting server on port 3000..." -ForegroundColor Cyan

try {
    npm run dev
} catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
