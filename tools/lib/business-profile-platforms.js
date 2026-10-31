'use strict';

const { spawnSync } = require('node:child_process');
const { isDeepStrictEqual } = require('node:util');
const { projectMihomoConfig } = require('./business-profiles');
const { projectScript } = require('./business-profile-script');
const { extractOpenClashYaml, renderOpenClashProjection, segmentFor, projectSingBox, projectEgern,
  projectConf, projectKaring, projectXray, projectPasswall } = require('./business-profile-platform-core');
const encode = value => `${JSON.stringify(value, null, 2)}\n`;

function rubyYaml(code, text) {
  const result = spawnSync(process.env.RUBY_BIN || 'ruby', ['-EUTF-8:UTF-8', '-rjson', '-ryaml', '-e', code],
    { input: text, encoding: 'utf8', windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.error || result.status !== 0) throw new Error(`Optional business profiles require Ruby >= 3.0 for structural YAML parsing: ${result.error?.message || result.stderr}`);
  return result.stdout;
}
function parseYaml(text) { return JSON.parse(rubyYaml('print JSON.generate(YAML.safe_load(STDIN.read, aliases: true))', text)); }
function renderYaml(value) {
  const result = rubyYaml('STDOUT.write(JSON.parse(STDIN.read).to_yaml(line_width: -1))', JSON.stringify(value));
  if (!isDeepStrictEqual(parseYaml(result), value)) throw new Error('YAML business profile read-back differs from projected object');
  return result;
}
function projectOpenClash(source, plan) {
  const value = projectMihomoConfig(parseYaml(extractOpenClashYaml(source)), plan);
  return renderOpenClashProjection(source, renderYaml(value), plan);
}
function projectPlatform(source, kind, plan, artifact) {
  if (kind === 'script') return projectScript(source, plan, artifact);
  if (kind === 'openclash') return projectOpenClash(source, plan);
  if (kind === 'mihomo-yaml') return renderYaml(projectMihomoConfig(parseYaml(source), plan));
  if (kind === 'egern') return renderYaml(projectEgern(parseYaml(source), plan));
  if (kind === 'sing-box') return encode(projectSingBox(JSON.parse(source), plan));
  if (kind === 'xray') return encode(projectXray(JSON.parse(source), plan));
  if (kind === 'karing') return encode(projectKaring(JSON.parse(source), plan));
  if (kind === 'conf' || kind === 'quantumult') return projectConf(source, plan, kind === 'quantumult');
  if (kind === 'passwall') return projectPasswall(source, plan);
  throw new Error(`Unsupported business profile platform: ${kind}`);
}
module.exports = { projectPlatform, parseYaml, renderYaml, segmentFor, projectSingBox, projectEgern,
  projectConf, projectScript, projectOpenClash, projectKaring, projectXray, projectPasswall };
