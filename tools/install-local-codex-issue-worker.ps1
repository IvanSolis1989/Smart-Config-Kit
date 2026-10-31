[CmdletBinding()]
param(
    [string]$RepositoryPath = (Split-Path -Parent $PSScriptRoot),
    [string]$Repository = 'IvanSolis1989/Smart-Config-Kit',
    [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA 'Smart-Config-Kit\codex-issue-bridge'),
    [switch]$NoStart,
    [switch]$Uninstall
)

$ErrorActionPreference = 'Stop'
$taskName = 'Smart-Config-Kit-Codex-Issue-Worker'
$runKeyPath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$runValueName = 'SmartConfigKitCodexIssueWorker'

function Get-CommandPath([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue | Where-Object { $_.CommandType -eq 'Application' } | Select-Object -First 1
    if ($command) { return $command.Source }
    return $null
}

function Test-BridgeWorkerRunning([string]$StatePath, [string]$ConfigFile) {
    $workerLockPath = Join-Path $StatePath 'worker.lock'
    if (-not (Test-Path -LiteralPath $workerLockPath)) { return $false }
    try {
        $workerLock = Get-Content -LiteralPath $workerLockPath -Raw | ConvertFrom-Json
        $workerProcess = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$workerLock.pid)" -ErrorAction SilentlyContinue
        return [bool]($workerProcess -and $workerProcess.CommandLine -like '*local-codex-issue-worker.js*' -and $workerProcess.CommandLine -like "*--config*$ConfigFile*")
    } catch { return $false }
}

if ($Uninstall) {
    $configPath = Join-Path $InstallRoot 'config.json'
    $lockPath = Join-Path (Join-Path $InstallRoot 'state') 'worker.lock'
    if ((Test-Path $lockPath) -and (Test-Path $configPath)) {
        try {
            $lock = Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json
            $cfg = (Resolve-Path -LiteralPath $configPath).Path
            $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$lock.pid)" -ErrorAction SilentlyContinue
            if ($proc -and $proc.CommandLine -like "*$((Join-Path $InstallRoot 'runtime\local-codex-issue-worker.js'))*" -and $proc.CommandLine -like "*--config*$cfg*") {
                $taskkill = Join-Path $env:SystemRoot 'System32\taskkill.exe'
                Start-Process -FilePath $taskkill -ArgumentList @('/PID',[string]$lock.pid,'/T','/F') -WindowStyle Hidden -Wait | Out-Null
            }
        } catch { Write-Warning 'Could not verify worker lock; no process was stopped.' }
    }
    Stop-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    if (Test-Path $runKeyPath) { Remove-ItemProperty -Path $runKeyPath -Name $runValueName -ErrorAction SilentlyContinue }
    Write-Output 'Removed scheduled task and HKCU startup entry. State and installed files were retained.'
    exit 0
}

$resolvedRepo = (Resolve-Path -LiteralPath $RepositoryPath).Path
$node = Get-CommandPath 'node.exe'
if (-not $node) { $node = Get-CommandPath 'node' }
if (-not $node) { throw 'Node.js executable was not found.' }
$nodeVersion = (& $node --version | Select-Object -First 1).Trim().TrimStart('v')
if ([version]$nodeVersion -lt [version]'22.0') { throw "Node.js >=22 is required; found $nodeVersion." }
$gh = Get-CommandPath 'gh.exe'
if (-not $gh) { $gh = Get-CommandPath 'gh' }
if (-not $gh) { throw 'GitHub CLI (gh) was not found.' }
$null = & $gh auth status 2>&1
if ($LASTEXITCODE -ne 0) { throw 'gh auth status failed. Authenticate GitHub CLI before installing.' }

$codex = Get-Command codex.exe -ErrorAction SilentlyContinue | Where-Object { $_.CommandType -eq 'Application' } | Select-Object -First 1
$codexCommand = $null
$codexArgs = @()
if ($codex) { $codexCommand = $codex.Source }
else {
    $shim = Get-Command codex.ps1,codex.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($shim) {
        $bin = Join-Path (Split-Path -Parent $shim.Source) 'node_modules\@openai\codex\bin\codex.js'
        if (-not (Test-Path -LiteralPath $bin)) { throw "Could not resolve Codex JS entrypoint beside $($shim.Source)." }
        $codexCommand = $node
        $codexArgs = @($bin)
    }
    if (-not $codexCommand) {
        $appProc = Get-Process codex -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*\OpenAI\Codex\bin\*' } | Select-Object -First 1
        if ($appProc) { $codexCommand = $appProc.Path }
    }
}
if (-not $codexCommand) { throw 'Codex executable was not found (codex.exe/codex or npm-installed codex shim).' }

$runtime = Join-Path $InstallRoot 'runtime'
$stateDir = Join-Path $InstallRoot 'state'
$worktreeRoot = Join-Path $InstallRoot 'worktrees'
$logs = Join-Path $stateDir 'logs'
New-Item -ItemType Directory -Force -Path $runtime,$stateDir,$worktreeRoot,$logs | Out-Null
$lockPath = Join-Path $stateDir 'worker.lock'
if (Test-Path $lockPath) {
    try { $lock=Get-Content -LiteralPath $lockPath -Raw | ConvertFrom-Json; $p=Get-CimInstance Win32_Process -Filter "ProcessId=$([int]$lock.pid)" -ErrorAction SilentlyContinue; if($p -and $p.CommandLine -like "*$(Join-Path $runtime 'local-codex-issue-worker.js')*" -and $p.CommandLine -like "*--config*$(Join-Path $InstallRoot 'config.json')*") { throw 'Verified worker is running; stop it before updating runtime.' } } catch { if($_.Exception.Message -like 'Verified worker*'){throw} }
}
$files = @(
    'tools\local-codex-issue-worker.js',
    'tools\lib\local-codex-worker.js',
    'tools\lib\local-codex-app-server.js',
    'tools\lib\local-codex-queue.js'
)
foreach ($relative in $files) {
    $source = Join-Path $resolvedRepo $relative
    if (-not (Test-Path -LiteralPath $source)) { throw "Required runtime source is missing: $source" }
    $destination = Join-Path $runtime (Split-Path -Leaf $relative)
    if ($relative -like '*\lib\*') {
        $libDir = Join-Path $runtime 'lib'
        New-Item -ItemType Directory -Force -Path $libDir | Out-Null
        $destination = Join-Path $libDir (Split-Path -Leaf $relative)
    }
    Copy-Item -LiteralPath $source -Destination $destination -Force
}
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'run-local-codex-issue-worker.ps1') -Destination (Join-Path $runtime 'run-local-codex-issue-worker.ps1') -Force
$configPath = Join-Path $InstallRoot 'config.json'
$enabledAfter = (Get-Date).ToUniversalTime().ToString('o')
if (Test-Path -LiteralPath $configPath) {
    $oldConfig = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
    if ($oldConfig.enabledAfter) { $enabledAfter = [string]$oldConfig.enabledAfter }
}
$config = [ordered]@{
    schemaVersion = 1; repository = $Repository; repositoryPath = $resolvedRepo
    stateDir = $stateDir; worktreeRoot = $worktreeRoot; codexCommand = $codexCommand; codexArgs = $codexArgs
    pollSeconds = 60; timeoutMs = 2700000; enabledAfter = $enabledAfter
    publish = $true
}
$config | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $configPath -Encoding UTF8
$runScript = Join-Path $runtime 'run-local-codex-issue-worker.ps1'
# Use the stable Windows host for logon tasks, independent of app-bundled pwsh updates.
$shell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$action = New-ScheduledTaskAction -Execute $shell -WorkingDirectory $runtime -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$runScript`" -ConfigPath `"$configPath`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited
$receipt = [ordered]@{ taskName=$taskName; fallback='HKCU Run'; installedAt=(Get-Date).ToString('o'); startMode=$(if($NoStart){'NoStart'}else{'ScheduledTask'}); taskRegistration='pending' }
try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null
    Remove-ItemProperty -Path $runKeyPath -Name $runValueName -ErrorAction SilentlyContinue
    $receipt.taskRegistration = 'registered'
} catch {
    $escaped = '"' + $shell + '" -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File "' + $runScript + '" -ConfigPath "' + $configPath + '"'
    New-Item -Path $runKeyPath -Force | Out-Null
    Set-ItemProperty -Path $runKeyPath -Name $runValueName -Value $escaped
    $receipt.taskRegistration = 'fallback-HKCU-Run'
    $receipt.registrationError = $_.Exception.Message
}
if (-not $NoStart) {
    if ($receipt.taskRegistration -eq 'registered') {
        Start-ScheduledTask -TaskName $taskName
        for ($attempt = 0; $attempt -lt 5; $attempt++) {
            if (Test-BridgeWorkerRunning $stateDir $configPath) { break }
            Start-Sleep -Seconds 1
        }
        if (-not (Test-BridgeWorkerRunning $stateDir $configPath)) {
            $receipt.startFailure = (Get-ScheduledTaskInfo -TaskName $taskName).LastTaskResult
            Disable-ScheduledTask -TaskName $taskName | Out-Null
            $receipt.taskRegistration = 'fallback-HKCU-Run'
            $escaped = '"' + $shell + '" ' + $action.Arguments
            New-Item -Path $runKeyPath -Force | Out-Null
            Set-ItemProperty -Path $runKeyPath -Name $runValueName -Value $escaped
        }
    }
    if ($receipt.taskRegistration -eq 'fallback-HKCU-Run') {
        $receipt.startMode = 'HKCU Run'
        Start-Process -FilePath $shell -ArgumentList $action.Arguments -WorkingDirectory $runtime -WindowStyle Hidden | Out-Null
        for ($attempt = 0; $attempt -lt 5; $attempt++) {
            if (Test-BridgeWorkerRunning $stateDir $configPath) { break }
            Start-Sleep -Seconds 1
        }
    }
    $receipt.workerStarted = Test-BridgeWorkerRunning $stateDir $configPath
}
$sourceHead = & git -C $resolvedRepo rev-parse HEAD
$sourceStatus = & git -C $resolvedRepo status --porcelain
$receipt.sourceCommit = [string]$sourceHead
$receipt.sourceWorkingTreeModified = [bool]$sourceStatus
$receipt.runtimeHashes = [ordered]@{}
Get-ChildItem -LiteralPath $runtime -File -Recurse | ForEach-Object {
    $relativeRuntimePath = $_.FullName.Substring($runtime.Length + 1)
    $receipt.runtimeHashes[$relativeRuntimePath] = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
}
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $InstallRoot 'install-receipt.json') -Encoding UTF8
Write-Output "Installed runtime at $runtime; configuration at $configPath; mode=$($receipt.startMode); registration=$($receipt.taskRegistration)."
if (-not $NoStart -and -not $receipt.workerStarted) { throw 'Worker did not start; inspect the installation receipt and state/logs.' }
