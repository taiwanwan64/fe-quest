# FE QUEST v342 — Sync conflict simulation

Result: **PASS — LOCAL-FIRST OUTBOX + REMOTE CAS PREVENT SILENT STALE OVERWRITE**

- deterministic scenarios: **14 / 14 PASS**
- no account: local study continues with no cloud dependency
- offline / provider error: local save succeeds and outbox stays pending
- first upload and normal update: accepted only on the expected remote ancestry
- lost HTTP response retry: idempotent `already-synced`
- equal revision + different checksum: explicit divergence
- remote changed since this device's last successful sync: conflict even if local revision is numerically larger
- two-device race: stale device cannot clobber the device that already advanced remote
- offline local saves can coalesce to the newest local revision while keeping the original remote base
- previously synced remote row disappearing: explicit conflict, not silent recreation
- RLS required; direct authenticated INSERT/UPDATE/DELETE revoked; writes go through the guarded RPC
- service-role credential is explicitly prohibited in the PWA

This is still transport-independent. No production network call, credential, account requirement or profile-schema change is introduced by this slice.
