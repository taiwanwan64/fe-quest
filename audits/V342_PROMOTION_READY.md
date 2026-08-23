# FE QUEST v342 — Promotion readiness

Prepared from main `94b7d06c9f091a6ec7eb65a08a3e6a048f281169` after live Auth and learner-profile acceptance completed on 2026-08-23.

Release gates completed before staging refresh:
- live Auth: returning + new user passwordless PKCE
- explicit first cloud upload
- browser B cloud adoption
- offline local save -> reconnect sync
- stale-client conflict detection
- both conflict resolutions
- logout preserves local data
- account deletion removes Auth/cloud data but preserves local data
- JSON export + Recovery Center after account deletion
- Supabase Performance Advisor: 0 lints
- Supabase Security Advisor: only the two documented warnings already accepted for the passwordless + guarded-CAS design
- reconnect stale offline-notice cleanup merged before staging refresh

Production is still v341 until this refreshed v342 staging branch completes full release validation and its fresh promotion PR is merged.
