# FE QUEST v342 — Cloud-aware split release contract

Result: **PASS — 15 / 15 RELEASE-ACTIVATION CASES PASS**

- v342 mechanical materialization adds exactly one external cloud activation loader after the core app script
- the existing 231KB+ CSS stays byte-identical and application JS follows the approved `APP_VERSION` + native Safari date-sizing correction
- the Safari correction avoids iOS 26/WebKit 301648 `width:100%` overflow without disabling the native date picker
- the v342 asset manifest records the pinned same-origin cloud dependency identities
- Service Worker precache contains the activation loader, activated public config, sync UI, pinned Supabase SDK, and all cloud modules
- the manifest records the exact activated public-config hash and canonical redirect `https://taiwanwan64.github.io/fe-quest/`
- all existing offline/navigation/stale-while-revalidate behavior remains intact
- materialization remains idempotent
- the v341 production shell and Service Worker source remain untouched

This validates the distribution wiring for the activated v342 release candidate while keeping current production on v341 until the release gate is explicitly completed.
