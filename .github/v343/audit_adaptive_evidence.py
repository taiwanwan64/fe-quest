from pathlib import Path
import hashlib,json,re

JS_PATH=Path('assets/app-v342.js')
js=JS_PATH.read_text()


def contexts(token, radius=220, limit=8, flags=0):
    out=[]
    for m in re.finditer(token,js,flags):
        a=max(0,m.start()-radius);b=min(len(js),m.end()+radius)
        snippet=re.sub(r'\s+',' ',js[a:b]).strip()
        if snippet not in out:out.append(snippet)
        if len(out)>=limit:break
    return out

def count(pattern, flags=0):
    return len(re.findall(pattern,js,flags))

def field_names(container):
    pats=[
      rf'{re.escape(container)}\s*\[[^\]]+\]\s*\.\s*([A-Za-z_$][\w$]*)',
      rf'{re.escape(container)}\s*\?\.\s*\[[^\]]+\]\s*\?*\.\s*([A-Za-z_$][\w$]*)',
      rf'{re.escape(container)}\s*\.\s*([A-Za-z_$][\w$]*)'
    ]
    fields=set()
    for pat in pats:
        fields.update(re.findall(pat,js))
    return sorted(fields)

def function_spans():
    # Lightweight lexical scan: enough for named classic functions in the current bundle.
    found=[]
    for m in re.finditer(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{',js):
        name=m.group(1);start=m.start();i=m.end()-1;depth=0;quote=None;esc=False
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
                        found.append((name,start,i+1));break
            i+=1
    return found

spans=function_spans()
relevant_tokens=[
 'qStats','mockQuestionStats','mockMistakeStats','bMockStats','bFinalStats','bFinalMistakeStats',
 'lastReason','mistake','reason','elapsed','duration','answerTime','responseTime','startedAt','lastSeen',
 'masteryHistory','sessions','buildTodayTasks','readiness'
]
function_hits={}
for name,a,b in spans:
    body=js[a:b]
    hits=[t for t in relevant_tokens if t in body]
    if hits:function_hits[name]=hits

reason_terms=['時間不足','知識不足','読み違い','うっかり','コード理解','セキュリティ知識','トレース','見落とし','計算ミス','理解不足']
timing_patterns={
 'answerTime':r'answerTime','responseTime':r'responseTime','elapsed':r'elapsed','duration':r'duration',
 'startedAt':r'startedAt','questionStart':r'question(?:StartedAt|Start|StartAt|StartTime)',
 'timeSpent':r'timeSpent','timeMs':r'timeMs','seconds':r'\bseconds\b','avgTime':r'avgTime',
 'responseMs':r'responseMs','elapsedMs':r'elapsedMs'
}
containers=['qStats','mockQuestionStats','mockMistakeStats','bMockStats','bFinalStats','bFinalMistakeStats','techniqueStats']

report={
 'bundle':{'path':str(JS_PATH),'bytes':len(js.encode()),'sha256':hashlib.sha256(js.encode()).hexdigest()},
 'containers':{c:{'mentions':count(re.escape(c)),'fields':field_names(c)} for c in containers},
 'timingTokenCounts':{k:count(v,re.I) for k,v in timing_patterns.items()},
 'reasonTermCounts':{t:js.count(t) for t in reason_terms},
 'lastReasonMentions':count(r'lastReason'),
 'mistakeReasonLikeMentions':count(r'(?:mistake|wrong|review)[A-Za-z_$]*Reason|reason[A-Za-z_$]*',re.I),
 'functionsWithEvidence':function_hits,
 'contexts':{
   'qStats':contexts(r'qStats',limit=10),
   'lastReason':contexts(r'lastReason',limit=12),
   'timing':contexts(r'answerTime|responseTime|elapsedMs|responseMs|questionStartedAt|questionStart|startedAt|timeSpent|duration',limit=14,flags=re.I),
   'masteryHistory':contexts(r'masteryHistory',limit=8),
   'sessions':contexts(r'\bsessions\b',limit=8),
   'buildTodayTasks':contexts(r'buildTodayTasks',limit=8)
 }
}

# Discovery invariants only: this stage must not alter learner behavior and should find the
# known major evidence containers before any v343 weighting logic is proposed.
assert report['bundle']['bytes']>3_000_000
assert report['containers']['qStats']['mentions']>0
assert report['containers']['bFinalMistakeStats']['mentions']>0
assert 'buildTodayTasks' in report['functionsWithEvidence'] or js.count('buildTodayTasks')>0

print('V343_ADAPTIVE_EVIDENCE_DISCOVERY_BEGIN')
print(json.dumps(report,ensure_ascii=False,indent=2))
print('V343_ADAPTIVE_EVIDENCE_DISCOVERY_END')
