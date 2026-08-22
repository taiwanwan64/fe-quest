# FE QUEST v342 — Cloud runtime bootstrap validation

Result: **PASS — 14 / 14 ACTIVATION-BOUNDARY CASES PASS**

- repository public cloud config is disabled by default and contains no real project URL/key
- service-role/secret credentials are rejected before runtime assembly
- enabled config requires HTTPS Supabase project and HTTPS auth redirect URLs
- missing browser SDK fails open as `sdk-missing`; local FE QUEST remains independent
- valid config assembles auth, transport, post-commit outbox, reconciliation, controller, and learner UI
- runtime start initializes PKCE auth and installs only the post-local-commit observer
- an existing signed-in session still does not enable sync automatically
- explicit enable performs the first remote read/upload
- later local commits queue without network; manual sync performs the transport flush
- stop restores the original local writer and disposes the auth subscription
- bootstrap has no direct fetch or learner-profile persistence calls
- the v341 production shell remains cloud-free

The remaining production blocker is external deployment: create/configure the Supabase project, apply `v342_schema.sql`, configure redirect URLs/email delivery, pin/vendor the browser SDK, then replace the disabled public config and release v342 through the split-aware release validator.
