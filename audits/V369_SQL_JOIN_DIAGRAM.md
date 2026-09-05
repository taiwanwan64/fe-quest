# v369 — SQL join result diagram

Status: implementation complete; CI browser acceptance required before merge.

## Learner-facing goal

The `core_09_07` SQL lesson previously explained JOIN in prose but did not show which source rows survive each join type. Add one static comparison using the same employee and department data for both results.

## Learner-facing change

- Show employee as the left table and department as the right table.
- Highlight `employee.dept_id = department.dept_id` as the shared join condition.
- Show that INNER JOIN keeps only the matching keys 10 and 20.
- Show that LEFT OUTER JOIN keeps all three employee rows and represents the unmatched department name for key 30 as `NULL`.
- Explicitly explain that the right-only department key 40 is not added to a left join result.
- Stack source and result cards on narrow screens without horizontal overflow.

The existing `SQL WHEREを動かす` lab was reviewed. It teaches row filtering and has a separate completion contract, so v369 does not overload that interaction with JOIN or change its progression gate.

## Safety boundary

- Immutable split release: v369; v368 assets remain unchanged.
- Profile schema remains 5 and the question bank remains 710.
- No question, answer, curriculum prose, lesson completion, XP, persistence, recovery, or cloud behavior changes.
- No new learner interaction or completion gate.

## Acceptance

```text
python .github/v369/materialize_sql_join_diagram.py
python .github/v369/validate_sql_join_diagram.py
node .github/v369/browser_sql_join_diagram.cjs
```

The browser gate checks Chromium at 1366 CSS px and WebKit at 402, 390, and 320 CSS px. It verifies source/result card widths, 2-row and 3-row result cardinalities, the unmatched `NULL` row, readable join labels, no overflow, unchanged learning state, and no uncaught errors or recovery UI.
