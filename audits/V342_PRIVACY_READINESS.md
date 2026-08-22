# FE QUEST v342 — Privacy readiness

Result: **PASS — 25 / 25 PRIVACY-READINESS CHECKS PASS**

- a public Japanese privacy policy documents FE QUEST's local-first storage model
- optional Supabase Auth/cloud synchronization and the data categories involved are disclosed
- GitHub Pages and Supabase are identified as external infrastructure providers
- the policy states that FE QUEST does not currently embed ad/third-party behavioral analytics SDKs or sell learner/email data for advertising
- cloud account deletion and deliberate preservation of local learner data are separately explained
- publishable-key/RLS security boundaries, conflict protection, JSON export, and recovery independence are documented
- an operational GitHub Issues contact route is provided
- the page and public config contain no secret/service-role material, and the policy embeds no tracker script
- v342 public config is prepared for the canonical root `https://taiwanwan64.github.io/fe-quest/` while current v341 production remains cloud-free

Before any future ads, analytics, payments, or additional processors are activated, this policy must be reviewed and updated to match the actual production behavior.
