# FE QUEST — IPA Ver.9.2 official inventory tranche 3 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類3「技術要素」** against the live FE QUEST production snapshot of 987 active questions and 130 active protected lessons.

Covered classifications:

- 中分類7「ユーザーインタフェース」
- 中分類8「情報メディア」
- 中分類9「データベース」
- 中分類10「ネットワーク」
- 中分類11「セキュリティ」

The structured evidence ledger is `.github/ipa92-official-inventory-tranche3.json`.

## Audit snapshot and v7 boundary

- public main at audit start: `06bf95e307720c96a7aab981efcd0a7d3f93901f`
- private main after v7 merge: `c7ed16e435b75a3c45b384fcd215319aab52dd1b`
- production questions used for this audit: 987
- production protected lessons: 130
- `ipa92-questions-v7` is intentionally excluded from evidence counts until its manual protected import succeeds

This prevents source-ready material from being mistaken for production-covered material.

## Findings

The ledger records 60 fine-grained findings:

- `direct-covered`: 22
- `mixed-evidence`: 14
- `lesson-only`: 4
- `no-direct-evidence`: 20
- `verified-covered` promotions: 0

### Strong existing areas

Representative direct evidence exists for accessibility/usability, PCM/JPEG/PNG and lossless compression, third normal form and DDL, OLAP, DHCP/SMTP/SNMP/SDN, the CIA security properties, OAuth, WAF, penetration testing, SQL injection, XSS, ransomware and multi-factor authentication.

### Fine-grained candidates for semantic review

High-value candidates with no reliable direct evidence in this pass include:

- UI/UX: information architecture, multitouch details, some GUI components, responsive Web design, WCAG, heuristic evaluation and usability testing
- information media: MIDI, selected modern image/video codecs, metaverse terminology
- databases: three-schema architecture, selected NoSQL database types, transitive functional dependency, embedded-SQL cursor handling, B-tree/inverted-index variants
- networking: CSMA/CD and CSMA/CA, spanning tree, RADIUS/QoS details
- security: secure boot

These are not yet final `missing` verdicts. They require semantic review against broader questions and lessons before adding new protected content.

### Mixed/lesson-only examples

Several topics already have some evidence but not enough to call directly covered under this audit contract. Examples include VUI, UX fundamentals, MP3/lossy compression, ACID, ETL/data lake, OSI, OpenFlow/NFV, CVSS/SIEM, and OpenID Connect/zero trust where lesson-only evidence exists.

The E-R lesson exact-term count is intentionally treated as noisy because punctuation-heavy matching produces broad substring hits; v3 question evidence and the modeling lab remain the meaningful sources for that topic.

## Next step

Two tracks remain safe to run in parallel:

1. finish the protected v7 import through the existing `private main + workflow_dispatch + GitHub OIDC` path, verify 16 new active questions and total 1003, then publish only v7 safe metadata;
2. continue the official inventory with 大分類4「開発技術」 and later management/strategy/legal classifications, while using tranche 1–3 findings to create only small targeted content batches for semantically confirmed gaps.

No audit finding is promoted to `verified-covered` until practice density, required visual/interactive behavior, mobile QA and learning-history compatibility are verified.
