# generate_posts.ps1
# Genera data\posts.json a partir de los HTML de /posts

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# --- Rutas base ---
$rootFolder   = Split-Path $PSScriptRoot -Parent
$postsFolder  = Join-Path $rootFolder "posts"
$dataFolder   = Join-Path $rootFolder "data"
$outputFile   = Join-Path $dataFolder "posts.json"

if (-not (Test-Path $postsFolder)) {
    Write-Error "No se encuentra la carpeta de posts: $postsFolder"
    exit 1
}

if (-not (Test-Path $dataFolder)) {
    New-Item -ItemType Directory -Path $dataFolder | Out-Null
}

# Para poder hacer HtmlDecode
Add-Type -AssemblyName System.Web

$posts = @()

Write-Host "Leyendo posts desde: $postsFolder"
Get-ChildItem -Path $postsFolder -Filter "*.html" | ForEach-Object {
    $file = $_
    Write-Host "Procesando $($file.Name)..."

    $content = Get-Content -Path $file.FullName -Raw

    # --- Bloque de metadatos: primer <!-- ... --> del archivo ---
    $metaMatch = [regex]::Match($content, "<!--(.*?)-->", "Singleline")
    if (-not $metaMatch.Success) {
        Write-Warning "El archivo '$($file.Name)' no tiene bloque de metadatos <!-- ... -->"
        return
    }

    $metaBlock = $metaMatch.Groups[1].Value
    $meta = @{}

    foreach ($line in ($metaBlock -split "(`r`n|`n|`r)")) {
        $trim = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trim)) { continue }
        if ($trim -notmatch ":") { continue }

        $parts = $trim.Split(":", 2)
        $key   = $parts[0].Trim().ToLower()
        $value = $parts[1].Trim()

        # Quitar comillas envolventes si las hubiera
        if ($value.StartsWith('"') -and $value.EndsWith('"')) {
            $value = $value.Trim('"')
        }

        $meta[$key] = $value
    }

    if (-not $meta.ContainsKey("title") -or -not $meta.ContainsKey("date")) {
        Write-Warning "El archivo '$($file.Name)' tiene metadatos incompletos (falta 'title' o 'date')."
        return
    }

    # --- Crear objeto post ---
    $slug = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

    # Limpiar HTML para generar un pequeño resumen
    $plain = $content
    $plain = [regex]::Replace($plain, "<script.*?</script>", "", "Singleline, IgnoreCase")
    $plain = [regex]::Replace($plain, "<style.*?</style>", "", "Singleline, IgnoreCase")
    $plain = [regex]::Replace($plain, "<.*?>", " ")
    $plain = [System.Web.HttpUtility]::HtmlDecode($plain)
    $plain = ($plain -replace "\s+", " ").Trim()

    if ($plain.Length -gt 220) {
        $excerpt = $plain.Substring(0, 220) + "…"
    } else {
        $excerpt = $plain
    }

    $post = [ordered]@{
        title   = $meta["title"]
        date    = $meta["date"]
        slug    = $slug
        path    = "posts/$($file.Name)"
        excerpt = $excerpt
    }

    foreach ($k in @("image","hotel","category","tags","featured")) {
        if ($meta.ContainsKey($k)) {
            $post[$k] = $meta[$k]
        }
    }

    $posts += [pscustomobject]$post
}

if ($posts.Count -eq 0) {
    Write-Warning "No se ha procesado ningún post. Revisa los bloques <!-- ... --> de los archivos en '$postsFolder'."
} else {
    # Ordenar por fecha (descendente)
    $postsSorted = $posts | Sort-Object {
        try {
            [datetime]::Parse($_.date)
        } catch {
            Get-Date "1900-01-01"
        }
    } -Descending

    $json = $postsSorted | ConvertTo-Json -Depth 5
    Set-Content -Path $outputFile -Value $json -Encoding UTF8

    Write-Host "Generado $outputFile con $($postsSorted.Count) posts."
}
