# FE QUEST v342 — Cloud provider decision

Decision date: 2026-08-22

## Decision

**Use Supabase (Postgres + Auth + Row Level Security) as the first v342 cloud-sync backend.**

This is a backend choice, not a change to FE QUEST's local-first product contract. The app must remain fully usable without an account or network connection, and local persistence/recovery remains the first line of data safety.

## Evidence from FE QUEST

The v342 local contract discovery measured a fresh schema-v5 profile at **239,594 bytes** with **33 top-level profile keys**. Even before long-term question history, mock history, Subject B history, recovery metadata and future fields accumulate, this is already about one quarter of Firestore Standard's 1 MiB document hard limit.

The current production profile is deliberately a variable-schema aggregate. Splitting it into many remote documents before the first cloud implementation would multiply conflict rules and make local/remote recovery harder. Supabase/Postgres `jsonb` can store the profile as one user-owned payload while keeping sync metadata in normal relational columns.

## Supabase fit

Official Supabase documentation currently states:

- Free plan: $0/month, 500 MB database, 5 GB egress, 50,000 monthly active users. Free projects may pause after one week of inactivity and do not include automatic backups.
- Pro: from $25/month, 8 GB database included, 250 GB egress, 100,000 MAU, and 7 days of daily backups.
- Supabase Auth uses JWTs and is designed to integrate with Postgres Row Level Security.
- RLS policies can restrict rows with `auth.uid()`.
- Supabase recommends `jsonb` for most variable-schema JSON use cases.

Official references checked 2026-08-22:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/auth
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/json

## Firebase comparison

Firestore Standard remains technically viable, but it is a weaker fit for the first FE QUEST sync implementation:

- Standard Firestore has a **1 MiB maximum document size**.
- Current free quota is 1 GiB stored data, 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB/month outbound transfer.
- The fresh FE QUEST profile is already 239,594 bytes. A one-document-per-user design therefore starts with materially less growth headroom.
- Sharding question/history data across multiple Firestore documents would solve the size limit, but would also force v342 to define cross-document atomicity, merge ordering and recovery semantics immediately.
- Firebase's client offline persistence is valuable in many apps, but FE QUEST already has its own mature local-first atomic save, last-known-good, migration, recovery point and multi-tab protection. Replacing those mechanisms is explicitly out of scope.

Official references checked 2026-08-22:
- https://firebase.google.com/docs/firestore/pricing
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/auth

## v342 security contract

1. The browser must never contain a Supabase `service_role` key.
2. Only the public/publishable client key may be shipped to the PWA.
3. `user_profiles` must have RLS enabled.
4. A user may read/write only the row whose `user_id = auth.uid()`.
5. Remote writes use compare-and-swap semantics, not blind upsert.
6. A remote row changed since this device's last successful sync is a conflict even if the local profile revision is numerically larger.
7. Equal revision + equal checksum is idempotent success.
8. Equal revision + different checksum is explicit divergence and must never silently overwrite either side.
9. Auth/network/provider failure leaves the local save successful and the sync outbox pending.
10. Recovery Center and JSON export remain available independently of the cloud provider.

## Cost/operations decision

For personal development and a small private beta, the Supabase Free plan is sufficient for proving the contract. Its one-week inactivity pause and lack of automatic backups mean it is **not** the intended production tier for a paid service. Before a paid beta, budget for at least the Pro tier or re-evaluate the then-current pricing/backup requirements.

## Next implementation slice

Do **not** add Supabase credentials or a network SDK yet. First land:

- provider-neutral outbox state contract;
- compare-and-swap SQL/RLS contract;
- deterministic conflict simulations (two devices, offline edits, stale remote/local, equal-revision divergence);
- split-aware release tooling for v342.

Only after those pass should the browser transport/auth adapter be added.
