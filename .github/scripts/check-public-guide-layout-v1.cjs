'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

// Offline layout review of public guide HTML with the repository's actual CSS.
// Application scripts, accounts, protected content and external requests are excluded.
const output = path.resolve(process.env.GUIDE_QA_OUTPUT || 'guide-layout-output');
fs.mkdirSync(output, { recursive: true });
const source = fs.readFileSync('index.html', 'utf8');
const digest = s => crypto.createHash('sha256').update(s).digest('hex');
const selectors = [
  '.b-grammar-v404', '.b-array-v405', '.b-matrix-v406', '.b-eliminate-v407',
  '.b-recursion-v408', '.b-tree-v409', '.b-oop-v410', '.b-list-v411',
  '.b-sq-v412', '.b-bit-v413', '.b-review-v414', '.sec-foundations-v415',
  '.sec-practice-v416', '.subject-b-strategy-v403', '.b-strategy-mini-v403',
  '.bbook2-intro-v417', '.bbook2-prediction1-v418', '.bbook2-prediction2-v419'
];
const cssPaths = [...source.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="\.\/([^"?]+)(?:\?[^"]*)?"[^>]*>/g)].map(m => m[1]);
const css = cssPaths.map(p => fs.readFileSync(p, 'utf8')).join('\n');
assert.ok(!/@import\b/i.test(css), 'CSS dependencies must remain local');
const staticSource = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<link\b[^>]*>/gi, '').replace(/<img\b[^>]*>/gi, '');
const failures = [], runs = [], network = [], errors = [];
let browser;
async function main() {
  browser = await chromium.launch({ headless: true });
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
    await context.route('**/*', async route => { network.push(route.request().url()); await route.abort(); });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    await page.setContent(staticSource, { waitUntil: 'load' });
    const guides = await page.evaluate(list => [...document.querySelectorAll(list.map(s => 'details'+s).join(','))].map((el, i) => ({
      key: `guide-${String(i + 1).padStart(2,'0')}`,
      owner: el.parentElement.closest('[id]')?.id || '',
      className: el.className,
      summary: el.querySelector('summary').textContent.trim(),
      html: el.outerHTML
    })), selectors);
    assert.equal(guides.length, 20, '20 top-level guides, including two strategy and two training guides');
    const fixture = '<!doctype html><html lang="ja"><head><meta charset="utf-8"><style>'+css+
      '\nbody{margin:0;background:#fff}main{max-width:1120px;margin:auto;padding:16px}main>div{display:block!important}</style></head><body><main>'+guides.map(g =>
      '<div id="'+g.owner+'" data-review="'+g.key+'">'+g.html+'</div>').join('')+'</main></body></html>';
    await page.setContent(fixture, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const checks = [];
    for (const guide of guides) {
      const area = page.locator('[data-review="'+guide.key+'"]');
      const mainDetails = area.locator('details').first();
      assert.equal(await mainDetails.evaluate(el => el.open), false, 'guide defaults collapsed');
      const summary = mainDetails.locator(':scope > summary');
      await summary.focus(); await summary.press('Enter');
      assert.ok(await mainDetails.evaluate(el => el.open), 'Enter opens guide');
      await summary.press('Space');
      assert.ok(await mainDetails.evaluate(el => !el.open), 'Space closes guide');
      await summary.click();
      const nested = mainDetails.locator('details');
      for (let i=0;i<await nested.count();i++) await nested.nth(i).evaluate(el => { el.open=true; });
      const metrics = await area.evaluate(el => {
        const rect=el.getBoundingClientRect();
        const tables=[...el.querySelectorAll('table')].map(t => {
          const wrap=t.parentElement;
          const initial=wrap.scrollLeft; wrap.scrollLeft=wrap.scrollWidth;
          const reachable=wrap.scrollWidth<=wrap.clientWidth+1 || wrap.scrollLeft>=wrap.scrollWidth-wrap.clientWidth-1;
          wrap.scrollLeft=initial;
          return {cols:t.rows[0]?.cells.length,rows:t.rows.length,wrapperWidth:wrap.clientWidth,
            scrollWidth:wrap.scrollWidth,overflowX:getComputedStyle(wrap).overflowX,reachable,
            minCellWidth:Math.min(...[...t.querySelectorAll('td,th')].map(c => c.getBoundingClientRect().width)),
            maxRowHeight:Math.max(...[...t.rows].map(r => r.getBoundingClientRect().height))};
        });
        return {left:rect.left,right:rect.right,viewport:innerWidth,
          documentWidth:document.documentElement.scrollWidth,tables,
          textSize:Math.min(...[...el.querySelectorAll('p,td,th,pre')].map(n=>parseFloat(getComputedStyle(n).fontSize)))};
      });
      if(metrics.left < -1 || metrics.right>width+1 || metrics.documentWidth>width+1) failures.push({width,guide:guide.key,kind:'horizontal-overflow',metrics});
      for(const table of metrics.tables) if(!table.reachable || (table.scrollWidth>table.wrapperWidth+1 && !['auto','scroll'].includes(table.overflowX))) failures.push({width,guide:guide.key,kind:'table-scroll',table});
      if(width!==320) await area.screenshot({path:path.join(output,`${guide.key}-${width}.png`)});
      checks.push({...guide,html:undefined,metrics});
    }
    runs.push({width,guides:checks});
    await context.close();
  }
  if(network.length || errors.length) failures.push({kind:'unexpected-browser-activity',network,errors});
  const report={sourceIndexSha256:digest(source),css:cssPaths.map(p=>({path:p,sha256:digest(fs.readFileSync(p))})),
    browser:browser.version(),widths:[320,390,1280],topLevelGuides:20,applicationScriptsExecuted:false,
    networkRequests:network,pageErrors:errors,failures,runs,humanVisualInspection:'pending',
    scope:'Offline public guide layout; does not establish authenticated app behavior or real iPhone/PWA behavior.'};
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  assert.equal(failures.length,0,JSON.stringify(failures));
  console.log('PASS: 20 guides at 320/390/1280px; keyboard disclosure, table scroll and document width; no application scripts or network.');
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();});
