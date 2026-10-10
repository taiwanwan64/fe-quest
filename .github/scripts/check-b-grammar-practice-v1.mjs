import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync('assets/b-grammar-practice-v1.js','utf8');
const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-b-grammar-v1.json','utf8'));
const functionCatalog=JSON.parse(fs.readFileSync('assets/question-catalog-b-grammar-functions-v1.json','utf8'));
const typeCatalog=JSON.parse(fs.readFileSync('assets/question-catalog-b-grammar-types-v1.json','utf8'));
const indexHtml=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const css=fs.readFileSync('assets/b-grammar-practice-v1.css','utf8');
const ids=['do_boundary','scope','logical_or','logical_not','concat','division'].map(s=>'b_exam_bgrammar_'+s);
assert.deepEqual(catalog.items.map(x=>x.id),ids);
const typeIds=['b_exam_bgrammar_types','b_exam_bgrammar_undefined'];
assert.deepEqual(typeCatalog.items.map(x=>x.id),typeIds);
assert.equal(typeCatalog.version,'b-grammar-types-catalog-v1');
assert.equal(typeCatalog.contentVersion,'b-grammar-types-protected-v1-20261010');
assert.deepEqual(typeCatalog.counts,{supplementalGrammar:2,catalogQuestions:2});
assert.equal(indexHtml.split('id="bGrammarTypesStart"').length-1,1);
assert.ok(indexHtml.includes('型・未定義の2問を確認する'));
assert.ok(indexHtml.includes('./assets/b-grammar-practice-v1.js?v=bgrammar-functions-195'));
assert.ok(sw.includes('./assets/b-grammar-practice-v1.js?v=bgrammar-functions-195'));
assert.ok(sw.includes('question-catalog-b-grammar-types-v1.json'));
assert.deepEqual(functionCatalog.items.map(x=>x.id),['b_exam_bgrammar_call_order','b_exam_bgrammar_return_exit']);
assert.equal(functionCatalog.version,'b-grammar-functions-catalog-v1');
assert.equal(functionCatalog.contentVersion,'b-grammar-functions-protected-v1-20261010');
assert.deepEqual(functionCatalog.counts,{supplementalGrammar:2,catalogQuestions:2});
assert.equal(indexHtml.split('id="bGrammarFunctionsStart"').length-1,1);
assert.ok(indexHtml.includes('引数・returnの2問を確認する'));
assert.ok(sw.includes('question-catalog-b-grammar-functions-v1.json'));
for(const [i,row] of typeCatalog.items.entries()){
 assert.equal(row.practice,'grammar-types-v1');assert.equal(row.practiceOrdinal,i+1);
 assert.equal(row.sourcePool,'b_exam_algo');assert.equal(row.id,'b_exam_'+row.parentId);
 assert.ok(Object.keys(row).every(key=>['id','sourcePool','parentId','ordinal','level','domain','format','practice','practiceOrdinal'].includes(key)));
}
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
const syntheticFor=doc=>doc.items.map((entry,i)=>({id:entry.id,sourcePool:entry.sourcePool,stem:'Synthetic prompt '+i,options:['alpha','beta','gamma','delta'],hint:'Synthetic hint',renderContext:{type:'exam',parentId:entry.parentId,title:'Synthetic title '+i,context:'Synthetic context',code:['synthetic code'],data:[]}}));
function harness({mutateCatalog=x=>x,mutateBootstrap=x=>x,mutateGrade=x=>x,failGrade=false,failBootstrap=false,delayBootstrap=false,delayGrade=false}={}){
  const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const guide=new Element();get('bGrammarPractice').guide=guide;
  get('bGrammarQuestion').hidden=true;get('bGrammarNext').hidden=true;get('bGrammarHint').hidden=true;
  get('trace').classList.contains=key=>key==='active';
  const calls=[],observers=[];let pendingResolve=null,failed=false,selected=catalog;
  const fetch=async(url,options)=>{
    assert.equal(options.cache,'no-store');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.ok(options.signal);
    const body=options.body?JSON.parse(options.body):null;calls.push({url,body});
    if(!body){selected=String(url).includes('grammar-functions-v1')?functionCatalog:String(url).includes('grammar-types-v1')?typeCatalog:catalog;return {ok:true,json:async()=>mutateCatalog(structuredClone(selected))};}
    assert.equal(options.method,'POST');
    if(body.action==='bootstrap'){
      assert.equal(body.accessCode,'');assert.deepEqual(body.requestedIds,selected.items.map(x=>x.id));
      const synthetic=syntheticFor(selected);
      if(failBootstrap)return {ok:false};
      if(delayBootstrap)await new Promise(resolve=>pendingResolve=resolve);
      return {ok:true,json:async()=>mutateBootstrap({sessionToken:'x'.repeat(64),questions:structuredClone(synthetic)})};
    }
    assert.equal(body.action,'answer');assert.equal(body.sessionToken,'x'.repeat(64));
    if(failGrade&&!failed){failed=true;return {ok:false};}
    const ordinal=selected.items.findIndex(x=>x.id===body.questionId);assert.ok(ordinal>=0);
    const answerIndex=ordinal%4;
    if(delayGrade)await new Promise(resolve=>pendingResolve=resolve);
    return {ok:true,json:async()=>mutateGrade({questionId:body.questionId,correct:body.choiceIndex===answerIndex,answerIndex,explanation:'Synthetic explanation',choiceExplanations:Array(4).fill('Synthetic reason')})};
  };
  const context={document:{currentScript:{src:'https://example.test/assets/b-grammar-practice-v1.js'},baseURI:'https://example.test/',getElementById:get,createElement:()=>new Element()},window:{addEventListener(){}},URL,AbortController,setTimeout,clearTimeout,fetch,MutationObserver:class{constructor(handler){this.handler=handler;observers.push(this);}observe(){}}};
  vm.runInNewContext(source,context);
  return {get,calls,guide,observers,release:()=>pendingResolve?.(),takeRelease:()=>pendingResolve,pending:()=>!!pendingResolve};
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


const subsets=[[catalog,'bGrammarStart'],[typeCatalog,'bGrammarTypesStart'],[functionCatalog,'bGrammarFunctionsStart']];
for(const [doc,button] of subsets){
 const size=doc.items.length;
 let trial=harness();await trial.get(button).click();
 for(const [,startButton] of subsets)assert.equal(trial.get(startButton).hidden,true);
 for(let i=0;i<size;i++){
  assert.equal(trial.get('bGrammarTitle').textContent,`${i+1} / ${size}：Synthetic title ${i}`);
  await trial.get('bGrammarOptions').children[i%4].click();await trial.get('bGrammarNext').click();
 }
 assert.ok(trial.get('bGrammarStatus').textContent.includes(`初回正解 ${size} / ${size}`));
 assert.equal(trial.get(button).focused,true);
 for(const [,startButton] of subsets)assert.equal(trial.get(startButton).hidden,false);
 for(const mutateCatalog of [
  doc=>({...doc,contentVersion:'wrong-version'}),
  doc=>({...doc,counts:{...doc.counts,catalogQuestions:99}}),
  doc=>{doc.items[0].practice='other-practice';return doc;}
 ]){
  trial=harness({mutateCatalog});await trial.get(button).click();
  assert.equal(trial.calls.length,1);assert.equal(trial.get('bGrammarQuestion').hidden,true);
  assert.equal(trial.get('bGrammarTypesStart').disabled,false);
 }
 for(const mutateBootstrap of [
  data=>({...data,questions:data.questions.slice(1)}),
  data=>{data.questions[0].renderContext.answer_index=0;return data;}
 ]){
  trial=harness({mutateBootstrap});await trial.get(button).click();
  assert.equal(trial.get('bGrammarQuestion').hidden,true);assert.equal(trial.get(button).disabled,false);
 }
 trial=harness({failGrade:true});await trial.get(button).click();
 await trial.get('bGrammarOptions').children[0].click();
 assert.equal(trial.get('bGrammarNext').hidden,true);
 await trial.get('bGrammarOptions').children[0].click();
 assert.equal(trial.get('bGrammarNext').hidden,false);
 await trial.get('bGrammarClose').click();assert.equal(trial.get('bGrammarOptions').children.length,0);
}
app=harness();await app.get('bGrammarTypesStart').click();
await app.get('bGrammarOptions').children[1].click();
assert.equal(app.get('bGrammarHint').hidden,false);
assert.equal(app.get('bGrammarOptions').children[1].disabled,true);
await app.get('bGrammarOptions').children[0].click();await app.get('bGrammarNext').click();
await app.get('bGrammarOptions').children[1].click();await app.get('bGrammarNext').click();
assert.ok(app.get('bGrammarStatus').textContent.includes('初回正解 1 / 2'));
assert.equal(app.calls.filter(x=>x.body?.action==='answer').length,3);
// Close a pending old response, start the other subset, and reject the old response.
for(const [,oldButton] of subsets)for(const [,newButton] of subsets){
 if(oldButton===newButton)continue;
 app=harness({delayBootstrap:true});const oldStart=app.get(oldButton).click();
 for(let i=0;i<20&&!app.pending();i++)await Promise.resolve();assert.ok(app.pending());
 const releaseOld=app.takeRelease();
 await app.get('bGrammarClose').click();
 const newStart=app.get(newButton).click();
 for(let i=0;i<20;i++)await Promise.resolve();
 const releaseNew=app.takeRelease();
 releaseNew();await newStart;
 const newTitle=app.get('bGrammarTitle').textContent;
 releaseOld();await oldStart;
 assert.equal(app.get('bGrammarTitle').textContent,newTitle);
 assert.equal(app.get('bGrammarQuestion').hidden,false);
}
// A late grade after close must not alter the newly loaded subset.
app=harness({delayGrade:true});await app.get('bGrammarTypesStart').click();
const oldGrade=app.get('bGrammarOptions').children[0].click();
for(let i=0;i<20&&!app.pending();i++)await Promise.resolve();
await app.get('bGrammarClose').click();await app.get('bGrammarStart').click();
app.release();await oldGrade;
assert.equal(app.get('bGrammarTitle').textContent,'1 / 6：Synthetic title 0');
assert.equal(app.get('bGrammarFeedback').children.length,0);
for(const [doc,button] of subsets){
 for(const [i,row] of doc.items.entries()){
  assert.equal(row.practiceOrdinal,i+1);
  assert.equal(row.id,'b_exam_'+row.parentId);
  assert.ok(Object.keys(row).every(key=>['id','sourcePool','parentId','ordinal','level','domain','format','practice','practiceOrdinal'].includes(key)));
 }
 let trial=harness();await trial.get(button).click();
 for(const [,startButton] of subsets)assert.equal(trial.get(startButton).hidden,true);
 await trial.get('bGrammarOptions').children[1].click();
 assert.equal(trial.get('bGrammarHint').hidden,false);
 assert.equal(trial.get('bGrammarOptions').children[1].disabled,true);
 await trial.get('bGrammarOptions').children[0].click();await trial.get('bGrammarNext').click();
 for(let i=1;i<doc.items.length;i++){await trial.get('bGrammarOptions').children[i%4].click();await trial.get('bGrammarNext').click();}
 assert.ok(trial.get('bGrammarStatus').textContent.includes('初回正解 '+(doc.items.length-1)+' / '+doc.items.length));
 assert.equal(trial.get(button).focused,true);
}
// Every old grading response must be discarded after starting a different subset.
for(const [,oldButton] of subsets)for(const [newDoc,newButton] of subsets){
 if(oldButton===newButton)continue;
 const trial=harness({delayGrade:true});await trial.get(oldButton).click();
 const oldGrade=trial.get('bGrammarOptions').children[0].click();
 for(let i=0;i<20&&!trial.pending();i++)await Promise.resolve();assert.ok(trial.pending());
 await trial.get('bGrammarClose').click();await trial.get(newButton).click();
 trial.release();await oldGrade;
 assert.equal(trial.get('bGrammarTitle').textContent,'1 / '+newDoc.items.length+'：Synthetic title 0');
 assert.equal(trial.get('bGrammarFeedback').children.length,0);
}
console.log('PASS isolated subsets: unchanged 6 and types 2 plus independent functions 2; all subset failures, retries, first score, six cross-subset bootstrap and grade races');

