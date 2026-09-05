const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'app/backup-diagram-v372.js'),'utf8'),context);
const model=JSON.parse(vm.runInContext('JSON.stringify(backupDiagramModelV372())',context));
const html=vm.runInContext("coreTopicBackupDiagramViewV372('core_06_03')",context);
const checks=[];
function check(name,pass){assert.ok(pass,name);checks.push(name);console.log('PASS '+name)}
const method=mode=>model.methods.find(m=>m.mode===mode);
const final=['元','A','B','C','D'];
const restore=(m,chain=m.restore)=>[...new Set(chain.flatMap(i=>m.rows[i].data))];
check('same five-day addition scenario',JSON.stringify(model.days)==='["日","月","火","水","木"]'&&JSON.stringify(model.additions)==='[["元"],["A"],["B"],["C"],["D"]]');
check('full includes all data at each backup',JSON.stringify(method('full').rows.map(r=>r.data))==='[["元"],["元","A"],["元","A","B"],["元","A","B","C"],["元","A","B","C","D"]]');
check('differential accumulates changes since Sunday full',JSON.stringify(method('differential').rows.map(r=>r.data))==='[["元"],["A"],["A","B"],["A","B","C"],["A","B","C","D"]]');
check('incremental stores only each new addition',JSON.stringify(method('incremental').rows.map(r=>r.data))==='[["元"],["A"],["B"],["C"],["D"]]');
for(const m of model.methods){
  check(m.mode+' restore reconstructs all Thursday data',JSON.stringify(restore(m))===JSON.stringify(final));
  check(m.mode+' renderer shows exact backup data and chain',m.rows.every((row,i)=>html.includes(`data-backup-day="${i}"`)&&row.data.every(x=>html.includes(`data-backup-data="${x}"`)))&&html.includes(`data-backup-method="${m.mode}"`));
}
check('full/differential/incremental restore chains are 1/2/5',JSON.stringify(model.methods.map(m=>m.restore))==='[[4],[0,4],[0,1,2,3,4]]');
check('missing Tuesday incremental loses B',!restore(method('incremental'),[0,1,3,4]).includes('B'));
check('latest incremental alone is insufficient',JSON.stringify(restore(method('incremental'),[4]))==='["D"]');
check('target only, static and accessible',vm.runInContext("coreTopicBackupDiagramViewV372('core_06_01')",context)===''&&html.includes('aria-labelledby="backupCaptionV372"')&&!/<button|onclick|tabindex/.test(html));
check('overview contains five days but no method cards',!vm.runInContext("backupDiagramViewV372('overview')",context).includes('data-backup-method='));
for(const mode of ['incremental','differential']){
  const view=vm.runInContext(`backupDiagramViewV372('${mode}')`,context);
  check(mode+' mode selects one complete method',(view.match(/data-backup-method=/g)||[]).length===1&&view.includes(`data-backup-method="${mode}"`));
}
check('model is fresh and read-only on each call',JSON.stringify(model)===vm.runInContext('JSON.stringify(backupDiagramModelV372())',context));
console.log(`PASS — V372 BACKUP MODEL ${checks.length}/${checks.length}`);
