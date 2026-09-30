# Subscription node validation and conservative filtering for OpenClash.
# Embedded verbatim in both shell adapters by sync-openclash-node-filter.js.
module SckiSubscriptionNodeFilter
  INFO_CN = %w[导航网址 距离下次重置 剩余流量 套餐到期 网址导航 官网 订阅 到期 剩余 重置 免费 试用 应急 已用流量 到期时间 下次重置].freeze
  INFO_EN = /(?<![A-Za-z0-9_])(?:USE|USED|TOTAL|EXPIRE|EMAIL|Panel|Channel|Author|Sign|Login|Register|Help|FAQ)(?![A-Za-z0-9_])/i
  TOKEN_EDGE = '[[:space:]|/()\[\]{}【】（）,，;；:_·｜]'.freeze
  NUMBER = '(?:[0-9]+(?:\.[0-9]+)?)'.freeze
  EXPLICIT_MULTIPLIER = [
    Regexp.new("(?:\\A|#{TOKEN_EDGE})[xX×]\\s*(#{NUMBER})(?=\\z|#{TOKEN_EDGE})"),
    Regexp.new("(?:\\A|#{TOKEN_EDGE})(#{NUMBER})\\s*[xX×倍](?=\\z|#{TOKEN_EDGE})"),
    Regexp.new("(?:\\A|#{TOKEN_EDGE})倍率\\s*(#{NUMBER})(?=\\z|#{TOKEN_EDGE})")
  ].freeze
  UNCERTAIN_MULTIPLIER = Regexp.new("(?:\\A|#{TOKEN_EDGE})(?:[xX×]\\s*(?:\\?|未知|unknown|nan|∞)|\\?\\s*[xX×倍]|倍率\\s*(?:\\?|未知|unknown|nan|∞))(?=\\z|#{TOKEN_EDGE})", Regexp::IGNORECASE)
  BUILTIN_NAMES = %w[DIRECT REJECT REJECT-DROP PASS COMPATIBLE].freeze
  RESERVED_NAMES = (BUILTIN_NAMES + %w[GLOBAL PASS-RULE]).freeze

  module_function

  def max_multiplier(value)
    return nil if value.nil? || value == ''
    raise ArgumentError, 'invalid SCKI_MAX_NODE_MULTIPLIER' unless value.is_a?(String) && value.match?(/\A(?:\d+(?:\.\d+)?|\.\d+)\z/)
    number = Float(value)
    raise ArgumentError, 'invalid SCKI_MAX_NODE_MULTIPLIER' unless number.finite? && number.positive?
    number
  end

  def info_node?(name)
    INFO_CN.any? { |keyword| name.include?(keyword) } || name.match?(INFO_EN)
  end

  def selectable_proxy?(proxy)
    !%w[direct reject].include?(proxy.fetch('type').downcase)
  end

  def multiplier(name)
    return nil if name.match?(UNCERTAIN_MULTIPLIER)
    numbers = EXPLICIT_MULTIPLIER.flat_map do |pattern|
      name.scan(pattern).flatten.map { |text| Float(text) }
    end
    return nil if numbers.empty? || numbers.any? { |number| !number.finite? || !number.positive? }
    unique = numbers.uniq
    unique.length == 1 ? unique.first : nil
  end

  def fingerprint(value, parents = [], depth = 0)
    raise ArgumentError, 'invalid proxy structure' if depth > 32
    case value
    when Hash
      raise ArgumentError, 'invalid proxy structure' if parents.include?(value.object_id) || !value.keys.all? { |key| key.is_a?(String) }
      next_parents = parents + [value.object_id]
      ['hash', value.keys.sort.map { |key| [key, fingerprint(value.fetch(key), next_parents, depth + 1)] }]
    when Array
      raise ArgumentError, 'invalid proxy structure' if parents.include?(value.object_id)
      next_parents = parents + [value.object_id]
      ['array', value.map { |item| fingerprint(item, next_parents, depth + 1) }]
    when String, Integer, TrueClass, FalseClass, NilClass
      [value.class.name, value]
    when Float
      raise ArgumentError, 'invalid proxy structure' unless value.finite?
      ['Float', value]
    else
      raise ArgumentError, 'invalid proxy structure'
    end
  end

  def copy_node(value)
    case value
    when Hash then value.to_h { |key, item| [key.dup, copy_node(item)] }
    when Array then value.map { |item| copy_node(item) }
    when String then value.dup
    else value
    end
  end

  def validate_and_filter(config, override, requested_limit, region_names)
    raise ArgumentError, 'invalid config' unless config.is_a?(Hash)
    raise ArgumentError, 'invalid override' unless override.is_a?(Hash)
    limit = max_multiplier(requested_limit)
    providers = config['proxy-providers']
    raise ArgumentError, 'invalid proxy-providers' unless providers.nil? || providers.is_a?(Hash)
    flattened = []
    flattened_providers = 0
    (providers || {}).each_value do |provider|
      raise ArgumentError, 'unsupported proxy-provider' unless provider.is_a?(Hash) &&
        provider.keys.length == 2 && provider.key?('type') && provider.key?('payload') &&
        provider['type'] == 'inline' && provider['payload'].is_a?(Array)
      flattened_providers += 1
      flattened.concat(provider['payload'])
    end
    proxies = if config.key?('proxies')
      config['proxies']
    elsif flattened_providers.positive?
      []
    end
    raise ArgumentError, 'invalid proxies list' unless proxies.is_a?(Array)
    source = proxies + flattened
    groups = override['proxy-groups']
    raise ArgumentError, 'invalid override groups' unless groups.is_a?(Array) && groups.all? { |group| group.is_a?(Hash) && group['name'].is_a?(String) && !group['name'].empty? }
    reserved = (groups.map { |group| group['name'] } + region_names + RESERVED_NAMES).uniq
    by_name = {}
    distinct = []
    source.each_with_index do |proxy, index|
      raise ArgumentError, 'invalid proxy entry' unless proxy.is_a?(Hash)
      name = proxy['name']
      type = proxy['type']
      raise ArgumentError, 'invalid proxy name or type' unless name.is_a?(String) && !name.strip.empty? && type.is_a?(String) && !type.strip.empty?
      raise ArgumentError, 'invalid proxy flow' if proxy.key?('flow') && !proxy['flow'].is_a?(String)
      raise ArgumentError, 'proxy name conflicts with group or builtin' if reserved.include?(name)
      signature = fingerprint(proxy)
      if by_name.key?(name)
        raise ArgumentError, 'ambiguous duplicate proxy name' unless by_name[name] == signature
      else
        by_name[name] = signature
        distinct << (index < proxies.length ? proxy : copy_node(proxy))
      end
    end
    kept = distinct.reject do |proxy|
      name = proxy.fetch('name')
      info_node?(name) || (limit && (factor = multiplier(name)) && factor > limit)
    end
    kept_by_name = kept.to_h { |proxy| [proxy.fetch('name'), proxy] }
    kept.each do |proxy|
      dependency = proxy['dialer-proxy']
      next unless proxy.key?('dialer-proxy')
      raise ArgumentError, 'invalid dialer-proxy' unless dependency.is_a?(String) && !dependency.empty?
      raise ArgumentError, 'dangling dialer-proxy after filtering' unless kept_by_name.key?(dependency) || BUILTIN_NAMES.include?(dependency)
    end
    # A valid reference can still create a cycle; walk each chain once without recursion.
    state = {}
    kept.each do |proxy|
      current = proxy.fetch('name')
      trail = []
      while kept_by_name.key?(current) && state[current] != :done
        raise ArgumentError, 'cyclic dialer-proxy dependency' if state[current] == :active
        state[current] = :active
        trail << current
        current = kept_by_name.fetch(current)['dialer-proxy']
      end
      trail.each { |name| state[name] = :done }
    end
    [kept, { 'source' => source.length, 'distinct' => distinct.length, 'removed' => distinct.length - kept.length,
             'limit' => limit, 'flattened_providers' => flattened_providers, 'flattened_nodes' => flattened.length }]
  end
end
