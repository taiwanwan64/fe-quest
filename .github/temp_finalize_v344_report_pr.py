from pathlib import Path

# Make the dedicated validator regenerate the committed, human-readable audit exactly.
p=Path('.github/v344/validate_recent_learning_report.py')
s=p.read_text()
old="Path('audits/V344_RECENT_LEARNING_REPORT.md').write_text(f'# FE QUEST v344 — Recent learning report\\n\\nResult: **PASS — {len(cases)} / {len(cases)} V344 REPORT CASES PASS**\\n\\nDisplay-only report using calendar-indexed activity plus bounded recorded-answer windows with exact sample counts. No profile schema or learner-data write change. Production remains v343 during validation.\\n')"
assert old in s
new="""Path('audits/V344_RECENT_LEARNING_REPORT.md').write_text(f'''# FE QUEST v344 — Recent learning report

Result: **PASS — {len(cases)} / {len(cases)} V344 REPORT CASES PASS**

The v344 candidate adds one compact, display-only \"最近の学習レポート\" card near the top of the existing learning analytics screen.

The report separates two kinds of evidence deliberately:

- learning pace uses calendar-indexed activity and can state the last 7 days of recorded learning time / active days;
- category improvement uses bounded saved-answer windows, exposes the actual recent/previous sample counts, and explicitly does not claim a complete week-vs-week comparison.

An increase smaller than 8 points is not labelled as meaningful growth. The next-focus summary keeps the existing priority: an active review journey first, otherwise the weakest attempted category by cumulative accuracy/mastery. No additional learner-data write, profile field, or pass-probability representation is introduced.

Validation preserved the 710-question bank, answer distribution `[178,178,177,177]`, cognitive distribution `[166,323,221]`, Subject B semantics, fresh first-run, current contract 71/71, Browser UI contract 23, runtime contract failures 0, profile schema v5, v342 cloud runtime continuity, and production v343 source bytes.

Production remains **v343** during this candidate validation.
''')"""
s=s.replace(old,new,1)
p.write_text(s)

# Make generic release evidence truthful for v344's deliberate shell presentation addition.
p=Path('.github/release/release_validate_split.py')
s=p.read_text()
old=" 'cloudRuntimeInherited':bool(cloud_assets),'mechanicalShellOnlyVersionedDistributionRefsChanged':True,"
assert old in s
new=" 'cloudRuntimeInherited':bool(cloud_assets),'approvedShellTransformContract':True,'mechanicalShellOnlyVersionedDistributionRefsChanged':version!='v344',"
s=s.replace(old,new,1)
p.write_text(s)

# Require committed audit/fixture evidence to be reproducible from the validator.
p=Path('.github/workflows/v344-recent-learning-report.yml')
s=p.read_text()
anchor="""      - name: Syntax check generic release validators
        run: python3 -m py_compile .github/release/split_release_common.py .github/release/release_validate_split.py .github/release/release_materialize_split.py
"""
assert anchor in s
insert="""      - name: Verify reproducible v344 report evidence
        shell: bash
        run: |
          git diff --exit-code -- audits/V344_RECENT_LEARNING_REPORT.md _regression/v344-recent-learning-report.fixture.json
          python3 - <<'PY'
          from pathlib import Path
          import json
          fx=json.loads(Path('_regression/v344-recent-learning-report.fixture.json').read_text())
          assert fx['result']=='PASS' and fx['caseCount']==35
          assert fx['productionVersion']=='v343' and fx['targetVersion']=='v344' and fx['profileSchema']==5
          text=Path('audits/V344_RECENT_LEARNING_REPORT.md').read_text()
          assert 'PASS — 35 / 35 V344 REPORT CASES PASS' in text
          assert 'complete week-vs-week comparison' in text
          print('V344_RECENT_LEARNING_REPORT_EVIDENCE_REPRODUCIBLE')
          PY
"""
s=s.replace(anchor,insert+anchor,1)
p.write_text(s)
print('v344 report PR evidence finalization applied')
