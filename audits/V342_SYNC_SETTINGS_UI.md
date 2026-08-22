# FE QUEST v342 — Cloud sync settings UI validation

Result: **PASS — 16 / 16 LEARNER-FACING SYNC UI CASES PASS**

- account login remains optional; signed-out copy explicitly says local study continues
- signing in does not enable cloud sync until the learner explicitly chooses to enable it
- pending/offline states say the local save is already complete
- unresolved conflicts expose two explicit choices and never pick a timestamp winner
- choosing local/cloud requires a confirmation step; cancelling makes no reconciliation call
- sync-now, disable, magic-link login, and sign-out are explicit user actions
- the UI delegates all auth/sync work and contains no direct fetch or learner-profile persistence calls
- JSON export and Recovery Center remain visible in the local-first safety copy
- the settings card has a compact mobile layout for <=640px
- the v341 production shell still does not load any cloud-sync UI asset

This slice is production-disabled. The next activation slice must assemble auth/transport/controller from a validated public project config and a pinned Supabase browser SDK before the card is loaded by v342.
