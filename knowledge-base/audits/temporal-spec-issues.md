# Temporal specification issues

Reviewed: 2026-11-21.

Implementation gaps stay in [the audit ledger](temporal-spec-audit.md).
[Test/data conflicts](temporal-conformance-discrepancies.md) are separate from
specification algorithm defects. No algorithm defect confirmed in this pass.

## Published Zone-primary rule versus pending legacy-POSIX policy

Status: open standards-policy inconsistency; upstream
[ECMA-402 #1103](https://github.com/tc39/ecma402/issues/1103).

[Published ECMA-402 §6.5](https://tc39.es/ecma402/#sec-use-of-iana-time-zone-database)
requires IANA Zone names to be primary, with enumerated exceptions. IANA 2026d
restored `EST5EDT`, `CST6CDT`, `MST7MDT` and `PST8PDT` as Zones; pinned 2026f
retains them. The published exceptions do not cover those four names.

The [TG2 2026-10-08 decision](https://github.com/tc39/ecma402/issues/1103#issuecomment-6066913704)
agreed that a future specification change should retain their previous alias
behavior. That decision also gave interim browser guidance, but the published
normative algorithm still preserves their primary identities. The proposal and
published rule therefore differ for the pinned data.

Audit decision: follow the published rule and pinned data. Keep the upstream
policy question open; reassess when the normative text changes. Do not silently
implement unpublished alias policy merely to satisfy the older Test262 fixture.
No external issue or PR was filed by this audit.
