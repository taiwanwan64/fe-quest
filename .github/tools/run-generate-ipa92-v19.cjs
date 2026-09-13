const fs=require('node:fs');
const path=require('node:path');
const file='.github/tools/generate-ipa92-v19.cjs';
const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
function replaceLine(label,replacement){const idx=[];for(let i=0;i<lines.length;i++)if(lines[i].includes(`'${label}'`))idx.push(i);if(idx.length!==1)throw new Error(`expected one ${label} line, got ${idx.length}`);lines[idx[0]]=replacement;}
function stmt(target,oldText,newText,label){return `${target}=once(${target},${JSON.stringify(oldText)},${JSON.stringify(newText)},${JSON.stringify(label)});`;}
const pubProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('publication sw provider',stmt('publication',pubProvider,pubProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v19.js"' "$RUNNER_TEMP/site/sw.js"`,'publication sw provider'));
const pubCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('publication sw catalog',stmt('publication',pubCatalog,pubCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v19.json"' "$RUNNER_TEMP/site/sw.js"`,'publication sw catalog'));
const pubMarker=`          grep -Fq "version:'v376-provider-15-ipa92-v1-v18'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v18.js"`;
replaceLine('publication provider marker',stmt('publication',pubMarker,pubMarker+`\n          grep -Fq "version:'v376-provider-16-ipa92-v1-v19'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v19.js"`,'publication provider marker'));
const deployProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('deploy sw provider',stmt('deploy',deployProvider,deployProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v19.js"' "$RUNNER_TEMP/site/sw.js"`,'deploy sw provider'));
const deployCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('deploy sw catalog',stmt('deploy',deployCatalog,deployCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v19.json"' "$RUNNER_TEMP/site/sw.js"`,'deploy sw catalog'));
const deployMarker=`          grep -Fq "version:'v376-provider-15-ipa92-v1-v18'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v18.js"`;
replaceLine('deploy provider marker',stmt('deploy',deployMarker,deployMarker+`\n          grep -Fq "version:'v376-provider-16-ipa92-v1-v19'" "$RUNNER_TEMP/site/assets/protected-content-provider-v376-v19.js"`,'deploy provider marker'));
const source=lines.join('\n');const resolved=path.resolve(file);const execute=new Function('require','process','console','__dirname','__filename',source);execute(require,process,console,path.dirname(resolved),resolved);
