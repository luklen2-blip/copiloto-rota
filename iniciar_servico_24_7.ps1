# Script de Inicialização Resiliente 24/7 para Copiloto-Rota & Túnel Cloudflare
$ErrorActionPreference = "SilentlyContinue"

$projectDir = "C:\Users\luciano\.gemini\antigravity\scratch\copiloto-rota"
$cloudflaredBin = "$projectDir\cloudflared.exe"
if (-not (Test-Path $cloudflaredBin)) {
    $cloudflaredBin = "C:\Users\luciano\OneDrive\Documentos\nova pasta\index.html\bin\cloudflared.exe"
}
$logFile = "$projectDir\cloudflared.log"
$desktopLinkFile = "C:\Users\luciano\OneDrive\Desktop\LINK_CELULAR_COPILOTO_ROTA.txt"
$desktopQrFile = "C:\Users\luciano\OneDrive\Desktop\QR_CODE_COPILOTO_ROTA_CELULAR.html"

Set-Location $projectDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "INICIANDO SERVICO 24/7 COPILOTO-ROTA & TUNEL CELULAR" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar se Node já está respondendo na porta 3001
$nodeRunning = $false
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:3001/api/health" -TimeoutSec 3 -ErrorAction Stop
    if ($resp.status -eq "ok") {
        $nodeRunning = $true
        Write-Host "Servidor Copiloto-Rota ja ativo na porta 3001." -ForegroundColor Green
    }
} catch {
    $nodeRunning = $false
}

if (-not $nodeRunning) {
    Write-Host "Iniciando Servidor Next.js (porta 3001)..." -ForegroundColor Yellow
    $nodeCmd = "cmd.exe /c cd /d `"$projectDir`" && npx next start -p 3001"
    ([wmiclass]"Win32_Process").Create($nodeCmd) | Out-Null
    Start-Sleep -Seconds 3
}

# 2. Verificar ou iniciar Cloudflare Tunnel
$tunnelUrl = $null
if (Test-Path "$projectDir\public_tunnel_url.txt") {
    $existingUrl = (Get-Content "$projectDir\public_tunnel_url.txt" -Raw).Trim()
    if ($existingUrl -match "trycloudflare\.com") {
        try {
            $tResp = Invoke-RestMethod -Uri "$existingUrl/api/health" -TimeoutSec 3 -ErrorAction Stop
            if ($tResp.status -eq "ok") {
                Write-Host "Tunel Cloudflare ja ativo: $existingUrl" -ForegroundColor Green
                $tunnelUrl = $existingUrl
            }
        } catch {
            $tunnelUrl = $null
        }
    }
}

if (-not $tunnelUrl -and (Test-Path $cloudflaredBin)) {
    Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    if (Test-Path $logFile) { Remove-Item $logFile -Force -ErrorAction SilentlyContinue }

    Write-Host "Iniciando Cloudflare Quick Tunnel (--no-prechecks)..." -ForegroundColor Yellow
    $cfCmd = "cmd.exe /c cd /d `"$projectDir`" && `"$cloudflaredBin`" tunnel --no-autoupdate --no-prechecks --url http://localhost:3001 2> `"$logFile`""
    ([wmiclass]"Win32_Process").Create($cfCmd) | Out-Null

    Write-Host "Aguardando URL do tunel..." -ForegroundColor Cyan

    for ($i = 0; $i -lt 35; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $logFile) {
            $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
            if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
                $tunnelUrl = $matches[1]
                break
            }
        }
    }
}

if ($tunnelUrl) {
    Write-Host "TUNEL ATIVO: $tunnelUrl" -ForegroundColor Green
    Set-Content -Path "$projectDir\public_tunnel_url.txt" -Value $tunnelUrl -Encoding utf8

    $txtLines = @(
        "===================================================================",
        "LINK DE ACESSO AO VIVO NO CELULAR - COPILOTO-ROTA 24/7",
        "===================================================================",
        "",
        "Abra este link direto no navegador do seu smartphone (Android/iPhone):",
        $tunnelUrl,
        "",
        "Ou no computador:",
        "http://localhost:3001",
        "",
        "RECURSOS DISPONIVEIS NO CELULAR:",
        "1. Fechamento rapido com gravacao de voz e foto de print (Gemini IA)",
        "2. Caixinha de manutencao automatica (oleo, pneus, relacao)",
        "3. Raio-X do lucro liquido real (R$/km)",
        "4. Cofre Anti-Bloqueio (defesa juridica com 1 clique)",
        "5. Pagamento PIX Copia-e-Cola oficial e QR Code (R$ 19,90/mes)",
        "",
        "DICA: No celular, toque em 'Compartilhar' > 'Adicionar a Tela de Inicio' para instalar como App nativo!",
        "==================================================================="
    )
    $txtLines | Out-File -FilePath $desktopLinkFile -Encoding utf8

    $qrHtml = @"
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acessar Copiloto-Rota no Celular</title>
    <style>
        body {
            background-color: #020617;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
            text-align: center;
        }
        .card {
            background-color: #0f172a;
            border: 1px solid #334155;
            border-radius: 24px;
            padding: 32px 24px;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        h1 {
            color: #fbbf24;
            font-size: 24px;
            margin: 0 0 8px 0;
            font-weight: 900;
        }
        p {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.5;
            margin: 0 0 20px 0;
        }
        .qr-box {
            background: white;
            padding: 16px;
            border-radius: 16px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .qr-box img {
            display: block;
            width: 200px;
            height: 200px;
        }
        .link-btn {
            display: block;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #020617;
            text-decoration: none;
            font-weight: 800;
            padding: 14px 20px;
            border-radius: 12px;
            font-size: 15px;
            word-break: break-all;
            margin-bottom: 12px;
            transition: transform 0.2s;
        }
        .link-btn:hover {
            transform: scale(1.02);
        }
        .badge {
            background: #1e293b;
            color: #38bdf8;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="card">
        <h1>🛵 Copiloto-Rota 24/7</h1>
        <p>Aponte a camera do seu celular para o QR Code abaixo para abrir o app ao vivo:</p>
        
        <div class="qr-box">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$tunnelUrl" alt="QR Code Copiloto-Rota">
        </div>

        <a href="$tunnelUrl" target="_blank" class="link-btn">Acessar no Celular (Link Direto)</a>
        
        <div style="margin-top: 16px;">
            <span class="badge">HTTPS Seguro • PWA Instalavel</span>
        </div>
        <p style="margin-top: 14px; font-size: 12px; color: #64748b;">
            No celular: clique em "Compartilhar" e depois "Adicionar a Tela de Inicio" para rodar em tela cheia!
        </p>
    </div>
</body>
</html>
"@
    $qrHtml | Out-File -FilePath $desktopQrFile -Encoding utf8
    Write-Host "Atalhos gerados na Area de Trabalho!" -ForegroundColor Green
} else {
    Write-Host "Aplicacao rodando localmente em http://localhost:3001" -ForegroundColor Yellow
}
