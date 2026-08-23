# FE QUEST v344 — Learning outcome presentation discovery

Result: **PASS — existing analytics can support a safer outcome summary without changing profile schema**

The current v343 analytics screen already has the right learner-facing home for v344: recorded learning time, active days, review-route completion, recent category changes, cumulative category accuracy/mastery, Subject B format results, and one prioritized next action.

The important boundary is evidence wording. `profile.activity` is indexed by calendar date, so "直近7日の記録学習時間" and recent active-day counts can be stated as calendar-window metrics. Category accuracy trends are different: `analyticsTrend()` compares the newest recorded answer rows with the preceding recorded answer rows. It is **not** a complete calendar-week comparison and must not be presented as "今週 vs 先週".

The current trend implementation also permits as few as 3 rows in each side of the comparison, while each side is capped at 10. v344 should therefore show the actual evidence size (for example, "直近6回答 / その前6回答") rather than always implying ten answers.

Recommended first v344 change:

- add one compact "最近の学習レポート" card near the top of the existing analytics screen;
- show calendar-safe activity metrics from `profile.activity`;
- show "最近伸びた分野" only when bounded recorded-answer evidence supports it, with exact sample counts;
- show one "次に伸ばす分野" using the existing review-first / weakest-attempted-area priority;
- do not introduce a new profile field, storage write, analytics wrapper, or pass-probability wording;
- integrate through the existing named `renderLearningAnalytics()` during v344 release materialization.

Production v343 application/runtime files were byte-untouched by this discovery.
