Param([string]$ProjectRoot=".",[string[]]$Sources=@("Noticias/news.json","data/news.json","Noticias/data/news.guadiana.json","news.json"))
$ErrorActionPreference="Stop"
function Parse($p){ if(!(Test-Path $p)){return @()} $txt=Get-Content -Raw -Encoding UTF8 -Path $p
try{ return ($txt|ConvertFrom-Json)}catch{ $objs=@(); $re=[regex]'\{.*?\}'; foreach($m in $re.Matches($txt)){ try{$objs+=$m.Value|ConvertFrom-Json}catch{}}; return ,$objs } }
$all=@(); foreach($s in $Sources){ $all+= (Parse (Join-Path $ProjectRoot $s)) }
$target=(Join-Path $ProjectRoot "news.json"); if(!(Test-Path $target)){"[]"|Set-Content -Path $target -Encoding UTF8}
$curr=Parse $target
$map=@{}; foreach($it in ($curr+$all)){ if($it -is [System.Object]){ $key= if($it.url){$it.url} elseif($it.titulo){$it.titulo}else{$null}; if($key){ $map[$key]=$it } } }
$out=$map.Values | Sort-Object {[datetime]$_.fecha} -Descending
($out|ConvertTo-Json -Depth 6|Out-String).Trim()|Set-Content -Path $target -Encoding UTF8
Write-Host "news.json fusionado y actualizado en $target" -ForegroundColor Green
