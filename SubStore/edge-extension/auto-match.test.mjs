import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseSubscription } from './auto-match.mjs';

const OLD = 'https://sub.example.com/api/subscribe?token=OLD-ACCOUNT-FIXTURE';
const NEW = 'https://sub.example.com/api/subscribe?token=NEW-ACCOUNT-FIXTURE';
const remote = (name, url = OLD, extra = {}) => ({ name, displayName: name, source: 'remote', url, ...extra });
const matched = (subscriptionName, method) => ({ status: 'matched', subscriptionName, method });
const none = { status: 'none', count: 0 };
const ambiguous = count => ({ status: 'ambiguous', count });

test('exact URL ignores old fragments and explicit client formatting while preserving account parameters', () => {
  const catalog = [remote('Account A', OLD + '&target=clash#ua=fixture&cacheKey=old'),
    remote('Account B', NEW + '&format=sing-box#flowDedup=account')];
  const before = structuredClone(catalog);
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW + '&flag=clash', catalog }), matched('Account B', 'exact_url'));
  assert.deepEqual(chooseSubscription({ candidateUrl: OLD + '&clash=1#new-fragment', catalog }), matched('Account A', 'exact_url'));
  assert.deepEqual(catalog, before, 'normalization must not mutate source URLs, fragments or records');
});

test('format parameter allowlist never removes token values or unknown account selectors', () => {
  for (const key of ['token', 'access_token', 'user', 'account', 'platform']) {
    const catalog = [remote('A', `https://sub.example.com/sub?${key}=clash`), remote('B', `https://sub.example.com/sub?${key}=sing-box`)];
    assert.deepEqual(chooseSubscription({ candidateUrl: `https://sub.example.com/sub?${key}=sing-box&format=clash`, catalog }), matched('B', 'exact_url'));
  }
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW + '&format=account-A', catalog: [remote('A', NEW + '&format=account-A'), remote('B', NEW + '&format=account-B')] }),
    matched('A', 'exact_url'));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog: [remote('A', OLD), remote('B', OLD.replace('OLD-', 'OTHER-'))] }), ambiguous(2));
});

test('query keys are order independent but duplicate account values keep their order', () => {
  const catalog = [remote('A', 'https://sub.example.com/sub?a=1&token=first&token=last'), remote('B', 'https://sub.example.com/sub?token=last&token=first&a=1')];
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://sub.example.com/sub?token=first&target=clash&a=1&token=last', catalog }), matched('A', 'exact_url'));
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://sub.example.com/sub?token=last&a=1&token=first', catalog }), matched('B', 'exact_url'));
});

test('literal plus, encoded space, parameter key case and different tokens cannot collapse into one identity', () => {
  const cases = [
    ['token=A+B', 'token=A%20B'],
    ['token=A', 'Token=A'],
    ['token=ACCOUNT-A', 'token=ACCOUNT-B'],
  ];
  for (const [first, second] of cases) {
    const catalog = [remote('A', 'https://sub.example.com/sub?' + first), remote('B', 'https://sub.example.com/sub?' + second)];
    assert.deepEqual(chooseSubscription({ candidateUrl: 'https://sub.example.com/sub?' + second + '&type=clash', catalog }), matched('B', 'exact_url'));
  }
});

test('one same-origin pathname permits a reset token without requiring a predefined site', () => {
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog: [remote('New arbitrary site')] }), matched('New arbitrary site', 'same_path'));
});

test('SSONE base subscription is the only exact brand among three copies, including copied display labels', () => {
  const catalog = [remote('SSONE-copy5806', OLD, { displayName: 'SSONE' }), remote('SSONE', OLD),
    remote('SSONE-copy9268', OLD, { displayName: 'SSONE' })];
  for (const candidateUrl of [OLD, NEW]) {
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['🇭🇰 S S O N E Network - Dashboard'], catalog }),
      matched('SSONE', candidateUrl === OLD ? 'exact_url' : 'same_path'));
    assert.deepEqual(chooseSubscription({ candidateUrl, catalog }), ambiguous(3));
  }
});

test('copy and personal/work account suffixes are never discarded during name disambiguation', () => {
  const names = ['SSONE', 'SSONE-copy5806', 'SSONE-个人', 'SSONE-工作', 'SSONE-personal', 'SSONE-work', 'SSONE-work42', 'SSONE-account123'];
  const catalog = names.map(name => remote(name));
  for (const name of names) {
    assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: [name + ' - Dashboard'], catalog }), matched(name, 'same_path'));
  }
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['SSONE - ｃｏｐｙ5806 - Dashboard'], catalog }), matched('SSONE-copy5806', 'same_path'));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['SSONE'], catalog: catalog.filter(sub => sub.name !== 'SSONE') }), ambiguous(7));
});

test('page title dash segments can identify a brand without substring or fuzzy matching', () => {
  const catalog = [remote('良心云'), remote('良心云 Plus')];
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['仪表盘 - 良心云机场'], catalog }), matched('良心云', 'same_path'));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['良心云 - 高速稳定服务'], catalog }), matched('良心云', 'same_path'));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['良心'], catalog }), ambiguous(2));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['良心云', '良心云 Plus'], catalog }), ambiguous(2));
});

test('displayName is a fallback for opaque names and cannot pick randomly among copied labels', () => {
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['Kitty Network'], catalog: [remote('internal-one', OLD, { displayName: 'Kitty' }), remote('internal-two', OLD, { displayName: 'Other' })] }),
    matched('internal-one', 'same_path'));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['Kitty'], catalog: [remote('internal-one', OLD, { displayName: 'Kitty' }), remote('internal-two', OLD, { displayName: 'Kitty' })] }), ambiguous(2));
});

test('same-origin exact name can identify a changed source path', () => {
  const catalog = [remote('演示', 'https://sub.example.com/old-path?token=old'), remote('其他机场', 'https://sub.example.com/other-path?token=other')];
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://sub.example.com/new-path?token=new', siteNames: ['演示机场 - dashboard'], catalog }),
    matched('演示', 'same_origin_name'));
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://sub.example.com/new-path?token=new', catalog }), none);
});

test('only a unique exact brand permits a new origin, scheme or port after URL evidence misses', () => {
  const catalog = [remote('Shared brand')];
  for (const candidateUrl of ['https://other.example.com/api/subscribe?token=new', 'http://sub.example.com/api/subscribe?token=new',
    'https://sub.example.com:8443/api/subscribe?token=new']) {
    assert.deepEqual(chooseSubscription({ candidateUrl, catalog }), none);
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Shared'], catalog }), none);
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Shared brand'], catalog }), matched('Shared brand', 'unique_name_new_origin'));
  }
});

test('unique internal brand and displayName support a changed subscription CDN', () => {
  const candidateUrl = 'https://new-cdn.example.com/new-subscribe?token=RESET-FIXTURE';
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Kitty Network - Dashboard'], catalog: [remote('Kitty'), remote('Other site')] }),
    matched('Kitty', 'unique_name_new_origin'));
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['赔钱机场'], catalog: [remote('opaque-id', OLD, { displayName: '赔钱' }), remote('other-id', OLD, { displayName: 'Other' })] }),
    matched('opaque-id', 'unique_name_new_origin'));
});

test('cross-CDN matching retains copy and account suffixes and refuses ambiguous brands', () => {
  const candidateUrl = 'https://new-cdn.example.com/subscribe?token=RESET-FIXTURE';
  const names = ['SSONE', 'SSONE-copy5806', 'SSONE-个人', 'SSONE-工作'];
  const catalog = names.map(name => remote(name));
  for (const name of names) {
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: [name], catalog }), matched(name, 'unique_name_new_origin'));
  }
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['SSONE'], catalog: catalog.slice(1) }), none);
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Kitty Network'], catalog: [remote('Kitty'), remote('kitty VPN')] }), ambiguous(2));
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Kitty'], catalog: [remote('opaque-one', OLD, { displayName: 'Kitty' }), remote('opaque-two', OLD, { displayName: 'Kitty' })] }), ambiguous(2));
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Duplicate'], catalog: [remote('Duplicate'), remote('Duplicate', 'https://other-old.example.com/subscribe')] }), ambiguous(2));
});

test('empty or generic brands and ineligible records cannot authorize cross-origin matching', () => {
  const candidateUrl = 'https://new-cdn.example.com/subscribe?token=RESET-FIXTURE';
  for (const siteNames of [[], [''], ['机场', 'VPN', 'Network', '仪表盘', 'dashboard'], ['Kit']]) {
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames, catalog: [remote('Kitty')] }), none);
  }
  const catalog = [remote('Kitty', OLD, { source: 'local' }), remote('Kitty', '<html>failure</html>'),
    remote('Kitty', OLD, { mergeSources: 'localFirst', content: 'fixture-local-content' })];
  assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Kitty'], catalog }), none);
});

test('different sites sharing a source domain remain separated by pathname and exact brand', () => {
  const catalog = [remote('Airport One', 'https://shared.example.com/one?token=old'), remote('Airport Two', 'https://shared.example.com/two?token=old')];
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://shared.example.com/two?token=new', catalog }), matched('Airport Two', 'same_path'));
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://shared.example.com/three?token=new', catalog }), none);
  assert.deepEqual(chooseSubscription({ candidateUrl: 'https://shared.example.com/three?token=new', siteNames: ['Airport One'], catalog }), matched('Airport One', 'same_origin_name'));
});

test('an ambiguous stronger URL stage cannot fall through to a named subscription on another path', () => {
  const catalog = [remote('Account A'), remote('Account B'), remote('Named other', 'https://sub.example.com/other?token=old'),
    remote('Different CDN', 'https://other-old.example.com/subscribe?token=old')];
  for (const candidateUrl of [OLD, NEW]) {
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Named other'], catalog }), ambiguous(2));
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['Different CDN'], catalog }), ambiguous(2));
  }
});

test('HTTP, IPv4, IPv6, local IP and Chinese source domains are eligible without a sample-site list', () => {
  for (const origin of ['http://192.0.2.17:8080', 'https://[2001:db8::1]:8443', 'http://127.0.0.1:8080', 'https://订阅.example.com']) {
    const old = origin + '/subscribe?token=old';
    const candidateUrl = origin + '/subscribe?token=new';
    assert.deepEqual(chooseSubscription({ candidateUrl, catalog: [remote('任意站点', old)] }), matched('任意站点', 'same_path'));
  }
});

test('local, combined, multiple-URL and broken remote sources are excluded', () => {
  const bad = [
    remote('Local', NEW, { source: 'local' }), remote('Missing source', NEW, { source: undefined }),
    remote('Wrong source spelling', NEW, { source: 'Remote' }),
    remote('Merged local content', NEW, { mergeSources: 'localFirst', content: 'fixture-local-node' }),
    remote('Remote then local content', NEW, { mergeSources: 'remoteFirst', content: 'fixture-local-node' }),
    remote('Two lines', OLD + '\n' + NEW), remote('Two pipes', OLD + '|' + NEW), remote('URL array', [OLD, NEW]),
    remote('Credential URL', 'https://user:password@sub.example.com/api/subscribe'),
    remote('Bad URL', '<html>backend unavailable</html>'), remote('Null URL', null),
  ];
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: bad.map(sub => sub.name), catalog: bad }), none);
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog: [...bad, remote('Valid')] }), matched('Valid', 'same_path'));
});

test('candidate and catalog URLs reject credentials, controls, malformed escapes and non-HTTP schemes', () => {
  for (const candidateUrl of [null, '', ' ' + NEW, NEW + '\t', NEW + '\u0000', NEW + '%0a', NEW + '%ZZ',
    'https://user:password@sub.example.com/api/subscribe', 'ftp://sub.example.com/sub', 'file:///tmp/sub',
    'data:text/plain,fixture', OLD + '\n' + NEW, OLD + '|' + NEW, 'https:\\sub.example.com\\sub']) {
    assert.deepEqual(chooseSubscription({ candidateUrl, siteNames: ['A'], catalog: [remote('A')] }), none);
  }
});

test('HTML responses, wrapped API responses, nulls and malformed entries fail closed without throwing', () => {
  for (const catalog of ['<html>login required</html>', { status: 'success', data: [remote('A')] }, null, 17, false]) {
    assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog }), none);
  }
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog: [null, 4, 'url', {}, remote('', NEW), remote('A\nB', NEW), remote('https://example.com/private', NEW)] }), none);
  for (const input of [undefined, null, 42, [], '<html>']) assert.deepEqual(chooseSubscription(input), none);
});

test('duplicate subscription identifiers are ambiguous even when only one URL is the strongest match', () => {
  const catalog = [remote('Duplicate', OLD), remote('Duplicate', 'https://other.example.com/sub?token=other')];
  assert.deepEqual(chooseSubscription({ candidateUrl: OLD, catalog }), ambiguous(2));
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['Duplicate'], catalog }), ambiguous(2));
});

test('generic names, oversized names and name getters cannot manufacture a brand match', () => {
  const catalog = [remote('Account A'), remote('Account B')];
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, siteNames: ['机场 VPN Network 仪表盘 dashboard', 'A'.repeat(201)], catalog }), ambiguous(2));
  const accessor = { source: 'remote', url: NEW };
  Object.defineProperty(accessor, 'name', { get() { throw new Error('getter must not run'); } });
  assert.deepEqual(chooseSubscription({ candidateUrl: NEW, catalog: [accessor] }), none);
});

test('all return shapes contain only status, count or matched subscription metadata, never URL data', () => {
  const outputs = [
    chooseSubscription({ candidateUrl: OLD, catalog: [remote('A')] }),
    chooseSubscription({ candidateUrl: NEW, catalog: [remote('A'), remote('B')] }),
    chooseSubscription({ candidateUrl: NEW, catalog: [] }),
  ];
  for (const result of outputs) {
    assert.deepEqual(Object.keys(result).sort(), result.status === 'matched' ? ['method', 'status', 'subscriptionName'] : ['count', 'status']);
    assert.equal(/https?:|ACCOUNT-FIXTURE|token=/.test(JSON.stringify(result)), false);
  }
});
