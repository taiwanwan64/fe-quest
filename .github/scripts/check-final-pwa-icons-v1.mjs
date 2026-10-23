import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(read('.github/pwa-icons-v1/manifest.json'));
assert.equal(manifest.version,'fequest-pwa-icons-v1-20261019');
assert.equal(sha(read('.github/pwa-icons-v1/'+manifest.source)),manifest.sourceSha256);
const web=JSON.parse(read('manifest.webmanifest'));
const sw=read('sw.js').toString(),html=read('index.html').toString();
for(const icon of manifest.icons){
 const b=read(icon.path);
 assert.equal(sha(b),icon.sha256,icon.path+' byte drift');
 assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(b.subarray(12,16).toString(),'IHDR');
 assert.equal(b.readUInt32BE(16),icon.width);
 assert.equal(b.readUInt32BE(20),icon.height);
 assert(sw.includes('"./'+icon.path+'"'),icon.path+' missing from offline shell');
 if(icon.width!==180){
  const item=web.icons.find(x=>x.src==='./'+icon.path);
  assert(item,icon.path+' missing manifest');
  assert.equal(item.sizes,icon.width+'x'+icon.height);
  assert.equal(item.type,'image/png');
  assert(item.purpose.split(/\s+/).includes('maskable'));
 }else assert(html.includes('apple-touch-icon.png'),'Apple icon missing HTML');
}
assert(sw.includes("const CACHE_NAME = 'fe-quest-v377-211';"),'final icon cache revision');
console.log('PASS final PWA icons: original SVG provenance, 3 exact PNGs, dimensions, manifest, HTML and offline cache');
