# FE QUEST — IPA Ver.9.2 official inventory tranche 2 — 2026-09-13

## Scope

This tranche audits official IPA Ver.9.2 **大分類2「コンピュータシステム」** against the live FE QUEST production snapshot: 987 active questions and 130 active protected lessons.

Official small classifications covered here:

- 中分類3「コンピュータ構成要素」: プロセッサ / メモリ / バス / 入出力デバイス / 入出力装置
- 中分類4「システム構成要素」: システムの構成 / システムの評価指標
- 中分類5「ソフトウェア」: オペレーティングシステム / ミドルウェア / ファイルシステム / 開発ツール / オープンソースソフトウェア
- 中分類6「ハードウェア」: ハードウェア

The structured evidence ledger is `.github/ipa92-official-inventory-tranche2.json`. As in tranche 1, a zero term hit is not automatically a `missing` verdict. The ledger records direct evidence only, then uses semantic spot-checks where exact wording differs.

## Production snapshot

- public main at audit start: `a273b788218812dce6e053da5aa178c2e9276f95`
- private main: `89d50789e5ca0776f53e977ae649f7f4e20c9aaa`
- active questions: 987
- active protected lessons: 130
- no production mutation performed by this audit

## Findings

The ledger contains 60 fine-grained findings:

- `direct-covered`: 20
- `mixed-evidence`: 6
- `lesson-only`: 4
- `no-direct-evidence`: 30
- `verified-covered` promotions: 0

### Strong direct evidence

Representative areas with direct question + lesson evidence include CPI-based CPU performance, DRAM/SRAM, address/data buses, HDMI/NFC/DMA, OCR/OMR, edge computing, MTBF/MTTR, round-robin scheduling, LRU page replacement, API, absolute/relative paths, flip-flops, PWM and sequence control.

### Mixed or terminology-normalization cases

- `パイプライン`: direct practice exists but broader high-speed processor terms remain thin.
- `SIMD`: v3 added direct practice, while SISD/MISD/MIMD breadth is not yet evidenced.
- `実効アクセス時間`: the exact phrase is absent, but production has a direct cache-hit/miss average-access-time calculation. This is a terminology-normalization issue, not a semantic absence.
- `IaC`: question/lesson evidence exists but density is low.
- `RAID5`: direct questions exist, but the protected lesson probe did not find the term.
- differential/incremental backup: incremental has direct practice; differential is lesson-only in the current probe.

### High-confidence semantic-review candidates

The following official fine-grained items had no reliable direct evidence in this pass and are good candidates for targeted review before any new content is generated:

- processor architecture/high-speed processing: RISC/CISC, superscalar/VLIW, Amdahl/multiprocessor detail
- memory: write-through/write-back, memory interleaving, wear leveling
- bus/I/O: control bus/PCI, Thunderbolt/RS-232C/Zigbee, plug-and-play depth
- system architecture: dual/duplex systems, VDI/FaaS, HPC, RPC, NAS/SAN, foolproof
- evaluation: capacity planning/scale-out/scale-up, RASIS, TCO
- OS: microkernel/monolithic kernel, swapping, segment paging, LDAP-related user management
- middleware/file system: componentware/library examples, NTFS/symbolic-link depth
- development tools/OSS: low-code/no-code, cross compiler/preprocessor, Apache-license/FreeBSD detail
- hardware: FPGA/diode and embedded-system power-consumption concepts

These are **not yet labelled `missing`**. Each item must be semantically reviewed against existing broad questions and lessons before a targeted private batch is created.

## Semantic spot-checks already completed

A few exact-term zeroes were checked against actual protected question semantics:

- CPU instruction flow is present, including fetch/decode and a question asking for the register that holds the next instruction address, even when the exact official term spelling differs.
- cache average access time is directly calculated in production, despite zero hits for the exact phrase `実効アクセス時間`.
- file paths and round-robin scheduling have strong direct practice.
- broad OSS and middleware questions exist, but some official named examples still lack direct evidence.

This distinction prevents unnecessary duplicate questions while still exposing genuine fine-grained gaps.

## Next step

Continue with two controlled tracks:

1. semantic-review the highest-value `no-direct-evidence` items from tranche 1 and tranche 2, then create only a small original protected batch for gaps that remain genuine;
2. continue the official inventory into 大分類3「技術要素」 (UI, information media, database, network, security), using the same evidence-ledger and CI contract.

Completion gates remain unchanged. No source/import/deploy state alone is sufficient for `verified-covered`; mobile visual/touch QA and learning-history compatibility still apply where relevant.
