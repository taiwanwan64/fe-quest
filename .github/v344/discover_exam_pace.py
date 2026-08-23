from pathlib import Path
import json,re,hashlib

js=Path('assets/app-v344.js').read_text()
lines=js.splitlines()

def extract_named_function(name):
    m=re.search(rf'\bfunction\s+{re.escape(name)}\s*\([^)]*\)\s*\{{',js)
    if not m:return None
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
                if depth==0:return js[m.start():i+1]
        i+=1
    raise RuntimeError(name)

def around_line(n,r=5):
    a=max(1,n-r);b=min(len(lines),n+r)
    return {'start':a,'end':b,'text':'\n'.join(f'{i}: {lines[i-1]}' for i in range(a,b+1))}

func_names=re.findall(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(',js)
keywords=r'exam|pace|study|minute|readiness|target|taper|remaining|days|plan|deadline|schedule|date'
candidates=sorted({n for n in func_names if re.search(keywords,n,re.I)})
priority=[n for n in candidates if re.search(r'exam|pace|effectiveStudy|readiness|taper|remaining|today|plan|target',n,re.I)]

needles=['effectiveStudyMinutes','exam','試験日','受験予定日','残り','必要ペース','readiness','準備度','taper','targetDate','examDate','daysRemaining','daysToExam','studyMinutes','buildTodayTasks','phase']
occ={}
for needle in needles:
    xs=[]
    for m in re.finditer(re.escape(needle),js,re.I):
        ln=js.count('\n',0,m.start())+1
        xs.append(around_line(ln,4))
        if len(xs)>=10:break
    occ[needle]=xs

exact={}
for n in priority[:120]:
    body=extract_named_function(n)
    if body and len(body)<=18000:exact[n]=body

# Record storage/settings keys near likely exam date/minutes usage.
setting_lines=[]
for i,line in enumerate(lines,1):
    if re.search(r'examDate|targetDate|studyMinutes|dailyMinutes|受験予定日|試験日',line,re.I):
        setting_lines.append(around_line(i,3))
        if len(setting_lines)>=40:break

out={
 'bundle':{'bytes':len(js.encode()),'sha256':hashlib.sha256(js.encode()).hexdigest(),'functionCount':len(func_names)},
 'candidateFunctions':candidates,
 'priorityFunctions':priority,
 'exactFunctions':exact,
 'occurrences':occ,
 'settingRegions':setting_lines
}
print('V344_EXAM_PACE_DISCOVERY_BEGIN')
print(json.dumps(out,ensure_ascii=False,indent=2))
print('V344_EXAM_PACE_DISCOVERY_END')
