from pathlib import Path
import json,re,hashlib

js=Path('assets/app-v343.js').read_text()
shell=Path('app/base-shell-v343.html').read_text()
css=Path('assets/app-v343.css').read_text()

names=re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(',js)
interesting=[n for n in names if re.search(r'analytics|analysis|insight|report|progress|profile|readiness|trend|summary|weak|recommend',n,re.I)]

needles=['次に伸ばすポイント','学習分析','準備度','readiness','analytics','週次','今週','伸びた','弱点','学習履歴']
occ={}
for needle in needles:
    loc=[]
    for m in re.finditer(re.escape(needle),js,re.I):
        line=js.count('\n',0,m.start())+1
        loc.append(line)
        if len(loc)>=12: break
    occ[needle]=loc

# collect compact surrounding snippets by line for relevant Japanese strings and likely render funcs
lines=js.splitlines()
def around(line_no,radius=5):
    a=max(1,line_no-radius);b=min(len(lines),line_no+radius)
    return {'start':a,'end':b,'text':'\n'.join(f'{i}: {lines[i-1]}' for i in range(a,b+1))}

snips=[]
seen=set()
for needle in ['次に伸ばすポイント','学習分析','準備度']:
    for ln in occ.get(needle,[])[:4]:
        if ln not in seen:
            snips.append({'needle':needle,**around(ln,6)});seen.add(ln)

# inspect declarations of interesting funcs only, first line + nearby lines
func_snips=[]
for n in interesting[:80]:
    m=re.search(rf'\bfunction\s+{re.escape(n)}\s*\([^)]*\)\s*\{{',js)
    if not m: continue
    ln=js.count('\n',0,m.start())+1
    func_snips.append(around(ln,3))

# identify candidate DOM ids/classes in shell containing analytics/profile/insight terminology
ids=re.findall(r'\bid=["\']([^"\']+)["\']',shell)
classes=re.findall(r'\bclass=["\']([^"\']+)["\']',shell)
candidate_ids=[x for x in ids if re.search(r'analytics|analysis|profile|progress|insight|readiness',x,re.I)]
candidate_classes=sorted({c for group in classes for c in group.split() if re.search(r'analytics|analysis|profile|progress|insight|readiness',c,re.I)})

out={
 'bundle':{'bytes':len(js.encode()),'sha256':hashlib.sha256(js.encode()).hexdigest(),'functionCount':len(names)},
 'interestingFunctionNames':interesting,
 'occurrences':occ,
 'candidateIds':candidate_ids,
 'candidateClasses':candidate_classes,
 'stringSnippets':snips,
 'functionSnippets':func_snips,
}
print('V344_OUTCOMES_DISCOVERY_BEGIN')
print(json.dumps(out,ensure_ascii=False,indent=2))
print('V344_OUTCOMES_DISCOVERY_END')
