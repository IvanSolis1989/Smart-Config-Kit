#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { buildTask } = require('./lib/local-codex-queue');

function main(env = process.env) {
  const eventPath = env.GITHUB_EVENT_PATH;
  const outputPath = path.resolve(env.TASK_OUTPUT_PATH || 'task.json');
  const output = (values) => {
    if (env.GITHUB_OUTPUT) {
      fs.appendFileSync(env.GITHUB_OUTPUT, `${Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n')}\n`);
    }
  };
  if (!eventPath) throw new TypeError('GITHUB_EVENT_PATH is required');

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const task = buildTask({
    eventName: env.GITHUB_EVENT_NAME,
    event,
    repository: env.GITHUB_REPOSITORY,
    runId: env.GITHUB_RUN_ID,
    runAttempt: env.GITHUB_RUN_ATTEMPT,
    headSha: env.GITHUB_SHA,
    actor: env.GITHUB_ACTOR,
    now: env.TASK_CREATED_AT || new Date(),
  });
  if (!task) {
    fs.rmSync(outputPath, { force: true });
    output({ queued: false, issue_number: '' });
    return null;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(task, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  output({ queued: true, issue_number: task.issueNumber, task_key: task.taskKey, mode: task.mode });
  return task;
}

if (require.main === module) {
  try {
    const task = main();
    process.stdout.write(task ? `Queued local Codex task ${task.taskKey}\n` : 'Event does not create a local Codex task\n');
  } catch {
    process.stderr.write('Local Codex task manifest could not be safely created.\n');
    process.exitCode = 1;
  }
}

module.exports = { main };
