[CmdletBinding()]
param([Parameter(Mandatory=$true)][string]$ConfigPath)

$ErrorActionPreference = 'Stop'
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$runtime = Join-Path (Split-Path -Parent $ConfigPath) 'runtime'
$entry = Join-Path $runtime 'local-codex-issue-worker.js'
if (-not (Test-Path -LiteralPath $entry)) { throw "Worker entrypoint missing: $entry" }
$nodeCommand = Get-Command node.exe,node -ErrorAction SilentlyContinue | Where-Object { $_.CommandType -eq 'Application' } | Select-Object -First 1
if (-not $nodeCommand) { throw 'Node.js executable was not found.' }
$node = $nodeCommand.Source
$stateDir = [string]$config.stateDir
$logs = Join-Path $stateDir 'logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$stdout = Join-Path $logs "worker-$stamp.out.log"
$stderr = Join-Path $logs "worker-$stamp.err.log"
$arguments = @('"' + $entry + '"','--config','"' + (Resolve-Path -LiteralPath $ConfigPath).Path + '"')
$process = Start-Process -FilePath $node -ArgumentList $arguments -WorkingDirectory ([string]$config.repositoryPath) -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdout -RedirectStandardError $stderr
$process.WaitForExit()
exit $process.ExitCode
