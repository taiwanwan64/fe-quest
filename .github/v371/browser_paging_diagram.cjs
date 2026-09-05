const fs=require('node:fs'),http=require('node:http'),path=require('node:path');const {chromium,webkit}=require('playwright');
const ROOT=path.resolve(__dirname,'../..'),OUT=path.join(ROOT,'_browser_evidence/v371');const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json'};
function server(){return http.createServer((req,res)=>{const pathname=new URL(req.url,'http://127.0.0.1').pathname,rel=pathname==='/'||pathname==='/index.html'?'app/base-shell-v371.html':decodeURIComponent(pathname).replace(/^\/+/, ''),target=path.resolve(ROOT,rel);if(!target.startsWith(ROOT+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end('not found');return}const body=fs.readFileSync(target);res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream','content-length':body.length,'cache-control':'no-store'});res.end(body)})}
async function stable(page){const deadline=Date.now()+45000;for(let i=0;i<8;i++){const remain=Math.max(1000,deadline-Date.now());await page.waitForLoadState('load',{timeout:remain});await page.waitForFunction(()=>window.FEQUEST_APP_BOOT_COMPLETE===true&&window.__FEQ_PAGESHOW_SEEN===true,null,{timeout:remain});await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated',null,{timeout:remain});const origin=await page.evaluate(()=>performance.timeOrigin);await page.waitForTimeout(750);if(await page.evaluate(o=>performance.timeOrigin===o&&window.FEQUEST_APP_BOOT_COMPLETE===true,origin))return;if(Date.now()>=deadline)break}throw new Error('stable boot boundary not reached')}

async function metrics(figure){
  return figure.evaluate(node=>{
    const panels=[...node.querySelectorAll('.paging-panel-v371')];
    const lineCount=e=>{const r=document.createRange();r.selectNodeContents(e);return [...r.getClientRects()].filter(x=>x.width>0&&x.height>0).length;};
    const blocks=[node,...node.querySelectorAll('section,div,p,h3,h4,figcaption,table,th,td,ol,li')];
    return {
      panelWidths:panels.map(e=>e.getBoundingClientRect().width),
      tableWidths:panels.map(e=>e.querySelector('table').getBoundingClientRect().width),
      titleLines:panels.map(e=>lineCount(e.querySelector('h3'))),
      captionLines:lineCount(node.querySelector('figcaption>b')),
      frameLabelLines:[...node.querySelectorAll('.paging-frames-v371 li>b')].map(lineCount),
      maps:panels.map(e=>[...e.querySelectorAll('tbody tr')].map(r=>[Number(r.dataset.page),r.dataset.frame])),
      frames:panels.map(e=>[...e.querySelectorAll('.paging-frames-v371 li')].map(r=>Number(r.dataset.page))),
      flow:[...node.querySelectorAll('[data-paging-step]')].map(e=>e.dataset.pagingStep),
      overflows:blocks.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.className||e.tagName),
      documentOverflow:document.documentElement.scrollWidth>innerWidth+1
    };
  });
}
async function runCase(type,name,viewport,isMobile=false){
  const browser=await type.launch(),context=await browser.newContext({viewport,screen:isMobile?viewport:undefined,locale:'ja-JP',isMobile,hasTouch:isMobile,deviceScaleFactor:isMobile?3:1}),page=await context.newPage();
  await page.addInitScript(()=>{window.__FEQ_PAGESHOW_SEEN=false;addEventListener('pageshow',()=>window.__FEQ_PAGESHOW_SEEN=true,{once:true});});
  const errors=[],checks=[];let m=null;
  page.on('pageerror',e=>errors.push(String(e)));
  const check=(label,value)=>checks.push({label,pass:Boolean(value)});
  try{
    const response=await page.goto(globalThis.__BASE__,{waitUntil:'load',timeout:60000});
    await stable(page);
    check('HTTP 200 and v371 runtime',response.status()===200&&await page.evaluate(()=>APP_VERSION==='v371'));
    await page.evaluate(()=>{profile.diagnosticCompleted=true;firstRunGuidedSessionV364=false;document.body.classList.remove('fequest-first-run-v364');document.getElementById('firstRunGuidedV364')?.remove();});
    const learningState=()=>page.evaluate(()=>JSON.stringify({progress:profile.lessonProgress,bProgress:profile.bProgress,qStats:profile.qStats,xp:profile.xp}));
    const before=await learningState();
    await page.evaluate(()=>startLesson('core_06_01'));
    const figure=page.locator('.paging-figure-v371');
    await figure.waitFor({state:'visible'});
    await figure.evaluate(node=>node.scrollIntoView({block:'start'}));
    m=await metrics(figure);
    const equal=xs=>xs.length===2&&Math.abs(xs[0]-xs[1])<=1;
    check('before/after cards and tables have equal width',equal(m.panelWidths)&&equal(m.tableWidths));
    check('titles and physical page labels stay on one line',m.titleLines.every(x=>x===1)&&m.frameLabelLines.every(x=>x===1));
    check('figure title stays on one line',m.captionLines===1);
    check('before page table maps virtual pages correctly',JSON.stringify(m.maps[0])==='[[0,"2"],[1,"0"],[2,"absent"],[3,"1"]]');
    check('after page table updates both affected entries',JSON.stringify(m.maps[1])==='[[0,"2"],[1,"absent"],[2,"0"],[3,"1"]]');
    check('only frame 0 is replaced; three frames remain',JSON.stringify(m.frames)==='[[1,3,0],[2,3,0]]');
    check('four fault-handling stages are ordered',JSON.stringify(m.flow)==='["fault","replace","load","resume"]');
    check('figure and document do not overflow',m.overflows.length===0&&!m.documentOverflow);
    check('no learner controls added',await figure.locator('button,input,select').count()===0);
    check('learning state remains unchanged',await learningState()===before);
    fs.mkdirSync(OUT,{recursive:true});
    await page.screenshot({path:path.join(OUT,name+'-context.png')});
    // Element captures span many viewports. Exclude fixed screen chrome only
    // for the figure image; the context image and all measurements are unmodified.
    await figure.screenshot({path:path.join(OUT,name+'-figure.png'),style:'body>header,body>.app>nav,.ai-fab,.drawer,.drawer-backdrop,.toast{visibility:hidden!important}'});
    await page.evaluate(()=>startLesson('core_06_01'));
    check('reopening creates exactly one diagram',await page.locator('.paging-figure-v371').count()===1);
    await page.evaluate(()=>startLesson('core_06_03'));
    check('unrelated lesson has no paging diagram',await page.locator('.paging-figure-v371').count()===0);
    check('no page errors or recovery UI',errors.length===0&&await page.locator('#fequestAssetRecoveryV371').count()===0);
    return {name,viewport,checks,metrics:m,errors,pass:checks.every(x=>x.pass)};
  }catch(error){
    try{fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'-failure.png'),fullPage:true});}catch{}
    return {name,viewport,checks,metrics:m,errors,error:error.stack||String(error),pass:false};
  }finally{await context.close();await browser.close();}
}
async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const app=server();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  globalThis.__BASE__='http://127.0.0.1:'+app.address().port+'/';
  let cases;
  try{
    cases=[
      await runCase(chromium,'desktop-chromium-1366',{width:1366,height:900}),
      await runCase(webkit,'mobile-webkit-402',{width:402,height:874},true),
      await runCase(webkit,'mobile-webkit-390',{width:390,height:844},true),
      await runCase(webkit,'narrow-webkit-320',{width:320,height:720},true)
    ];
  }finally{await new Promise(resolve=>app.close(resolve));}
  const report={name:'v371-paging-diagram',cases,result:cases.every(c=>c.pass)?'PASS':'FAIL'};
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
  if(report.result!=='PASS')process.exitCode=1;
}
main().catch(error=>{console.error(error);process.exitCode=1;});
