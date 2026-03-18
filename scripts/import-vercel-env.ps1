param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile,

    [ValidateSet('production', 'preview', 'development')]
    [string]$Environment = 'production'
)

if (!(Test-Path $EnvFile)) {
    Write-Error "Arquivo nao encontrado: $EnvFile"
    exit 1
}

$lines = Get-Content $EnvFile |
Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' }

if ($lines.Count -eq 0) {
    Write-Error "Nenhuma variavel valida encontrada em $EnvFile"
    exit 1
}

$placeholders = @('your-', 'COLOCAR_', 'seudominio', 'prod_jwt_secret', 'example.com', 'changeme', 'replace')
$failed = @()

foreach ($line in $lines) {
    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = if ($parts.Length -gt 1) { $parts[1] } else { '' }

    if ([string]::IsNullOrWhiteSpace($value)) {
        Write-Warning "Pulando $key: valor vazio"
        continue
    }

    $hasPlaceholder = $false
    foreach ($p in $placeholders) {
        if ($value -like "*$p*") {
            $hasPlaceholder = $true
            break
        }
    }

    if ($hasPlaceholder) {
        Write-Warning "Pulando $key: valor parece placeholder"
        continue
    }

    Write-Host "Importando $key ($Environment)..."
    $value | npx vercel env add $key $Environment | Out-Null

    if ($LASTEXITCODE -ne 0) {
        $failed += $key
    }
}

if ($failed.Count -gt 0) {
    Write-Error "Falha ao importar: $($failed -join ', ')"
    exit 1
}

Write-Host "Importacao concluida para $EnvFile em $Environment"
