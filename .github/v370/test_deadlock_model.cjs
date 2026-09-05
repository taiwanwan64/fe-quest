const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/deadlock-diagram-v370.js'),'utf8');
const context=vm.createContext({});
vm.runInContext(source,context);
const html=vm.runInContext("coreTopicDeadlockDiagramViewV370('core_09_06')",context);
const checks=[
  ['only exclusion-control lesson receives diagram',vm.runInContext("coreTopicDeadlockDiagramViewV370('core_09_07')",context)===''],
  ['two process lanes present',(html.match(/class="deadlock-lane-v370/g)||[]).length===2],
  ['process A holds product and waits for order',html.includes('商品表を保持したまま')&&html.includes('処理Bが保持中 → 待機')],
  ['process B holds order and waits for product',html.includes('注文表を保持したまま')&&html.includes('処理Aが保持中 → 待機')],
  ['circular wait is explicit',html.includes('処理Aは処理Bを待ち、処理Bは処理Aを待つ循環待ち')&&(html.match(/data-deadlock-state="wait"/g)||[]).length===2],
  ['consistent lock order is shown',html.includes('ロック順序を統一')&&html.includes('<span>商品表</span><i>→</i><span>注文表</span>')],
  ['rollback recovery is shown',html.includes('片方をROLLBACK')&&html.includes('一方のトランザクションを取り消して循環を切る')],
  ['static and accessible',html.includes('aria-labelledby="deadlockCaptionV370"')&&!html.includes('<button')]
];
for(const [name,pass] of checks){assert.ok(pass,name);console.log('PASS '+name)}console.log(`PASS — V370 DEADLOCK MODEL ${checks.length}/${checks.length}`);
