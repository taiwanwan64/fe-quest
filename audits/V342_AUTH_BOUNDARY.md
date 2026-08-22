# FE QUEST v342 — Supabase Auth / PKCE session boundary validation

Result: **PASS — 13 / 13 AUTH BOUNDARY CASES PASS WITHOUT ENTERING LEARNER PERSISTENCE**

- authentication choice: Supabase Auth email magic link with PKCE
- browser client contract: `persistSession=true`, `autoRefreshToken=true`, `detectSessionInUrl=true`, `flowType=pkce`
- FE QUEST keeps only an in-memory session summary; the Supabase SDK remains responsible for persisted session/refresh-token handling
- the sync engine can read the cached authenticated user id synchronously
- transport access tokens are obtained through the SDK `getSession()` boundary and are never exposed in public snapshots
- auth-state changes update the cache; token refresh therefore does not require learner-profile writes
- this-device logout uses `scope=local`; successful sign-out can clear isolated sync metadata through a callback
- provider/auth errors remain nonfatal and cannot block local study
- the auth boundary contains no direct network request, local/session storage write, `saveProfile()` call, or `writeCurrentProfile()` call
- secret/service-role browser credentials remain prohibited
- the v341 application asset is unchanged and the auth module is still absent from the production shell

Production login remains intentionally disabled until a public Supabase project configuration, locally vendored/pinned SDK asset, explicit sync controls, and conflict-reconciliation UI are ready.
