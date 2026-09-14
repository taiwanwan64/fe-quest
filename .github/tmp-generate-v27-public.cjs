const fs=require('node:fs');
const path=require('node:path');

function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,s)}
function replace1(s,from,to,label=from){if(!s.includes(from))throw new Error(`missing replacement marker: ${label}`);return s.replace(from,to)}

const safeItems=[
  {id:'ipa92_a_linear_algebra_001',sourcePool:'subject_a',cat:'基礎理論',difficulty:'standard',concept:'行列・逆行列・固有値',coreTopicId:'core_02_07',qualityAudit:'ipa92-original-v27'},
  {id:'ipa92_a_sequences_001',sourcePool:'subject_a',cat:'基礎理論',difficulty:'standard',concept:'等差数列と等比数列',coreTopicId:'core_02_07',qualityAudit:'ipa92-original-v27'},
  {id:'ipa92_a_interpolation_001',sourcePool:'subject_a',cat:'基礎理論',difficulty:'standard',concept:'補間法',coreTopicId:'core_02_07',qualityAudit:'ipa92-original-v27'},
  {id:'ipa92_a_dynamic_programming_001',sourcePool:'subject_a',cat:'基礎理論',difficulty:'standard',concept:'動的計画法',coreTopicId:'core_02_07',qualityAudit:'ipa92-original-v27'},
  {id:'ipa92_a_hash_search_001',sourcePool:'subject_a',cat:'アルゴリズム',difficulty:'standard',concept:'ハッシュ表探索と衝突処理',coreTopicId:'core_03_03',qualityAudit:'ipa92-original-v27'},
];
write('assets/question-catalog-ipa92-v27.json',JSON.stringify({version:'ipa92-catalog-v27',contentVersion:'ipa92-questions-v27',contentVersions:['ipa92-questions-v27'],counts:{subjectA:5,catalogQuestions:5},items:safeItems},null,2)+'\n');

let provider=read('assets/protected-content-provider-v376-v26.js');
provider=replace1(provider,"const IPA92_V26_CATALOG_URL=new URL('question-catalog-ipa92-v26.json',SCRIPT_URL).toString();", "const IPA92_V26_CATALOG_URL=new URL('question-catalog-ipa92-v26.json',SCRIPT_URL).toString();\nconst IPA92_V27_CATALOG_URL=new URL('question-catalog-ipa92-v27.json',SCRIPT_URL).toString();",'provider catalog URL');
provider=replace1(provider,"const IPA92_V26_CATALOG_VERSION='ipa92-catalog-v26';", "const IPA92_V26_CATALOG_VERSION='ipa92-catalog-v26';\nconst IPA92_V27_CATALOG_VERSION='ipa92-catalog-v27';",'provider catalog version');
provider=replace1(provider,"const IPA92_V26_CONTENT_VERSION='ipa92-questions-v26';", "const IPA92_V26_CONTENT_VERSION='ipa92-questions-v26';\nconst IPA92_V27_CONTENT_VERSION='ipa92-questions-v27';",'provider content version');
provider=replace1(provider,"const IPA92_V26_TOTAL=5;", "const IPA92_V26_TOTAL=5;\nconst IPA92_V27_TOTAL=5;",'provider total');
provider=replace1(provider,'+IPA92_V25_TOTAL+IPA92_V26_TOTAL;','+IPA92_V25_TOTAL+IPA92_V26_TOTAL+IPA92_V27_TOTAL;','provider extension total');
provider=replace1(provider,'fetchJson(IPA92_V25_CATALOG_URL),fetchJson(IPA92_V26_CATALOG_URL)','fetchJson(IPA92_V25_CATALOG_URL),fetchJson(IPA92_V26_CATALOG_URL),fetchJson(IPA92_V27_CATALOG_URL)','provider Promise.all');
provider=replace1(provider,'v23,v24,v25,v26])=>{','v23,v24,v25,v26,v27])=>{','provider destructuring');
provider=replace1(provider,"        ['v26',v26,IPA92_V26_CATALOG_VERSION,IPA92_V26_CONTENT_VERSION,IPA92_V26_TOTAL,'ipa92-original-v26']", "        ['v26',v26,IPA92_V26_CATALOG_VERSION,IPA92_V26_CONTENT_VERSION,IPA92_V26_TOTAL,'ipa92-original-v26'],\n        ['v27',v27,IPA92_V27_CATALOG_VERSION,IPA92_V27_CONTENT_VERSION,IPA92_V27_TOTAL,'ipa92-original-v27']",'provider entries');
provider=replace1(provider,'...v24.items,...v25.items,...v26.items];','...v24.items,...v25.items,...v26.items,...v27.items];','provider extension items');
provider=replace1(provider,'+ipa92-catalog-v1-v26`','+ipa92-catalog-v1-v27`','provider merged catalog version');
provider=replace1(provider,"extensionContentVersion:'ipa92-questions-v1-v26'","extensionContentVersion:'ipa92-questions-v1-v27'",'provider extension content version');
provider=replace1(provider,'IPA92_V24_CONTENT_VERSION,IPA92_V25_CONTENT_VERSION,IPA92_V26_CONTENT_VERSION])','IPA92_V24_CONTENT_VERSION,IPA92_V25_CONTENT_VERSION,IPA92_V26_CONTENT_VERSION,IPA92_V27_CONTENT_VERSION])','provider content versions');
provider=replace1(provider,"version:'v376-provider-23-ipa92-v1-v26'","version:'v376-provider-24-ipa92-v1-v27'",'provider release version');
write('assets/protected-content-provider-v376-v27.js',provider);

const metadataBlock=`  const IPA92_V27_METADATA=Object.freeze([\n${safeItems.map(item=>'    '+JSON.stringify(item)).join(',\n')}\n  ].map(item=>Object.freeze(item)));\n\n`;
let config=read('cloud/public-config-v342.js');
config=replace1(config,'  function installMetadata(items,label,expectedTotal){',metadataBlock+'  function installMetadata(items,label,expectedTotal){','config metadata insertion');
config=replace1(config,"  function installV26Metadata(){return installMetadata(IPA92_V26_METADATA,'v26',5)}", "  function installV26Metadata(){return installMetadata(IPA92_V26_METADATA,'v26',5)}\n  function installV27Metadata(){return installMetadata(IPA92_V27_METADATA,'v27',5)}",'config installer');
config=replace1(config,'    const v26Install=installV26Metadata();','    const v26Install=installV26Metadata();\n    const v27Install=installV27Metadata();','config installation call');
config=replace1(config,'    root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA_INSTALL=v26Install;','    root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA_INSTALL=v26Install;\n    root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA_INSTALL=v27Install;','config install export');
config=replace1(config,"const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-23-ipa92-v1-v26'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1129;", "const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-24-ipa92-v1-v27'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1134;",'config provider contract');
config=replace1(config,'&&v25Install.ok&&v26Install.ok;','&&v25Install.ok&&v26Install.ok&&v27Install.ok;','config activation ok');
config=replace1(config,'v25:v25Install,v26:v26Install});','v25:v25Install,v26:v26Install,v27:v27Install});','config activation result');
config=replace1(config,'  function activateV26Provider(){','  function activateV27Provider(){','config activation function');
config=config.split("v376-provider-23-ipa92-v1-v26").join("v376-provider-24-ipa92-v1-v27");
config=config.split('fequest-ipa92-v26-provider').join('fequest-ipa92-v27-provider');
config=config.split('./assets/protected-content-provider-v376-v26.js').join('./assets/protected-content-provider-v376-v27.js');
config=replace1(config,'  root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA=IPA92_V26_METADATA;','  root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA=IPA92_V26_METADATA;\n  root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA=IPA92_V27_METADATA;','config metadata export');
config=replace1(config,'  const latestProviderReady=activateV26Provider();','  const latestProviderReady=activateV27Provider();','config provider activation');
config=replace1(config,'  root.FEQUEST_IPA92_V26_PROVIDER_READY=latestProviderReady;','  root.FEQUEST_IPA92_V27_PROVIDER_READY=latestProviderReady;\n  root.FEQUEST_IPA92_V26_PROVIDER_READY=latestProviderReady;','config provider ready export');
write('cloud/public-config-v342.js',config);

let sw=read('sw.js');
if(!sw.includes("const CACHE_NAME = 'fe-quest-v377-24';"))throw new Error('unexpected service worker cache identity');
sw=replace1(sw,'  "./assets/protected-content-provider-v376-v26.js",','  "./assets/protected-content-provider-v376-v26.js",\n  "./assets/protected-content-provider-v376-v27.js",','sw provider asset');
sw=replace1(sw,'  "./assets/question-catalog-ipa92-v26.json",','  "./assets/question-catalog-ipa92-v26.json",\n  "./assets/question-catalog-ipa92-v27.json",','sw catalog asset');
write('sw.js',sw);

const evidence=`# IPA Ver.9.2 v27 public activation evidence\n\nDate: 2026-09-15\n\n## Protected production verification\n\n- private source merge commit: \`bf095fe13d3e65733d14f76edccdd1dcdc60fe60\`\n- protected question content version: \`ipa92-questions-v27\`\n- v27 protected question total: **5**\n- active protected question total after import: **1134**\n- protected question payload SHA-256: \`9b7a7571f3945b26eef6151ee0b21ca001aa0ad4d8d7612964438173d54dad99\`\n- v27 protected question CI run: \`34905638998\`\n- protected lesson CI run: \`34905639101\`\n- protected production import run: \`34905862177\`\n- active protected lessons: **130**\n- stable protected lesson DB content version: \`v376-lessons-1\`\n- lesson materialization release: \`v376-lessons-7-ipa92\`\n- protected lesson payload SHA-256: \`d7be6fae7b94cad9bdbe521b98927afd16056f265f8f53f49f3f4f1d7898c8ca\`\n- protected lesson source commit: \`bf095fe13d3e65733d14f76edccdd1dcdc60fe60\`\n\n## Public release boundary\n\nThe public repository contains only safe catalog metadata and the protected-content provider routing needed to request authorized content. Protected stems, choices, answers, explanations, hints, and protected lesson bodies remain outside the public repository.\n\nThe five safe metadata concepts in this activation cover linear algebra / inverse matrices / eigenvalues, arithmetic and geometric sequences, interpolation, dynamic programming, and hash-table search / collision handling.\n\nThe production provider contract for this activation is \`v376-provider-24-ipa92-v1-v27\` with a merged public-safe catalog total of **1134**.\n`;
write('.github/IPA92_V27_ACTIVATION_2026-09-15.md',evidence);

console.log('Generated IPA 9.2 v27 public artifacts.');
