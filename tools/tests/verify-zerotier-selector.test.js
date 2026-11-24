'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const graph = require('../../rulesets/source/routing-graph');

test('read-only device verifier uses the actual selector, not a reset remote constant', { skip: process.platform !== 'win32' }, t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scki-selector-report-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const legacy = graph.getZeroTierPlanetProxyPolicy();
  const device = graph.getClashPartyZeroTierPlanetProxyPolicy();
  const rows = target => ['103.195.103.66', '79.127.159.187', '84.17.53.155', '185.152.67.145'].map(ip => ({
    type: 'AND', payload: `((Network,udp) && (DstPort,9993) && (IPCIDR,${ip}/32))`, proxy: target,
  }));
  const nativeScript = 'const SCKI_ZEROTIER_PLANET_PROXY = false\nSckiClashPartyZeroTier.apply(config, SCKI_ZEROTIER_PLANET_PROXY)';
  const proxies = now => ({ [device.groupName]: { type: 'Selector', now } });
  const cases = [
    { rules: rows(device.groupName), proxies: proxies(legacy.targetGroup), source: nativeScript },
    { rules: rows(device.groupName), proxies: proxies('PASS'), source: nativeScript },
    { rules: rows(legacy.targetGroup), proxies: proxies(legacy.targetGroup), source: nativeScript },
    { rules: rows(legacy.targetGroup), proxies: {}, source: 'const SCKI_ZEROTIER_PLANET_PROXY = true' },
    { rules: rows(legacy.targetGroup), proxies: {}, source: 'const SCKI_ZEROTIER_PLANET_PROXY = false' },
    { rules: ['chrome.exe', 'msedge.exe', 'firefox.exe'].map(name => ({ type: 'AND', payload: `((Network,udp) && (ProcessName,${name}))`, proxy: 'REJECT' })).concat(rows(device.groupName)), proxies: proxies(legacy.targetGroup), source: nativeScript },
    { rules: rows(device.groupName), proxies: {}, source: nativeScript },
  ];
  fs.writeFileSync(path.join(directory, 'input.json'), JSON.stringify({ cases, legacy, device }));
  fs.writeFileSync(path.join(directory, 'run.ps1'), `param($SourcePath, $InputPath)
$ErrorActionPreference = 'Stop'
$tokens = $null; $parseErrors = $null
$tree = [Management.Automation.Language.Parser]::ParseFile($SourcePath, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw 'Verifier parse failed' }
$function = $tree.Find({param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Get-PlanetRuleState'}, $true)
if (-not $function) { throw 'Verification function missing' }
. ([scriptblock]::Create($function.Extent.Text))
$data = Get-Content -LiteralPath $InputPath -Raw | ConvertFrom-Json
$results = @($data.cases | ForEach-Object { Get-PlanetRuleState $_.rules $_.proxies $_.source $data.legacy $data.device })
ConvertTo-Json -InputObject $results -Compress
`);
  // Execute only the pure function AST, never the credential/API/process reads.
  const output = execFileSync('pwsh', ['-NoProfile', '-NonInteractive', '-File', path.join(directory, 'run.ps1'), path.resolve(__dirname, '../verify-zerotier-planet.ps1'), path.join(directory, 'input.json')], { encoding: 'utf8', windowsHide: true });
  assert.deepEqual(JSON.parse(output).map(row => [row.RulesFirst, row.Enabled, row.DeviceSelector]), [
    [true, true, true], [true, false, true], [false, true, true], [true, true, false],
    [true, false, false], [true, true, true], [true, false, true],
  ]);
});
