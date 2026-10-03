import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync('assets/ch7-depth-v388.css', 'utf8');
for (const selector of ['.ch7-helper-v388', '.ch7-card-v388>p', '.ch7-note-v388', '.memory-leaves-v388 span', '.rom-family-v388 span']) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.match(css, new RegExp(escaped + '\\{[^}]*font-size:18px;line-height:1\\.65'));
}
assert.match(css, /ch7-depth-v388 code\{[^}]*font-size:18px;[^}]*overflow-wrap:anywhere/);
assert.ok(css.includes('#lesson:has(.ch7-depth-v388) table th'));
assert.ok(css.includes('#lesson:has(.ch7-depth-v388) table td{font-size:18px'));
assert.match(css, /sevenseg-label-v388\{[^}]*font-size:16px/);
assert.ok(css.includes('@media(max-width:480px)'));
console.log('PASS Chapter 7 prose/table typography and short diagram labels (not live mobile evidence)');
