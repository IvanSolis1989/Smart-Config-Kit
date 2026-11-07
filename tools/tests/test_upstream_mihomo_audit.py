import importlib.util
from pathlib import Path
import unittest

SPEC = importlib.util.spec_from_file_location('audit_upstream', Path(__file__).resolve().parents[1] / 'audit-upstream-mihomo.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class IntakeAuditTest(unittest.TestCase):
    def codes(self, config):
        return [item['code'] for item in MODULE.audit(config)]

    def test_clean_local_config(self):
        self.assertEqual(self.codes({'external-controller': '127.0.0.1:9090', 'proxies': [{'skip-cert-verify': False}]}), [])

    def test_credentials_are_not_emitted(self):
        result = str(MODULE.audit({'secret': 'PRIVATE_SECRET', 'authentication': ['PRIVATE_AUTH']}))
        self.assertNotIn('PRIVATE_SECRET', result)
        self.assertNotIn('PRIVATE_AUTH', result)

    def test_wildcard_controller(self):
        for value in ['0.0.0.0:9090', '[::]:9090', ':9090']:
            self.assertIn('controller-wide-bind', self.codes({'external-controller': value}))
        self.assertNotIn('controller-wide-bind', self.codes({'external-controller': '[::1]:9090'}))

    def test_provider_tls_and_explicit_empty_fallback(self):
        config = {'proxy-providers': {'private-name': {'override': {'skip-cert-verify': True}}}, 'proxy-groups': [{'empty-fallback': 'DIRECT'}, {'empty-fallback': 'REJECT'}]}
        self.assertEqual(self.codes(config), ['tls-verification-disabled', 'empty-group-direct'])
        self.assertNotIn('private-name', str(MODULE.audit(config)))

    def test_replaced_providers_leave_dangling_tun_reference(self):
        config = {'tun': {'route-exclude-address-set': ['China-IP']}, 'rule-providers': {'China-IP': {}}}
        self.assertEqual(self.codes(config), ['tun-rule-bypass'])
        config['rule-providers'] = {'fused-china': {}}
        self.assertEqual(self.codes(config), ['tun-rule-bypass', 'unresolved-tun-rule-set'])

    def test_route_include_reference(self):
        self.assertEqual(self.codes({'tun': {'route-address-set': ['missing']}}), ['unresolved-tun-rule-set'])

    def test_shapes_and_empty_exclusion(self):
        self.assertEqual(self.codes({'tun': {'route-exclude-address-set': []}}), [])
        self.assertEqual(self.codes({'tun': {'route-address-set': 'wrong'}}), ['invalid-tun-rule-set-shape'])
        with self.assertRaises(ValueError):
            MODULE.audit([])

    def test_yaml_aliases_are_checked_after_expansion(self):
        import yaml
        config = yaml.safe_load('base: &base\n  override:\n    skip-cert-verify: true\nproxy-providers:\n  one: *base\n')
        self.assertEqual(self.codes(config), ['tls-verification-disabled'])


    def test_yaml_shallow_merge_does_not_inherit_overridden_tls_switch(self):
        import yaml
        config = yaml.safe_load('base: &base\n  override:\n    skip-cert-verify: true\nproxy-providers:\n  one:\n    <<: *base\n    override:\n      additional-suffix: local\n')
        self.assertEqual(self.codes(config), [])

    def test_individual_node_tls(self):
        self.assertEqual(self.codes({'proxies': [{'skip-cert-verify': True}]}), ['tls-verification-disabled'])


if __name__ == '__main__':
    unittest.main()
