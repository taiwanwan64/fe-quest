import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

// Operates only on the sanitized staging directory built by the Pages workflow.
const site=path.resolve(process.argv[2]||'');
assert.ok(process.argv[2]&&site!==process.cwd(),'an isolated staging directory is required');
for(const forbidden of ['.git','.github','supabase','docs','node_modules'])assert.ok(!fs.existsSync(path.join(site,forbidden)),'source-only directory in package: '+forbidden);
for(const file of ['index.html','sw.js','manifest.webmanifest','start.html','help.html','terms.html','privacy.html','feedback.html','contact.html','cloud/public-config-v342.js'])assert.ok(fs.existsSync(path.join(site,file)),'required file: '+file);

const configPath=path.join(site,'cloud/public-config-v342.js');
let config=fs.readFileSync(configPath,'utf8');
const old="redirectTo:'https://taiwanwan64.github.io/fe-quest/'";
assert.equal(config.split(old).length,2,'expected exactly one current auth redirect');
config=config.replace(old,"redirectTo:new URL('./',root.location.href).href");
fs.writeFileSync(configPath,config);
for(const href of ['https://fequest-release.example/','https://fequest-release.example/index.html','https://taiwanwan64.github.io/fe-quest/']){
  const context={URL,location:{href},console:{warn(){}},FEQUEST_PROTECTED_CONTENT:{version:'v376-provider-33-ipa92-v1-v35-bgap1',catalogTotal:1180}};
  vm.runInNewContext(config,context);
  assert.equal(context.FEQUEST_PUBLIC_CLOUD_CONFIG_V342.redirectTo,new URL('./',href).href,'auth stays on deployed site');
}

const privacyPath=path.join(site,'privacy.html');
const privacy=fs.readFileSync(privacyPath,'utf8');
assert.ok(privacy.includes('FE QUESTのWebページはCloudflare Pagesを利用して配信します。'),'privacy must describe the current Cloudflare host');
assert.ok(privacy.includes('従来のGitHub Pagesの公開先も維持しています。'),'privacy must retain the legacy hosting disclosure');
fs.writeFileSync(path.join(site,'_headers'),'/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: no-cache\n');
const files=[];
function walk(dir){for(const name of fs.readdirSync(dir).sort()){const full=path.join(dir,name);const stat=fs.lstatSync(full);assert.ok(!stat.isSymbolicLink(),'symlinks are forbidden');if(stat.isDirectory())walk(full);else{
  assert.ok(stat.size<=25*1024*1024,'Cloudflare per-file limit');
  const relative=path.relative(site,full).split(path.sep).join('/');
  assert.ok(!/\.(sql|ts|pdf|zip|env)$|(^|\/)\.env/.test(relative),'non-public file in package: '+relative);
  const bytes=fs.readFileSync(full);
  if(/\.(js|json|html|css)$/.test(relative))assert.ok(!/SUPABASE_SERVICE_ROLE_KEY|sb_secret_[a-zA-Z0-9_-]+|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(bytes.toString()),'secret marker: '+relative);
  files.push({path:relative,bytes:stat.size,sha256:createHash('sha256').update(bytes).digest('hex')});
}}}
walk(site);
assert.ok(files.length+1<=1000,'Cloudflare dashboard file count limit');
const manifest={version:'commercial-preparation-v1-20261011',sourceCommit:process.env.GITHUB_SHA||'local-validation',billingEnabled:false,deployed:false,requiredBeforeSwitch:['exact new origin must be allowed in both question and lesson Edge Functions','Supabase Auth redirect allow-list must include the exact new app URL','backup old-origin local history and verify restore on new origin','verify protected content, grading, auth, synchronization and PWA on new host'],files};
fs.writeFileSync(path.join(site,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log('PASS commercial package: '+files.length+' files; auth redirect follows deployed origin; no billing enabled');


