const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,webkit}=require('playwright');

const ROOT=path.resolve(__dirname,'../..');
const OUT=path.join(ROOT,'_browser_evidence/v364');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png'};

function server(){
  return http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://127.0.0.1').pathname;
    const relative=pathname==='/'||pathname==='/index.html'?'app/base-shell-v364.html':decodeURIComponent(pathname).replace(/^\/+/, '');
    const target=path.resolve(ROOT,relative);
    if(!target.startsWith(ROOT+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){
      res.writeHead(404,{'content-type':'text/plain'});res.end('not found');return;
    }
    const body=fs.readFileSync(target);
    res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream','content-length':body.length,'cache-control':'no-store'});res.end(body);
  });
}

async function waitForStable(page,expectGate=true){
  const deadline=Date.now()+45000;
  for(let attempt=0;attempt<8;attempt++){
    const remaining=Math.max(1000,deadline-Date.now());
    await page.waitForLoadState('load',{timeout:remaining});
    await page.waitForFunction(()=>window.FEQUEST_APP_BOOT_COMPLETE===true&&window.__FEQ_PAGESHOW_SEEN===true,null,{timeout:remaining});
    await page.waitForFunction(()=>navigator.serviceWorker.controller?.state==='activated',null,{timeout:remaining});
    const origin=await page.evaluate(()=>performance.timeOrigin);
    await page.waitForTimeout(750);
    const stable=await page.evaluate(origin=>performance.timeOrigin===origin&&window.FEQUEST_APP_BOOT_COMPLETE===true&&navigator.serviceWorker.controller?.state==='activated',origin);
    if(stable){if(expectGate)await page.waitForSelector('#firstRunGuidedV364');return;}
    if(Date.now()>=deadline)break;
  }
  throw new Error('stable boot boundary not reached');
}

async function runCase(browserType,name,viewport,isMobile=false){
  const browser=await browserType.launch();
  const context=await browser.newContext({viewport,locale:'ja-JP',isMobile,hasTouch:isMobile,deviceScaleFactor:isMobile?2:1});
  const page=await context.newPage();
  await page.addInitScript(()=>{window.__FEQ_PAGESHOW_SEEN=false;addEventListener('pageshow',()=>{window.__FEQ_PAGESHOW_SEEN=true},{once:true});});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const checks=[];
  function check(label,value){checks.push({label,pass:Boolean(value)});if(!value)throw new Error(label)}
  try{
    await page.goto(globalThis.__BASE_URL__,{waitUntil:'load',timeout:60000});
    await waitForStable(page);
    check('v364 runtime',await page.evaluate(()=>APP_VERSION==='v364'));
    check('account is first',await page.locator('#firstRunGuidedV364[data-stage="account"]').isVisible());
    check('account can be skipped',await page.locator('#firstRunAccountSkipV364').isVisible());
    check('email login is offered',await page.locator('#firstRunEmailV364').isVisible());
    check('home plan hidden before onboarding',!(await page.locator('#todayPlan').isVisible()));
    check('navigation hidden before diagnostic',await page.locator('.sidebar').evaluate(node=>getComputedStyle(node).display==='none'));
    await page.locator('#firstRunGuidedV364').screenshot({path:path.join(OUT,`${name}-1-account.png`)});

    await page.locator('#firstRunAccountSkipV364').click();
    await page.waitForSelector('#firstRunGuidedV364[data-stage="settings"]');
    check('settings are isolated from diagnostic',await page.locator('#firstRunSettingsContinueV364').isVisible()&&!(await page.locator('#diagBanner').isVisible()));
    check('three-step sequence stays explicit',(await page.locator('#firstRunGuidedV364 .v364-step').textContent()).includes('2 / 3'));
    await page.locator('#firstRunGuidedV364').screenshot({path:path.join(OUT,`${name}-2-settings.png`)});

    const future=new Date();future.setDate(future.getDate()+90);
    const date=`${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')}`;
    await page.locator('#firstRunExamDateV364').fill(date);
    await page.locator('.v364-minute[data-minutes="45"]').click();
    await page.locator('#firstRunSettingsContinueV364').click();
    await page.waitForSelector('#diagnostic.active #diagIntro',{state:'visible'});
    check('diagnostic is the final onboarding step',(await page.locator('.v364-diagnostic-step').textContent()).includes('3 / 3'));
    check('navigation stays hidden during diagnostic',await page.locator('.sidebar').evaluate(node=>getComputedStyle(node).display==='none'));
    check('diagnostic back is unavailable',await page.locator('#diagnostic .screen-head .back').evaluate(node=>getComputedStyle(node).display==='none'));
    await page.locator('#diagnostic').screenshot({path:path.join(OUT,`${name}-3-diagnostic.png`)});

    await page.locator('#diagBegin').click();
    for(let i=0;i<12;i++){
      await page.locator('#diagOptions button').first().click();
      await page.locator('#diagNext').click();
    }
    await page.waitForSelector('#diagResult',{state:'visible'});
    check('result returns to home',(await page.locator('#diagFinish').textContent()).trim()==='ホーム画面へ →');
    check('result does not auto-launch practice',await page.locator('#diagnostic.active').isVisible());
    check('navigation remains locked until result acknowledged',await page.locator('.sidebar').evaluate(node=>getComputedStyle(node).display==='none'));

    await page.locator('#diagFinish').click();
    await page.waitForSelector('#home.active #todayPlan',{state:'visible'});
    check('home is first destination after result',await page.locator('#home.active').isVisible());
    check('navigation unlocks on home',await page.locator('.sidebar').evaluate(node=>getComputedStyle(node).display!=='none'));
    check('diagnostic and settings no longer compete on home',!(await page.locator('#diagBanner').isVisible())&&await page.locator('#firstRunGuidedV364').count()===0);
    const daily=await page.locator('#dailyTaskList').innerText();
    check('review wording explains the empty due queue',daily.includes('期限を迎えた復習問題はありません。')&&!daily.includes('今日の復習期限はなし'));
    check('saved settings survive the guided route',await page.evaluate(date=>profile.settings.examDate===date&&profile.settings.studyMinutes===45,date));
    check('daily plan is not started automatically',await page.locator('#home.active').isVisible()&&!(await page.locator('#quiz.active').isVisible()));
    await page.locator('#todayPlan').screenshot({path:path.join(OUT,`${name}-4-home.png`)});

    await page.locator('.nav-btn[data-screen="problems"]').click();
    check('exercise helper copy is natural',(await page.locator('#problems>div.sub').first().textContent()).trim()==='まず今やる1つを表示します。目的を変えたいときは、ほかの演習も選べます。');
    await page.evaluate(()=>showScreen('home',{instant:true}));
    await page.reload({waitUntil:'load'});
    await waitForStable(page,false);
    check('completed learner is not gated again',await page.locator('#firstRunGuidedV364').count()===0&&await page.locator('.sidebar').evaluate(node=>getComputedStyle(node).display!=='none'));
    check('no uncaught page errors or recovery UI',errors.length===0&&await page.locator('#fequestAssetRecoveryV364').count()===0);
    return {name,checks,errors,pass:true};
  }catch(error){
    try{await page.screenshot({path:path.join(OUT,`${name}-failure.png`),fullPage:true})}catch(_e){}
    return {name,checks,errors,error:error.stack||String(error),pass:false};
  }finally{
    await context.close();await browser.close();
  }
}

async function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const app=server();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  globalThis.__BASE_URL__=`http://127.0.0.1:${app.address().port}/`;
  let cases;
  try{
    cases=[
      await runCase(chromium,'desktop-chromium-1366',{width:1366,height:900}),
      await runCase(chromium,'tablet-chromium-1024',{width:1024,height:768}),
      await runCase(webkit,'mobile-webkit-390',{width:390,height:844},true),
      await runCase(webkit,'narrow-webkit-320',{width:320,height:720},true),
    ];
  }finally{await new Promise(resolve=>app.close(resolve));}
  const result={name:'v364-guided-first-run',cases,result:cases.every(item=>item.pass)?'PASS':'FAIL'};
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
  if(result.result!=='PASS')process.exitCode=1;
}

main().catch(error=>{console.error(error);process.exitCode=1});
