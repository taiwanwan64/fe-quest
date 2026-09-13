# IPA 9.2 question batch v10 activation checkpoint — 2026-09-13

This checkpoint records the production state verified before publishing public-safe v10 metadata. It is evidence only; it does not promote any syllabus item to `verified-covered`.

## Verified protected import

- content version: `ipa92-questions-v10`
- imported original Subject-A questions: **16**
- active protected question total after import: **1047**
- active protected lessons: **130**
- staging rows remaining for v10: **0**
- import manifest rows for v10: **1**
- source commit: `d1d52cd8bd51150edf72b65a5fc58c7e486c005a`
- payload SHA-256: `b1323e475a79040c9239a668dcc7ce3f0239b018721980a464fd8d4316bc46c4`
- imported at: `2026-09-13 06:11:43.617+00`
- GitHub Actions workflow: `Import IPA 9.2 question extensions v10`
- workflow run: `34742129660`
- workflow conclusion: `success`

## Public activation scope

Only safe catalog metadata is published for these 16 IDs. Question stems, options, answers, explanations, hints, choice explanations, and protected lesson bodies remain outside the public repository.

The latest public provider merges:

- protected baseline: 904
- IPA 9.2 v1-v6: 83
- IPA 9.2 v7: 16
- IPA 9.2 v8: 16
- IPA 9.2 v9: 12
- IPA 9.2 v10: 16
- merged catalog total: **1047**

The v10 topics are WCAG, responsive Web design, heuristic evaluation, usability testing, three-schema architecture, representative NoSQL types, CSMA/CD, CSMA/CA, spanning tree, RADIUS, QoS, secure boot, stub, and condition coverage. Boundary-value analysis and equivalence partitioning were deliberately not duplicated because production already has direct semantic practice for the synonymous Japanese terms.

## Safety contract

- Existing protected question IDs are not modified.
- Public files contain safe metadata only.
- The production question gate remains the only path used by the browser to hydrate protected question bodies.
- The public provider must reject protected fields in public catalog metadata.
- Historical v7/v8/v9 metadata and readiness aliases must continue to work while resolving to the latest v10 provider.
- `inventory_complete` and `verified-covered` completion gates remain unchanged by this activation.
