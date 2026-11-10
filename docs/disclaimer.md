# Scope, limitations and licensing notice

**English** | [中文](disclaimer.zh-CN.md)

[Project home](../README.md) · [Documentation](README.md) · [Sources and acknowledgements](guide/acknowledgements.md)

## What this project provides

Smart-Config-Kit provides routing configuration examples, override scripts, generated rule assets and validation tools for multiple clients. It does **not** provide proxy endpoints, subscription accounts, VPN service or network connectivity. You supply and control your own endpoints and credentials.

This documentation is intended for a general technical audience. Descriptions of geographic rule categories explain the actual policy; they are not recommendations aimed at users in a particular country. The existing policy distinguishes China-specific and other service categories and includes resolver and direct-routing defaults. An English interface does not change those defaults. Review them against your network and requirements before use.

## Check before applying

- Use configurations only on systems and networks you are authorized to manage. Check applicable laws, network policies and the terms of your client and service providers. This notice is not legal advice or a guarantee that a particular use is lawful.
- Back up your current configuration. Review downloaded scripts before running them, inspect DNS and routing choices, and verify actual rule downloads and connection logs after import.
- A successful syntax check, CI run or core test does not prove successful import or connectivity on every device. Client versions, platform capabilities, upstream rules and remote services can change.
- The project does not promise anonymity, freedom from DNS or other information leaks, access to any particular service, uninterrupted availability or complete blocking accuracy. Incorrect or outdated rules can disrupt traffic or route it through an unintended endpoint.
- Do not post subscription URLs, passwords, tokens, private keys or unredacted connection logs in public issues. Redact sensitive details before sharing diagnostics. External clients, hosting providers and upstream services have their own data practices; this project does not make privacy guarantees on their behalf.

## Licensing and third-party materials

At this revision, the repository does not contain a root `LICENSE` or `COPYING` file establishing a repository-wide license. Earlier documentation described the project as MIT-licensed, but that description alone is not a substitute for a complete license grant. **Do not assume that every file or generated asset is licensed under MIT or freely redistributable.** Clarification from the relevant rights holders may be necessary before copying, modifying or redistributing materials beyond permissions already granted.

Third-party code, rules, data, images and documentation remain subject to their own applicable licenses and notices. For example, the bundled fflate library includes its own [license](../tools/vendor/fflate/LICENSE). Source links, provenance records and component review requirements are not a blanket permission to redistribute upstream material. Preserve required attribution and copyright notices and review the applicable source terms.

This notice does not grant a license, relicense third-party material or add restrictions to rights already granted under an applicable open-source license. It does not replace those licenses or claim to eliminate responsibilities or rights that applicable law does not permit to be excluded. Where an applicable license contains warranty or liability terms, consult that license rather than treating this page as a universal exemption.
