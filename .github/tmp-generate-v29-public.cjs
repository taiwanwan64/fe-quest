const fs=require('node:fs');

function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s)}
function replaceOnce(s,from,to,label){
  const i=s.indexOf(from); if(i<0)throw new Error(`missing replacement: ${label}`);
  if(s.indexOf(from,i+from.length)>=0)throw new Error(`ambiguous replacement: ${label}`);
  return s.slice(0,i)+to+s.slice(i+from.length);
}
function mustInclude(s,needle,label){if(!s.includes(needle))throw new Error(`missing ${label}`)}

// Provider v29: extend the immutable v28 provider with one more safe catalog.
let provider=read('assets/protected-content-provider-v376-v28.js');
provider=replaceOnce(provider,
  "const IPA92_V28_CATALOG_URL=new URL('question-catalog-ipa92-v28.json',SCRIPT_URL).toString();",
  "const IPA92_V28_CATALOG_URL=new URL('question-catalog-ipa92-v28.json',SCRIPT_URL).toString();\nconst IPA92_V29_CATALOG_URL=new URL('question-catalog-ipa92-v29.json',SCRIPT_URL).toString();",'provider catalog url');
provider=replaceOnce(provider,
  "const IPA92_V28_CATALOG_VERSION='ipa92-catalog-v28';",
  "const IPA92_V28_CATALOG_VERSION='ipa92-catalog-v28';\nconst IPA92_V29_CATALOG_VERSION='ipa92-catalog-v29';",'provider catalog version');
provider=replaceOnce(provider,
  "const IPA92_V28_CONTENT_VERSION='ipa92-questions-v28';",
  "const IPA92_V28_CONTENT_VERSION='ipa92-questions-v28';\nconst IPA92_V29_CONTENT_VERSION='ipa92-questions-v29';",'provider content version');
provider=replaceOnce(provider,
  'const IPA92_V28_TOTAL=5;',
  'const IPA92_V28_TOTAL=5;\nconst IPA92_V29_TOTAL=5;','provider total');
provider=replaceOnce(provider,
  '+IPA92_V27_TOTAL+IPA92_V28_TOTAL;',
  '+IPA92_V27_TOTAL+IPA92_V28_TOTAL+IPA92_V29_TOTAL;','provider extension total');
provider=replaceOnce(provider,
  'fetchJson(IPA92_V27_CATALOG_URL),fetchJson(IPA92_V28_CATALOG_URL)',
  'fetchJson(IPA92_V27_CATALOG_URL),fetchJson(IPA92_V28_CATALOG_URL),fetchJson(IPA92_V29_CATALOG_URL)','provider fetch');
provider=replaceOnce(provider,
  'v25,v26,v27,v28])=>{',
  'v25,v26,v27,v28,v29])=>{','provider destructure');
provider=replaceOnce(provider,
  "['v28',v28,IPA92_V28_CATALOG_VERSION,IPA92_V28_CONTENT_VERSION,IPA92_V28_TOTAL,'ipa92-original-v28']",
  "['v28',v28,IPA92_V28_CATALOG_VERSION,IPA92_V28_CONTENT_VERSION,IPA92_V28_TOTAL,'ipa92-original-v28'],\n        ['v29',v29,IPA92_V29_CATALOG_VERSION,IPA92_V29_CONTENT_VERSION,IPA92_V29_TOTAL,'ipa92-original-v29']",'provider entries');
provider=replaceOnce(provider,
  '...v26.items,...v27.items,...v28.items];',
  '...v26.items,...v27.items,...v28.items,...v29.items];','provider extension items');
provider=replaceOnce(provider,'ipa92-catalog-v1-v28','ipa92-catalog-v1-v29','provider merged version');
provider=replaceOnce(provider,'ipa92-questions-v1-v28','ipa92-questions-v1-v29','provider extension version');
provider=replaceOnce(provider,
  'IPA92_V26_CONTENT_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V28_CONTENT_VERSION])',
  'IPA92_V26_CONTENT_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V28_CONTENT_VERSION,IPA92_V29_CONTENT_VERSION])','provider version list');
provider=replaceOnce(provider,
  "version:'v376-provider-25-ipa92-v1-v28'",
  "version:'v376-provider-26-ipa92-v1-v29'",'provider release');
mustInclude(provider,'IPA92_V29_CATALOG_URL','provider v29 url');
mustInclude(provider,'IPA92_V29_TOTAL=5','provider v29 total');
write('assets/protected-content-provider-v376-v29.js',provider);

// Public config v29 metadata and latest-provider activation.
let config=read('cloud/public-config-v342.js');
const metadata=`\n  const IPA92_V29_METADATA=Object.freeze([\n    {"id":"ipa92_a_dynamic_array_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"動的配列","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v29"},\n    {"id":"ipa92_a_linked_list_variants_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"双方向リストと環状リスト","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v29"},\n    {"id":"ipa92_a_frequency_filters_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ローパスフィルタとハイパスフィルタ","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"},\n    {"id":"ipa92_a_control_response_stability_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"過渡応答・定常応答・制御安定性","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"},\n    {"id":"ipa92_a_sensor_types_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ジャイロセンサ・ひずみゲージ・ホール素子","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"}\n  ].map(item=>Object.freeze(item)));\n`;
config=replaceOnce(config,'\n  function installMetadata(items,label,expectedTotal){',metadata+'\n  function installMetadata(items,label,expectedTotal){','config metadata block');
config=replaceOnce(config,
  "  function installV28Metadata(){return installMetadata(IPA92_V28_METADATA,'v28',5)}",
  "  function installV28Metadata(){return installMetadata(IPA92_V28_METADATA,'v28',5)}\n  function installV29Metadata(){return installMetadata(IPA92_V29_METADATA,'v29',5)}",'config installer');
config=replaceOnce(config,
  '    const v28Install=installV28Metadata();',
  '    const v28Install=installV28Metadata();\n    const v29Install=installV29Metadata();','config install call');
config=replaceOnce(config,
  '    root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA_INSTALL=v28Install;',
  '    root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA_INSTALL=v28Install;\n    root.FEQUEST_IPA92_V29_SUBJECT_A_METADATA_INSTALL=v29Install;','config install root');
config=config.split("v376-provider-25-ipa92-v1-v28").join("v376-provider-26-ipa92-v1-v29");
config=config.split('catalogTotal===1139').join('catalogTotal===1144');
config=replaceOnce(config,'&&v27Install.ok&&v28Install.ok;','&&v27Install.ok&&v28Install.ok&&v29Install.ok;','config activation ok');
config=replaceOnce(config,
  'v26:v26Install,v27:v27Install,v28:v28Install});',
  'v26:v26Install,v27:v27Install,v28:v28Install,v29:v29Install});','config activation result');
config=config.split('activateV28Provider').join('activateV29Provider');
config=config.split('fequest-ipa92-v28-provider').join('fequest-ipa92-v29-provider');
config=config.split('./assets/protected-content-provider-v376-v28.js').join('./assets/protected-content-provider-v376-v29.js');
config=replaceOnce(config,
  '  root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA=IPA92_V28_METADATA;',
  '  root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA=IPA92_V28_METADATA;\n  root.FEQUEST_IPA92_V29_SUBJECT_A_METADATA=IPA92_V29_METADATA;','config metadata root');
config=replaceOnce(config,
  '  root.FEQUEST_IPA92_V28_PROVIDER_READY=latestProviderReady;',
  '  root.FEQUEST_IPA92_V29_PROVIDER_READY=latestProviderReady;\n  root.FEQUEST_IPA92_V28_PROVIDER_READY=latestProviderReady;','config readiness alias');
mustInclude(config,'const IPA92_V29_METADATA=Object.freeze([','config v29 metadata');
mustInclude(config,'const latestProviderReady=activateV29Provider();','config latest provider');
write('cloud/public-config-v342.js',config);

// Service worker: add v29 immutable artifacts and roll cache identity.
let sw=read('sw.js');
sw=replaceOnce(sw,"const CACHE_NAME = 'fe-quest-v377-25';","const CACHE_NAME = 'fe-quest-v377-26';",'sw cache');
sw=replaceOnce(sw,
  '  "./assets/protected-content-provider-v376-v28.js",',
  '  "./assets/protected-content-provider-v376-v28.js",\n  "./assets/protected-content-provider-v376-v29.js",','sw provider');
sw=replaceOnce(sw,
  '  "./assets/question-catalog-ipa92-v28.json",',
  '  "./assets/question-catalog-ipa92-v28.json",\n  "./assets/question-catalog-ipa92-v29.json",','sw catalog');
write('sw.js',sw);

// v28 becomes immutable historical validation once v29 is latest.
write('.github/workflows/validate-ipa92-question-v28-public.yml',`name: Validate IPA 9.2 question v28 historical artifacts\n\non:\n  pull_request:\n    branches: [main]\n    paths:\n      - 'assets/protected-content-provider-v376-v28.js'\n      - 'assets/question-catalog-ipa92-v28.json'\n      - '.github/IPA92_V28_ACTIVATION_2026-09-15.md'\n      - '.github/workflows/validate-ipa92-question-v28-public.yml'\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  validate-v28-history:\n    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v6\n      - name: Validate immutable v28 artifacts\n        run: |\n          node --check assets/protected-content-provider-v376-v28.js\n          node -e "const c=require('./assets/question-catalog-ipa92-v28.json');if(c.version!=='ipa92-catalog-v28'||c.contentVersion!=='ipa92-questions-v28'||c.items?.length!==5)process.exit(1)"\n          grep -Fq "version:'v376-provider-25-ipa92-v1-v28'" assets/protected-content-provider-v376-v28.js\n          grep -Fq 'active protected question total after import: **1139**' .github/IPA92_V28_ACTIVATION_2026-09-15.md\n`);

// v29 public activation validation, including actual merged-provider execution.
write('.github/workflows/validate-ipa92-question-v29-public.yml',`name: Validate IPA 9.2 question v29 public activation\n\non:\n  pull_request:\n    branches: [main]\n    paths:\n      - 'assets/protected-content-provider-v376-v29.js'\n      - 'assets/question-catalog-ipa92-v29.json'\n      - 'cloud/public-config-v342.js'\n      - 'sw.js'\n      - '.github/IPA92_V29_ACTIVATION_2026-09-15.md'\n      - '.github/workflows/validate-ipa92-question-v29-public.yml'\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  validate-v29-public:\n    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v6\n      - name: Validate JavaScript syntax\n        run: |\n          node --check assets/protected-content-provider-v376-v29.js\n          node --check cloud/public-config-v342.js\n          node --check sw.js\n      - name: Validate v29 safe public contract and runtime merge\n        run: |\n          node <<'CHECK'\n          const fs=require('node:fs');\n          const vm=require('node:vm');\n          const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-ipa92-v29.json','utf8'));\n          const provider=fs.readFileSync('assets/protected-content-provider-v376-v29.js','utf8');\n          const config=fs.readFileSync('cloud/public-config-v342.js','utf8');\n          const sw=fs.readFileSync('sw.js','utf8');\n          const protectedKeys=new Set(['q','stem','options','answerIndex','answer_index','a','explanation','exp','hint','choiceExplanations','choice_explanations']);\n          const ids=['ipa92_a_dynamic_array_001','ipa92_a_linked_list_variants_001','ipa92_a_frequency_filters_001','ipa92_a_control_response_stability_001','ipa92_a_sensor_types_001'];\n          if(catalog.version!=='ipa92-catalog-v29'||catalog.contentVersion!=='ipa92-questions-v29'||catalog.items?.length!==5)throw new Error('v29 catalog contract');\n          if(catalog.counts?.subjectA!==5||catalog.counts?.catalogQuestions!==5)throw new Error('v29 catalog counts');\n          if(JSON.stringify(catalog.items.map(x=>x.id))!==JSON.stringify(ids))throw new Error('v29 catalog ids');\n          for(const item of catalog.items){if(item.sourcePool!=='subject_a'||item.qualityAudit!=='ipa92-original-v29'||typeof item.cat!=='string'||typeof item.concept!=='string'||!/^core_[0-9]{2}_[0-9]{2}$/.test(String(item.coreTopicId||'')))throw new Error('invalid v29 safe metadata');if(Object.keys(item).some(key=>protectedKeys.has(key)))throw new Error('protected field leaked');}\n          if(!provider.includes("version:'v376-provider-26-ipa92-v1-v29'")||!provider.includes('const IPA92_V29_TOTAL=5;')||!provider.includes("const IPA92_V29_CONTENT_VERSION='ipa92-questions-v29';"))throw new Error('v29 provider contract');\n          if(!config.includes('const IPA92_V29_METADATA=Object.freeze([')||!config.includes('activateV29Provider()')||!config.includes('catalogTotal===1144'))throw new Error('v29 public config contract');\n          if(!sw.includes('"./assets/protected-content-provider-v376-v29.js"')||!sw.includes('"./assets/question-catalog-ipa92-v29.json"')||!sw.includes("const CACHE_NAME = 'fe-quest-v377-26';"))throw new Error('v29 service worker contract');\n          const context={console,setTimeout,clearTimeout,URL,AbortController,document:{currentScript:{src:'https://example.test/assets/protected-content-provider-v376-v29.js'},baseURI:'https://example.test/'},sessionStorage:{getItem(){return null},setItem(){},removeItem(){}},fetch:async url=>{const name=new URL(String(url)).pathname.split('/').pop();const p='assets/'+name;return {ok:true,status:200,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))}},window:{}};\n          vm.createContext(context);vm.runInContext(provider,context,{filename:'assets/protected-content-provider-v376-v29.js'});\n          (async()=>{const merged=await context.window.FEQUEST_PROTECTED_CONTENT.loadCatalog();if(merged.items.length!==1144)throw new Error('merged catalog total');if(merged.counts?.subjectA!==950||merged.counts?.trackedSubjectA!==959||merged.counts?.catalogQuestions!==1144)throw new Error('merged counts');for(const id of ids)if(!merged.items.some(x=>x.id===id))throw new Error('missing v29 id '+id);console.log('PASS v29 public contract: 5 safe metadata items, merged production total 1144');})().catch(e=>{console.error(e);process.exitCode=1});\n          CHECK\n      - name: Validate production evidence marker\n        run: |\n          grep -Fq 'active protected question total after import: **1144**' .github/IPA92_V29_ACTIVATION_2026-09-15.md\n          grep -Fq 'a0f1536cfc928aa72411d713b36602ceb87d761c' .github/IPA92_V29_ACTIVATION_2026-09-15.md\n          grep -Fq 'c817810ac57b29803f47e8c5ce26ab7e8f8a69197a92ba8219195f11f19449b1' .github/IPA92_V29_ACTIVATION_2026-09-15.md\n          grep -Fq '34909608660' .github/IPA92_V29_ACTIVATION_2026-09-15.md\n          grep -Fq 'v376-lessons-1' .github/IPA92_V29_ACTIVATION_2026-09-15.md\n`);

// Publication workflow: include current v29 immutable artifacts and cache identity.
let publication=read('.github/workflows/validate-publication.yml');
publication=replaceOnce(publication,
  '          node --check assets/protected-content-provider-v376-v28.js',
  '          node --check assets/protected-content-provider-v376-v28.js\n          node --check assets/protected-content-provider-v376-v29.js','publication syntax');
publication=replaceOnce(publication,
  '          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"',
  '          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"\n          grep -Fq \'"./assets/protected-content-provider-v376-v29.js"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v29.js"','publication provider deploy');
publication=replaceOnce(publication,
  '          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"',
  '          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"\n          grep -Fq \'"./assets/question-catalog-ipa92-v29.json"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v29.json"','publication catalog deploy');
publication=publication.split("const CACHE_NAME = 'fe-quest-v377-25';").join("const CACHE_NAME = 'fe-quest-v377-26';");
publication=replaceOnce(publication,
  '          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"',
  '          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"\n          grep -Fq "version:\'v376-provider-26-ipa92-v1-v29\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v29.js"','publication provider release');
write('.github/workflows/validate-publication.yml',publication);

// Pages deployment workflow mirrors publication checks.
let deploy=read('.github/workflows/deploy-pages.yml');
deploy=replaceOnce(deploy,
  '          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"',
  '          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"\n          grep -Fq \'"./assets/protected-content-provider-v376-v29.js"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v29.js"','deploy provider');
deploy=replaceOnce(deploy,
  '          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"',
  '          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"\n          grep -Fq \'"./assets/question-catalog-ipa92-v29.json"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v29.json"','deploy catalog');
deploy=deploy.split("const CACHE_NAME = 'fe-quest-v377-25';").join("const CACHE_NAME = 'fe-quest-v377-26';");
deploy=replaceOnce(deploy,
  '          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"',
  '          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"\n          grep -Fq "version:\'v376-provider-26-ipa92-v1-v29\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v29.js"','deploy provider release');
write('.github/workflows/deploy-pages.yml',deploy);

console.log('PASS generated v29 public activation artifacts');
