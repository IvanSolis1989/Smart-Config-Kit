<picture><source media="(max-width: 600px)" srcset="assets/readme/page-telegram-mobile.svg"><img src="assets/readme/page-telegram.svg" width="100%" alt="Channel notifications"></picture>

# Olympus channel notifications

**English** | [中文](telegram.zh-CN.md)

This guide covers root-changelog notifications and the difference between previewing, sending and recovering a notification. Start routine checks with `preview`.

[Downloads](guide/downloads.md) · [Documentation](README.md) · [Validation](guide/dns-and-verification.md)

## Start here

1. Configure the Actions secret and grant the bot permission to post in the channel.
2. Run the workflow in `preview` mode to inspect content and its source commit.
3. After a real notification, inspect the commit-status receipt. If delivery is uncertain, inspect the channel before choosing a recovery mode.

Channel: [Olympus](https://t.me/IvanSolis89). Discussion group: [Olympus_Habitue](https://t.me/Olympus_Habitue). Bot: `@Olympus_TL_bot`.

## Content and triggers

`.github/workflows/telegram-release.yml` automatically notifies only when the root `CHANGELOG.md` changes on main. Ordinary commits, subdirectory changelogs and GitHub Releases do not trigger Smart-Config-Kit channel updates. Changes to the notification script itself run tests and diff checks.

The script compares the complete push before/after and sends only if the root changelog actually changed. It takes the first section of that commit's root changelog. Notifications contain one title, up to four actual changes and one [repository link](https://github.com/IvanSolis1989/Smart-Config-Kit). Link previews are disabled; configurations and archives are not sent.

Same-day subdirectory changelog references are expanded into actual descriptions and deduplicated rather than forwarding a generic “see changelog” line. New public documentation and release summaries should be written in English; existing issue replies continue to follow each question's language.

## Initial setup

1. Save `TELEGRAM_BOT_TOKEN` under Settings → Secrets and variables → Actions.
2. Make the bot a channel administrator with permission to post messages.
3. Telegram forwards new channel posts to its linked discussion group; the bot does not require group-administrator permission.

Keep tokens out of source code, logs and documentation. No persistent notification server is required. Smart-Config-Kit no longer uses `TELEGRAM_API_ID` or `TELEGRAM_API_HASH`, and does not need file-upload dependencies.

## Manual checks and recovery

In Actions → **Telegram release notification** → Run workflow, select main:

- `preview`: display the latest root-changelog section without sending. `tag` may be a commit SHA; blank means main.
- `test`: send a silent deployment-test message to check the secret and channel permission.
- `send`: send changes and a repository link for the selected commit; blank `tag` means main.
- `recover`: use only after checking that the prior message was not delivered. It permits retrying uncertain delivery and can create duplicates.
- `edit`: update the text of an existing successful notification.

## Delivery receipts

Receipts are GitHub commit statuses on the source commit, with context `telegram/olympus/link-changelog-<SHA>`. A success receipt skips repeat sending. The first attempt records pending before sending, then success and the message URL after delivery.

Network failure or failure to save the receipt leaves pending; automatic reruns do not blindly resend. If the original message is confirmed to exist, the context can be corrected to success with its message URL without sending again. Notifications are serialized by repository. Failures are visible in Actions and do not change routing, configurations, version numbers or user data.

## Maintenance and references

Scripts and tests are in `.github/scripts/telegram-release*.mjs`:

```sh
node --test .github/scripts/telegram-release.test.mjs .github/scripts/telegram-artifacts.test.mjs
python3 .github/scripts/telegram-files.test.py
```

Aerove shares the bot but has an independent workflow based on its own public Releases and original artifact files. Do not change its behavior when maintaining this repository's notification language. The channel's numeric ID is fixed; update message URLs when the public username changes.

References: [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage), [linked discussions](https://core.telegram.org/api/discussion), [GitHub path filters](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onpushpull_requestpull_request_targetpathspaths-ignore), and [commit statuses](https://docs.github.com/en/rest/commits/statuses).
