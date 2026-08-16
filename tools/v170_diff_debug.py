from pathlib import Path
import hashlib, re, subprocess, tempfile
from v170_runtime_stub import STUB

p=Path('_site/index.html').read_bytes(); r=Path('_site_reference/index.html').read_bytes()
print('FEQUEST_V170_DIFF_DEBUG', 'prod-bytes='+str(len(p)), 'ref-bytes='+str(len(r)), 'prod-sha='+hashlib.sha256(p).hexdigest(), 'ref-sha='+hashlib.sha256(r).hexdigest())
limit=min(len(p),len(r)); i=next((i for i in range(limit) if p[i]!=r[i]),limit)
print('FEQUEST_V170_DIFF_FIRST',i,'prod-tail=',repr(p[max(0,i-120):i+240]),'ref-tail=',repr(r[max(0,i-120):i+240]))
j=0
while j<limit-i and p[len(p)-1-j]==r[len(r)-1-j]: j+=1
print('FEQUEST_V170_DIFF_SPAN','prefix='+str(i),'suffix='+str(j),'prod-middle='+str(len(p)-i-j),'ref-middle='+str(len(r)-i-j))

def extract_js(h):
    scripts=re.findall(r'<script(?:\s[^>]*)?>(.*?)</script>',h,re.S|re.I)
    return '\n'.join(x for x in scripts if x.strip() and not x.lstrip().startswith('{'))

CAT=r'''
const __c=require('crypto');
function __canon(v){if(v===null||typeof v!=='object')return v;if(Array.isArray(v))return v.map(__canon);const o={};for(const k of Object.keys(v).sort()){const x=v[k];if(typeof x==='function'||typeof x==='undefined')continue;o[k]=__canon(x);}return o;}
function __emit(n,v){const raw=JSON.stringify(__canon(v));console.log('__FEQ_CAT__ '+n+' '+__c.createHash('sha256').update(raw).digest('hex')+' '+Buffer.byteLength(raw,'utf8'));}
__emit('questionBank',QUESTION_BANK);
__emit('selfCheck',globalThis.FEQUEST_SELF_CHECK);
for(const k of Object.keys(globalThis.FEQUEST_SELF_CHECK||{}).sort())__emit('selfCheck.'+k,globalThis.FEQUEST_SELF_CHECK[k]);
__emit('diagnosticData',globalThis.FEQ_DIAGNOSTIC_CONTRACT_DATA);
__emit('diagnosticProvenance',globalThis.FEQ_DIAGNOSTIC_DATA_PROVENANCE);
__emit('globalSurface',Object.keys(globalThis).filter(k=>/^(?:feq|runV)/.test(k)).sort());
__emit('answerDistribution',[0,1,2,3].map(i=>QUESTION_BANK.filter(q=>q.a===i).length));
__emit('cognitiveDistribution',['想起','適用','判断'].map(k=>QUESTION_BANK.filter(q=>q.cognitiveLevel===k).length));
'''

def cats(label,b):
    js=extract_js(b.decode())
    with tempfile.TemporaryDirectory() as td:
        q=Path(td)/(label+'.js'); q.write_text(STUB+'\n'+js+'\n'+CAT)
        z=subprocess.run(['node',str(q)],capture_output=True,text=True)
        print('FEQUEST_V170_CAT_RUN',label,'rc='+str(z.returncode))
        if z.returncode: print(z.stderr[-1200:])
        lines=[x for x in z.stdout.splitlines() if x.startswith('__FEQ_CAT__ ')]
        for x in lines: print(label,x)
        return {x.split()[1]:(x.split()[2],x.split()[3]) for x in lines}
a=cats('compact',p); b=cats('reference',r)
for k in sorted(set(a)|set(b)):
    if a.get(k)!=b.get(k): print('FEQUEST_V170_CAT_MISMATCH',k,a.get(k),b.get(k))
