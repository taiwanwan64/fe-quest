const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'app/sql-join-diagram-v369.js'),'utf8');
const context=vm.createContext({escapeHtml:value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]))});
vm.runInContext(source,context);
const html=vm.runInContext("coreTopicSqlJoinDiagramViewV369('core_09_07')",context);
const checks=[['only SQL lesson receives diagram',vm.runInContext("coreTopicSqlJoinDiagramViewV369('core_09_06')",context)===''],['source tables present',html.includes('employee（社員）')&&html.includes('department（部署）')],['join key explicit',html.includes('employee.dept_id = department.dept_id')],['INNER JOIN has two result rows',(html.match(/is-inner[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)||[])[1]?.match(/<tr/g)?.length===2],['LEFT OUTER JOIN has three result rows',(html.match(/is-left[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)||[])[1]?.match(/<tr/g)?.length===3],['unmatched employee kept as NULL',html.includes('is-kept-unmatched')&&html.includes('sql-join-null-v369')],['right-only department exclusion explained',html.includes('総務部（dept_id = 40）は結果に追加されません')],['static and accessible',html.includes('aria-labelledby="sqlJoinCaptionV369"')&&!html.includes('<button')]];
for(const [name,pass] of checks){assert.ok(pass,name);console.log('PASS '+name)}console.log(`PASS — V369 SQL JOIN MODEL ${checks.length}/${checks.length}`);
