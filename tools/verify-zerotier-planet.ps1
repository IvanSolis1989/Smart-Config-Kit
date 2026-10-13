<#
.SYNOPSIS
Read-only verification of a locally enabled ZeroTier Planet UDP proxy.
.DESCRIPTION
Checks actual owned UDP return growth, ZeroTier ONLINE, fixed Smart selection,
rule order and protected runtime state. Makes no controller mutations and never
closes connections. HTTP/TCP health-check latency is not UDP evidence.
#>
[CmdletBinding()]
param(
    [string]$PipeName,
    [Parameter(Mandatory)][string]$OverridePath,
    [ValidateRange(0, 60)][int]$Seconds = 20,
    [string]$ReportPath,
    [string]$PeerAddress,
    [string]$SourceAddress,
    [int]$InterfaceIndex = 0,
    [ValidateRange(1, 15)][int]$TcpTimeoutSeconds = 8,
    [switch]$RequireFixed
)
$ErrorActionPreference = 'Stop'
$overrideFile = (Get-Item -LiteralPath $OverridePath).FullName
$protectedFiles = @((Join-Path $env:APPDATA 'mihomo-party\work\config.yaml'), (Join-Path $env:APPDATA 'mihomo-party\mihomo.yaml'), 'C:\ProgramData\ZeroTier\One\local.conf', 'C:\ProgramData\ZeroTier\One\identity.public', 'C:\ProgramData\ZeroTier\One\identity.secret')
if ($ReportPath) {
    $absoluteReport = [IO.Path]::GetFullPath($ReportPath)
    if ([IO.Path]::GetExtension($absoluteReport) -ine '.json' -or $absoluteReport -in @($overrideFile) + $protectedFiles) { throw 'Report must be a separate JSON file.' }
    if (Test-Path -LiteralPath $absoluteReport) { throw 'Report already exists; select a new report path.' }
}
if (-not $PipeName) {
    $pipes = @(Get-ChildItem -LiteralPath '\\.\pipe\' | Where-Object Name -match 'mihomo-admin' | Select-Object -ExpandProperty Name)
    if ($pipes.Count -ne 1) { throw 'Specify a unique Mihomo admin pipe.' }
    $PipeName = $pipes[0]
}
if (-not ('SckiPipeIdentity' -as [type])) {
    Add-Type -TypeDefinition 'using System.Runtime.InteropServices; using Microsoft.Win32.SafeHandles; public static class SckiPipeIdentity { [DllImport("kernel32.dll",SetLastError=true)] public static extern bool GetNamedPipeServerProcessId(SafePipeHandle pipe,out uint pid); }'
}
$graphFile = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\rulesets\source\routing-graph.js'))
$policyText = & node -e 'process.stdout.write(JSON.stringify(require(process.argv[1]).getZeroTierPlanetProxyPolicy()))' $graphFile
if ($LASTEXITCODE -ne 0) { throw 'Cannot read authoritative Planet policy.' }
$policy = $policyText | ConvertFrom-Json
$rootIps = @($policy.rules | ForEach-Object {
    if ($_ -notmatch 'IP-CIDR,([0-9.]+)/32,no-resolve') { throw 'Unexpected authoritative rule format.' }
    $Matches[1]
})
$script:coreProcessId = 0
$script:coreStarted = $null
$authPath = Join-Path $env:LOCALAPPDATA 'ZeroTier\authtoken.secret'
$ztHeaders = @{'X-ZT1-Auth' = [IO.File]::ReadAllText($authPath).Trim()}

function Read-Core([string]$ApiPath) {
    if ($ApiPath -notin @('/configs', '/rules', '/proxies', '/connections')) { throw 'Read-only API allowlist rejected path.' }
    $pipe = [IO.Pipes.NamedPipeClientStream]::new('.', $PipeName, [IO.Pipes.PipeDirection]::InOut, [IO.Pipes.PipeOptions]::Asynchronous)
    $memory = [IO.MemoryStream]::new()
    try {
        $pipe.Connect(1500)
        [uint32]$serverProcessId = 0
        if (-not [SckiPipeIdentity]::GetNamedPipeServerProcessId($pipe.SafePipeHandle, [ref]$serverProcessId)) { throw 'Cannot verify API server identity.' }
        $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId=$serverProcessId"
        if (-not $processInfo -or $processInfo.Name -notmatch '^mihomo(?:-smart)?\.exe$') { throw 'Unexpected API server process.' }
        if ($script:coreProcessId -and ($script:coreProcessId -ne $serverProcessId -or $script:coreStarted -ne $processInfo.CreationDate.ToString('o'))) { throw 'Core restarted during verification.' }
        $script:coreProcessId = [int]$serverProcessId
        $script:coreStarted = $processInfo.CreationDate.ToString('o')
        $bytes = [Text.Encoding]::ASCII.GetBytes("GET $ApiPath HTTP/1.0`r`nHost: localhost`r`nConnection: close`r`n`r`n")
        $watch = [Diagnostics.Stopwatch]::StartNew()
        $write = $pipe.WriteAsync($bytes, 0, $bytes.Length)
        if (-not $write.Wait(3000)) { throw 'API write timed out.' }
        [void]$write.GetAwaiter().GetResult()
        $buffer = [byte[]]::new(8192)
        while ($memory.Length -lt 8388608) {
            $remaining = [int][Math]::Max(1, 12000 - $watch.ElapsedMilliseconds)
            $read = $pipe.ReadAsync($buffer, 0, $buffer.Length)
            if (-not $read.Wait($remaining)) { throw 'API read timed out.' }
            $count = $read.GetAwaiter().GetResult()
            if ($count -eq 0) { break }
            $memory.Write($buffer, 0, $count)
            if ($watch.ElapsedMilliseconds -ge 12000) { throw 'API deadline exceeded.' }
        }
        if ($memory.Length -ge 8388608) { throw 'API response too large.' }
        $response = [Text.UTF8Encoding]::new($false, $true).GetString($memory.ToArray())
        $boundary = $response.IndexOf("`r`n`r`n")
        if ($boundary -lt 0 -or $response -notmatch '\AHTTP/1\.[01] 200(?: |\r)') { throw 'API read failed; response body withheld.' }
        return $response.Substring($boundary + 4) | ConvertFrom-Json
    } finally { $pipe.Dispose(); $memory.Dispose() }
}

function Read-ZeroTier([string]$ApiPath) {
    try { Invoke-RestMethod -Uri ('http://127.0.0.1:9993' + $ApiPath) -Headers $ztHeaders -TimeoutSec 5 }
    catch { throw 'ZeroTier local API read failed; credentials and response withheld.' }
}

function Read-Hash([string]$File) {
    if (-not (Test-Path -LiteralPath $File)) { return $null }
    $item = Get-Item -LiteralPath $File
    try { return [ordered]@{Hash=(Get-FileHash -LiteralPath $File -Algorithm SHA256).Hash; Length=$item.Length; LastWriteUtc=$item.LastWriteTimeUtc.ToString('o')} }
    catch [System.UnauthorizedAccessException] { return [ordered]@{Hash=$null; HashAvailable=$false; Length=$item.Length; LastWriteUtc=$item.LastWriteTimeUtc.ToString('o')} }
}

function Read-Snapshot {
    $service = Get-CimInstance Win32_Service -Filter "Name='ZeroTierOneService'"
    if (-not $service -or $service.State -ne 'Running') { throw 'ZeroTier service is not running.' }
    $zt = Read-ZeroTier '/status'
    $peers = Read-ZeroTier '/peer'
    $networks = Read-ZeroTier '/network'
    $config = Read-Core '/configs'
    $rules = @( (Read-Core '/rules').rules )
    $proxyMap = (Read-Core '/proxies').proxies
    $group = $proxyMap.PSObject.Properties[$policy.targetGroup].Value
    $endpoints = @(Get-NetUDPEndpoint)
    $allFlows = @( (Read-Core '/connections').connections )
    $ownedFlows = @($allFlows | Where-Object {
        $flow = $_
        if ($flow.metadata.network -ne 'udp' -or $flow.metadata.destinationIP -notin $rootIps -or [string]$flow.metadata.destinationPort -ne '9993') { return $false }
        $processMatches = [string]$flow.metadata.process -match '(^|[\\/])zerotier-one(?:_x64)?(?:\.exe)?$'
        $wildcard = if ([string]$flow.metadata.sourceIP -match ':') { '::' } else { '0.0.0.0' }
        $owners = @($endpoints | Where-Object {
            $_.LocalAddress -in @($flow.metadata.sourceIP, $wildcard) -and [string]$_.LocalPort -eq [string]$flow.metadata.sourcePort
        } | Select-Object -ExpandProperty OwningProcess -Unique)
        $endpointMatches = $owners.Count -eq 1 -and $owners[0] -eq $service.ProcessId
        $endpointMatches -and ([string]::IsNullOrEmpty($flow.metadata.process) -or $processMatches)
    } | ForEach-Object {
        [ordered]@{Id=$_.id; DestinationIP=$_.metadata.destinationIP; SourceIP=$_.metadata.sourceIP; SourcePort=$_.metadata.sourcePort; Process=$_.metadata.process; Rule=$_.rule; Chains=@($_.chains); Upload=$_.upload; Download=$_.download}
    })
    $prefixMatches = $rules.Count -ge $rootIps.Count
    for ($i = 0; $i -lt $rootIps.Count -and $prefixMatches; $i++) {
        $expected = '((Network,udp) && (DstPort,9993) && (IPCIDR,' + $rootIps[$i] + '/32))'
        $prefixMatches = $rules[$i].type -eq 'AND' -and $rules[$i].payload -ceq $expected -and $rules[$i].proxy -ceq $policy.targetGroup
    }
    $overrideText = [IO.File]::ReadAllText($overrideFile)
    $flags = [regex]::Matches($overrideText, '(?m)^const SCKI_ZEROTIER_PLANET_PROXY = (true|false);?\r?$')
    $selectors = @($proxyMap.PSObject.Properties | Where-Object {$_.Value.type -eq 'Selector'} | Sort-Object Name | ForEach-Object { [ordered]@{Name=$_.Name; Now=$_.Value.now} })
    $fixed = @($proxyMap.PSObject.Properties | Where-Object { $_.Name -ne $policy.targetGroup -and -not [string]::IsNullOrEmpty($_.Value.fixed) } | Sort-Object Name | ForEach-Object { [ordered]@{Name=$_.Name; Fixed=$_.Value.fixed} })
    $protected = [ordered]@{}
    foreach ($file in $protectedFiles) { $protected[$file] = Read-Hash $file }
    [ordered]@{
        At=(Get-Date).ToString('o'); CorePid=$script:coreProcessId; CoreStarted=$script:coreStarted; ZeroTierPid=$service.ProcessId
        Node=$zt.address; Online=[bool]$zt.online; Networks=@($networks | ForEach-Object {[ordered]@{Id=$_.nwid; Status=$_.status; Addresses=@($_.assignedAddresses)}})
        Planet=@($peers | Where-Object role -eq 'PLANET' | ForEach-Object {[ordered]@{Address=$_.address; ActivePaths=@($_.paths | Where-Object active).Count}})
        RuleCount=$rules.Count; PlanetRulesFirst=$prefixMatches; Tun=$config.tun
        Selectors=$selectors; OtherFixed=$fixed; USFixed=$group.fixed; USNow=$group.now; USMembers=@($group.all)
        OverrideEnabled=($flags.Count -eq 1 -and $flags[0].Groups[1].Value -eq 'true'); OverrideHash=(Read-Hash $overrideFile)
        ProtectedHashes=$protected; OwnedFlows=$ownedFlows
    }
}

function Test-PeerTcp {
    if (-not $PeerAddress) { return @() }
    $rows = @()
    foreach ($port in @(22, 3389)) {
        foreach ($bound in @($false, $true)) {
            if ($bound -and (-not $SourceAddress -or $InterfaceIndex -le 0)) { continue }
            $socket = [Net.Sockets.Socket]::new([Net.Sockets.AddressFamily]::InterNetwork, [Net.Sockets.SocketType]::Stream, [Net.Sockets.ProtocolType]::Tcp)
            $row = [ordered]@{Port=$port; Bound=$bound; Connected=$false; InterfaceReadback=$null}
            try {
                if ($bound) {
                    $socket.Bind([Net.IPEndPoint]::new([Net.IPAddress]::Parse($SourceAddress), 0))
                    $socket.SetSocketOption([Net.Sockets.SocketOptionLevel]::IP, [Net.Sockets.SocketOptionName]31, [Net.IPAddress]::HostToNetworkOrder($InterfaceIndex))
                    $row.InterfaceReadback = [int]$socket.GetSocketOption([Net.Sockets.SocketOptionLevel]::IP, [Net.Sockets.SocketOptionName]31)
                }
                $task = $socket.ConnectAsync([Net.IPAddress]::Parse($PeerAddress), $port)
                if ($task.Wait($TcpTimeoutSeconds * 1000)) { [void]$task.GetAwaiter().GetResult(); $row.Connected=$socket.Connected }
            } catch { $row.Connected=$false } finally { $socket.Dispose() }
            $rows += $row
        }
    }
    $rows
}

$before = Read-Snapshot
$returned = @{}
$last = $before
$onlineThroughout = [bool]$before.Online
$timer = [Diagnostics.Stopwatch]::StartNew()
while ($timer.Elapsed.TotalSeconds -lt $Seconds) {
    Start-Sleep -Milliseconds ([int][Math]::Min(5000, [Math]::Max(1, 1000 * ($Seconds - $timer.Elapsed.TotalSeconds))))
    $last = Read-Snapshot
    $onlineThroughout = $onlineThroughout -and $last.Online
    foreach ($flow in $last.OwnedFlows) {
        $old = @($before.OwnedFlows | Where-Object Id -eq $flow.Id)
        $priorDownload = if ($old.Count -eq 1) { $old[0].Download } else { 0 }
        if ($flow.Rule -eq 'AND' -and $policy.targetGroup -in $flow.Chains -and $last.USNow -in $flow.Chains -and 'DIRECT' -notin $flow.Chains -and $flow.Download -gt $priorDownload) { $returned[$flow.Id] = $flow }
    }
}
$unchanged = ($before.ZeroTierPid -eq $last.ZeroTierPid -and $before.Node -ceq $last.Node)
foreach ($key in @('Tun','Selectors','OtherFixed','ProtectedHashes','Networks','OverrideHash')) {
    $unchanged = $unchanged -and (($before[$key] | ConvertTo-Json -Depth 10 -Compress) -ceq ($last[$key] | ConvertTo-Json -Depth 10 -Compress))
}
$fixedPreserved = $before.USFixed -ceq $last.USFixed -and $before.USNow -ceq $last.USNow
$transportVerified = $Seconds -gt 0 -and $onlineThroughout -and $returned.Count -gt 0 -and $last.PlanetRulesFirst -and $last.OverrideEnabled -and $last.Tun.enable -and $unchanged -and $fixedPreserved
if ($RequireFixed -and ([string]::IsNullOrEmpty($last.USFixed) -or $last.USFixed -cne $last.USNow)) { $transportVerified=$false }
$result = [ordered]@{
    At=(Get-Date).ToString('o'); ReadOnly=$true; SampleSeconds=$Seconds; TransportVerified=$transportVerified
    EvidenceStatus=$(if ($Seconds -eq 0) {'snapshot-only'} elseif ($transportVerified) {'verified-in-window'} else {'not-confirmed-in-window'})
    UDPDownloadGrowthFlows=@($returned.Values); OnlineThroughout=$onlineThroughout; ProtectedStateUnchanged=$unchanged; USSelectionPreserved=$fixedPreserved
    Before=$before; After=$last; TCP=@(Test-PeerTcp)
    Scope='No API mutations, connection cleanup, service restart, routes, firewall or ZeroTier settings changed.'
}
if ($ReportPath) {
    [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($absoluteReport)) | Out-Null
    $reportBytes = [Text.UTF8Encoding]::new($false).GetBytes(($result | ConvertTo-Json -Depth 15))
    $reportStream = [IO.File]::Open($absoluteReport, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::Read)
    try { $reportStream.Write($reportBytes, 0, $reportBytes.Length) } finally { $reportStream.Dispose() }
}
[ordered]@{TransportVerified=$transportVerified; Online=$last.Online; RuleCount=$last.RuleCount; PlanetRulesFirst=$last.PlanetRulesFirst; USFixed=$last.USFixed; USNow=$last.USNow; UDPDownloadGrowthFlowCount=$returned.Count; ProtectedStateUnchanged=$unchanged; SelectorCount=@($last.Selectors).Count; TCP=$result.TCP; ReportPath=$ReportPath} | ConvertTo-Json -Depth 5
$ztHeaders=$null
if ($Seconds -gt 0 -and -not $transportVerified) { exit 1 }
