import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('assets/ch6-depth-v387.css', 'utf8');
for (const selector of [
  '.ch6-helper-v387', '.ch6-card-v387>p', '.ch6-note-v387',
  '.os-functions-v387 span', '.scheduler-grid-v387 span',
  '.backup-purpose-v387 span', '.compiler-stages-v387 span',
  '.software-license-v387 span'
]) {
  const escaped = selector.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
  assert.match(css, new RegExp(escaped + '\\{[^}]*font-size:18px;line-height:1\\.(6|65)'));
}
assert.match(css, /ch6-depth-v387 code\{[^}]*font-size:18px;[^}]*overflow-wrap:anywhere/);
assert.ok(css.includes('#lesson:has(.ch6-depth-v387) table th'), 'include protected extension tables without the responsive class');
assert.ok(css.includes('#lesson:has(.ch6-content-v377) table td{font-size:18px'));
assert.match(css, /directory-tree-v377 ul\{[^}]*border-left:2px solid/);
assert.match(css, /directory-tree-v377 li\{[^}]*min-width:0;[^}]*overflow-wrap:anywhere/);
assert.match(css, /directory-tree-v377 li>code\{[^}]*max-width:100%;box-sizing:border-box/);
assert.ok(css.includes('@media(max-width:480px)'));
console.log('PASS Chapter 6 prose/table typography and semantic-tree CSS contracts (not live mobile evidence)');
