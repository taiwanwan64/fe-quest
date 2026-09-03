# v360 — Stack / queue comparison and interactive state diagrams

Status: PENDING — browser CI and visual acceptance required before merge.

## Authorized scope

The user requested the next diagram series starting with stacks and queues, including improvements to existing interactive diagrams where useful. This release targets only the data structures article (`core_03_01`) and the optional `stackqueue` lab.

- Production baseline: v359, main `010d609c054f3dc97fccbfcb76b37474194fe160`.
- New immutable split release: v360; previous assets remain unchanged.
- No question bank, existing curriculum text, quiz answer, completion/XP handler, profile schema, adaptive scheduling, storage/recovery or cloud runtime changes.

## Learning design

- Compare the same initial insertion A → B → C with stack TOP C and queue FRONT A.
- Explicit TOP / FRONT / REAR labels, insertion/removal ends, next output and remaining contents.
- Article shows POP C / DEQUEUE A and full removal C → B → A / A → B → C without requiring interaction.
- Lab adds PUSH and ENQUEUE, repeated removal, empty/full guards and local reset.
- Six elements is an explained display limit, not a property of either abstract data type.
- Both diagrams use vertical cells to align the next output. They describe logical operation order, not physical memory placement.
- Before/after live status and persistent controls support keyboard and screen-reader use.
- POP is labeled as a removal operation in the target lab headline/copy and article example, preventing the generic abbreviation helper from incorrectly expanding it as Post Office Protocol. Stored curriculum and question definitions are unchanged; other lessons retain their existing abbreviation behavior.
- Legacy gate is unchanged: one successful POP and one successful DEQUEUE. Reset preserves confirmed operations; additional experimentation is optional.
- Demo arrays are ephemeral closure state. Reset never alters saved lesson progress.

## Reproducible verification

```sh
python .github/v360/materialize_stack_queue_diagrams.py
python .github/v360/validate_stack_queue_diagrams.py
python .github/v360/browser_stack_queue_diagrams.py
```

Local static contract: 33/33 PASS. Reducer/renderer unit tests: 15/15 PASS, including a seeded 600-operation reference comparison, LIFO/FIFO, bounds, reset, immutability, escaping and operation-label idempotence.

Browser gate: PENDING. Chromium 1366/1024 and WebKit 390/320 test responsive layout, static scope, repeated operations, before/after status, keyboard focus, both reset stages, unchanged interaction and quiz gates, XP/lesson completion, reload persistence and fresh demo state.

Visual evidence will be captured under `_browser_evidence/v360/` in the CI artifact. Browser WebKit is not physical-device Safari testing.

## Initial acceptance findings

Run `33700729026` was not accepted. Chromium passed operation/reset/focus/layout checks but the test incorrectly expected a fourth recap page: `applyLessonDensityAudit()` already folds that recap into the operation-completion takeaway and keeps a three-page lab. The gate now checks the actual three-page behavior; no page or quiz is added. WebKit was interrupted by initial service-worker `clients.claim()` / controllerchange navigation. The gate now waits for an activated controller and a stable boot/pageshow document before interacting, including after reload.

The screenshots also exposed the existing POP mail-protocol expansion in the lab quiz. The scoped display correction above is covered by static and browser checks.
