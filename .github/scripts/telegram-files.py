"""Prepare pinned configuration outputs and upload documents using a bot account."""
import argparse
import asyncio
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys
import tempfile
import zipfile


def digest(path):
    with Path(path).open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def validate_files(files):
    if not files or len({item['name'] for item in files}) != len(files):
        raise ValueError('Missing or duplicate artifacts')
    for item in files:
        path = Path(item['path'])
        if not path.is_file() or path.is_symlink() or path.name != item['name']:
            raise ValueError('Invalid artifact path')
        if not 0 < item['size'] <= 2_000_000_000 or path.stat().st_size != item['size']:
            raise ValueError('Invalid artifact size')
        if not re.fullmatch('[a-f0-9]{64}', item['sha256']) or digest(path) != item['sha256']:
            raise ValueError('Artifact SHA256 mismatch')


def bundle(root, sha, output):
    if not re.fullmatch('[a-f0-9]{40}', sha):
        raise ValueError('An immutable source commit is required')

    def git(*arguments):
        return subprocess.check_output(['git', '-C', str(root), *arguments], stderr=subprocess.DEVNULL)

    def blob(name):
        return git('show', f'{sha}:{name}')

    if subprocess.run(['git', '-C', str(root), 'cat-file', '-e', f'{sha}^{{commit}}'],
                      stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode:
        git('fetch', '--no-tags', '--no-recurse-submodules', '--depth=1',
            'https://github.com/IvanSolis1989/Smart-Config-Kit.git', sha)
    contract = json.loads(blob('rulesets/source/release-batch-contract.json'))
    primary = [name for name in contract['staticOutputs'] if not name.startswith(('rulesets/', 'tools/'))]
    directories = {name.split('/')[0] for name in primary}
    names = set(primary) | {'README.md', 'CHANGELOG.md'}
    for row in git('ls-tree', '-r', '-z', sha).decode().split('\0'):
        if not row:
            continue
        metadata, name = row.split('\t', 1)
        if name in names or (name.split('/')[0] in directories and
                             (name.endswith(('/README.md', '/CHANGELOG.md')) or '/shunt-rules/' in name)):
            if metadata.split()[0] not in ('100644', '100755'):
                raise ValueError('Nonregular configuration output')
            names.add(name)
    source_manifest = {'repository': 'IvanSolis1989/Smart-Config-Kit', 'source': sha, 'files': []}
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f'Smart-Config-Kit-{sha[:12]}.zip'
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as package:
        for name in sorted(names):
            if PurePosixPath(name).is_absolute() or '..' in PurePosixPath(name).parts or '\\' in name:
                raise ValueError('Unsafe configuration path')
            content = blob(name)
            record = {'path': name, 'sha256': hashlib.sha256(content).hexdigest(), 'size': len(content)}
            source_manifest['files'].append(record)
            info = zipfile.ZipInfo('Smart-Config-Kit/' + name)
            info.compress_type = zipfile.ZIP_DEFLATED
            package.writestr(info, content)
        info = zipfile.ZipInfo('Smart-Config-Kit/BUILD_SOURCE.json')
        info.compress_type = zipfile.ZIP_DEFLATED
        package.writestr(info, json.dumps(source_manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(archive) as package:
        if package.testzip() is not None:
            raise ValueError('Invalid configuration archive')
        for record in source_manifest['files']:
            if hashlib.sha256(package.read('Smart-Config-Kit/' + record['path'])).hexdigest() != record['sha256']:
                raise ValueError('Configuration archive read-back mismatch')
    return [{'path': str(archive.resolve()), 'name': archive.name, 'size': archive.stat().st_size, 'sha256': digest(archive)}]


async def upload(manifest):
    from telethon import TelegramClient, utils
    from telethon.sessions import MemorySession

    validate_files(manifest['files'])
    api_id = os.environ.get('TELEGRAM_API_ID', '').strip()
    api_hash = os.environ.get('TELEGRAM_API_HASH', '').strip()
    token = os.environ.get('TELEGRAM_BOT_TOKEN', '').strip()
    if not api_id.isdigit() or not re.fullmatch('[a-fA-F0-9]{32}', api_hash) or not token:
        raise ValueError('Configure TELEGRAM_API_ID, TELEGRAM_API_HASH and TELEGRAM_BOT_TOKEN')
    client = TelegramClient(MemorySession(), int(api_id), api_hash, receive_updates=False,
                            request_retries=3, connection_retries=3, flood_sleep_threshold=30)
    receipts = []
    await client.connect()
    try:
        await client.sign_in(bot_token=token)
        me = await client.get_me()
        if not me.bot or str(me.id) != token.split(':')[0]:
            raise ValueError('Unexpected bot identity')
        channel = await client.get_entity('IvanSolis89')
        if utils.get_peer_id(channel) != -1003974315707:
            raise ValueError('Unexpected destination channel')
        for offset in range(0, len(manifest['files']), 10):
            batch = manifest['files'][offset:offset + 10]
            captions = [manifest['caption'] if offset == 0 else ''] + [''] * (len(batch) - 1)
            paths = [item['path'] for item in batch]
            messages = await client.send_file(channel, paths if len(paths) > 1 else paths[0],
                                              caption=captions if len(paths) > 1 else captions[0],
                                              force_document=True, parse_mode=None)
            messages = messages if isinstance(messages, list) else [messages]
            if len(messages) != len(batch):
                raise ValueError('Telegram returned an incomplete artifact group')
            for item, message in zip(batch, messages):
                if message.file is None or message.file.size != item['size'] or message.file.name != item['name']:
                    raise ValueError('Telegram document metadata mismatch')
                verified = False
                if manifest.get('verify_download'):
                    with tempfile.TemporaryDirectory(prefix='telegram-readback-') as directory:
                        downloaded = await client.download_media(message, file=str(Path(directory) / item['name']))
                        if digest(downloaded) != item['sha256']:
                            raise ValueError('Telegram downloaded document SHA256 mismatch')
                    verified = True
                receipts.append({**{key: item[key] for key in ('name', 'size', 'sha256')},
                                 'message_id': message.id, 'download_verified': verified})
    finally:
        try:
            if await client.is_user_authorized():
                await client.log_out()
        finally:
            await client.disconnect()
    return {'message_id': receipts[0]['message_id'], 'files': receipts}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    package = commands.add_parser('bundle')
    package.add_argument('--root', required=True)
    package.add_argument('--source', required=True)
    package.add_argument('--output', required=True)
    send = commands.add_parser('upload')
    send.add_argument('--manifest', required=True)
    args = parser.parse_args()
    if args.command == 'bundle':
        result = bundle(Path(args.root), args.source, args.output)
    else:
        result = asyncio.run(upload(json.loads(Path(args.manifest).read_text(encoding='utf-8'))))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'{type(error).__name__}: Telegram artifact operation failed; inspect channel before retrying.', file=sys.stderr)
        sys.exit(1)
