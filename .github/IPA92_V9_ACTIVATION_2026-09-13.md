# IPA 9.2 question batch v9 activation checkpoint — 2026-09-13

This checkpoint records the production state verified before publishing public-safe v9 metadata. It is evidence only; it does not promote any syllabus item to `verified-covered`.

## Verified protected import

- content version: `ipa92-questions-v9`
- imported original Subject-A questions: **12**
- active protected question total after import: **1031**
- active protected lessons: **130**
- staging rows remaining for v9: **0**
- import manifest rows for v9: **1**
- source commit: `e3cc83a1f0f92404f361d49e32089c5ca22f3da3`
- payload SHA-256: `64618ca447addac7bd1482c8669e8025f3a04d9b874f8983467106c96214e384`
- imported at: `2026-09-13 05:42:17.996+00`
- GitHub Actions workflow: `Import IPA 9.2 question extensions v9`
- workflow run: `34740945338`
- workflow conclusion: `success`

## Public activation scope

Only safe catalog metadata is published for these 12 IDs. Question stems, options, answers, explanations, hints, choice explanations, and protected lesson bodies remain outside the public repository.

The latest public provider merges:

- protected baseline: 904
- IPA 9.2 v1-v6: 83
- IPA 9.2 v7: 16
- IPA 9.2 v8: 16
- IPA 9.2 v9: 12
- merged catalog total: **1031**

The v9 topics are ITIL/JIS Q 20000, CAB/PIR, DevOps/DevSecOps/TDD/SRE/MLOps, and GDPR/JIS Q 15001/電子署名法. These were added after semantic review showed that broader neighboring concepts existed but direct practice for these named Ver.9.2 concepts remained thin.

## Safety contract

- Existing protected question IDs are not modified.
- Public files contain safe metadata only.
- The production question gate remains the only path used by the browser to hydrate protected question bodies.
- The public provider must reject protected fields in public catalog metadata.
- Historical v7/v8 metadata and readiness aliases must continue to work while resolving to the latest v9 provider.
- `inventory_complete` and `verified-covered` completion gates remain unchanged by this activation.
