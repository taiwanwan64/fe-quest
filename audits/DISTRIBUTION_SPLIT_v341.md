# FE QUEST v341 — Distribution split validation

Result: **PASS — 3.68MB INLINE DOCUMENT SPLIT INTO A SMALL HTML SHELL + CACHED CSS/JS WITHOUT LEARNING SEMANTIC DRIFT**

- inline v341 HTML: **3,685,589 bytes**
- split HTML: **94,576 bytes**
- HTML reduction: **97.43%**
- external CSS: **231,671 bytes**
- external classic JS: **3,359,407 bytes**
- split HTML + CSS + JS can reconstruct the approved inline v341 document byte-for-byte (trailing newline ignored)
- Service Worker APP_SHELL precaches CSS / JS / asset manifest
- existing PWA navigation fallback + stale-while-revalidate retained
- 科目A 710問 / 正答分布 / cognitive distribution unchanged
- QUESTION_BANK / Subject B content hashes unchanged vs v340 parent
- `buildTodayTasks()` / study-minute allocation / exam-day functions unchanged
- profile/settings key contract unchanged
- Subject B semantics: OK
- fresh first-run setup contract: preserved
- runtime non-destructive contract failures: 0

The v341 cutover keeps the old large source modules in the repository as migration/reference material, but production `index.html` now contains only front matter + one `base-shell-v341.html` include. The delivered page loads one external stylesheet and one synchronous classic script at the same document positions as the former inline tags.
