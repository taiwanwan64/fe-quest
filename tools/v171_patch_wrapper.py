from pathlib import Path
# Align the exact-inventory set cardinality after adding runV170SelfCheck to the retired adapter boundary.
p=Path('app/runtime-diagnostic-wrapper.txt')
s=p.read_text()
s=s.replace('new Set(retiredAdapters).size===10','new Set(retiredAdapters).size===11')
if 'new Set(retiredAdapters).size===11' not in s:
    raise AssertionError('v171 retired adapter set cardinality assertion not aligned')
p.write_text(s)
print('FEQUEST_V171_WRAPPER_CARDINALITY_ALIGNED retired-adapters=11')
