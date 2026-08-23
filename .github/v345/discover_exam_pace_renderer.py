from pathlib import Path
import re
js=Path('assets/app-v344.js').read_text()
needle='examPacePanel'
for m in re.finditer(needle,js):
    start=max(0,js.rfind('function ',0,m.start()))
    end=js.find('\nfunction ',m.end())
    if end<0:end=min(len(js),m.end()+4000)
    print('--- EXAM_PACE_PANEL_CONTEXT ---')
    print(js[start:end])
print('COUNT',js.count(needle))
