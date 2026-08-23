# FE QUEST v344 — Recent learning report

Result: **PASS — 35 / 35 V344 REPORT CASES PASS**

The v344 candidate adds one compact, display-only "最近の学習レポート" card near the top of the existing learning analytics screen.

The report separates two kinds of evidence deliberately:

- learning pace uses calendar-indexed activity and can state the last 7 days of recorded learning time / active days;
- category improvement uses bounded saved-answer windows, exposes the actual recent/previous sample counts, and explicitly does not claim a complete week-vs-week comparison.

An increase smaller than 8 points is not labelled as meaningful growth. The next-focus summary keeps the existing priority: an active review journey first, otherwise the weakest attempted category by cumulative accuracy/mastery. No additional learner-data write, profile field, or pass-probability representation is introduced.

Validation preserved the 710-question bank, answer distribution `[178,178,177,177]`, cognitive distribution `[166,323,221]`, Subject B semantics, fresh first-run, current contract 71/71, Browser UI contract 23, runtime contract failures 0, profile schema v5, v342 cloud runtime continuity, and production v343 source bytes.

Production remains **v343** during this candidate validation.
