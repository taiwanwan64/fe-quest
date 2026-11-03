import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export const SEARCH_ORIGIN = 'https://fe-quest.pages.dev';
export const SEARCH_VERIFICATION_TAG = '<meta name="google-site-verification" content="Uyq8mpI7Il4ZqJDmVBfz-iDk8mCrgcbuFA9LNt2J2x0" />';
export const SEARCH_PAGES = [
  {file:'start.html', route:'/start', title:'FE QUEST｜学習内容を自動提案する基本情報技術者試験アプリ', description:'基本情報技術者試験の学習アプリFE QUEST。使える時間に合わせて課題を作成し、苦手や進捗に応じた教材・問題を提案。正誤に合わせて復習時期も自動調整します。無料6教材・41問は登録・クレジットカード不要。'},
  {file:'help.html', route:'/help', title:'使い方｜FE QUEST', description:'FE QUESTの始め方、確認コードでのログイン、ホーム画面への追加、クラウド同期とバックアップの方法。'},
  {file:'plans.html', route:'/plans', title:'利用プラン｜FE QUEST', description:'FE QUESTの無料6教材・41問と全範囲プランのご案内。全130教材・1,193問を2,980円・180日間の1回払いで利用できます。自動更新はありません。'},
];

// Cloudflare package only. GitHub Pages keeps its existing crawl prohibition.
export function prepareSearchDiscovery(site) {
  for (const page of SEARCH_PAGES) {
    const file = path.join(site,page.file);
    let html = fs.readFileSync(file,'utf8');
    assert.equal((html.match(/<head>/gi)||[]).length,1,'one head: '+page.file);
    assert.equal((html.match(/<title>[\s\S]*?<\/title>/gi)||[]).length,1,'one title: '+page.file);
    assert.ok(!/<meta\b[^>]*name=["']robots["'][^>]*noindex/i.test(html),'indexable landing page: '+page.file);
    html = html.replace(/<title>[\s\S]*?<\/title>/i,`<title>${page.title}</title>`)
      .replace(/<meta\b[^>]*\bname=["']description["'][^>]*>\s*/gi,'')
      .replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>\s*/gi,'')
      .replace(/\s*<\/head>/i,`\n  <meta name="description" content="${page.description}">\n  <link rel="canonical" href="${SEARCH_ORIGIN}${page.route}">\n</head>`);
    fs.writeFileSync(file,html);
  }
  // User-provided ownership tag belongs to the primary site's homepage.
  // Preserve other owners' tags and never change the application body.
  const indexPath = path.join(site,'index.html');
  let index = fs.readFileSync(indexPath,'utf8');
  assert.equal((index.match(/<\/head>/gi)||[]).length,1,'one homepage head');
  const retiredTag = '<meta name="google-site-verification" content="7aavktEQQlN6WkLDgBnGYYgxaGcSAQNUEI4EC1Ew-ps" />';
  index = index.replaceAll(retiredTag,SEARCH_VERIFICATION_TAG);
  if (!index.includes(SEARCH_VERIFICATION_TAG)) {
    index = index.replace(/<\/head>/i,`  ${SEARCH_VERIFICATION_TAG}\n</head>`);
  }
  assert.equal(index.split(SEARCH_VERIFICATION_TAG).length,2,'one current ownership tag');
  fs.writeFileSync(indexPath,index);
  fs.writeFileSync(path.join(site,'robots.txt'),`User-agent: *\nAllow: /\n\nSitemap: ${SEARCH_ORIGIN}/sitemap.xml\n`);
  fs.writeFileSync(path.join(site,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+SEARCH_PAGES.map(page=>`  <url><loc>${SEARCH_ORIGIN}${page.route}</loc></url>`).join('\n')+'\n</urlset>\n');
  // Keep app/account/return/legal pages out of search without blocking crawlers
  // from reading their noindex response. These headers are not access controls.
  const paths = new Set(['/','/assets/*','/cloud/*','/vendor/*']);
  const indexable = new Set(SEARCH_PAGES.map(page=>page.file));
  for (const file of fs.readdirSync(site).filter(file=>file.endsWith('.html')&&!indexable.has(file))) {
    paths.add('/'+file);
    paths.add('/'+file.slice(0,-5));
  }
  const headerFile = path.join(site,'_headers');
  const marker = '# FE QUEST search discovery v1';
  const base = fs.readFileSync(headerFile,'utf8').split(marker)[0].trimEnd();
  fs.writeFileSync(headerFile,base+'\n\n'+marker+'\n'+[...paths].sort().map(route=>`${route}\n  X-Robots-Tag: noindex`).join('\n')+'\n');
}
