# Lo corre solo el Programador de tareas de Windows cada 10 min.
# Busca respuestas nuevas sin transcribir y las transcribe local. Escribe un log.
$proj = "C:\dev\slotty\frontend\slotty"
$log  = Join-Path $proj "scripts\transcribir.log"
$node = "C:\Program Files\nodejs\node.exe"
$ts   = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Set-Location $proj
"=== $ts - corriendo ===" | Out-File -LiteralPath $log -Append -Encoding utf8
try {
  & $node "scripts\transcribir-entrevistas.mjs" 2>&1 | Out-File -LiteralPath $log -Append -Encoding utf8
} catch {
  "ERROR: $_" | Out-File -LiteralPath $log -Append -Encoding utf8
}
"" | Out-File -LiteralPath $log -Append -Encoding utf8
