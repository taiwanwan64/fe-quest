# IPA 9.2 question batch v11 activation checkpoint — 2026-09-13

This checkpoint records the production state verified before publishing public-safe v11 metadata. It is evidence only; it does not promote any syllabus item to `verified-covered`.

## Verified protected import

- content version: `ipa92-questions-v11`
- imported original Subject-A questions: **8**
- active protected question total after import: **1055**
- active protected lessons: **130**
- staging rows remaining after finalization: **0**
- import manifest rows for v11: **1**
- source commit: `17fa3f92a8a569c7500794f4fe0b32b33caa6c53`
- payload SHA-256: `82fc0e3dc890a16ab3a3af8cca6185e864a6366f7cfc719d4bbd04cfa0931018`
- imported at: `2026-09-13 08:28:27.356+00`
- GitHub Actions workflow: `Import IPA 9.2 question extensions v11`
- workflow run: `34747639449`
- workflow attempt: **2**
- workflow conclusion: `success`

The first workflow attempt failed before staging because the v11 import Edge Function had not yet been deployed. The protected v11 import function was then deployed with the same `private main + workflow_dispatch + GitHub OIDC` trust boundary used by prior IPA 9.2 batches, and the failed workflow was rerun successfully. No production question rows were written by the failed first attempt.

## Public activation scope

Only safe catalog metadata is published for these 8 IDs. Question stems, options, answers, explanations, hints, choice explanations, and protected lesson bodies remain outside the public repository.

The latest public provider merges:

- protected baseline: 904
- IPA 9.2 v1-v6: 83
- IPA 9.2 v7: 16
- IPA 9.2 v8: 16
- IPA 9.2 v9: 12
- IPA 9.2 v10: 16
- IPA 9.2 v11: 8
- merged catalog total: **1055**

The v11 remediation topics are:

- 情報流通プラットフォーム対処法 / 発信者情報
- cloud-native / cloud-by-default
- test driver and stub/driver distinction

## Safety contract

- Existing protected question IDs are not modified.
- Public files contain safe metadata only.
- The production question gate remains the only path used by the browser to hydrate protected question bodies.
- The public provider rejects protected fields in public catalog metadata.
- Historical v7/v8/v9/v10 readiness aliases continue to resolve to the latest v11 provider.
- `inventory_complete` and `verified-covered` completion gates remain unchanged by this activation.
