# v365 — Linked-list diagrams and trace presentation

Status: PASS — static/model/browser gates and screenshot review cleared. Implementation head `3c45f11fd0f425da2abdc3fca00b4d3d53a5a1e8` passed [run 33813474912](https://github.com/taiwanwan64/fe-quest/actions/runs/33813474912). The documentation-only final head must also pass CI before merge; its run is recorded in [PR #159](https://github.com/taiwanwan64/fe-quest/pull/159).

## Authorized scope

This release targets only the data-structures article (`core_03_01`) and the presentation of the existing Subject B `linked_list` trace in the lab and mini mock.

- Production baseline: v364, main `2d4d8057f11a6c2bad07b162841a15bf8af1154b`.
- New immutable split release: v365; v364 assets remain unchanged.
- No question bank, answer contract, trace step, completion/XP handler, profile schema, adaptive scheduling, storage/recovery or cloud runtime changes.
- Reference books verified the underlying concepts; all FE QUEST wording, examples and diagrams are original.

## Learning design

- Distinguish physical memory order from logical next-pointer order.
- Compare memory order A → D → C with traversal head → A → C → D → null.
- Show insertion as `B.next ← C` followed by `A.next ← B`; summarize deletion as `A.next ← B.next`.
- Render `next: B`, `next: C`, `next: null` inside existing Subject B trace nodes.
- Mark the current pointer with `p ↓` and explicit text, including the null end state.
- Preserve visited/current styles and share one renderer between the lab and mini mock.
- Keep the article diagram explanatory, with no control or interaction gate.

## Protected contracts

- `linked_list:1` remains `12`; `linked_list:2` remains `21`.
- Existing exercise data, steps, profile schema v5 and 710-question bank remain unchanged.
- Presentation functions do not access profile, storage or network state.

## Reproducible verification

```sh
python .github/v365/materialize_linked_list_diagrams.py
python .github/v365/validate_linked_list_diagrams.py
node .github/v365/browser_linked_list_diagrams.cjs
```

Local static contract: 26/26 PASS. Renderer model tests: 6/6 PASS, covering scope, logical/memory order, safe insertion order, next fields, current/null pointer states, escaping and input immutability.

Browser gate: 4/4 PASS, 18 checks per viewport (72/72 assertions). Chromium 1366/1024 and WebKit 390/320 verify scope, content order, responsive overflow, rerender uniqueness, shared lab/mini-mock rendering, unchanged answer contracts, unchanged saved learning state and uncaught errors. Evidence is stored in artifact `v365-linked-list-diagrams-evidence` (artifact ID `9915693641`). Browser WebKit does not claim physical-device Safari testing.

Screenshot review confirmed readable node/link order at all four widths. The first passing browser run exposed two presentation issues that automated overflow checks alone did not reject: the 1024px right-side BIT teacher panel obscured the wide figure, and an inherited paragraph rule reduced takeaway contrast. The final CSS constrains the figure to 540px at 701–1100px and explicitly keeps the dark takeaway text white. The final screenshots confirm the tablet figure is no longer clipped and the takeaway remains legible.

Initial run `33812133218` was not accepted because the first connector upload truncated the 3.4 MB generated JavaScript; local and remote Git blob hashes now match. Runs `33812385022`, `33812565638` and `33812720447` progressively corrected test-only boot/scope assumptions, including v364's intended first-run navigation lock. None of those changes weakened the production onboarding gate or the linked-list learning contracts.
