# Subscription Adapter Module — embedded verbatim into OpenClash Ruby adapters.
#
# Interface:
#   SckiSubscriptionAdapter.capture_node_dns(source, active_servers, profile)
#   SckiSubscriptionAdapter.apply_node_dns(repository, snapshot, profile)
#
# The generated profile fragment supplies SckiSubscriptionAdapterProfiles.

module SckiSubscriptionAdapter
  module_function

  NODE_DNS_HINT_LIMITS = {
    active_node_servers: 512,
    domains: 128,
    resolvers: 64,
    policies: 64,
    hosts: 64,
    values: 8,
    source_entries: 256,
    source_exact_entries: 4096,
    string_length: 512,
  }.freeze

  def plain_hash?(value)
    value.is_a?(Hash)
  end

  def record_reject(snapshot, count = 1)
    snapshot.fetch("stats")["rejected"] += count
  end

  def push_unique(list, value)
    return false if list.any? { |entry| yield(entry) == yield(value) }

    list << value
    true
  end

  def ipv4?(value)
    parts = value.to_s.split(".")
    return false unless parts.length == 4

    parts.all? { |part| part.match?(/\A\d{1,3}\z/) && part.to_i.between?(0, 255) }
  end

  def ipv6?(value)
    text = value.to_s
    match = text.match(/\A\[([0-9a-fA-F:.]+)\]\z/)
    text = match[1] if match
    return false if text.empty? || !text.match?(/\A[0-9a-fA-F:.]+\z/) || !text.include?(":") || text.include?(":::")

    last_colon = text.rindex(":")
    ipv4_tail = last_colon ? text[(last_colon + 1)..] : ""
    if ipv4_tail.include?(".")
      return false unless ipv4?(ipv4_tail)

      text = "#{text[0..last_colon]}0:0"
    end

    compressed_at = text.index("::")
    return false if compressed_at && text.index("::", compressed_at + 2)

    groups = text.split(":").reject(&:empty?)
    return false unless groups.all? { |group| group.match?(/\A[0-9a-fA-F]{1,4}\z/) }

    compressed_at ? groups.length < 8 : groups.length == 8
  end

  def unbracket_ipv6(value)
    text = value.to_s
    text.start_with?("[") && text.end_with?("]") ? text[1..-2] : text
  end

  def normalize_domain(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    domain = value.strip.downcase.sub(/\.+\z/, "")
    return "" if domain.empty? || domain.length > NODE_DNS_HINT_LIMITS[:string_length] || domain.length > 253 || domain.match?(/[\x00-\x20\\\/@:?#\[\]]/)
    return "" if domain == "localhost" || domain.match?(/\A\d+(?:\.\d+){3}\z/)

    labels = domain.split(".")
    return "" unless labels.all? { |label| label.match?(/\A[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\z/) }

    domain
  end

  def normalize_resolver(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    resolver = value.strip
    return "" if resolver.empty? || resolver.length > NODE_DNS_HINT_LIMITS[:string_length] || resolver.match?(/[\x00-\x20]/)
    return "" if resolver.include?("#") || resolver.match?(/\A(?:system|dhcp)\z/i) || resolver.match?(/\Arcode:/i)
    return "" if resolver.match?(/[?&](?:skip-cert-verify|ecs|h3)=/i)
    return resolver.downcase if ipv4?(resolver)
    return unbracket_ipv6(resolver).downcase if ipv6?(resolver)

    raw_domain = normalize_domain(resolver)
    return raw_domain unless raw_domain.empty?

    match = resolver.match(/\A(udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::(\d{1,5}))?(\/[^\s]*)?\z/i)
    return "" unless match

    port = match[3]&.to_i
    return "" if port && !port.between?(1, 65_535)

    host = match[2]
    host = unbracket_ipv6(host).downcase if ipv6?(host)
    unless ipv6?(host) || ipv4?(host)
      host = normalize_domain(host)
      return "" if host.empty?
    end
    "#{match[1].downcase}://#{host}#{match[3] ? ":#{match[3]}" : ""}#{match[4] || ""}"
  end

  def resolver_host(value)
    resolver = value.to_s
    return "" if ipv4?(resolver) || ipv6?(resolver)

    raw_domain = normalize_domain(resolver)
    return raw_domain unless raw_domain.empty?

    match = resolver.match(/\A(?:udp|tcp|tls|https|quic):\/\/(\[[0-9a-fA-F:.]+\]|[A-Za-z0-9.-]+)(?::\d{1,5})?(?:\/[^\s]*)?\z/i)
    return "" unless match
    return "" if ipv4?(match[1]) || ipv6?(match[1])

    normalize_domain(match[1])
  end

  def normalize_resolver_list(value, snapshot)
    raw_values = value.is_a?(Array) ? value : (value.is_a?(String) ? [value] : [])
    unless value.is_a?(Array) || value.is_a?(String)
      record_reject(snapshot)
      return []
    end

    output = []
    raw_values.take(NODE_DNS_HINT_LIMITS[:values]).each do |entry|
      resolver = normalize_resolver(entry)
      if resolver.empty?
        record_reject(snapshot)
        next
      end
      # normalize_resolver lower-cases only scheme and hostname. Keep URL
      # path/query exact because they can be case-sensitive.
      push_unique(output, resolver) { |item| item }
    end
    record_reject(snapshot, raw_values.length - NODE_DNS_HINT_LIMITS[:values]) if raw_values.length > NODE_DNS_HINT_LIMITS[:values]
    output
  end

  def normalize_host_values(value, snapshot)
    raw_values = value.is_a?(Array) ? value : (value.is_a?(String) ? [value] : [])
    unless value.is_a?(Array) || value.is_a?(String)
      record_reject(snapshot)
      return nil
    end

    ip_values = []
    redirects = []
    raw_values.take(NODE_DNS_HINT_LIMITS[:values]).each do |entry|
      unless entry.is_a?(String)
        record_reject(snapshot)
        next
      end
      if entry.length > NODE_DNS_HINT_LIMITS[:string_length]
        record_reject(snapshot)
        next
      end
      host = entry.strip
      ipv6_literal = ipv6?(host)
      # IPv6 literals may be bracketed. Other URL/control syntax is rejected.
      if host.empty? || host.length > NODE_DNS_HINT_LIMITS[:string_length] || (!ipv6_literal && host.match?(/[\x00-\x20\\\/@?#\[\]]/))
        record_reject(snapshot)
        next
      end
      if ipv6_literal
        host = unbracket_ipv6(host).downcase
        push_unique(ip_values, host) { |item| item.downcase }
      elsif ipv4?(host)
        push_unique(ip_values, host) { |item| item.downcase }
      else
        host = normalize_domain(host)
        if host.empty?
          record_reject(snapshot)
          next
        end
        push_unique(redirects, host) { |item| item.downcase }
      end
    end
    record_reject(snapshot, raw_values.length - NODE_DNS_HINT_LIMITS[:values]) if raw_values.length > NODE_DNS_HINT_LIMITS[:values]
    if redirects.any?
      return redirects.first if redirects.length == 1 && ip_values.empty?

      record_reject(snapshot)
      return nil
    end
    ip_values.any? ? ip_values : nil
  end

  def normalize_pattern(value)
    return "" unless value.is_a?(String)
    return "" if value.length > NODE_DNS_HINT_LIMITS[:string_length]

    pattern = value.strip.downcase.sub(/\.+\z/, "")
    return "" if pattern.empty? || pattern.length > 253 || pattern.match?(/[\x00-\x20\\\/@:?#\[\]]/) || pattern == "*"
    return normalize_domain(pattern[2..]).empty? ? "" : pattern if pattern.start_with?("+.")
    return normalize_domain(pattern[1..]).empty? ? "" : pattern if pattern.start_with?(".")

    if pattern.include?("*")
      labels = pattern.split(".")
      return "" if labels.length < 2
      return "" unless labels.all? { |label| label == "*" || label.match?(/\A[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\z/) }

      return pattern
    end
    normalize_domain(pattern)
  end

  def pattern_matches?(pattern, domain)
    if pattern.start_with?("+.")
      base = pattern[2..]
      return domain == base || domain.end_with?(".#{base}")
    end
    if pattern.start_with?(".")
      base = pattern[1..]
      return domain != base && domain.end_with?(".#{base}")
    end
    if pattern.include?("*")
      pattern_labels = pattern.split(".")
      domain_labels = domain.split(".")
      return false unless pattern_labels.length == domain_labels.length

      return pattern_labels.zip(domain_labels).all? { |expected, actual| expected == "*" || expected == actual }
    end
    pattern == domain
  end

  def pattern_score(pattern)
    return 3_000 + (pattern.split(".").length * 10) + pattern.delete("*").length if pattern.include?("*")
    return 2_000 + pattern.length if pattern.start_with?("+.") || pattern.start_with?(".")

    10_000 + pattern.length
  end

  def same_values?(left, right)
    if left.is_a?(Array) || right.is_a?(Array)
      return false unless left.is_a?(Array) && right.is_a?(Array) && left.length == right.length

      return left.zip(right).all? { |a, b| a.to_s == b.to_s }
    end
    left.is_a?(String) && right.is_a?(String) && left == right
  end

  def has_values?(value)
    value.is_a?(Array) ? value.any? : (value.is_a?(String) && !value.empty?)
  end

  def copy_value(value)
    value.is_a?(Array) ? value.dup : value
  end

  def exact_pattern?(pattern)
    !pattern.include?("*") && !pattern.start_with?("+.") && !pattern.start_with?(".")
  end

  def build_source_view(source, active_domains, snapshot)
    return {} unless plain_hash?(source)

    view = {}
    active = {}
    active_domains.each do |domain|
      active[domain] = true
      view[domain] = source[domain] if source.key?(domain)
      dotted = "#{domain}."
      view[dotted] = source[dotted] if source.key?(dotted) && !view.key?(dotted)
    end
    # Avoid source.keys: it allocates the whole untrusted map before a cap can
    # take effect. The wider bounded pass preserves case-insensitive exact
    # active-node keys; wildcard matching remains on the tighter cap.
    scanned_entries = 0
    wildcard_entries = 0
    source.each_pair do |raw_pattern, raw_value|
      scanned_entries += 1
      if scanned_entries > NODE_DNS_HINT_LIMITS[:source_exact_entries]
        record_reject(snapshot)
        break
      end
      pattern = normalize_pattern(raw_pattern)
      if pattern.empty?
        record_reject(snapshot)
        next
      end
      if exact_pattern?(pattern)
        view[raw_pattern] = raw_value if active[pattern]
        next
      end
      if wildcard_entries >= NODE_DNS_HINT_LIMITS[:source_entries]
        record_reject(snapshot)
        next
      end
      wildcard_entries += 1

      view[raw_pattern] = raw_value
    end
    view
  end

  def select_for_domain(source, domain, snapshot)
    return { "matched" => false, "value" => nil } unless plain_hash?(source)

    best = nil
    best_score = -1
    conflict = false
    matched = false
    source.each do |raw_pattern, raw_value|
      pattern = normalize_pattern(raw_pattern)
      next if pattern.empty? || !pattern_matches?(pattern, domain)

      matched = true
      values = yield(raw_value, snapshot)
      next unless has_values?(values)

      score = pattern_score(pattern)
      if score > best_score
        best = copy_value(values)
        best_score = score
        conflict = false
      elsif score == best_score && !same_values?(best, values)
        conflict = true
      end
    end
    if conflict
      record_reject(snapshot)
      return { "matched" => true, "value" => nil }
    end
    { "matched" => matched, "value" => best }
  end

  def resolve_profile(runtime_profile)
    requested = if runtime_profile.is_a?(String)
                  runtime_profile
                elsif plain_hash?(runtime_profile) && runtime_profile["id"].is_a?(String)
                  runtime_profile["id"]
                else
                  ""
                end
    SckiSubscriptionAdapterProfiles.resolve(requested)
  end

  def create_snapshot(profile)
    {
      "profile" => profile.fetch("id"),
      "domains" => [],
      "resolvers" => [],
      "policy" => {},
      "hosts" => {},
      "stats" => { "domains" => 0, "resolvers" => 0, "policies" => 0, "hosts" => 0, "rejected" => 0 },
    }
  end

  def add_policy(snapshot, domain, values)
    new_resolvers = []
    values.each do |resolver|
      known = snapshot.fetch("resolvers").any? { |entry| entry == resolver } || new_resolvers.any? { |entry| entry == resolver }
      new_resolvers << resolver unless known
    end
    if snapshot.fetch("resolvers").length + new_resolvers.length > NODE_DNS_HINT_LIMITS[:resolvers]
      record_reject(snapshot, values.length)
      return false
    end
    snapshot.fetch("policy")[domain] = values.dup
    snapshot.fetch("resolvers").concat(new_resolvers)
    true
  end

  # Object identity plus a bounded content receipt keeps this local capability
  # out of serialized subscription data and prevents closure expansion.
  def strict_host_ips(value, snapshot)
    values = value.is_a?(Array) ? value : (value.is_a?(String) ? [value] : [])
    if values.empty? || values.length > NODE_DNS_HINT_LIMITS[:values]
      record_reject(snapshot)
      return nil
    end
    output = []
    values.each do |entry|
      unless entry.is_a?(String) && entry.length <= NODE_DNS_HINT_LIMITS[:string_length]
        record_reject(snapshot)
        return nil
      end
      raw_ip = entry.strip
      if (raw_ip.include?('[') || raw_ip.include?(']')) && !ipv6?(raw_ip)
        record_reject(snapshot)
        return nil
      end
      ip = unbracket_ipv6(raw_ip).downcase
      ipv4 = ipv4?(ip) && ip.split('.').all? { |part| part == part.to_i.to_s }
      ipv6 = ipv6?(ip) && !ip.match?(/\A:[^:]/) && !ip.match?(/[^:]:\z/)
      if ipv6 && ip.include?('.')
        tail = ip[(ip.rindex(':') + 1)..]
        ipv6 = tail.include?('.') && tail.split('.').all? { |part| part == part.to_i.to_s }
      end
      unless ipv4 || ipv6
        record_reject(snapshot)
        return nil
      end
      push_unique(output, ip) { |item| item }
    end
    output
  end

  def capture_hosts_only(source_config, active_node_servers, profile)
    snapshot = create_snapshot(profile)
    snapshot['hosts_only_version'] = 1
    blocked = false
    if plain_hash?(source_config) && active_node_servers.is_a?(Array)
      blocked = true if active_node_servers.length > NODE_DNS_HINT_LIMITS[:active_node_servers]
      active_node_servers.take(NODE_DNS_HINT_LIMITS[:active_node_servers]).each do |server|
        domain = normalize_domain(server)
        next if domain.empty? || !domain.include?('.') || snapshot['domains'].include?(domain)
        if snapshot['domains'].length >= NODE_DNS_HINT_LIMITS[:domains]
          blocked = true
          next
        end
        snapshot['domains'] << domain
      end
      source_hosts = plain_hash?(source_config['hosts']) ? source_config['hosts'] : {}
      scanned = 0
      source_hosts.each_pair do |raw_domain, raw_value|
        scanned += 1
        if scanned > NODE_DNS_HINT_LIMITS[:source_exact_entries]
          blocked = true
          break
        end
        domain = normalize_domain(raw_domain)
        next if domain.empty? || !snapshot['domains'].include?(domain)
        values = strict_host_ips(raw_value, snapshot)
        next unless values
        if snapshot['hosts'].key?(domain) && !same_values?(snapshot['hosts'][domain], values)
          blocked = true
          next
        end
        if !snapshot['hosts'].key?(domain) && snapshot['hosts'].length >= NODE_DNS_HINT_LIMITS[:hosts]
          blocked = true
          next
        end
        snapshot['hosts'][domain] = values
      end
    end
    if blocked
      snapshot['hosts'] = {}
      record_reject(snapshot)
    end
    snapshot['stats']['domains'] = snapshot['domains'].length
    snapshot['stats']['hosts'] = snapshot['hosts'].length
    @hosts_only_receipts ||= []
    @hosts_only_receipts << { snapshot: snapshot, content: Marshal.dump(snapshot), blocked: blocked }
    @hosts_only_receipts.shift if @hosts_only_receipts.length > NODE_DNS_HINT_LIMITS[:hosts]
    snapshot
  end

  def validate_hosts_only_snapshot(snapshot)
    receipt = (@hosts_only_receipts || []).find { |entry| entry[:snapshot].equal?(snapshot) }
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless receipt && !receipt[:blocked]
    fields = %w[profile domains resolvers policy hosts stats hosts_only_version]
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless snapshot.each_key.all? { |key| fields.include?(key) }
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless snapshot['domains'].is_a?(Array) && snapshot['domains'].length <= NODE_DNS_HINT_LIMITS[:domains] && snapshot['domains'].all? { |domain| domain.is_a?(String) && normalize_domain(domain) == domain && domain.include?('.') }
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless snapshot['hosts_only_version'] == 1 && snapshot['resolvers'].is_a?(Array) && snapshot['resolvers'].empty? && snapshot['policy'].empty? && plain_hash?(snapshot['stats'])
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless snapshot['stats'].all? { |key, value| %w[domains resolvers policies hosts rejected].include?(key) && value.is_a?(Numeric) }
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } if snapshot['hosts'].length > NODE_DNS_HINT_LIMITS[:hosts]
    host_keys = snapshot['hosts'].keys
    host_keys.each do |domain|
      scratch = { 'stats' => { 'rejected' => 0 } }
      values = strict_host_ips(snapshot['hosts'][domain], scratch)
      return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless snapshot['domains'].include?(domain) && normalize_domain(domain) == domain && domain.include?('.') && values && same_values?(values, snapshot['hosts'][domain])
    end
    begin
      return { 'ok' => false, 'reason' => 'invalid-snapshot' } unless Marshal.dump(snapshot) == receipt[:content]
    rescue StandardError
      return { 'ok' => false, 'reason' => 'invalid-snapshot' }
    end
    { 'ok' => true, 'policy_keys' => [], 'host_keys' => host_keys }
  end

  def capture_node_dns(source_config, active_node_servers, runtime_profile)
    profile = resolve_profile(runtime_profile)
    return capture_hosts_only(source_config, active_node_servers, profile) if profile.fetch('node_dns_projection') == 'hosts-only'
    snapshot = create_snapshot(profile)
    return snapshot if profile.fetch("node_dns_projection") == "off"
    return snapshot unless source_config.is_a?(Hash) && active_node_servers.is_a?(Array)

    servers = active_node_servers.take(NODE_DNS_HINT_LIMITS[:active_node_servers])
    record_reject(snapshot, active_node_servers.length - NODE_DNS_HINT_LIMITS[:active_node_servers]) if active_node_servers.length > NODE_DNS_HINT_LIMITS[:active_node_servers]
    servers.each do |server|
      domain = normalize_domain(server)
      next if domain.empty?
      if snapshot.fetch("domains").length >= NODE_DNS_HINT_LIMITS[:domains]
        record_reject(snapshot)
        next
      end
      push_unique(snapshot.fetch("domains"), domain) { |item| item }
    end
    snapshot.fetch("stats")["domains"] = snapshot.fetch("domains").length
    return snapshot if snapshot.fetch("domains").empty?

    source_dns = plain_hash?(source_config["dns"]) ? source_config["dns"] : {}
    source_proxy_resolvers = profile.fetch("node_dns_projection") == "adaptive" && source_dns.key?("proxy-server-nameserver") ? normalize_resolver_list(source_dns["proxy-server-nameserver"], snapshot) : []
    source_node_policy = build_source_view(source_dns["proxy-server-nameserver-policy"], snapshot.fetch("domains"), snapshot)
    source_global_policy = build_source_view(source_dns["nameserver-policy"], snapshot.fetch("domains"), snapshot)

    snapshot.fetch("domains").each do |domain|
      if snapshot.fetch("policy").length >= NODE_DNS_HINT_LIMITS[:policies]
        record_reject(snapshot)
        next
      end
      selection = select_for_domain(source_node_policy, domain, snapshot) { |value, state| normalize_resolver_list(value, state) }
      selection = select_for_domain(source_global_policy, domain, snapshot) { |value, state| normalize_resolver_list(value, state) } unless selection.fetch("matched")
      if !selection.fetch("matched") && profile.fetch("node_dns_projection") == "adaptive" && source_proxy_resolvers.any?
        selection = { "matched" => true, "value" => source_proxy_resolvers.dup }
      end
      next unless has_values?(selection.fetch("value"))

      add_policy(snapshot, domain, selection.fetch("value"))
    end

    host_targets = []
    snapshot.fetch("resolvers").each do |resolver|
      host = resolver_host(resolver)
      push_unique(host_targets, host) { |item| item } unless host.empty?
    end
    snapshot.fetch("policy").keys.each { |domain| push_unique(host_targets, domain) { |item| item } }
    source_hosts = build_source_view(source_config["hosts"], host_targets, snapshot)
    host_targets.each do |domain|
      if snapshot.fetch("hosts").length >= NODE_DNS_HINT_LIMITS[:hosts]
        record_reject(snapshot)
        next
      end
      selection = select_for_domain(source_hosts, domain, snapshot) { |value, state| normalize_host_values(value, state) }
      snapshot.fetch("hosts")[domain] = copy_value(selection.fetch("value")) if has_values?(selection.fetch("value"))
    end

    snapshot.fetch("stats")["resolvers"] = snapshot.fetch("resolvers").length
    snapshot.fetch("stats")["policies"] = snapshot.fetch("policy").length
    snapshot.fetch("stats")["hosts"] = snapshot.fetch("hosts").length
    snapshot
  end

  def repository_pss_baseline?(dns)
    values = dns && dns["proxy-server-nameserver"]
    return values.strip.length.positive? if values.is_a?(String)

    values.is_a?(Array) && values.any? { |value| value.is_a?(String) && value.strip.length.positive? }
  end

  def build_report(profile, snapshot, applied, reason)
    stats = snapshot.is_a?(Hash) && plain_hash?(snapshot["stats"]) ? snapshot["stats"] : {}
    {
      "profile" => profile.fetch("id"),
      "mode" => profile.fetch("node_dns_projection"),
      "applied" => !!applied,
      "reason" => reason,
      "domains" => stats.fetch("domains", 0).to_i,
      "resolvers" => stats.fetch("resolvers", 0).to_i,
      "policies" => stats.fetch("policies", 0).to_i,
      "hosts" => stats.fetch("hosts", 0).to_i,
      "rejected" => stats.fetch("rejected", 0).to_i,
    }
  end

  # capture_node_dns produces an opaque snapshot, but apply_node_dns validates
  # its declared active-node domain closure before mutating repository-owned
  # DNS. This keeps the public seam fail-closed if a future Adapter passes a
  # stale or hand-built Hash.
  def canonical_resolver_values?(values)
    return false unless values.is_a?(Array) && values.any? && values.length <= NODE_DNS_HINT_LIMITS[:values]

    seen = {}
    values.each do |value|
      return false unless value.is_a?(String) && normalize_resolver(value) == value
      return false if seen[value]

      seen[value] = true
    end
    true
  end

  def canonical_host_value?(value)
    scratch = { "stats" => { "rejected" => 0 } }
    normalized = normalize_host_values(value, scratch)
    scratch.fetch("stats").fetch("rejected").zero? && has_values?(normalized) && same_values?(normalized, value)
  end

  def validate_snapshot(snapshot, profile)
    return { "ok" => false, "reason" => "invalid-snapshot" } unless plain_hash?(snapshot) && plain_hash?(snapshot["policy"]) && plain_hash?(snapshot["hosts"])
    return { "ok" => false, "reason" => "profile-mismatch" } unless snapshot["profile"] == profile.fetch("id")
    return validate_hosts_only_snapshot(snapshot) if profile.fetch('node_dns_projection') == 'hosts-only'
    return { 'ok' => false, 'reason' => 'invalid-snapshot' } if snapshot.key?('hosts_only_version') || (@hosts_only_receipts || []).any? { |receipt| receipt[:snapshot].equal?(snapshot) }
    return { "ok" => false, "reason" => "invalid-snapshot" } unless snapshot["domains"].is_a?(Array) && snapshot.fetch("domains").length <= NODE_DNS_HINT_LIMITS[:domains]

    active_domains = {}
    snapshot.fetch("domains").each do |active_domain|
      return { "ok" => false, "reason" => "invalid-snapshot" } unless active_domain.is_a?(String) && normalize_domain(active_domain) == active_domain && !active_domains[active_domain]

      active_domains[active_domain] = true
    end

    policy_keys = []
    allowed_host_domains = {}
    snapshot.fetch("policy").each_pair do |domain, values|
      return { "ok" => false, "reason" => "invalid-snapshot" } if policy_keys.length >= NODE_DNS_HINT_LIMITS[:policies] || !active_domains[domain] || normalize_domain(domain) != domain || !canonical_resolver_values?(values)

      policy_keys << domain
      allowed_host_domains[domain] = true
      values.each do |resolver|
        resolver_domain = resolver_host(resolver)
        allowed_host_domains[resolver_domain] = true unless resolver_domain.empty?
      end
    end
    host_keys = []
    snapshot.fetch("hosts").each_pair do |domain, value|
      return { "ok" => false, "reason" => "invalid-snapshot" } if host_keys.length >= NODE_DNS_HINT_LIMITS[:hosts] || !allowed_host_domains[domain] || normalize_domain(domain) != domain || !canonical_host_value?(value)

      host_keys << domain
    end
    { "ok" => true, "policy_keys" => policy_keys, "host_keys" => host_keys }
  end

  def apply_node_dns(repository_config, snapshot, runtime_profile)
    profile = resolve_profile(runtime_profile)
    return build_report(profile, snapshot, false, "profile-off") if profile.fetch("node_dns_projection") == "off"
    return build_report(profile, snapshot, false, "invalid-repository-config") unless plain_hash?(repository_config) && plain_hash?(repository_config["dns"])
    return build_report(profile, snapshot, false, "missing-pss-baseline") unless repository_pss_baseline?(repository_config["dns"])
    validation = validate_snapshot(snapshot, profile)
    return build_report(profile, snapshot, false, validation.fetch("reason")) unless validation.fetch("ok")

    policy_keys = validation.fetch("policy_keys")
    host_keys = validation.fetch("host_keys")
    return build_report(profile, snapshot, false, "no-hints") if policy_keys.empty? && host_keys.empty?

    if policy_keys.any?
      repository_config.fetch("dns")["proxy-server-nameserver-policy"] = {}
      policy_keys.each { |domain| repository_config.fetch("dns")["proxy-server-nameserver-policy"][domain] = snapshot.fetch("policy").fetch(domain).dup }
    elsif profile.fetch('node_dns_projection') != 'hosts-only'
      repository_config.fetch("dns").delete("proxy-server-nameserver-policy")
    end
    repository_config["hosts"] = {} unless plain_hash?(repository_config["hosts"])
    host_keys.each do |domain|
      next if profile.fetch('node_dns_projection') == 'hosts-only' && repository_config.fetch('hosts').keys.any? { |key| pattern = normalize_pattern(key); !pattern.empty? && pattern_matches?(pattern, domain) }
      repository_config.fetch("hosts")[domain] = copy_value(snapshot.fetch("hosts").fetch(domain)) unless repository_config.fetch("hosts").key?(domain)
    end
    build_report(profile, snapshot, true, "applied")
  end

  private_class_method :plain_hash?, :record_reject, :push_unique, :ipv4?, :ipv6?, :unbracket_ipv6,
                       :normalize_domain, :normalize_resolver, :resolver_host, :normalize_resolver_list,
                       :normalize_host_values, :normalize_pattern, :pattern_matches?, :pattern_score,
                       :same_values?, :has_values?, :copy_value, :exact_pattern?, :build_source_view,
                       :select_for_domain, :create_snapshot, :add_policy, :repository_pss_baseline?, :build_report,
                       :canonical_resolver_values?, :canonical_host_value?, :validate_snapshot,
                       :strict_host_ips, :capture_hosts_only, :validate_hosts_only_snapshot
end
