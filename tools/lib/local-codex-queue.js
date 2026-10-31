'use strict';

const ISSUE_CATEGORIES = new Set(['question', 'faq', 'help wanted', 'bug', 'enhancement', 'documentation']);
const TRUSTED_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR']);
const TASK_KEYS = /^issue-(\d+)-(opened|reopened-\d+|labeled-\d+|comment-\d+|manual-\d+)$/;
const REPOSITORY = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9_.-]{1,100}$/;
const LOGIN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const SHA = /^[a-f0-9]{40}$/i;

function isBot(login) {
  return typeof login !== 'string' || login.endsWith('[bot]');
}

function parsePositiveInteger(value, name) {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new TypeError(`${name} must be a positive safe integer`);
  return number;
}

function parseTimestamp(value, name) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError(`${name} must be a valid timestamp`);
  return date;
}

function validateTask(task, { repository, runId, headSha } = {}) {
  if (!task || typeof task !== 'object' || Array.isArray(task)) throw new TypeError('task must be an object');
  const exactKeys = ['schemaVersion', 'repository', 'issueNumber', 'issueUrl', 'taskKey', 'mode', 'createdAt', 'actor', 'source'];
  if (Object.keys(task).some((key) => !exactKeys.includes(key)) || exactKeys.some((key) => !(key in task))) {
    throw new TypeError('task fields do not match the local queue schema');
  }
  if (task.schemaVersion !== 1) throw new TypeError('unsupported task schemaVersion');
  if (typeof task.repository !== 'string' || !REPOSITORY.test(task.repository) || task.repository !== repository) {
    throw new TypeError('task repository does not match this workflow');
  }
  const issueNumber = parsePositiveInteger(task.issueNumber, 'issueNumber');
  const expectedUrl = `https://github.com/${task.repository}/issues/${issueNumber}`;
  if (task.issueUrl !== expectedUrl) throw new TypeError('issueUrl must be the canonical GitHub issue URL');
  if (typeof task.taskKey !== 'string' || task.taskKey.length > 200) throw new TypeError('invalid taskKey');
  const key = task.taskKey.match(TASK_KEYS);
  if (!key || Number(key[1]) !== issueNumber) throw new TypeError('taskKey must be a safe key for this issue');
  if (!['handle', 'smoke'].includes(task.mode)) throw new TypeError('invalid task mode');
  if (task.mode === 'smoke' && !key[2].startsWith('manual-')) throw new TypeError('smoke mode is only valid for manual tasks');
  if (typeof task.actor !== 'string' || !LOGIN.test(task.actor) || isBot(task.actor)) throw new TypeError('invalid task actor');
  const createdAt = parseTimestamp(task.createdAt, 'createdAt');
  if (createdAt.toISOString() !== task.createdAt) throw new TypeError('createdAt must be canonical ISO-8601');
  if (!task.source || typeof task.source !== 'object' || Array.isArray(task.source)) throw new TypeError('source must be an object');
  const sourceKeys = ['eventName', 'runId', 'runAttempt', 'headSha', ...(task.source.commentId === undefined ? [] : ['commentId'])];
  if (Object.keys(task.source).some((keyName) => !sourceKeys.includes(keyName))) throw new TypeError('unexpected source fields');
  if (!['issues', 'issue_comment', 'workflow_dispatch'].includes(task.source.eventName)) throw new TypeError('invalid source event');
  if (typeof task.source.runId !== 'string' || !/^\d{1,20}$/.test(task.source.runId) || (runId !== undefined && task.source.runId !== String(runId))) {
    throw new TypeError('source.runId does not match this workflow');
  }
  const runAttempt = parsePositiveInteger(task.source.runAttempt, 'source.runAttempt');
  if (!Number.isInteger(task.source.runAttempt) || task.source.runAttempt !== runAttempt) throw new TypeError('source.runAttempt must be a positive integer');
  if (typeof task.source.headSha !== 'string' || !SHA.test(task.source.headSha) || (headSha !== undefined && task.source.headSha !== headSha)) {
    throw new TypeError('source.headSha does not match this workflow');
  }
  if (task.source.commentId !== undefined) {
    if (task.source.eventName !== 'issue_comment' || typeof task.source.commentId !== 'string' || !/^\d{1,20}$/.test(task.source.commentId)) {
      throw new TypeError('invalid source.commentId');
    }
    if (key[2] !== `comment-${task.source.commentId}`) throw new TypeError('comment taskKey must identify its comment');
  }
  if (task.source.eventName === 'issue_comment' && task.source.commentId === undefined) throw new TypeError('issue comment task requires a commentId');
  if (task.source.eventName === 'workflow_dispatch' && key[2] !== `manual-${task.source.runId}`) throw new TypeError('manual task key must identify this workflow run');
  if (task.source.eventName === 'issue_comment' && !key[2].startsWith('comment-')) throw new TypeError('comment task key must identify its comment');
  if (task.source.eventName === 'issues' && key[2].startsWith('comment-')) throw new TypeError('issue task cannot use a comment key');

  return {
    schemaVersion: 1,
    repository: task.repository,
    issueNumber,
    issueUrl: expectedUrl,
    taskKey: task.taskKey,
    mode: task.mode,
    createdAt: createdAt.toISOString(),
    actor: task.actor,
    source: {
      eventName: task.source.eventName,
      runId: task.source.runId,
      runAttempt,
      headSha: task.source.headSha,
      ...(task.source.commentId === undefined ? {} : { commentId: task.source.commentId }),
    },
  };
}

function buildTask({ eventName, event, repository, runId, runAttempt, headSha, actor, now = new Date(), mode } = {}) {
  if (!['issues', 'issue_comment', 'workflow_dispatch'].includes(eventName) || !event || typeof event !== 'object') return null;
  const actualActor = eventName === 'workflow_dispatch' ? actor : event.sender?.login;
  if (!LOGIN.test(actualActor || '') || isBot(actualActor) || (actor && actor !== actualActor)) return null;

  let issueNumber;
  let taskKey;
  let taskMode = 'handle';
  let commentId;
  if (eventName === 'issues') {
    const issue = event.issue;
    if (issue?.pull_request) return null;
    const labels = Array.isArray(issue?.labels) ? issue.labels.map((label) => label?.name).filter((name) => typeof name === 'string') : [];
    if (event.action === 'opened' || event.action === 'reopened') {
      if (!labels.some((label) => ISSUE_CATEGORIES.has(label.toLowerCase()))) return null;
      issueNumber = issue.number;
      taskKey = event.action === 'opened'
        ? `issue-${issueNumber}-opened`
        : `issue-${issueNumber}-reopened-${parseTimestamp(issue.updated_at, 'issue.updated_at').getTime()}`;
    } else if (event.action === 'labeled' && event.label?.name === 'codex') {
      if (issue?.pull_request) return null;
      issueNumber = issue.number;
      taskKey = `issue-${issueNumber}-labeled-${parseTimestamp(issue.updated_at, 'issue.updated_at').getTime()}`;
    } else return null;
  } else if (eventName === 'issue_comment') {
    if (event.action !== 'created' || event.issue?.pull_request || !/^\/codex(?:\s|$)/.test(event.comment?.body || '')
      || !TRUSTED_ASSOCIATIONS.has(event.comment?.author_association)
      || event.comment?.user?.login !== actualActor) return null;
    issueNumber = event.issue?.number;
    commentId = String(event.comment.id || '');
    if (!/^\d{1,20}$/.test(commentId)) return null;
    taskKey = `issue-${issueNumber}-comment-${commentId}`;
  } else {
    issueNumber = event.inputs?.issue_number;
    taskMode = event.inputs?.mode || mode || 'handle';
    if (!['handle', 'smoke'].includes(taskMode)) return null;
    taskKey = `issue-${issueNumber}-manual-${runId}`;
  }

  if (!(typeof issueNumber === 'number' || (typeof issueNumber === 'string' && /^\d{1,10}$/.test(issueNumber)))
    || !Number.isSafeInteger(Number(issueNumber)) || Number(issueNumber) < 1) return null;
  issueNumber = Number(issueNumber);

  const created = parseTimestamp(now, 'now');
  const task = {
    schemaVersion: 1,
    repository,
    issueNumber,
    issueUrl: `https://github.com/${repository}/issues/${issueNumber}`,
    taskKey,
    mode: taskMode,
    createdAt: created.toISOString(),
    actor: actualActor,
    source: {
      eventName,
      runId: String(runId),
      runAttempt: Number(runAttempt),
      headSha,
      ...(commentId ? { commentId } : {}),
    },
  };
  return validateTask(task, { repository, runId, headSha });
}

module.exports = { buildTask, validateTask };
