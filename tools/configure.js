#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { validateLocalOptions } = require('./lib/configuration-schema');
const { planLocalTrafficOptions, writeLocalTrafficOptions } = require('./lib/local-traffic-options');

const usage = [
  'Local script: node tools/configure.js --target local.js [--settings settings.json] [--source new.js] [--preserve-local] [--dry-run]',
  'Options: --health-check standard|power-save --quic block-foreign|follow-rules --dns-profile off|policy|adaptive|hosts-only --max-multiplier off|<positive number> --zerotier on|off',
  'Business profile: node tools/configure.js --profile full|lite|custom [--enable ai,youtube] --output-dir <new-directory> [--dry-run]',
  'Offline form: open docs/configuration.html, save settings.json, then use --settings with --target or --output-dir.',
].join('\n');

function plain(value) { return value && Object.getPrototypeOf(value) === Object.prototype; }
function onlyKeys(value, keys, label) {
  if (!plain(value) || Object.keys(value).some(key=>!keys.includes(key))) throw new Error(`Unknown or invalid ${label} fields`);
}

function validateSettings(settings) {
  onlyKeys(settings, ['schema_version','localOptions','business'], 'settings');
  if (settings.schema_version !== 1) throw new Error('Unsupported settings schema_version');
  if (Object.hasOwn(settings,'localOptions') === Object.hasOwn(settings,'business')) throw new Error('Choose exactly one settings mode: localOptions or business');
  if (Object.hasOwn(settings,'localOptions')) validateLocalOptions(settings.localOptions);
  else {
    onlyKeys(settings.business, ['profile','enable'], 'business');
    const {profile,enable} = settings.business;
    if (!['full','lite','custom'].includes(profile)) throw new Error('Invalid business profile');
    if (enable !== undefined && (!Array.isArray(enable) || enable.some(id=>typeof id!=='string' || !/^[a-z][a-z0-9-]*$/.test(id)) || new Set(enable).size!==enable.length)) throw new Error('business.enable must contain unique service ids');
    if (profile !== 'custom' && enable?.length) throw new Error('business.enable is only valid with custom');
    if (profile === 'custom' && !Array.isArray(enable)) throw new Error('custom requires an explicit enable array');
  }
  return settings;
}

function parseArgs(args) {
  const options = { dryRun:false, localOptions:{} };
  const seen = new Set();
  const fields = {'--target':'target','--source':'source','--settings':'settings','--output-dir':'outputDir','--profile':'profile','--enable':'enable','--health-check':'healthCheckProfile','--quic':'quicPolicy','--dns-profile':'subscriptionAdapterProfile','--max-multiplier':'maxNodeMultiplier','--zerotier':'zeroTierPlanetProxy'};
  for(let i=0;i<args.length;i++) {
    const arg=args[i];
    if (seen.has(arg)) throw new Error(`Duplicate argument: ${arg}`);
    seen.add(arg);
    if(arg==='--help' || arg==='-h') { options.help=true; continue; }
    if(arg==='--dry-run') { options.dryRun=true; continue; }
    if(arg==='--preserve-local') { options.preserveLocal=true; continue; }
    const field=fields[arg];
    if(!field || !args[i+1] || args[i+1].startsWith('--')) throw new Error(`Unknown or incomplete argument: ${arg}`);
    const value=args[++i];
    if(['target','source','settings','outputDir','profile'].includes(field)) options[field]=value;
    else if(field==='enable') options.enable=value.split(',');
    else if(field==='maxNodeMultiplier') {
      if(!/^(?:off|null|(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)$/.test(value)) throw new Error('Invalid multiplier');
      options.localOptions[field]=['off','null'].includes(value)?null:Number(value);
    } else if(field==='zeroTierPlanetProxy') {
      if(!['on','off'].includes(value))throw new Error('ZeroTier must be on or off');
      options.localOptions[field]=value==='on';
    } else options.localOptions[field]=value;
  }
  if(Object.keys(options.localOptions).length)validateLocalOptions(options.localOptions);
  if(options.target && (options.profile || options.enable || options.outputDir))throw new Error('Local script and business profile modes cannot be combined');
  if(!options.target && (options.source || options.preserveLocal || Object.keys(options.localOptions).length))throw new Error('Local script options require --target');
  return options;
}

function readRegular(file, extension) {
  const resolved=path.resolve(file);
  const stat=fs.lstatSync(resolved);
  if(!stat.isFile() || stat.isSymbolicLink() || path.extname(resolved).toLowerCase()!==extension) throw new Error(`Expected a regular ${extension} file: ${resolved}`);
  if(stat.size>8*1024*1024)throw new Error(`File exceeds local configuration limit: ${resolved}`);
  return fs.readFileSync(resolved,'utf8');
}

function main(args=process.argv.slice(2)) {
  const options=parseArgs(args);
  if(options.help) { console.log(usage); return; }
  let settings;
  if(options.settings) {
    const text=readRegular(options.settings,'.json');
    if(Buffer.byteLength(text)>64*1024)throw new Error('Settings exceed 64 KiB');
    settings=validateSettings(JSON.parse(text.replace(/^\ufeff/,'')));
    if(Object.keys(options.localOptions).length || options.profile || options.enable)throw new Error('Settings cannot be combined with explicit option values');
  }
  if(options.target) {
    if(settings?.business)throw new Error('Business settings require --output-dir, not --target');
    const requested=settings?.localOptions || options.localOptions;
    if(!Object.keys(requested).length && !options.source)throw new Error('Specify local options, --settings or --source');
    const original=readRegular(options.target,'.js');
    const incoming=options.source?readRegular(options.source,'.js'):original;
    const plan=planLocalTrafficOptions(original,incoming,{...requested,preserveLocal:options.preserveLocal});
    console.log(`Local configuration: ${JSON.stringify(plan.options)}`);
    if(options.dryRun) console.log('Dry run; no target, backup or other file written');
    else {
      const result=writeLocalTrafficOptions(options.target,plan);
      if(result.backup)console.log(`Backup: ${result.backup}`);
      console.log('PASS local script saved and read back');
    }
    return plan;
  }
  if(settings?.localOptions)throw new Error('Local settings require --target');
  const business=settings?.business || {profile:options.profile,enable:options.enable};
  if(!options.outputDir || !business.profile)throw new Error(usage);
  validateSettings({schema_version:1,business});
  const {generateBusinessProfile}=require('./lib/business-profiles');
  const requested={...business,outputDir:path.resolve(options.outputDir),dryRun:options.dryRun};
  if(requested.profile!=='custom')delete requested.enable;
  if(process.platform==='win32') { const os=require('node:os'); try { os.setPriority(0,os.constants.priority.PRIORITY_LOW); } catch {} }
  const result=generateBusinessProfile(requested);
  console.log(JSON.stringify({outputDir:result.outputDir,dryRun:result.dryRun,profile:result.manifest.profile,
    enabledServices:result.manifest.enabled_services,disabledServices:result.manifest.disabled_services,
    files:result.manifest.artifacts.length,entryPoints:result.manifest.artifacts.filter(item=>item.platform!=='copy').map(item=>item.path),
    manifest:result.manifestPath || null},null,2));
  return result;
}

if(require.main===module) {
  try { main(); } catch(error) { console.error(error.message); process.exitCode=1; }
}
module.exports={usage,validateSettings,parseArgs,main};
