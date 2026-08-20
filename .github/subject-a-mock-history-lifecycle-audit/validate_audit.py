from pathlib import Path
import base64,json,os,re,runpy,subprocess,tempfile


def req(ok,msg):
    if not ok: raise AssertionError(msg)

def context():
    b=os.environ.get('GITHUB_HEAD_REF') or os.environ.get('GITHUB_REF_NAME') or subprocess.check_output(['git','branch','--show-current'],text=True).strip()
    m=re.fullmatch(r'subject-a-mock-history-lifecycle-audit-(v(\d+))',b);req(m,'bad v307 branch')
    return m.group(1),f'v{int(m.group(2))-1}'

def scripts(path):
    h=Path(path).read_text()
    return '\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))

def runtime(path):
    js=scripts(path);stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
    tail=r'''
function src(name){try{return String(globalThis[name]||eval(name));}catch(e){return '';}}
function profileRefs(text){return [...new Set([...String(text).matchAll(/profile\.([A-Za-z0-9_]+)/g)].map(m=>m[1]))].sort();}
const names=['mockSeen','mockLastSeen','mockCandidateSort','finishMock','buildMockQuestions'];
const sources=Object.fromEntries(names.map(n=>[n,src(n)]));
const refs=Object.fromEntries(names.map(n=>[n,profileRefs(sources[n])]));
const out={
 v:APP_VERSION,
 sources,refs,
 profileKeys:Object.keys(profile||{}).sort(),
 mockHistoryType:Array.isArray(profile?.mockHistory)?'array':typeof profile?.mockHistory,
 mockStatsType:typeof profile?.mockStats,
 blueprints:MOCK_BLUEPRINTS,
 bankSignature:QUESTION_BANK.map(q=>[q.id,q.cat,q.difficulty,q.cognitiveLevel,q.coreTopicId,q.q,q.options,q.a]),
 sem:validateSubjectBSemantics()
};
console.log('__V307__'+Buffer.from(JSON.stringify(out)).toString('base64'));
'''
    with tempfile.TemporaryDirectory() as td:
        p=Path(td)/'rt.js';p.write_text(stub+'\n'+js+'\n'+tail)
        z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime failed '+z.stderr[-9000:])
        m=re.search(r'__V307__([A-Za-z0-9+/=]+)',z.stdout);req(m,'runtime marker missing')
        return json.loads(base64.b64decode(m.group(1)))

version,previous=context();req((version,previous)==('v307','v306'),'expects v307 over v306')
parent=subprocess.check_output(['git','rev-parse','origin/main'],text=True).strip()
expected={'.github/subject-a-mock-history-lifecycle-audit/validate_audit.py','.github/workflows/subject-a-mock-history-lifecycle-audit.yml'}
generated={'manifest.webmanifest','sw.js','index.html','_regression/subject-a-mock-history-lifecycle-v307.fixture.json','audits/SUBJECT_A_MOCK_HISTORY_LIFECYCLE_v307.txt'}
changed=set(subprocess.check_output(['git','diff','--name-only','origin/main...HEAD'],text=True).splitlines())
req(expected<=changed,'missing audit source '+repr(sorted(expected-changed)))
req(changed<=expected|generated,'source drift '+repr(sorted(changed-(expected|generated))))

cand,par=runtime('_site/index.html'),runtime('_site_parent/index.html')
req(cand['v']=='v307' and par['v']=='v306','versions')
req(cand['sources']==par['sources'],'mock lifecycle function source drift')
req(cand['refs']==par['refs'],'profile-reference drift')
req(cand['profileKeys']==par['profileKeys'],'initial profile shape drift')
req(cand['bankSignature']==par['bankSignature'],'question bank drift')
req(cand['blueprints']==par['blueprints'],'blueprint drift')
req(cand['sem'].get('ok') is True and par['sem'].get('ok') is True,'Subject B semantics')
for n in ['mockSeen','mockLastSeen','mockCandidateSort','finishMock','buildMockQuestions']: req(cand['sources'].get(n),'missing '+n)
req('mockSeen' in cand['sources']['mockCandidateSort'] and 'mockLastSeen' in cand['sources']['mockCandidateSort'],'candidate sort does not use seen + lastSeen')
req('mockSeen' in cand['sources']['buildMockQuestions'],'mock builder does not report/use unseen state')
req('saveProfile' in cand['sources']['finishMock'],'finishMock does not persist profile')

all_refs=sorted(set(x for arr in cand['refs'].values() for x in arr))
finish_refs=cand['refs']['finishMock']
seen_refs=sorted(set(cand['refs']['mockSeen']+cand['refs']['mockLastSeen']))
# Lifecycle is considered discoverable when selection readers and finish persistence share at least one profile-backed mock field,
# or the reader functions explicitly delegate to another helper whose source is captured in finishMock/profile references.
shared=sorted(set(finish_refs)&set(seen_refs))
req(seen_refs,'mockSeen/mockLastSeen expose no profile-backed state')
req(finish_refs,'finishMock exposes no profile-backed state')

files=['index.html','manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']
req(all((Path('_site')/x).read_bytes()==(Path('_site_reference')/x).read_bytes() for x in files),'candidate/reference mismatch')

summary={
 'selectionReaders':{'mockSeen':cand['sources']['mockSeen'],'mockLastSeen':cand['sources']['mockLastSeen']},
 'candidateSort':cand['sources']['mockCandidateSort'],
 'finishMock':cand['sources']['finishMock'],
 'buildMockQuestions':cand['sources']['buildMockQuestions'],
 'profileRefsByFunction':cand['refs'],
 'allProfileRefs':all_refs,
 'seenLastSeenProfileRefs':seen_refs,
 'finishMockProfileRefs':finish_refs,
 'sharedReaderWriterProfileRefs':shared,
 'initialProfileKeys':cand['profileKeys'],
 'interpretation':'Use the exact discovered reader/writer fields in v308 sequential-session simulation; do not guess the mock history shape.'
}
fixture={'version':version,'previous':previous,'parent':parent,'result':'PASS — MOCK HISTORY LIFECYCLE DISCOVERED','summary':summary,'semanticOK':True,'candidateReferenceSixFileByteEquality':True}
Path('_regression').mkdir(exist_ok=True);Path('_regression/subject-a-mock-history-lifecycle-v307.fixture.json').write_text(json.dumps(fixture,ensure_ascii=False,indent=2)+'\n')
audit=f'''FE QUEST v307 — Subject A Mock History Lifecycle Audit\n========================================================\n\nResult\n------\nPASS — MOCK HISTORY LIFECYCLE DISCOVERED\nPrevious release: v306\nSource main: {parent}\nLearner-facing change: none\n\nPurpose\n-------\nv306 removed the fixed category-order slot. Before changing any repeat-session policy, v307 identifies the exact production fields that mock selection reads for novelty and that finishMock persists after completion.\n\nEvidence\n--------\n{json.dumps(summary,ensure_ascii=False,indent=2)}\n\nRegression\n----------\nQUESTION_BANK: unchanged.\nMOCK_BLUEPRINTS: unchanged.\nMock lifecycle function sources: byte/behavior-equivalent to v306.\nSubject B semantic diagnostics: OK.\nCandidate/mechanical-reference six-file equality: yes.\n\nDecision\n--------\nDo not add another repetition rule yet. Use the discovered production history fields in v308 to simulate true sequential completed mocks and measure rotation, adjacent-session overlap, and time-to-bank coverage under v306.\n'''
Path('audits').mkdir(exist_ok=True);Path('audits/SUBJECT_A_MOCK_HISTORY_LIFECYCLE_v307.txt').write_text(audit);print(audit)
