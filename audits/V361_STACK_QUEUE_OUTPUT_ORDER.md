# v361 — Unambiguous remaining output order

Status: implemented; browser CI and screenshot review required before merge. Final verification and deployment results are recorded in the release PR.

## Scope

The user found the stack result card confusing: after POP C, the diagram showed A → B under a bottom-to-top placement label, whereas the next removals are B → A.

- Baseline: v360, main `3a24b3bfe89c55dbb8036741a88b972651a138fc`.
- Both result cards now use **残りを取り出す順**.
- Stack after one POP: **B → A**; queue after one DEQUEUE: **B → C**.
- Only two result-card fragments and the release version change in the application JS.
- CSS, reducer, interactive controller, quiz, XP, saved progress, schema v5, 710 questions, storage/recovery and cloud implementation remain unchanged.
- Existing v360 assets are preserved. The v361 patch is tracked in `app/stack-queue-output-order-v361.json` and included in the asset manifest by hash.

## Verification

```sh
python .github/v361/materialize_stack_queue_output_order.py
python .github/v361/validate_stack_queue_output_order.py
python .github/v361/browser_stack_queue_output_order.py
```

The static contract checks the full JS against exactly the version bump plus the two approved text substitutions; it also verifies identical CSS, shell-only release updates, manifest hashes and retained data boundaries.

The semantic regression test executes the actual v361 renderer and reducer, removes the first item, then drains each structure and compares those outputs with the rendered result cards.

The v360 browser suite is retained as a historical test. The v361 suite repeats its 40 checks per viewport, adding four checks for the shared label and output order. Target viewports: Chromium 1366/1024 and WebKit 390/320. It checks display overflow, interaction/quiz gates, keyboard controls, reset, XP and persistence after reload. CI screenshots must be inspected before merge. WebKit tests do not claim physical iPhone Safari testing.
