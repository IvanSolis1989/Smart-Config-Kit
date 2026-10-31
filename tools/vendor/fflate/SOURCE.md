# fflate vendoring record

- Package: `fflate@0.8.3` from the official npm registry.
- Source archive: https://registry.npmjs.org/fflate/-/fflate-0.8.3.tgz
- Included files: `package/umd/index.js` (official UMD browser build) and `package/LICENSE` (MIT).
- Archive SHA-256: `38c2cd824402407b43153c782274aec2ea83ea688e4aa0b743c5f2c305857d92`
- npm `dist.integrity`: `sha512-tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==`
- Verification: downloaded archive SHA-512 SRI exactly matched the registry metadata above. The UMD wrapper publishes `fflate` on the browser global; the bundle exports `zipSync` and `unzipSync`.
- Runtime scope: vendor this local file with the offline HTML; no CDN, worker, install step, or package dependency is required. The UMD bundle includes asynchronous APIs, but the offline exporter should call only `zipSync`.
