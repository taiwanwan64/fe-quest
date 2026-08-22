# FE QUEST v342 — Auth production setup readiness

Result: **PASS — 23 / 23 AUTH-PRODUCTION CHECKS PASS**

- the hosted Supabase Auth steps are fixed behind one unresolved input: the exact production FE QUEST HTTPS URL
- Site URL and Additional Redirect URL must use that exact canonical root
- the Magic Link template returns `token_hash` + `type=email` to the same root through `{{ .RedirectTo }}`
- the documented template matches the existing PKCE `verifyOtp` callback implementation
- the guide explicitly avoids an `/auth/confirm` route that does not exist in the static PWA
- live acceptance covers signed-out local study, explicit first sync, second device, offline reconnect, both conflict resolutions, logout, account deletion, export/recovery, and final Supabase advisors
- current public config remains disabled and v341 production remains cloud-free
- release PR #107 remains gated until real hosted Auth configuration and live acceptance pass

No production URL was guessed or activated by this change.
