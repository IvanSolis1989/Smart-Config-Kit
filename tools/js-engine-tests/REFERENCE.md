# JavaScript engine validation reference

This directory isolates the mandatory test dependency from the root project and
from the published overwrite scripts. Install and run from the repository root:

```sh
npm --prefix tools/js-engine-tests ci --ignore-scripts
node tools/validate-js-engines.js
node --test tools/tests/js-engines.test.js
```

`--target smart|normal|flclash` selects one adapter. Missing dependencies fail with
the installation command; corrupt packages and WASM initialization errors also
fail. CI installs from the checked-in lockfile and runs both commands.

The validator parses and executes each complete script in the actual QuickJS
WebAssembly engine, including uncalled function bodies and regular expressions,
then calls `main`. It compares the complete JSON config with the same isolated
Node VM driver. Array ordering, routing targets, DNS/hosts, providers, proxies,
groups and all other JSON fields must match. Object identity is measured inside
each engine before JSON serialization; FlClash must retain its config, groups,
rules and provider references. Existing Node contract tests remain required.

Cases cover normal subscriptions, valid dialer chains, exact and unknown
multiplier boundaries, filtered chain dependencies, cycles, inline providers and
unsupported remote providers. Invalid inputs must remain unchanged. Optional
local constants are replaced only in memory in the test driver; files and their
default settings are never changed.

The syntax boundary is the pinned engine's actual global-script parser, plus
Node's `vm.Script` parser. There is no guessed ES2020 API denylist. Tests explicitly
retain BigInt, optional chaining and nullish coalescing, and reject invalid syntax
even in uncalled functions. The package documents support for most ES2023;
successful execution is evidence for this fixed engine, not a claim that every
client's bundled older engine or Dart/QuickJS bridge is identical. This gate also
does not replace Mihomo schema validation or client/device acceptance.

## Reuse and licenses

- Design reference only: MyClash's
  [QuickJS check](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Test/lib/quickjs-check.js)
  and [ES2020 check](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/Test/lib/es2020-check.js),
  fixed revision `bf6c2dbc3b007b791284b437e5283854ce9c0f1a`,
  [MIT](https://github.com/AIsouler/MyClash/blob/bf6c2dbc3b007b791284b437e5283854ce9c0f1a/LICENSE).
  We reuse the real-engine and JSON bridge approach. Its missing-dependency skip,
  output-count comparison and ES2020 API blacklist do not satisfy this repository's
  gate; this implementation uses full output comparison and mandatory execution.
  No MyClash source is copied.
- Runtime library: `quickjs-emscripten` exactly `0.32.0`,
  [official usage and lifetime management](https://github.com/justjake/quickjs-emscripten/blob/v0.32.0/README.md),
  [MIT license](https://github.com/justjake/quickjs-emscripten/blob/v0.32.0/LICENSE).
  The default synchronous Bellard QuickJS variant is used, not quickjs-ng.
  The lockfile fixes transitive WASM packages and integrity hashes; upstream
  package licenses remain in the installed dependencies.

The dependency exposes no host filesystem, network, module loader or process
APIs inside the guest context. Each run has a fresh context, a 15-second interrupt
deadline and a 128 MiB guest memory limit. Host callbacks only enforce the deadline;
console methods are no-ops. Handles and contexts are disposed after success and
failure. These limits are test resource controls, not a general-purpose isolation
or security guarantee.
