# IPA Ver.9.2 v26 public activation — 2026-09-14

## Production evidence

- private source merge commit: 7a6d6dfddf3f3902a78208aa112a2336d1c031e7
- private validation CI run: **34849193673** — success
- protected production import workflow run: **34849403822** — success after retry
- protected question payload SHA-256: f4b3f564c804c6561f4270d061a4684621eb594e44fc43661025c8875fe6a087
- v26 protected questions imported: **5**
- active protected question total after import: **1129**
- protected lesson materialization: **130 lessons**, release v376-lessons-6-ipa92
- protected lesson stable database content version remains v376-lessons-1

## Public activation scope

Only public-safe catalog metadata is published for v26: IDs, pool, category, difficulty, concept, core topic and quality-audit marker. Question stems, options, answers, hints, explanations and protected lesson bodies remain in the private source repository / protected Supabase storage.

The v26 public provider extends the merged protected catalog from **1124** to **1129** questions and retains the existing question-gate flow. Service-worker cache identity is advanced so installed PWA clients receive the new provider and catalog.
