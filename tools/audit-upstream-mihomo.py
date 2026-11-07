#!/usr/bin/env python3
"""Offline, read-only intake audit; not a core validator or a routing test.

Requires PyYAML. Never fetches URLs or emits subscription/credential values.
"""
import argparse
import json
from pathlib import Path
import sys


def audit(config):
    if not isinstance(config, dict):
        raise ValueError('Expected a Mihomo configuration mapping')
    findings = []

    def add(code, location, message):
        findings.append(dict(code=code, location=location, message=message))

    controller = config.get('external-controller')
    if isinstance(controller, str) and (controller.startswith('0.0.0.0:') or controller.startswith('[::]:') or controller.startswith(':')):
        add('controller-wide-bind', 'external-controller', 'Controller listens beyond loopback; review firewall and authentication before adoption.')
    if config.get('secret'):
        add('embedded-controller-secret', 'secret', 'Template contains a controller secret; replace locally and never copy shared credentials.')
    if config.get('authentication'):
        add('embedded-proxy-auth', 'authentication', 'Template contains proxy authentication; review locally and never copy shared credentials.')

    providers = config.get('proxy-providers')
    if isinstance(providers, dict):
        for i, provider in enumerate(providers.values()):
            if isinstance(provider, dict) and isinstance(provider.get('override'), dict) and provider['override'].get('skip-cert-verify') is True:
                add('tls-verification-disabled', f'proxy-providers[{i}].override.skip-cert-verify', 'Provider disables TLS certificate verification for inherited nodes.')
    proxies = config.get('proxies')
    if isinstance(proxies, list):
        for i, proxy in enumerate(proxies):
            if isinstance(proxy, dict) and proxy.get('skip-cert-verify') is True:
                add('tls-verification-disabled', f'proxies[{i}].skip-cert-verify', 'Node disables TLS certificate verification.')

    tun = config.get('tun')
    rule_providers = config.get('rule-providers')
    rule_providers = rule_providers if isinstance(rule_providers, dict) else {}
    if isinstance(tun, dict):
        for field in ('route-address-set', 'route-exclude-address-set'):
            refs = tun.get(field)
            if refs is None:
                continue
            if not isinstance(refs, list) or any(not isinstance(ref, str) for ref in refs):
                add('invalid-tun-rule-set-shape', f'tun.{field}', 'Expected a list of rule-provider names; check core schema.')
                continue
            if refs and field == 'route-exclude-address-set':
                add('tun-rule-bypass', f'tun.{field}', 'Excluded destinations bypass TUN routing; audit policy precedence and re-check references after rule-provider replacement.')
            for i, ref in enumerate(refs):
                if ref not in rule_providers:
                    add('unresolved-tun-rule-set', f'tun.{field}[{i}]', 'Referenced rule-provider is absent; preserve or remove this reference before using a transformed configuration.')

    groups = config.get('proxy-groups')
    if isinstance(groups, list):
        for i, group in enumerate(groups):
            if isinstance(group, dict) and group.get('empty-fallback') == 'DIRECT':
                add('empty-group-direct', f'proxy-groups[{i}].empty-fallback', 'An empty group explicitly falls back to DIRECT; review privacy expectations.')
    return findings


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('file', type=Path)
    parser.add_argument('--format', required=True, choices=['mihomo'], help='Explicit scope: Egern and other clients have different schemas.')
    args = parser.parse_args()
    try:
        import yaml
        raw = args.file.read_bytes()
        if len(raw) > 5 * 1024 * 1024:
            raise ValueError('Input exceeds the 5 MiB intake limit')
        findings = audit(yaml.safe_load(raw))
    except ImportError:
        print('PyYAML is required; install it from the official PyPI registry in your development environment.', file=sys.stderr)
        return 2
    except Exception:
        # Parser errors can contain input excerpts with credentials. Do not echo them.
        print('Audit failed: unreadable, oversized, malformed YAML, or invalid root shape. Inspect locally.', file=sys.stderr)
        return 2
    print(json.dumps({'scope': 'mihomo-intake-only', 'findings': findings}, ensure_ascii=False, indent=2))
    return 1 if findings else 0


if __name__ == '__main__':
    sys.exit(main())
