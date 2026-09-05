# v371 — Paging mapping and replacement diagram

Status: implementation complete; release acceptance is tracked by the final checks on [PR #165](https://github.com/taiwanwan64/fe-quest/pull/165).

## Learner-facing goal

The OS lesson (`core_06_01`) explains fixed-size pages and page faults without showing the page-to-frame mapping. Compare the same three physical frames before and after a demand-page replacement.

- Four virtual pages, three physical frames: `[1, 3, 0]` → `[2, 3, 0]`.
- Page 2 is initially in secondary storage, not main memory.
- Frame 0 is chosen as the victim for this illustration; no FIFO/LRU choice is implied.
- Show all four page-table entries before and after. Page 1 becomes nonresident, page 2 maps to frame 0.
- Show fault → make room (write back only if needed) → page-in → update mapping and resume.
- Explain that an available frame needs no replacement, the offset is unchanged, physical memory does not grow, and excessive paging can cause thrashing.
- Use equally sized panels and tables, semantic table headers/captions, numbered steps, and textual labels independent of color.

The existing OS lab was reviewed: it teaches CPU scheduling, with `osSteps === 3` as its completion condition. It is unrelated to page replacement and remains unchanged.

## Safety boundary

- New immutable split release v371; all earlier assets unchanged.
- Profile schema 5, 710 questions, original question/answer contracts.
- No existing curriculum prose, completion gates, XP, persistence, recovery, or cloud code changes.
- Static-only presentation: no events, new storage, network access, or learner controls.
- Exact runtime equality against v370 plus the reviewed source/mount verifies the boundary.
- Correct the stale v369 header in the development plan and record backup as the next candidate.

## Acceptance

```text
python .github/v371/materialize_paging_diagram.py
python .github/v371/validate_paging_diagram.py
node .github/v371/browser_paging_diagram.cjs
```

- Model: 12/12 PASS locally.
- Static/split contract: 24/24 PASS locally.
- Browser gate: Chromium 1366px and mobile-sized WebKit 402/390/320px; verify equal card/table widths, one-line titles and frame labels, both page tables, constant frame count, ordered steps, no overflow, no learning-state mutation, safe reopen, target-only rendering, and no runtime errors/recovery UI.
- Automated WebKit coverage is not a claim of physical iPhone testing.

## Browser evidence

- Initial acceptance: [Actions run 33948831214](https://github.com/taiwanwan64/fe-quest/actions/runs/33948831214), 13 checks × 4 viewports PASS.
- Equal before/after panel widths: desktop 373px, mobile 402px viewport 278px, 390px viewport 274px, 320px viewport 210px.
- Both page tables and all frame labels are correct and free of overflow.
- Visual review shortened the overall caption to avoid a one-character last line; the final gate also requires the caption to stay on one line.
- Context screenshots retain the real UI. Figure-only screenshots hide fixed header/navigation/chat chrome during capture, avoiding full-height screenshot compositing artifacts; measurements and runtime remain unmodified.
- Final browser checks: 14 per viewport, with the same safety and scope boundaries. The final PR head must pass before merge; its check and PR summary are the acceptance record.
