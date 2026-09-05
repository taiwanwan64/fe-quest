const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/paging-diagram-v371.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const model=JSON.parse(vm.runInContext('JSON.stringify(pagingDiagramModelV371())',context));
const html=vm.runInContext("coreTopicPagingDiagramViewV371('core_06_01')",context);
const checks=[];
function check(name,condition){assert.ok(condition,name);checks.push(name);console.log('PASS '+name)}
check('only OS lesson receives diagram',vm.runInContext("coreTopicPagingDiagramViewV371('core_06_03')",context)==='');
check('resident pages before replacement are 1,3,0',JSON.stringify(model.before)==='[1,3,0]');
check('page 2 replaces page 1 in frame 0',model.requested===2&&model.victim===1&&model.victimFrame===0&&JSON.stringify(model.after)==='[2,3,0]');
check('frame count and other pages unchanged',model.before.length===3&&model.after.length===3&&model.before.slice(1).every((x,i)=>x===model.after[i+1]));
check('no duplicate resident pages',new Set(model.after).size===3&&model.after.every(p=>p>=0&&p<model.pageCount));
check('model is fresh on each render',JSON.stringify(model)===vm.runInContext('JSON.stringify(pagingDiagramModelV371())',context));
const before=html.split('data-paging-phase="before"')[1].split('data-paging-phase="after"')[0],after=html.split('data-paging-phase="after"')[1];
for(const [label,part,frames] of [['before',before,model.before],['after',after,model.after]]){
  check(label+' page table agrees with physical frames',Array.from({length:model.pageCount},(_,p)=>p).every(p=>part.includes(`data-page="${p}" data-frame="${frames.includes(p)?frames.indexOf(p):'absent'}"`))&&frames.every((p,f)=>part.includes(`data-frame="${f}" data-page="${p}"`)));
}
check('page fault, replacement, page-in, and resume ordered',JSON.stringify([...html.matchAll(/data-paging-step="([a-z]+)"/g)].map(m=>m[1]))==='["fault","replace","load","resume"]');
check('dirty writeback is conditional, empty frames need no replacement',html.includes('未反映の変更があれば')&&html.includes('空き枠があれば置換は不要'));
check('frame/page distinction, offset and thrashing explained',html.includes('ページ番号と枠番号は別')&&html.includes('ページ内の位置は変えず')&&html.includes('スラッシング'));
check('semantic static diagram, no completion gate',html.includes('aria-labelledby="pagingCaptionV371"')&&(html.match(/<caption>/g)||[]).length===2&&!/<button|onclick|tabindex/.test(html));
console.log(`PASS — V371 PAGING MODEL ${checks.length}/${checks.length}`);
