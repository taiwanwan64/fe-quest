import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const code=fs.readFileSync('sw.js','utf8');
for(const scope of ['https://taiwanwan64.github.io/fe-quest/','https://confirmed-release.example/']){
  const store=new Map();const callbacks=new Map();let offline=false;
  const key=request=>typeof request==='string'?request:request.url;
  const context={URL,Response,Request,setTimeout:()=>0,self:{registration:{scope},location:{origin:new URL(scope).origin},addEventListener:(name,cb)=>callbacks.set(name,cb)},caches:{open:async()=>({put:async(req,res)=>store.set(key(req),res)}),match:async req=>store.get(key(req))?.clone()},fetch:async req=>{if(offline)throw Error('synthetic offline');return new Response('HTML for '+req.url);}};
  vm.runInNewContext(code,context);
  async function navigate(relative){const request={url:new URL(relative,scope).href,method:'GET',mode:'navigate',headers:{has:()=>false}};let result;callbacks.get('fetch')({request,respondWith:value=>{result=value;}});return await result;}
  const app=await navigate('./');assert.ok(app.ok);const appHtml=await store.get('./index.html').clone().text();
  for(const page of ['start.html','help.html','terms.html','privacy.html','feedback.html?stage=bug']){
    await navigate(page);
    assert.equal(await store.get('./index.html').clone().text(),appHtml,'informational navigation must not poison app shell');
  }
  offline=true;
  assert.equal(await (await navigate('./?resume=1')).text(),appHtml,'offline root keeps app');
  assert.equal(await (await navigate('index.html')).text(),appHtml,'offline index keeps app');
  const help=await navigate('help.html');assert.ok((await help.text()).includes('help.html'),'offline known page uses its own HTML');
  const missing=await navigate('never-cached.html');assert.equal(missing.type,'error','missing information page does not return app HTML');
  console.log('PASS isolated navigation cache '+scope);
}
