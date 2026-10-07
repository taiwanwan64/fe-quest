import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
const app=fs.readFileSync('assets/app-v377.js','utf8');
function declaration(name){const start=app.indexOf('const '+name+'=');assert.ok(start>=0,name);const end=app.indexOf(';\n',start);return app.slice(start,end+1);}
function fn(name){const start=app.indexOf('function '+name+'(');assert.ok(start>=0,name);let depth=0;for(let i=app.indexOf('{',start);i<app.length;i++){if(app[i]==='{')depth++;else if(app[i]==='}'&&--depth===0)return app.slice(start,i+1);}throw Error(name);}
const ctx={};vm.createContext(ctx);
vm.runInContext(['LEARNING_ENGLISH_GLOSSES_JA_V377','FEQUEST_LEARNING_PHRASE_OVERRIDES_V377'].map(declaration).join('\n')+'\n'+['fequestEscapeRegExpV377','fequestLocalizeLearningEnglishTextV377'].map(fn).join('\n')+'\nthis.localize=fequestLocalizeLearningEnglishTextV377;',ctx);
for(const text of ['ID（Identifier／利用者の識別子）','IETF（Internet Engineering Task Force／インターネット技術の標準化組織）','NDA（Non-Disclosure Agreement、秘密保持契約）','W3C（World Wide Web Consortium／Web標準化団体）'])assert.equal(ctx.localize(text),text);
assert.equal(ctx.localize('ID（Identifier）'),'ID（Identifier／識別子）');
assert.equal(ctx.localize('Local Government Wide Area Network'),'Local Government Wide Area Network／総合行政ネットワーク');
assert.ok(!ctx.localize('Artificial Intelligence for IT Operations').includes('Artificial Intelligence／'));
assert.equal(ctx.localize(ctx.localize('ID（Identifier）')),'ID（Identifier／識別子）');
console.log('PASS explicit Japanese gloss retained, absent gloss supplied, longer names intact, idempotent');
