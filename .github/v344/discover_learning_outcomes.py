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

lines=js.splitlines()
def around(line_no,radius=5):
    a=max(1,line_no-radius);b=min(len(lines),line_no+radius)
    return {'start':a,'end':b,'text':'\n'.join(f'{i}: {lines[i-1]}' for i in range(a,b+1))}

def extract_named_function(src,name):
    m=re.search(rf'\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',src)
    if not m:return None
    i=m.end()-1;depth=0;quote=None;esc=False
    while i<len(src):
        ch=src[i]
        if quote:
            if esc:esc=False
            elif ch=='\\':esc=True
            elif ch==quote:quote=None
        else:
            if ch in "'\"`":quote=ch
            elif ch=='{':depth+=1
            elif ch=='}':
                depth-=1
                if depth==0:return src[m.start():i+1]
        i+=1
    raise RuntimeError(name)

snips=[]
seen=set()
for needle in ['次に伸ばすポイント','学習分析','準備度']:
    for ln in occ.get(needle,[])[:4]:
        if ln not in seen:
            snips.append({'needle':needle,**around(ln,6)});seen.add(ln)

func_snips=[]
for n in interesting[:80]:
    m=re.search(rf'\bfunction\s+{re.escape(n)}\s*\([^)]*\)\s*\{{',js)
    if not m: continue
    ln=js.count('\n',0,m.start())+1
    func_snips.append(around(ln,3))

ids=re.findall(r'\bid=["\']([^"\']+)["\']',shell)
classes=re.findall(r'\bclass=["\']([^"\']+)["\']',shell)
candidate_ids=[x for x in ids if re.search(r'analytics|analysis|profile|progress|insight|readiness',x,re.I)]
candidate_classes=sorted({c for group in classes for c in group.split() if re.search(r'analytics|analysis|profile|progress|insight|readiness',c,re.I)})

# Exact existing analytics implementation and markup location, to choose a no-wrapper integration hook.
exact_funcs={n:extract_named_function(js,n) for n in [
  'analyticsAttemptStream','analyticsTrend','analyticsCategorySnapshot','renderAnalyticsSignals','renderAnalyticsNext','renderLearningAnalytics'
]}

shell_lines=shell.splitlines()
def shell_region_for_id(id_,radius=24):
    for i,line in enumerate(shell_lines,1):
        if f'id="{id_}"' in line or f"id='{id_}'" in line:
            a=max(1,i-radius);b=min(len(shell_lines),i+radius)
            return {'start':a,'end':b,'text':'\n'.join(f'{n}: {shell_lines[n-1]}' for n in range(a,b+1))}
    return None

# Existing analytics CSS block(s), compactly extracted around selectors.
css_lines=css.splitlines()
css_regions=[]
for i,line in enumerate(css_lines,1):
    if '.analytics-summary' in line or '.analytics-next' in line or '.analytics-grid-top' in line:
        a=max(1,i-4);b=min(len(css_lines),i+18)
        text='\n'.join(f'{n}: {css_lines[n-1]}' for n in range(a,b+1))
        if text not in [x['text'] for x in css_regions]:css_regions.append({'start':a,'end':b,'text':text})

out={
 'bundle':{'bytes':len(js.encode()),'sha256':hashlib.sha256(js.encode()).hexdigest(),'functionCount':len(names)},
 'interestingFunctionNames':interesting,
 'occurrences':occ,
 'candidateIds':candidate_ids,
 'candidateClasses':candidate_classes,
 'stringSnippets':snips,
 'functionSnippets':func_snips,
 'exactFunctions':exact_funcs,
 'analyticsShellRegion':shell_region_for_id('analyticsSummary',35),
 'analyticsCssRegions':css_regions[:8],
}
print('V344_OUTCOMES_DISCOVERY_BEGIN')
print(json.dumps(out,ensure_ascii=False,indent=2))
print('V344_OUTCOMES_DISCOVERY_END')
