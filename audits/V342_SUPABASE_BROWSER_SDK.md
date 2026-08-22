# FE QUEST v342 — Supabase browser SDK vendoring

Result: **PASS — PINNED LOCAL SDK READY**

- package: `@supabase/supabase-js`
- pinned version: `2.112.3`
- browser format: UMD
- local path: `vendor/supabase/supabase-2.112.3.js`
- bytes: `211907`
- SHA-256: `ec004176d101aec77aeef266aa1c94411287fe2039c65ea5f6c72f5e14b3847d`
- jsDelivr and unpkg copies were byte-for-byte identical before vendoring
- the vendored bundle exposes `globalThis.supabase.createClient` without making a network request during load validation
- production runtime must load this same-origin file; runtime CDN loading is forbidden
- v341 production remains unchanged and does not load this SDK
