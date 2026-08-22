# FE QUEST v341 — Distribution split validation

Result: **PASS — 3.68MB INLINE DOCUMENT SPLIT INTO A SMALL HTML SHELL + CACHED CSS/JS WITH NON-DESTRUCTIVE ASSET RECOVERY AND NO LEARNING SEMANTIC DRIFT**

- inline v341 HTML: **3,685,589 bytes**
- split HTML: **96,064 bytes**
- HTML reduction: **97.39%**
- external CSS: **231,671 bytes**
- external classic JS: **3,359,407 bytes**
- after removing only the new recovery bootstrap, split HTML + CSS + JS reconstruct the approved inline v341 document byte-for-byte (trailing newline ignored)
- Service Worker APP_SHELL precaches CSS / JS / asset manifest
- existing PWA navigation fallback + stale-while-revalidate retained
- CSS/JS resource-load failure is caught by a tiny inline bootstrap that shows a reload/connection recovery card and explicitly does not delete learning data
- 科目A 710問 / 正答分布 / cognitive distribution unchanged
- QUESTION_BANK / Subject B content hashes unchanged vs v340 parent
- `buildTodayTasks()` / study-minute allocation / exam-day functions unchanged
- profile/settings key contract unchanged
- Subject B semantics: OK
- fresh first-run setup contract: preserved
- runtime non-destructive contract failures: 0

The v341 cutover keeps the old large source modules in the repository as migration/reference material, but production `index.html` now contains only front matter + one `base-shell-v341.html` include. The delivered page loads one external stylesheet and one synchronous classic application script at the same document positions as the former inline payloads; only the small independent asset-recovery guard remains inline.
