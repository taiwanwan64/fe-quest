# IPA Ver.9.2 v24 public activation — 2026-09-14

## Production evidence

- private source merge commit: dfe53c21a3e3cbc9d10d06dff22a61cdc6a9a6ca
- private validation CI run: **34841744228** — success
- protected production import workflow run: **34841842253** — successful rerun after the v24 Edge importer was deployed
- protected question payload SHA-256: 420eacda5a1584537c874d1fc5921121bbcda3aa4c4d57be8fd060c81efda20c
- v24 protected questions imported: **5**
- active protected question total after import: **1119**
- protected lesson materialization: **130 lessons**, release v376-lessons-5-ipa92
- protected lesson stable database content version remains v376-lessons-1

## Public activation scope

Only public-safe catalog metadata is published for v24: IDs, pool, category, difficulty, concept, core topic and quality-audit marker. Question stems, options, answers, hints, explanations and protected lesson bodies remain in the private source repository / protected Supabase storage.

The v24 public provider extends the merged protected catalog from **1114** to **1119** questions and retains the existing question-gate flow. Service-worker cache identity is advanced so installed PWA clients receive the new provider and catalog.
