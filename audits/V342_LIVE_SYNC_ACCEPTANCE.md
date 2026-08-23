# FE QUEST v342 — Live learner-profile sync acceptance

Date: 2026-08-23 (JST)

Result: **PASS — live learner-profile acceptance items 4–15 completed**

Production remains **v341** while the v342 candidate is finalized.

## Live acceptance evidence

4. **Signed in / sync disabled — PASS**
   - The learner signed in successfully while cloud sync remained explicitly off.
   - `public.user_profiles` remained empty until the learner pressed **クラウド同期を有効にする**.

5. **Explicit first sync — PASS**
   - Enabling sync created the first live learner profile through the authenticated browser/CAS path.
   - No management SQL write was used to create learner data.

6. **Reload / session persistence — PASS**
   - Reload preserved authenticated + sync-enabled state.
   - Reload alone did not create an extra cloud revision.

7. **Browser B cloud adoption — PASS**
   - A second isolated browser signed into the same account.
   - With no meaningful local learning history, it safely adopted the cloud profile rather than overwriting it.

8. **Offline → reconnect — PASS**
   - The learner answered a question while fully offline.
   - Local persistence completed and the UI showed pending cloud data.
   - After reconnect + explicit sync, the cloud revision advanced successfully.
   - During this test a UI-only defect was found: the legacy **オフラインで利用中** app notice could remain visible after connectivity returned even though cloud sync succeeded. The v342 activation cleanup adds a reconnect/pageshow bridge that clears only stale `offline` notices and never dismisses update/error notices.

9. **Divergent clients / stale write protection — PASS**
   - Two browsers diverged from a common cloud ancestor.
   - The newer browser advanced the cloud revision first.
   - The stale browser did not silently overwrite it; the UI showed **同期するデータを確認してください** with explicit local/cloud choices.

10. **Resolve with この端末のデータを使う — PASS**
    - Explicit local selection promoted the local revision above the cloud ancestor and committed it successfully.

11. **Resolve with クラウドのデータを使う — PASS**
    - Explicit cloud selection replaced local data only after a recovery checkpoint was created.
    - Recovery Center showed `before-cloud-adopt` at the expected timestamp with the pre-adoption local metrics.

12. **Log out — PASS**
    - Local learner data remained available after logout.
    - Cloud profile was not deleted or changed by logout.

13. **Delete account — PASS**
    - Two confirmations were required.
    - The tested Auth user and its cloud profile were removed.
    - Local learner data remained on the browser after deletion.

14. **JSON export + Recovery Center — PASS**
    - After account deletion, JSON backup export still downloaded successfully (`fe-quest-backup-2026-08-23.json`, about 409 KB in the live test).
    - Recovery Center remained available and retained the current/previous local checkpoints including `before-cloud-adopt`.

15. **Supabase advisors — PASS with documented warnings**
    - Performance Advisor: **0 lints**.
    - Security Advisor: 2 WARN findings, both already understood:
      1. `authenticated_security_definer_function_executable` for `public.fequest_commit_profile_v342`. This is intentional: authenticated clients must call the guarded CAS RPC; `anon` EXECUTE remains revoked and RLS remains enabled.
         - Remediation/reference: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
      2. `auth_leaked_password_protection`. FE QUEST currently uses passwordless Magic Link rather than passwords, so this warning does not block the current passwordless release path.
         - Remediation/reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Final backend state after destructive acceptance

- `public.user_profiles`: RLS enabled.
- `anon` can execute `fequest_commit_profile_v342`: **false**.
- `authenticated` can execute `fequest_commit_profile_v342`: **true** (intentional guarded CAS path).
- The destructive acceptance removed the tested learner profile; no live learner profile row remains from this test sequence.

## Release conclusion

The live Auth + learner-profile acceptance gates are complete. Remaining work before production promotion is release-candidate cleanup/validation, including the reconnect-notice UI fix, a fresh v342 promotion PR from latest `main`, full release validation, and only then switching production from v341 to v342.
