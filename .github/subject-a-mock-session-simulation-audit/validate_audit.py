from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile,statistics,collections

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-mock-session-simulation-audit-(v(\d+))',b);req(m,'bad v301 branch');return m.group(1),f'v{int(m.group(2))-1}'
def scripts(path):
    h=Path(path).read_text();return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
def chapter(topic):
    m=re.search(r'(?:^|_)(\d{1,2})(?:_|$)',topic);return int(m.group(1)) if m else None
def classify(r):
    q=r['q'];opts=r['options'];combined=' '.join([q]+opts);n=len(q)
    calc=bool(re.search(r'(求め|計算|算出|何(?:秒|分|時間|個|回|台|人|円|bit|byte|バイト|%|％)|平均|確率|稼働率|応答時間|転送時間|実効速度|損益分岐|利益|原価|工数|日数|最短|最大|最小)',q)) or (bool(re.search(r'\d',q)) and bool(re.search(r'[%％+×÷=／/]|Mbps|Gbps|MHz|GHz|ms|秒|分|円|人月|bit|byte|バイト',q,re.I)))
    data=bool(re.search(r'(次の図|図に|次の表|表に|グラフ|真理値表|回路|状態遷移|ER図|E-R図|ネットワーク図|PERT|アローダイアグラム|構成図|タイムチャート|SQL文|コード|擬似言語)',q,re.I))
    situational=bool(re.search(r'(企業|会社|組織|システム|サービス|プロジェクト|利用者|担当者|管理者|開発チーム|顧客|取引先|業務|運用|インシデント|要件|調達|契約|導入|障害|変更|要求|受注|在庫|製造|販売|発注|提案)',combined))
    action=bool(re.search(r'(最も適切|適切|対応|判断|選択|優先|実施|行う|すべき|次に|方法|目的|評価)',q))
    sentence_opts=sum(len(x)>=18 for x in opts)
    scenario=n>=110 or (situational and (action or sentence_opts>=2))
    applied=calc or data or scenario
    recall=(not applied) and n<=72 and sentence_opts<=1 and bool(re.search(r'(とは|名称|用語|何か|どれか|ものは|説明として|特徴として|文書は|活動は)',q))
    return {'calc':calc,'data':data,'scenario':scenario,'applied':applied,'recall':recall}
def pct(n,d):return round(n/d*100,1) if d else 0.0
def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB'];tail=r'''
function pick(v,...ks){for(const k of ks){if(v&&v[k]!=null)return v[k];}return null;}
function seeded(seed){let a=seed>>>0;return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const bankRows=QUESTION_BANK.map(q=>({id:String(q?.id||''),topic:String(q?.coreTopicId||''),cat:String(q?.cat||''),difficulty:String(q?.difficulty||''),cognitive:String(q?.cognitiveLevel||''),q:String(pick(q,'q','question','text')||''),options:(Array.isArray(q?.options)?q.options:Array.isArray(q?.opts)?q.opts:[]).map(String)}));
const coreCount=QUESTION_BANK.filter(q=>q&&q.coreTopicId).length;
const originalRandom=Math.random;
function simulate(mode,n,seedBase){const sessions=[];for(let i=0;i<n;i++){Math.random=seeded(seedBase+i*7919);const xs=buildMockQuestions(mode);sessions.push(xs.map(x=>String(x.id||'')));}return sessions;}
const full=simulate('full',600,3010001),half=simulate('half',600,3020001);Math.random=originalRandom;
const out={v:APP_VERSION,bankRows,coreCount,blueprints:MOCK_BLUEPRINTS,categories:MOCK_CATEGORIES,difficulties:MOCK_DIFFICULTY_LEVELS,cognitiveLevels:MOCK_COGNITIVE_LEVELS,categoryQuotas:{full:mockCategoryQuotas(MOCK_BLUEPRINTS.full.count),half:mockCategoryQuotas(MOCK_BLUEPRINTS.half.count)},sessions:{full,half},sources:{buildMockQuestions:String(buildMockQuestions),mockCandidateSort:String(mockCandidateSort),mockSeen:String(mockSeen),mockLastSeen:String(mockLastSeen),pickMockPool:String(pickMockPool)},profileMockKeys:Object.keys(profile||{}).filter(k=>/mock/i.test(k)),sem:validateSubjectBSemantics()};
console.log('__V301__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:]);m=re.search(r'__V301__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker missing');return json.loads(base64.b64decode(m.group(1)))
def analyze(mode,sessions,byid,bp,eligible_ids):
    count=int(bp['count']);rows=[];exp=collections.Counter();chapter_exp=collections.Counter();noncore_exp=collections.Counter()
    cat_patterns=collections.Counter();diff_patterns=collections.Counter();cog_patterns=collections.Counter();bad=[]
    for si,ids in enumerate(sessions):
        if len(ids)!=count or len(set(ids))!=len(ids):bad.append({'session':si,'count':len(ids),'unique':len(set(ids))})
        qs=[byid.get(i) for i in ids];req(all(qs),'unknown mock id '+repr([i for i,q in zip(ids,qs) if not q][:8]))
        for i,q in zip(ids,qs):
            exp[i]+=1
            if q['chapter'] is None:noncore_exp[i]+=1
            else:chapter_exp[q['chapter']]+=1
        cats=collections.Counter(q['cat'] for q in qs);diff=collections.Counter(q['difficulty'] for q in qs);cog=collections.Counter(q['cognitive'] for q in qs)
        ch=collections.Counter(q['chapter'] for q in qs if q['chapter'] is not None);forms=collections.Counter(k for q in qs for k,v in q['form'].items() if v)
        noncore=sum(q['chapter'] is None for q in qs)
        cat_patterns[tuple(sorted(cats.items()))]+=1;diff_patterns[tuple(sorted(diff.items()))]+=1;cog_patterns[tuple(sorted(cog.items()))]+=1
        rows.append({'chaptersRepresented':len(ch),'maxChapterCount':max(ch.values()) if ch else 0,'nonCoreCount':noncore,'appliedPct':pct(forms['applied'],count),'calcPct':pct(forms['calc'],count),'dataPct':pct(forms['data'],count),'scenarioPct':pct(forms['scenario'],count),'recallPct':pct(forms['recall'],count)})
    def stat(k):
        vals=[r[k] for r in rows];return {'min':min(vals),'median':round(statistics.median(vals),1),'max':max(vals)}
    chapter_rates={str(ch):pct(n,len(sessions)*count) for ch,n in sorted(chapter_exp.items())}
    selected_rates=[pct(n,len(sessions)) for n in exp.values()]
    eligible_rates=[pct(exp[i],len(sessions)) for i in eligible_ids]
    noncore_top=[{'id':i,'sessions':n,'sessionPct':pct(n,len(sessions)),'cat':byid[i]['cat'],'difficulty':byid[i]['difficulty'],'q':byid[i]['q'][:120]} for i,n in noncore_exp.most_common(20)]
    return {'sessions':len(sessions),'questionsPerSession':count,'invalidSessionStructure':bad[:20],'categoryPatterns':[{'pattern':dict(p),'sessions':n} for p,n in cat_patterns.most_common(8)],'difficultyPatterns':[{'pattern':dict(p),'sessions':n} for p,n in diff_patterns.most_common(8)],'cognitivePatterns':[{'pattern':dict(p),'sessions':n} for p,n in cog_patterns.most_common(8)],'chaptersRepresented':stat('chaptersRepresented'),'maxChapterCount':stat('maxChapterCount'),'nonCoreCount':stat('nonCoreCount'),'appliedPct':stat('appliedPct'),'calcPct':stat('calcPct'),'dataPct':stat('dataPct'),'scenarioPct':stat('scenarioPct'),'recallPct':stat('recallPct'),'chapterExposurePct':chapter_rates,'selectedQuestionExposurePer600SessionsPct':{'min':min(selected_rates) if selected_rates else 0,'median':round(statistics.median(selected_rates),1) if selected_rates else 0,'max':max(selected_rates) if selected_rates else 0},'eligibleQuestionExposurePer600SessionsPct':{'min':min(eligible_rates) if eligible_rates else 0,'median':round(statistics.median(eligible_rates),1) if eligible_rates else 0,'max':max(eligible_rates) if eligible_rates else 0,'neverSelected':sum(exp[i]==0 for i in eligible_ids),'eligibleQuestions':len(eligible_ids)},'distinctQuestionsSelected':len(exp),'distinctNonCoreQuestionsSelected':len(noncore_exp),'topNonCoreSelections':noncore_top}

version,previous=context();parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip();req((version,previous)==('v301','v300'),'expects v300')
source=Path('audits/SUBJECT_A_MOCK_COMPOSITION_DISCOVERY_v300.txt');req(source.exists() and 'PASS — MOCK COMPOSITION IMPLEMENTATION DISCOVERED' in source.read_text(),'v300 evidence missing')
expected={'.github/subject-a-mock-session-simulation-audit/validate_audit.py','.github/workflows/subject-a-mock-session-simulation-audit.yml'};changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines());req(changed==expected,'source drift '+repr(sorted(changed^expected)))
cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html');req(cand['v']=='v301' and par['v']=='v300','versions');req(cand['bankRows']==par['bankRows'] and cand['coreCount']==par['coreCount'],'bank drift');req(cand['blueprints']==par['blueprints'] and cand['categoryQuotas']==par['categoryQuotas'],'blueprint drift');req(cand['sessions']==par['sessions'],'mock behavior drift');req(cand['sem'].get('ok') is True,'semantic')
files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png'];req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'reference mismatch')
byid={}
for r in cand['bankRows']:
    byid[r['id']]={**r,'chapter':chapter(r['topic']),'form':classify(r)}
req(cand['coreCount']==550,'Subject A core bank count drift')
req(len(byid)==len(cand['bankRows']),'duplicate QUESTION_BANK ids')
eligible_ids=[i for i,r in byid.items() if r['cat'] in cand['categories'] and r['difficulty'] in cand['difficulties']]
full=analyze('full',cand['sessions']['full'],byid,cand['blueprints']['full'],eligible_ids);half=analyze('half',cand['sessions']['half'],byid,cand['blueprints']['half'],eligible_ids)
req(not full['invalidSessionStructure'] and not half['invalidSessionStructure'],'duplicate or count drift')
summary={'bankQuestions':len(byid),'coreQuestions':cand['coreCount'],'eligibleQuestions':len(eligible_ids),'blueprints':cand['blueprints'],'categoryQuotas':cand['categoryQuotas'],'categories':cand['categories'],'difficulties':cand['difficulties'],'cognitiveLevels':cand['cognitiveLevels'],'full':full,'half':half,'selectionSources':cand['sources'],'profileMockKeys':cand['profileMockKeys'],'simulationNote':'600 deterministic fresh-state draws per mode. buildMockQuestions samples the full Subject A QUESTION_BANK, which includes coreTopicId rows plus challenge/other bank rows; non-core rows are measured separately rather than treated as unknown. This is a session-composition distribution audit, not longitudinal completed-attempt history.'}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — MOCK SESSION DISTRIBUTION CAPTURED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True};Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-session-simulation-v301.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v301 — Subject A Mock Session Simulation Audit
========================================================

Result
------
PASS — MOCK SESSION DISTRIBUTION CAPTURED
Previous release: v300
Source main: {parent}
Learner-facing change in v301: none

Reference basis
---------------
The supplied 令和8年度 problem book contains one public Subject A set and four separate Subject A mock sets. That supports treating FE QUEST full/half mocks as broad mixed-session practice. It does not define FE QUEST-specific chapter or format quotas, so the figures below are diagnostics rather than official targets.

Method
------
Run the real production buildMockQuestions function 600 times for full mode and 600 times for half mode with deterministic independent seeds. Measure category, difficulty, cognitive-level, chapter and calibrated question-format distribution. The builder intentionally samples the full Subject A QUESTION_BANK, not only the 550 coreTopicId rows, so challenge/other bank rows are measured as non-core rather than rejected. This is a fresh-state composition audit: it deliberately does not pretend to model completed-attempt history or mastery progression.

Summary
-------
{json.dumps(summary,ensure_ascii=False,indent=2)}

Regression
----------
No learner-facing content changed.
The 550 Subject A core questions and the full mock-selectable bank are equivalent to v300.
The 1,200 deterministic mock builds are behaviorally equivalent to v300 under the same seeds.
Subject B semantic diagnostics: OK.
Candidate/mechanical-reference six-file byte equality: yes.

Decision
--------
If full and half sessions show stable category/difficulty/cognitive blueprints, no duplicate IDs, broad chapter representation and no repeated extreme chapter concentration, keep the builder unchanged. If a concentration pattern is concrete, inspect only that selection layer before adding balancing logic. Do not force each mock to cover all 21 chapters or invent an official per-chapter quota.
''';Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_SESSION_SIMULATION_v301.txt').write_text(audit);print(audit)
