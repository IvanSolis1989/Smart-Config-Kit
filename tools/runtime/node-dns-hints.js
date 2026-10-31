// Subscription Adapter Module — embedded verbatim into runtime JS adapters.
//
// Interface:
//   captureNodeDns(sourceConfig, activeNodeServers, runtimeProfile) -> snapshot
//   applyNodeDns(repositoryConfig, snapshot, runtimeProfile) -> redacted report
//
// Trust boundary: source subscription DNS can only be projected to active proxy
// node FQDNs. It never replaces the repository-owned global DNS roles.
// The generated profile fragment supplies sckiResolveSubscriptionAdapterProfile.

var SckiSubscriptionAdapter = (function() {
  var NODE_DNS_HINT_LIMITS = {
    activeNodeServers: 512,
    domains: 128,
    resolvers: 64,
    policies: 64,
    hosts: 64,
    values: 8,
    sourceEntries: 256,
    sourceExactEntries: 4096,
    stringLength: 512
  }

  function isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value)
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key)
  }

  function recordReject(snapshot, count) {
    snapshot.stats.rejected += count || 1
  }

  function pushUnique(list, value, keyFn) {
    var key = keyFn ? keyFn(value) : value
    for (var i = 0; i < list.length; i++) {
      if ((keyFn ? keyFn(list[i]) : list[i]) === key) return false
    }
    list.push(value)
    return true
  }

  function isIPv4(value) {
    var text = String(value || '')
    var parts = text.split('.')
    if (parts.length !== 4) return false
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d{1,3}$/.test(parts[i])) return false
      var number = Number(parts[i])
      if (number < 0 || number > 255) return false
    }
    return true
  }

  function isIPv6(value) {
    var text = String(value || '')
    var match = text.match(/^\[([0-9a-fA-F:.]+)\]$/)
    if (match) text = match[1]
    if (!text || !/^[0-9a-fA-F:.]+$/.test(text) || text.indexOf(':') === -1 || text.indexOf(':::') !== -1) return false
    var lastColon = text.lastIndexOf(':')
    var ipv4Tail = lastColon !== -1 ? text.slice(lastColon + 1) : ''
    if (ipv4Tail.indexOf('.') !== -1) {
      if (!isIPv4(ipv4Tail)) return false
      text = text.slice(0, lastColon + 1) + '0:0'
    }
    var compressedAt = text.indexOf('::')
    if (compressedAt !== -1 && text.indexOf('::', compressedAt + 2) !== -1) return false
    var groups = text.split(':').filter(function(group) { return group !== '' })
    if (!groups.every(function(group) { return /^[0-9a-fA-F]{1,4}$/.test(group) })) return false
    return compressedAt === -1 ? groups.length === 8 : groups.length < 8
  }

  function unbracketIPv6(value) {
    var text = String(value || '')
    return text.charAt(0) === '[' && text.charAt(text.length - 1) === ']' ? text.slice(1, -1) : text
  }

  function normaliseDomain(value) {
    if (typeof value !== 'string') return ''
    if (value.length > NODE_DNS_HINT_LIMITS.stringLength) return ''
    var domain = value.trim().toLowerCase()
    while (domain.length > 0 && domain.charAt(domain.length - 1) === '.') domain = domain.slice(0, -1)
    if (!domain || domain.length > 253 || /[\x00-\x20\\/@:?#[\]]/.test(domain)) return ''
    if (domain === 'localhost' || /^\d+(?:\.\d+){3}$/.test(domain)) return ''
    var labels = domain.split('.')
    for (var i = 0; i < labels.length; i++) {
      if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(labels[i])) return ''
    }
    return domain
  }

  function normaliseResolver(value) {
    if (typeof value !== 'string') return ''
    if (value.length > NODE_DNS_HINT_LIMITS.stringLength) return ''
    var resolver = value.trim()
    if (!resolver || resolver.length > NODE_DNS_HINT_LIMITS.stringLength || /[\x00-\x20]/.test(resolver)) return ''
    var lowered = resolver.toLowerCase()
    if (resolver.indexOf('#') !== -1 || /^(?:system|dhcp)$/i.test(resolver) || /^rcode:/i.test(resolver)) return ''
    if (/[?&](?:skip-cert-verify|ecs|h3)=/i.test(resolver)) return ''
    if (isIPv4(resolver)) return lowered
    if (isIPv6(resolver)) return unbracketIPv6(resolver).toLowerCase()
    var rawDomain = normaliseDomain(resolver)
    if (rawDomain) return rawDomain
    var match = resolver.match(/^(udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::(\d{1,5}))?(\/[^\s]*)?$/i)
    if (!match) return ''
    var port = match[3] ? Number(match[3]) : 0
    if (match[3] && (port < 1 || port > 65535)) return ''
    var host = match[2]
    if (isIPv6(host)) host = unbracketIPv6(host).toLowerCase()
    else if (isIPv4(host)) host = host
    else {
      host = normaliseDomain(host)
      if (!host) return ''
    }
    return match[1].toLowerCase() + '://' + host + (match[3] ? ':' + match[3] : '') + (match[4] || '')
  }

  function resolverKey(value) {
    // normaliseResolver lower-cases only scheme and hostname. URL path/query
    // are deliberately preserved because they can be case-sensitive.
    return String(value || '')
  }

  function resolverHost(value) {
    var resolver = String(value || '')
    if (isIPv4(resolver) || isIPv6(resolver)) return ''
    var rawDomain = normaliseDomain(resolver)
    if (rawDomain) return rawDomain
    var match = resolver.match(/^(?:udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?$/i)
    if (!match || isIPv4(match[1]) || isIPv6(match[1])) return ''
    return normaliseDomain(match[1])
  }

  function normaliseResolverList(value, snapshot) {
    var rawValues = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : [])
    if (!Array.isArray(value) && typeof value !== 'string') {
      recordReject(snapshot)
      return []
    }
    var output = []
    for (var i = 0; i < rawValues.length && i < NODE_DNS_HINT_LIMITS.values; i++) {
      var resolver = normaliseResolver(rawValues[i])
      if (!resolver) {
        recordReject(snapshot)
        continue
      }
      pushUnique(output, resolver, resolverKey)
    }
    if (rawValues.length > NODE_DNS_HINT_LIMITS.values) recordReject(snapshot, rawValues.length - NODE_DNS_HINT_LIMITS.values)
    return output
  }

  function normaliseHostValues(value, snapshot) {
    var rawValues = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : [])
    if (!Array.isArray(value) && typeof value !== 'string') {
      recordReject(snapshot)
      return null
    }
    var ipValues = []
    var redirects = []
    for (var i = 0; i < rawValues.length && i < NODE_DNS_HINT_LIMITS.values; i++) {
      if (typeof rawValues[i] !== 'string') {
        recordReject(snapshot)
        continue
      }
      if (rawValues[i].length > NODE_DNS_HINT_LIMITS.stringLength) {
        recordReject(snapshot)
        continue
      }
      var host = rawValues[i].trim()
      var ipv6Literal = isIPv6(host)
      // IPv6 literals legitimately contain colons and may be bracketed. Other
      // URL/control syntax is rejected because hosts values are addresses or
      // resolver hostnames only.
      if (!host || host.length > NODE_DNS_HINT_LIMITS.stringLength || (!ipv6Literal && /[\x00-\x20\\/@?#[\]]/.test(host))) {
        recordReject(snapshot)
        continue
      }
      if (ipv6Literal) {
        host = unbracketIPv6(host).toLowerCase()
        pushUnique(ipValues, host, function(entry) { return String(entry).toLowerCase() })
      } else if (isIPv4(host)) {
        pushUnique(ipValues, host, function(entry) { return String(entry).toLowerCase() })
      } else {
        host = normaliseDomain(host)
        if (!host) {
          recordReject(snapshot)
          continue
        }
        pushUnique(redirects, host, function(entry) { return String(entry).toLowerCase() })
      }
    }
    if (rawValues.length > NODE_DNS_HINT_LIMITS.values) recordReject(snapshot, rawValues.length - NODE_DNS_HINT_LIMITS.values)
    if (redirects.length) {
      if (redirects.length === 1 && !ipValues.length) return redirects[0]
      recordReject(snapshot)
      return null
    }
    return ipValues.length ? ipValues : null
  }

  function normalisePattern(value) {
    if (typeof value !== 'string') return ''
    if (value.length > NODE_DNS_HINT_LIMITS.stringLength) return ''
    var pattern = value.trim().toLowerCase()
    while (pattern.length > 0 && pattern.charAt(pattern.length - 1) === '.') pattern = pattern.slice(0, -1)
    if (!pattern || pattern.length > 253 || /[\x00-\x20\\/@:?#[\]]/.test(pattern) || pattern === '*') return ''
    if (pattern.slice(0, 2) === '+.') return normaliseDomain(pattern.slice(2)) ? pattern : ''
    if (pattern.charAt(0) === '.') return normaliseDomain(pattern.slice(1)) ? pattern : ''
    if (pattern.indexOf('*') !== -1) {
      var labels = pattern.split('.')
      if (labels.length < 2) return ''
      for (var i = 0; i < labels.length; i++) {
        if (labels[i] !== '*' && !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(labels[i])) return ''
      }
      return pattern
    }
    return normaliseDomain(pattern)
  }

  function patternMatches(pattern, domain) {
    if (pattern.slice(0, 2) === '+.') {
      var plusBase = pattern.slice(2)
      return domain === plusBase || domain.slice(-(plusBase.length + 1)) === '.' + plusBase
    }
    if (pattern.charAt(0) === '.') {
      var dotBase = pattern.slice(1)
      return domain !== dotBase && domain.slice(-(dotBase.length + 1)) === '.' + dotBase
    }
    if (pattern.indexOf('*') !== -1) {
      var patternLabels = pattern.split('.')
      var domainLabels = domain.split('.')
      if (patternLabels.length !== domainLabels.length) return false
      for (var i = 0; i < patternLabels.length; i++) {
        if (patternLabels[i] !== '*' && patternLabels[i] !== domainLabels[i]) return false
      }
      return true
    }
    return pattern === domain
  }

  function patternScore(pattern) {
    if (pattern.indexOf('*') !== -1) return 3000 + (pattern.split('.').length * 10) + pattern.replace(/\*/g, '').length
    if (pattern.slice(0, 2) === '+.' || pattern.charAt(0) === '.') return 2000 + pattern.length
    return 10000 + pattern.length
  }

  function sameValues(left, right) {
    if (Array.isArray(left) || Array.isArray(right)) {
      if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
      for (var i = 0; i < left.length; i++) {
        if (String(left[i]) !== String(right[i])) return false
      }
      return true
    }
    return typeof left === 'string' && typeof right === 'string' && left === right
  }

  function hasValues(value) {
    return Array.isArray(value) ? value.length > 0 : (typeof value === 'string' && value.length > 0)
  }

  function copyValue(value) {
    return Array.isArray(value) ? value.slice() : value
  }

  function isExactPattern(pattern) {
    return pattern.indexOf('*') === -1 && pattern.slice(0, 2) !== '+.' && pattern.charAt(0) !== '.'
  }

  // Preserve direct exact active-node keys even when an untrusted source has a
  // large number of unrelated entries. Wildcards remain bounded to prevent a
  // source map from turning into an unbounded scan surface.
  function buildSourceView(source, activeDomains, snapshot) {
    if (!isPlainObject(source)) return Object.create(null)
    var view = Object.create(null)
    var active = Object.create(null)
    activeDomains.forEach(function(domain) {
      active[domain] = true
      if (hasOwn(source, domain)) view[domain] = source[domain]
      if (hasOwn(source, domain + '.') && !hasOwn(view, domain + '.')) view[domain + '.'] = source[domain + '.']
    })
    // Do not call Object.keys(source): a malicious subscription could make it
    // allocate a massive array before the cap has a chance to work. Scan a
    // bounded prefix for case-insensitive exact active-node keys, while keeping
    // wildcard evaluation at the tighter cap.
    var scannedEntries = 0
    var wildcardEntries = 0
    for (var rawPattern in source) {
      if (!hasOwn(source, rawPattern)) continue
      scannedEntries += 1
      if (scannedEntries > NODE_DNS_HINT_LIMITS.sourceExactEntries) {
        recordReject(snapshot)
        break
      }
      var pattern = normalisePattern(rawPattern)
      if (!pattern) {
        recordReject(snapshot)
        continue
      }
      if (isExactPattern(pattern)) {
        if (active[pattern]) view[rawPattern] = source[rawPattern]
        continue
      }
      if (wildcardEntries >= NODE_DNS_HINT_LIMITS.sourceEntries) {
        recordReject(snapshot)
        continue
      }
      wildcardEntries += 1
      view[rawPattern] = source[rawPattern]
    }
    return view
  }

  function selectForDomain(source, domain, normaliseValues, snapshot) {
    if (!isPlainObject(source)) return { matched: false, value: null }
    var best = null
    var bestScore = -1
    var conflict = false
    var matched = false
    Object.keys(source).forEach(function(rawPattern) {
      var pattern = normalisePattern(rawPattern)
      if (!pattern || !patternMatches(pattern, domain)) return
      matched = true
      var values = normaliseValues(source[rawPattern], snapshot)
      if (!hasValues(values)) return
      var score = patternScore(pattern)
      if (score > bestScore) {
        best = copyValue(values)
        bestScore = score
        conflict = false
      } else if (score === bestScore && !sameValues(best, values)) {
        conflict = true
      }
    })
    if (conflict) {
      recordReject(snapshot)
      return { matched: true, value: null }
    }
    return { matched: matched, value: best }
  }

  function resolveProfile(runtimeProfile) {
    var requested = typeof runtimeProfile === 'string'
      ? runtimeProfile
      : (isPlainObject(runtimeProfile) && typeof runtimeProfile.id === 'string' ? runtimeProfile.id : '')
    return sckiResolveSubscriptionAdapterProfile(requested)
  }

  function createSnapshot(profile) {
    return {
      profile: profile.id,
      domains: [],
      resolvers: [],
      policy: Object.create(null),
      hosts: Object.create(null),
      stats: { domains: 0, resolvers: 0, policies: 0, hosts: 0, rejected: 0 }
    }
  }

  // A hosts-only snapshot is an in-process capability, never a serialized
  // subscription option. Keep a bounded identity/content receipt so callers
  // cannot expand its active-node closure or forge a new snapshot at apply.
  var hostsOnlyReceipts = []

  function strictHostIps(value, snapshot) {
    var values = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : [])
    if (!values.length || values.length > NODE_DNS_HINT_LIMITS.values) { recordReject(snapshot); return null }
    var output = []
    for (var i = 0; i < values.length; i++) {
      if (typeof values[i] !== 'string' || values[i].length > NODE_DNS_HINT_LIMITS.stringLength) { recordReject(snapshot); return null }
      var rawIp = values[i].trim()
      if ((rawIp.indexOf('[') !== -1 || rawIp.indexOf(']') !== -1) && !isIPv6(rawIp)) { recordReject(snapshot); return null }
      var ip = unbracketIPv6(rawIp).toLowerCase()
      var ipv4 = isIPv4(ip) && ip.split('.').every(function(part) { return part === String(Number(part)) })
      var ipv6 = isIPv6(ip) && !/^:[^:]/.test(ip) && !/[^:]:$/.test(ip)
      if (ipv6 && ip.indexOf('.') !== -1) {
        var tail = ip.slice(ip.lastIndexOf(':') + 1)
        ipv6 = tail.indexOf('.') !== -1 && tail.split('.').every(function(part) { return part === String(Number(part)) })
      }
      if (!ipv4 && !ipv6) { recordReject(snapshot); return null }
      pushUnique(output, ip)
    }
    return output
  }

  function captureHostsOnly(sourceConfig, activeNodeServers, profile) {
    var snapshot = createSnapshot(profile)
    snapshot.hosts_only_version = 1
    var blocked = false
    if (isPlainObject(sourceConfig) && Array.isArray(activeNodeServers)) {
      if (activeNodeServers.length > NODE_DNS_HINT_LIMITS.activeNodeServers) blocked = true
      activeNodeServers.slice(0, NODE_DNS_HINT_LIMITS.activeNodeServers).forEach(function(server) {
        var domain = normaliseDomain(server)
        if (!domain || domain.indexOf('.') === -1) return
        if (snapshot.domains.indexOf(domain) !== -1) return
        if (snapshot.domains.length >= NODE_DNS_HINT_LIMITS.domains) { blocked = true; return }
        snapshot.domains.push(domain)
      })
      var sourceHosts = isPlainObject(sourceConfig.hosts) ? sourceConfig.hosts : Object.create(null)
      var scanned = 0
      for (var rawDomain in sourceHosts) {
        if (!hasOwn(sourceHosts, rawDomain)) continue
        scanned += 1
        if (scanned > NODE_DNS_HINT_LIMITS.sourceExactEntries) { blocked = true; break }
        var exactDomain = normaliseDomain(rawDomain)
        if (!exactDomain || snapshot.domains.indexOf(exactDomain) === -1) continue
        var values = strictHostIps(sourceHosts[rawDomain], snapshot)
        if (!values) continue
        if (hasOwn(snapshot.hosts, exactDomain) && !sameValues(snapshot.hosts[exactDomain], values)) { blocked = true; continue }
        if (!hasOwn(snapshot.hosts, exactDomain) && Object.keys(snapshot.hosts).length >= NODE_DNS_HINT_LIMITS.hosts) { blocked = true; continue }
        snapshot.hosts[exactDomain] = values
      }
    }
    if (blocked) { snapshot.hosts = Object.create(null); recordReject(snapshot) }
    snapshot.stats.domains = snapshot.domains.length
    snapshot.stats.hosts = Object.keys(snapshot.hosts).length
    hostsOnlyReceipts.push({ snapshot: snapshot, content: JSON.stringify(snapshot), blocked: blocked })
    if (hostsOnlyReceipts.length > NODE_DNS_HINT_LIMITS.hosts) hostsOnlyReceipts.shift()
    return snapshot
  }

  function validateHostsOnlySnapshot(snapshot) {
    var receipt = null
    for (var i = 0; i < hostsOnlyReceipts.length; i++) {
      if (hostsOnlyReceipts[i].snapshot === snapshot) receipt = hostsOnlyReceipts[i]
    }
    if (!receipt || receipt.blocked) return { ok: false, reason: 'invalid-snapshot' }
    var allowedFields = ['profile', 'domains', 'resolvers', 'policy', 'hosts', 'stats', 'hosts_only_version']
    for (var field in snapshot) { if (hasOwn(snapshot, field) && allowedFields.indexOf(field) === -1) return { ok: false, reason: 'invalid-snapshot' } }
    if (!Array.isArray(snapshot.domains) || snapshot.domains.length > NODE_DNS_HINT_LIMITS.domains || snapshot.domains.some(function(domain) { return typeof domain !== 'string' || normaliseDomain(domain) !== domain || domain.indexOf('.') === -1 })) return { ok: false, reason: 'invalid-snapshot' }
    if (snapshot.hosts_only_version !== 1 || !Array.isArray(snapshot.resolvers) || snapshot.resolvers.length || !isPlainObject(snapshot.stats)) return { ok: false, reason: 'invalid-snapshot' }
    for (var policyDomain in snapshot.policy) { if (hasOwn(snapshot.policy, policyDomain)) return { ok: false, reason: 'invalid-snapshot' } }
    for (var stat in snapshot.stats) { if (hasOwn(snapshot.stats, stat) && (['domains', 'resolvers', 'policies', 'hosts', 'rejected'].indexOf(stat) === -1 || typeof snapshot.stats[stat] !== 'number')) return { ok: false, reason: 'invalid-snapshot' } }
    var hostKeys = []
    for (var hostDomain in snapshot.hosts) { if (hasOwn(snapshot.hosts, hostDomain)) { if (hostKeys.length >= NODE_DNS_HINT_LIMITS.hosts) return { ok: false, reason: 'invalid-snapshot' }; hostKeys.push(hostDomain) } }
    for (var j = 0; j < hostKeys.length; j++) {
      var domain = hostKeys[j]
      var scratch = { stats: { rejected: 0 } }
      var values = strictHostIps(snapshot.hosts[domain], scratch)
      if (snapshot.domains.indexOf(domain) === -1 || normaliseDomain(domain) !== domain || domain.indexOf('.') === -1 || !values || !sameValues(values, snapshot.hosts[domain])) return { ok: false, reason: 'invalid-snapshot' }
    }
    try { if (JSON.stringify(snapshot) !== receipt.content) return { ok: false, reason: 'invalid-snapshot' } } catch (_) { return { ok: false, reason: 'invalid-snapshot' } }
    return { ok: true, policyKeys: [], hostKeys: hostKeys }
  }

  function addPolicy(snapshot, domain, values) {
    var newResolvers = []
    values.forEach(function(resolver) {
      var known = false
      for (var i = 0; i < snapshot.resolvers.length; i++) {
        if (resolverKey(snapshot.resolvers[i]) === resolverKey(resolver)) {
          known = true
          break
        }
      }
      if (!known) {
        for (var j = 0; j < newResolvers.length; j++) {
          if (resolverKey(newResolvers[j]) === resolverKey(resolver)) {
            known = true
            break
          }
        }
      }
      if (!known) newResolvers.push(resolver)
    })
    if (snapshot.resolvers.length + newResolvers.length > NODE_DNS_HINT_LIMITS.resolvers) {
      recordReject(snapshot, values.length)
      return false
    }
    snapshot.policy[domain] = values.slice()
    newResolvers.forEach(function(resolver) { snapshot.resolvers.push(resolver) })
    return true
  }

  function captureNodeDns(sourceConfig, activeNodeServers, runtimeProfile) {
    var profile = resolveProfile(runtimeProfile)
    if (profile.nodeDnsProjection === 'hosts-only') return captureHostsOnly(sourceConfig, activeNodeServers, profile)
    var snapshot = createSnapshot(profile)
    if (profile.nodeDnsProjection === 'off') return snapshot
    if (!sourceConfig || !Array.isArray(activeNodeServers)) return snapshot

    var servers = activeNodeServers.slice(0, NODE_DNS_HINT_LIMITS.activeNodeServers)
    if (activeNodeServers.length > NODE_DNS_HINT_LIMITS.activeNodeServers) recordReject(snapshot, activeNodeServers.length - NODE_DNS_HINT_LIMITS.activeNodeServers)
    servers.forEach(function(server) {
      var domain = normaliseDomain(server)
      if (!domain) return
      if (snapshot.domains.length >= NODE_DNS_HINT_LIMITS.domains) {
        recordReject(snapshot)
        return
      }
      pushUnique(snapshot.domains, domain)
    })
    snapshot.stats.domains = snapshot.domains.length
    if (!snapshot.domains.length) return snapshot

    var sourceDns = isPlainObject(sourceConfig.dns) ? sourceConfig.dns : Object.create(null)
    var sourceProxyResolvers = []
    if (profile.nodeDnsProjection === 'adaptive' && hasOwn(sourceDns, 'proxy-server-nameserver')) {
      sourceProxyResolvers = normaliseResolverList(sourceDns['proxy-server-nameserver'], snapshot)
    }
    var sourceNodePolicy = buildSourceView(sourceDns['proxy-server-nameserver-policy'], snapshot.domains, snapshot)
    var sourceGlobalPolicy = buildSourceView(sourceDns['nameserver-policy'], snapshot.domains, snapshot)

    snapshot.domains.forEach(function(domain) {
      if (Object.keys(snapshot.policy).length >= NODE_DNS_HINT_LIMITS.policies) {
        recordReject(snapshot)
        return
      }
      var selection = selectForDomain(sourceNodePolicy, domain, normaliseResolverList, snapshot)
      if (!selection.matched) selection = selectForDomain(sourceGlobalPolicy, domain, normaliseResolverList, snapshot)
      if (!selection.matched && profile.nodeDnsProjection === 'adaptive' && sourceProxyResolvers.length) {
        selection = { matched: true, value: sourceProxyResolvers.slice() }
      }
      if (!hasValues(selection.value)) return
      addPolicy(snapshot, domain, selection.value)
    })

    var hostTargets = []
    snapshot.resolvers.forEach(function(resolver) {
      var host = resolverHost(resolver)
      if (host) pushUnique(hostTargets, host)
    })
    Object.keys(snapshot.policy).forEach(function(domain) { pushUnique(hostTargets, domain) })
    var sourceHosts = buildSourceView(sourceConfig.hosts, hostTargets, snapshot)
    hostTargets.forEach(function(domain) {
      if (Object.keys(snapshot.hosts).length >= NODE_DNS_HINT_LIMITS.hosts) {
        recordReject(snapshot)
        return
      }
      var selection = selectForDomain(sourceHosts, domain, normaliseHostValues, snapshot)
      if (hasValues(selection.value)) snapshot.hosts[domain] = copyValue(selection.value)
    })

    snapshot.stats.resolvers = snapshot.resolvers.length
    snapshot.stats.policies = Object.keys(snapshot.policy).length
    snapshot.stats.hosts = Object.keys(snapshot.hosts).length
    return snapshot
  }

  function hasRepositoryPssBaseline(dns) {
    var values = dns && dns['proxy-server-nameserver']
    if (typeof values === 'string') return values.trim().length > 0
    return Array.isArray(values) && values.some(function(value) { return typeof value === 'string' && value.trim().length > 0 })
  }

  function buildReport(profile, snapshot, applied, reason) {
    var stats = snapshot && isPlainObject(snapshot.stats) ? snapshot.stats : {}
    return {
      profile: profile.id,
      mode: profile.nodeDnsProjection,
      applied: !!applied,
      reason: reason,
      domains: Number(stats.domains || 0),
      resolvers: Number(stats.resolvers || 0),
      policies: Number(stats.policies || 0),
      hosts: Number(stats.hosts || 0),
      rejected: Number(stats.rejected || 0)
    }
  }

  // captureNodeDns produces an opaque snapshot, but applyNodeDns still
  // validates its declared active-node domain closure before touching
  // repository-owned DNS. This keeps the public seam fail-closed if a future
  // Adapter passes a stale or hand-built object.
  function isCanonicalResolverValues(values) {
    if (!Array.isArray(values) || !values.length || values.length > NODE_DNS_HINT_LIMITS.values) return false
    var seen = Object.create(null)
    for (var i = 0; i < values.length; i++) {
      if (typeof values[i] !== 'string' || normaliseResolver(values[i]) !== values[i]) return false
      var key = resolverKey(values[i])
      if (seen[key]) return false
      seen[key] = true
    }
    return true
  }

  function isCanonicalHostValue(value) {
    var scratch = { stats: { rejected: 0 } }
    var normalised = normaliseHostValues(value, scratch)
    return scratch.stats.rejected === 0 && hasValues(normalised) && sameValues(normalised, value)
  }

  function validateSnapshot(snapshot, profile) {
    if (!snapshot || !isPlainObject(snapshot.policy) || !isPlainObject(snapshot.hosts)) return { ok: false, reason: 'invalid-snapshot' }
    if (snapshot.profile !== profile.id) return { ok: false, reason: 'profile-mismatch' }
    if (profile.nodeDnsProjection === 'hosts-only') return validateHostsOnlySnapshot(snapshot)
    if (hasOwn(snapshot, 'hosts_only_version') || hostsOnlyReceipts.some(function(receipt) { return receipt.snapshot === snapshot })) return { ok: false, reason: 'invalid-snapshot' }
    if (!Array.isArray(snapshot.domains) || snapshot.domains.length > NODE_DNS_HINT_LIMITS.domains) return { ok: false, reason: 'invalid-snapshot' }

    var activeDomains = Object.create(null)
    for (var domainIndex = 0; domainIndex < snapshot.domains.length; domainIndex++) {
      var activeDomain = snapshot.domains[domainIndex]
      if (typeof activeDomain !== 'string' || normaliseDomain(activeDomain) !== activeDomain || activeDomains[activeDomain]) {
        return { ok: false, reason: 'invalid-snapshot' }
      }
      activeDomains[activeDomain] = true
    }
    var policyKeys = []
    var allowedHostDomains = Object.create(null)
    for (var policyDomain in snapshot.policy) {
      if (!hasOwn(snapshot.policy, policyDomain)) continue
      if (policyKeys.length >= NODE_DNS_HINT_LIMITS.policies || !activeDomains[policyDomain] || normaliseDomain(policyDomain) !== policyDomain || !isCanonicalResolverValues(snapshot.policy[policyDomain])) {
        return { ok: false, reason: 'invalid-snapshot' }
      }
      policyKeys.push(policyDomain)
      allowedHostDomains[policyDomain] = true
      snapshot.policy[policyDomain].forEach(function(resolver) {
        var resolverDomain = resolverHost(resolver)
        if (resolverDomain) allowedHostDomains[resolverDomain] = true
      })
    }
    var hostKeys = []
    for (var hostDomain in snapshot.hosts) {
      if (!hasOwn(snapshot.hosts, hostDomain)) continue
      if (hostKeys.length >= NODE_DNS_HINT_LIMITS.hosts || !allowedHostDomains[hostDomain] || normaliseDomain(hostDomain) !== hostDomain || !isCanonicalHostValue(snapshot.hosts[hostDomain])) {
        return { ok: false, reason: 'invalid-snapshot' }
      }
      hostKeys.push(hostDomain)
    }
    return { ok: true, policyKeys: policyKeys, hostKeys: hostKeys }
  }

  function applyNodeDns(repositoryConfig, snapshot, runtimeProfile) {
    var profile = resolveProfile(runtimeProfile)
    if (profile.nodeDnsProjection === 'off') return buildReport(profile, snapshot, false, 'profile-off')
    if (!isPlainObject(repositoryConfig) || !isPlainObject(repositoryConfig.dns)) {
      return buildReport(profile, snapshot, false, 'invalid-repository-config')
    }
    if (!hasRepositoryPssBaseline(repositoryConfig.dns)) {
      return buildReport(profile, snapshot, false, 'missing-pss-baseline')
    }
    var validation = validateSnapshot(snapshot, profile)
    if (!validation.ok) return buildReport(profile, snapshot, false, validation.reason)
    var policyKeys = validation.policyKeys
    var hostKeys = validation.hostKeys
    if (!policyKeys.length && !hostKeys.length) return buildReport(profile, snapshot, false, 'no-hints')

    if (policyKeys.length) {
      repositoryConfig.dns['proxy-server-nameserver-policy'] = Object.create(null)
      policyKeys.forEach(function(domain) { repositoryConfig.dns['proxy-server-nameserver-policy'][domain] = snapshot.policy[domain].slice() })
    } else if (profile.nodeDnsProjection !== 'hosts-only') {
      delete repositoryConfig.dns['proxy-server-nameserver-policy']
    }
    if (!isPlainObject(repositoryConfig.hosts)) repositoryConfig.hosts = Object.create(null)
    hostKeys.forEach(function(domain) {
      if (profile.nodeDnsProjection === 'hosts-only' && Object.keys(repositoryConfig.hosts).some(function(key) { var pattern = normalisePattern(key); return pattern && patternMatches(pattern, domain) })) return
      if (!hasOwn(repositoryConfig.hosts, domain)) repositoryConfig.hosts[domain] = copyValue(snapshot.hosts[domain])
    })
    return buildReport(profile, snapshot, true, 'applied')
  }

  return {
    captureNodeDns: captureNodeDns,
    applyNodeDns: applyNodeDns,
    resolveProfile: resolveProfile
  }
}())
