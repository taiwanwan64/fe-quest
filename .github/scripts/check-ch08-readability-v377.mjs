import assert from 'node:assert/strict';
import fs from 'node:fs';
const css = fs.readFileSync('assets/ch8-depth-v389.css', 'utf8');
for (const selector of ['.ch8-helper-v389', '.ch8-note-v389', '.gui-compare-v389 span', '.usability-3-v389 span', '.eval-methods-v389 span', '.input-checks-v389 span', '.assist-functions-v389 span', '.design-scope-v389 span', '.image-tech-v389 span']) {
  const rule = css.slice(css.indexOf(selector)).split('}')[0];
  assert.ok(rule.includes('font-size:18px') && rule.includes('line-height:1.65'), selector);
}
assert.ok(css.includes('#lesson:has(.ch8-depth-v389) table td{font-size:18px'));
assert.match(css, /ch8-depth-v389 code\{[^}]*font-size:18px;[^}]*overflow-wrap:anywhere/);
assert.match(css, /ch8-depth-v389 small\{[^}]*font-size:16px/);
assert.match(css, /clip-output-v377\{[^}]*overflow:hidden/);
// Preserve the crop's coordinates: the original ellipse is translated by the window origin.
const coordinates = (selector) => {
  const rule = css.slice(css.indexOf(selector+'{')).split('}')[0];
  return ['left','top'].map(prop => Number(rule.match(new RegExp(prop+':(-?\\d+)px'))[1]));
};
const shape = coordinates('#lesson .clip-shape-v389');
const window = coordinates('#lesson .clip-window-v389');
const crop = coordinates('#lesson .clip-output-v377 .clip-shape-v389');
assert.deepEqual(crop, shape.map((v,i) => v-window[i]));
assert.ok(css.includes('grid-template-columns:repeat(6,22px)'));
assert.match(css, /aa-ink-v377\{background:#17364b/);
assert.match(css, /aa-mid-v377\{background:#99abb5/);
assert.doesNotMatch(css, /image-rendering:pixelated/);
assert.ok(css.includes('@media(max-width:480px)'));
console.log('PASS Chapter 8 prose/table typography, crop coordinates and explicit pixel colors (not live mobile evidence)');
