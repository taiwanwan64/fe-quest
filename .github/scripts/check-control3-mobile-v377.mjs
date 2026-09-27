import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('assets/app-v377.js','utf8');
const start=source.indexOf('function fequestRefineControl3DiagramV377(');
const end=source.indexOf('function fequestLearningDetailVariantsV377(',start);
assert.ok(start>0&&end>start);
const ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(start,end)+'\nthis.refine=fequestRefineControl3DiagramV377;',ctx);

function diagram(texts){
  const codes=texts.map(text=>({textContent:text,outerHTML:'<code>original</code>'}));
  const root={querySelectorAll:()=>codes.map(code=>({querySelector:()=>code}))};
  ctx.refine(root);
  return codes.map(code=>code.outerHTML);
}
const [sequence,choice,repeat]=diagram(['Aをする↓Bをする','条件?↙ Yes　No ↘A　　 B','条件を確認↓処理 → 条件へ戻る']);
assert.match(sequence,/Aをする.*Bをする/);
assert.match(choice,/control3-branches-v377/);
assert.match(choice,/<b>Yes<\/b>.*Aをする.*<b>No<\/b>.*Bをする/);
assert.match(repeat,/処理する.*条件へ戻る/);
assert.ok(!choice.includes('↙ Yes　No ↘'));
assert.deepEqual(diagram(['別の図','条件? Yes No','条件へ戻る']),Array(3).fill('<code>original</code>'));
console.log('PASS Chapter 3 control structure cards: explicit Yes/No branches and guarded update');
