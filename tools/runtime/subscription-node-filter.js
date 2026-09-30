// Shared browser-safe runtime. Embedded verbatim in the three JS overwrite adapters.
var SckiSubscriptionNodeFilter = (function() {
  'use strict'

  var INFO_TEXT = ['导航网址', '距离下次重置', '剩余流量', '套餐到期', '网址导航', '官网', '订阅', '到期', '剩余', '重置', '免费', '试用', '应急', '已用流量', '到期时间', '下次重置']
  var INFO_RE = /\b(?:USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Sign|Login|Register|Help|FAQ)\b/i
  var DIALER_BUILTIN = ['DIRECT', 'REJECT', 'REJECT-DROP', 'PASS', 'COMPATIBLE']
  var RESERVED_BUILTIN = DIALER_BUILTIN.concat(['GLOBAL'])
  var NUMBER = '(?:[0-9]+(?:\\.[0-9]+)?)'
  var LEFT = '(^|[\\s|/\\(\\)\\[\\]{}【】（）,，;；:_·｜])'
  var RIGHT = '(?=$|[\\s|/\\(\\)\\[\\]{}【】（）,，;；:_·｜])'
  // The delimiter excludes dots and hyphens so IPs, ports and negative values cannot look like rates.
  var RATE_RE = new RegExp(LEFT + '(?:[xX×]\\s*(' + NUMBER + ')|(' + NUMBER + ')\\s*[xX×倍]|倍率\\s*(' + NUMBER + '))' + RIGHT, 'g')
  var UNKNOWN_RATE_RE = new RegExp(LEFT + '(?:[xX×]\\s*(?:\\?|未知|unknown|nan|∞)|\\?\\s*[xX×倍]|倍率\\s*(?:\\?|未知|unknown|nan|∞))' + RIGHT, 'i')

  function isInfoNode(name) {
    if (typeof name !== 'string') return false
    for (var i = 0; i < INFO_TEXT.length; i++) if (name.indexOf(INFO_TEXT[i]) !== -1) return true
    return INFO_RE.test(name)
  }

  function multiplier(name) {
    if (UNKNOWN_RATE_RE.test(name)) return null
    RATE_RE.lastIndex = 0
    var values = []
    var match
    while ((match = RATE_RE.exec(name)) !== null) {
      var value = Number(match[2] || match[3] || match[4])
      if (!Number.isFinite(value) || value <= 0) return null
      values.push(value)
    }
    if (!values.length) return null
    for (var i = 1; i < values.length; i++) if (values[i] !== values[0]) return null
    return values[0]
  }

  function canonical(value, stack, depth) {
    if (depth > 32) throw new Error('invalid-node-shape')
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
    if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value)
    if (!value || typeof value !== 'object' || stack.indexOf(value) !== -1) throw new Error('invalid-node-shape')
    stack.push(value)
    var result
    if (Array.isArray(value)) {
      result = '[' + value.map(function(item) { return canonical(item, stack, depth + 1) }).join(',') + ']'
    } else {
      if (Object.prototype.toString.call(value) !== '[object Object]') throw new Error('invalid-node-shape')
      var keys = Object.keys(value).sort()
      result = '{' + keys.map(function(key) { return JSON.stringify(key) + ':' + canonical(value[key], stack, depth + 1) }).join(',') + '}'
    }
    stack.pop()
    return result
  }

  function preflight(config, reservedNames, maxMultiplier) {
    try {
      var providers = config['proxy-providers']
      if (providers !== undefined && providers !== null && (typeof providers !== 'object' || Array.isArray(providers) || Object.keys(providers).length > 0)) {
        return { ok: false, reason: 'provider-input' }
      }
      if (maxMultiplier !== null && (typeof maxMultiplier !== 'number' || !Number.isFinite(maxMultiplier) || maxMultiplier <= 0)) {
        return { ok: false, reason: 'invalid-multiplier-limit' }
      }
      if (!Array.isArray(config.proxies)) return { ok: false, reason: 'no-explicit-nodes' }
      var reserved = Object.create(null)
      RESERVED_BUILTIN.concat(reservedNames).forEach(function(name) { reserved[name] = true })
      var seen = Object.create(null)
      var unique = []
      var duplicates = 0
      for (var i = 0; i < config.proxies.length; i++) {
        var proxy = config.proxies[i]
        if (!proxy || Object.prototype.toString.call(proxy) !== '[object Object]' ||
            typeof proxy.name !== 'string' || !proxy.name.trim() ||
            typeof proxy.type !== 'string' || !proxy.type.trim() ||
            (proxy.flow !== undefined && typeof proxy.flow !== 'string')) return { ok: false, reason: 'invalid-node-shape' }
        if (reserved[proxy.name]) return { ok: false, reason: 'reserved-name' }
        var fingerprint = canonical(proxy, [], 0)
        if (Object.prototype.hasOwnProperty.call(seen, proxy.name)) {
          if (seen[proxy.name] !== fingerprint) return { ok: false, reason: 'duplicate-name-conflict' }
          duplicates++
          continue
        }
        seen[proxy.name] = fingerprint
        unique.push(proxy)
      }
      var limit = maxMultiplier
      var kept = []
      var removedInfo = 0
      var removedRate = 0
      for (var j = 0; j < unique.length; j++) {
        var item = unique[j]
        if (isInfoNode(item.name)) { removedInfo++; continue }
        var rate = limit === null ? null : multiplier(item.name)
        if (rate !== null && rate > limit) { removedRate++; continue }
        kept.push(item)
      }
      var keptNames = Object.create(null)
      kept.forEach(function(item) { keptNames[item.name] = true })
      DIALER_BUILTIN.forEach(function(name) { keptNames[name] = true })
      var dialerTargets = Object.create(null)
      for (var k = 0; k < kept.length; k++) {
        var dialer = kept[k]['dialer-proxy']
        if (dialer !== undefined && (typeof dialer !== 'string' || !keptNames[dialer])) return { ok: false, reason: 'dialer-dependency' }
        if (dialer !== undefined) dialerTargets[kept[k].name] = dialer
      }
      // Each node is marked once; iterative traversal avoids recursion limits on large subscriptions.
      var dialerState = Object.create(null)
      for (var n = 0; n < kept.length; n++) {
        var cursor = kept[n].name
        var path = []
        while (cursor && dialerState[cursor] !== 2) {
          if (dialerState[cursor] === 1) return { ok: false, reason: 'dialer-cycle' }
          dialerState[cursor] = 1
          path.push(cursor)
          cursor = dialerTargets[cursor]
        }
        for (var p = 0; p < path.length; p++) dialerState[path[p]] = 2
      }
      return { ok: true, proxies: kept, duplicates: duplicates, removedInfo: removedInfo, removedRate: removedRate }
    } catch (_) {
      return { ok: false, reason: 'invalid-node-shape' }
    }
  }

  return { isInfoNode: isInfoNode, multiplier: multiplier, preflight: preflight }
})()
