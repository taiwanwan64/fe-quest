# v370 — Deadlock wait-cycle diagram

Status: implementation complete; CI browser acceptance required before merge.

## Learner-facing goal

The `core_09_06` exclusion-control lesson names deadlock but did not show how two individually reasonable locks become a circular wait. Add one static diagram that follows the held resource and requested resource for two transactions.

## Learner-facing change

- Show process A locking the product table before requesting the order table.
- Show process B locking the order table before requesting the product table.
- Make both held resources and both waiting directions visible at once.
- Explain why neither process can reach its unlock operation while the wait is circular.
- Show consistent lock order as a prevention pattern.
- Show detection followed by rolling back one transaction as a recovery pattern.
- Stack all paired cards to equal width on narrow screens without horizontal overflow.

The existing `LOCKしてから更新する` lab was reviewed. It teaches the normal LOCK → wait → UNLOCK path and has a separate completion contract, so v370 does not change that interaction or its progression gate.

## Safety boundary

- Immutable split release: v370; v369 assets remain unchanged.
- Profile schema remains 5 and the question bank remains 710.
- No question, answer, curriculum prose, lesson completion, XP, persistence, recovery, or cloud behavior changes.
- No new learner interaction or completion gate.

## Acceptance

```text
python .github/v370/materialize_deadlock_diagram.py
python .github/v370/validate_deadlock_diagram.py
node .github/v370/browser_deadlock_diagram.cjs
```

The browser gate checks Chromium at 1366 CSS px and WebKit at 402, 390, and 320 CSS px. It verifies equal process and solution cards, two held resources, two mutual waits, the rollback recovery card, readable process titles, no overflow, unchanged learning state, and no uncaught errors or recovery UI.
