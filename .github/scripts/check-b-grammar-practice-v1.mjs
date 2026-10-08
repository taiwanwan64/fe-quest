import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/b-grammar-practice-v1.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-b-grammar-v1.json','utf8'));
const indexHtml=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('assets/b-grammar-practice-v1.css','utf8');
const ids=['do_boundary','scope','logical_or','logical_not','concat','division'].map(s=>'b_exam_bgrammar_'+s);
assert.deepEqual(catalog.items.map(x=>x.id),ids);
assert.equal(indexHtml.split('id="bGrammarPractice"').length-1,1);
assert.ok(indexHtml.includes('XP・履歴・基礎35演習の進捗に加算しません'));
for(const asset of ['b-grammar-practice-v1.js','b-grammar-practice-v1.css','question-catalog-b-grammar-v1.json'])assert.ok(sw.includes(asset));
assert.ok(css.includes('[hidden]{display:none!important}'));assert.ok(css.includes('min-height:48px'));assert.ok(css.includes('18px'));
assert.ok(!/localStorage|sessionStorage|indexedDB|saveProfile|innerHTML|eval\(/.test(source));
class Element{
  constructor(){this.children=[];this.handlers={};this.hidden=false;this.disabled=false;this.textContent='';this.dataset={};this.open=true;this.classList={contains:()=>false};}
  replaceChildren(){this.children=[];this.textContent='';}
  appendChild(child){this.children.push(child);return child;}
  addEventListener(event,handler){this.handlers[event]=handler;}
  closest(){return this.guide;}
  focus(){this.focused=true;}
  async click(){if(!this.disabled)return this.handlers.click?.();}
}
const synthetic=catalog.items.map((entry,i)=>({id:entry.id,sourcePool:entry.sourcePool,stem:'Synthetic prompt '+i,options:['alpha','beta','gamma','delta'],hint:'Synthetic hint',renderContext:{type:'exam',parentId:entry.parentId,title:'Synthetic title '+i,context:'Synthetic context',code:['synthetic code'],data:[]}}));
function harness({mutateCatalog=x=>x,mutateBootstrap=x=>x,mutateGrade=x=>x,failGrade=false,failBootstrap=false,delayBootstrap=false}={}){
  const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const guide=new Element();get('bGrammarPractice').guide=guide;
  get('bGrammarQuestion').hidden=true;get('bGrammarNext').hidden=true;get('bGrammarHint').hidden=true;
  get('trace').classList.contains=key=>key==='active';
  const calls=[],observers=[];let pendingResolve=null,failed=false;
  const fetch=async(url,options)=>{
    assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.ok(options.signal);
    const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
    if(!body)return {ok:true,json:async()=>mutateCatalog(structuredClone(catalog))};
    assert.equal(options.method,'POST');
    if(body.action==='bootstrap'){
      assert.equal(body.accessCode,'');assert.deepEqual(body.requestedIds,ids);
      if(failBootstrap)return {ok:false};
      if(delayBootstrap)await new Promise(resolve=>pendingResolve=resolve);
      return {ok:true,json:async()=>mutateBootstrap({sessionToken:'x'.repeat(64),questions:structuredClone(synthetic)})};
    }
    assert.equal(body.action,'answer');assert.equal(body.sessionToken,'x'.repeat(64));
    if(failGrade&&!failed){failed=true;return {ok:false};}
    const ordinal=ids.indexOf(body.questionId);assert.ok(ordinal>=0);
    const answerIndex=ordinal%4;
    return {ok:true,json:async()=>mutateGrade({questionId:body.questionId,correct:body.choiceIndex===answerIndex,answerIndex,explanation:'Synthetic explanation',choiceExplanations:Array(4).fill('Synthetic reason')})};
  };
  const context={document:{currentScript:{src:'https://example.test/assets/b-grammar-practice-v1.js'},baseURI:'https://example.test/',getElementById:get,createElement:()=>new Element()},window:{addEventListener(){}},URL,AbortController,setTimeout,clearTimeout,fetch,MutationObserver:class{constructor(handler){this.handler=handler;observers.push(this);}observe(){}}};
  vm.runInNewContext(source,context);
  return {get,calls,guide,observers,release:()=>pendingResolve?.(),pending:()=>!!pendingResolve};
}
let app=harness();await app.get('bGrammarStart').click();
for(let i=0;i<6;i++){
  assert.equal(app.get('bGrammarTitle').textContent,`${i+1} / 6：Synthetic title ${i}`);
  assert.equal(app.get('bGrammarOptions').children.length,4);
  await app.get('bGrammarOptions').children[i%4].click();
  assert.ok(app.get('bGrammarFeedback').children[0].textContent.includes('正解です'));
  assert.equal(app.get('bGrammarFeedback').children[2].children.length,4);
  await app.get('bGrammarNext').click();
}
assert.ok(app.get('bGrammarStatus').textContent.includes('初回正解 6 / 6'));
assert.equal(app.get('bGrammarQuestion').hidden,true);assert.equal(app.get('bGrammarOptions').children.length,0);
assert.equal(app.calls.filter(x=>x.body?.action==='answer').length,6);
app=harness();await app.get('bGrammarStart').click();
await app.get('bGrammarOptions').children[1].click();assert.equal(app.get('bGrammarOptions').children[1].disabled,true);assert.equal(app.get('bGrammarHint').hidden,false);
await app.get('bGrammarOptions').children[0].click();await app.get('bGrammarNext').click();
for(let i=1;i<6;i++){await app.get('bGrammarOptions').children[i%4].click();await app.get('bGrammarNext').click();}
assert.ok(app.get('bGrammarStatus').textContent.includes('初回正解 5 / 6'));
for(const mutateBootstrap of [data=>({...data,questions:data.questions.slice(0,5)}),data=>{data.questions[0].answerIndex=0;return data;},data=>{data.questions[0].renderContext.explanation='leak';return data;},data=>{data.questions[1]=data.questions[0];return data;},data=>{data.questions[0].sourcePool='subject_a';return data;}]){
  app=harness({mutateBootstrap});await app.get('bGrammarStart').click();assert.equal(app.get('bGrammarQuestion').hidden,true);assert.ok(app.get('bGrammarStatus').textContent.includes('読み込めません'));assert.equal(app.get('bGrammarStart').disabled,false);
}
app=harness({mutateCatalog:doc=>{doc.items[0].stem='leak';return doc;}});await app.get('bGrammarStart').click();assert.equal(app.calls.length,1);assert.equal(app.get('bGrammarQuestion').hidden,true);
app=harness({failBootstrap:true});await app.get('bGrammarStart').click();assert.equal(app.get('bGrammarStart').disabled,false);
app=harness({failGrade:true});await app.get('bGrammarStart').click();await app.get('bGrammarOptions').children[0].click();assert.equal(app.get('bGrammarNext').hidden,true);assert.equal(app.get('bGrammarOptions').children[0].disabled,false);await app.get('bGrammarOptions').children[0].click();assert.equal(app.get('bGrammarNext').hidden,false);
app=harness({mutateGrade:data=>({...data,questionId:'wrong_id'})});await app.get('bGrammarStart').click();await app.get('bGrammarOptions').children[0].click();assert.equal(app.get('bGrammarNext').hidden,true);assert.ok(app.get('bGrammarStatus').textContent.includes('未確定'));
app=harness({delayBootstrap:true});const starting=app.get('bGrammarStart').click();
for(let i=0;i<20&&!app.pending();i++)await Promise.resolve();assert.ok(app.pending());
await app.get('bGrammarClose').click();app.release();await starting;
assert.equal(app.get('bGrammarQuestion').hidden,true);assert.equal(app.get('bGrammarStart').disabled,false);assert.ok(app.get('bGrammarStatus').textContent.includes('閉じました'));
app=harness();await app.get('bGrammarStart').click();app.guide.open=false;app.guide.handlers.toggle();assert.equal(app.get('bGrammarQuestion').hidden,true);
app=harness();await app.get('bGrammarStart').click();app.get('trace').classList.contains=()=>false;app.observers[1].handler();assert.equal(app.get('bGrammarOptions').children.length,0);
console.log('PASS isolated grammar supplement: 6-question flow, wrong retry, first score, pre-answer leak rejection, transport failure, stale/collapse/route cleanup, no persistence');
