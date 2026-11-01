import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {prepareSearchDiscovery, SEARCH_ORIGIN, SEARCH_PAGES} from './prepare-search-discovery-v1.mjs';

const sourceRobots = fs.readFileSync('robots.txt','utf8');
assert.equal(sourceRobots,'User-agent: *\nDisallow: /\n','legacy Pages remains excluded');
const site = fs.mkdtempSync(path.join(os.tmpdir(),'fequest-search-'));
try {
  const pages = [...SEARCH_PAGES.map(page=>page.file),'index.html','billing-return.html','billing-sandbox.html','contact.html','commerce.html','beta.html'];
  const original = new Map();
  for (const file of pages) {
    const html = fs.readFileSync(file,'utf8');
    original.set(file,html);
    fs.writeFileSync(path.join(site,file),html);
  }
  const security = '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: DENY\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: no-cache\n';
  fs.writeFileSync(path.join(site,'_headers'),security);
  prepareSearchDiscovery(site);
  const robots = fs.readFileSync(path.join(site,'robots.txt'),'utf8');
  assert.ok(!robots.includes('Disallow: /'));
  assert.ok(robots.includes(`Sitemap: ${SEARCH_ORIGIN}/sitemap.xml`));
  const sitemap = fs.readFileSync(path.join(site,'sitemap.xml'),'utf8');
  assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]),SEARCH_PAGES.map(page=>SEARCH_ORIGIN+page.route));
  assert.ok(!/<lastmod>|github\.io|localhost|billing-return|billing-sandbox/.test(sitemap));
  const headers = fs.readFileSync(path.join(site,'_headers'),'utf8');
  assert.ok(headers.startsWith(security));
  const rules = new Map(); let route;
  for (const line of headers.split('\n')) {
    if (line.startsWith('/')) {route=line;rules.set(route,[]);}
    else if (/^\s+\S/.test(line)) rules.get(route).push(line.trim());
  }
  assert.ok(!rules.get('/*').some(line=>/noindex/.test(line)),'global noindex would override public pages');
  for (const page of SEARCH_PAGES) {
    const html = fs.readFileSync(path.join(site,page.file),'utf8');
    assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
    assert.ok(html.includes(`href="${SEARCH_ORIGIN}${page.route}"`));
    assert.ok(html.includes(`content="${page.description}"`));
    assert.equal(html.slice(html.indexOf('<body')),original.get(page.file).slice(original.get(page.file).indexOf('<body')),'body preserved');
    for (const route of [page.route,'/'+page.file]) assert.ok(!rules.has(route),'indexable route must not inherit noindex');
  }
  assert.ok(!fs.readFileSync(path.join(site,'start.html'),'utf8').includes('現在は無料で利用できます'));
  for (const file of pages.filter(file=>!SEARCH_PAGES.some(page=>page.file===file))) {
    assert.equal(fs.readFileSync(path.join(site,file),'utf8'),original.get(file),'app/return body and auth untouched');
    for (const route of ['/'+file,'/'+file.slice(0,-5)]) assert.deepEqual(rules.get(route),['X-Robots-Tag: noindex']);
  }
  assert.deepEqual(rules.get('/'),['X-Robots-Tag: noindex']);
  const outputs = ['robots.txt','sitemap.xml','_headers',...SEARCH_PAGES.map(page=>page.file)];
  const first = outputs.map(file=>fs.readFileSync(path.join(site,file),'utf8'));
  prepareSearchDiscovery(site);
  assert.deepEqual(outputs.map(file=>fs.readFileSync(path.join(site,file),'utf8')),first,'idempotent preparation');
  assert.equal(fs.readFileSync('robots.txt','utf8'),sourceRobots,'source unchanged');
  console.log('PASS search discovery: 3 canonical pages, exact sitemap, crawlable resources, noindex route aliases, unchanged content/auth/security and idempotence');
} finally {fs.rmSync(site,{recursive:true,force:true});}
