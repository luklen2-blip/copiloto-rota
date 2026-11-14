$projectDir = "C:\Users\luciano\.gemini\antigravity\scratch\copiloto-rota"
$desktopDir = "C:\Users\luciano\OneDrive\Desktop"
$zipPath = Join-Path $desktopDir "copiloto-rota-producao.zip"

Write-Host "[ZIP] Gerando pacote limpo de producao..." -ForegroundColor Cyan

$staging = Join-Path $env:TEMP "copiloto_rota_staging"
if (Test-Path $staging) { Remove-Item -Recurse -Force $staging }
New-Item -ItemType Directory -Path $staging | Out-Null

$items = Get-ChildItem -Path $projectDir -Exclude 'node_modules', '.next', '.git', 'test-dist', 'dist-test'
foreach ($item in $items) {
    Copy-Item -Path $item.FullName -Destination $staging -Recurse -Force
}

if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
Compress-Archive -Path "$staging\*" -DestinationPath $zipPath -Force
Remove-Item -Recurse -Force $staging

Write-Host "[SUCESSO] Pacote criado em: $zipPath" -ForegroundColor Green
