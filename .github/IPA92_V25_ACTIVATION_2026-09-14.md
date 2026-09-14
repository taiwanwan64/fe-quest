# IPA Ver.9.2 v25 public activation — 2026-09-14

## Production evidence

- private source merge commit: b1853b9c6051f78f06fc203e649d7e5c5f3d217a
- private validation CI run: **34844860823** — success
- protected production import workflow run: **34845168150** — success
- protected question payload SHA-256: 46cd89f13145eaff56e28a6a030a2f4ef8bbb354828e306e680aaec40da5ce2d
- v25 protected questions imported: **5**
- active protected question total after import: **1124**
- protected lesson materialization: **130 lessons**, stable lesson IDs retained
- protected lesson stable database content version remains v376-lessons-1

## Public activation scope

Only public-safe catalog metadata is published for v25: IDs, pool, category, difficulty, concept, core topic and quality-audit marker. Question stems, options, answers, hints, explanations and protected lesson bodies remain in the private source repository / protected Supabase storage.

The v25 public provider extends the merged protected catalog from **1119** to **1124** questions and retains the existing question-gate flow. The merged Subject A count is **930**, with **939** tracked Subject A items. Service-worker cache identity is advanced so installed PWA clients receive the new provider and catalog.
