# Actualizar Base "a mano": baja la última versión de GitHub y reemplaza solo el programa.
# Tus datos (tareas, notas, cuentas de Google, ajustes) no se tocan: están en %APPDATA%\Base.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
try { $Host.UI.RawUI.WindowTitle = 'Actualizando Base' } catch {}
function Paso($t) { Write-Host "  > $t" -ForegroundColor Cyan }
$repo = 'https://raw.githubusercontent.com/Redux-7/base-escritorio/main'
$destino = Join-Path $env:LOCALAPPDATA 'Programs\Base'
try { $loc = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Base' -ErrorAction Stop).InstallLocation; if ($loc -and (Test-Path (Join-Path $loc 'Base.exe'))) { $destino = $loc } } catch {}
$exe = Join-Path $destino 'Base.exe'
$app = Join-Path $destino 'resources\app'
$reg = Join-Path $env:APPDATA 'Base\registro.txt'
Write-Host ''
Write-Host '  Base · actualizar a mano' -ForegroundColor White
Write-Host ''
$work = Join-Path $env:TEMP ('base-act-' + [guid]::NewGuid().ToString('N'))
try {
  if (-not (Test-Path $exe) -or -not (Test-Path (Join-Path $app 'package.json'))) { throw "No encuentro Base instalado en $destino. Usá el instalador completo." }
  $antes = (Get-Content (Join-Path $app 'package.json') -Raw | ConvertFrom-Json).version
  Paso "Versión instalada: $antes"
  Paso 'Buscando la última versión'
  $v = Invoke-RestMethod -UseBasicParsing -Uri "$repo/version.json?t=$([DateTimeOffset]::Now.ToUnixTimeSeconds())" -Headers @{ 'Cache-Control' = 'no-cache' }
  if (-not $v.version -or -not $v.file) { throw 'No pude leer cuál es la última versión.' }
  Paso "Última versión: $($v.version)"
  New-Item -ItemType Directory -Path $work | Out-Null
  $zip = Join-Path $work 'base-app.zip'
  Paso 'Descargando'
  Invoke-WebRequest -UseBasicParsing -Uri "$repo/$($v.file)" -OutFile $zip
  if ($v.sha256) { $h = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower(); if ($h -ne ([string]$v.sha256).ToLower()) { throw 'La descarga llegó dañada. Volvé a probar.' } }
  Paso 'Descomprimiendo'
  $nuevo = Join-Path $work 'nuevo'
  Expand-Archive -LiteralPath $zip -DestinationPath $nuevo -Force
  $root = $nuevo
  if (-not (Test-Path (Join-Path $root 'main.js'))) { $sub = Get-ChildItem $nuevo -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'main.js') } | Select-Object -First 1; if (-not $sub) { throw 'El archivo descargado no es de Base.' }; $root = $sub.FullName }
  Paso 'Cerrando Base'
  for ($i = 0; $i -lt 20; $i++) {
    $ps = Get-Process -Name 'Base' -ErrorAction SilentlyContinue | Where-Object { $_.Path -and $_.Path.StartsWith($destino, [StringComparison]::OrdinalIgnoreCase) }
    if (-not $ps) { break }
    $ps | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
  }
  Start-Sleep -Milliseconds 800
  # lo que es de esta instalación queda: la edición y la tipografía
  if (Test-Path (Join-Path $app 'edicion.json')) { Copy-Item (Join-Path $app 'edicion.json') (Join-Path $root 'edicion.json') -Force }
  $f = Join-Path $app 'src\fonts\BricolageGrotesque.ttf'; if (Test-Path $f) { Copy-Item $f (Join-Path $root 'src\fonts\BricolageGrotesque.ttf') -Force }
  Paso 'Reemplazando el programa'
  $viejo = $app + '.anterior'
  Remove-Item $viejo -Recurse -Force -ErrorAction SilentlyContinue
  $ok = $false
  for ($i = 0; $i -lt 20 -and -not $ok; $i++) { try { Move-Item -LiteralPath $app -Destination $viejo -ErrorAction Stop; $ok = $true } catch { Get-Process -Name 'Base' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 600 } }
  if (-not $ok) { throw 'La carpeta de Base está en uso. Reiniciá la compu y volvé a probar.' }
  try { Copy-Item $root $app -Recurse -Force -ErrorAction Stop }
  catch { Remove-Item $app -Recurse -Force -ErrorAction SilentlyContinue; Move-Item -LiteralPath $viejo -Destination $app; throw ('No se pudo copiar la versión nueva: ' + $_.Exception.Message) }
  try { Get-ChildItem $app -Recurse -File | Unblock-File -ErrorAction SilentlyContinue } catch {}
  $pk = Get-Content (Join-Path $app 'package.json') -Raw | ConvertFrom-Json
  Set-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Base' DisplayVersion $pk.version -ErrorAction SilentlyContinue
  try { Add-Content -Encoding UTF8 $reg "[$(Get-Date -Format s)] Actualizado a mano de $antes a $($pk.version)" } catch {}
  Paso "Listo: Base $($pk.version)"
  Start-Process -FilePath $exe -ArgumentList '--actualizado'
  Write-Host ''
  Write-Host '  Base se está abriendo. Podés cerrar esta ventana.' -ForegroundColor Green
  Start-Sleep -Seconds 4
} catch {
  Write-Host ''
  Write-Host ('  No se pudo actualizar: ' + $_.Exception.Message) -ForegroundColor Red
  try { Add-Content -Encoding UTF8 $reg "[$(Get-Date -Format s)] ERROR actualizando a mano: $($_.Exception.Message)" } catch {}
  if ((Test-Path $exe) -and -not (Get-Process -Name 'Base' -ErrorAction SilentlyContinue)) { Start-Process -FilePath $exe }
  Write-Host ''
  Read-Host '  Apretá Enter para cerrar'
} finally {
  Remove-Item $work -Recurse -Force -ErrorAction SilentlyContinue
}
