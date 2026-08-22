# FE QUEST v342 — Standalone release package

Result: **PASS — 12 / 12 STANDALONE-PACKAGE CASES PASS**

- the release ZIP is now assembled from the built site and versioned asset manifest rather than a short hardcoded core-file list
- v342 includes core PWA files, split app CSS/JS, the asset manifest, `privacy.html`, all 15 same-origin cloud runtime assets, and the pinned Supabase browser SDK
- cloud files are hash/size checked against the release asset manifest before packaging
- missing or modified cloud assets fail packaging instead of producing a partially broken standalone release
- source-only app shells, CI tooling, and regression evidence are not placed in the learner ZIP
- ZIP member bytes are checked against the built site and deterministic ZIP generation is verified
- the legacy inline packaging contract remains supported
