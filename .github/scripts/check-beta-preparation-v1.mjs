import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
const require=createRequire(import.meta.url);
const {stages,validStage,buildAnswer,sensitive,issueUrl}=require('../../assets/beta-feedback-v1.js');
const root=process.cwd();
assert.equal(validStage('d7'),'d7');
for(const invalid of ['toString','__proto__','invalid',null])assert.equal(validStage(invalid),'d1');
for(const [stage,spec] of Object.entries(stages)){
  const answers=Object.fromEntries(spec.fields.map(field=>[field.id,field.options?field.options.at(-1):'合成テスト回答']));
  answers.tester='B01';
  const body=buildAnswer(stage,answers);
  assert.ok(body.includes(spec.title));assert.ok(body.includes('管理番号：B01'));
  for(const field of spec.fields)assert.ok(body.includes(answers[field.id]));
  const url=new URL(issueUrl(stage,body));
  assert.equal(url.origin,'https://github.com');assert.equal(url.pathname,'/taiwanwan64/fe-quest/issues/new');assert.equal(url.searchParams.get('body'),body);
  assert.ok(url.href.length<7500,'ordinary answers fit GitHub URL');
}
assert.ok(!buildAnswer('d1',{}).includes('管理番号'));
assert.equal(sensitive('文章が分かりにくかったです。'),false);
assert.equal(sensitive('tester@example.com'),true);
assert.equal(sensitive('access_token=synthetic'),true);
assert.equal(sensitive('-----BEGIN PRIVATE KEY-----'),true);
assert.ok(buildAnswer('price',{}).includes('購入予約・契約ではありません'));
assert.ok(!buildAnswer('d7',{}).includes('480円'));
for(const file of ['beta.html','feedback.html','assets/beta-preparation-v1.css','assets/beta-feedback-v1.js']){
  const content=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(!/localStorage|sessionStorage|fetch\(|sendBeacon|XMLHttpRequest|supabase|gtag\(/.test(content),'new pages do not silently store/collect data');
}
const beta=fs.readFileSync(path.join(root,'beta.html'),'utf8');
assert.ok(beta.includes('謝礼のない任意の無料テスト'));
assert.ok(beta.includes('表示例です'));
for(const stage of ['d1','d3','d7'])assert.ok(beta.includes('feedback.html?stage='+stage));
const feedback=fs.readFileSync(path.join(root,'feedback.html'),'utf8');
assert.ok(feedback.includes('GitHub投稿にはアカウントが必要'));
assert.ok(feedback.includes('回答は送信されません'));
console.log('PASS questionnaire, GitHub roundtrip, price separation, no tracking or server writes');
if(!process.argv.includes('--browser'))process.exit(0);
const {chromium,webkit}=await import('playwright');
const mime={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.js':'application/javascript;charset=utf-8'};
const server=createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const relative=url.pathname.slice(1)||'beta.html';
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
try{
  for(const [engine,width] of [[chromium,1280],[webkit,390],[webkit,320]]){
    const browser=await engine.launch({headless:true});
    try{
      const context=await browser.newContext({viewport:{width,height:850}});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(base+'/beta.html');
      assert.equal(await page.locator('a.primary').first().getAttribute('href'),'./');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.goto(base+'/feedback.html?stage=d7');
      assert.ok((await page.locator('#stageTitle').textContent()).includes('7日目'));
      assert.equal(await page.locator('#review').isVisible(),false);
      await page.locator('#feedbackForm button[type=submit]').click();
      assert.equal(await page.locator('#review').isVisible(),false,'required choices block preview');
      for(const stage of ['d1','d3','d7','bug','price']){
        await page.locator('.stage-nav [data-stage='+stage+']').click();
        for(const field of stages[stage].fields){
          if(field.options)await page.locator('#answer-'+field.id).selectOption(field.options.at(-1));
          else await page.locator('#answer-'+field.id).fill('合成テスト回答');
        }
        await page.locator('#feedbackForm button[type=submit]').click();
        assert.equal(await page.locator('#review').isVisible(),true);
        const body=await page.locator('#answerPreview').inputValue();
        assert.ok(body.includes(stages[stage].title));
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.evaluate(()=>{window.testOpened=[];window.open=(url)=>{window.testOpened.push(url);return null;};});
        await page.locator('#openGithub').click();
        assert.equal(await page.evaluate(()=>window.testOpened.length),0,'no public posting page without consent');
        await page.locator('#publicConsent').check();
        await page.locator('#openGithub').click();
        const opened=await page.evaluate(()=>window.testOpened);
        assert.equal(opened.length,1);assert.equal(new URL(opened[0]).searchParams.get('body'),body);
        assert.ok((await page.locator('#shareStatus').textContent()).includes('提出済みか確認できません'));
        await page.locator('#answerPreview').fill(body+'\n追記');
        assert.equal(await page.locator('#publicConsent').isChecked(),false,'edit requires new public acknowledgement');
        if(stage==='d7')assert.equal(await page.locator('#priceNext').isVisible(),true);
      }
      await page.locator('.stage-nav [data-stage=d1]').click();
      assert.ok((await page.locator('#answerPreview').inputValue()).includes('追記'),'stage switches retain explicit draft in memory');
      await page.locator('#answerPreview').fill('合成回答の保存テスト');
      const downloaded=page.waitForEvent('download');await page.locator('#saveAnswer').click();
      const download=await downloaded;assert.equal(download.suggestedFilename(),'fequest-feedback-d1.txt');
      assert.ok((await page.locator('#shareStatus').textContent()).includes('まだ運営者には提出されていません'));
      await page.locator('#answerPreview').fill('tester@example.com');
      await page.locator('#publicConsent').check();
      await page.evaluate(()=>window.testOpened=[]);await page.locator('#openGithub').click();
      assert.equal(await page.evaluate(()=>window.testOpened.length),0,'reject accidental email');
      page.on('dialog',dialog=>dialog.accept());
      await page.reload();assert.equal(await page.locator('#review').isVisible(),false,'no saved answers after reload');
      assert.deepEqual(errors,[]);
      console.log('PASS browser journey '+engine.name()+' '+width+'px');
      await context.close();
    }finally{await browser.close();}
  }
}finally{await new Promise(resolve=>server.close(resolve));}
