<# 
  generate_posts.ps1
  Lee /posts/*.html, extrae los metadatos del comentario inicial y genera /data/posts.json
#>

Param(
  # Ruta raíz del proyecto (por defecto, la carpeta padre de /tools)
  [string]$Root = (Split-Path $PSScriptRoot -Parent)
)

# Rutas basadas en la raíz del proyecto
$PostsFolder = Join-Path $Root "posts"
$OutputFile  = Join-Path $Root "data\posts.json"

Write-Host "Raíz del proyecto: $Root"
Write-Host "Carpeta de posts:  $PostsFolder"
Write-Host "Salida JSON:       $OutputFile"

if (-not (Test-Path $PostsFolder)) {
  throw "No se encuentra la carpeta de posts: $PostsFolder"
}

$posts = @()

Get-ChildItem -Path $PostsFolder -Filter "*.html" | ForEach-Object {
  $file = $_
  $content = Get-Content $file.FullName -Raw

  # Buscar el primer bloque de comentario <!-- ... -->
  if ($content -notmatch "<!--(.*?)->") {
    Write-Warning "El archivo '$($file.Name)' no tiene bloque de metadatos <!-- ... -->"
    return
  }

  $metaBlock = ($content -split "-->")[0]
  $metaLines = $metaBlock -split "`n"

  $meta = @{
    title      = ""
    date       = ""
    hotel      = ""
    categories = @()
    tags       = @()
    featured   = $false
    image      = ""
    excerpt    = ""
    slug       = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    url        = "posts/" + $file.Name
  }

  foreach ($line in $metaLines) {
    $clean = $line.Trim("`r","`n"," ","-","#","/","<",">")
    if ($clean -match "^\s*([A-Z]+)\s*:\s*(.+)$") {
      $key = $matches[1].ToUpper()
      $value = $matches[2].Trim()

      switch ($key) {
        "TITLE" {
          $meta.title = $value
        }
        "DATE" {
          $meta.date = $value
        }
        "HOTEL" {
          $meta.hotel = $value
        }
        "CATEGORIES" {
          if ($value) {
            $meta.categories = $value.Split(",") | ForEach-Object { $_.Trim() } | Where-Object {$_}
          }
        }
        "TAGS" {
          if ($value) {
            $meta.tags = $value.Split(",") | ForEach-Object { $_.Trim() } | Where-Object {$_}
          }
        }
        "FEATURED" {
          $meta.featured = $value.ToLower() -eq "true"
        }
        "IMAGE" {
          $meta.image = $value
        }
        "EXCERPT" {
          $meta.excerpt = $value
        }
      }
    }
  }

  if (-not $meta.title)  { Write-Warning "El archivo '$($file.Name)' no tiene TITLE";  return }
  if (-not $meta.date)   { Write-Warning "El archivo '$($file.Name)' no tiene DATE";   return }

  try {
    $meta.dateObj = [datetime]::Parse($meta.date)
  } catch {
    Write-Warning "Fecha no válida en '$($file.Name)': $($meta.date)"
    return
  }

  $posts += $meta
}

# Ordenar de más reciente a más antigua
$posts = $posts | Sort-Object -Property dateObj -Descending

# Limpiar la propiedad auxiliar dateObj
$cleanPosts = $posts | ForEach-Object {
  [PSCustomObject]@{
    title      = $_.title
    date       = $_.date
    hotel      = $_.hotel
    categories = $_.categories
    tags       = $_.tags
    featured   = $_.featured
    image      = $_.image
    excerpt    = $_.excerpt
    slug       = $_.slug
    url        = $_.url
  }
}

# Asegurar carpeta /data
$dir = Split-Path -Parent $OutputFile
if (-not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

$json = $cleanPosts | ConvertTo-Json -Depth 5
Set-Content -Path $OutputFile -Value $json -Encoding UTF8

Write-Host "Generado $OutputFile con $($cleanPosts.Count) posts."
