# Public static protected-content audit — 2026-09-23

## Scope

This audit checks the public GitHub repository and the GitHub Pages publication boundary after the runtime/profile retention work in v430–v435.

The review covers:

- public `assets/` JavaScript and JSON catalogs
- provider / bridge code shipped to browsers
- the Pages artifact build rule
- service-worker precache membership
- redacted / quarantined legacy runtime residues
- repository audit/document wording that could reveal external source material

Protected question and lesson banks remain the authoritative private content stores. This audit does not copy their bodies into the public repository.

## Publication boundary

The repository is public. The Pages workflow currently copies the repository into the site artifact while excluding `.git/`, `.github/`, `README.md`, and later verifies that `supabase/` is not present.

Therefore, any protected-content residue inside a public runtime asset is exposed both through repository source and, unless excluded, through Pages.

## Catalog audit

Representative base, IPA 9.2 extension, and Subject-B gap catalogs were inspected. They contain metadata such as identifiers, source pools, categories, difficulty, concepts, parent IDs, domains and formats.

They do not contain protected question-body fields such as:

- question stem
- options
- answer index
- explanation
- hint
- choice explanations
- point / pitfall text

v436 adds a publication CI check across every `assets/question-catalog*.json` file so those protected fields cannot be added silently in a later change.

## Provider audit

Representative current and historical provider files were inspected. Their references to `options`, `answerIndex`, `explanation`, and related names are transport/runtime field handling, not embedded static question-bank records.

The current runtime loads the base provider first and the latest v35 provider through the public activation layer. Historical provider versions are still present and precached for compatibility/history, but no embedded protected question-bank body was found in the sampled providers.

Removing obsolete historical provider versions is a separate cleanup because the current validation matrix explicitly references them. It is intentionally not mixed into this content-removal change.

## Finding: legacy mini-mock residual

A dead legacy Subject-B mini-mock block remained in `assets/app-v377.js`.

Although the protected mini-mock builder had already been redacted, two unused constants still contained exact distractor values and detailed answer explanations associated with protected exercise IDs.

The constants had no remaining read sites. They were therefore unnecessary public residual content rather than runtime metadata.

v436 removes both legacy constants:

- `B_MOCK_EXTRA_DISTRACTOR`
- `B_MOCK_EXPLANATION`

No question selection, grading, learner history, profile schema, or protected-bank data is changed.

## New static boundary contract

v436 adds `PUBLIC_STATIC_PROTECTED_CONTENT_V436_SPEC` and CI guards that require:

- protected public catalogs to stay metadata-only
- the two legacy mini-mock residual constants to remain absent
- the v436 static-publication policy to remain present in the production app bundle

The same checks are applied both before publication and against the assembled Pages artifact.

## State after v436

- profile schema: 9 (unchanged)
- protected bank: unchanged
- active protected question total: 1180
- Subject-B final algorithm pool: 50
- target PWA cache: `fe-quest-v377-118`
