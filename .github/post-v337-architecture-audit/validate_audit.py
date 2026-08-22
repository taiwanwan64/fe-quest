from pathlib import Path
import base64, hashlib, json, os, re, runpy, subprocess, tempfile
from collections import Counter, defaultdict

VERSION='v338'; PREVIOUS='v337'

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def ctx():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'post-v337-architecture-audit-(v(\d+))',b); req(m,'bad v338 branch '+b)
    v=m.group(1); p=f'v{int(m.group(2))-1}'; req((v,p)==(VERSION,PREVIOUS),'expects v338/v337'); return b,v,p

def scripts(path):
    h=Path(path).read_text(); return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path); stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function s(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:String((e&&e.stack)||e)};}}
function task(t){if(!t)return null;return {type:t.type||null,title:t.title||null,minutes:t.minutes||0,bmode:t.bmode||null,bid:t.bid||null,lessonId:t.lessonId||null,topicId:t.topicId||null};}
function src(n){try{var f=eval(n);return typeof f==='function'?String(f):null;}catch(e){return null;}}
var names=['buildTodayTasks','ensureTodayPlanSnapshot','examStudyPhase','taskAllocation','nextLessonChoice','nextBChoice','trackedQuestionPool','validateSubjectBSemantics'];
var dig={};names.forEach(function(n){var x=src(n);dig[n]=x?require('crypto').createHash('sha256').update(x).digest('hex'):null;});
var out={v:APP_VERSION,plan:s(function(){return buildTodayTasks().map(task);}),snap:s(function(){var x=ensureTodayPlanSnapshot();return Array.isArray(x)?x.map(task):x;}),phases:s(function(){return [14,7,3,1,0].map(function(d){return {days:d,phase:examStudyPhase(d)};});}),alloc:s(function(){return {m45:taskAllocation(45),m60:taskAllocation(60),m90:taskAllocation(90)};}),lesson:s(function(){var x=nextLessonChoice();return x?{id:x.id||null,title:x.title||null}:null;}),b:s(function(){var x=nextBChoice(20);return x?{id:x.id||null,mode:x.mode||null,title:x.title||null}:null;}),tracked:s(function(){var x=trackedQuestionPool();return {count:Array.isArray(x)?x.length:null,first:Array.isArray(x)?x.slice(0,5).map(function(q){return q&&q.id||null;}):[]};}),schema:s(function(){return {profileKeys:Object.keys(profile||{}).sort(),settingsKeys:Object.keys((profile&&profile.settings)||{}).sort(),questions:Array.isArray(QUESTION_BANK)?QUESTION_BANK.length:null,b:Array.isArray(B_EXERCISES)?B_EXERCISES.length:null};}),sem:s(function(){return validateSubjectBSemantics();}),fnDigest:dig};
console.log('__V338__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js'; p.write_text(stub+'\n'+js+'\n'+tail); z=subprocess.run(['node',str(p)],capture_output=True,text=True)
        req(z.returncode==0,'runtime failed '+z.stderr[-12000:]); m=re.search(r'__V338__([A-Za-z0-9+/=]+)',z.stdout); req(m,'marker'); return json.loads(base64.b64decode(m.group(1)))

def classify_assert(s):
    x=s.lower()
    if any(t in x for t in ('validate','diagnostic','selfcheck','self_check','semantic','contract','invariant')): return 'diagnostic/contract統合候補'
    if any(t in x for t in ('question_bank','core_a','b_exercises','question','topic','lesson','category','distribution','duplicate','unique','answer','option','count')): return 'CI移行候補'
    return 'runtime安全候補'

def assert_rows(js):
    rows=[]; fn=None
    for n,line in enumerate(js.splitlines(),1):
        m=re.search(r'function\s+([A-Za-z_$][\w$]*)\s*\(',line)
        if m: fn=m.group(1)
        if re.search(r'\bfunction\s+assert\s*\(',line): continue
        if re.search(r'\bassert\s*\(',line):
            c=re.sub(r'\s+',' ',line.strip())[:360]; rows.append({'line':n,'function':fn,'class':classify_assert(c+' '+str(fn)),'context':c})
    return rows

def include_inventory():
    idx=Path('index.html').read_text(); inc=re.findall(r'\{%\s*include_relative\s+([^\s%]+)\s*%\}',idx); order={x:i for i,x in enumerate(inc)}
    rows=[]
    for p in sorted(Path('app').iterdir()):
        if not p.is_file(): continue
        mv=re.search(r'v(\d+)',p.name,re.I)
        if 'override' not in p.name.lower() and not mv: continue
        rel=p.as_posix(); rows.append({'path':rel,'bytes':len(p.read_bytes()),'version':int(mv.group(1)) if mv else None,'included':rel in order,'order':order.get(rel)})
    rows.sort(key=lambda r:(r['order'] is None,r['order'] if r['order'] is not None else 99999,r['path'])); return inc,rows

def wrapper_rows(inc):
    d=defaultdict(list); pat=re.compile(r'(?m)^\s*(?:(?:window|globalThis)\.)?([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?function\s*\(')
    for i,rel in enumerate(inc):
        p=Path(rel)
        if not p.exists() or ('override' not in p.name.lower() and 'patch' not in p.name.lower()): continue
        for m in pat.finditer(p.read_text(errors='replace')): d[m.group(1)].append({'path':rel,'order':i})
    out=[{'function':k,'depth':len(v),'chain':v} for k,v in d.items()]; out.sort(key=lambda x:(-x['depth'],x['function'])); return out

def size_info(path):
    b=Path(path).read_bytes(); h=b.decode('utf-8'); css=sum(len(x.encode()) for x in re.findall(r'<style(?:\s[^>]*)?>(.*?)</style>',h,re.S|re.I)); js=sum(len(x.encode()) for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)); return {'total':len(b),'css':css,'js':js,'other':len(b)-css-js,'sha256':hashlib.sha256(b).hexdigest()}

def role_sizes(inc):
    d=Counter()
    for rel in inc:
        p=Path(rel)
        if not p.exists(): continue
        n=p.name.lower(); z=len(p.read_bytes())
        if rel=='app/base-stable.html': role='base-stable'
        elif 'learning-patches' in n: role='learning-patches'
        elif 'subject-b' in n: role='科目B override'
        elif 'learning-quality' in n: role='科目A quality override'
        elif 'diagnostic' in n or 'release' in n: role='diagnostic/release'
        elif any(t in n for t in ('ux','header','scroll','reset')): role='UX/data behavior override'
        else: role='other included source'
        d[role]+=z
    return dict(d.most_common())

def startup(js):
    tail=js[-80000:]; names=sorted(set(re.findall(r'\b((?:validate|run|check|ensure)[A-Za-z0-9_$]*)\s*\(',tail))); out=[]
    for name in names[:80]:
        m=re.search(r'function\s+'+re.escape(name)+r'\s*\([^)]*\)\s*\{',js); body=''
        if m:
            start=m.start(); nxt=re.search(r'\nfunction\s+[A-Za-z_$][\w$]*\s*\(',js[m.end():]); end=m.end()+nxt.start() if nxt else min(len(js),m.end()+20000); body=js[start:end]
        out.append({'function':name,'bodyBytes':len(body.encode()) if body else None,'asserts':len(re.findall(r'\bassert\s*\(',body)) if body else None,'tailCalls':len(re.findall(r'\b'+re.escape(name)+r'\s*\(',tail))})
    out.sort(key=lambda x:(-(x['bodyBytes'] or 0),x['function'])); return out[:30]

def table(headers, rows):
    a=['| '+' | '.join(headers)+' |','| '+' | '.join('---' for _ in headers)+' |']; a += ['| '+' | '.join(str(v).replace('|','\\|').replace('\n',' ') for v in r)+' |' for r in rows]; return '\n'.join(a)

branch,version,previous=ctx(); parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
expected={'.github/post-v337-architecture-audit/validate_audit.py','.github/workflows/post-v337-architecture-audit-v338.yml','FE_QUEST_DEVELOPMENT_PLAN.md'}
generated={'index.html','manifest.webmanifest','sw.js','_regression/post-v337-architecture-audit-v338.fixture.json','audits/post-v337-architecture-audit.md'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines()); req(expected<=changed,'missing source'); req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))

cand=runtime('_site/index.html'); par=runtime('_site_parent/index.html'); req(cand['v']==version and par['v']==previous,'versions')
for k in ('plan','snap','phases','alloc','lesson','b','tracked','schema','fnDigest'): req(cand[k]==par[k],'audit-only behavior drift '+k)
req(cand['sem']['ok'] and par['sem']['ok'],'subject B semantic failure'); req(cand['schema']['value']['questions']==710,'710 question contract')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']; req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')

js=scripts('_site/index.html'); asserts=assert_rows(js); counts=Counter(x['class'] for x in asserts); inc,ov=include_inventory(); wraps=wrapper_rows(inc); size=size_info('_site/index.html'); roles=role_sizes(inc); starts=startup(js)
req(size['total']>3000000 and len(asserts)>0 and len(ov)>10,'audit inventory unexpectedly small')
inc_v=[x for x in ov if x['included'] and x['version'] is not None]; dormant=[x for x in ov if not x['included'] and x['version'] is not None]
fixture={'name':'post-v337-architecture-audit-v338','version':version,'previous':previous,'parentMainSha':parent,'result':'PASS — V338 ARCHITECTURE INVENTORY COMPLETE; LEARNER BEHAVIOR UNCHANGED','hardAssert':{'total':len(asserts),'classes':dict(counts),'inventory':asserts},'overrides':{'includeCount':len(inc),'versionedCount':len([x for x in ov if x['version'] is not None]),'includedVersioned':len(inc_v),'dormantVersioned':len(dormant),'files':ov,'topWrappedFunctions':wraps[:20]},'size':{'built':size,'includedSourceRoleBytes':roles},'startupValidationCandidates':starts,'behaviorContract':{'candidateParentEqual':True,'candidateReferenceSixFileByteEquality':True,'snapshot':cand,'subjectBSemanticOK':True},'schemaChanged':False,'learnerFacingChange':False}
Path('_regression').mkdir(exist_ok=True); Path('_regression/post-v337-architecture-audit-v338.fixture.json').write_text(json.dumps(fixture,ensure_ascii=True,indent=2)+'\n')

assert_tbl=table(['分類','件数'],[[x,counts.get(x,0)] for x in ('CI移行候補','diagnostic/contract統合候補','runtime安全候補')])
wrap_tbl=table(['関数','推定深度','上書き順'],[[x['function'],x['depth'],' → '.join(Path(y['path']).name for y in x['chain'])] for x in wraps[:12]] or [['（検出なし）',0,'-']])
role_tbl=table(['構成','bytes','完成版比率'],[[k,v,f'{v/size["total"]*100:.1f}%'] for k,v in roles.items()])
start_tbl=table(['候補','本体bytes','assert数','末尾80KB呼出'],[[x['function'],x['bodyBytes'],x['asserts'],x['tailCalls']] for x in starts[:15]] or [['（検出なし）','-','-','-']])
top='、'.join('`'+x['function']+'`' for x in wraps[:3]) if wraps else 'fixture記載の上位関数'
report=f'''# FE QUEST v338 — post-v337 architecture audit

実施日: 2026-08-22  
対象: v337 `main` `{parent}` → audit-only v338  
結果: **PASS — V338 ARCHITECTURE INVENTORY COMPLETE; LEARNER BEHAVIOR UNCHANGED**

## 結論

v338では学習者向け挙動・ユーザーデータスキーマを変更せず、v339以降の安全な整理に必要な実行経路を棚卸しした。

- 完成版 `index.html`: **{size['total']:,} bytes**
- runtime hard `assert()` 呼出: **{len(asserts)}件**
- `index.html` include source: **{len(inc)}件**
- version番号を持つoverride/patch: **{len([x for x in ov if x['version'] is not None])}件**（組込み {len(inc_v)} / 未参照 {len(dormant)}）
- 科目A問題: **710問維持**
- candidate v338 と untouched v337 parent の主要適応学習contract: **同一**
- profile/settings key contract: **同一**
- Subject B semantic diagnostics: **OK**
- schema変更: **なし**

## hard assert棚卸し

{assert_tbl}

全件の行番号・包含関数・文脈は `_regression/post-v337-architecture-audit-v338.fixture.json` に保存した。分類はv339の着手順を決めるための静的分類であり、機械的な一括削除は行わない。

## 多重ラップ上位

{wrap_tbl}

推定深度は現行include順で同名関数へ再代入する回数。v339では上位から1責務ずつ、単一実装 + 明示hookへ寄せる。

## versioned override / 依存順

fixtureに現行include順と未参照ファイルを全件保存した。未参照versioned sourceは即削除せず、release reference用途を確認してから「削除可能 / reference用途 / 保留」に再分類する。

## 完成版サイズ

- total: {size['total']:,} bytes
- `<style>` payload: {size['css']:,} bytes
- `<script>` payload: {size['js']:,} bytes
- その他HTML概算: {size['other']:,} bytes

### include source責務別

{role_tbl}

これはv341分割判断用のUTF-8静的容量であり、圧縮後networkサイズではない。

## 起動時validation候補

{start_tbl}

実ブラウザmsは断定せず、起動末尾80KBに現れるvalidate/run/check/ensure系呼出と静的本体サイズを整理した。v339で「起動必須 / CIへ移行 / 遅延diagnostic」を決める。

## v338回帰contract

fixtureに `buildTodayTasks()`、`ensureTodayPlanSnapshot()`、`examStudyPhase()` 14/7/3/1/0日、`taskAllocation()` 45/60/90分、`nextLessonChoice()`、`nextBChoice(20)`、`trackedQuestionPool()`、profile/settings key set、主要関数SHA-256を保存した。candidateとv337 parentは同一で、mechanical v338 referenceとも6ファイルbyte一致した。

## v339の着手順

1. hard assertの **CI移行候補** からruntime停止経路を外す。
2. diagnostic/contractと重複するassertを非破壊診断へ統合する。
3. 多重ラップ上位 {top} から第1対象を選び、呼出順を変えずに整理する。
4. 未参照versioned overrideを再分類する。
5. 各変更後にv338 behavior fixture、710問、130テーマ、Subject B semantics、保存・復旧・PWAを回帰確認する。

## 注意

hard assert分類とwrap深度は安全な着手順を決める静的監査であり、意味を確認せず一括削除するためのものではない。v339も大規模一括書き換えを行わない。
'''
Path('audits').mkdir(exist_ok=True); Path('audits/post-v337-architecture-audit.md').write_text(report); print(report)
