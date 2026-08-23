from pathlib import Path
import re
js=Path('assets/app-v344.js').read_text()

def extract_named(name):
    out=[]
    for m in re.finditer(rf'\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',js):
        i=m.end()-1;depth=0;quote=None;esc=False
        while i<len(js):
            ch=js[i]
            if quote:
                if esc:esc=False
                elif ch=='\\':esc=True
                elif ch==quote:quote=None
            else:
                if ch in "'\"`":quote=ch
                elif ch=='{':depth+=1
                elif ch=='}':
                    depth-=1
                    if depth==0:
                        out.append((m.start(),js[m.start():i+1]));break
            i+=1
    return out

for name in ['examPaceStatus','renderExamPace','remainingLearningMinutes','recentLearningPace','estimatedFinishDate','paceDateText']:
    defs=extract_named(name)
    print(f'=== {name} COUNT {len(defs)} ===')
    for pos,src in defs:
        print('POSITION',pos)
        print(src)

for token in ['examPaceStatus=','const examPaceStatus','let examPaceStatus','var examPaceStatus']:
    print(token,js.count(token))
