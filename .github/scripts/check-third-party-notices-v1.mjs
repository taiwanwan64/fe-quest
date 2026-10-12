import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=path.resolve(process.argv[2]||process.cwd());
const manifest=JSON.parse(fs.readFileSync(path.join(root,'vendor/third-party-manifest.json'),'utf8'));
const notice=fs.readFileSync(path.join(root,'THIRD_PARTY_NOTICES.txt'),'utf8').replaceAll('\r\n','\n');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bundles=new Set();
assert.equal(manifest.version,'third-party-notices-v1-20261012');
assert.equal(manifest.packages.length,4);
for(const pkg of manifest.packages){
  assert.ok(notice.includes(pkg.name+' '+pkg.version),'package is listed');
  assert.ok(pkg.licenseFiles.length>0,'license file required');
  for(const file of pkg.licenseFiles){
    assert.ok(file.path.startsWith('vendor/licenses/')&&!file.path.includes('..'));
    const bytes=fs.readFileSync(path.join(root,file.path));
    assert.equal(bytes.length,file.bytes,'notice byte count');
    assert.equal(sha(bytes),file.sha256,'upstream notice is intact');
    assert.ok(notice.includes(bytes.toString().replaceAll('\r\n','\n').trim()),'full notice accompanies distribution');
  }
  if(pkg.bundlePath){
    bundles.add(pkg.bundlePath);
    assert.equal(sha(fs.readFileSync(path.join(root,pkg.bundlePath))),pkg.bundleSha256,'vendored version needs renewed license review');
  }
}
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,ent.name);if(ent.isDirectory())walk(file);else if(/\.js$/.test(ent.name))assert.ok(bundles.has(path.relative(root,file).split(path.sep).join('/')),'unrecorded vendored JavaScript');}}
walk(path.join(root,'vendor'));
console.log('PASS third-party notices: pinned SDK, four packages, five preserved notices');
