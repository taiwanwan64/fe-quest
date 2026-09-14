const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
function read(p){return fs.readFileSync(path.join(ROOT,p),'utf8')}
function write(p,s){const f=path.join(ROOT,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s)}
function one(s,a,b,label){const n=s.split(a).length-1;if(n!==1)throw new Error(`${label}: expected one anchor, got ${n}`);return s.replace(a,b)}

// Provider v24 -> v25. Historical v24 remains immutable; v25 is a new provider.
let p=read('assets/protected-content-provider-v376-v24.js');
p=one(p,"const IPA92_V24_CATALOG_URL=new URL('question-catalog-ipa92-v24.json',SCRIPT_URL).toString();","const IPA92_V24_CATALOG_URL=new URL('question-catalog-ipa92-v24.json',SCRIPT_URL).toString();\nconst IPA92_V25_CATALOG_URL=new URL('question-catalog-ipa92-v25.json',SCRIPT_URL).toString();",'provider catalog url');
p=one(p,"const IPA92_V24_CATALOG_VERSION='ipa92-catalog-v24';","const IPA92_V24_CATALOG_VERSION='ipa92-catalog-v24';\nconst IPA92_V25_CATALOG_VERSION='ipa92-catalog-v25';",'provider catalog version');
p=one(p,"const IPA92_V24_CONTENT_VERSION='ipa92-questions-v24';","const IPA92_V24_CONTENT_VERSION='ipa92-questions-v24';\nconst IPA92_V25_CONTENT_VERSION='ipa92-questions-v25';",'provider content version');
p=one(p,'const IPA92_V24_TOTAL=5;','const IPA92_V24_TOTAL=5;\nconst IPA92_V25_TOTAL=5;','provider total');
p=one(p,'+IPA92_V23_TOTAL+IPA92_V24_TOTAL;','+IPA92_V23_TOTAL+IPA92_V24_TOTAL+IPA92_V25_TOTAL;','provider extension total');
p=one(p,'fetchJson(IPA92_V22_CATALOG_URL),fetchJson(IPA92_V23_CATALOG_URL),fetchJson(IPA92_V24_CATALOG_URL)','fetchJson(IPA92_V22_CATALOG_URL),fetchJson(IPA92_V23_CATALOG_URL),fetchJson(IPA92_V24_CATALOG_URL),fetchJson(IPA92_V25_CATALOG_URL)','provider fetch list');
p=one(p,']).then(([base,legacy,v7,v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21,v22,v23,v24])=>{',']).then(([base,legacy,v7,v8,v9,v10,v11,v12,v13,v14,v15,v16,v17,v18,v19,v20,v21,v22,v23,v24,v25])=>{','provider destructure');
p=one(p,"['v24',v24,IPA92_V24_CATALOG_VERSION,IPA92_V24_CONTENT_VERSION,IPA92_V24_TOTAL,'ipa92-original-v24']","['v24',v24,IPA92_V24_CATALOG_VERSION,IPA92_V24_CONTENT_VERSION,IPA92_V24_TOTAL,'ipa92-original-v24'],\n        ['v25',v25,IPA92_V25_CATALOG_VERSION,IPA92_V25_CONTENT_VERSION,IPA92_V25_TOTAL,'ipa92-original-v25']",'provider entries');
p=one(p,'...v22.items,...v23.items,...v24.items];','...v22.items,...v23.items,...v24.items,...v25.items];','provider items');
p=one(p,"version:`${BASE_CATALOG_VERSION}+ipa92-catalog-v1-v24`,","version:`${BASE_CATALOG_VERSION}+ipa92-catalog-v1-v25`,",'provider merged version');
p=one(p,"extensionContentVersion:'ipa92-questions-v1-v24',","extensionContentVersion:'ipa92-questions-v1-v25',",'provider extension version');
p=one(p,'IPA92_V22_CONTENT_VERSION,IPA92_V23_CONTENT_VERSION,IPA92_V24_CONTENT_VERSION]),','IPA92_V22_CONTENT_VERSION,IPA92_V23_CONTENT_VERSION,IPA92_V24_CONTENT_VERSION,IPA92_V25_CONTENT_VERSION]),','provider extension versions');
p=one(p,"version:'v376-provider-21-ipa92-v1-v24'","version:'v376-provider-22-ipa92-v1-v25'",'provider release version');
write('assets/protected-content-provider-v376-v25.js',p);

// Public config: install safe v25 metadata and switch latest provider.
let c=read('cloud/public-config-v342.js');
const v25Meta=`  const IPA92_V25_METADATA=Object.freeze([\n    {"id":"ipa92_a_decimal_encoding_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"BCD・ゾーン10進・パック10進","coreTopicId":"core_01_02","qualityAudit":"ipa92-original-v25"},\n    {"id":"ipa92_a_bayes_distribution_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ベイズ定理と確率分布","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v25"},\n    {"id":"ipa92_a_statistical_inference_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"統計的推定と最尤法","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v25"},\n    {"id":"ipa92_a_compiler_phases_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"コンパイラの解析段階","coreTopicId":"core_03_04","qualityAudit":"ipa92-original-v25"},\n    {"id":"ipa92_a_language_paradigms_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"プログラミング言語のパラダイム","coreTopicId":"core_03_04","qualityAudit":"ipa92-original-v25"}\n  ].map(item=>Object.freeze(item)));\n\n`;
c=one(c,'  function installMetadata(items,label,expectedTotal){',v25Meta+'  function installMetadata(items,label,expectedTotal){','config metadata insert');
c=one(c,"  function installV24Metadata(){return installMetadata(IPA92_V24_METADATA,'v24',5)}","  function installV24Metadata(){return installMetadata(IPA92_V24_METADATA,'v24',5)}\n  function installV25Metadata(){return installMetadata(IPA92_V25_METADATA,'v25',5)}",'config installer');
c=one(c,'    const v24Install=installV24Metadata();','    const v24Install=installV24Metadata();\n    const v25Install=installV25Metadata();','config activation install');
c=one(c,'    root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA_INSTALL=v24Install;','    root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA_INSTALL=v24Install;\n    root.FEQUEST_IPA92_V25_SUBJECT_A_METADATA_INSTALL=v25Install;','config install export');
c=one(c,"const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-21-ipa92-v1-v24'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1119;","const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-22-ipa92-v1-v25'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1124;",'config provider ok');
c=one(c,'&&v23Install.ok&&v24Install.ok;','&&v23Install.ok&&v24Install.ok&&v25Install.ok;','config ok chain');
c=one(c,',v23:v23Install,v24:v24Install});',',v23:v23Install,v24:v24Install,v25:v25Install});','config result');
c=c.replaceAll('activateV24Provider','activateV25Provider').replaceAll('v376-provider-21-ipa92-v1-v24','v376-provider-22-ipa92-v1-v25').replaceAll('fequest-ipa92-v24-provider','fequest-ipa92-v25-provider').replaceAll('./assets/protected-content-provider-v376-v24.js','./assets/protected-content-provider-v376-v25.js');
c=one(c,'  root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA=IPA92_V24_METADATA;','  root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA=IPA92_V24_METADATA;\n  root.FEQUEST_IPA92_V25_SUBJECT_A_METADATA=IPA92_V25_METADATA;','config metadata export');
c=one(c,'  root.FEQUEST_IPA92_V24_PROVIDER_READY=latestProviderReady;','  root.FEQUEST_IPA92_V25_PROVIDER_READY=latestProviderReady;\n  root.FEQUEST_IPA92_V24_PROVIDER_READY=latestProviderReady;','config ready export');
write('cloud/public-config-v342.js',c);

// Service worker cache and shell.
let sw=read('sw.js');
sw=one(sw,"const CACHE_NAME = 'fe-quest-v377-23';","const CACHE_NAME = 'fe-quest-v377-24';",'sw cache');
sw=one(sw,'  "./assets/protected-content-provider-v376-v24.js",','  "./assets/protected-content-provider-v376-v24.js",\n  "./assets/protected-content-provider-v376-v25.js",','sw provider');
sw=one(sw,'  "./assets/question-catalog-ipa92-v24.json",','  "./assets/question-catalog-ipa92-v24.json",\n  "./assets/question-catalog-ipa92-v25.json",','sw catalog');
write('sw.js',sw);

// Workflow candidates are generated outside .github/workflows, then promoted by trusted connector.
let deploy=read('.github/workflows/deploy-pages.yml');
deploy=one(deploy,'          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"','          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"\n          grep -Fq \'"./assets/protected-content-provider-v376-v25.js"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v25.js"','deploy provider');
deploy=one(deploy,'          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v24.json"','          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v24.json"\n          grep -Fq \'"./assets/question-catalog-ipa92-v25.json"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v25.json"','deploy catalog');
deploy=one(deploy,"          grep -Fq \"const CACHE_NAME = 'fe-quest-v377-23';\" \"$RUNNER_TEMP/site/sw.js\"","          grep -Fq \"const CACHE_NAME = 'fe-quest-v377-24';\" \"$RUNNER_TEMP/site/sw.js\"",'deploy cache');
deploy=one(deploy,'          grep -Fq "version:\'v376-provider-21-ipa92-v1-v24\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"','          grep -Fq "version:\'v376-provider-21-ipa92-v1-v24\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"\n          grep -Fq "version:\'v376-provider-22-ipa92-v1-v25\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v25.js"','deploy provider version');
write('.github/generated-v25/deploy-pages.yml',deploy);

let pub=read('.github/workflows/validate-publication.yml');
pub=one(pub,'          node --check assets/protected-content-provider-v376-v24.js','          node --check assets/protected-content-provider-v376-v24.js\n          node --check assets/protected-content-provider-v376-v25.js','publication syntax');
pub=one(pub,"          grep -Fq \"const CACHE_NAME = 'fe-quest-v377-23';\" \"$RUNNER_TEMP/site/sw.js\"","          grep -Fq \"const CACHE_NAME = 'fe-quest-v377-24';\" \"$RUNNER_TEMP/site/sw.js\"",'publication cache');
pub=one(pub,'          grep -Fq "version:\'v376-provider-21-ipa92-v1-v24\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"','          grep -Fq "version:\'v376-provider-21-ipa92-v1-v24\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v24.js"\n          grep -Fq "version:\'v376-provider-22-ipa92-v1-v25\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v25.js"','publication provider');
write('.github/generated-v25/validate-publication.yml',pub);

console.log('PASS generated IPA 9.2 v25 public activation artifacts');
