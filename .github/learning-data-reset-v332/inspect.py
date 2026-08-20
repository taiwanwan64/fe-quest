from pathlib import Path
import base64,json,re,runpy,subprocess,tempfile

html=Path('_site/index.html').read_text()
scripts='\n'.join(s for s in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',html,re.S|re.I) if s.strip() and not s.lstrip().startswith('{'))
stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']

tail=r'''
const names=['writeCurrentProfile','stampProfileForSave','rememberCommittedProfile','acquireProfileWriteLease','releaseProfileWriteLease','profileIntegrityChecksum','queueRecoveryCheckpoint','clearProfileSaveFailure','refreshProfileUI','showAppNotice','renderRecoveryCenter','refreshRecoveryCenter','createRecoveryPoint','normalizeProfileData','storeValidProfileSnapshot'];
const sources={};
for(const n of names){try{const v=eval(n);sources[n]=typeof v==='function'?String(v).slice(0,14000):null}catch(e){sources[n]=null}}
const constants={};
for(const n of ['PROFILE_ATOMIC_KEY','STORAGE_KEY','PROFILE_CHECKSUM_KEY','LAST_GOOD_PROFILE_KEY','LAST_GOOD_CHECKSUM_KEY','CORRUPT_PROFILE_KEY','UI_STATE_KEY','PROFILE_SCHEMA_VERSION']){try{constants[n]=eval(n)}catch(e){constants[n]=null}}
const settings=JSON.parse(JSON.stringify(profile.settings||{}));
const defaultSettings=JSON.parse(JSON.stringify(DEFAULT_PROFILE.settings||{}));
console.log('__RESET_INSPECT__'+Buffer.from(JSON.stringify({v:APP_VERSION,sources,constants,settings,defaultSettings,defaultKeys:Object.keys(DEFAULT_PROFILE)})).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'rt.js'; p.write_text(stub+'\n'+scripts+'\n'+tail)
    z=subprocess.run(['node',str(p)],capture_output=True,text=True)
    if z.returncode!=0: raise SystemExit(z.stderr[-16000:])
    m=re.search(r'__RESET_INSPECT__([A-Za-z0-9+/=]+)',z.stdout)
    if not m: raise SystemExit('marker missing')
    data=json.loads(base64.b64decode(m.group(1)))
print('__RESET_INSPECT_JSON__')
print(json.dumps(data,ensure_ascii=False,indent=2))
