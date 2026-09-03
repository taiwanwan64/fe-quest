# v364 — Guided first-run onboarding

Status: ACCEPTED — static and Chromium/WebKit browser acceptance passed.

## Finding

The fresh-profile home screen combined the required study settings, the diagnostic invitation,
the normal home content and the primary navigation. A learner could leave onboarding before the
initial state was ready. In addition, the diagnostic result button navigated to home and then
programmatically clicked the daily resume button, so the first review session started before the
learner could understand the generated plan.

The empty review task also said `今日の復習期限はなし`, which did not explain why a review task
was still present, and the exercise helper used the unnecessarily restrictive phrase
`目的を変えたいときだけ`.

## Correction

- Fresh profiles follow one guided route:
  1. optional email Magic Link login/registration or explicit skip;
  2. exam date and daily study time when not already configured;
  3. the existing 12-question diagnostic;
  4. diagnostic result acknowledgement;
  5. home with the generated daily plan.
- The sidebar/bottom navigation, settings/stat controls and BIT teacher entry are hidden during
  the first-run route and unlock only after the learner acknowledges the diagnostic result.
- The desktop grid collapses to one content column during onboarding, so hidden side content cannot
  reserve space or intercept input.
- The account screen delegates the explicit send action to the existing v342 authentication UI.
  Authentication remains optional, and cloud activation failure never blocks the skip route.
- Existing learners with a completed diagnostic or actual learning history bypass the new gate.
- The diagnostic result CTA is `ホーム画面へ →`; it rebuilds today's plan from the saved diagnostic
  result and does not automatically launch the first task.
- An empty due queue says `期限を迎えた復習問題はありません。「…」の弱点問題で定着を確認します。`.
- The exercise helper says `目的を変えたいときは、ほかの演習も選べます。`.

## Boundaries

- Existing diagnostic questions, scoring, skill updates and the 120 XP reward are unchanged.
- The profile remains schema v5 and the question bank remains 710 questions.
- No existing learner is forced through onboarding again.
- The v342 Magic Link, PKCE, local-first synchronization, explicit conflict choice and fail-open
  cloud runtime are unchanged.
- Save/recovery/reset behavior and existing v363 memory/readiness corrections are unchanged.
- A complete reset clears the existing UI-state record, so the guided route is offered again as
  part of deliberately returning FE QUEST to its initial state.

## Required verification

- Static release diff must equal the v363→v364 version transform plus the reviewed onboarding
  layer, four copy/routing replacements and CSS scoped to the first-run body class.
- Browser automation must complete account skip → settings → all 12 diagnostic questions → result
  → home in Chromium 1366/1024 and WebKit 390/320.
- Navigation must remain hidden through the result and unlock on home.
- The result CTA must not enter a quiz or review session automatically.
- Saved exam date/study minutes, the clearer review copy and the exercise helper copy must survive
  the route and reload.
- A completed learner must not be gated again.
- Screenshots must cover account, settings, diagnostic and first home at all four widths.

## Observed results

- Static/release contract: 36/36 PASS.
- v363 memory model: 5/5 PASS.
- v362 complete-reset readiness model: 5/5 PASS.
- v360 stack/queue model: 15/15 PASS.
- Runtime JavaScript syntax: PASS.
- Initial browser run `33746505215` caught the desktop/tablet grid still reserving hidden side
  columns and allowing them to intercept input. The first-run grid now collapses to one column;
  the corrected Chromium/WebKit run is the merge gate.
- Corrected GitHub Actions run `33747054639`: 92/92 browser checks PASS across Chromium at
  1366/1024px and WebKit at 390/320px, with zero uncaught page errors.
- All 16 evidence screenshots (account, settings, diagnostic and first home at each width) were
  visually reviewed; navigation remains absent until the result is acknowledged, the guided cards
  stay within the viewport and the resulting home restores normal navigation.
