# FE QUEST v342 — Optional sync transport validation

Result: **PASS — CREDENTIAL-FREE OPTIONAL TRANSPORT + ISOLATED OUTBOX METADATA PRESERVE LOCAL-FIRST SAFETY**

- deterministic transport/store cases: **15 / 15 PASS**
- sync metadata is stored outside the learner profile schema under `fequest.cloudSync.v342`
- corrupt sync metadata is isolated and cannot delete or block learner profile data
- a different authenticated account cannot inherit another account's remote ancestry
- signing out clears only sync metadata; learner data remains untouched
- missing auth session performs **zero network calls**
- Supabase reads use authenticated RLS REST requests
- writes use the guarded `fequest_commit_profile_v342` RPC, not blind table upsert
- network/provider errors are nonthrowing and retryable; auth expiry is explicit
- remote conflict responses are returned for later reconciliation instead of being auto-overwritten
- service-role / secret credential values are prohibited in the PWA
- production `assets/app-v341.js` remains cloud-network-free and the v342 transport modules are not loaded by `app/base-shell-v341.html`

This slice intentionally stops before production activation. A real Supabase project URL, public anon/publishable key, authenticated session boundary, explicit sync opt-in, and learner-facing conflict/recovery UI are still required before cloud sync is enabled.
