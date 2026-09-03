# v365 — Linked-list diagrams and trace presentation

Status: static contract PASS locally; responsive browser gate and screenshot review are required before merge.

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

Local static contract and renderer model tests must pass. The browser gate targets Chromium at 1366px and 1024px, plus WebKit at 390px and 320px. It checks scope, content order, responsive overflow, rerender uniqueness, shared lab/mini-mock rendering, unchanged answer contracts, unchanged saved learning state and uncaught errors. Browser WebKit does not claim physical-device Safari testing.
