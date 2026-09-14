const fs=require('node:fs');
const path=require('node:path');
function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)}
function replace1(s,from,to,label=from){if(!s.includes(from))throw new Error(`missing replacement marker: ${label}`);return s.replace(from,to)}
function replaceAllChecked(s,from,to,label=from){if(!s.includes(from))throw new Error(`missing replacement marker: ${label}`);return s.split(from).join(to)}

const safeItems=[
  {id:'ipa92_a_nlp_analysis_001',sourcePool:'subject_a',cat:'アルゴリズム',difficulty:'standard',concept:'形態素解析・係り受け解析・n-gram',coreTopicId:'core_03_03',qualityAudit:'ipa92-original-v28'},
  {id:'ipa92_a_script_languages_001',sourcePool:'subject_a',cat:'アルゴリズム',difficulty:'standard',concept:'ECMAScriptとPython',coreTopicId:'core_03_04',qualityAudit:'ipa92-original-v28'},
  {id:'ipa92_a_override_overload_001',sourcePool:'subject_a',cat:'ソフトウェア',difficulty:'standard',concept:'オーバーライドとオーバーロード',coreTopicId:'core_12_04',qualityAudit:'ipa92-original-v28'},
  {id:'ipa92_a_abstract_data_type_001',sourcePool:'subject_a',cat:'ソフトウェア',difficulty:'standard',concept:'抽象データ型（ADT）',coreTopicId:'core_12_04',qualityAudit:'ipa92-original-v28'},
  {id:'ipa92_a_xml_001',sourcePool:'subject_a',cat:'プログラミング',difficulty:'standard',concept:'XML',coreTopicId:'core_03_05',qualityAudit:'ipa92-original-v28'},
];
write('assets/question-catalog-ipa92-v28.json',JSON.stringify({version:'ipa92-catalog-v28',contentVersion:'ipa92-questions-v28',contentVersions:['ipa92-questions-v28'],counts:{subjectA:5,catalogQuestions:5},items:safeItems},null,2)+'\n');

let provider=read('assets/protected-content-provider-v376-v27.js');
provider=replace1(provider,"const IPA92_V27_CATALOG_URL=new URL('question-catalog-ipa92-v27.json',SCRIPT_URL).toString();", "const IPA92_V27_CATALOG_URL=new URL('question-catalog-ipa92-v27.json',SCRIPT_URL).toString();\nconst IPA92_V28_CATALOG_URL=new URL('question-catalog-ipa92-v28.json',SCRIPT_URL).toString();");
provider=replace1(provider,"const IPA92_V27_CATALOG_VERSION='ipa92-catalog-v27';", "const IPA92_V27_CATALOG_VERSION='ipa92-catalog-v27';\nconst IPA92_V28_CATALOG_VERSION='ipa92-catalog-v28';");
provider=replace1(provider,"const IPA92_V27_CONTENT_VERSION='ipa92-questions-v27';", "const IPA92_V27_CONTENT_VERSION='ipa92-questions-v27';\nconst IPA92_V28_CONTENT_VERSION='ipa92-questions-v28';");
provider=replace1(provider,"const IPA92_V27_TOTAL=5;", "const IPA92_V27_TOTAL=5;\nconst IPA92_V28_TOTAL=5;");
provider=replace1(provider,'+IPA92_V26_TOTAL+IPA92_V27_TOTAL;','+IPA92_V26_TOTAL+IPA92_V27_TOTAL+IPA92_V28_TOTAL;','provider extension total');
provider=replace1(provider,'fetchJson(IPA92_V26_CATALOG_URL),fetchJson(IPA92_V27_CATALOG_URL)','fetchJson(IPA92_V26_CATALOG_URL),fetchJson(IPA92_V27_CATALOG_URL),fetchJson(IPA92_V28_CATALOG_URL)','provider Promise.all');
provider=replace1(provider,'v26,v27])=>{','v26,v27,v28])=>{','provider destructuring');
provider=replace1(provider,"        ['v27',v27,IPA92_V27_CATALOG_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V27_TOTAL,'ipa92-original-v27']", "        ['v27',v27,IPA92_V27_CATALOG_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V27_TOTAL,'ipa92-original-v27'],\n        ['v28',v28,IPA92_V28_CATALOG_VERSION,IPA92_V28_CONTENT_VERSION,IPA92_V28_TOTAL,'ipa92-original-v28']");
provider=replace1(provider,'...v26.items,...v27.items];','...v26.items,...v27.items,...v28.items];','provider extension items');
provider=replace1(provider,'+ipa92-catalog-v1-v27`','+ipa92-catalog-v1-v28`','provider merged catalog version');
provider=replace1(provider,"extensionContentVersion:'ipa92-questions-v1-v27'","extensionContentVersion:'ipa92-questions-v1-v28'");
provider=replace1(provider,'IPA92_V26_CONTENT_VERSION,IPA92_V27_CONTENT_VERSION])','IPA92_V26_CONTENT_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V28_CONTENT_VERSION])','provider content versions');
provider=replace1(provider,"version:'v376-provider-24-ipa92-v1-v27'","version:'v376-provider-25-ipa92-v1-v28'");
write('assets/protected-content-provider-v376-v28.js',provider);

const metadataBlock=`  const IPA92_V28_METADATA=Object.freeze([\n${safeItems.map(item=>'    '+JSON.stringify(item)).join(',\n')}\n  ].map(item=>Object.freeze(item)));\n\n`;
let config=read('cloud/public-config-v342.js');
config=replace1(config,'  function installMetadata(items,label,expectedTotal){',metadataBlock+'  function installMetadata(items,label,expectedTotal){','config metadata insertion');
config=replace1(config,"  function installV27Metadata(){return installMetadata(IPA92_V27_METADATA,'v27',5)}", "  function installV27Metadata(){return installMetadata(IPA92_V27_METADATA,'v27',5)}\n  function installV28Metadata(){return installMetadata(IPA92_V28_METADATA,'v28',5)}");
config=replace1(config,'    const v27Install=installV27Metadata();','    const v27Install=installV27Metadata();\n    const v28Install=installV28Metadata();');
config=replace1(config,'    root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA_INSTALL=v27Install;','    root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA_INSTALL=v27Install;\n    root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA_INSTALL=v28Install;');
config=replaceAllChecked(config,"v376-provider-24-ipa92-v1-v27","v376-provider-25-ipa92-v1-v28",'config provider version');
config=replace1(config,'&&v26Install.ok&&v27Install.ok;','&&v26Install.ok&&v27Install.ok&&v28Install.ok;','config activation ok');
config=replace1(config,'v26:v26Install,v27:v27Install});','v26:v26Install,v27:v27Install,v28:v28Install});','config activation result');
config=replaceAllChecked(config,'activateV27Provider','activateV28Provider','config activation function');
config=replaceAllChecked(config,'fequest-ipa92-v27-provider','fequest-ipa92-v28-provider','config script id');
config=replaceAllChecked(config,"./assets/protected-content-provider-v376-v27.js","./assets/protected-content-provider-v376-v28.js",'config provider src');
config=replace1(config,'  root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA=IPA92_V27_METADATA;','  root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA=IPA92_V27_METADATA;\n  root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA=IPA92_V28_METADATA;');
config=replace1(config,'  root.FEQUEST_IPA92_V27_PROVIDER_READY=latestProviderReady;','  root.FEQUEST_IPA92_V28_PROVIDER_READY=latestProviderReady;\n  root.FEQUEST_IPA92_V27_PROVIDER_READY=latestProviderReady;');
config=replaceAllChecked(config,'catalogTotal===1134','catalogTotal===1139','config catalog total');
write('cloud/public-config-v342.js',config);

let sw=read('sw.js');
sw=replace1(sw,"const CACHE_NAME = 'fe-quest-v377-24';","const CACHE_NAME = 'fe-quest-v377-25';");
sw=replace1(sw,'  "./assets/protected-content-provider-v376-v27.js",','  "./assets/protected-content-provider-v376-v27.js",\n  "./assets/protected-content-provider-v376-v28.js",');
sw=replace1(sw,'  "./assets/question-catalog-ipa92-v27.json",','  "./assets/question-catalog-ipa92-v27.json",\n  "./assets/question-catalog-ipa92-v28.json",');
write('sw.js',sw);

let deploy=read('.github/workflows/deploy-pages.yml');
deploy=replace1(deploy,'          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"','          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"\n          grep -Fq \'"./assets/protected-content-provider-v376-v28.js"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"');
deploy=replace1(deploy,'          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v27.json"','          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v27.json"\n          grep -Fq \'"./assets/question-catalog-ipa92-v28.json"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"');
deploy=replaceAllChecked(deploy,"const CACHE_NAME = 'fe-quest-v377-24';","const CACHE_NAME = 'fe-quest-v377-25';",'deploy cache');
deploy=replace1(deploy,'          grep -Fq "version:\'v376-provider-24-ipa92-v1-v27\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"','          grep -Fq "version:\'v376-provider-24-ipa92-v1-v27\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"\n          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"');
write('.github/generated-v28/deploy-pages.yml',deploy);

let publication=read('.github/workflows/validate-publication.yml');
publication=replace1(publication,'          node --check assets/protected-content-provider-v376-v27.js','          node --check assets/protected-content-provider-v376-v27.js\n          node --check assets/protected-content-provider-v376-v28.js');
publication=replaceAllChecked(publication,'          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"','          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"\n          grep -Fq \'"./assets/protected-content-provider-v376-v28.js"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"','publication v28 provider check');
publication=replaceAllChecked(publication,'          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v27.json"','          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v27.json"\n          grep -Fq \'"./assets/question-catalog-ipa92-v28.json"\' "$RUNNER_TEMP/site/sw.js"\n          test -f "$RUNNER_TEMP/site/assets/question-catalog-ipa92-v28.json"','publication v28 catalog check');
publication=replaceAllChecked(publication,"const CACHE_NAME = 'fe-quest-v377-24';","const CACHE_NAME = 'fe-quest-v377-25';",'publication cache');
publication=replaceAllChecked(publication,'          grep -Fq "version:\'v376-provider-24-ipa92-v1-v27\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"','          grep -Fq "version:\'v376-provider-24-ipa92-v1-v27\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v27.js"\n          grep -Fq "version:\'v376-provider-25-ipa92-v1-v28\'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v28.js"','publication provider version');
write('.github/generated-v28/validate-publication.yml',publication);

const historical=`name: Validate IPA 9.2 question v27 historical artifacts\n\non:\n  pull_request:\n    branches: [main]\n    paths:\n      - 'assets/protected-content-provider-v376-v27.js'\n      - 'assets/question-catalog-ipa92-v27.json'\n      - '.github/IPA92_V27_ACTIVATION_2026-09-15.md'\n      - '.github/workflows/validate-ipa92-question-v27-public.yml'\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  validate-v27-history:\n    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v6\n      - name: Validate immutable v27 artifacts\n        run: |\n          node --check assets/protected-content-provider-v376-v27.js\n          node -e \"const c=require('./assets/question-catalog-ipa92-v27.json');if(c.version!=='ipa92-catalog-v27'||c.contentVersion!=='ipa92-questions-v27'||c.items?.length!==5)process.exit(1)\"\n          grep -Fq \"version:'v376-provider-24-ipa92-v1-v27'\" assets/protected-content-provider-v376-v27.js\n          grep -Fq 'active protected question total after import: **1134**' .github/IPA92_V27_ACTIVATION_2026-09-15.md\n`;
write('.github/generated-v28/validate-ipa92-question-v27-public.yml',historical);

const ids=safeItems.map(x=>x.id);
const v28validator=`name: Validate IPA 9.2 question v28 public activation\n\non:\n  pull_request:\n    branches: [main]\n    paths:\n      - 'assets/protected-content-provider-v376-v28.js'\n      - 'assets/question-catalog-ipa92-v28.json'\n      - 'cloud/public-config-v342.js'\n      - 'sw.js'\n      - '.github/IPA92_V28_ACTIVATION_2026-09-15.md'\n      - '.github/workflows/validate-ipa92-question-v28-public.yml'\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  validate-v28-public:\n    runs-on: ubuntu-24.04\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v6\n      - name: Validate JavaScript syntax\n        run: |\n          node --check assets/protected-content-provider-v376-v28.js\n          node --check cloud/public-config-v342.js\n          node --check sw.js\n      - name: Validate v28 safe public contract\n        run: |\n          node <<'CHECK'\n          const fs=require('node:fs');\n          const catalog=JSON.parse(fs.readFileSync('assets/question-catalog-ipa92-v28.json','utf8'));\n          const provider=fs.readFileSync('assets/protected-content-provider-v376-v28.js','utf8');\n          const config=fs.readFileSync('cloud/public-config-v342.js','utf8');\n          const sw=fs.readFileSync('sw.js','utf8');\n          const protectedKeys=new Set(['q','stem','options','answerIndex','answer_index','a','explanation','exp','hint','choiceExplanations','choice_explanations']);\n          const ids=${JSON.stringify(ids)};\n          if(catalog.version!=='ipa92-catalog-v28'||catalog.contentVersion!=='ipa92-questions-v28'||catalog.items?.length!==5)throw new Error('v28 catalog contract');\n          if(catalog.counts?.subjectA!==5||catalog.counts?.catalogQuestions!==5)throw new Error('v28 catalog counts');\n          if(JSON.stringify(catalog.items.map(x=>x.id))!==JSON.stringify(ids))throw new Error('v28 catalog ids');\n          for(const item of catalog.items){if(item.sourcePool!=='subject_a'||item.qualityAudit!=='ipa92-original-v28'||typeof item.cat!=='string'||typeof item.concept!=='string'||!/^core_[0-9]{2}_[0-9]{2}$/.test(String(item.coreTopicId||'')))throw new Error('invalid v28 safe metadata');if(Object.keys(item).some(key=>protectedKeys.has(key)))throw new Error('protected field leaked');}\n          if(!provider.includes(\"version:'v376-provider-25-ipa92-v1-v28'\")||!provider.includes('const IPA92_V28_TOTAL=5;')||!provider.includes(\"const IPA92_V28_CONTENT_VERSION='ipa92-questions-v28';\"))throw new Error('v28 provider contract');\n          if(!config.includes('const IPA92_V28_METADATA=Object.freeze([')||!config.includes('activateV28Provider()')||!config.includes('catalogTotal===1139'))throw new Error('v28 public config contract');\n          if(!sw.includes('\"./assets/protected-content-provider-v376-v28.js\"')||!sw.includes('\"./assets/question-catalog-ipa92-v28.json\"'))throw new Error('v28 service worker assets');\n          if(!sw.includes(\"const CACHE_NAME = 'fe-quest-v377-25';\"))throw new Error('unexpected cache identity');\n          console.log('PASS v28 public contract: 5 safe metadata items, merged production total 1139');\n          CHECK\n      - name: Validate production evidence marker\n        run: |\n          grep -Fq 'active protected question total after import: **1139**' .github/IPA92_V28_ACTIVATION_2026-09-15.md\n          grep -Fq 'd909e1e1cc82967704182a768eab6363160cb259' .github/IPA92_V28_ACTIVATION_2026-09-15.md\n          grep -Fq 'f87267eb21b0e23eb33884ca9e9297f4c5ba04a3e2175cb9afd222fe829f04c8' .github/IPA92_V28_ACTIVATION_2026-09-15.md\n`;
write('.github/generated-v28/validate-ipa92-question-v28-public.yml',v28validator);
console.log('PASS generated v28 public artifacts');
