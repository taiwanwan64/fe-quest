# FE QUEST v342 — Auth production setup readiness

Result: **PASS — 34 / 34 AUTH-PRODUCTION CHECKS PASS**

- canonical production URL is `https://taiwanwan64.github.io/fe-quest/` and the isolated test callback is `https://taiwanwan64.github.io/fe-quest/v342-auth-test.html`
- both Confirm sign up and Magic link or OTP are required to use the same PKCE token-hash browser callback
- live returning-user and brand-new-user PKCE Auth acceptance is recorded as passed
- public v342 config remains publishable-key only and v341 production remains cloud-free
- remaining promotion gates are learner-profile sync acceptance, not hosted Auth setup
- stale PR #107 is closed unmerged; any promotion must use a fresh candidate from latest main
