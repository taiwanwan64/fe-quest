import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('assets/app-v377.js','utf8');
const functionSource=name=>{
  const start=source.indexOf(`function ${name}(`);
  const end=source.indexOf('\n}',start)+2;
  assert.ok(start>=0&&end>start);
  return source.slice(start,end);
};
const context={
  LEARNING_ABBREVIATIONS:{MTBF:'Mean Time Between Failures',MTTR:'Mean Time To Repair',DRAM:'Dynamic Random Access Memory',RAM:'Random Access Memory'},
  LEARNING_ENGLISH_GLOSSES_JA_V377:{'Mean Time Between Failures':'平均故障間隔','Mean Time To Repair':'平均修復時間'},
  LEARNING_ABBREVIATION_AUTO_BLOCKLIST_V377:new Set(),
  escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
};
vm.createContext(context);
for(const name of ['fequestEscapeRegExpV377','fequestLearningDetailVariantsV377','fequestCollapseRepeatedLearningDetailsTextV377','expandLearningAbbreviations','chapterFiveLearningHtmlV377'])vm.runInContext(functionSource(name),context);
for(const formula of ['MTBF/(MTBF+MTTR)','MTBF÷(MTBF＋MTTR)','MTBF ÷ （ MTBF + MTTR ）']){
  assert.equal(context.chapterFiveLearningHtmlV377(formula),`<code class="ch5-inline-formula-v377">${formula}</code>`);
}
const prose=context.chapterFiveLearningHtmlV377('MTBFとMTTR。MTBF/(MTBF+MTTR)。MTBFとMTTR。<img>');
assert.equal((prose.match(/Mean Time Between Failures/g)||[]).length,1);
assert.equal((prose.match(/Mean Time To Repair/g)||[]).length,1);
assert.ok(prose.includes('&lt;img&gt;')&&!prose.includes('<img>'));
assert.equal(context.chapterFiveLearningHtmlV377('DRAM'), 'DRAM（Dynamic Random Access Memory）');
assert.ok(source.includes("Number(ch)===5?chapterFiveLearningHtmlV377(x):coreChapterFormulaHtml(x)"));
assert.equal((source.match(/\^core_05_/g)||[]).length,2,'feedback scoped to Chapter 5');
const css=fs.readFileSync('assets/ch5-depth-v386.css','utf8');
assert.match(css,/web-flow-v386\{flex-direction:column;align-items:stretch;flex-wrap:nowrap\}/);
assert.match(css,/rasis-grid-v386 span\{[^}]*font-size:16px/);
assert.match(css,/ch5-card-v386>p\{font-size:18px/);
assert.match(css,/ch5-helper-v386\{font-size:18px;line-height:1\.65\}/);
assert.match(css,/raid-grid-v386 span\{[^}]*font-size:18px;line-height:1\.6/);
console.log('PASS Chapter 5: intact formulas, once-only definitions, escaping, chapter scope and responsive CSS contracts (not live mobile evidence)');
