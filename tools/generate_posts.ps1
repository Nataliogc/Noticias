<#
  generate_posts.ps1
  Lee los HTML de /posts, extrae metadatos del primer bloque <!-- ... -->
  y genera:
    - data/posts.json   (UTF-8)
    - data/posts.js     (UTF-8, window.POSTS / window.POSTS_DATA)

  Requisitos mínimos de metadatos por post:
    TITLE: Título visible
    DATE:  YYYY-MM-DD

  Metadatos opcionales:
    HOTEL: Guadiana, Cumbria, etc. (cadena)
    CATEGORIES: cat1,cat2,...
    TAGS: tag1,tag2,...
    FEATURED: true/false
    IMAGE: ruta/relativa.png
    EXCERPT: Extracto manual que se usará en las tarjetas
#>

# =========================
#  RUTAS BÁSICAS
# =========================

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir   = Split-Path -Parent $scriptDir

$postsDir  = Join-Path $rootDir "posts"
$dataDir   = Join-Path $rootDir "data"

if (-not (Test-Path $dataDir)) {
    New-Item -Path $dataDir -ItemType Directory | Out-Null
}

$jsonPath  = Join-Path $dataDir "posts.json"
$jsPath    = Join-Path $dataDir "posts.js"

Write-Host "Leyendo posts desde: $postsDir"
Write-Host ""

# =========================
#  FUNCIONES AUXILIARES
# =========================

function Parse-MetadataBlock {
    param(
        [string]$content
    )

    # Opciones de regex: Singleline + IgnoreCase
    $opts = [System.Text.RegularExpressions.RegexOptions]::Singleline `
          -bor [System.Text.RegularExpressions.RegexOptions]::IgnoreCase

    # Busca el primer bloque <!-- ... -->
    $m = [regex]::Match($content, "<!--(.*?)-->", $opts)
    if (-not $m.Success) {
        return $null
    }

    $block = $m.Groups[1].Value

    $meta = @{}

    foreach ($line in ($block -split "`n")) {
        $clean = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($clean)) { continue }

        # Espera líneas tipo KEY: value
        $parts = $clean -split ":", 2
        if ($parts.Count -lt 2) { continue }

        $key = $parts[0].Trim().ToUpperInvariant()
        $val = $parts[1].Trim()

        if (-not [string]::IsNullOrWhiteSpace($key)) {
            $meta[$key] = $val
        }
    }

    return $meta
}

function Get-Excerpt {
    param(
        [hashtable]$meta,
        [string]$content
    )

    # 1) Si hay EXCERPT en metadatos, usarlo siempre
    if ($meta.ContainsKey("EXCERPT") -and -not [string]::IsNullOrWhiteSpace($meta["EXCERPT"])) {
        return $meta["EXCERPT"].Trim()
    }

    # 2) Si no, generar extracto automático seguro
    #    Elimina comentarios, estilos, scripts, iframes y etiquetas HTML
    $clean = $content `
        -replace "(?is)<!--.*?-->", "" `
        -replace "(?is)<style.*?</style>", "" `
        -replace "(?is)<script.*?</script>", "" `
        -replace "(?is)<iframe.*?</iframe>", "" `
        -replace "<[^>]+>", ""

    $clean = $clean.Trim()

    if ($clean.Length -le 0) {
        return ""
    }

    $maxLen = 180
    if ($clean.Length -gt $maxLen) {
        return $clean.Substring(0, $maxLen) + "…"
    }

    return $clean
}

function To-StringArray {
    param(
        [string]$raw
    )

    if ([string]::IsNullOrWhiteSpace($raw)) {
        return @()
    }

    return ($raw -split ",") |
        ForEach-Object { $_.Trim() } |
        Where-Object { -not [string]::IsNullOrWhiteSpace($_) }
}

function To-Bool {
    param(
        [string]$raw
    )

    if ([string]::IsNullOrWhiteSpace($raw)) {
        return $false
    }

    switch ($raw.Trim().ToLowerInvariant()) {
        "true"  { return $true }
        "1"     { return $true }
        "yes"   { return $true }
        "si"    { return $true }
        default { return $false }
    }
}

# =========================
#  PROCESAR POSTS
# =========================

$posts = @()

if (-not (Test-Path $postsDir)) {
    Write-Host "ERROR: No se encuentra la carpeta de posts: $postsDir" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $postsDir -Filter "*.html" | Sort-Object Name

foreach ($file in $files) {
    Write-Host "Procesando $($file.Name)..."

    # Leer contenido en UTF-8
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8

    # Metadatos
    $meta = Parse-MetadataBlock -content $content

    if ($null -eq $meta) {
        Write-Warning "ADVERTENCIA: El archivo '$($file.Name)' no tiene bloque de metadatos <!-- ... -->."
        continue
    }

    # Validar TITLE y DATE
    if (-not $meta.ContainsKey("TITLE") -or -not $meta.ContainsKey("DATE") -or
        [string]::IsNullOrWhiteSpace($meta["TITLE"]) -or [string]::IsNullOrWhiteSpace($meta["DATE"])) {

        Write-Warning "ADVERTENCIA: El archivo '$($file.Name)' tiene metadatos incompletos (falta 'TITLE' o 'DATE')."
        continue
    }

    $title = $meta["TITLE"].Trim()
    $date  = $meta["DATE"].Trim()

    # Resto de metadatos opcionales
    $hotel      = $meta["HOTEL"]
    $categories = To-StringArray -raw $meta["CATEGORIES"]
    $tags       = To-StringArray -raw $meta["TAGS"]
    $featured   = To-Bool       -raw $meta["FEATURED"]
    $image      = $meta["IMAGE"]

    # Slug = nombre de archivo
    $slug = $file.Name

    # Generar excerpt (Get-Excerpt se encarga de limpiar comentarios/HTML)
    $excerpt = Get-Excerpt -meta $meta -content $content

    # Crear objeto de salida
   $postObj = [PSCustomObject]@{
    title      = $title
    date       = $date
    hotel      = $hotel
    categories = $categories
    tags       = $tags
    featured   = $featured
    image      = $image
    slug       = $slug
    url        = "posts/$slug"   # 👈 ruta al HTML de la noticia
    excerpt    = $excerpt
}


    $posts += $postObj
}

# Ordenar posts por fecha descendente (si se puede interpretar la fecha)
$posts = $posts | Sort-Object {
    try {
        [datetime]::Parse($_.date)
    }
    catch {
        Get-Date "1900-01-01"
    }
} -Descending

# =========================
#  GENERAR JSON (UTF-8)
# =========================

$json = $posts | ConvertTo-Json -Depth 10

Set-Content -Path $jsonPath -Value $json -Encoding utf8

# =========================
#  GENERAR posts.js (UTF-8)
# =========================

# Exportamos dos nombres por compatibilidad:
#  - window.POSTS
#  - window.POSTS_DATA
$jsContent  = "window.POSTS = " + $json + ";" + [Environment]::NewLine
$jsContent += "window.POSTS_DATA = window.POSTS;" + [Environment]::NewLine

Set-Content -Path $jsPath -Value $jsContent -Encoding utf8

Write-Host ""
Write-Host "Generado $jsonPath y $jsPath con $($posts.Count) posts."
Write-Host ""
Write-Host "-----------------------------------------"
Write-Host " Proceso terminado. Revisa data\posts"
Write-Host "-----------------------------------------"
