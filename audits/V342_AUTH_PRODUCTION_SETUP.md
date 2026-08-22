# FE QUEST v342 — Auth production setup readiness

Result: **PASS — 33 / 33 AUTH-PRODUCTION CHECKS PASS**

- canonical production URL is `https://taiwanwan64.github.io/fe-quest/` and the isolated test callback is `https://taiwanwan64.github.io/fe-quest/v342-auth-test.html`
- both Confirm sign up and Magic link or OTP are required to use the same PKCE token-hash browser callback
- new-user automatic signup is explicitly covered so the first login cannot silently fall back to hosted `/verify`
- public v342 config remains publishable-key only and v341 production remains cloud-free
- live acceptance covers both first-time and returning-user Auth before cloud sync promotion
- release PR #107 remains gated until real acceptance tests pass
