from pathlib import Path
import base64,json,re,runpy,subprocess,tempfile

def req(x,m):
    if not x: raise AssertionError(m)
def scripts(p):
    h=Path(p).read_text();return '\n'.join(x for x in re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I) if x.strip() and not x.lstrip().startswith('{'))
js=scripts('_site/index.html');stub=runpy.run_path('.github/release/runtime_stub.py')['STUB']
tail=r'''
function safe(fn){try{return {ok:true,value:fn()};}catch(e){return {ok:false,error:String(e&&e.stack||e)};}}
function source(n){try{const f=eval(n);return typeof f==='function'?String(f):null}catch(e){return null}}
const wanted=['renderHome','renderTodayPlan','buildTodayTasks','effectiveStudyMinutes','examDaysRemaining','taskAllocation','saveProfile','showScreen','openPlan','renderProfile','refreshProfileUI','ensureTodayPlanSnapshot'];
const direct={};wanted.forEach(n=>direct[n]=source(n));
const profileCopy=safe(()=>JSON.parse(JSON.stringify(profile)));
const tasks=safe(()=>buildTodayTasks());
const snapshot=safe(()=>ensureTodayPlanSnapshot());
const ids=[];try{document.querySelectorAll('[id]').forEach(x=>ids.push({id:x.id,tag:x.tagName,type:x.type||null,text:String(x.textContent||'').trim().replace(/\s+/g,' ').slice(0,120)}));}catch(e){}
const controls=ids.filter(x=>/exam|date|study|minute|plan|setting|profile|home|today/i.test(x.id)||/試験|学習|今日|計画/.test(x.text));
console.log('__V340D__'+Buffer.from(JSON.stringify({v:APP_VERSION,profile:profileCopy,tasks,snapshot,direct,controls:controls.slice(0,160)})).toString('base64'));
'''
with tempfile.TemporaryDirectory() as td:
    p=Path(td)/'x.js';p.write_text(stub+'\n'+js+'\n'+tail);z=subprocess.run(['node',str(p)],capture_output=True,text=True);req(z.returncode==0,'runtime '+z.stderr[-12000:]);m=re.search(r'__V340D__([A-Za-z0-9+/=]+)',z.stdout);req(m,'marker');data=json.loads(base64.b64decode(m.group(1)))
# Static snippets around onboarding signals.
snips={}
for term in ['examDate','studyMinutes','autoAdjust','renderHome','renderTodayPlan','学習時間','試験予定日','試験日','今日の計画','学習計画']:
    rows=[];pos=0
    while True:
        i=js.find(term,pos)
        if i<0 or len(rows)>=8:break
        rows.append(re.sub(r'\s+',' ',js[max(0,i-350):i+850]))
        pos=i+len(term)
    snips[term]=rows
out={'version':data['v'],'profile':data['profile'],'tasks':data['tasks'],'snapshot':data['snapshot'],'functionSources':data['direct'],'domControls':data['controls'],'snippets':snips}
Path('audits').mkdir(exist_ok=True);Path('audits/V340_FIRST_RUN_DISCOVERY.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('V340_FIRST_RUN_DISCOVERY_OK profileSettings='+json.dumps((data.get('profile') or {}).get('value',{}).get('settings',{}),ensure_ascii=False)+' controls='+str(len(data['controls'])))
