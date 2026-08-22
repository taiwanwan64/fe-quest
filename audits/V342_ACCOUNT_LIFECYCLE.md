# FE QUEST v342 — Account lifecycle validation

Result: **PASS — 12 / 12 ACCOUNT-LIFECYCLE CASES PASS**

- deleting an account is available only to a signed-in learner and only through an injected backend action
- the browser sends only the public Supabase key plus the learner session JWT; no admin credential is shipped
- the destructive operation requires two learner confirmations and a fixed server confirmation value
- the Edge Function accepts POST only, independently re-validates the authenticated user, and deletes exactly that Auth user
- `public.user_profiles.user_id -> auth.users.id ON DELETE CASCADE` removes the cloud learning profile with the account
- successful deletion disables this device's sync metadata and signs out locally
- FE QUEST local learning data is deliberately preserved; deleting local data remains a separate data-management action
- cancellation and backend failure do not clear sync state or sign the learner out
- the Edge Function pins `@supabase/server@1.4.1`, uses user auth, and keeps admin capability server-side
- anonymous execution of the sync RPC remains explicitly revoked
- the v341 production shell remains cloud-free

The backend endpoint may be deployed before v342 activation because it requires a valid user JWT. The production app must still remain disabled until redirect/email settings, the pinned browser SDK, and final release validation are complete.
